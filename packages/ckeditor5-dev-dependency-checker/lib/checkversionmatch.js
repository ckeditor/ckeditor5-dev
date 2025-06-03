#!/usr/bin/env node

/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import fs from 'fs-extra';
import chalk from 'chalk';
import semver from 'semver';
import { globSync } from 'glob';
import { execSync } from 'child_process';

const DEPENDENCY_TYPES = [
	'dependencies',
	'devDependencies'
];

const DEFAULT_PKG_JSON_PATTERNS = [
	'package.json',
	'packages/*/package.json'
];

/**
 * This script ensures that all "dependencies" in package JSONs use the same versions of dependencies.
 * It also checks that all versions are pinned, and they don't use the caret operator "^".
 *
 * @param {object} options
 * @param {string} options.cwd
 * @param {boolean} [options.fix=false] Whether the script should automatically fix the errors.
 * @param {boolean} [options.allowRanges=true] Whether the caret operator "^" is allowed.
 * @param {function} [options.devDependenciesFilter]
 * @param {Array.<string>} [options.pkgJsonPatterns]
 * @param {object} [options.versionExceptions]
 */
export default async function checkVersionMatch( {
	cwd,
	fix = false,
	allowRanges = false,
	devDependenciesFilter = () => true,
	pkgJsonPatterns = DEFAULT_PKG_JSON_PATTERNS,
	versionExceptions = {}
} ) {
	console.log( chalk.blue( '🔍 Starting checking dependencies versions...' ) );

	const versionsCache = {};

	const [ packageJsons, pathMappings ] = getPackageJsons( { cwd, pkgJsonPatterns } );

	const expectedDependencies = getExpectedDepsVersions( {
		packageJsons,
		devDependenciesFilter,
		versionExceptions,
		versionsCache,
		allowRanges
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

		fs.writeJsonSync( pathMappings[ packageJson.name ], packageJson, { spaces: 2 } );
	} );

	console.log( chalk.green( '✅  All dependencies fixed!' ) );
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
		console.error( chalk.red( '❌  Errors found. Run this script with an argument: `--fix` to resolve the issues automatically:' ) );
		console.error( chalk.red( errors.join( '\n' ) ) );
		process.exit( 1 );
	} else {
		console.log( chalk.green( '✅  All dependencies are correct!' ) );
	}
}

/**
 * @param {object} options
 * @param {Array.<object>} options.packageJsons
 * @param {function} options.devDependenciesFilter
 * @param {object} options.versionExceptions
 * @param {object} options.versionsCache
 * @param {boolean} options.allowRanges
 * @return {object.<string, string>} expectedDependencies
 */
function getExpectedDepsVersions( { packageJsons, devDependenciesFilter, versionExceptions, versionsCache, allowRanges } ) {
	return packageJsons.reduce( ( expectedDependencies, packageJson ) => {
		DEPENDENCY_TYPES.forEach( dependencyType => {
			if ( !packageJson[ dependencyType ] ) {
				return;
			}

			Object.entries( packageJson[ dependencyType ] ).forEach( ( [ dependencyName, version ] ) => {
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
		console.log( chalk.blue( `⬇️ Downloading "${ dependencyName }" versions from npm...` ) );
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
	const packageJsons = packageJsonPaths.map( packageJsonPath => fs.readJsonSync( packageJsonPath ) );
	const nameToPathMappings = packageJsonPaths
		.reduce( ( accum, packageJsonPath ) => ( { ...accum, [ fs.readJsonSync( packageJsonPath ).name ]: packageJsonPath } ), {} );

	return [ packageJsons, nameToPathMappings ];
}
