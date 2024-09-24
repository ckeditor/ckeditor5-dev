/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
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
	const { default: fs } = await import( 'fs-extra' );
	const { default: path } = await import( 'upath' );

	const options = {
		cwd: packagePath,
		async: true,
		verbosity: 'error'
	};

	const result = await tools.shExec( `npm publish --access=public --tag ${ taskOptions.npmTag }`, options )
		.catch( e => {
			const packageName = path.basename( packagePath );

			if ( e.toString().includes( 'code E409' ) ) {
				return { shouldKeepDirectory: true };
			}

			throw new Error( `Unable to publish "${ packageName }" package.` );
		} );

	if ( !result || !result.shouldKeepDirectory ) {
		await fs.remove( packagePath );
	}
}
