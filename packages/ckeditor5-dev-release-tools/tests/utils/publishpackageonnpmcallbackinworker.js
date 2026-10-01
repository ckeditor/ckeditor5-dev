/**
 * @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import fs from 'node:fs/promises';
import crypto from 'node:crypto';
import upath from 'upath';
import path from 'node:path';
import { execFile } from 'node:child_process';
import { pathToFileURL } from 'node:url';

// A regression test for publishing with npm Trusted Publishing (OIDC) through real worker threads.
//
// `executeInParallel()` copies the callback to a temporary module in `<cwd>/<workerDirectory>/`. Hence, the callback cannot
// import its helpers using relative paths. The test runs the callback from that generated module, with fake `circleci` and
// `npm` commands, and checks that each `npm publish` receives a fresh OIDC token.
//
// The working directory must be inside this repository, so the generated module can resolve
// `@ckeditor/ckeditor5-dev-release-tools` from `node_modules`. It is placed in `node_modules/.cache/`, which git ignores,
// so nothing is left in `git status` even when the test fails before the cleanup.
//
// `executeInParallel()` runs in a separate Node.js process. Vitest rewrites dynamic imports in the modules it loads,
// and a serialized callback with such code cannot run in a worker thread.
const PACKAGE_ROOT = upath.join( import.meta.dirname, '..', '..' );

// The fake `npm` and `circleci` commands are shell scripts. On Windows, `cmd.exe` would find the real `npm.cmd` instead.
describe.skipIf( process.platform === 'win32' )( 'publishPackageOnNpmCallback() in a worker thread (integration)', () => {
	let workspace, binDirectory, logFile;

	beforeEach( async () => {
		workspace = upath.join( 'node_modules', '.cache', `oidc-integration-${ crypto.randomUUID() }` );
		binDirectory = upath.join( PACKAGE_ROOT, workspace, 'bin' );
		logFile = upath.join( PACKAGE_ROOT, workspace, 'calls.log' );

		await fs.mkdir( binDirectory, { recursive: true } );

		// Returns a different token on each call. The process ID is unique for parallel calls.
		await writeExecutable( binDirectory, 'circleci', [
			'#!/bin/sh',
			`echo "circleci $*" >> "${ logFile }"`,
			'echo "token-$$"'
		] );

		await writeExecutable( binDirectory, 'npm', [
			'#!/bin/sh',
			`echo "npm $(basename "$PWD") $* NPM_ID_TOKEN=$NPM_ID_TOKEN" >> "${ logFile }"`
		] );

		for ( const name of [ 'package-a', 'package-b', 'package-c' ] ) {
			const packagePath = upath.join( PACKAGE_ROOT, workspace, 'packages', name );

			await fs.mkdir( packagePath, { recursive: true } );
			// `private: true` makes the real npm refuse to publish (`EPRIVATE`) before it sends anything to the registry,
			// in case the fake `npm` command is not used.
			await fs.writeFile( upath.join( packagePath, 'package.json' ), JSON.stringify( { name, version: '1.0.0', private: true } ) );
		}

		vi.stubEnv( 'PATH', `${ binDirectory }${ path.delimiter }${ process.env.PATH }` );
		vi.stubEnv( 'CIRCLECI', 'true' );
		vi.stubEnv( 'NPM_ID_TOKEN', 'stale-token' );
	} );

	afterEach( async () => {
		await fs.rm( upath.join( PACKAGE_ROOT, workspace ), { recursive: true, force: true } );
	} );

	it( 'should pass a fresh OIDC token to each `npm publish` call', async () => {
		const runner = upath.join( PACKAGE_ROOT, workspace, 'runner.mjs' );
		const libUrl = file => pathToFileURL( upath.join( PACKAGE_ROOT, 'lib', 'utils', file ) ).href;

		await fs.writeFile( runner, [
			`import executeInParallel from '${ libUrl( 'executeinparallel.js' ) }';`,
			`import publishPackageOnNpmCallback from '${ libUrl( 'publishpackageonnpmcallback.js' ) }';`,
			'await executeInParallel( {',
			`	cwd: '${ PACKAGE_ROOT }',`,
			`	packagesDirectory: '${ upath.join( workspace, 'packages' ) }',`,
			`	workerDirectory: '${ workspace }',`,
			'	taskToExecute: publishPackageOnNpmCallback,',
			'	taskOptions: { npmTag: \'nightly\', useOidc: true },',
			'	concurrency: 2',
			'} );'
		].join( '\n' ) );

		await new Promise( ( resolve, reject ) => {
			// A second safety layer: even if the real npm runs, it cannot reach a registry.
			const env = { ...process.env, npm_config_registry: 'http://127.0.0.1:1' };

			execFile( process.execPath, [ runner ], { cwd: PACKAGE_ROOT, env }, error => error ? reject( error ) : resolve() );
		} );

		const calls = ( await fs.readFile( logFile, 'utf-8' ) ).trim().split( '\n' );
		const npmCalls = calls.filter( line => line.startsWith( 'npm ' ) );
		const circleciCalls = calls.filter( line => line.startsWith( 'circleci ' ) );

		expect( circleciCalls ).toHaveLength( 3 );
		expect( circleciCalls ).toEqual( Array( 3 ).fill( 'circleci run oidc get --claims {"aud":"npm:registry.npmjs.org"}' ) );

		expect( npmCalls ).toHaveLength( 3 );
		expect( npmCalls.map( line => line.split( ' ' )[ 1 ] ).sort() ).toEqual( [ 'package-a', 'package-b', 'package-c' ] );

		for ( const line of npmCalls ) {
			expect( line ).toMatch( / publish --access=public --tag nightly NPM_ID_TOKEN=token-\d+$/ );
		}

		const tokens = npmCalls.map( line => line.split( 'NPM_ID_TOKEN=' )[ 1 ] );

		expect( new Set( tokens ).size ).toEqual( 3 );
		expect( tokens ).not.toContain( 'stale-token' );

		// A successfully published package is removed.
		await expect( fs.readdir( upath.join( PACKAGE_ROOT, workspace, 'packages' ) ) ).resolves.toEqual( [] );
	} );
} );

async function writeExecutable( directory, name, lines ) {
	await fs.writeFile( upath.join( directory, name ), lines.join( '\n' ) + '\n', { mode: 0o755 } );
}
