/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

/* eslint-env node */

'use strict';

/**
 * @param {String} packagePath
 * @returns {Promise}
 */
module.exports = async function runBuildCommand( packagePath ) {
	const path = require( 'upath' );
	const { tools } = require( '@ckeditor/ckeditor5-dev-utils' );

	const packageJson = require(
		path.join( packagePath, 'package.json' )
	);

	if ( !packageJson.scripts?.build ) {
		return;
	}

	return tools.shExec( 'yarn run build', {
		cwd: packagePath,
		verbosity: 'error',
		async: true
	} );
};

