/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';
import path from 'path';
import getDefinitionsFromFile from '../../lib/utils/getdefinitionsfromfile.js';

describe( 'getDefinitionsFromFile()', () => {
	beforeEach( () => {
		vi.spyOn( path, 'join' ).mockImplementation( ( ...chunks ) => chunks.join( '/' ).replace( '/./', '/' ) );
	} );

	it( 'should return definition object if path to identity file is relative', () => {
		const definitions = getDefinitionsFromFile(
			// A relative path according to a package root.
			path.join( '.', 'tests', 'fixtures', 'getdefinitionsfromfile', 'secret.cjs' )
		);

		expect( definitions ).to.deep.equal( {
			SECRET: '"secret"',
			ANOTHER_SECRET: '"another-secret"',
			NON_PRIMITIVE_SECRET: '{"foo":["bar","baz"]}'
		} );
	} );

	it( 'should return definition object if path to identity file is absolute', () => {
		const definitions = getDefinitionsFromFile(
			path.join( import.meta.dirname, '..', 'fixtures', 'getdefinitionsfromfile', 'secret.cjs' )
		);

		expect( definitions ).to.deep.equal( {
			SECRET: '"secret"',
			ANOTHER_SECRET: '"another-secret"',
			NON_PRIMITIVE_SECRET: '{"foo":["bar","baz"]}'
		} );
	} );

	it( 'should return empty object if path to identity file is not provided', () => {
		const definitions = getDefinitionsFromFile();

		expect( definitions ).to.deep.equal( {} );
	} );

	it( 'should not throw an error and return empty object if path to identity file is not valid', () => {
		const consoleStub = vi.spyOn( console, 'error' ).mockImplementation( () => {} );
		let definitions;

		expect( () => {
			definitions = getDefinitionsFromFile( 'foo.js' );
		} ).to.not.throw();

		expect( consoleStub ).toHaveBeenCalledExactlyOnceWith(
			expect.stringContaining( 'Cannot find module' )
		);
		expect( definitions ).to.deep.equal( {} );
	} );

	it( 'should not throw an error and return empty object if stringifies the identity file has failed', () => {
		const consoleStub = vi.spyOn( console, 'error' ).mockImplementation( () => {} );
		vi.spyOn( JSON, 'stringify' ).mockImplementation( () => {
			throw new Error( 'Example error.' );
		} );

		let definitions;

		expect( () => {
			definitions = getDefinitionsFromFile( path.join( '.', 'tests', 'fixtures', 'getdefinitionsfromfile', 'secret.cjs' ) );
		} ).to.not.throw();

		expect( consoleStub ).toHaveBeenCalledExactlyOnceWith( 'Example error.' );
		expect( definitions ).to.deep.equal( {} );
	} );
} );
