/**
 * @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

/**
 * Calls the npm command to publish the package. When a package is successfully published, it is removed from the filesystem.
 *
 * @param {string} packagePath
 * @param {object} taskOptions
 * @param {string} taskOptions.npmTag
 * @param {boolean} [taskOptions.useOidc=false] Whether to request a fresh OIDC token for npm Trusted Publishing before publishing.
 * @returns {Promise}
 */
export default async function publishPackageOnNpmCallback( packagePath, taskOptions ) {
	// The callback runs in a worker thread, so dependencies are imported dynamically and resolve from the project root.
	const { exec } = await import( 'node:child_process' );
	const { rm } = await import( 'node:fs/promises' );
	const { getNpmIdToken } = await import( '@ckeditor/ckeditor5-dev-release-tools' );

	try {
		const env = taskOptions.useOidc ? { ...process.env, NPM_ID_TOKEN: await getNpmIdToken() } : process.env;

		if ( !/^[a-z0-9][a-z0-9._-]*$/i.test( taskOptions.npmTag ) ) {
			throw new Error( `Invalid npm tag: "${ taskOptions.npmTag }".` );
		}

		await new Promise( ( resolve, reject ) => {
			exec( `npm publish --access=public --tag ${ taskOptions.npmTag }`, { cwd: packagePath, env }, error => {
				return error ? reject( error ) : resolve();
			} );
		} );

		await rm( packagePath, { recursive: true, force: true } );
	} catch {
		// Do nothing if an error occurs. A parent task will handle it.
	}
}
