/**
 * @license Copyright (c) 2003-2018, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const tasks = {
	releaseRepository( ...args ) {
		return require( './release-tools/tasks/releaserepository' )( ...args );
	},

	releaseSubRepositories( ...args ) {
		return require( './release-tools/tasks/releasesubrepositories' )( ...args );
	},

	generateChangelogForSinglePackage( ...args ) {
		return require( './release-tools/tasks/generatechangelogforsinglepackage' )( ...args );
	},

	generateChangelogForSubPackages( ...args ) {
		return require( './release-tools/tasks/generatechangelogforsubpackages' )( ...args );
	},

	generateChangelogForSubRepositories( ...args ) {
		return require( './release-tools/tasks/generatechangelogforsubrepositories' )( ...args );
	},

	generateSummaryChangelog( ...args ) {
		return require( './release-tools/tasks/generatesummarychangelog' )( ...args );
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
