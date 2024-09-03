/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { tools } from '@ckeditor/ckeditor5-dev-utils';
import upath from 'upath';
import fs from 'fs-extra';

/**
 * Calls the npm command to publish the package. When a package is successfully published, it is removed from the filesystem.
 *
 * @param {String} packagePath
 * @param {Object} taskOptions
 * @param {String} taskOptions.npmTag
 * @returns {Promise}
 */
export async function publishPackageOnNpmCallback( packagePath, taskOptions ) {
	const result = await tools.shExec( `npm publish --access=public --tag ${ taskOptions.npmTag }`, {
		cwd: packagePath,
		async: true,
		verbosity: 'error'
	} )
		.catch( e => {
			const packageName = upath.basename( packagePath );

			if ( e.toString().includes( 'code E409' ) ) {
				return { shouldKeepDirectory: true };
			}

			throw new Error( `Unable to publish "${ packageName }" package.` );
		} );

	if ( !result || !result.shouldKeepDirectory ) {
		await fs.remove( packagePath );
	}
}
