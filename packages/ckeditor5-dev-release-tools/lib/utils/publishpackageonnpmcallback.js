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
	const { tools } = await import( '@ckeditor/ckeditor5-dev-utils' );
	const { rm } = await import( 'node:fs/promises' );

	try {
		if ( taskOptions.useOidc ) {
			const { default: getNpmIdToken } = await import( './getnpmidtoken.js' );

			// The callback runs in a worker thread that publishes its packages one by one.
			// Each worker thread has its own copy of `process.env`, so it does not affect other workers.
			process.env.NPM_ID_TOKEN = await getNpmIdToken();
		}

		await tools.shExec( `npm publish --access=public --tag ${ taskOptions.npmTag }`, {
			cwd: packagePath,
			async: true,
			verbosity: 'silent'
		} );

		await rm( packagePath, { recursive: true, force: true } );
	} catch {
		// Do nothing if an error occurs. A parent task will handle it.
	}
}
