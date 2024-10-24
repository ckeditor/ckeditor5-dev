/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import upath from 'upath';
import fs from 'fs-extra';
import assertNpmAuthorization from '../utils/assertnpmauthorization.js';
import assertPackages from '../utils/assertpackages.js';
import assertNpmTag from '../utils/assertnpmtag.js';
import assertFilesToPublish from '../utils/assertfilestopublish.js';
import executeInParallel from '../utils/executeinparallel.js';
import publishPackageOnNpmCallback from '../utils/publishpackageonnpmcallback.js';
import checkVersionAvailability from '../utils/checkversionavailability.js';
import findPathsToPackages from '../utils/findpathstopackages.js';

/**
 * The purpose of the script is to validate the packages prepared for the release and then release them on npm.
 *
 * The validation contains the following steps in each package:
 * - User must be logged to npm on the specified account.
 * - The package directory must contain `package.json` file.
 * - All other files expected to be released must exist in the package directory.
 * - The npm tag must match the tag calculated from the package version.
 *
 * When the validation for each package passes, packages are published on npm. Optional callback is called for confirmation whether to
 * continue.
 *
 * If a package has already been published, the script does not try to publish it again. Instead, it treats the package as published.
 * Whenever a communication between the script and npm fails, it tries to re-publish a package (up to three attempts).
 *
 * @param {object} options
 * @param {string} options.packagesDirectory Relative path to a location of packages to release.
 * @param {string} options.npmOwner The account name on npm, which should be used to publish the packages.
 * @param {ListrTaskObject} [options.listrTask] An instance of `ListrTask`.
 * @param {AbortSignal|null} [options.signal=null] Signal to abort the asynchronous process.
 * @param {string} [options.npmTag='staging'] The npm distribution tag.
 * @param {Object.<string, Array.<string>>|null} [options.optionalEntries=null] Specifies which entries from the `files` field in the
 * `package.json` are optional. The key is a package name, and its value is an array of optional entries from the `files` field, for which
 * it is allowed not to match any file. The `options.optionalEntries` object may also contain the `default` key, which is used for all
 * packages that do not have own definition.
 * @param {function|null} [options.confirmationCallback=null] An callback whose response decides to continue the publishing packages.
 * Synchronous and asynchronous callbacks are supported.
 * @param {boolean} [options.requireEntryPoint=false] Whether to verify if packages to publish define an entry point. In other words,
 * whether their `package.json` define the `main` field.
 * @param {Array.<string>} [options.optionalEntryPointPackages=[]] If the entry point validator is enabled (`requireEntryPoint=true`),
 * this array contains a list of packages that will not be checked. In other words, they do not have to define the entry point.
 * @param {string} [options.cwd=process.cwd()] Current working directory from which all paths will be resolved.
 * @param {number} [options.concurrency=4] Number of CPUs that will execute the task.
 * @param {number} [options.attempts=3] Number of attempts. After reaching 0, it won't be publishing packages again.
 * @returns {Promise}
 */
export default async function publishPackages( options ) {
	const {
		packagesDirectory,
		npmOwner,
		listrTask,
		signal = null,
		npmTag = 'staging',
		optionalEntries = null,
		confirmationCallback = null,
		requireEntryPoint = false,
		optionalEntryPointPackages = [],
		cwd = process.cwd(),
		concurrency = 4,
		attempts = 3
	} = options;

	const remainingAttempts = attempts - 1;
	await assertNpmAuthorization( npmOwner );

	const packagePaths = await findPathsToPackages( cwd, packagesDirectory );

	await assertPackages( packagePaths, { requireEntryPoint, optionalEntryPointPackages } );
	await assertFilesToPublish( packagePaths, optionalEntries );
	await assertNpmTag( packagePaths, npmTag );

	const shouldPublishPackages = confirmationCallback ? await confirmationCallback() : true;

	if ( !shouldPublishPackages ) {
		return Promise.resolve();
	}

	await removeAlreadyPublishedPackages( packagePaths );

	await executeInParallel( {
		cwd,
		packagesDirectory,
		listrTask,
		taskToExecute: publishPackageOnNpmCallback,
		taskOptions: {
			npmTag
		},
		signal,
		concurrency
	} );

	const packagePathsAfterPublishing = await findPathsToPackages( cwd, packagesDirectory );

	// All packages have been published. No need for re-executing.
	if ( !packagePathsAfterPublishing.length ) {
		return Promise.resolve();
	}

	// No more attempts. Abort.
	if ( remainingAttempts <= 0 ) {
		throw new Error( 'Some packages could not be published.' );
	}

	// Let's give an npm a moment for taking a breath...
	await wait( 1000 );

	// ...and try again.
	return publishPackages( {
		packagesDirectory,
		npmOwner,
		listrTask,
		signal,
		npmTag,
		optionalEntries,
		requireEntryPoint,
		optionalEntryPointPackages,
		cwd,
		concurrency,
		confirmationCallback: null, // Do not ask again if already here.
		attempts: remainingAttempts
	} );
}

async function removeAlreadyPublishedPackages( packagePaths ) {
	for ( const absolutePackagePath of packagePaths ) {
		const pkgJson = await fs.readJson( upath.join( absolutePackagePath, 'package.json' ) );
		const isAvailable = await checkVersionAvailability( pkgJson.version, pkgJson.name );

		if ( !isAvailable ) {
			await fs.remove( absolutePackagePath );
		}
	}
}

function wait( time ) {
	return new Promise( resolve => {
		setTimeout( resolve, time );
	} );
}
