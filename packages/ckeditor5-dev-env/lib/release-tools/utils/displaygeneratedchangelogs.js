/**
 * @license Copyright (c) 2003-2019, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const { logger } = require( '@ckeditor/ckeditor5-dev-utils' );

/**
 * Displays package names and their new versions.
 *
 * @param {Map} generatedChangelogsMap
 */
module.exports = function displayGeneratedChangelogs( generatedChangelogsMap ) {
	if ( !generatedChangelogsMap.size ) {
		return;
	}

	let message = 'Generated changelog for the following packages:\n';

	for ( const [ packageName, version ] of generatedChangelogsMap ) {
		message += `  * "${ packageName }": v${ version }\n`;
	}

	logger().info( message.trim() );
};
