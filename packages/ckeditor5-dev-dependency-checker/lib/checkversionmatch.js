#!/usr/bin/env node

/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import fs from 'node:fs';
import { styleText } from 'node:util';
import semver from 'semver';
import { globSync } from 'glob';
import { execSync } from 'node:child_process';

const PNPM_WORKSPACE_VERSION = 'workspace:*';

const DEPENDENCY_TYPES = [
	'dependencies',
	'devDependencies'
];

const DEFAULT_PKG_JSON_PATTERNS = [
	'package.json',
	'packages/*/package.json'
];

/**
 * This script ensures that "dependencies" and "devDependencies" in package JSONs which match
 * passed (or default) glob patterns use consistent dependencies versions. It also checks versions
 * available on npm, bumps and pins a set version for dependencies using the "^" range operator.
 *
 * @param {object} options
 * @param {string} options.cwd
 * @param {boolean} [options.fix=false] Whether the script should automatically fix the errors instead of reporting them.
 * @param {boolean} [options.allowRanges=false] It prevents dependencies using the "^" range operator from being bumped to
 * latest version from npm matching them. Instead, they are bumped to highest version between them.
 * @param {function} [options.devDependenciesFilter] Function that defines which "devDependencies" should be modified.
 * All are modified by default
 * @param {Array.<string>} [options.pkgJsonPatterns] Array of glob patterns to find `package.json` files to modify.
 * By default, it modifies root `package.json` and `packages/*\/package.json` files.
 * @param {object} [options.versionExceptions] Allows setting `allowRanges` for packages defined as keys of this object,
 * instead of globally.
 * @param {Array.<string>} [options.workspacePackages] Array of packages that should use `workspace:*` as version.
 */
export default async function checkVersionMatch( {
	cwd,
	fix = false,
	allowRanges = false,
	devDependenciesFilter = () => true,
	pkgJsonPatterns = DEFAULT_PKG_JSON_PATTERNS,
	versionExceptions = {},
	workspacePackages = []
} ) {
	console.log( styleText( 'blue', '🔍 Starting checking dependencies versions...' ) );

	const versionsCache = {};

	const [ packageJsons, pathMappings ] = getPackageJsons( { cwd, pkgJsonPatterns } );

	const expectedDependencies = getExpectedDepsVersions( {
		packageJsons,
		devDependenciesFilter,
		versionExceptions,
		versionsCache,
		allowRanges,
		workspacePackages
	} );

	if ( fix ) {
		fixDependenciesVersions( { expectedDependencies, packageJsons, pathMappings, devDependenciesFilter } );
	} else {
		checkDependenciesMatch( { expectedDependencies, packageJsons, devDependenciesFilter } );
	}
}

/**
 * @param {object} options
 * @param {object.<string, string>} options.expectedDependencies
 * @param {Array.<object>} options.packageJsons
 * @param {object.<string, string>} options.pathMappings
 * @param {function} options.devDependenciesFilter
 */
function fixDependenciesVersions( { expectedDependencies, packageJsons, pathMappings, devDependenciesFilter } ) {
	packageJsons.forEach( packageJson => {
		DEPENDENCY_TYPES.forEach( dependencyType => {
			if ( !packageJson[ dependencyType ] ) {
				return;
			}

			Object.keys( packageJson[ dependencyType ] ).forEach( dependencyName => {
				if ( dependencyType === 'devDependencies' && !devDependenciesFilter( dependencyName ) ) {
					return;
				}

				packageJson[ dependencyType ][ dependencyName ] = expectedDependencies[ dependencyName ];
			} );
		} );

		fs.writeFileSync( pathMappings[ packageJson.name ], JSON.stringify( packageJson, null, 2 ) );
	} );

	console.log( styleText( 'green', '✅  All dependencies fixed!' ) );
}

/**
 * @param {object} options
 * @param {Array.<object>} options.packageJsons
 * @param {function} options.devDependenciesFilter
 * @param {object.<string, string>} options.expectedDependencies
 */
function checkDependenciesMatch( { packageJsons, devDependenciesFilter, expectedDependencies } ) {
	const errors = packageJsons.flatMap( packageJson => {
		return DEPENDENCY_TYPES.flatMap( dependencyType => {
			if ( !packageJson[ dependencyType ] ) {
				return;
			}

			return Object.entries( packageJson[ dependencyType ] ).flatMap( ( [ dependencyName, version ] ) => {
				if ( dependencyType === 'devDependencies' && !devDependenciesFilter( dependencyName ) ) {
					return;
				}

				const expectedVersion = expectedDependencies[ dependencyName ];

				if ( version === expectedVersion ) {
					return;
				}

				return `"${
					dependencyName
				}" in "${
					packageJson.name
				}" in version "${
					version
				}" should be set to "${
					expectedVersion
				}".`;
			} );
		} );
	} ).filter( Boolean );

	if ( errors.length ) {
		console.error(
			styleText( 'red', '❌  Errors found. Run this script with an argument: `--fix` to resolve the issues automatically:' )
		);
		console.error( styleText( 'red', errors.join( '\n' ) ) );
		process.exit( 1 );
	} else {
		console.log( styleText( 'green', '✅  All dependencies are correct!' ) );
	}
}

/**
 * @param {object} options
 * @param {Array.<object>} options.packageJsons
 * @param {function} options.devDependenciesFilter
 * @param {object} options.versionExceptions
 * @param {object} options.versionsCache
 * @param {boolean} options.allowRanges
 * @param {Array.<string>} options.workspacePackages
 * @return {object.<string, string>} expectedDependencies
 */
function getExpectedDepsVersions( options ) {
	const { packageJsons, devDependenciesFilter, versionExceptions, versionsCache, allowRanges, workspacePackages } = options;

	return packageJsons.reduce( ( expectedDependencies, packageJson ) => {
		DEPENDENCY_TYPES.forEach( dependencyType => {
			if ( !packageJson[ dependencyType ] ) {
				return;
			}

			Object.entries( packageJson[ dependencyType ] ).forEach( ( [ dependencyName, version ] ) => {
				if ( workspacePackages.length && workspacePackages.includes( dependencyName ) ) {
					expectedDependencies[ dependencyName ] = PNPM_WORKSPACE_VERSION;

					return;
				}

				if ( dependencyType === 'devDependencies' && !devDependenciesFilter( dependencyName ) ) {
					return;
				}

				expectedDependencies[ dependencyName ] = getNewestVersion( {
					dependencyName,
					newVersion: version,
					versionsCache,
					versionExceptions,
					allowRanges,
					currentMaxVersion: expectedDependencies[ dependencyName ]
				} );
			} );
		} );

		return expectedDependencies;
	}, {} );
}

/**
 * @param {object} options
 * @param {string} options.dependencyName
 * @param {object} options.versionsCache
 * @param {object} options.versionExceptions
 * @param {boolean} options.allowRanges
 * @param {string} [options.newVersion='0.0.0']
 * @param {string} [options.currentMaxVersion='0.0.0']
 * @return {string}
 */
function getNewestVersion( {
	dependencyName,
	versionsCache,
	versionExceptions,
	allowRanges,
	newVersion = '0.0.0',
	currentMaxVersion = '0.0.0'
} ) {
	if ( versionExceptions[ dependencyName ] ) {
		return newVersion;
	}

	// If workspace:* detected when workspacePackages is empty, getting the newest version from npm.
	if ( newVersion === PNPM_WORKSPACE_VERSION || currentMaxVersion === PNPM_WORKSPACE_VERSION ) {
		const versions = getVersionsList( { dependencyName, versionsCache } );
		const stableVersions = versions.filter( v => !semver.prerelease( v ) );

		return stableVersions.sort( semver.rcompare )[ 0 ];
	}

	if ( allowRanges ) {
		return semver.gt( semver.minVersion( newVersion ), semver.minVersion( currentMaxVersion ) ) ? newVersion : currentMaxVersion;
	}

	const newMaxVersion = semver.valid( newVersion ) ?
		newVersion :
		semver.maxSatisfying( getVersionsList( { dependencyName, versionsCache } ), newVersion );

	return semver.gt( newMaxVersion, currentMaxVersion ) ? newMaxVersion : currentMaxVersion;
}

/**
 * @param {object} options
 * @param {string} options.dependencyName
 * @param {object} options.versionsCache
 * @return {object.<string, string>}
 */
function getVersionsList( { dependencyName, versionsCache } ) {
	if ( !versionsCache[ dependencyName ] ) {
		console.log( styleText( 'blue', `⬇️ Downloading "${ dependencyName }" versions from npm...` ) );
		const versionsJson = execSync( `npm view ${ dependencyName } versions --json`, { encoding: 'utf8' } );
		versionsCache[ dependencyName ] = JSON.parse( versionsJson );
	}

	return versionsCache[ dependencyName ];
}

/**
 * @param {object} options
 * @param {string} options.cwd
 * @param {Array.<string>} options.pkgJsonPatterns
 * @return {[Array.<object>, object.<string, string>]}
 */
function getPackageJsons( { cwd, pkgJsonPatterns } ) {
	const packageJsonPaths = globSync( pkgJsonPatterns, { absolute: true, cwd } );
	const packageJsons = packageJsonPaths
		.map( packageJsonPath => fs.readFileSync( packageJsonPath, 'utf-8' ) )
		.map( packageJsonContent => JSON.parse( packageJsonContent ) );

	const nameToPathMappings = packageJsonPaths.reduce( ( accum, packageJsonPath ) => {
		const file = fs.readFileSync( packageJsonPath, 'utf-8' );
		const { name } = JSON.parse( file );

		return { ...accum, [ name ]: packageJsonPath };
	}, {} );

	return [ packageJsons, nameToPathMappings ];
}
