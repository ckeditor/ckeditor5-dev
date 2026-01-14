/**
 * @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { simpleGit } from 'simple-git';

import validateRepositoryToRelease from '../../lib/utils/validaterepositorytorelease.js';

vi.mock( 'simple-git' );

describe( 'validateRepositoryToRelease()', () => {
	let current, behind;

	beforeEach( () => {
		vi.stubGlobal( 'process', { cwd: () => 'current/working/directory' } );

		vi.mocked( simpleGit ).mockReturnValue( {
			status: async () => ( { current, behind } )
		} );
	} );

	it( 'passes the default cwd to simpleGit', async () => {
		current = 'master';
		behind = 0;

		await validateRepositoryToRelease( { changes: 'Some changes.', version: '1.0.0' } );

		expect( simpleGit ).toHaveBeenCalledExactlyOnceWith( { baseDir: 'current/working/directory' } );
	} );

	it( 'passes the specified cwd to simpleGit', async () => {
		current = 'master';
		behind = 0;

		await validateRepositoryToRelease( { changes: 'Some changes.', version: '1.0.0', cwd: 'custom/working/directory' } );

		expect( simpleGit ).toHaveBeenCalledExactlyOnceWith( { baseDir: 'custom/working/directory' } );
	} );

	it( 'resolves an empty array if validation passes', async () => {
		current = 'master';
		behind = 0;

		const errors = await validateRepositoryToRelease( { changes: 'Some changes.', version: '1.0.0' } );

		expect( errors ).to.be.an( 'Array' );
		expect( errors.length ).to.equal( 0 );
	} );

	it( 'resolves an array with errors if the release changes are not defined', async () => {
		current = 'master';
		behind = 0;

		const errors = await validateRepositoryToRelease( { changes: null, version: '1.0.0' } );

		expect( errors.length ).to.equal( 1 );
		expect( errors[ 0 ] ).to.equal( 'Cannot find changelog entries for version "1.0.0".' );
	} );

	it( 'resolves an array with errors if the specified version is not a string', async () => {
		current = 'master';
		behind = 0;

		const errors = await validateRepositoryToRelease( { changes: 'Some changes.', version: null } );

		expect( errors.length ).to.equal( 1 );
		expect( errors[ 0 ] ).to.equal( 'Passed an invalid version ("null").' );
	} );

	it( 'resolves an array with errors if the specified version is empty string', async () => {
		current = 'master';
		behind = 0;

		const errors = await validateRepositoryToRelease( { changes: 'Some changes.', version: '' } );

		expect( errors.length ).to.equal( 1 );
		expect( errors[ 0 ] ).to.equal( 'Passed an invalid version ("").' );
	} );

	it( 'resolves an array with errors if current branch is not "master"', async () => {
		current = 'develop';
		behind = 0;

		const errors = await validateRepositoryToRelease( { changes: 'Some changes.', version: '1.0.0' } );

		expect( errors.length ).to.equal( 1 );
		expect( errors[ 0 ] ).to.equal( 'Not on the "#master" branch.' );
	} );

	it( 'resolves an array with errors if master is behind with origin', async () => {
		current = 'master';
		behind = 2;

		const errors = await validateRepositoryToRelease( { changes: 'Some changes.', version: '1.0.0' } );

		expect( errors.length ).to.equal( 1 );
		expect( errors[ 0 ] ).to.equal( 'The branch is behind with the remote.' );
	} );

	it( 'allows skipping the branch check', async () => {
		current = 'develop';
		behind = 0;

		const errors = await validateRepositoryToRelease( { changes: 'Some changes.', version: '1.0.0', ignoreBranchCheck: true } );

		expect( errors.length ).to.equal( 0 );
	} );

	it( 'uses non-master branch for releasing if specified', async () => {
		current = 'release';
		behind = 0;

		const errors = await validateRepositoryToRelease( { branch: 'release', changes: 'Some changes.', version: '1.0.0' } );

		expect( errors ).to.be.an( 'Array' );
		expect( errors.length ).to.equal( 0 );
	} );

	it( 'allows skipping the branch check (even if specified)', async () => {
		current = 'develop';
		behind = 0;

		const errors = await validateRepositoryToRelease( {
			branch: 'release',
			changes: 'Some changes.',
			version: '1.0.0',
			ignoreBranchCheck: true
		} );

		expect( errors.length ).to.equal( 0 );
	} );
} );
