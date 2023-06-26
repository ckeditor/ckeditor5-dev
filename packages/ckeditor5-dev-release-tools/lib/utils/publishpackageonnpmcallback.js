/**
 * @license Copyright (c) 2003-2023, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

/* eslint-env node */

'use strict';

/**
 * Calls the npm command to publish the package. When a package is successfully published, it is removed from the filesystem.
 *
 * @param {String} packagePath
 * @param {Object} taskOptions
 * @param {String} taskOptions.npmTag
 * @returns {Promise}
 */
module.exports = async function publishPackageOnNpmCallback( packagePath, taskOptions ) {
	const { tools } = require( '@ckeditor/ckeditor5-dev-utils' );
	const upath = require( 'upath' );
	const fs = require( 'fs-extra' );

	await tools.shExec( `npm publish --access=public --tag ${ taskOptions.npmTag }`, { cwd: packagePath, async: true, verbosity: 'error' } )
		.catch( () => {
			const packageName = upath.basename( packagePath );

			throw new Error( `Unable to publish "${ packageName }" package.` );
		} );

	await fs.remove( packagePath );
};
