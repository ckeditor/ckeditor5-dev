/**
 * @license Copyright (c) 2003-2017, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const { tools } = require( '@ckeditor/ckeditor5-dev-utils' );

const validator = {
	/**
	 * Checks the release options.
	 *
	 * @params {Options} options
	 */
	checkOptions( options ) {
		if ( !options.skipGithub && !options.token ) {
			throw new Error( 'GitHub CLI token not found. Use --token=<token>.' );
		}
	},

	/**
	 * Checks whether we're on master and there we're not behind.
	 *
	 * The idea is that the status should be totally clean. If branch has any uncommitted
	 * or unpulled changes, abort.
	 */
	checkBranch() {
		let status = tools.shExec( 'git status -sb', { verbosity: 'error' } ).trim().split( '\n' );

		// Uncommitted changes.
		if ( status.length !== 1 ) {
			throw new Error( 'Branch contains uncommitted changes.' );
		}

		status = status[ 0 ];

		// Not a master.
		if ( !status.startsWith( '## master' ) ) {
			throw new Error( 'Current branch is not a "master".' );
		}

		// Not up to date.
		if ( /behind \d+\]$/.test( status ) ) {
			throw new Error( 'Branch is behind the remote. Pull the changes.' );
		}
	},
};

module.exports = validator;
