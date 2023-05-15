/**
 * @license Copyright (c) 2003-2023, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const fs = require( 'fs-extra' );
const upath = require( 'upath' );
const { glob } = require( 'glob' );
const { tools } = require( '@ckeditor/ckeditor5-dev-utils' );
const assertNpmAuthorization = require( '../utils/assertnpmauthorization' );
const assertPackages = require( '../utils/assertpackages' );
const assertNpmTag = require( '../utils/assertnpmtag' );
const assertFilesToPublish = require( '../utils/assertfilestopublish' );

/**
 * The purpose of the script is to validate the packages prepared for the release and then release them on npm.
 *
 * The validation conatins the following steps in each package:
 * - The package directory mmust contain `package.json` file.
 * - All other files expected to be released must exist in the package directory.
 * - The npm tag must match the tag calculated from the package version.
 *
 * @param {Object} options
 * @param {String} options.packagesDirectory Relative path to a location of packages to release.
 * @param {String} options.npmOwner The account name on npm, which should be used to publish the packages.
 * @param {String} [options.npmTag='staging'] The npm distribution tag.
 * @param {Object.<String, Array.<String>>|null} [options.optionalEntries=null] Specifies which entries from the `files` field in the
 * `package.json` are optional. The key is a package name, and its value is an array of optional entries from the `files` field, for which
 * it is allowed not to match any file. The `options.optionalEntries` object may also contain the `default` key, which is used for all
 * packages that do not have own definition.
 * @param {String} [options.confirmationCallback=null] An callback whose response decides to continue the publishing packages. Synchronous
 * and asynchronous callbacks are supported.
 * @param {String} [options.cwd=process.cwd()] Current working directory from which all paths will be resolved.
 * @returns {Promise}
 */
module.exports = async function publishPackages( options ) {
	const {
		packagesDirectory,
		npmOwner,
		npmTag = 'staging',
		optionalEntries = null,
		confirmationCallback = null,
		cwd = process.cwd()
	} = options;

	await assertNpmAuthorization( npmOwner );

	const packagePaths = await glob( '*/', {
		cwd: upath.join( cwd, packagesDirectory ),
		absolute: true
	} );

	await assertPackages( packagePaths );
	await assertFilesToPublish( packagePaths, optionalEntries );
	await assertNpmTag( packagePaths, npmTag );

	const shouldPublishPackages = confirmationCallback ? await confirmationCallback() : true;

	if ( shouldPublishPackages ) {
		await publishPackagesOnNpm( packagePaths, npmTag );
	}
};

/**
 * Calls the npm command to publish all packages. When a package is successfully published, it is removed from the filesystem.
 *
 * @param {Array.<String>} packagePaths
 * @param {String} npmTag
 * @returns {Promise}
 */
async function publishPackagesOnNpm( packagePaths, npmTag ) {
	for ( const packagePath of packagePaths ) {
		await tools.shExec( `npm publish --access=public --tag ${ npmTag }`, { cwd: packagePath, async: true } );

		await fs.remove( packagePath );
	}
}
