/**
 * @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { describe, expect, it } from 'vitest';
import upath from 'upath';
import getTypeScriptMessages from '../../lib/utils/gettypescriptmessages.js';

describe( 'getTypeScriptMessages()', () => {
	const fixturesPath = upath.join( import.meta.dirname, '..', '_fixtures', 'getsourcemessages' );
	const packagePath = upath.join( fixturesPath, 'ckeditor5-method-calls' );
	const sourceFilePath = upath.join( packagePath, 'src', 'messages.ts' );
	const advancedSourceFilePath = upath.join( packagePath, 'src', 'advanced-messages.ts' );
	const fallbackSourceFilePath = upath.join( fixturesPath, 'fallback-package', 'src', 'messages.ts' );
	const missingLocaleTranslateFixturesPath = upath.join( fixturesPath, 'missing-locale-translate' );
	const missingLocaleTranslateSourceFilePath = upath.join( missingLocaleTranslateFixturesPath, 'src', 'messages.ts' );
	const invalidTsconfigFixturesPath = upath.join( fixturesPath, 'invalid-tsconfig' );

	it( 'should find messages using LocaleTranslate type information', () => {
		const errors = [];
		const result = getTypeScriptMessages( {
			cwd: fixturesPath,
			sourceFiles: [ sourceFilePath, advancedSourceFilePath ],
			onErrorCallback: error => errors.push( error )
		} );

		expect( result ).not.toBeNull();

		const collectedMessages = result.get( sourceFilePath );
		const advancedCollectedMessages = result.get( advancedSourceFilePath );

		expect( result ).toEqual( new Map( [ [
			sourceFilePath,
			[
				{ id: 'Editor locale translation', string: 'Editor locale translation' },
				{ id: 'Editor shorthand translation', string: 'Editor shorthand translation' },
				{ id: 'View shorthand translation', string: 'View shorthand translation' },
				{ id: 'Locale translation', string: 'Locale translation' },
				{ id: 'Direct t alias translation', string: 'Direct t alias translation', plural: 'Direct t alias translations' },
				{ id: 'First conditional branch', string: 'First conditional branch' },
				{ id: 'SECOND_BRANCH', string: 'Second conditional branch' }
			]
		], [
			advancedSourceFilePath,
			[
				{ id: 'Element access translation', string: 'Element access translation' },
				{ id: 'Parenthesized direct translation', string: 'Parenthesized direct translation' },
				{ id: 'As expression direct translation', string: 'As expression direct translation' },
				{ id: 'Non-null direct translation', string: 'Non-null direct translation' },
				{ id: 'Type assertion direct translation', string: 'Type assertion direct translation' },
				{ id: 'Satisfies direct translation', string: 'Satisfies direct translation' },
				{ id: 'Indexed access type translation', string: 'Indexed access type translation' },
				{ id: 'Union type translation', string: 'Union type translation' },
				{ id: 'Intersection type translation', string: 'Intersection type translation' },
				{
					id: 'QUOTED_STRING_ID',
					string: 'Quoted string property translation',
					plural: 'Quoted string property translations'
				}
			]
		] ] ) );

		expect( collectedMessages ).not.toContainEqual( {
			id: 'Hidden aliased translation',
			string: 'Hidden aliased translation'
		} );

		expect( advancedCollectedMessages ).not.toContainEqual( {
			id: 'Ignored local function translation',
			string: 'Ignored local function translation'
		} );

		expect( errors ).toEqual( [
			`First t() call argument should be a string literal or an object literal (${ sourceFilePath }).`,
			`First t() call argument should be a string literal or an object literal (${ advancedSourceFilePath }).`,
			`First t() call argument should be a string literal or an object literal (${ advancedSourceFilePath }).`,
			`First t() call argument should be a string literal or an object literal (${ advancedSourceFilePath }).`,
			`First t() call argument should be a string literal or an object literal (${ advancedSourceFilePath }).`
		] );
	} );

	it( 'should skip source files missing from the program and return null when no source files can be resolved', () => {
		const missingSourceFilePath = upath.join( packagePath, 'src', 'missing.ts' );

		expect( getTypeScriptMessages( {
			cwd: fixturesPath,
			sourceFiles: [ sourceFilePath, missingSourceFilePath ],
			onErrorCallback: () => {}
		} ) ).toEqual( new Map( [ [
			sourceFilePath,
			[
				{ id: 'Editor locale translation', string: 'Editor locale translation' },
				{ id: 'Editor shorthand translation', string: 'Editor shorthand translation' },
				{ id: 'View shorthand translation', string: 'View shorthand translation' },
				{ id: 'Locale translation', string: 'Locale translation' },
				{ id: 'Direct t alias translation', string: 'Direct t alias translation', plural: 'Direct t alias translations' },
				{ id: 'First conditional branch', string: 'First conditional branch' },
				{ id: 'SECOND_BRANCH', string: 'Second conditional branch' }
			]
		] ] ) );

		expect( getTypeScriptMessages( {
			cwd: fixturesPath,
			sourceFiles: [ missingSourceFilePath ],
			onErrorCallback: () => {}
		} ) ).to.equal( null );
	} );

	it( 'should return null when a TypeScript config cannot be found', () => {
		const result = getTypeScriptMessages( {
			cwd: '/tmp',
			sourceFiles: [ fallbackSourceFilePath ],
			onErrorCallback: () => {}
		} );

		expect( result ).to.equal( null );
	} );

	it( 'should return null when a TypeScript config cannot be parsed', () => {
		expect( getTypeScriptMessages( {
			cwd: invalidTsconfigFixturesPath,
			sourceFiles: [ sourceFilePath ],
			onErrorCallback: () => {}
		} ) ).to.equal( null );
	} );

	it( 'should return null when LocaleTranslate export is missing', () => {
		expect( getTypeScriptMessages( {
			cwd: missingLocaleTranslateFixturesPath,
			sourceFiles: [ missingLocaleTranslateSourceFilePath ],
			onErrorCallback: () => {}
		} ) ).to.equal( null );
	} );
} );
