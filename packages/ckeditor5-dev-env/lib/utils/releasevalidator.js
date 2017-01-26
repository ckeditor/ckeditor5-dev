/**
 * @license Copyright (c) 2003-2017, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const { tools } = require( '@ckeditor/ckeditor5-dev-utils' );
const utils = require( './changelog' );

const validator = {
	/**
	 * Checks the release options.
	 *
	 * @params {Object} options
	 * @params {String} options.token GitHub token used to authenticate.
	 * @params {Boolean} options.init Whether to create first release using this package.
	 * @params {Object} options.dependencies Dependencies with versions of other CKEditor5 package.
	 */
	checkOptions( options ) {
		if ( !options.token ) {
			throw new Error( 'GitHub CLI token not found. Use --token=<token>.' );
		}
	},

	/**
	 * Checks whether the current branch is a master.
	 */
	checkCurrentBranch() {
		const currentBranch = tools.shExec( 'git rev-parse --abbrev-ref HEAD', { verbosity: 'error' } );

		if ( currentBranch.trim() !== 'master' ) {
			throw new Error( 'Release can be create only from the main branch.' );
		}
	},

	/**
	 * Checks whether master is up to date.
	 */
	checkIsUpToDate() {
		const shortStatus = tools.shExec( 'git status -sb', { verbosity: 'error' } )
			.trim()
			.match( /behind (\d+)/ );

		if ( shortStatus && shortStatus[ 1 ] !== 0 ) {
			throw new Error( 'Branch "master" is not up to date...' );
		}
	},

	/**
	 * Checks whether the branch contains uncommitted changes.
	 */
	checkUncommittedChanges() {
		const anyChangedFiles = tools.shExec( `git status -s`, { verbosity: 'error' } )
			.split( `\n` )
			.filter( ( fileName ) => !fileName.match( new RegExp( `${ utils.changelogFile }|package.json` ) ) )
			.join( `\n` )
			.trim();

		if ( anyChangedFiles.length ) {
			throw new Error( 'Working directory contains uncommitted changes...' );
		}
	}
};

module.exports = validator;
