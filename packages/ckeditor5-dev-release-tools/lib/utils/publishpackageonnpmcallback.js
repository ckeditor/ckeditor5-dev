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
	const { execFile } = await import( 'node:child_process' );
	const { rm } = await import( 'node:fs/promises' );

	try {
		let env = process.env;

		if ( taskOptions.useOidc ) {
			// `executeInParallel()` copies this callback to a temporary module in the project, so it cannot import
			// the helper using a relative path. The package name resolves from the project's `node_modules`.
			const { getNpmIdToken } = await import( '@ckeditor/ckeditor5-dev-release-tools' );

			// The token is passed only to this npm process. The environment of the worker thread does not change.
			env = { ...process.env, NPM_ID_TOKEN: await getNpmIdToken() };
		}

		await new Promise( ( resolve, reject ) => {
			const args = [ 'publish', '--access=public', '--tag', taskOptions.npmTag ];

			execFile( 'npm', args, { cwd: packagePath, env }, error => error ? reject( error ) : resolve() );
		} );

		await rm( packagePath, { recursive: true, force: true } );
	} catch {
		// Do nothing if an error occurs. A parent task will handle it.
	}
}
