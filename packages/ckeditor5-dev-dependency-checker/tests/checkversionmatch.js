/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import checkVersionMatch from '../lib/checkversionmatch.js';

import fs from 'fs-extra';
import { globSync } from 'glob';
import { execSync } from 'child_process';

const hoists = vi.hoisted( () => ( {
	chalk: {
		blue: vi.fn( input => input ),
		green: vi.fn( input => input ),
		red: vi.fn( input => input )
	}
} ) );

vi.mock( 'fs-extra' );
vi.mock( 'chalk', () => ( { default: hoists.chalk } ) );
vi.mock( 'glob' );
vi.mock( 'child_process' );

describe( 'checkVersionMatch()', () => {
	let options, files, packageVersions, processExitMock, consoleLogMock, consoleErrorMock;

	beforeEach( () => {
		options = {
			cwd: 'current/working/directory'
		};

		files = {
			'./package.json': {
				name: 'rootPkg',
				dependencies: {
					'dep1': '1.0.0'
				},
				devDependencies: {
					'dep2': '2.0.0'
				}
			},
			'./packages/foo/package.json': {
				name: 'fooPkg',
				dependencies: {
					'dep1': '1.0.0'
				},
				devDependencies: {
					'dep2': '2.0.0'
				}
			},
			'./packages/bar/package.json': {
				name: 'barPkg',
				dependencies: {
					'dep1': '1.0.0'
				},
				devDependencies: {
					'dep2': '2.0.0'
				}
			}
		};

		packageVersions = {
			'dep1': [
				'1.0.0',
				'1.0.1'
			],
			'dep2': [
				'2.0.0',
				'2.0.1'
			],
			'dep3': [
				'3.0.0',
				'3.0.1',
				'3.0.2'
			]
		};

		processExitMock = vi.fn();
		consoleLogMock = vi.fn();
		consoleErrorMock = vi.fn();

		vi.stubGlobal( 'process', { ...process, exit: processExitMock } );
		vi.stubGlobal( 'console', { ...console, log: consoleLogMock, error: consoleErrorMock } );

		vi.mocked( fs.readJsonSync ).mockImplementation( path => files[ path ] );
		vi.mocked( globSync ).mockReturnValue( Object.keys( files ) );
		vi.mocked( execSync ).mockImplementation( command => {
			const [ , dependency ] = command.match( /npm view ([a-z0-9]+) versions --json/i );

			return JSON.stringify( packageVersions[ dependency ] );
		} );
	} );

	afterEach( () => {
		vi.unstubAllGlobals();
	} );

	it( 'should be a function', () => {
		expect( checkVersionMatch ).toBeInstanceOf( Function );
	} );

	it( 'should log about dependencies being correct', () => {
		checkVersionMatch( options );

		expect( consoleLogMock ).toHaveBeenCalledTimes( 2 );
		expect( consoleErrorMock ).toHaveBeenCalledTimes( 0 );
		expect( processExitMock ).toHaveBeenCalledTimes( 0 );

		expect( consoleLogMock ).toHaveBeenNthCalledWith( 1, '🔍 Starting checking dependencies versions...' );
		expect( consoleLogMock ).toHaveBeenNthCalledWith( 2, '✅  All dependencies are correct!' );
	} );

	it( 'should log about dependencies using different versions', () => {
		files[ './package.json' ].dependencies.dep1 = '1.0.1';

		checkVersionMatch( options );

		expect( consoleLogMock ).toHaveBeenCalledTimes( 1 );
		expect( consoleErrorMock ).toHaveBeenCalledTimes( 2 );
		expect( processExitMock ).toHaveBeenCalledTimes( 1 );

		expect( consoleLogMock ).toHaveBeenNthCalledWith( 1, '🔍 Starting checking dependencies versions...' );

		expect( consoleErrorMock ).toHaveBeenNthCalledWith( 1,
			'❌  Errors found. Run this script with an argument: `--fix` to resolve the issues automatically:'
		);
		expect( consoleErrorMock ).toHaveBeenNthCalledWith( 2, [
			'"dep1" in "fooPkg" in version "1.0.0" should be set to "1.0.1".',
			'"dep1" in "barPkg" in version "1.0.0" should be set to "1.0.1".'
		].join( '\n' ) );
	} );

	it( 'should log about dependencies using different version ranges', () => {
		files[ './package.json' ].dependencies.dep1 = '^1.0.0';

		checkVersionMatch( options );

		expect( consoleLogMock ).toHaveBeenCalledTimes( 2 );
		expect( consoleErrorMock ).toHaveBeenCalledTimes( 2 );
		expect( processExitMock ).toHaveBeenCalledTimes( 1 );

		expect( consoleLogMock ).toHaveBeenNthCalledWith( 1, '🔍 Starting checking dependencies versions...' );
		expect( consoleLogMock ).toHaveBeenNthCalledWith( 2, '⬇️ Downloading "dep1" versions from npm...' );

		expect( consoleErrorMock ).toHaveBeenNthCalledWith( 1,
			'❌  Errors found. Run this script with an argument: `--fix` to resolve the issues automatically:'
		);
		expect( consoleErrorMock ).toHaveBeenNthCalledWith( 2, [
			'"dep1" in "rootPkg" in version "^1.0.0" should be set to "1.0.1".',
			'"dep1" in "fooPkg" in version "1.0.0" should be set to "1.0.1".',
			'"dep1" in "barPkg" in version "1.0.0" should be set to "1.0.1".'
		].join( '\n' ) );
	} );

	it( 'should log about dependencies using different version ranges when a package has no dependencies', () => {
		files[ './package.json' ].dependencies.dep1 = '^1.0.0';
		delete files[ './packages/foo/package.json' ].dependencies;

		checkVersionMatch( options );

		expect( consoleLogMock ).toHaveBeenCalledTimes( 2 );
		expect( consoleErrorMock ).toHaveBeenCalledTimes( 2 );
		expect( processExitMock ).toHaveBeenCalledTimes( 1 );

		expect( consoleLogMock ).toHaveBeenNthCalledWith( 1, '🔍 Starting checking dependencies versions...' );
		expect( consoleLogMock ).toHaveBeenNthCalledWith( 2, '⬇️ Downloading "dep1" versions from npm...' );

		expect( consoleErrorMock ).toHaveBeenNthCalledWith( 1,
			'❌  Errors found. Run this script with an argument: `--fix` to resolve the issues automatically:'
		);
		expect( consoleErrorMock ).toHaveBeenNthCalledWith( 2, [
			'"dep1" in "rootPkg" in version "^1.0.0" should be set to "1.0.1".',
			'"dep1" in "barPkg" in version "1.0.0" should be set to "1.0.1".'
		].join( '\n' ) );
	} );

	it( 'should not log about filtered out dev dependencies using different versions', () => {
		options.devDependenciesFilter = () => false;
		files[ './package.json' ].devDependencies.dep2 = '2.0.1';

		checkVersionMatch( options );

		expect( consoleLogMock ).toHaveBeenCalledTimes( 2 );
		expect( consoleErrorMock ).toHaveBeenCalledTimes( 0 );
		expect( processExitMock ).toHaveBeenCalledTimes( 0 );

		expect( consoleLogMock ).toHaveBeenNthCalledWith( 1, '🔍 Starting checking dependencies versions...' );
		expect( consoleLogMock ).toHaveBeenNthCalledWith( 2, '✅  All dependencies are correct!' );
	} );

	it( 'should log about dev dependencies using different versions', () => {
		files[ './package.json' ].devDependencies.dep2 = '2.0.1';

		checkVersionMatch( options );

		expect( consoleLogMock ).toHaveBeenCalledTimes( 1 );
		expect( consoleErrorMock ).toHaveBeenCalledTimes( 2 );
		expect( processExitMock ).toHaveBeenCalledTimes( 1 );

		expect( consoleLogMock ).toHaveBeenNthCalledWith( 1, '🔍 Starting checking dependencies versions...' );

		expect( consoleErrorMock ).toHaveBeenNthCalledWith( 1,
			'❌  Errors found. Run this script with an argument: `--fix` to resolve the issues automatically:'
		);
		expect( consoleErrorMock ).toHaveBeenNthCalledWith( 2, [
			'"dep2" in "fooPkg" in version "2.0.0" should be set to "2.0.1".',
			'"dep2" in "barPkg" in version "2.0.0" should be set to "2.0.1".'
		].join( '\n' ) );
	} );

	it( 'should log about dev dependencies using different version ranges', () => {
		files[ './package.json' ].devDependencies.dep2 = '^2.0.0';

		checkVersionMatch( options );

		expect( consoleLogMock ).toHaveBeenCalledTimes( 2 );
		expect( consoleErrorMock ).toHaveBeenCalledTimes( 2 );
		expect( processExitMock ).toHaveBeenCalledTimes( 1 );

		expect( consoleLogMock ).toHaveBeenNthCalledWith( 1, '🔍 Starting checking dependencies versions...' );
		expect( consoleLogMock ).toHaveBeenNthCalledWith( 2, '⬇️ Downloading "dep2" versions from npm...' );

		expect( consoleErrorMock ).toHaveBeenNthCalledWith( 1,
			'❌  Errors found. Run this script with an argument: `--fix` to resolve the issues automatically:'
		);
		expect( consoleErrorMock ).toHaveBeenNthCalledWith( 2, [
			'"dep2" in "rootPkg" in version "^2.0.0" should be set to "2.0.1".',
			'"dep2" in "fooPkg" in version "2.0.0" should be set to "2.0.1".',
			'"dep2" in "barPkg" in version "2.0.0" should be set to "2.0.1".'
		].join( '\n' ) );
	} );

	it( 'should log about dev dependencies using different version ranges when ranges are allowed', () => {
		options.allowRanges = true;
		files[ './package.json' ].devDependencies.dep2 = '^2.0.0';

		checkVersionMatch( options );

		expect( consoleLogMock ).toHaveBeenCalledTimes( 1 );
		expect( consoleErrorMock ).toHaveBeenCalledTimes( 2 );
		expect( processExitMock ).toHaveBeenCalledTimes( 1 );

		expect( consoleLogMock ).toHaveBeenNthCalledWith( 1, '🔍 Starting checking dependencies versions...' );

		expect( consoleErrorMock ).toHaveBeenNthCalledWith( 1,
			'❌  Errors found. Run this script with an argument: `--fix` to resolve the issues automatically:'
		);
		expect( consoleErrorMock ).toHaveBeenNthCalledWith( 2, [
			'"dep2" in "fooPkg" in version "2.0.0" should be set to "^2.0.0".',
			'"dep2" in "barPkg" in version "2.0.0" should be set to "^2.0.0".'
		].join( '\n' ) );
	} );

	it( 'should log about dev dependencies using different version ranges when a package has no devDependencies', () => {
		files[ './package.json' ].devDependencies.dep2 = '^2.0.0';
		delete files[ './packages/foo/package.json' ].devDependencies;

		checkVersionMatch( options );

		expect( consoleLogMock ).toHaveBeenCalledTimes( 2 );
		expect( consoleErrorMock ).toHaveBeenCalledTimes( 2 );
		expect( processExitMock ).toHaveBeenCalledTimes( 1 );

		expect( consoleLogMock ).toHaveBeenNthCalledWith( 1, '🔍 Starting checking dependencies versions...' );
		expect( consoleLogMock ).toHaveBeenNthCalledWith( 2, '⬇️ Downloading "dep2" versions from npm...' );

		expect( consoleErrorMock ).toHaveBeenNthCalledWith( 1,
			'❌  Errors found. Run this script with an argument: `--fix` to resolve the issues automatically:'
		);
		expect( consoleErrorMock ).toHaveBeenNthCalledWith( 2, [
			'"dep2" in "rootPkg" in version "^2.0.0" should be set to "2.0.1".',
			'"dep2" in "barPkg" in version "2.0.0" should be set to "2.0.1".'
		].join( '\n' ) );
	} );

	it( 'should not log about dependencies using different version ranges when they are an exception', () => {
		options.versionExceptions = { 'dep3': '^' };
		files[ './package.json' ].dependencies.dep3 = '^3.0.2';
		files[ './packages/foo/package.json' ].dependencies.dep3 = '^3.0.2';
		files[ './packages/bar/package.json' ].dependencies.dep3 = '^3.0.2';

		checkVersionMatch( options );

		expect( consoleLogMock ).toHaveBeenCalledTimes( 2 );
		expect( consoleErrorMock ).toHaveBeenCalledTimes( 0 );
		expect( processExitMock ).toHaveBeenCalledTimes( 0 );

		expect( consoleLogMock ).toHaveBeenNthCalledWith( 1, '🔍 Starting checking dependencies versions...' );
		expect( consoleLogMock ).toHaveBeenNthCalledWith( 2, '✅  All dependencies are correct!' );
	} );

	it( 'should fix dependencies using different versions', () => {
		options.fix = true;

		files[ './package.json' ].dependencies.dep1 = '1.0.1';

		checkVersionMatch( options );

		expect( consoleLogMock ).toHaveBeenCalledTimes( 2 );
		expect( consoleErrorMock ).toHaveBeenCalledTimes( 0 );
		expect( processExitMock ).toHaveBeenCalledTimes( 0 );

		expect( consoleLogMock ).toHaveBeenNthCalledWith( 1, '🔍 Starting checking dependencies versions...' );
		expect( consoleLogMock ).toHaveBeenNthCalledWith( 2, '✅  All dependencies fixed!' );

		expect( fs.writeJSONSync ).toHaveBeenCalledTimes( 3 );

		expect( fs.writeJSONSync ).toHaveBeenNthCalledWith( 1,
			'./package.json',
			{
				name: 'rootPkg',
				dependencies: {
					dep1: '1.0.1'
				},
				devDependencies: {
					dep2: '2.0.0'
				}
			},
			{ 'spaces': 2 }
		);
		expect( fs.writeJSONSync ).toHaveBeenNthCalledWith( 2,
			'./packages/foo/package.json',
			{
				name: 'fooPkg',
				dependencies: {
					dep1: '1.0.1'
				},
				devDependencies: {
					dep2: '2.0.0'
				}
			},
			{ 'spaces': 2 }
		);
		expect( fs.writeJSONSync ).toHaveBeenNthCalledWith( 3,
			'./packages/bar/package.json',
			{
				name: 'barPkg',
				dependencies: {
					dep1: '1.0.1'
				},
				devDependencies: {
					dep2: '2.0.0'
				}
			},
			{ 'spaces': 2 }
		);
	} );

	it( 'should fix devDependencies using different versions', () => {
		options.fix = true;

		files[ './package.json' ].devDependencies.dep2 = '2.0.1';
		delete files[ './packages/foo/package.json' ].dependencies;

		checkVersionMatch( options );

		expect( consoleLogMock ).toHaveBeenCalledTimes( 2 );
		expect( consoleErrorMock ).toHaveBeenCalledTimes( 0 );
		expect( processExitMock ).toHaveBeenCalledTimes( 0 );

		expect( consoleLogMock ).toHaveBeenNthCalledWith( 1, '🔍 Starting checking dependencies versions...' );
		expect( consoleLogMock ).toHaveBeenNthCalledWith( 2, '✅  All dependencies fixed!' );

		expect( fs.writeJSONSync ).toHaveBeenCalledTimes( 3 );

		expect( fs.writeJSONSync ).toHaveBeenNthCalledWith( 1,
			'./package.json',
			{
				name: 'rootPkg',
				dependencies: {
					dep1: '1.0.0'
				},
				devDependencies: {
					dep2: '2.0.1'
				}
			},
			{ 'spaces': 2 }
		);
		expect( fs.writeJSONSync ).toHaveBeenNthCalledWith( 2,
			'./packages/foo/package.json',
			{
				name: 'fooPkg',
				devDependencies: {
					dep2: '2.0.1'
				}
			},
			{ 'spaces': 2 }
		);
		expect( fs.writeJSONSync ).toHaveBeenNthCalledWith( 3,
			'./packages/bar/package.json',
			{
				name: 'barPkg',
				dependencies: {
					dep1: '1.0.0'
				},
				devDependencies: {
					dep2: '2.0.1'
				}
			},
			{ 'spaces': 2 }
		);
	} );

	// TODO check

	it( 'should expect workspace:* for all dependencies when useWorkspace is and not devDependenciesFilter is provided', () => {
		options.useWorkspace = true;
		// Set all dependencies to workspace:* to match the expected behavior
		files[ './package.json' ].dependencies.dep1 = 'workspace:*';
		files[ './package.json' ].devDependencies.dep2 = 'workspace:*';
		files[ './packages/foo/package.json' ].dependencies.dep1 = 'workspace:*';
		files[ './packages/foo/package.json' ].devDependencies.dep2 = 'workspace:*';
		files[ './packages/bar/package.json' ].dependencies.dep1 = 'workspace:*';
		files[ './packages/bar/package.json' ].devDependencies.dep2 = 'workspace:*';

		checkVersionMatch( options );

		expect( consoleLogMock ).toHaveBeenCalledTimes( 2 );
		expect( consoleErrorMock ).toHaveBeenCalledTimes( 0 );
		expect( processExitMock ).toHaveBeenCalledTimes( 0 );

		expect( consoleLogMock ).toHaveBeenNthCalledWith( 1, '🔍 Starting checking dependencies versions...' );
		expect( consoleLogMock ).toHaveBeenNthCalledWith( 2, '✅  All dependencies are correct!' );
	} );

	it( 'should expect specific versions for dependencies that are not matching', () => {
		files[ './package.json' ].dependencies.dep1 = '1.0.1';
		files[ './packages/foo/package.json' ].dependencies.dep1 = '1.0.0';
		files[ './packages/bar/package.json' ].dependencies.dep1 = '1.0.0';

		checkVersionMatch( options );

		expect( consoleLogMock ).toHaveBeenCalledTimes( 1 );
		expect( consoleErrorMock ).toHaveBeenCalledTimes( 2 );
		expect( processExitMock ).toHaveBeenCalledTimes( 1 );

		expect( consoleLogMock ).toHaveBeenNthCalledWith( 1, '🔍 Starting checking dependencies versions...' );

		expect( consoleErrorMock ).toHaveBeenNthCalledWith( 1,
			'❌  Errors found. Run this script with an argument: `--fix` to resolve the issues automatically:'
		);
		expect( consoleErrorMock ).toHaveBeenNthCalledWith( 2, [
			'"dep1" in "fooPkg" in version "1.0.0" should be set to "1.0.1".',
			'"dep1" in "barPkg" in version "1.0.0" should be set to "1.0.1".'
		].join( '\n' ) );
	} );

	it( 'should test allowRanges logic for dependencies not in workspace filter', () => {
		// Use a filter that excludes dep3 so it uses the old logic with allowRanges
		options.devDependenciesFilter = depName => depName !== 'dep3';
		options.allowRanges = true;
		files[ './package.json' ].dependencies.dep3 = '^3.0.1';
		files[ './packages/foo/package.json' ].dependencies.dep3 = '^3.0.2';
		files[ './packages/bar/package.json' ].dependencies.dep3 = '^3.0.0';
		// Set all other dependencies to workspace:* to match the new expected behavior
		files[ './package.json' ].dependencies.dep1 = 'workspace:*';
		files[ './package.json' ].devDependencies.dep2 = 'workspace:*';
		files[ './packages/foo/package.json' ].dependencies.dep1 = 'workspace:*';
		files[ './packages/foo/package.json' ].devDependencies.dep2 = 'workspace:*';
		files[ './packages/bar/package.json' ].dependencies.dep1 = 'workspace:*';
		files[ './packages/bar/package.json' ].devDependencies.dep2 = 'workspace:*';

		checkVersionMatch( options );

		expect( consoleLogMock ).toHaveBeenCalledTimes( 1 );
		expect( consoleErrorMock ).toHaveBeenCalledTimes( 2 );
		expect( processExitMock ).toHaveBeenCalledTimes( 1 );

		expect( consoleLogMock ).toHaveBeenNthCalledWith( 1, '🔍 Starting checking dependencies versions...' );

		expect( consoleErrorMock ).toHaveBeenNthCalledWith( 1,
			'❌  Errors found. Run this script with an argument: `--fix` to resolve the issues automatically:'
		);
		expect( consoleErrorMock ).toHaveBeenNthCalledWith( 2, [
			'"dep3" in "rootPkg" in version "^3.0.1" should be set to "^3.0.2".',
			'"dep3" in "barPkg" in version "^3.0.0" should be set to "^3.0.2".'
		].join( '\n' ) );
	} );

	it( 'should test npm version downloading for dependencies not in workspace filter', () => {
		// Use a filter that excludes dep3 so it uses the old logic and downloads from npm
		options.devDependenciesFilter = depName => depName !== 'dep3';
		files[ './package.json' ].dependencies.dep3 = '^3.0.1';
		files[ './packages/foo/package.json' ].dependencies.dep3 = '^3.0.2';
		files[ './packages/bar/package.json' ].dependencies.dep3 = '^3.0.0';
		// Set all other dependencies to workspace:* to match the new expected behavior
		files[ './package.json' ].dependencies.dep1 = 'workspace:*';
		files[ './package.json' ].devDependencies.dep2 = 'workspace:*';
		files[ './packages/foo/package.json' ].dependencies.dep1 = 'workspace:*';
		files[ './packages/foo/package.json' ].devDependencies.dep2 = 'workspace:*';
		files[ './packages/bar/package.json' ].dependencies.dep1 = 'workspace:*';
		files[ './packages/bar/package.json' ].devDependencies.dep2 = 'workspace:*';

		checkVersionMatch( options );

		expect( consoleLogMock ).toHaveBeenCalledTimes( 2 );
		expect( consoleErrorMock ).toHaveBeenCalledTimes( 2 );
		expect( processExitMock ).toHaveBeenCalledTimes( 1 );

		expect( consoleLogMock ).toHaveBeenNthCalledWith( 1, '🔍 Starting checking dependencies versions...' );
		expect( consoleLogMock ).toHaveBeenNthCalledWith( 2, '⬇️ Downloading "dep3" versions from npm...' );

		expect( consoleErrorMock ).toHaveBeenNthCalledWith( 1,
			'❌  Errors found. Run this script with an argument: `--fix` to resolve the issues automatically:'
		);
		expect( consoleErrorMock ).toHaveBeenNthCalledWith( 2, [
			'"dep3" in "rootPkg" in version "^3.0.1" should be set to "3.0.2".',
			'"dep3" in "fooPkg" in version "^3.0.2" should be set to "3.0.2".',
			'"dep3" in "barPkg" in version "^3.0.0" should be set to "3.0.2".'
		].join( '\n' ) );
	} );

	it( 'should skip filtered devDependencies in fix mode', () => {
		options.fix = true;
		options.devDependenciesFilter = depName => depName !== 'dep2';
		// Set all other dependencies to workspace:* to match the new expected behavior
		files[ './package.json' ].dependencies.dep1 = 'workspace:*';
		files[ './package.json' ].devDependencies.dep2 = '2.0.1'; // This should be skipped
		files[ './packages/foo/package.json' ].dependencies.dep1 = 'workspace:*';
		files[ './packages/foo/package.json' ].devDependencies.dep2 = '2.0.0'; // This should be skipped
		files[ './packages/bar/package.json' ].dependencies.dep1 = 'workspace:*';
		files[ './packages/bar/package.json' ].devDependencies.dep2 = '2.0.0'; // This should be skipped

		checkVersionMatch( options );

		expect( consoleLogMock ).toHaveBeenCalledTimes( 2 );
		expect( consoleErrorMock ).toHaveBeenCalledTimes( 0 );
		expect( processExitMock ).toHaveBeenCalledTimes( 0 );

		expect( consoleLogMock ).toHaveBeenNthCalledWith( 1, '🔍 Starting checking dependencies versions...' );
		expect( consoleLogMock ).toHaveBeenNthCalledWith( 2, '✅  All dependencies fixed!' );

		expect( fs.writeJSONSync ).toHaveBeenCalledTimes( 3 );

		// dep2 should remain unchanged since it's filtered out
		expect( fs.writeJSONSync ).toHaveBeenNthCalledWith( 1,
			'./package.json',
			{
				name: 'rootPkg',
				dependencies: {
					dep1: 'workspace:*'
				},
				devDependencies: {
					dep2: '2.0.1' // Should remain unchanged due to filter
				}
			},
			{ 'spaces': 2 }
		);
	} );

	it( 'should expect workspace:* for dependencies that are not workspace:* when useWorkspace is true', () => {
		options.useWorkspace = true;
		files[ './package.json' ].dependencies.dep1 = 'workspace:*';
		files[ './packages/foo/package.json' ].dependencies.dep1 = '1.0.0';
		files[ './packages/bar/package.json' ].dependencies.dep1 = '1.0.0';

		checkVersionMatch( options );

		expect( consoleLogMock ).toHaveBeenCalledTimes( 1 );
		expect( consoleErrorMock ).toHaveBeenCalledTimes( 2 );
		expect( processExitMock ).toHaveBeenCalledTimes( 1 );

		expect( consoleLogMock ).toHaveBeenNthCalledWith( 1, '🔍 Starting checking dependencies versions...' );

		expect( consoleErrorMock ).toHaveBeenNthCalledWith( 1,
			'❌  Errors found. Run this script with an argument: `--fix` to resolve the issues automatically:'
		);
		expect( consoleErrorMock ).toHaveBeenNthCalledWith( 2, [
			'"dep2" in "rootPkg" in version "2.0.0" should be set to "workspace:*".',
			'"dep1" in "fooPkg" in version "1.0.0" should be set to "workspace:*".',
			'"dep2" in "fooPkg" in version "2.0.0" should be set to "workspace:*".',
			'"dep1" in "barPkg" in version "1.0.0" should be set to "workspace:*".',
			'"dep2" in "barPkg" in version "2.0.0" should be set to "workspace:*".'
		].join( '\n' ) );
	} );

	it( 'should fix dependencies to workspace:* when useWorkspace is true', () => {
		options.useWorkspace = true;
		options.fix = true;
		files[ './package.json' ].dependencies.dep1 = 'workspace:*';
		files[ './packages/foo/package.json' ].dependencies.dep1 = '1.0.0';
		files[ './packages/bar/package.json' ].dependencies.dep1 = '1.0.0';

		checkVersionMatch( options );

		expect( consoleLogMock ).toHaveBeenCalledTimes( 2 );
		expect( consoleErrorMock ).toHaveBeenCalledTimes( 0 );
		expect( processExitMock ).toHaveBeenCalledTimes( 0 );

		expect( consoleLogMock ).toHaveBeenNthCalledWith( 1, '🔍 Starting checking dependencies versions...' );
		expect( consoleLogMock ).toHaveBeenNthCalledWith( 2, '✅  All dependencies fixed!' );

		expect( fs.writeJSONSync ).toHaveBeenCalledTimes( 3 );

		expect( fs.writeJSONSync ).toHaveBeenNthCalledWith( 1,
			'./package.json',
			{
				name: 'rootPkg',
				dependencies: {
					dep1: 'workspace:*'
				},
				devDependencies: {
					dep2: 'workspace:*'
				}
			},
			{ 'spaces': 2 }
		);

		expect( fs.writeJSONSync ).toHaveBeenNthCalledWith( 2,
			'./packages/foo/package.json',
			{
				name: 'fooPkg',
				dependencies: {
					dep1: 'workspace:*'
				},
				devDependencies: {
					dep2: 'workspace:*'
				}
			},
			{ 'spaces': 2 }
		);

		expect( fs.writeJSONSync ).toHaveBeenNthCalledWith( 3,
			'./packages/bar/package.json',
			{
				name: 'barPkg',
				dependencies: {
					dep1: 'workspace:*'
				},
				devDependencies: {
					dep2: 'workspace:*'
				}
			},
			{ 'spaces': 2 }
		);
	} );
} );
