/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';
import columns from 'cli-columns';
import { tools } from '@ckeditor/ckeditor5-dev-utils';
import shellEscape from 'shell-escape';
import assertNpmAuthorization from '../../lib/utils/assertnpmauthorization.js';
import reassignNpmTags from '../../lib/tasks/reassignnpmtags.js';

const stubs = vi.hoisted( () => {
	const values = {
		spinner: {
			start: vi.fn(),
			increase: vi.fn(),
			finish: vi.fn()
		},
		exec: vi.fn(),
		styleText: vi.fn( ( _style, text ) => text )
	};

	return values;
} );

vi.stubGlobal( 'console', {
	log: vi.fn(),
	warn: vi.fn(),
	error: vi.fn()
} );

vi.mock( '@ckeditor/ckeditor5-dev-utils', () => ( {
	tools: {
		createSpinner: vi.fn( () => stubs.spinner )
	}
} ) );
vi.mock( 'util', () => ( {
	styleText: stubs.styleText,
	promisify: vi.fn( () => stubs.exec )
} ) );
vi.mock( 'shell-escape' );
vi.mock( 'cli-columns' );
vi.mock( 'shell-escape' );
vi.mock( '../../lib/utils/assertnpmauthorization.js' );

describe( 'reassignNpmTags()', () => {
	beforeEach( () => {
		vi.mocked( shellEscape ).mockImplementation( v => v[ 0 ] );
		vi.mocked( assertNpmAuthorization ).mockResolvedValue( true );
	} );

	it( 'should throw an error when assertNpmAuthorization throws error', async () => {
		vi.mocked( assertNpmAuthorization ).mockRejectedValue(
			new Error( 'User not logged in error' )
		);
		await expect( reassignNpmTags( { npmOwner: 'correct-npm-user', version: '1.0.1', packages: [ 'package1' ] } ) )
			.rejects.toThrow( 'User not logged in error' );

		expect( stubs.exec ).not.toHaveBeenCalled();
	} );

	it( 'should skip updating tags when provided version matches existing version for tag latest', async () => {
		vi.mocked( columns ).mockReturnValue( 'package1 | package2' );
		stubs.exec.mockRejectedValue( new Error( 'is already set to version' ) );

		await reassignNpmTags( { npmOwner: 'authorized-user', version: '1.0.0', packages: [ 'package1', 'package2' ] } );

		expect( vi.mocked( console ).log ).toHaveBeenCalledTimes( 2 );
		expect( vi.mocked( console ).log ).toHaveBeenCalledWith( '⬇️ Packages skipped:' );
		expect( vi.mocked( console ).log ).toHaveBeenCalledWith( 'package1 | package2' );
	} );

	it( 'should update tags when tag latest for provided version does not yet exist', async () => {
		stubs.exec.mockResolvedValue( { stdout: '+latest' } );

		await reassignNpmTags( { npmOwner: 'authorized-user', version: '1.0.1', packages: [ 'package1', 'package2' ] } );

		expect( stubs.exec ).toHaveBeenCalledTimes( 2 );
		expect( stubs.exec ).toHaveBeenCalledWith( 'npm dist-tag add package1@1.0.1 latest' );
		expect( stubs.exec ).toHaveBeenCalledWith( 'npm dist-tag add package2@1.0.1 latest' );
	} );

	it( 'should accept a custom dist tag', async () => {
		stubs.exec.mockResolvedValue( { stdout: '+lts-v47' } );

		await reassignNpmTags( {
			npmOwner: 'authorized-user',
			version: '1.0.1',
			packages: [ 'package1', 'package2' ],
			npmTag: 'lts-v47'
		} );

		expect( stubs.exec ).toHaveBeenCalledTimes( 2 );
		expect( stubs.exec ).toHaveBeenCalledWith( 'npm dist-tag add package1@1.0.1 lts-v47' );
		expect( stubs.exec ).toHaveBeenCalledWith( 'npm dist-tag add package2@1.0.1 lts-v47' );
	} );

	it( 'should continue updating packages even if first package update fails', async () => {
		stubs.exec
			.mockRejectedValueOnce( new Error( 'is already set to version' ) )
			.mockResolvedValueOnce( { stdout: '+latest' } );

		await reassignNpmTags( { npmOwner: 'authorized-user', version: '1.0.1', packages: [ 'package1', 'package2' ] } );

		expect( stubs.exec ).toHaveBeenCalledWith( 'npm dist-tag add package1@1.0.1 latest' );
		expect( stubs.exec ).toHaveBeenCalledWith( 'npm dist-tag add package2@1.0.1 latest' );
	} );

	it( 'should escape arguments passed to a shell command', async () => {
		stubs.exec.mockResolvedValue( { stdout: '+latest' } );

		await reassignNpmTags( { npmOwner: 'authorized-user', version: '1.0.1', packages: [ 'package1' ] } );

		expect( vi.mocked( shellEscape ) ).toHaveBeenCalledWith( [ 'package1' ] );
		expect( vi.mocked( shellEscape ) ).toHaveBeenCalledWith( [ '1.0.1' ] );
	} );

	describe( 'UX', () => {
		it( 'should create a spinner before starting processing packages', async () => {
			await reassignNpmTags( { npmOwner: 'authorized-user', version: '1.0.1', packages: [] } );

			expect( vi.mocked( tools ).createSpinner ).toHaveBeenCalledExactlyOnceWith(
				'Reassigning npm tags...',
				{
					total: 0
				}
			);
			expect( stubs.spinner.start ).toHaveBeenCalledOnce();
		} );

		it( 'should increase the spinner counter after successfully processing a package', async () => {
			await reassignNpmTags( { npmOwner: 'authorized-user', version: '1.0.1', packages: [ 'package1' ] } );

			expect( stubs.spinner.increase ).toHaveBeenCalledTimes( 1 );
		} );

		it( 'should increase the spinner counter after failure processing a package', async () => {
			stubs.exec.mockRejectedValue( new Error( 'is already set to version' ) );

			await reassignNpmTags( { npmOwner: 'authorized-user', version: '1.0.1', packages: [ 'package1' ] } );

			expect( stubs.spinner.increase ).toHaveBeenCalledTimes( 1 );
		} );

		it( 'should finish the spinner once all packages have been processed', async () => {
			stubs.exec
				.mockRejectedValueOnce( new Error( 'is already set to version' ) )
				.mockResolvedValueOnce( { stdout: '+latest' } );

			await reassignNpmTags( { npmOwner: 'authorized-user', version: '1.0.1', packages: [ 'package1', 'package2' ] } );

			expect( stubs.spinner.start ).toHaveBeenCalledTimes( 1 );
			expect( stubs.spinner.increase ).toHaveBeenCalledTimes( 2 );
			expect( stubs.spinner.finish ).toHaveBeenCalledTimes( 1 );

			expect( stubs.spinner.start ).toHaveBeenCalledBefore( stubs.spinner.increase );
			expect( stubs.spinner.start ).toHaveBeenCalledBefore( stubs.spinner.finish );
			expect( stubs.spinner.increase ).toHaveBeenCalledBefore( stubs.spinner.finish );
		} );

		it( 'should display skipped packages in a column', async () => {
			stubs.exec.mockRejectedValue( new Error( 'is already set to version' ) );
			vi.mocked( columns ).mockReturnValue( '1 | 2 | 3' );

			await reassignNpmTags( { npmOwner: 'authorized-user', version: '1.0.0', packages: [ 'package1', 'package2' ] } );

			expect( vi.mocked( columns ) ).toHaveBeenCalledTimes( 1 );
			expect( vi.mocked( columns ) ).toHaveBeenCalledWith( [ 'package1', 'package2' ] );
			expect( vi.mocked( console ).log ).toHaveBeenCalledTimes( 2 );
			expect( vi.mocked( console ).log ).toHaveBeenCalledWith( '⬇️ Packages skipped:' );
			expect( vi.mocked( console ).log ).toHaveBeenCalledWith( '1 | 2 | 3' );
		} );

		it( 'should display processed packages in a column', async () => {
			stubs.exec.mockResolvedValue( { stdout: '+latest' } );
			vi.mocked( columns ).mockReturnValue( '1 | 2 | 3' );

			await reassignNpmTags( { npmOwner: 'authorized-user', version: '1.0.1', packages: [ 'package1', 'package2' ] } );

			expect( vi.mocked( columns ) ).toHaveBeenCalledTimes( 1 );
			expect( vi.mocked( columns ) ).toHaveBeenCalledWith( [ 'package1', 'package2' ] );
			expect( vi.mocked( console ).log ).toHaveBeenCalledTimes( 2 );
			expect( vi.mocked( console ).log ).toHaveBeenCalledWith( '✨ Tags updated:' );
			expect( vi.mocked( console ).log ).toHaveBeenCalledWith( '1 | 2 | 3' );
		} );

		it( 'should display errors found during processing a package', async () => {
			stubs.exec.mockRejectedValue( new Error( 'Npm error while updating tag.' ) );

			await reassignNpmTags( { npmOwner: 'authorized-user', version: '1.0.1', packages: [ 'package1' ] } );

			expect( vi.mocked( console ).log ).toHaveBeenCalledTimes( 2 );
			expect( vi.mocked( console ).log ).toHaveBeenCalledWith( '🐛 Errors found:' );
			expect( vi.mocked( console ).log ).toHaveBeenCalledWith( '* Npm error while updating tag.' );
		} );
	} );
} );
