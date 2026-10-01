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
		// The token is passed only to this npm process. The environment of the worker thread does not change.
		const env = taskOptions.useOidc ?
			{ ...process.env, NPM_ID_TOKEN: await ( await import( './getnpmidtoken.js' ) ).default() } :
			process.env;

		await new Promise( ( resolve, reject ) => {
			const args = [ 'publish', '--access=public', '--tag', taskOptions.npmTag ];

			execFile( 'npm', args, { cwd: packagePath, env }, error => error ? reject( error ) : resolve() );
		} );

		await rm( packagePath, { recursive: true, force: true } );
	} catch {
		// Do nothing if an error occurs. A parent task will handle it.
	}
}
