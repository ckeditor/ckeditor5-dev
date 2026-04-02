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
	const fallbackSourceFilePath = upath.join( fixturesPath, 'fallback-package', 'src', 'messages.ts' );

	it( 'should find messages using LocaleTranslate type information', () => {
		const errors = [];
		const result = getTypeScriptMessages( {
			cwd: fixturesPath,
			sourceFiles: [ sourceFilePath ],
			onErrorCallback: error => errors.push( error )
		} );

		const collectedMessages = result.get( sourceFilePath );

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
		] ] ) );
		expect( collectedMessages ).not.toContainEqual( { id: 'Hidden aliased translation', string: 'Hidden aliased translation' } );

		expect( errors ).toEqual( [
			`First t() call argument should be a string literal or an object literal (${ sourceFilePath }).`
		] );
	} );

	it( 'should return null when a TypeScript config cannot be found', () => {
		const result = getTypeScriptMessages( {
			cwd: '/tmp',
			sourceFiles: [ fallbackSourceFilePath ],
			onErrorCallback: () => {}
		} );

		expect( result ).to.equal( null );
	} );
} );
