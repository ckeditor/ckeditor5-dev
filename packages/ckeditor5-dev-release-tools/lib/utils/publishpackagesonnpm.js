/**
 * @license Copyright (c) 2003-2023, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const fs = require( 'fs-extra' );
const upath = require( 'upath' );
const { tools } = require( '@ckeditor/ckeditor5-dev-utils' );

/**
 * Calls the npm command to publish all packages. When a package is successfully published, it is removed from the filesystem.
 *
 * @param {Array.<String>} packagePaths
 * @param {String} npmTag
 * @param {ListrTaskObject} listrTask
 * @returns {Promise}
 */
module.exports = async function publishPackagesOnNpm( packagePaths, npmTag, listrTask ) {
	let index = 0;

	for ( const packagePath of packagePaths ) {
		listrTask.output = `Status: ${ ++index }/${ packagePaths.length }. Processing the "${ upath.basename( packagePath ) }" directory.`;

		await tools.shExec( `npm publish --access=public --tag ${ npmTag }`, { cwd: packagePath, async: true, verbosity: 'error' } )
			.catch( () => {
				const packageName = upath.basename( packagePath );

				throw new Error( `Unable to publish "${ packageName }" package.` );
			} );

		await fs.remove( packagePath );
	}
};
