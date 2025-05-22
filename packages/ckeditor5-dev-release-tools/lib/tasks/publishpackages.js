/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
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
import { workspaces, npm } from '@ckeditor/ckeditor5-dev-utils';

/**
 * The purpose of the script is to publish the prepared packages. However, before, it executes a few checks that
 * prevent from publishing an incomplete package.
 *
 * The validation contains the following steps:
 *
 * - A user (a CLI session) must be logged to npm on the specified account (`npmOwner`).
 * - A package directory must contain `package.json` file.
 * - All files defined in the `optionalEntryPointPackages` option must exist in a package directory.
 * - An npm tag (dist-tag) must match the tag calculated from the package version.
 *   A stable release can be also published as `next` or `staging.
 *
 * When the validation for each package passes, packages are published on npm. Optional callback is called for confirmation whether to
 * continue.
 *
 * If a package has already been published, the script does not try to publish it again. Instead, it treats the package as published.
 * Whenever a communication between the script and npm fails, it tries to re-publish a package (up to five attempts).
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
		concurrency = 2,
		attempts = 5
	} = options;

	await assertNpmAuthorization( npmOwner );

	// Find packages that would be published...
	const packagePaths = await workspaces.findPathsToPackages( cwd, packagesDirectory );

	// ...and filter out those that have already been processed.
	// In other words, check whether a version per package (it's read from a `package.json` file)
	// is not available. Otherwise, a package is ignored.
	await removeAlreadyPublishedPackages( packagePaths );

	// Once again, find packages to publish after the filtering operation.
	const packagesToProcess = await workspaces.findPathsToPackages( cwd, packagesDirectory );

	if ( !packagesToProcess.length ) {
		listrTask.output = 'All packages have been published.';

		return Promise.resolve();
	}

	// No more attempts. Abort.
	if ( attempts <= 0 ) {
		throw new Error( 'Some packages could not be published.' );
	}

	await assertPackages( packagesToProcess, { requireEntryPoint, optionalEntryPointPackages } );
	await assertFilesToPublish( packagesToProcess, optionalEntries );
	await assertNpmTag( packagesToProcess, npmTag );

	const shouldPublishPackages = confirmationCallback ? await confirmationCallback() : true;

	if ( !shouldPublishPackages ) {
		return Promise.resolve();
	}

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

	listrTask.output = 'Let\'s give an npm a moment for taking a breath (~10 sec)...';

	await wait( 1000 * 10 );

	listrTask.output = 'Done. Let\'s continue. Re-executing.';

	// ...and try again.
	return publishPackages( {
		...options,
		confirmationCallback: null, // Do not ask again if already here.
		attempts: attempts - 1
	} );
}

async function removeAlreadyPublishedPackages( packagePaths ) {
	for ( const absolutePackagePath of packagePaths ) {
		const pkgJson = await fs.readJson( upath.join( absolutePackagePath, 'package.json' ) );
		const isAvailable = await npm.checkVersionAvailability( pkgJson.version, pkgJson.name );

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
