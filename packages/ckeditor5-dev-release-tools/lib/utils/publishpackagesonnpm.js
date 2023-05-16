/**
 * @license Copyright (c) 2003-2023, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const fs = require( 'fs-extra' );
const { tools } = require( '@ckeditor/ckeditor5-dev-utils' );

/**
 * Calls the npm command to publish all packages. When a package is successfully published, it is removed from the filesystem.
 *
 * @param {Array.<String>} packagePaths
 * @param {String} npmTag
 * @returns {Promise}
 */
module.exports = async function publishPackagesOnNpm( packagePaths, npmTag ) {
	for ( const packagePath of packagePaths ) {
		await tools.shExec( `npm publish --access=public --tag ${ npmTag }`, { cwd: packagePath, async: true } );

		await fs.remove( packagePath );
	}
};
