/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';
import inquirer from 'inquirer';
import provideVersion from '../../lib/utils/provideversion.js';
import { npm } from '@ckeditor/ckeditor5-dev-utils';

vi.mock( 'inquirer' );
vi.mock( '@ckeditor/ckeditor5-dev-utils' );

describe( 'provideVersion()', () => {
	beforeEach( () => {
		vi.mocked( inquirer ).prompt.mockImplementation( input => {
			const { default: version } = input[ 0 ];

			return Promise.resolve( { version } );
		} );
	} );

	it( 'should use a specified version if is matches the semver standard', async () => {
		await expect( provideVersion( {
			packageName: '@ckeditor/ckeditor5-foo',
			version: '1.0.0',
			releaseTypeOrNewVersion: '1.1.0'
		} ) ).resolves.toEqual( '1.1.0' );

		expect( vi.mocked( inquirer ).prompt ).toHaveBeenCalledExactlyOnceWith(
			expect.arrayContaining( [
				expect.objectContaining( {
					message: 'Type the new version, "skip" or "internal" (suggested: "1.1.0", current: "1.0.0"):',
					default: '1.1.0'
				} )
			] )
		);
	} );

	it( 'should suggest proper "major" version for public package', async () => {
		await expect( provideVersion( {
			packageName: '@ckeditor/ckeditor5-foo',
			version: '1.0.0',
			releaseTypeOrNewVersion: 'major'
		} ) ).resolves.toEqual( '2.0.0' );

		expect( vi.mocked( inquirer ).prompt ).toHaveBeenCalledExactlyOnceWith(
			expect.arrayContaining( [
				expect.objectContaining( {
					message: 'Type the new version, "skip" or "internal" (suggested: "2.0.0", current: "1.0.0"):',
					default: '2.0.0'
				} )
			] )
		);
	} );

	it( 'should suggest proper "minor" version for public package', async () => {
		await expect( provideVersion( {
			packageName: '@ckeditor/ckeditor5-foo',
			version: '1.0.0',
			releaseTypeOrNewVersion: 'minor'
		} ) ).resolves.toEqual( '1.1.0' );

		expect( vi.mocked( inquirer ).prompt ).toHaveBeenCalledExactlyOnceWith(
			expect.arrayContaining( [
				expect.objectContaining( {
					message: 'Type the new version, "skip" or "internal" (suggested: "1.1.0", current: "1.0.0"):',
					default: '1.1.0'
				} )
			] )
		);
	} );

	it( 'should suggest proper "patch" version for public package', async () => {
		await expect( provideVersion( {
			packageName: '@ckeditor/ckeditor5-foo',
			version: '1.0.0',
			releaseTypeOrNewVersion: 'patch'
		} ) ).resolves.toEqual( '1.0.1' );

		expect( vi.mocked( inquirer ).prompt ).toHaveBeenCalledExactlyOnceWith(
			expect.arrayContaining( [
				expect.objectContaining( {
					message: 'Type the new version, "skip" or "internal" (suggested: "1.0.1", current: "1.0.0"):',
					default: '1.0.1'
				} )
			] )
		);
	} );

	it( 'should suggest "skip" version for package which does not contain changes (proposed null)', async () => {
		await expect( provideVersion( {
			packageName: '@ckeditor/ckeditor5-foo',
			version: '1.0.0',
			releaseTypeOrNewVersion: null
		} ) ).resolves.toEqual( 'skip' );

		expect( vi.mocked( inquirer ).prompt ).toHaveBeenCalledExactlyOnceWith(
			expect.arrayContaining( [
				expect.objectContaining( {
					message: 'Type the new version, "skip" or "internal" (suggested: "skip", current: "1.0.0"):',
					default: 'skip'
				} )
			] )
		);
	} );

	it( 'should suggest "skip" version for package which does not contain changes (proposed "skip")', async () => {
		await expect( provideVersion( {
			packageName: '@ckeditor/ckeditor5-foo',
			version: '1.0.0',
			releaseTypeOrNewVersion: 'skip'
		} ) ).resolves.toEqual( 'skip' );

		expect( vi.mocked( inquirer ).prompt ).toHaveBeenCalledExactlyOnceWith(
			expect.arrayContaining( [
				expect.objectContaining( {
					message: 'Type the new version, "skip" or "internal" (suggested: "skip", current: "1.0.0"):',
					default: 'skip'
				} )
			] )
		);
	} );

	it( 'should suggest a "minor" bump instead of "major" version for non-public package', async () => {
		await expect( provideVersion( {
			packageName: '@ckeditor/ckeditor5-foo',
			version: '0.7.0',
			releaseTypeOrNewVersion: 'major'
		} ) ).resolves.toEqual( '0.8.0' );
	} );

	it( 'should suggest proper "patch" version for non-public package', async () => {
		await expect( provideVersion( {
			packageName: '@ckeditor/ckeditor5-foo',
			version: '0.7.0',
			releaseTypeOrNewVersion: 'patch'
		} ) ).resolves.toEqual( '0.7.1' );
	} );

	it( 'returns "internal" if suggested version was "internal"', async () => {
		await expect( provideVersion( {
			packageName: '@ckeditor/ckeditor5-foo',
			version: '0.1.0',
			releaseTypeOrNewVersion: 'internal'
		} ) ).resolves.toEqual( 'internal' );
	} );

	it( 'allows disabling "internal" version', async () => {
		await expect( provideVersion( {
			packageName: '@ckeditor/ckeditor5-foo',
			version: '0.1.0',
			releaseTypeOrNewVersion: 'major',
			disableInternalVersion: true
		} ) ).resolves.toEqual( expect.any( String ) );

		expect( vi.mocked( inquirer ).prompt ).toHaveBeenCalledExactlyOnceWith(
			expect.arrayContaining( [
				expect.objectContaining( {
					message: 'Type the new version or "skip" (suggested: "0.2.0", current: "0.1.0"):',
					default: expect.any( String )
				} )
			] )
		);
	} );

	it( 'returns "skip" if suggested version was "internal" but it is disabled', async () => {
		await expect( provideVersion( {
			packageName: '@ckeditor/ckeditor5-foo',
			version: '0.1.0',
			releaseTypeOrNewVersion: 'internal',
			disableInternalVersion: true
		} ) ).resolves.toEqual( 'skip' );
	} );

	it( 'should suggest proper pre-release version for pre-release package (major bump)', async () => {
		await expect( provideVersion( {
			packageName: '@ckeditor/ckeditor5-foo',
			version: '1.0.0-alpha.1',
			releaseTypeOrNewVersion: 'major'
		} ) ).resolves.toEqual( '1.0.0-alpha.2' );
	} );

	it( 'should suggest proper pre-release version for pre-release package (minor bump)', async () => {
		await expect( provideVersion( {
			packageName: '@ckeditor/ckeditor5-foo',
			version: '1.0.0-alpha.1',
			releaseTypeOrNewVersion: 'minor'
		} ) ).resolves.toEqual( '1.0.0-alpha.2' );
	} );

	it( 'should suggest proper pre-release version for pre-release package (patch bump)', async () => {
		await expect( provideVersion( {
			packageName: '@ckeditor/ckeditor5-foo',
			version: '1.0.0-alpha.1',
			releaseTypeOrNewVersion: 'patch'
		} ) ).resolves.toEqual( '1.0.0-alpha.2' );
	} );

	it( 'removes spaces from provided version', async () => {
		await provideVersion( {
			packageName: '@ckeditor/ckeditor5-foo',
			version: '1.0.0',
			releaseTypeOrNewVersion: 'major'
		} );

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

	it( 'validates the provided version (disableInternalVersion=false)', async () => {
		await provideVersion( {
			packageName: '@ckeditor/ckeditor5-foo',
			version: '1.0.0',
			releaseTypeOrNewVersion: 'major'
		} );

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

		vi.mocked( npm.checkVersionAvailability ).mockResolvedValue( true );

		await expect( validate( 'skip' ) ).resolves.toBe( true );
		await expect( validate( 'internal' ) ).resolves.toBe( true );
		await expect( validate( '2.0.0' ) ).resolves.toBe( true );
		await expect( validate( '0.1' ) ).resolves.toBe( 'Please provide a valid version.' );

		expect( vi.mocked( npm.checkVersionAvailability ) ).toHaveBeenCalledTimes( 1 );
		expect( vi.mocked( npm.checkVersionAvailability ) ).toHaveBeenCalledWith( '2.0.0', '@ckeditor/ckeditor5-foo' );

		vi.mocked( npm.checkVersionAvailability ).mockResolvedValue( false );

		await expect( validate( '3.0.0' ) ).resolves.toBe( 'Given version is already taken.' );

		expect( vi.mocked( npm.checkVersionAvailability ) ).toHaveBeenCalledTimes( 2 );
		expect( vi.mocked( npm.checkVersionAvailability ) ).toHaveBeenCalledWith( '3.0.0', '@ckeditor/ckeditor5-foo' );
	} );

	it( 'validates the provided version (disableInternalVersion=true)', async () => {
		await provideVersion( {
			packageName: '@ckeditor/ckeditor5-foo',
			version: '1.0.0',
			releaseTypeOrNewVersion: 'major',
			disableInternalVersion: true
		} );

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

		vi.mocked( npm.checkVersionAvailability ).mockResolvedValue( true );

		await expect( validate( 'skip' ) ).resolves.toBe( true );
		await expect( validate( 'internal' ) ).resolves.toBe( 'Please provide a valid version.' );
		await expect( validate( '2.0.0' ) ).resolves.toBe( true );
		await expect( validate( '0.1' ) ).resolves.toBe( 'Please provide a valid version.' );

		expect( vi.mocked( npm.checkVersionAvailability ) ).toHaveBeenCalledTimes( 1 );
		expect( vi.mocked( npm.checkVersionAvailability ) ).toHaveBeenCalledWith( '2.0.0', '@ckeditor/ckeditor5-foo' );

		vi.mocked( npm.checkVersionAvailability ).mockResolvedValue( false );

		await expect( validate( '3.0.0' ) ).resolves.toBe( 'Given version is already taken.' );

		expect( vi.mocked( npm.checkVersionAvailability ) ).toHaveBeenCalledTimes( 2 );
		expect( vi.mocked( npm.checkVersionAvailability ) ).toHaveBeenCalledWith( '3.0.0', '@ckeditor/ckeditor5-foo' );
	} );
} );
