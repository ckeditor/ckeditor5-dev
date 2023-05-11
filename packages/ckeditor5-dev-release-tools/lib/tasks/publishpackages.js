/**
 * @license Copyright (c) 2003-2023, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const fs = require( 'fs-extra' );
const upath = require( 'upath' );
const semver = require( 'semver' );
const { globSync } = require( 'glob' );
const { logger, tools } = require( '@ckeditor/ckeditor5-dev-utils' );

/**
 * The purpose of the script is to validate the packages prepared for the release and then release them on npm.
 *
 * @param {Object} options
 * @param {String} options.packagesDirectory Relative path to a location of packages to release.
 * @param {String} options.npmOwner The account name on npm, which should be used to publish the packages.
 * @param {String} [options.npmTag] The npm distribution tag.
 * @param {Object.<String, Array.<String>>} [options.optionalEntries] Specifies which entries from the `files` field in `package.json` are
 * optional. The key is a package name, and its value is an array of optional entries that exist in the `files` field in `package.json`.
 * The `options.optionalEntries` object may contain the `default` key, which is used for all packages that do not have own definition.
 * @param {String} [options.cwd] Current working directory from which all paths will be resolved.
 */
module.exports = function publishPackages( options ) {
	const log = logger();

	log.info( 'Task: publishPackages()' );

	const { packagesDirectory, npmOwner, npmTag, optionalEntries, cwd } = parseOptions( options );

	checkNpmAuthorization( npmOwner );

	const packagePaths = globSync( packagesDirectory + '/*/package.json', {
		cwd,
		nodir: true,
		absolute: true
	} ).map( upath.dirname );

	checkPackages( packagePaths, npmTag, optionalEntries );

	publishPackagesOnNpm( packagePaths, npmTag );
};

/**
 * Prepares the configuration options for the script.
 *
 * @param {Object} options
 * @param {String} options.packagesDirectory
 * @param {String} options.npmOwner
 * @param {String} [options.npmTag='staging']
 * @param {Object.<String, Array.<String>>} [options.optionalEntries=null]
 * @param {String} [options.cwd=process.cwd()]
 * @returns {Object}
 */
function parseOptions( options ) {
	const {
		packagesDirectory,
		npmOwner,
		npmTag = 'staging',
		optionalEntries = null,
		cwd = process.cwd()
	} = options;

	return {
		npmTag,
		npmOwner,
		optionalEntries,
		packagesDirectory: upath.normalizeTrim( packagesDirectory ),
		cwd: upath.normalizeTrim( cwd )
	};
}

/**
 * Checks whether a user is logged to npm as the provided account name.
 *
 * @param {String} npmOwner
 */
function checkNpmAuthorization( npmOwner ) {
	try {
		const npmCurrentUser = tools.shExec( 'npm whoami', { verbosity: 'error' } ).trim();

		if ( npmOwner !== npmCurrentUser ) {
			throw new Error();
		}
	} catch ( error ) {
		throw new Error( `You must be logged to npm as "${ npmOwner }" to execute this release step.` );
	}
}

/**
 * Validates the packages.
 *
 * The following checks are performed for each package:
 * - The npm tag must match the tag calculated from the package version.
 * - All files expected to be released must exist.
 *
 * @param {Array.<String>} packagePaths
 * @param {String} npmTag
 * @param {Object.<String, Array.<String>>} optionalEntries
 */
function checkPackages( packagePaths, npmTag, optionalEntries ) {
	const errors = {
		invalidNpmTag: [],
		missingFiles: []
	};

	for ( const packagePath of packagePaths ) {
		const packageJson = fs.readJsonSync( upath.join( packagePath, 'package.json' ) );

		let result = checkNpmTag( packageJson, npmTag );

		if ( result ) {
			errors.invalidNpmTag.push( result );
		}

		result = checkFilesToPublish( packageJson, packagePath, optionalEntries );

		if ( result ) {
			errors.missingFiles.push( result );
		}
	}

	const hasError = errors.invalidNpmTag.length > 0 || errors.missingFiles.length > 0;

	if ( hasError ) {
		const message = [
			...errors.invalidNpmTag,
			...errors.missingFiles
		].join( '\n' );

		throw new Error( message );
	}
}

/**
 * Checks if the npm tag matches the tag calculated from the package version.
 *
 * @param {Object} packageJson
 * @param {String} npmTag
 * @returns {String|undefined}
 */
function checkNpmTag( packageJson, npmTag ) {
	const versionTag = getVersionTag( packageJson.version );

	if ( versionTag === npmTag ) {
		return;
	}

	if ( versionTag === 'latest' && npmTag === 'staging' ) {
		return;
	}

	return `The version tag "${ versionTag }" from "${ packageJson.name }" package does not match the npm tag "${ npmTag }".`;
}

/**
 * Returns the version tag for the package.
 *
 * For the official release, returns the "latest" tag. For a non-official release (pre-release), returns the version tag extracted from
 * the package version.
 *
 * @param {String} version
 * @returns {String}
 */
function getVersionTag( version ) {
	const [ versionTag ] = semver.prerelease( version ) || [ 'latest' ];

	if ( versionTag.startsWith( 'nightly' ) ) {
		return 'nightly';
	}

	return versionTag;
}

/**
 * Checks if all files expected to be released actually exist in the package directory.
 *
 * @param {Object} packageJson
 * @param {String} packagePath
 * @param {Object.<String, Array.<String>>} optionalEntries
 * @returns {String|undefined}
 */
function checkFilesToPublish( packageJson, packagePath, optionalEntries ) {
	const expectedEntries = [ 'package.json' ];

	if ( packageJson.main ) {
		expectedEntries.push( packageJson.main );
	}

	if ( packageJson.types ) {
		expectedEntries.push( packageJson.types );
	}

	if ( packageJson.files ) {
		expectedEntries.push(
			...packageJson.files.filter( entry => !isEntryOptional( entry, packageJson.name, optionalEntries ) )
		);
	}

	const globOptions = {
		cwd: packagePath,
		dot: true,
		nodir: true
	};

	const unmatchedEntries = expectedEntries.filter( expectedEntry => {
		return globSync( expectedEntry + '/**', globOptions ).length === 0;
	} );

	if ( unmatchedEntries.length ) {
		return `Missing files in "${ packageJson.name }" package for the following entries: "${ unmatchedEntries.join( '", "' ) }"`;
	}
}

/**
 * Returns `true` if the provided entry from the `files` field has been marked as an optional one. Returns `false` otherwise.
 *
 * @param {String} entry
 * @param {String} packageName
 * @param {Object.<String, Array.<String>>} optionalEntries
 * @returns {Boolean}
 */
function isEntryOptional( entry, packageName, optionalEntries ) {
	if ( !optionalEntries ) {
		return false;
	}

	if ( optionalEntries[ packageName ] ) {
		return optionalEntries[ packageName ].includes( entry );
	}

	if ( optionalEntries.default ) {
		return optionalEntries.default.includes( entry );
	}

	return false;
}

/**
 * Calls the npm command to publish all packages. When a package is successfully published, it is removed from the filesystem.
 *
 * @param {Array.<String>} packagePaths
 * @param {String} npmTag
 */
function publishPackagesOnNpm( packagePaths, npmTag ) {
	for ( const packagePath of packagePaths ) {
		tools.shExec( `npm publish --access=public --tag ${ npmTag }`, { cwd: packagePath } );

		fs.removeSync( packagePath );
	}
}
