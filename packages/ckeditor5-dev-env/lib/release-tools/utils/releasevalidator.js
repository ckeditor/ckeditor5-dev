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
	 * Checks whether we're on master and there we're not behind or ahead.
	 *
	 * The idea is that the status should be totally clean. If branch has any ucommited,
	 * unpulled or unpushed changes, abort.
	 */
	checkBranch() {
		const status = tools.shExec( 'git status -sb', { verbosity: 'error' } ).trim();

		// This way we'll catch if a branch is behind/ahead or contains uncommited files.
		if ( status != '## master...origin/master' ) {
			throw new Error( 'Not on master or master is not clean.' );
		}
	}
};

module.exports = validator;
