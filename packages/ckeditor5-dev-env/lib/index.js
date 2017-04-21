/**
 * @license Copyright (c) 2003-2017, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const tasks = {
	createRelease( ...args ) {
		return require( './release-tools/tasks/createrelease' ).apply( null, args );
	},

	releaseDependencies( ...args ) {
		return require( './release-tools/tasks/releasedependencies' ).apply( null, args );
	},

	generateChangelogForSinglePackage( ...args ) {
		return require( './release-tools/tasks/generatechangelogforsinglepackage' ).apply( null, args );
	},

	generateChangelogForSubPackages( ...args ) {
		return require( './release-tools/tasks/generatechangelogforsubpackages' ).apply( null, args );
	},

	generateChangelogForSubRepositories( ...args ) {
		return require( './release-tools/tasks/generatechangelogforsubrepositories' ).apply( null, args );
	},

	/**
	 * Collects translation strings ( from `t()` calls ) and stores them in ckeditor5/build/.transifex directory.
	 */
	collectTranslations() {
		const collectTranslations = require( './translations/collect' );

		collectTranslations();
	},

	/**
	 * Uploads translation strings on the Transifex server.
	 *
	 * @returns {Promise}
	 */
	uploadTranslations() {
		const uploadTranslations = require( './translations/upload' );
		const getToken = require( './translations/gettoken' );

		return getToken()
			.then( credentials => uploadTranslations( credentials ) );
	},

	/**
	 * Download translations from the Transifex server.
	 *
	 * @returns {Promise}
	 */
	downloadTranslations() {
		const downloadTranslations = require( './translations/download' );
		const getToken = require( './translations/gettoken' );

		return getToken()
			.then( credentials => downloadTranslations( credentials ) );
	}
};

module.exports = tasks;
