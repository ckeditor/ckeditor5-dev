/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';
import fs from 'fs';
import PO from 'pofile';
import { glob } from 'glob';
import cleanTranslationFileContent from '../../lib/utils/cleantranslationfilecontent.js';
import moveTranslationsBetweenPackages from '../../lib/utils/movetranslationsbetweenpackages.js';

vi.mock( 'fs' );
vi.mock( 'pofile' );
vi.mock( 'glob' );
vi.mock( '../../lib/utils/cleantranslationfilecontent.js' );

describe( 'moveTranslationsBetweenPackages()', () => {
	let defaultOptions, packageTranslationsFoo, packageTranslationsBar, packageContextFoo, packageContextBar;

	beforeEach( () => {
		packageTranslationsFoo = [
			[ 'id1', 'Context for message id1 from "ckeditor5-foo".' ]
		];

		packageTranslationsBar = [
			[ 'id2', 'Context for message id2 from "ckeditor5-bar".' ]
		];

		packageContextFoo = {
			packagePath: '/absolute/path/to/packages/ckeditor5-foo',
			contextFilePath: '/absolute/path/to/packages/ckeditor5-foo/lang/contexts.json',
			contextContent: Object.fromEntries( packageTranslationsFoo )
		};

		packageContextBar = {
			packagePath: '/absolute/path/to/packages/ckeditor5-bar',
			contextFilePath: '/absolute/path/to/packages/ckeditor5-bar/lang/contexts.json',
			contextContent: Object.fromEntries( packageTranslationsBar )
		};

		defaultOptions = {
			packageContexts: [ packageContextFoo, packageContextBar ],
			config: [
				{
					source: '/absolute/path/to/packages/ckeditor5-foo',
					destination: '/absolute/path/to/packages/ckeditor5-bar',
					messageId: 'id1'
				}
			]
		};

		vi.mocked( fs.existsSync ).mockReturnValue( true );

		vi.mocked( fs.readFileSync ).mockImplementation( path => {
			if ( path.startsWith( '/absolute/path/to/packages/ckeditor5-foo/lang/translations/' ) ) {
				return JSON.stringify( {
					items: packageTranslationsFoo.map( ( [ msgid, msgctxt ] ) => ( { msgid, msgctxt } ) )
				} );
			}

			if ( path.startsWith( '/absolute/path/to/packages/ckeditor5-bar/lang/translations/' ) ) {
				return JSON.stringify( {
					items: packageTranslationsBar.map( ( [ msgid, msgctxt ] ) => ( { msgid, msgctxt } ) )
				} );
			}

			return JSON.stringify( {} );
		} );

		vi.mocked( PO.parse ).mockImplementation( data => JSON.parse( data ) );

		vi.mocked( glob.sync ).mockImplementation( pattern => [
			pattern.replace( '*', 'en' ),
			pattern.replace( '*', 'pl' )
		] );

		vi.mocked( cleanTranslationFileContent ).mockReturnValue( {
			toString: () => 'Clean PO file content.'
		} );
	} );

	it( 'should be a function', () => {
		expect( moveTranslationsBetweenPackages ).toBeInstanceOf( Function );
	} );

	it( 'should not move translations between packages if source and destination are the same', () => {
		defaultOptions.config = [ {
			source: '/absolute/path/to/packages/ckeditor5-foo',
			destination: '/absolute/path/to/packages/ckeditor5-foo',
			messageId: 'id1'
		} ];

		moveTranslationsBetweenPackages( defaultOptions );

		expect( packageContextFoo ).toEqual( {
			packagePath: '/absolute/path/to/packages/ckeditor5-foo',
			contextFilePath: '/absolute/path/to/packages/ckeditor5-foo/lang/contexts.json',
			contextContent: {
				id1: 'Context for message id1 from "ckeditor5-foo".'
			}
		} );

		expect( packageContextBar ).toEqual( {
			packagePath: '/absolute/path/to/packages/ckeditor5-bar',
			contextFilePath: '/absolute/path/to/packages/ckeditor5-bar/lang/contexts.json',
			contextContent: {
				id2: 'Context for message id2 from "ckeditor5-bar".'
			}
		} );

		expect( fs.writeFileSync ).not.toHaveBeenCalledTimes( 2 );
	} );

	it( 'should move translation context between packages', () => {
		moveTranslationsBetweenPackages( defaultOptions );

		expect( packageContextFoo ).toEqual( {
			packagePath: '/absolute/path/to/packages/ckeditor5-foo',
			contextFilePath: '/absolute/path/to/packages/ckeditor5-foo/lang/contexts.json',
			contextContent: {}
		} );

		expect( packageContextBar ).toEqual( {
			packagePath: '/absolute/path/to/packages/ckeditor5-bar',
			contextFilePath: '/absolute/path/to/packages/ckeditor5-bar/lang/contexts.json',
			contextContent: {
				id1: 'Context for message id1 from "ckeditor5-foo".',
				id2: 'Context for message id2 from "ckeditor5-bar".'
			}
		} );
	} );

	it( 'should overwrite existing translation context in destination package', () => {
		packageContextBar.contextContent.id1 = 'Context for message id1 from "ckeditor5-bar".';

		moveTranslationsBetweenPackages( defaultOptions );

		expect( packageContextFoo ).toEqual( {
			packagePath: '/absolute/path/to/packages/ckeditor5-foo',
			contextFilePath: '/absolute/path/to/packages/ckeditor5-foo/lang/contexts.json',
			contextContent: {}
		} );

		expect( packageContextBar ).toEqual( {
			packagePath: '/absolute/path/to/packages/ckeditor5-bar',
			contextFilePath: '/absolute/path/to/packages/ckeditor5-bar/lang/contexts.json',
			contextContent: {
				id1: 'Context for message id1 from "ckeditor5-foo".',
				id2: 'Context for message id2 from "ckeditor5-bar".'
			}
		} );
	} );

	it( 'should save translation contexts on filesystem', () => {
		moveTranslationsBetweenPackages( defaultOptions );

		expect( fs.writeFileSync ).toHaveBeenCalledTimes( 6 );
		expect( fs.writeFileSync ).toHaveBeenCalledWith(
			'/absolute/path/to/packages/ckeditor5-foo/lang/contexts.json',
			'{}',
			'utf-8'
		);

		expect( fs.writeFileSync ).toHaveBeenNthCalledWith(
			6,
			'/absolute/path/to/packages/ckeditor5-bar/lang/contexts.json',
			JSON.stringify( {
				id2: 'Context for message id2 from "ckeditor5-bar".',
				id1: 'Context for message id1 from "ckeditor5-foo".'
			}, null, '\t' ),
			'utf-8'
		);
	} );

	it( 'should search for source translation files', () => {
		moveTranslationsBetweenPackages( defaultOptions );

		expect( glob.sync ).toHaveBeenCalledTimes( 1 );
		expect( glob.sync ).toHaveBeenCalledWith( '/absolute/path/to/packages/ckeditor5-foo/lang/translations/*.po' );
	} );

	it( 'should parse each translation file', () => {
		moveTranslationsBetweenPackages( defaultOptions );

		expect( fs.readFileSync ).toHaveBeenCalledTimes( 4 );
		expect( fs.readFileSync ).toHaveBeenCalledWith( '/absolute/path/to/packages/ckeditor5-foo/lang/translations/en.po', 'utf-8' );
		expect( fs.readFileSync ).toHaveBeenCalledWith( '/absolute/path/to/packages/ckeditor5-foo/lang/translations/pl.po', 'utf-8' );
		expect( fs.readFileSync ).toHaveBeenCalledWith( '/absolute/path/to/packages/ckeditor5-bar/lang/translations/en.po', 'utf-8' );
		expect( fs.readFileSync ).toHaveBeenCalledWith( '/absolute/path/to/packages/ckeditor5-bar/lang/translations/pl.po', 'utf-8' );

		expect( PO.parse ).toHaveBeenCalledTimes( 4 );
		expect( PO.parse ).toHaveBeenNthCalledWith(
			1,
			'{"items":[{"msgid":"id1","msgctxt":"Context for message id1 from \\"ckeditor5-foo\\"."}]}'
		);
		expect( PO.parse ).toHaveBeenNthCalledWith(
			2,
			'{"items":[{"msgid":"id2","msgctxt":"Context for message id2 from \\"ckeditor5-bar\\"."}]}'
		);
		expect( PO.parse ).toHaveBeenNthCalledWith(
			3,
			'{"items":[{"msgid":"id1","msgctxt":"Context for message id1 from \\"ckeditor5-foo\\"."}]}'
		);
		expect( PO.parse ).toHaveBeenNthCalledWith(
			4,
			'{"items":[{"msgid":"id2","msgctxt":"Context for message id2 from \\"ckeditor5-bar\\"."}]}'
		);
	} );

	it( 'should move translations between packages for each language', () => {
		moveTranslationsBetweenPackages( defaultOptions );

		const [
			sourceTranslationsFooEn,
			sourceTranslationsBarEn,
			sourceTranslationsFooPl,
			sourceTranslationsBarPl
		] = PO.parse.mock.results.map( entry => entry.value );

		expect( sourceTranslationsFooEn.items ).toEqual( [] );
		expect( sourceTranslationsBarEn.items ).toEqual( [
			{ msgid: 'id2', msgctxt: 'Context for message id2 from "ckeditor5-bar".' },
			{ msgid: 'id1', msgctxt: 'Context for message id1 from "ckeditor5-foo".' }
		] );

		expect( sourceTranslationsFooPl.items ).toEqual( [] );
		expect( sourceTranslationsBarPl.items ).toEqual( [
			{ msgid: 'id2', msgctxt: 'Context for message id2 from "ckeditor5-bar".' },
			{ msgid: 'id1', msgctxt: 'Context for message id1 from "ckeditor5-foo".' }
		] );
	} );

	it( 'should overwrite existing translations in destination package', () => {
		packageTranslationsBar.push(
			[ 'id1', 'Context for message id1 from "ckeditor5-bar".' ]
		);

		moveTranslationsBetweenPackages( defaultOptions );

		const [
			sourceTranslationsFooEn,
			sourceTranslationsBarEn,
			sourceTranslationsFooPl,
			sourceTranslationsBarPl
		] = PO.parse.mock.results.map( entry => entry.value );

		expect( sourceTranslationsFooEn.items ).toEqual( [] );
		expect( sourceTranslationsBarEn.items ).toEqual( [
			{ msgid: 'id2', msgctxt: 'Context for message id2 from "ckeditor5-bar".' },
			{ msgid: 'id1', msgctxt: 'Context for message id1 from "ckeditor5-foo".' }
		] );

		expect( sourceTranslationsFooPl.items ).toEqual( [] );
		expect( sourceTranslationsBarPl.items ).toEqual( [
			{ msgid: 'id2', msgctxt: 'Context for message id2 from "ckeditor5-bar".' },
			{ msgid: 'id1', msgctxt: 'Context for message id1 from "ckeditor5-foo".' }
		] );
	} );

	it( 'should use the source translation file as a base if the destination file does not exist', () => {
		vi.mocked( fs.existsSync ).mockImplementation( path => {
			return path !== '/absolute/path/to/packages/ckeditor5-bar/lang/translations/pl.po';
		} );

		moveTranslationsBetweenPackages( defaultOptions );

		expect( PO.parse ).toHaveBeenCalledTimes( 4 );
		expect( PO.parse ).toHaveBeenNthCalledWith(
			1,
			'{"items":[{"msgid":"id1","msgctxt":"Context for message id1 from \\"ckeditor5-foo\\"."}]}'
		);
		expect( PO.parse ).toHaveBeenNthCalledWith(
			2,
			'{"items":[{"msgid":"id2","msgctxt":"Context for message id2 from \\"ckeditor5-bar\\"."}]}'
		);
		expect( PO.parse ).toHaveBeenNthCalledWith(
			3,
			'{"items":[{"msgid":"id1","msgctxt":"Context for message id1 from \\"ckeditor5-foo\\"."}]}'
		);
		expect( PO.parse ).toHaveBeenNthCalledWith(
			4,
			'{"items":[{"msgid":"id1","msgctxt":"Context for message id1 from \\"ckeditor5-foo\\"."}]}'
		);

		const [
			sourceTranslationsFooEn,
			sourceTranslationsBarEn,
			sourceTranslationsFooPl,
			sourceTranslationsBarPl
		] = PO.parse.mock.results.map( entry => entry.value );

		expect( sourceTranslationsFooEn.items ).toEqual( [] );
		expect( sourceTranslationsBarEn.items ).toEqual( [
			{ msgid: 'id2', msgctxt: 'Context for message id2 from "ckeditor5-bar".' },
			{ msgid: 'id1', msgctxt: 'Context for message id1 from "ckeditor5-foo".' }
		] );

		expect( sourceTranslationsFooPl.items ).toEqual( [] );
		expect( sourceTranslationsBarPl.items ).toEqual( [
			{ msgid: 'id1', msgctxt: 'Context for message id1 from "ckeditor5-foo".' }
		] );
	} );

	it( 'should save updated translation files on filesystem after cleaning the content', () => {
		moveTranslationsBetweenPackages( defaultOptions );

		expect( cleanTranslationFileContent ).toHaveBeenCalledTimes( 4 );

		expect( fs.writeFileSync ).toHaveBeenCalledTimes( 6 );
		expect( fs.writeFileSync ).toHaveBeenCalledWith(
			'/absolute/path/to/packages/ckeditor5-foo/lang/translations/en.po',
			'Clean PO file content.',
			'utf-8'
		);
		expect( fs.writeFileSync ).toHaveBeenCalledWith(
			'/absolute/path/to/packages/ckeditor5-foo/lang/translations/pl.po',
			'Clean PO file content.',
			'utf-8'
		);
		expect( fs.writeFileSync ).toHaveBeenCalledWith(
			'/absolute/path/to/packages/ckeditor5-bar/lang/translations/en.po',
			'Clean PO file content.',
			'utf-8'
		);
		expect( fs.writeFileSync ).toHaveBeenCalledWith(
			'/absolute/path/to/packages/ckeditor5-bar/lang/translations/pl.po',
			'Clean PO file content.',
			'utf-8'
		);
	} );
} );
