/**
 * @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import fs from 'node:fs';
import { spawn } from 'node:child_process';
import { styleText } from 'node:util';
import { logger } from '@ckeditor/ckeditor5-dev-utils';
import { globSync } from 'glob';
import { minimatch } from 'minimatch';
import { mkdirp } from 'mkdirp';
import transformFileOptionToTestGlob from '../utils/transformfileoptiontotestglob.js';
import upath from 'upath';

// Glob patterns that should be ignored. It means if a specified test file is located under path
// that matches to these patterns, the file will be skipped.
const IGNORE_GLOBS = [
	// Ignore files which are saved in `manual/` directory. There are manual tests.
	upath.join( '**', 'tests', '**', 'manual', '**', '*.{js,ts}' ),
	// Ignore `_utils` directory as well because there are saved utils for tests.
	upath.join( '**', 'tests', '**', '_utils', '**', '*.{js,ts}' )
];

export default async function runAutomatedTests( options ) {
	const globPatterns = resolveTestGlobs( options.files );
	const testFiles = collectTestFiles( globPatterns );
	const { vitestSelection, vitestPackageRoots } = groupTestFilesByPackage( testFiles );

	if ( !vitestSelection.length ) {
		throw new Error( 'No test files found. Specified patterns are invalid.' );
	}

	if ( options.watch && vitestSelection.length > 1 ) {
		throw new Error(
			'Watch mode cannot be used for multiple Vitest projects in one run. ' +
			'Run watch mode separately for each Vitest project.'
		);
	}

	return spawnVitest( options, vitestSelection, vitestPackageRoots );
}

// -- Glob resolution & file collection -----------------------------------------------------------

function resolveTestGlobs( files ) {
	if ( !Array.isArray( files ) || files.length === 0 ) {
		throw new Error( 'Test runner requires files to test. `options.files` has to be a non-empty array.' );
	}

	const globMap = {};

	for ( const file of files ) {
		globMap[ file ] = transformFileOptionToTestGlob( file );
	}

	return globMap;
}

function collectTestFiles( globPatterns ) {
	const log = logger();
	const allFiles = [];

	for ( const [ pattern, resolvedGlobs ] of Object.entries( globPatterns ) ) {
		let hasFiles = false;

		for ( const glob of resolvedGlobs ) {
			const files = globSync( glob ).map( f => upath.normalize( f ) );

			if ( files.length ) {
				hasFiles = true;
			}

			allFiles.push(
				...files.filter( file => !IGNORE_GLOBS.some( ignore => minimatch( file, ignore ) ) )
			);
		}

		if ( !hasFiles ) {
			log.warning( `Pattern "${ pattern }" does not match any file.` );
		}
	}

	return allFiles;
}

// -- Test files grouping --------------------------------------------------------------------------

function groupTestFilesByPackage( testFiles ) {
	const vitestSelection = new Map();
	const vitestPackageRoots = new Map();

	for ( const filePath of testFiles ) {
		const packageRoot = getPackageRoot( filePath );
		const projectName = upath.basename( packageRoot ).replace( /^ckeditor5-/, '' );

		const files = vitestSelection.get( projectName ) || [];
		files.push( filePath );
		vitestSelection.set( projectName, files );
		vitestPackageRoots.set( projectName, packageRoot );
	}

	return {
		vitestSelection: [ ...vitestSelection.entries() ],
		vitestPackageRoots
	};
}

function getPackageRoot( filePath ) {
	const normalized = upath.normalize( filePath );
	const testsIndex = normalized.lastIndexOf( '/tests/' );

	if ( testsIndex === -1 ) {
		throw new Error( `Cannot determine package root for "${ filePath }".` );
	}

	return normalized.slice( 0, testsIndex );
}

// -- Vitest runner --------------------------------------------------------------------------------

async function spawnVitest( options, vitestSelection, packageRoots ) {
	const errors = [];

	for ( const [ project, selectedFiles ] of vitestSelection ) {
		try {
			await spawnVitestProject( options, project, selectedFiles, packageRoots.get( project ) );
		} catch ( error ) {
			errors.push( error );
		}
	}

	if ( options.coverage ) {
		try {
			await mergeVitestCoverage( vitestSelection );
		} catch ( error ) {
			errors.push( error );
		}
	}

	if ( errors.length ) {
		if ( errors.length === 1 ) {
			throw errors[ 0 ];
		}

		const details = errors.map( e => `- ${ e.message }` ).join( '\n' );
		throw new Error( `Vitest execution failed in multiple projects:\n${ details }` );
	}
}

// Vitest runs from the package directory, so it loads the package-level config directly.
// Using the workspace config with `--project <name>` hangs in browser mode when multiple
// test files run, because per-file isolation does not tear down the browser context.
// Running per-package avoids that path while keeping coverage compatible: reports still
// go to the workspace `coverage-vitest/<project>/` directory via absolute
// `--coverage.reportsDirectory`.
function spawnVitestProject( options, project, selectedFiles, packageRoot ) {
	return new Promise( ( resolve, reject ) => {
		const args = [ 'vitest' ];

		args.push( options.watch ? '--watch' : '--run' );

		if ( options.coverage ) {
			const coverageDir = upath.join( process.cwd(), 'coverage-vitest', project );

			args.push(
				'--coverage.enabled',
				'--coverage.reportsDirectory', coverageDir,
				// Force the reporters the wrapper expects. The package's own `vitest.config.ts`
				// defaults to `text`/`html` (developer-friendly); downstream coverage merging
				// needs `json` (for nyc) and `lcovonly` (collected by
				// `check-unit-tests-for-package.mjs`).
				'--coverage.reporter', 'json',
				'--coverage.reporter', 'lcovonly',
				'--coverage.reporter', 'html'
			);
		}

		for ( const filePath of selectedFiles ) {
			args.push( upath.relative( packageRoot, filePath ) );
		}

		const child = spawn( 'pnpm', args, {
			stdio: 'inherit',
			cwd: packageRoot,
			shell: process.platform === 'win32'
		} );

		child.on( 'error', reject );

		child.on( 'close', exitCode => {
			if ( exitCode === 0 || exitCode === 130 ) {
				resolve();
			} else {
				reject( new Error( `Vitest finished with "${ exitCode }" code.` ) );
			}
		} );
	} );
}

function mergeVitestCoverage( vitestSelection ) {
	const cwd = process.cwd();
	const coverageBaseDir = upath.join( cwd, 'coverage-vitest' );
	const nycOutputDir = upath.join( coverageBaseDir, '.nyc_output' );

	mkdirp.sync( nycOutputDir );

	// Copy each project's coverage-final.json into .nyc_output/ so nyc can merge them.
	for ( const [ project ] of vitestSelection ) {
		const sourceFile = upath.join( coverageBaseDir, project, 'coverage-final.json' );

		if ( fs.existsSync( sourceFile ) ) {
			fs.copyFileSync( sourceFile, upath.join( nycOutputDir, `${ project }.json` ) );
		}
	}

	const log = logger();

	return new Promise( ( resolve, reject ) => {
		const child = spawn( 'pnpx', [
			'nyc', 'report',
			'--temp-dir', nycOutputDir,
			'--report-dir', coverageBaseDir,
			'--reporter', 'html',
			'--reporter', 'json',
			'--reporter', 'lcovonly',
			'--reporter', 'text-summary'
		], {
			stdio: 'inherit',
			cwd,
			shell: process.platform === 'win32'
		} );

		child.on( 'error', reject );

		child.on( 'close', exitCode => {
			if ( exitCode === 0 ) {
				log.info( `Combined Vitest coverage report saved in '${ styleText( 'cyan', coverageBaseDir ) }'.` );
				resolve();
			} else {
				reject( new Error( `nyc report finished with "${ exitCode }" code.` ) );
			}
		} );
	} );
}
