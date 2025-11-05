/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

/**
 * Calls the npm command to publish the package. When a package is successfully published, it is removed from the filesystem.
 *
 * @param {string} packagePath
 * @param {object} taskOptions
 * @param {string} taskOptions.npmTag
 * @returns {Promise}
 */
export default async function publishPackageOnNpmCallback( packagePath, taskOptions ) {
	const { tools } = await import( '@ckeditor/ckeditor5-dev-utils' );
	const { rm } = await import( 'fs/promises' );

	try {
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
