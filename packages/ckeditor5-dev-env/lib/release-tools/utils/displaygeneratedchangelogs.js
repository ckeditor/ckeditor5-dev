/**
 * @license Copyright (c) 2003-2019, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const chalk = require( 'chalk' );
const { logger } = require( '@ckeditor/ckeditor5-dev-utils' );
const { INDENT_SIZE } = require( './cli' );

/**
 * Displays package names and their new versions.
 *
 * @param {Map} generatedChangelogsMap
 */
module.exports = function displayGeneratedChangelogs( generatedChangelogsMap ) {
	if ( !generatedChangelogsMap.size ) {
		return;
	}

	const indent = ' '.repeat( INDENT_SIZE );

	let message = indent + chalk.bold.underline( 'Generated changelog for the following packages:' ) + '\n';

	for ( const [ packageName, version ] of generatedChangelogsMap ) {
		message += `  * ${ packageName }: v${ version }\n`;
	}

	logger().info( message.trim() );
};
