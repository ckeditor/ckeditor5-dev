/**
 * @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';
import fs from 'node:fs';
import { spawn } from 'node:child_process';
import { globSync } from 'glob';
import transformFileOptionToTestGlob from '../../lib/utils/transformfileoptiontotestglob.js';

const stubs = vi.hoisted( () => ( {
	spawn: {
		call: vi.fn()
	},
	devUtilsLogger: {
		info: vi.fn(),
		warning: vi.fn(),
		error: vi.fn()
	}
} ) );

vi.mock( 'node:child_process', () => ( {
	spawn: vi.fn( ( ...args ) => {
		stubs.spawn.call( ...args );

		const callbacks = {};

		return {
			on: ( eventName, callback ) => {
				callbacks[ eventName ] = callback;
			},
			emit: ( eventName, ...eventArgs ) => {
				if ( callbacks[ eventName ] ) {
					callbacks[ eventName ]( ...eventArgs );
				}
			}
		};
	} )
} ) );

vi.mock( 'node:util', () => ( {
	styleText: vi.fn( ( _style, text ) => text )
} ) );

vi.mock( 'node:fs' );
vi.mock( 'mkdirp' );
vi.mock( 'glob' );
vi.mock( '@ckeditor/ckeditor5-dev-utils', () => ( {
	logger: vi.fn( () => stubs.devUtilsLogger )
} ) );
vi.mock( '../../lib/utils/transformfileoptiontotestglob.js' );

describe( 'runAutomatedTests()', () => {
	let runAutomatedTests;

	beforeEach( async () => {
		vi.spyOn( process, 'cwd' ).mockReturnValue( '/workspace' );
		stubs.spawn.call.mockReset();

		runAutomatedTests = ( await import( '../../lib/tasks/runautomatedtests.js' ) ).default;
	} );

	it( 'throws when files are not specified', async () => {
		await expect( runAutomatedTests( {} ) )
			.rejects.toThrow( 'Test runner requires files to test. `options.files` has to be a non-empty array.' );
	} );

	it( 'throws when specified files are invalid', async () => {
		const options = {
			files: [
				'basic-foo',
				'bar-core'
			]
		};

		vi.mocked( transformFileOptionToTestGlob )
			.mockReturnValueOnce( [
				'/workspace/packages/ckeditor5-basic-foo/tests/**/*.js',
				'/workspace/packages/ckeditor-basic-foo/tests/**/*.js'
			] )
			.mockReturnValueOnce( [
				'/workspace/packages/ckeditor5-bar-core/tests/**/*.js',
				'/workspace/packages/ckeditor-bar-core/tests/**/*.js'
			] );

		vi.mocked( globSync ).mockReturnValue( [] );

		await expect( runAutomatedTests( options ) )
			.rejects.toThrow( 'No test files found. Specified patterns are invalid.' );

		expect( stubs.devUtilsLogger.warning ).toHaveBeenCalledTimes( 2 );
		expect( stubs.devUtilsLogger.warning ).toHaveBeenCalledWith( 'Pattern "basic-foo" does not match any file.' );
		expect( stubs.devUtilsLogger.warning ).toHaveBeenCalledWith( 'Pattern "bar-core" does not match any file.' );
	} );

	it( 'should run Vitest for the selected package', async () => {
		const options = {
			files: [ 'engine' ],
			watch: false,
			coverage: false
		};

		vi.mocked( transformFileOptionToTestGlob ).mockReturnValue( [
			'/workspace/packages/ckeditor5-engine/tests/**/*.js'
		] );
		vi.mocked( globSync ).mockReturnValue( [
			'/workspace/packages/ckeditor5-engine/tests/model/model.js'
		] );

		const promise = runAutomatedTests( options );
		await new Promise( resolve => setTimeout( resolve ) );

		const [ subprocess ] = vi.mocked( spawn ).mock.results.map( result => result.value );
		subprocess.emit( 'close', 0 );

		await promise;

		expect( stubs.spawn.call ).toHaveBeenCalledExactlyOnceWith(
			'pnpm',
			[
				'vitest',
				'--run',
				'tests/model/model.js'
			],
			{
				stdio: 'inherit',
				cwd: '/workspace/packages/ckeditor5-engine',
				shell: process.platform === 'win32'
			}
		);
		expect( vi.mocked( fs ).writeFileSync ).not.toHaveBeenCalled();
	} );

	it( 'should pass --watch flag to Vitest when watch mode is enabled', async () => {
		const options = {
			files: [ 'engine' ],
			watch: true,
			coverage: false
		};

		vi.mocked( transformFileOptionToTestGlob ).mockReturnValue( [
			'/workspace/packages/ckeditor5-engine/tests/**/*.js'
		] );
		vi.mocked( globSync ).mockReturnValue( [
			'/workspace/packages/ckeditor5-engine/tests/model/model.js'
		] );

		const promise = runAutomatedTests( options );
		await new Promise( resolve => setTimeout( resolve ) );

		const [ subprocess ] = vi.mocked( spawn ).mock.results.map( result => result.value );
		subprocess.emit( 'close', 0 );

		await promise;

		expect( stubs.spawn.call ).toHaveBeenCalledExactlyOnceWith(
			'pnpm',
			[
				'vitest',
				'--watch',
				'tests/model/model.js'
			],
			expect.objectContaining( { cwd: '/workspace/packages/ckeditor5-engine' } )
		);
	} );

	it( 'should pass coverage flags to Vitest and merge coverage with nyc', async () => {
		const options = {
			files: [ 'engine' ],
			watch: false,
			coverage: true
		};

		vi.mocked( transformFileOptionToTestGlob ).mockReturnValue( [
			'/workspace/packages/ckeditor5-engine/tests/**/*.js'
		] );
		vi.mocked( globSync ).mockReturnValue( [
			'/workspace/packages/ckeditor5-engine/tests/model/model.js'
		] );
		vi.mocked( fs ).existsSync.mockReturnValue( true );

		const promise = runAutomatedTests( options );
		await new Promise( resolve => setTimeout( resolve ) );

		// First spawn: vitest project run.
		const [ vitestProcess ] = vi.mocked( spawn ).mock.results.map( r => r.value );
		vitestProcess.emit( 'close', 0 );

		await new Promise( resolve => setTimeout( resolve ) );

		// Second spawn: nyc report merge.
		const [ , nycProcess ] = vi.mocked( spawn ).mock.results.map( r => r.value );
		nycProcess.emit( 'close', 0 );

		await promise;

		// Vitest was called with per-project coverage directory and forced reporters.
		expect( stubs.spawn.call ).toHaveBeenNthCalledWith(
			1,
			'pnpm',
			[
				'vitest',
				'--run',
				'--coverage.enabled',
				'--coverage.reportsDirectory',
				'/workspace/coverage-vitest/engine',
				'--coverage.reporter',
				'json',
				'--coverage.reporter',
				'lcovonly',
				'--coverage.reporter',
				'html',
				'tests/model/model.js'
			],
			expect.objectContaining( { cwd: '/workspace/packages/ckeditor5-engine' } )
		);

		// coverage-final.json was copied into .nyc_output.
		expect( vi.mocked( fs ).existsSync ).toHaveBeenCalledWith(
			'/workspace/coverage-vitest/engine/coverage-final.json'
		);
		expect( vi.mocked( fs ).copyFileSync ).toHaveBeenCalledWith(
			'/workspace/coverage-vitest/engine/coverage-final.json',
			'/workspace/coverage-vitest/.nyc_output/engine.json'
		);

		// nyc report was called with correct reporters.
		expect( stubs.spawn.call ).toHaveBeenNthCalledWith(
			2,
			'pnpx',
			[
				'nyc', 'report',
				'--temp-dir', '/workspace/coverage-vitest/.nyc_output',
				'--report-dir', '/workspace/coverage-vitest',
				'--reporter', 'html',
				'--reporter', 'json',
				'--reporter', 'lcovonly',
				'--reporter', 'text-summary'
			],
			expect.objectContaining( { stdio: 'inherit', cwd: '/workspace' } )
		);

		// Log message was printed.
		expect( stubs.devUtilsLogger.info ).toHaveBeenCalled();
	} );

	it( 'should reject when Vitest process exits with non-zero code', async () => {
		const options = {
			files: [ 'engine' ],
			watch: false,
			coverage: false
		};

		vi.mocked( transformFileOptionToTestGlob ).mockReturnValue( [
			'/workspace/packages/ckeditor5-engine/tests/**/*.js'
		] );
		vi.mocked( globSync ).mockReturnValue( [
			'/workspace/packages/ckeditor5-engine/tests/model/model.js'
		] );

		const promise = runAutomatedTests( options );
		await new Promise( resolve => setTimeout( resolve ) );

		const [ subprocess ] = vi.mocked( spawn ).mock.results.map( result => result.value );
		subprocess.emit( 'close', 1 );

		await expect( promise ).rejects.toThrow( 'Vitest finished with "1" code.' );
	} );

	// Regression: ckeditor/ckeditor5-commercial#10462. Going through the workspace config with
	// `--project <name>` triggers a hang in Vitest browser mode whenever more than one test file
	// runs. Spawning per-package (cwd = package root, no --project flag) side-steps that path.
	it( 'should spawn Vitest with cwd set to the package root and no --project flag', async () => {
		const options = {
			files: [ 'engine' ],
			watch: false,
			coverage: false
		};

		vi.mocked( transformFileOptionToTestGlob ).mockReturnValue( [
			'/workspace/packages/ckeditor5-engine/tests/**/*.js'
		] );
		vi.mocked( globSync ).mockReturnValue( [
			'/workspace/packages/ckeditor5-engine/tests/model/model.js',
			'/workspace/packages/ckeditor5-engine/tests/view/view.js'
		] );

		const promise = runAutomatedTests( options );
		await new Promise( resolve => setTimeout( resolve ) );

		const [ subprocess ] = vi.mocked( spawn ).mock.results.map( result => result.value );
		subprocess.emit( 'close', 0 );

		await promise;

		const [ [ command, args, spawnOptions ] ] = stubs.spawn.call.mock.calls;

		expect( command ).to.equal( 'pnpm' );
		expect( spawnOptions ).toEqual( expect.objectContaining( {
			cwd: '/workspace/packages/ckeditor5-engine'
		} ) );
		expect( args ).not.toContain( '--project' );
		// File paths are passed relative to the package root, not the workspace root.
		expect( args ).toEqual( expect.arrayContaining( [
			'tests/model/model.js',
			'tests/view/view.js'
		] ) );
		expect( args ).not.toEqual( expect.arrayContaining( [
			expect.stringMatching( /^packages\// )
		] ) );
	} );

	// Regression: ckeditor/ckeditor5-commercial#10462. Running per-package means the package's
	// own `vitest.config.ts` wins, and its `text`/`html` reporters are not enough for the CI
	// merge step — so the wrapper forces `json` (nyc) and `lcovonly` (lcov collation) on top.
	it( 'should force json, lcovonly and html reporters when coverage is enabled', async () => {
		const options = {
			files: [ 'engine' ],
			watch: false,
			coverage: true
		};

		vi.mocked( transformFileOptionToTestGlob ).mockReturnValue( [
			'/workspace/packages/ckeditor5-engine/tests/**/*.js'
		] );
		vi.mocked( globSync ).mockReturnValue( [
			'/workspace/packages/ckeditor5-engine/tests/model/model.js'
		] );
		vi.mocked( fs ).existsSync.mockReturnValue( false );

		const promise = runAutomatedTests( options );
		await new Promise( resolve => setTimeout( resolve ) );

		const [ vitestProcess ] = vi.mocked( spawn ).mock.results.map( r => r.value );
		vitestProcess.emit( 'close', 0 );

		await new Promise( resolve => setTimeout( resolve ) );

		const [ , nycProcess ] = vi.mocked( spawn ).mock.results.map( r => r.value );
		nycProcess.emit( 'close', 0 );

		await promise;

		const [ [ , args ] ] = stubs.spawn.call.mock.calls;

		expect( args ).toEqual( expect.arrayContaining( [
			'--coverage.reporter', 'json',
			'--coverage.reporter', 'lcovonly',
			'--coverage.reporter', 'html'
		] ) );
	} );

	// -- Multiple Vitest projects tests -------------------------------------------------------------

	it( 'should run each Vitest project in a separate process with selected files', async () => {
		const options = {
			files: [ 'utils', 'engine' ],
			watch: false,
			coverage: false
		};

		vi.mocked( transformFileOptionToTestGlob )
			.mockReturnValueOnce( [
				'/workspace/packages/ckeditor5-utils/tests/**/*.js',
				'/workspace/external/ckeditor5/packages/ckeditor5-utils/tests/**/*.js'
			] )
			.mockReturnValueOnce( [
				'/workspace/packages/ckeditor5-engine/tests/**/*.js',
				'/workspace/external/ckeditor5/packages/ckeditor5-engine/tests/**/*.js'
			] );
		vi.mocked( globSync )
			.mockReturnValueOnce( [] )
			.mockReturnValueOnce( [ '/workspace/external/ckeditor5/packages/ckeditor5-utils/tests/first.js' ] )
			.mockReturnValueOnce( [] )
			.mockReturnValueOnce( [ '/workspace/external/ckeditor5/packages/ckeditor5-engine/tests/model.js' ] );

		const promise = runAutomatedTests( options );
		await new Promise( resolve => setTimeout( resolve ) );

		const [ firstSubprocess ] = vi.mocked( spawn ).mock.results.map( result => result.value );
		firstSubprocess.emit( 'close', 0 );

		await new Promise( resolve => setTimeout( resolve ) );
		const [ , secondSubprocess ] = vi.mocked( spawn ).mock.results.map( result => result.value );
		secondSubprocess.emit( 'close', 0 );

		await promise;

		expect( stubs.spawn.call ).toHaveBeenNthCalledWith(
			1,
			'pnpm',
			[
				'vitest',
				'--run',
				'tests/first.js'
			],
			{
				stdio: 'inherit',
				cwd: '/workspace/external/ckeditor5/packages/ckeditor5-utils',
				shell: process.platform === 'win32'
			}
		);
		expect( stubs.spawn.call ).toHaveBeenNthCalledWith(
			2,
			'pnpm',
			[
				'vitest',
				'--run',
				'tests/model.js'
			],
			{
				stdio: 'inherit',
				cwd: '/workspace/external/ckeditor5/packages/ckeditor5-engine',
				shell: process.platform === 'win32'
			}
		);
	} );

	it( 'should throw when watch mode is used with multiple Vitest projects', async () => {
		const options = {
			files: [ 'utils', 'engine' ],
			watch: true,
			coverage: false
		};

		vi.mocked( transformFileOptionToTestGlob )
			.mockReturnValueOnce( [
				'/workspace/packages/ckeditor5-utils/tests/**/*.js',
				'/workspace/external/ckeditor5/packages/ckeditor5-utils/tests/**/*.js'
			] )
			.mockReturnValueOnce( [
				'/workspace/packages/ckeditor5-engine/tests/**/*.js',
				'/workspace/external/ckeditor5/packages/ckeditor5-engine/tests/**/*.js'
			] );
		vi.mocked( globSync )
			.mockReturnValueOnce( [] )
			.mockReturnValueOnce( [ '/workspace/external/ckeditor5/packages/ckeditor5-utils/tests/first.js' ] )
			.mockReturnValueOnce( [] )
			.mockReturnValueOnce( [ '/workspace/external/ckeditor5/packages/ckeditor5-engine/tests/model.js' ] );

		await expect( runAutomatedTests( options ) ).rejects.toThrow(
			'Watch mode cannot be used for multiple Vitest projects in one run. ' +
			'Run watch mode separately for each Vitest project.'
		);

		expect( stubs.spawn.call ).not.toHaveBeenCalled();
	} );

	it( 'should continue running remaining Vitest projects after a project failure', async () => {
		const options = {
			files: [ 'utils', 'engine' ],
			watch: false,
			coverage: false
		};

		vi.mocked( transformFileOptionToTestGlob )
			.mockReturnValueOnce( [
				'/workspace/packages/ckeditor5-utils/tests/**/*.js',
				'/workspace/external/ckeditor5/packages/ckeditor5-utils/tests/**/*.js'
			] )
			.mockReturnValueOnce( [
				'/workspace/packages/ckeditor5-engine/tests/**/*.js',
				'/workspace/external/ckeditor5/packages/ckeditor5-engine/tests/**/*.js'
			] );
		vi.mocked( globSync )
			.mockReturnValueOnce( [] )
			.mockReturnValueOnce( [ '/workspace/external/ckeditor5/packages/ckeditor5-utils/tests/first.js' ] )
			.mockReturnValueOnce( [] )
			.mockReturnValueOnce( [ '/workspace/external/ckeditor5/packages/ckeditor5-engine/tests/model.js' ] );

		const promise = runAutomatedTests( options );
		await new Promise( resolve => setTimeout( resolve ) );

		const [ firstSubprocess ] = vi.mocked( spawn ).mock.results.map( result => result.value );
		firstSubprocess.emit( 'close', 1 );

		await new Promise( resolve => setTimeout( resolve ) );
		const [ , secondSubprocess ] = vi.mocked( spawn ).mock.results.map( result => result.value );
		secondSubprocess.emit( 'close', 0 );

		await expect( promise ).rejects.toThrow( 'Vitest finished with "1" code.' );
		expect( stubs.spawn.call ).toHaveBeenCalledTimes( 2 );
	} );

	it( 'should merge Vitest coverage even when a project fails', async () => {
		const options = {
			files: [ 'utils', 'engine' ],
			watch: false,
			coverage: true
		};

		vi.mocked( transformFileOptionToTestGlob )
			.mockReturnValueOnce( [
				'/workspace/packages/ckeditor5-utils/tests/**/*.js',
				'/workspace/external/ckeditor5/packages/ckeditor5-utils/tests/**/*.js'
			] )
			.mockReturnValueOnce( [
				'/workspace/packages/ckeditor5-engine/tests/**/*.js',
				'/workspace/external/ckeditor5/packages/ckeditor5-engine/tests/**/*.js'
			] );
		vi.mocked( globSync )
			.mockReturnValueOnce( [] )
			.mockReturnValueOnce( [ '/workspace/external/ckeditor5/packages/ckeditor5-utils/tests/first.js' ] )
			.mockReturnValueOnce( [] )
			.mockReturnValueOnce( [ '/workspace/external/ckeditor5/packages/ckeditor5-engine/tests/model.js' ] );
		vi.mocked( fs ).existsSync.mockReturnValue( false );

		const promise = runAutomatedTests( options );
		await new Promise( resolve => setTimeout( resolve ) );

		const [ firstSubprocess ] = vi.mocked( spawn ).mock.results.map( result => result.value );
		firstSubprocess.emit( 'close', 1 );

		await new Promise( resolve => setTimeout( resolve ) );
		const [ , secondSubprocess ] = vi.mocked( spawn ).mock.results.map( result => result.value );
		secondSubprocess.emit( 'close', 0 );

		await new Promise( resolve => setTimeout( resolve ) );
		const [ , , nycProcess ] = vi.mocked( spawn ).mock.results.map( result => result.value );
		nycProcess.emit( 'close', 0 );

		await expect( promise ).rejects.toThrow( 'Vitest finished with "1" code.' );
		expect( stubs.spawn.call ).toHaveBeenCalledTimes( 3 );
		expect( stubs.spawn.call ).toHaveBeenNthCalledWith(
			3,
			'pnpx',
			expect.arrayContaining( [ 'nyc', 'report' ] ),
			expect.objectContaining( { cwd: '/workspace' } )
		);
	} );

	// -- Edge cases -------------------------------------------------------------------------------

	it( 'should resolve when Vitest exits with code 130 (SIGINT)', async () => {
		const options = {
			files: [ 'engine' ],
			watch: false,
			coverage: false
		};

		vi.mocked( transformFileOptionToTestGlob ).mockReturnValue( [
			'/workspace/packages/ckeditor5-engine/tests/**/*.js'
		] );
		vi.mocked( globSync ).mockReturnValue( [
			'/workspace/packages/ckeditor5-engine/tests/model/model.js'
		] );

		const promise = runAutomatedTests( options );
		await new Promise( resolve => setTimeout( resolve ) );

		const [ subprocess ] = vi.mocked( spawn ).mock.results.map( result => result.value );
		subprocess.emit( 'close', 130 );

		await promise;
	} );

	it( 'should reject when spawn emits an error event', async () => {
		const options = {
			files: [ 'engine' ],
			watch: false,
			coverage: false
		};

		vi.mocked( transformFileOptionToTestGlob ).mockReturnValue( [
			'/workspace/packages/ckeditor5-engine/tests/**/*.js'
		] );
		vi.mocked( globSync ).mockReturnValue( [
			'/workspace/packages/ckeditor5-engine/tests/model/model.js'
		] );

		const promise = runAutomatedTests( options );
		await new Promise( resolve => setTimeout( resolve ) );

		const [ subprocess ] = vi.mocked( spawn ).mock.results.map( result => result.value );
		subprocess.emit( 'error', new Error( 'spawn ENOENT' ) );

		await expect( promise ).rejects.toThrow( 'spawn ENOENT' );
	} );

	it( 'should skip copying coverage-final.json when the file does not exist', async () => {
		const options = {
			files: [ 'engine' ],
			watch: false,
			coverage: true
		};

		vi.mocked( transformFileOptionToTestGlob ).mockReturnValue( [
			'/workspace/packages/ckeditor5-engine/tests/**/*.js'
		] );
		vi.mocked( globSync ).mockReturnValue( [
			'/workspace/packages/ckeditor5-engine/tests/model/model.js'
		] );
		vi.mocked( fs ).existsSync.mockReturnValue( false );

		const promise = runAutomatedTests( options );
		await new Promise( resolve => setTimeout( resolve ) );

		const [ vitestProcess ] = vi.mocked( spawn ).mock.results.map( r => r.value );
		vitestProcess.emit( 'close', 0 );

		await new Promise( resolve => setTimeout( resolve ) );

		const [ , nycProcess ] = vi.mocked( spawn ).mock.results.map( r => r.value );
		nycProcess.emit( 'close', 0 );

		await promise;

		expect( vi.mocked( fs ).copyFileSync ).not.toHaveBeenCalled();
	} );

	it( 'should reject when nyc report fails', async () => {
		const options = {
			files: [ 'engine' ],
			watch: false,
			coverage: true
		};

		vi.mocked( transformFileOptionToTestGlob ).mockReturnValue( [
			'/workspace/packages/ckeditor5-engine/tests/**/*.js'
		] );
		vi.mocked( globSync ).mockReturnValue( [
			'/workspace/packages/ckeditor5-engine/tests/model/model.js'
		] );
		vi.mocked( fs ).existsSync.mockReturnValue( false );

		const promise = runAutomatedTests( options );
		await new Promise( resolve => setTimeout( resolve ) );

		const [ vitestProcess ] = vi.mocked( spawn ).mock.results.map( r => r.value );
		vitestProcess.emit( 'close', 0 );

		await new Promise( resolve => setTimeout( resolve ) );

		const [ , nycProcess ] = vi.mocked( spawn ).mock.results.map( r => r.value );
		nycProcess.emit( 'close', 1 );

		await expect( promise ).rejects.toThrow( 'nyc report finished with "1" code.' );
	} );

	it( 'should reject when nyc spawn emits an error', async () => {
		const options = {
			files: [ 'engine' ],
			watch: false,
			coverage: true
		};

		vi.mocked( transformFileOptionToTestGlob ).mockReturnValue( [
			'/workspace/packages/ckeditor5-engine/tests/**/*.js'
		] );
		vi.mocked( globSync ).mockReturnValue( [
			'/workspace/packages/ckeditor5-engine/tests/model/model.js'
		] );
		vi.mocked( fs ).existsSync.mockReturnValue( false );

		const promise = runAutomatedTests( options );
		await new Promise( resolve => setTimeout( resolve ) );

		const [ vitestProcess ] = vi.mocked( spawn ).mock.results.map( r => r.value );
		vitestProcess.emit( 'close', 0 );

		await new Promise( resolve => setTimeout( resolve ) );

		const [ , nycProcess ] = vi.mocked( spawn ).mock.results.map( r => r.value );
		nycProcess.emit( 'error', new Error( 'nyc ENOENT' ) );

		await expect( promise ).rejects.toThrow( 'nyc ENOENT' );
	} );

	it( 'should throw when a test file path does not contain /tests/ segment', async () => {
		const options = {
			files: [ 'engine' ],
			watch: false,
			coverage: false
		};

		vi.mocked( transformFileOptionToTestGlob ).mockReturnValue( [
			'/workspace/packages/ckeditor5-engine/tests/**/*.js'
		] );
		vi.mocked( globSync ).mockReturnValue( [
			'/workspace/packages/ckeditor5-engine/src/model.js'
		] );

		await expect( runAutomatedTests( options ) ).rejects.toThrow(
			'Cannot determine package root for "/workspace/packages/ckeditor5-engine/src/model.js".'
		);
	} );
} );
