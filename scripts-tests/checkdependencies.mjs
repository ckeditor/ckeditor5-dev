/**
 * @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { afterEach, describe, expect, it } from 'vitest';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import upath from 'upath';

/**
 * Regression tests for the dependency checks (`check-dependencies` and `check-versions-match`).
 *
 * A clean tree proves only that the current manifests pass, so each test plants a defect in
 * a real file (restored afterwards), runs the relevant check in a subprocess, and asserts
 * that the defect is reported. This guards against silent configuration regressions in
 * `knip.ts`, `.syncpackrc.mjs`, and the ESLint setup.
 */

const ROOT_DIRECTORY = upath.join( import.meta.dirname, '..' );

const PATHS = {
	devUtilsPackageJson: upath.join( ROOT_DIRECTORY, 'packages', 'ckeditor5-dev-utils', 'package.json' ),
	devUtilsIndex: upath.join( ROOT_DIRECTORY, 'packages', 'ckeditor5-dev-utils', 'src', 'index.ts' ),
	releaseToolsTask: upath.join( ROOT_DIRECTORY, 'packages', 'ckeditor5-dev-release-tools', 'lib', 'tasks', 'updateversions.js' ),
	manualServerCss: upath.join( ROOT_DIRECTORY, 'packages', 'ckeditor5-dev-manual-server', 'theme', 'catalog.css' ),
	changelogPackageJson: upath.join( ROOT_DIRECTORY, 'packages', 'ckeditor5-dev-changelog', 'package.json' )
};

const KNIP_TIMEOUT = 120000;

const originalContents = new Map();

function mutateFile( filePath, callback ) {
	const content = fs.readFileSync( filePath, 'utf-8' );

	if ( !originalContents.has( filePath ) ) {
		originalContents.set( filePath, content );
	}

	fs.writeFileSync( filePath, callback( content ) );
}

afterEach( () => {
	for ( const [ filePath, content ] of originalContents ) {
		fs.writeFileSync( filePath, content );
	}

	originalContents.clear();
} );

function runBinary( binaryName, args ) {
	return spawnSync(
		upath.join( ROOT_DIRECTORY, 'node_modules', '.bin', binaryName ),
		args,
		{
			cwd: ROOT_DIRECTORY,
			encoding: 'utf-8'
		}
	);
}

function runKnip( { production = false } = {} ) {
	const args = [ '--dependencies', '--no-config-hints' ];

	if ( production ) {
		args.push( '--production', '--strict' );
	}

	return runBinary( 'knip', args );
}

function runVersionsMatch( { fix = false } = {} ) {
	return spawnSync(
		process.execPath,
		[
			upath.join( ROOT_DIRECTORY, 'scripts', 'ci', 'check-dependencies-versions-match.mjs' ),
			...fix ? [ '--fix' ] : []
		],
		{
			cwd: ROOT_DIRECTORY,
			encoding: 'utf-8'
		}
	);
}

describe( 'check-dependencies', () => {
	it( 'passes on a clean tree in both modes', { timeout: KNIP_TIMEOUT * 2 }, () => {
		const defaultResult = runKnip();
		const productionResult = runKnip( { production: true } );

		expect( defaultResult.status, defaultResult.stdout + defaultResult.stderr ).toEqual( 0 );
		expect( productionResult.status, productionResult.stdout + productionResult.stderr ).toEqual( 0 );
	} );

	it( 'reports a missing production dependency', { timeout: KNIP_TIMEOUT }, () => {
		// The `simple-git` package is imported in `src/` and is not declared in the root
		// `package.json`, so the ancestor workspace fallback cannot mask its removal.
		mutateFile( PATHS.devUtilsPackageJson, content => {
			const packageJson = JSON.parse( content );

			expect( packageJson.dependencies[ 'simple-git' ] ).toBeDefined();
			delete packageJson.dependencies[ 'simple-git' ];

			return JSON.stringify( packageJson, null, 2 ) + '\n';
		} );

		const { status, stdout } = runKnip();

		expect( status ).not.toEqual( 0 );
		expect( stdout ).toContain( 'simple-git' );
	} );

	it( 'reports an unused dependency', { timeout: KNIP_TIMEOUT }, () => {
		mutateFile( PATHS.devUtilsPackageJson, content => {
			const packageJson = JSON.parse( content );

			packageJson.dependencies[ 'totally-unused-package' ] = '1.0.0';

			return JSON.stringify( packageJson, null, 2 ) + '\n';
		} );

		const { status, stdout } = runKnip();

		expect( status ).not.toEqual( 0 );
		expect( stdout ).toContain( 'Unused' );
		expect( stdout ).toContain( 'totally-unused-package' );
	} );

	it( 'reports a production dependency misplaced in `devDependencies`', { timeout: KNIP_TIMEOUT }, () => {
		// The `simple-git` package is imported in `src/`, so it must not live in `devDependencies`.
		mutateFile( PATHS.devUtilsPackageJson, content => {
			const packageJson = JSON.parse( content );
			const version = packageJson.dependencies[ 'simple-git' ];

			expect( version ).toBeDefined();
			delete packageJson.dependencies[ 'simple-git' ];
			packageJson.devDependencies[ 'simple-git' ] = version;

			return JSON.stringify( packageJson, null, 2 ) + '\n';
		} );

		const { status, stdout } = runKnip( { production: true } );

		expect( status ).not.toEqual( 0 );
		expect( stdout ).toContain( 'simple-git' );
	} );

	it( 'reports a package used only through a dynamic import', { timeout: KNIP_TIMEOUT }, () => {
		mutateFile( PATHS.releaseToolsTask, content => {
			return content + '\n\nexport async function testDynamicImportProbe() {\n' +
				'\treturn import( \'totally-bogus-dynamic-package\' );\n' +
				'}\n';
		} );

		const { status, stdout } = runKnip();

		expect( status ).not.toEqual( 0 );
		expect( stdout ).toContain( 'totally-bogus-dynamic-package' );
	} );

	it( 'reports a package imported only in CSS', { timeout: KNIP_TIMEOUT }, () => {
		mutateFile( PATHS.manualServerCss, content => {
			return content + '\n@import "totally-bogus-css-package";\n';
		} );

		const { status, stdout } = runKnip();

		expect( status ).not.toEqual( 0 );
		expect( stdout ).toContain( 'totally-bogus-css-package' );
	} );
} );

describe( 'self-import check (ESLint)', () => {
	it( 'reports an import from a package into itself', { timeout: KNIP_TIMEOUT }, () => {
		mutateFile( PATHS.devUtilsIndex, content => {
			return content + '\nimport \'@ckeditor/ckeditor5-dev-utils\';\n';
		} );

		const { status, stdout } = runBinary( 'eslint', [ '--no-cache', PATHS.devUtilsIndex ] );

		expect( status ).not.toEqual( 0 );
		expect( stdout ).toContain( 'ckeditor5-rules/no-scoped-imports-within-package' );
	} );
} );

describe( 'check-versions-match', () => {
	it( 'reports and fixes a workspace package version mismatch', { timeout: KNIP_TIMEOUT }, () => {
		mutateFile( PATHS.changelogPackageJson, content => {
			const packageJson = JSON.parse( content );

			expect( packageJson.dependencies[ '@ckeditor/ckeditor5-dev-utils' ] ).toEqual( 'workspace:*' );
			packageJson.dependencies[ '@ckeditor/ckeditor5-dev-utils' ] = '1.0.0';

			return JSON.stringify( packageJson, null, 2 ) + '\n';
		} );

		const lintResult = runVersionsMatch();

		expect( lintResult.status ).not.toEqual( 0 );

		const fixResult = runVersionsMatch( { fix: true } );

		expect( fixResult.status, fixResult.stdout + fixResult.stderr ).toEqual( 0 );

		const fixedPackageJson = JSON.parse( fs.readFileSync( PATHS.changelogPackageJson, 'utf-8' ) );

		expect( fixedPackageJson.dependencies[ '@ckeditor/ckeditor5-dev-utils' ] ).toEqual( 'workspace:*' );
	} );
} );
