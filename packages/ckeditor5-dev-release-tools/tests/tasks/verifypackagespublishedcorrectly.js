/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { glob } from 'glob';
import fs from 'fs-extra';
import verifyPackagesPublishedCorrectly from '../../lib/tasks/verifypackagespublishedcorrectly.js';
import checkVersionAvailability from '../../lib/utils/checkversionavailability.js';

vi.mock( 'fs-extra' );
vi.mock( '../../lib/utils/checkversionavailability' );
vi.mock( 'glob' );

describe( 'verifyPackagesPublishedCorrectly()', () => {
	beforeEach( () => {
		vi.mocked( fs ).remove.mockResolvedValue();
		vi.mocked( fs ).readJson.mockResolvedValue();
		vi.mocked( glob ).mockResolvedValue( [] );
		vi.mocked( checkVersionAvailability ).mockResolvedValue();
	} );

	it( 'should not verify packages if there are no packages in the release directory', async () => {
		const packagesDirectory = '/workspace/ckeditor5/release/npm';
		const version = 'latest';
		const onSuccess = vi.fn();

		await verifyPackagesPublishedCorrectly( { packagesDirectory, version, onSuccess } );

		expect( onSuccess ).toHaveBeenCalledExactlyOnceWith( 'No packages found to check for upload error 409.' );
		expect( vi.mocked( checkVersionAvailability ) ).not.toHaveBeenCalled();
	} );

	it( 'should verify packages and remove them from the release directory on "npm show" command success', async () => {
		vi.mocked( glob ).mockResolvedValue( [ 'package1', 'package2' ] );
		vi.mocked( fs ).readJson
			.mockResolvedValueOnce( { name: '@namespace/package1' } )
			.mockResolvedValueOnce( { name: '@namespace/package2' } );

		const packagesDirectory = '/workspace/ckeditor5/release/npm';
		const version = 'latest';
		const onSuccess = vi.fn();

		await verifyPackagesPublishedCorrectly( { packagesDirectory, version, onSuccess } );

		expect( vi.mocked( checkVersionAvailability ) ).toHaveBeenCalledWith( 'latest', '@namespace/package1' );
		expect( vi.mocked( checkVersionAvailability ) ).toHaveBeenCalledWith( 'latest', '@namespace/package2' );
		expect( vi.mocked( fs ).remove ).toHaveBeenCalledWith( 'package1' );
		expect( vi.mocked( fs ).remove ).toHaveBeenCalledWith( 'package2' );

		expect( onSuccess ).toHaveBeenCalledExactlyOnceWith( 'All packages that returned 409 were uploaded correctly.' );
	} );

	it( 'should not remove package from release directory when package is not available on npm', async () => {
		vi.mocked( glob ).mockResolvedValue( [ 'package1', 'package2' ] );
		vi.mocked( fs ).readJson
			.mockResolvedValueOnce( { name: '@namespace/package1' } )
			.mockResolvedValueOnce( { name: '@namespace/package2' } );
		vi.mocked( checkVersionAvailability )
			.mockResolvedValueOnce( true )
			.mockResolvedValueOnce( false );

		const packagesDirectory = '/workspace/ckeditor5/release/npm';
		const version = 'latest';
		const onSuccess = vi.fn();

		await expect( verifyPackagesPublishedCorrectly( { packagesDirectory, version, onSuccess } ) )
			.rejects.toThrow( 'Packages that were uploaded incorrectly, and need manual verification:\n@namespace/package1' );

		expect( vi.mocked( fs ).remove ).toHaveBeenCalledExactlyOnceWith( 'package2' );
	} );

	it( 'should not remove package from release directory when checking version on npm throws error', async () => {
		vi.mocked( glob ).mockResolvedValue( [ 'package1', 'package2' ] );
		vi.mocked( fs ).readJson
			.mockResolvedValueOnce( { name: '@namespace/package1' } )
			.mockResolvedValueOnce( { name: '@namespace/package2' } );
		vi.mocked( checkVersionAvailability )
			.mockRejectedValueOnce( )
			.mockResolvedValueOnce( false );

		const packagesDirectory = '/workspace/ckeditor5/release/npm';
		const version = 'latest';
		const onSuccess = vi.fn();

		await expect( verifyPackagesPublishedCorrectly( { packagesDirectory, version, onSuccess } ) )
			.rejects
			.toThrow( 'Packages that were uploaded incorrectly, and need manual verification:\n@namespace/package1' );

		expect( vi.mocked( fs ).remove ).toHaveBeenCalledExactlyOnceWith( 'package2' );
	} );
} );
