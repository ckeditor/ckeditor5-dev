/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';
import inquirer from 'inquirer';
import chalk from 'chalk';
import provideNewVersionForMonoRepository from '../../lib/utils/providenewversionformonorepository.js';

vi.mock( 'inquirer' );
vi.mock( 'chalk', () => ( {
	default: {
		cyan: vi.fn( input => input ),
		underline: vi.fn( input => input )
	}
} ) );
vi.mock( '../../lib/utils/constants.js', () => ( {
	CLI_INDENT_SIZE: 1
} ) );

describe( 'provideNewVersionForMonoRepository()', () => {
	beforeEach( () => {
		vi.mocked( inquirer ).prompt.mockImplementation( input => {
			const { default: version } = input[ 0 ];

			return Promise.resolve( { version } );
		} );
	} );

	it( 'bumps major version', async () => {
		await expect( provideNewVersionForMonoRepository( '1.0.0', '@ckeditor/foo', 'major' ) )
			.resolves.toEqual( '2.0.0' );

		expect( vi.mocked( inquirer ).prompt ).toHaveBeenCalledExactlyOnceWith(
			expect.arrayContaining( [
				expect.objectContaining( {
					message: 'Type the new version (current highest: "1.0.0" found in "@ckeditor/foo", suggested: "2.0.0"):',
					default: '2.0.0'
				} )
			] )
		);
		expect( vi.mocked( chalk ).underline ).toHaveBeenCalledExactlyOnceWith( '@ckeditor/foo' );
	} );

	it( 'bumps minor version', async () => {
		await expect( provideNewVersionForMonoRepository( '1.0.0', '@ckeditor/foo', 'minor' ) )
			.resolves.toEqual( '1.1.0' );

		expect( vi.mocked( inquirer ).prompt ).toHaveBeenCalledExactlyOnceWith(
			expect.arrayContaining( [
				expect.objectContaining( {
					message: 'Type the new version (current highest: "1.0.0" found in "@ckeditor/foo", suggested: "1.1.0"):',
					default: '1.1.0'
				} )
			] )
		);
		expect( vi.mocked( chalk ).underline ).toHaveBeenCalledExactlyOnceWith( '@ckeditor/foo' );
	} );

	it( 'bumps patch version', async () => {
		await expect( provideNewVersionForMonoRepository( '1.0.0', '@ckeditor/foo', 'patch' ) )
			.resolves.toEqual( '1.0.1' );

		expect( vi.mocked( inquirer ).prompt ).toHaveBeenCalledExactlyOnceWith(
			expect.arrayContaining( [
				expect.objectContaining( {
					message: 'Type the new version (current highest: "1.0.0" found in "@ckeditor/foo", suggested: "1.0.1"):',
					default: '1.0.1'
				} )
			] )
		);
		expect( vi.mocked( chalk ).underline ).toHaveBeenCalledExactlyOnceWith( '@ckeditor/foo' );
	} );

	it( 'allows attaching the helper as a part of another process (indent=0)', async () => {
		await expect( provideNewVersionForMonoRepository( '1.0.0', '@ckeditor/foo', 'major', { indentLevel: 0 } ) );

		expect( vi.mocked( inquirer ).prompt ).toHaveBeenCalledExactlyOnceWith(
			expect.arrayContaining( [
				expect.objectContaining( {
					prefix: '?'
				} )
			] )
		);

		expect( vi.mocked( chalk ).cyan ).toHaveBeenCalledExactlyOnceWith( '?' );
	} );

	it( 'allows attaching the helper as a part of another process (indent=3)', async () => {
		await expect( provideNewVersionForMonoRepository( '1.0.0', '@ckeditor/foo', 'major', { indentLevel: 3 } ) );

		expect( vi.mocked( inquirer ).prompt ).toHaveBeenCalledExactlyOnceWith(
			expect.arrayContaining( [
				expect.objectContaining( {
					// CLI indent is mocked as _a space per indent size_.
					prefix: '   ?'
				} )
			] )
		);

		expect( vi.mocked( chalk ).cyan ).toHaveBeenCalledExactlyOnceWith( '?' );
	} );

	it( 'removes spaces from provided version', async () => {
		await provideNewVersionForMonoRepository( '1.0.0', '@ckeditor/foo' );

		expect( vi.mocked( inquirer ).prompt ).toHaveBeenCalledExactlyOnceWith(
			expect.arrayContaining( [
				expect.objectContaining( {
					filter: expect.any( Function )
				} )
			] )
		);

		const [ firstCall ] = vi.mocked( inquirer ).prompt.mock.calls;
		const [ firstArgument ] = firstCall;
		const [ firstQuestion ] = firstArgument;
		const { filter } = firstQuestion;

		expect( filter( '   0.0.1' ) ).to.equal( '0.0.1' );
		expect( filter( '0.0.1   ' ) ).to.equal( '0.0.1' );
		expect( filter( '    0.0.1   ' ) ).to.equal( '0.0.1' );
	} );

	it( 'validates the provided version', async () => {
		await provideNewVersionForMonoRepository( '1.0.0', '@ckeditor/foo' );

		expect( vi.mocked( inquirer ).prompt ).toHaveBeenCalledExactlyOnceWith(
			expect.arrayContaining( [
				expect.objectContaining( {
					validate: expect.any( Function )
				} )
			] )
		);

		const [ firstCall ] = vi.mocked( inquirer ).prompt.mock.calls;
		const [ firstArgument ] = firstCall;
		const [ firstQuestion ] = firstArgument;
		const { validate } = firstQuestion;

		expect( validate( '2.0.0' ) ).to.equal( true );
		expect( validate( '1.1.0' ) ).to.equal( true );
		expect( validate( '1.0.0' ) ).to.equal( 'Provided version must be higher than "1.0.0".' );
		expect( validate( 'skip' ) ).to.equal( 'Please provide a valid version.' );
		expect( validate( 'internal' ) ).to.equal( 'Please provide a valid version.' );
		expect( validate( '0.1' ) ).to.equal( 'Please provide a valid version.' );
	} );
} );
