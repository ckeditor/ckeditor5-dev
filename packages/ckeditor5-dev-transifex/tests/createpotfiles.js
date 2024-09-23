/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { describe, expect, it, vi, beforeEach } from 'vitest';
import createPotFiles from '../lib/createpotfiles.js';

import { findMessages } from '@ckeditor/ckeditor5-dev-translations';
import { verifyProperties } from '../lib/utils.js';
import { deleteAsync } from 'del';
import fs from 'fs-extra';
import path from 'path';

vi.mock( '../lib/utils.js' );
vi.mock( '@ckeditor/ckeditor5-dev-translations' );
vi.mock( 'del' );
vi.mock( 'fs-extra' );
vi.mock( 'path' );

describe( 'dev-transifex/createPotFiles()', () => {
	let loggerMocks;

	beforeEach( () => {
		loggerMocks = {
			info: vi.fn(),
			warning: vi.fn(),
			error: vi.fn()
		};

		vi.mocked( verifyProperties ).mockImplementation( vi.fn() );
		vi.mocked( path.join ).mockImplementation( ( ...args ) => args.join( '/' ) );
	} );

	it( 'should not create any POT file if no package is passed', () => {
		createPotFiles( {
			sourceFiles: [],
			packagePaths: [],
			corePackagePath: 'packages/ckeditor5-core',
			translationsDirectory: '/cwd/build/.transifex',
			logger: loggerMocks
		} );

		expect( vi.mocked( fs.outputFileSync ) ).toHaveBeenCalledTimes( 0 );
	} );

	it( 'should delete the build directory before creating POT files', () => {
		createPotFiles( {
			sourceFiles: [ 'packages/ckeditor5-foo/src/foo.js' ],
			packagePaths: [ 'packages/ckeditor5-foo' ],
			corePackagePath: 'packages/ckeditor5-core',
			translationsDirectory: '/cwd/build/.transifex',
			logger: loggerMocks
		} );

		expect( vi.mocked( deleteAsync.sync ) ).toHaveBeenCalledTimes( 1 );
		expect( vi.mocked( deleteAsync.sync ) ).toHaveBeenCalledWith( '/cwd/build/.transifex' );
	} );

	it( 'should create a POT file entry for one message with a corresponding context', () => {
		vi.mocked( fs.existsSync ).mockReturnValueOnce( true );
		vi.mocked( fs.existsSync ).mockReturnValueOnce( false );

		vi.mocked( fs.readFileSync ).mockReturnValueOnce( JSON.stringify( { 'foo_id': 'foo_context' } ) );
		vi.mocked( fs.readFileSync ).mockReturnValueOnce( 'packages/ckeditor5-foo/src/foo.js_content' );

		vi.mocked( findMessages ).mockImplementationOnce( ( fileContent, filePath, onFoundMessage ) => {
			const messages = [
				{ string: 'foo', id: 'foo_id' }
			];

			messages.forEach( message => onFoundMessage( message ) );
		} );

		createPotFiles( {
			sourceFiles: [ 'packages/ckeditor5-foo/src/foo.js' ],
			packagePaths: [ 'packages/ckeditor5-foo' ],
			corePackagePath: 'packages/ckeditor5-core',
			translationsDirectory: '/cwd/build/.transifex',
			logger: loggerMocks
		} );

		expect( vi.mocked( fs.existsSync ) ).toHaveBeenCalledTimes( 2 );
		expect( vi.mocked( fs.existsSync ) ).toHaveBeenNthCalledWith(
			1, 'packages/ckeditor5-foo/lang/contexts.json'
		);
		expect( vi.mocked( fs.existsSync ) ).toHaveBeenNthCalledWith(
			2, 'packages/ckeditor5-core/lang/contexts.json'
		);

		expect( vi.mocked( fs.readFileSync ) ).toHaveBeenCalledTimes( 2 );
		expect( vi.mocked( fs.readFileSync ) ).toHaveBeenNthCalledWith(
			1, 'packages/ckeditor5-foo/lang/contexts.json', 'utf-8'
		);
		expect( vi.mocked( fs.readFileSync ) ).toHaveBeenNthCalledWith(
			2, 'packages/ckeditor5-foo/src/foo.js', 'utf-8'
		);

		expect( vi.mocked( findMessages ) ).toHaveBeenCalledTimes( 1 );
		expect( vi.mocked( findMessages ) ).toHaveBeenCalledWith(
			'packages/ckeditor5-foo/src/foo.js_content',
			'packages/ckeditor5-foo/src/foo.js',
			expect.any( Function ),
			expect.any( Function )
		);

		expect( vi.mocked( fs.outputFileSync ) ).toHaveBeenCalledTimes( 1 );
		expect( vi.mocked( fs.outputFileSync ) ).toHaveBeenCalledWith(
			'/cwd/build/.transifex/ckeditor5-foo/en.pot',
			[
				`# Copyright (c) 2003-${ new Date().getFullYear() }, CKSource Holding sp. z o.o. All rights reserved.`,
				'',
				'msgctxt "foo_context"',
				'msgid "foo_id"',
				'msgstr "foo"',
				''
			].join( '\n' )
		);
	} );

	it( 'should warn if the message context is missing', () => {
		vi.mocked( fs.existsSync ).mockReturnValueOnce( false );
		vi.mocked( fs.existsSync ).mockReturnValueOnce( false );

		vi.mocked( fs.readFileSync ).mockReturnValueOnce( 'packages/ckeditor5-foo/src/foo.js_content' );

		vi.mocked( findMessages ).mockImplementationOnce( ( fileContent, filePath, onFoundMessage ) => {
			const messages = [
				{ string: 'foo', id: 'foo_id' }
			];

			messages.forEach( message => onFoundMessage( message ) );
		} );

		createPotFiles( {
			sourceFiles: [ 'packages/ckeditor5-foo/src/foo.js' ],
			packagePaths: [ 'packages/ckeditor5-foo' ],
			corePackagePath: 'packages/ckeditor5-core',
			translationsDirectory: '/cwd/build/.transifex',
			logger: loggerMocks
		} );

		expect( vi.mocked( fs.existsSync ) ).toHaveBeenCalledTimes( 2 );
		expect( vi.mocked( fs.existsSync ) ).toHaveBeenNthCalledWith(
			1, 'packages/ckeditor5-foo/lang/contexts.json'
		);
		expect( vi.mocked( fs.existsSync ) ).toHaveBeenNthCalledWith(
			2, 'packages/ckeditor5-core/lang/contexts.json'
		);

		expect( vi.mocked( fs.readFileSync ) ).toHaveBeenCalledTimes( 1 );
		expect( vi.mocked( fs.readFileSync ) ).toHaveBeenNthCalledWith(
			1, 'packages/ckeditor5-foo/src/foo.js', 'utf-8'
		);

		expect( vi.mocked( findMessages ) ).toHaveBeenCalledTimes( 1 );
		expect( vi.mocked( findMessages ) ).toHaveBeenCalledWith(
			'packages/ckeditor5-foo/src/foo.js_content',
			'packages/ckeditor5-foo/src/foo.js',
			expect.any( Function ),
			expect.any( Function )
		);

		expect( loggerMocks.error ).toHaveBeenCalledTimes( 1 );
		expect( loggerMocks.error ).toHaveBeenCalledWith(
			'Context for the message id is missing (\'foo_id\' from packages/ckeditor5-foo/src/foo.js).'
		);

		expect( vi.mocked( fs.outputFileSync ) ).toHaveBeenCalledTimes( 0 );

		// Mark the process as failed in case of the error.
		expect( process.exitCode ).toEqual( 1 );
	} );

	it( 'should create a POT file entry for every defined package', () => {
		vi.mocked( fs.existsSync ).mockReturnValueOnce( true );
		vi.mocked( fs.existsSync ).mockReturnValueOnce( true );
		vi.mocked( fs.existsSync ).mockReturnValueOnce( false );

		vi.mocked( fs.readFileSync ).mockReturnValueOnce( JSON.stringify( { 'foo_id': 'foo_context' } ) );
		vi.mocked( fs.readFileSync ).mockReturnValueOnce( JSON.stringify( { 'bar_id': 'bar_context' } ) );
		vi.mocked( fs.readFileSync ).mockReturnValueOnce( 'packages/ckeditor5-foo/src/foo.js_content' );
		vi.mocked( fs.readFileSync ).mockReturnValueOnce( 'packages/ckeditor5-bar/src/bar.js_content' );

		vi.mocked( findMessages ).mockImplementationOnce( ( fileContent, filePath, onFoundMessage ) => {
			const messages = [
				{ string: 'foo', id: 'foo_id' }
			];

			messages.forEach( message => onFoundMessage( message ) );
		} );

		vi.mocked( findMessages ).mockImplementationOnce( ( fileContent, filePath, onFoundMessage ) => {
			const messages = [
				{ string: 'bar', id: 'bar_id' }
			];

			messages.forEach( message => onFoundMessage( message ) );
		} );

		createPotFiles( {
			sourceFiles: [ 'packages/ckeditor5-foo/src/foo.js', 'packages/ckeditor5-bar/src/bar.js' ],
			packagePaths: [ 'packages/ckeditor5-foo', 'packages/ckeditor5-bar' ],
			corePackagePath: 'packages/ckeditor5-core',
			translationsDirectory: '/cwd/build/.transifex',
			logger: loggerMocks
		} );

		expect( vi.mocked( fs.existsSync ) ).toHaveBeenCalledTimes( 3 );
		expect( vi.mocked( fs.existsSync ) ).toHaveBeenNthCalledWith(
			1, 'packages/ckeditor5-foo/lang/contexts.json'
		);
		expect( vi.mocked( fs.existsSync ) ).toHaveBeenNthCalledWith(
			2, 'packages/ckeditor5-bar/lang/contexts.json'
		);
		expect( vi.mocked( fs.existsSync ) ).toHaveBeenNthCalledWith(
			3, 'packages/ckeditor5-core/lang/contexts.json'
		);

		expect( vi.mocked( fs.readFileSync ) ).toHaveBeenCalledTimes( 4 );
		expect( vi.mocked( fs.readFileSync ) ).toHaveBeenNthCalledWith(
			1, 'packages/ckeditor5-foo/lang/contexts.json', 'utf-8'
		);
		expect( vi.mocked( fs.readFileSync ) ).toHaveBeenNthCalledWith(
			2, 'packages/ckeditor5-bar/lang/contexts.json', 'utf-8'
		);
		expect( vi.mocked( fs.readFileSync ) ).toHaveBeenNthCalledWith(
			3, 'packages/ckeditor5-foo/src/foo.js', 'utf-8'
		);
		expect( vi.mocked( fs.readFileSync ) ).toHaveBeenNthCalledWith(
			4, 'packages/ckeditor5-bar/src/bar.js', 'utf-8'
		);

		expect( vi.mocked( findMessages ) ).toHaveBeenCalledTimes( 2 );
		expect( vi.mocked( findMessages ) ).toHaveBeenNthCalledWith(
			1,
			'packages/ckeditor5-foo/src/foo.js_content',
			'packages/ckeditor5-foo/src/foo.js',
			expect.any( Function ),
			expect.any( Function )
		);
		expect( vi.mocked( findMessages ) ).toHaveBeenNthCalledWith(
			2,
			'packages/ckeditor5-bar/src/bar.js_content',
			'packages/ckeditor5-bar/src/bar.js',
			expect.any( Function ),
			expect.any( Function )
		);

		expect( vi.mocked( fs.outputFileSync ) ).toHaveBeenCalledTimes( 2 );
		expect( vi.mocked( fs.outputFileSync ) ).toHaveBeenNthCalledWith(
			1,
			'/cwd/build/.transifex/ckeditor5-foo/en.pot',
			[
				`# Copyright (c) 2003-${ new Date().getFullYear() }, CKSource Holding sp. z o.o. All rights reserved.`,
				'',
				'msgctxt "foo_context"',
				'msgid "foo_id"',
				'msgstr "foo"',
				''
			].join( '\n' )
		);
		expect( vi.mocked( fs.outputFileSync ) ).toHaveBeenNthCalledWith(
			2,
			'/cwd/build/.transifex/ckeditor5-bar/en.pot',
			[
				`# Copyright (c) 2003-${ new Date().getFullYear() }, CKSource Holding sp. z o.o. All rights reserved.`,
				'',
				'msgctxt "bar_context"',
				'msgid "bar_id"',
				'msgstr "bar"',
				''
			].join( '\n' )
		);
	} );

	it( 'should create one POT file entry from multiple files in the same package', () => {
		vi.mocked( fs.existsSync ).mockReturnValueOnce( true );
		vi.mocked( fs.existsSync ).mockReturnValueOnce( false );

		vi.mocked( fs.readFileSync ).mockReturnValueOnce( JSON.stringify( { 'foo_id': 'foo_context', 'bar_id': 'bar_context' } ) );
		vi.mocked( fs.readFileSync ).mockReturnValueOnce( 'packages/ckeditor5-foo/src/foo.js_content' );
		vi.mocked( fs.readFileSync ).mockReturnValueOnce( 'packages/ckeditor5-foo/src/bar.js_content' );

		vi.mocked( findMessages ).mockImplementationOnce( ( fileContent, filePath, onFoundMessage ) => {
			const messages = [
				{ string: 'foo', id: 'foo_id' }
			];

			messages.forEach( message => onFoundMessage( message ) );
		} );

		vi.mocked( findMessages ).mockImplementationOnce( ( fileContent, filePath, onFoundMessage ) => {
			const messages = [
				{ string: 'bar', id: 'bar_id' }
			];

			messages.forEach( message => onFoundMessage( message ) );
		} );

		createPotFiles( {
			sourceFiles: [ 'packages/ckeditor5-foo/src/foo.js', 'packages/ckeditor5-foo/src/bar.js' ],
			packagePaths: [ 'packages/ckeditor5-foo' ],
			corePackagePath: 'packages/ckeditor5-core',
			translationsDirectory: '/cwd/build/.transifex',
			logger: loggerMocks
		} );

		expect( vi.mocked( fs.existsSync ) ).toHaveBeenCalledTimes( 2 );
		expect( vi.mocked( fs.existsSync ) ).toHaveBeenNthCalledWith(
			1, 'packages/ckeditor5-foo/lang/contexts.json'
		);
		expect( vi.mocked( fs.existsSync ) ).toHaveBeenNthCalledWith(
			2, 'packages/ckeditor5-core/lang/contexts.json'
		);

		expect( vi.mocked( fs.readFileSync ) ).toHaveBeenCalledTimes( 3 );
		expect( vi.mocked( fs.readFileSync ) ).toHaveBeenNthCalledWith(
			1, 'packages/ckeditor5-foo/lang/contexts.json', 'utf-8'
		);
		expect( vi.mocked( fs.readFileSync ) ).toHaveBeenNthCalledWith(
			2, 'packages/ckeditor5-foo/src/foo.js', 'utf-8'
		);
		expect( vi.mocked( fs.readFileSync ) ).toHaveBeenNthCalledWith(
			3, 'packages/ckeditor5-foo/src/bar.js', 'utf-8'
		);

		expect( vi.mocked( findMessages ) ).toHaveBeenCalledTimes( 2 );
		expect( vi.mocked( findMessages ) ).toHaveBeenNthCalledWith(
			1,
			'packages/ckeditor5-foo/src/foo.js_content',
			'packages/ckeditor5-foo/src/foo.js',
			expect.any( Function ),
			expect.any( Function )
		);
		expect( vi.mocked( findMessages ) ).toHaveBeenNthCalledWith(
			2,
			'packages/ckeditor5-foo/src/bar.js_content',
			'packages/ckeditor5-foo/src/bar.js',
			expect.any( Function ),
			expect.any( Function )
		);

		expect( vi.mocked( fs.outputFileSync ) ).toHaveBeenCalledTimes( 1 );
		expect( vi.mocked( fs.outputFileSync ) ).toHaveBeenCalledWith(
			'/cwd/build/.transifex/ckeditor5-foo/en.pot',
			[
				`# Copyright (c) 2003-${ new Date().getFullYear() }, CKSource Holding sp. z o.o. All rights reserved.`,
				'',
				'msgctxt "foo_context"',
				'msgid "foo_id"',
				'msgstr "foo"',
				'',
				'msgctxt "bar_context"',
				'msgid "bar_id"',
				'msgstr "bar"',
				''
			].join( '\n' )
		);
	} );

	it( 'should create a POT entry filled with plural forms for message that contains has defined plural forms', () => {
		vi.mocked( fs.existsSync ).mockReturnValueOnce( true );
		vi.mocked( fs.existsSync ).mockReturnValueOnce( false );

		vi.mocked( fs.readFileSync ).mockReturnValueOnce( JSON.stringify( { 'foo_id': 'foo_context' } ) );
		vi.mocked( fs.readFileSync ).mockReturnValueOnce( 'packages/ckeditor5-foo/src/foo.js_content' );

		vi.mocked( findMessages ).mockImplementationOnce( ( fileContent, filePath, onFoundMessage ) => {
			const messages = [
				{ string: 'foo', id: 'foo_id', plural: 'foo_plural' }
			];

			messages.forEach( message => onFoundMessage( message ) );
		} );

		createPotFiles( {
			sourceFiles: [ 'packages/ckeditor5-foo/src/foo.js' ],
			packagePaths: [ 'packages/ckeditor5-foo' ],
			corePackagePath: 'packages/ckeditor5-core',
			translationsDirectory: '/cwd/build/.transifex',
			logger: loggerMocks
		} );

		expect( vi.mocked( fs.existsSync ) ).toHaveBeenCalledTimes( 2 );
		expect( vi.mocked( fs.existsSync ) ).toHaveBeenNthCalledWith(
			1, 'packages/ckeditor5-foo/lang/contexts.json'
		);
		expect( vi.mocked( fs.existsSync ) ).toHaveBeenNthCalledWith(
			2, 'packages/ckeditor5-core/lang/contexts.json'
		);

		expect( vi.mocked( fs.readFileSync ) ).toHaveBeenCalledTimes( 2 );
		expect( vi.mocked( fs.readFileSync ) ).toHaveBeenNthCalledWith(
			1, 'packages/ckeditor5-foo/lang/contexts.json', 'utf-8'
		);
		expect( vi.mocked( fs.readFileSync ) ).toHaveBeenNthCalledWith(
			2, 'packages/ckeditor5-foo/src/foo.js', 'utf-8'
		);

		expect( vi.mocked( findMessages ) ).toHaveBeenCalledTimes( 1 );
		expect( vi.mocked( findMessages ) ).toHaveBeenCalledWith(
			'packages/ckeditor5-foo/src/foo.js_content',
			'packages/ckeditor5-foo/src/foo.js',
			expect.any( Function ),
			expect.any( Function )
		);

		expect( vi.mocked( fs.outputFileSync ) ).toHaveBeenCalledTimes( 1 );
		expect( vi.mocked( fs.outputFileSync ) ).toHaveBeenCalledWith(
			'/cwd/build/.transifex/ckeditor5-foo/en.pot',
			[
				`# Copyright (c) 2003-${ new Date().getFullYear() }, CKSource Holding sp. z o.o. All rights reserved.`,
				'',
				'msgctxt "foo_context"',
				'msgid "foo_id"',
				'msgid_plural "foo_plural"',
				'msgstr[0] "foo"',
				'msgstr[1] "foo_plural"',
				''
			].join( '\n' )
		);
	} );

	it( 'should load the core context file once and use its contexts', () => {
		vi.mocked( fs.existsSync ).mockReturnValueOnce( false );
		vi.mocked( fs.existsSync ).mockReturnValueOnce( true );

		vi.mocked( fs.readFileSync ).mockReturnValueOnce( JSON.stringify( { 'foo_id': 'foo_context' } ) );
		vi.mocked( fs.readFileSync ).mockReturnValueOnce( 'packages/ckeditor5-foo/src/foo.js_content' );

		vi.mocked( findMessages ).mockImplementationOnce( ( fileContent, filePath, onFoundMessage ) => {
			const messages = [
				{ string: 'foo', id: 'foo_id' }
			];

			messages.forEach( message => onFoundMessage( message ) );
		} );

		createPotFiles( {
			sourceFiles: [ 'packages/ckeditor5-foo/src/foo.js' ],
			packagePaths: [ 'packages/ckeditor5-foo', 'packages/ckeditor5-core' ],
			corePackagePath: 'packages/ckeditor5-core',
			translationsDirectory: '/cwd/build/.transifex',
			logger: loggerMocks
		} );

		expect( vi.mocked( fs.existsSync ) ).toHaveBeenCalledTimes( 2 );
		expect( vi.mocked( fs.existsSync ) ).toHaveBeenNthCalledWith(
			1, 'packages/ckeditor5-foo/lang/contexts.json'
		);
		expect( vi.mocked( fs.existsSync ) ).toHaveBeenNthCalledWith(
			2, 'packages/ckeditor5-core/lang/contexts.json'
		);

		expect( vi.mocked( fs.readFileSync ) ).toHaveBeenCalledTimes( 2 );
		expect( vi.mocked( fs.readFileSync ) ).toHaveBeenNthCalledWith(
			1, 'packages/ckeditor5-core/lang/contexts.json', 'utf-8'
		);
		expect( vi.mocked( fs.readFileSync ) ).toHaveBeenNthCalledWith(
			2, 'packages/ckeditor5-foo/src/foo.js', 'utf-8'
		);

		expect( vi.mocked( findMessages ) ).toHaveBeenCalledTimes( 1 );
		expect( vi.mocked( findMessages ) ).toHaveBeenCalledWith(
			'packages/ckeditor5-foo/src/foo.js_content',
			'packages/ckeditor5-foo/src/foo.js',
			expect.any( Function ),
			expect.any( Function )
		);

		expect( loggerMocks.error ).toHaveBeenCalledTimes( 0 );

		expect( vi.mocked( fs.outputFileSync ) ).toHaveBeenCalledTimes( 1 );
		expect( vi.mocked( fs.outputFileSync ) ).toHaveBeenCalledWith(
			'/cwd/build/.transifex/ckeditor5-core/en.pot',
			[
				`# Copyright (c) 2003-${ new Date().getFullYear() }, CKSource Holding sp. z o.o. All rights reserved.`,
				'',
				'msgctxt "foo_context"',
				'msgid "foo_id"',
				'msgstr "foo"',
				''
			].join( '\n' )
		);
	} );

	it( 'should not create a POT file for the context file if that was not added to the list of packages', () => {
		vi.mocked( fs.existsSync ).mockReturnValueOnce( false );
		vi.mocked( fs.existsSync ).mockReturnValueOnce( true );

		vi.mocked( fs.readFileSync ).mockReturnValueOnce( JSON.stringify( { 'foo_id': 'foo_context' } ) );
		vi.mocked( fs.readFileSync ).mockReturnValueOnce( 'packages/ckeditor5-foo/src/foo.js_content' );

		vi.mocked( findMessages ).mockImplementationOnce( ( fileContent, filePath, onFoundMessage ) => {
			const messages = [
				{ string: 'foo', id: 'foo_id' }
			];

			messages.forEach( message => onFoundMessage( message ) );
		} );

		createPotFiles( {
			sourceFiles: [ 'packages/ckeditor5-foo/src/foo.js' ],
			packagePaths: [ 'packages/ckeditor5-foo' ],
			corePackagePath: 'packages/ckeditor5-core',
			translationsDirectory: '/cwd/build/.transifex',
			logger: loggerMocks
		} );

		expect( vi.mocked( fs.existsSync ) ).toHaveBeenCalledTimes( 2 );
		expect( vi.mocked( fs.existsSync ) ).toHaveBeenNthCalledWith(
			1, 'packages/ckeditor5-foo/lang/contexts.json'
		);
		expect( vi.mocked( fs.existsSync ) ).toHaveBeenNthCalledWith(
			2, 'packages/ckeditor5-core/lang/contexts.json'
		);

		expect( vi.mocked( fs.readFileSync ) ).toHaveBeenCalledTimes( 2 );
		expect( vi.mocked( fs.readFileSync ) ).toHaveBeenNthCalledWith(
			1, 'packages/ckeditor5-core/lang/contexts.json', 'utf-8'
		);
		expect( vi.mocked( fs.readFileSync ) ).toHaveBeenNthCalledWith(
			2, 'packages/ckeditor5-foo/src/foo.js', 'utf-8'
		);

		expect( vi.mocked( findMessages ) ).toHaveBeenCalledTimes( 1 );
		expect( vi.mocked( findMessages ) ).toHaveBeenCalledWith(
			'packages/ckeditor5-foo/src/foo.js_content',
			'packages/ckeditor5-foo/src/foo.js',
			expect.any( Function ),
			expect.any( Function )
		);

		expect( loggerMocks.error ).toHaveBeenCalledTimes( 0 );
		expect( vi.mocked( fs.outputFileSync ) ).toHaveBeenCalledTimes( 0 );
	} );

	it( 'should log an error if the file contains a message that cannot be parsed', () => {
		vi.mocked( fs.existsSync ).mockReturnValueOnce( false );
		vi.mocked( fs.existsSync ).mockReturnValueOnce( false );

		vi.mocked( fs.readFileSync ).mockReturnValueOnce( 'packages/ckeditor5-foo/src/foo.js_content' );

		vi.mocked( findMessages ).mockImplementationOnce( ( fileContent, filePath, onFoundMessage, onErrorFound ) => {
			const errors = [
				'parse_error'
			];

			errors.forEach( error => onErrorFound( error ) );
		} );

		createPotFiles( {
			sourceFiles: [ 'packages/ckeditor5-foo/src/foo.js' ],
			packagePaths: [ 'packages/ckeditor5-foo' ],
			corePackagePath: 'packages/ckeditor5-core',
			translationsDirectory: '/cwd/build/.transifex',
			logger: loggerMocks
		} );

		expect( vi.mocked( fs.existsSync ) ).toHaveBeenCalledTimes( 2 );
		expect( vi.mocked( fs.existsSync ) ).toHaveBeenNthCalledWith(
			1, 'packages/ckeditor5-foo/lang/contexts.json'
		);
		expect( vi.mocked( fs.existsSync ) ).toHaveBeenNthCalledWith(
			2, 'packages/ckeditor5-core/lang/contexts.json'
		);

		expect( vi.mocked( fs.readFileSync ) ).toHaveBeenCalledTimes( 1 );
		expect( vi.mocked( fs.readFileSync ) ).toHaveBeenCalledWith(
			'packages/ckeditor5-foo/src/foo.js', 'utf-8'
		);

		expect( vi.mocked( findMessages ) ).toHaveBeenCalledTimes( 1 );
		expect( vi.mocked( findMessages ) ).toHaveBeenCalledWith(
			'packages/ckeditor5-foo/src/foo.js_content',
			'packages/ckeditor5-foo/src/foo.js',
			expect.any( Function ),
			expect.any( Function )
		);

		expect( loggerMocks.error ).toHaveBeenCalledTimes( 1 );
		expect( loggerMocks.error ).toHaveBeenCalledWith( 'parse_error' );

		// Mark the process as failed in case of the error.
		expect( process.exitCode ).toEqual( 1 );
	} );

	it( 'should log an error if two context files contain contexts the same id', () => {
		vi.mocked( fs.existsSync ).mockReturnValueOnce( true );
		vi.mocked( fs.existsSync ).mockReturnValueOnce( true );

		vi.mocked( fs.readFileSync ).mockReturnValueOnce( JSON.stringify( { 'foo_id': 'foo_context1' } ) );
		vi.mocked( fs.readFileSync ).mockReturnValueOnce( JSON.stringify( { 'foo_id': 'foo_context2' } ) );
		vi.mocked( fs.readFileSync ).mockReturnValueOnce( 'packages/ckeditor5-foo/src/foo.js_content' );

		vi.mocked( findMessages ).mockImplementationOnce( ( fileContent, filePath, onFoundMessage ) => {
			const messages = [
				{ string: 'foo', id: 'foo_id' }
			];

			messages.forEach( message => onFoundMessage( message ) );
		} );

		createPotFiles( {
			sourceFiles: [ 'packages/ckeditor5-foo/src/foo.js' ],
			packagePaths: [ 'packages/ckeditor5-foo' ],
			corePackagePath: 'packages/ckeditor5-core',
			translationsDirectory: '/cwd/build/.transifex',
			logger: loggerMocks
		} );

		expect( vi.mocked( fs.existsSync ) ).toHaveBeenCalledTimes( 2 );
		expect( vi.mocked( fs.existsSync ) ).toHaveBeenNthCalledWith(
			1, 'packages/ckeditor5-foo/lang/contexts.json'
		);
		expect( vi.mocked( fs.existsSync ) ).toHaveBeenNthCalledWith(
			2, 'packages/ckeditor5-core/lang/contexts.json'
		);

		expect( vi.mocked( fs.readFileSync ) ).toHaveBeenCalledTimes( 3 );
		expect( vi.mocked( fs.readFileSync ) ).toHaveBeenNthCalledWith(
			1, 'packages/ckeditor5-foo/lang/contexts.json', 'utf-8'
		);
		expect( vi.mocked( fs.readFileSync ) ).toHaveBeenNthCalledWith(
			2, 'packages/ckeditor5-core/lang/contexts.json', 'utf-8'
		);
		expect( vi.mocked( fs.readFileSync ) ).toHaveBeenNthCalledWith(
			3, 'packages/ckeditor5-foo/src/foo.js', 'utf-8'
		);

		expect( vi.mocked( findMessages ) ).toHaveBeenCalledTimes( 1 );
		expect( vi.mocked( findMessages ) ).toHaveBeenCalledWith(
			'packages/ckeditor5-foo/src/foo.js_content',
			'packages/ckeditor5-foo/src/foo.js',
			expect.any( Function ),
			expect.any( Function )
		);

		expect( loggerMocks.error ).toHaveBeenCalledTimes( 1 );
		expect( loggerMocks.error ).toHaveBeenCalledWith(
			'Context is duplicated for the id: \'foo_id\' in ' +
			'packages/ckeditor5-core/lang/contexts.json and packages/ckeditor5-foo/lang/contexts.json.'
		);

		// Mark the process as failed in case of the error.
		expect( process.exitCode ).toEqual( 1 );
	} );

	it( 'should log an error if a context is unused', () => {
		vi.mocked( fs.existsSync ).mockReturnValueOnce( true );
		vi.mocked( fs.existsSync ).mockReturnValueOnce( false );

		vi.mocked( fs.readFileSync ).mockReturnValueOnce( JSON.stringify( { 'foo_id': 'foo_context', 'bar_id': 'foo_context' } ) );
		vi.mocked( fs.readFileSync ).mockReturnValueOnce( 'packages/ckeditor5-foo/src/foo.js_content' );

		vi.mocked( findMessages ).mockImplementationOnce( ( fileContent, filePath, onFoundMessage ) => {
			const messages = [
				{ string: 'foo', id: 'foo_id' }
			];

			messages.forEach( message => onFoundMessage( message ) );
		} );

		createPotFiles( {
			sourceFiles: [ 'packages/ckeditor5-foo/src/foo.js' ],
			packagePaths: [ 'packages/ckeditor5-foo' ],
			corePackagePath: 'packages/ckeditor5-core',
			translationsDirectory: '/cwd/build/.transifex',
			logger: loggerMocks
		} );

		expect( vi.mocked( fs.existsSync ) ).toHaveBeenCalledTimes( 2 );
		expect( vi.mocked( fs.existsSync ) ).toHaveBeenNthCalledWith(
			1, 'packages/ckeditor5-foo/lang/contexts.json'
		);
		expect( vi.mocked( fs.existsSync ) ).toHaveBeenNthCalledWith(
			2, 'packages/ckeditor5-core/lang/contexts.json'
		);

		expect( vi.mocked( fs.readFileSync ) ).toHaveBeenCalledTimes( 2 );
		expect( vi.mocked( fs.readFileSync ) ).toHaveBeenNthCalledWith(
			1, 'packages/ckeditor5-foo/lang/contexts.json', 'utf-8'
		);
		expect( vi.mocked( fs.readFileSync ) ).toHaveBeenNthCalledWith(
			2, 'packages/ckeditor5-foo/src/foo.js', 'utf-8'
		);

		expect( vi.mocked( findMessages ) ).toHaveBeenCalledTimes( 1 );
		expect( vi.mocked( findMessages ) ).toHaveBeenCalledWith(
			'packages/ckeditor5-foo/src/foo.js_content',
			'packages/ckeditor5-foo/src/foo.js',
			expect.any( Function ),
			expect.any( Function )
		);

		expect( loggerMocks.error ).toHaveBeenCalledTimes( 1 );
		expect( loggerMocks.error ).toHaveBeenCalledWith(
			'Unused context: \'bar_id\' in ckeditor5-foo/lang/contexts.json'
		);

		// Mark the process as failed in case of the error.
		expect( process.exitCode ).to.equal( 1 );
	} );

	it( 'should fail with an error describing missing properties if the required were not passed to the function', () => {
		vi.mocked( verifyProperties ).mockImplementationOnce( ( options, requiredProperties ) => {
			throw new Error( `The specified object misses the following properties: ${ requiredProperties.join( ', ' ) }.` );
		} );

		try {
			createPotFiles( {} );

			throw new Error( 'Expected to throw.' );
		} catch ( err ) {
			expect( err.message ).toEqual(
				'The specified object misses the following properties: sourceFiles, packagePaths, corePackagePath, translationsDirectory.'
			);
		}
	} );

	it( 'should not log an error if a context from the core package is unused when ignoreUnusedCorePackageContexts=true', () => {
		vi.mocked( fs.existsSync ).mockReturnValueOnce( true );
		vi.mocked( fs.existsSync ).mockReturnValueOnce( true );

		vi.mocked( fs.readFileSync ).mockReturnValueOnce( JSON.stringify( { 'foo_id': 'foo_context', 'bar_id': 'foo_context' } ) );
		vi.mocked( fs.readFileSync ).mockReturnValueOnce( JSON.stringify( { 'custom_id': 'foo_context' } ) );
		vi.mocked( fs.readFileSync ).mockReturnValueOnce( 'packages/ckeditor5-foo/src/foo.js_content' );

		vi.mocked( findMessages ).mockImplementationOnce( ( fileContent, filePath, onFoundMessage ) => {
			const messages = [
				{ string: 'foo', id: 'foo_id' }
			];

			messages.forEach( message => onFoundMessage( message ) );
		} );

		createPotFiles( {
			sourceFiles: [ 'packages/ckeditor5-foo/src/foo.js' ],
			packagePaths: [ 'packages/ckeditor5-foo' ],
			corePackagePath: 'packages/ckeditor5-core',
			translationsDirectory: '/cwd/build/.transifex',
			logger: loggerMocks,
			ignoreUnusedCorePackageContexts: true
		} );

		expect( vi.mocked( fs.existsSync ) ).toHaveBeenCalledTimes( 2 );
		expect( vi.mocked( fs.existsSync ) ).toHaveBeenNthCalledWith(
			1, 'packages/ckeditor5-foo/lang/contexts.json'
		);
		expect( vi.mocked( fs.existsSync ) ).toHaveBeenNthCalledWith(
			2, 'packages/ckeditor5-core/lang/contexts.json'
		);

		expect( vi.mocked( fs.readFileSync ) ).toHaveBeenCalledTimes( 3 );
		expect( vi.mocked( fs.readFileSync ) ).toHaveBeenNthCalledWith(
			1, 'packages/ckeditor5-foo/lang/contexts.json', 'utf-8'
		);
		expect( vi.mocked( fs.readFileSync ) ).toHaveBeenNthCalledWith(
			2, 'packages/ckeditor5-core/lang/contexts.json', 'utf-8'
		);
		expect( vi.mocked( fs.readFileSync ) ).toHaveBeenNthCalledWith(
			3, 'packages/ckeditor5-foo/src/foo.js', 'utf-8'
		);

		expect( vi.mocked( findMessages ) ).toHaveBeenCalledTimes( 1 );
		expect( vi.mocked( findMessages ) ).toHaveBeenCalledWith(
			'packages/ckeditor5-foo/src/foo.js_content',
			'packages/ckeditor5-foo/src/foo.js',
			expect.any( Function ),
			expect.any( Function )
		);

		expect( loggerMocks.error ).toHaveBeenCalledTimes( 1 );
		expect( loggerMocks.error ).toHaveBeenCalledWith(
			'Unused context: \'bar_id\' in ckeditor5-foo/lang/contexts.json'
		);

		// Mark the process as failed in case of the error.
		expect( process.exitCode ).toEqual( 1 );
	} );

	it( 'should not add the license header in the created a POT file entry when skipLicenseHeader=true', () => {
		vi.mocked( fs.existsSync ).mockReturnValueOnce( true );
		vi.mocked( fs.existsSync ).mockReturnValueOnce( false );

		vi.mocked( fs.readFileSync ).mockReturnValueOnce( JSON.stringify( { 'foo_id': 'foo_context' } ) );
		vi.mocked( fs.readFileSync ).mockReturnValueOnce( 'packages/ckeditor5-foo/src/foo.js_content' );

		vi.mocked( findMessages ).mockImplementationOnce( ( fileContent, filePath, onFoundMessage ) => {
			const messages = [
				{ string: 'foo', id: 'foo_id' }
			];

			messages.forEach( message => onFoundMessage( message ) );
		} );

		createPotFiles( {
			sourceFiles: [ 'packages/ckeditor5-foo/src/foo.js' ],
			packagePaths: [ 'packages/ckeditor5-foo' ],
			corePackagePath: 'packages/ckeditor5-core',
			translationsDirectory: '/cwd/build/.transifex',
			logger: loggerMocks,
			skipLicenseHeader: true
		} );

		expect( vi.mocked( fs.existsSync ) ).toHaveBeenCalledTimes( 2 );
		expect( vi.mocked( fs.existsSync ) ).toHaveBeenNthCalledWith(
			1, 'packages/ckeditor5-foo/lang/contexts.json'
		);
		expect( vi.mocked( fs.existsSync ) ).toHaveBeenNthCalledWith(
			2, 'packages/ckeditor5-core/lang/contexts.json'
		);

		expect( vi.mocked( fs.readFileSync ) ).toHaveBeenCalledTimes( 2 );
		expect( vi.mocked( fs.readFileSync ) ).toHaveBeenNthCalledWith(
			1, 'packages/ckeditor5-foo/lang/contexts.json', 'utf-8'
		);
		expect( vi.mocked( fs.readFileSync ) ).toHaveBeenNthCalledWith(
			2, 'packages/ckeditor5-foo/src/foo.js', 'utf-8'
		);

		expect( vi.mocked( findMessages ) ).toHaveBeenCalledTimes( 1 );
		expect( vi.mocked( findMessages ) ).toHaveBeenCalledWith(
			'packages/ckeditor5-foo/src/foo.js_content',
			'packages/ckeditor5-foo/src/foo.js',
			expect.any( Function ),
			expect.any( Function )
		);

		expect( vi.mocked( fs.outputFileSync ) ).toHaveBeenCalledTimes( 1 );
		expect( vi.mocked( fs.outputFileSync ) ).toHaveBeenCalledWith(
			'/cwd/build/.transifex/ckeditor5-foo/en.pot',
			[
				'msgctxt "foo_context"',
				'msgid "foo_id"',
				'msgstr "foo"',
				''
			].join( '\n' )
		);
	} );
} );
