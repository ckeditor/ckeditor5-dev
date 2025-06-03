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

const DEFAULT_PKG_JSON_PATTERNS = [
	'package.json',
	'packages/*/package.json'
];

/**
 * This script ensures that all "dependencies" in package JSONs use the same versions of dependencies.
 * It also checks that all versions are pinned, and they don't use the caret operator "^".
 *
 * @param {Object} options
 * @param {string} options.cwd
 * @param {boolean} [options.fix=false] Whether the script should automatically fix the errors.
 * @param {boolean} [options.allowRanges=true] Whether the caret operator "^" is allowed.
 * @param {Function} [options.devDependenciesFilter]
 * @param {Array<String>} [options.pkgJsonPatterns]
 * @param {Object} [options.versionExceptions]
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
 * @param {Object} options
 * @param {Object.<String, String>} options.expectedDependencies
 * @param {Array.<Object>} options.packageJsons
 * @param {Object.<String, String>} options.pathMappings
 * @param {Function} options.devDependenciesFilter
 */
function fixDependenciesVersions( { expectedDependencies, packageJsons, pathMappings, devDependenciesFilter } ) {
	packageJsons
		.filter( packageJson => packageJson.dependencies || packageJson.devDependencies )
		.forEach( packageJson => {
			if ( packageJson.dependencies ) {
				for ( const [ dependency, version ] of Object.entries( packageJson.dependencies ) ) {
					if ( version === expectedDependencies[ dependency ] ) {
						continue;
					}

					packageJson.dependencies[ dependency ] = expectedDependencies[ dependency ];
				}
			}

			if ( packageJson.devDependencies ) {
				for ( const [ dependency, version ] of Object.entries( packageJson.devDependencies ) ) {
					if ( !devDependenciesFilter( dependency ) || version === expectedDependencies[ dependency ] ) {
						continue;
					}

					packageJson.devDependencies[ dependency ] = expectedDependencies[ dependency ];
				}
			}

			fs.writeJsonSync( pathMappings[ packageJson.name ], packageJson, { spaces: 2 } );
		} );

	console.log( chalk.green( '✅  All dependencies fixed!' ) );
}

/**
 * @param {Object} options
 * @param {Object.<String, String>} options.expectedDependencies
 * @param {Function} options.devDependenciesFilter
 * @param {Array.<Object>} options.packageJsons
 */
function checkDependenciesMatch( { expectedDependencies, packageJsons, devDependenciesFilter } ) {
	const errors = packageJsons
		.flatMap( packageJson => {
			const depsErrors = Object.entries( packageJson.dependencies || {} )
				.map( ( [ dependency, version ] ) => {
					if ( version === expectedDependencies[ dependency ] ) {
						return '';
					}

					return getWrongVersionErrorMsg( { dependency, name: packageJson.name, version, expectedDependencies } );
				} )
				.filter( Boolean );

			const devDepsErrors = Object.entries( packageJson.devDependencies || {} )
				.map( ( [ dependency, version ] ) => {
					if ( !devDependenciesFilter( dependency ) || version === expectedDependencies[ dependency ] ) {
						return '';
					}

					return getWrongVersionErrorMsg( { dependency, name: packageJson.name, version, expectedDependencies } );
				} )
				.filter( Boolean );

			return [ ...depsErrors, devDepsErrors ].flat();
		} );

	if ( errors.length ) {
		console.error( chalk.red( '❌  Errors found. Run this script with an argument: `--fix` to resolve the issues automatically:' ) );
		console.error( chalk.red( errors.join( '\n' ) ) );
		process.exit( 1 );
	} else {
		console.log( chalk.green( '✅  All dependencies are correct!' ) );
	}
}

/**
 * @param {Object} options
 * @param {String} options.dependency
 * @param {String} options.name
 * @param {String} options.version
 * @param {Object.<String, String>} options.expectedDependencies
 */
function getWrongVersionErrorMsg( { dependency, name, version, expectedDependencies } ) {
	return `"${ dependency }" in "${ name }" in version "${ version }" should be set to "${ expectedDependencies[ dependency ] }".`;
}

/**
 * @param {Object} options
 * @param {Array.<Object>} options.packageJsons
 * @param {Function} options.devDependenciesFilter
 * @param {Object} options.versionExceptions
 * @param {Object} options.versionsCache
 * @param {boolean} options.allowRanges
 * @return {Object.<String, String>} expectedDependencies
 */
function getExpectedDepsVersions( { packageJsons, devDependenciesFilter, versionExceptions, versionsCache, allowRanges } ) {
	return packageJsons
		.reduce( ( expectedDependencies, packageJson ) => {
			for ( const [ dependency, version ] of Object.entries( packageJson.dependencies || {} ) ) {
				expectedDependencies[ dependency ] = getNewestVersion( {
					packageName: dependency,
					newVersion: version,
					versionsCache,
					versionExceptions,
					allowRanges,
					currentMaxVersion: expectedDependencies[ dependency ]
				} );
			}

			for ( const [ dependency, version ] of Object.entries( packageJson.devDependencies || {} ) ) {
				if ( !devDependenciesFilter( dependency ) ) {
					continue;
				}

				expectedDependencies[ dependency ] = getNewestVersion( {
					packageName: dependency,
					newVersion: version,
					versionsCache,
					versionExceptions,
					allowRanges,
					currentMaxVersion: expectedDependencies[ dependency ]
				} );
			}

			return expectedDependencies;
		}, {} );
}

/**
 * @param {Object} options
 * @param {String} options.packageName
 * @param {Object} options.versionsCache
 * @param {Object} options.versionExceptions
 * @param {String} [options.newVersion='0.0.0']
 * @param {String} [options.currentMaxVersion='0.0.0']
 * @return {String}
 */
function getNewestVersion( {
	packageName,
	versionsCache,
	versionExceptions,
	allowRanges,
	newVersion = '0.0.0',
	currentMaxVersion = '0.0.0'
} ) {
	if ( versionExceptions[ packageName ] ) {
		return newVersion;
	}

	if ( allowRanges ) {
		return semver.gt( semver.minVersion( newVersion ), semver.minVersion( currentMaxVersion ) ) ? newVersion : currentMaxVersion;
	}

	const newMaxVersion = semver.valid( newVersion ) ?
		newVersion :
		semver.maxSatisfying( getVersionsList( { packageName, versionsCache } ), newVersion );

	return semver.gt( newMaxVersion, currentMaxVersion ) ? newMaxVersion : currentMaxVersion;
}

/**
 * @param {Object} options
 * @param {String} options.packageName
 * @param {Object} options.versionsCache
 * @return {Object.<String, String>}
 */
function getVersionsList( { packageName, versionsCache } ) {
	if ( !versionsCache[ packageName ] ) {
		console.log( chalk.blue( `⬇️ Downloading "${ packageName }" versions from npm...` ) );
		const versionsJson = execSync( `npm view ${ packageName } versions --json`, { encoding: 'utf8' } );
		versionsCache[ packageName ] = JSON.parse( versionsJson );
	}

	return versionsCache[ packageName ];
}

/**
 * @param {Object} options
 * @param {String} options.cwd
 * @param {Array.<String>} options.pkgJsonPatterns
 * @return {[Array.<Object>, Object.<String, String>]}
 */
function getPackageJsons( { cwd, pkgJsonPatterns } ) {
	const packageJsonPaths = globSync( pkgJsonPatterns, { absolute: true, cwd } );
	const packageJsons = packageJsonPaths.map( packageJsonPath => fs.readJsonSync( packageJsonPath ) );
	const nameToPathMappings = packageJsonPaths
		.reduce( ( accum, packageJsonPath ) => ( { ...accum, [ fs.readJsonSync( packageJsonPath ).name ]: packageJsonPath } ), {} );

	return [ packageJsons, nameToPathMappings ];
}
