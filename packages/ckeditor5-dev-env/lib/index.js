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
	 * Generates POT source files from the code and stores them in the 'ckeditor5/build/.transifex' directory.
	 */
	generateSourceFiles() {
		const generateSourceFiles = require( './translations/generatesourcefiles' );

		generateSourceFiles();
	},

	/**
	 * Uploads source files previously collected in the 'ckeditor5/build/.transifex' directory to the Transifex server.
	 *
	 * @returns {Promise}
	 */
	uploadSourceFiles() {
		const uploadTranslations = require( './translations/uploadsourcefiles' );
		const getToken = require( './translations/gettoken' );

		return getToken()
			.then( credentials => uploadTranslations( credentials ) );
	},

	/**
	 * Downloads translations from the Transifex server.
	 *
	 * @returns {Promise}
	 */
	downloadTranslations() {
		const downloadTranslations = require( './translations/downloadtranslations' );
		const getToken = require( './translations/gettoken' );

		return getToken()
			.then( credentials => downloadTranslations( credentials ) );
	},

	/**
	 * Uploads translations to the Transifex for the given package from translation files
	 * that are saved in the 'ckeditor5/packages/ckeditor5-[packageName]/lang/translations' directory.
	 *
	 * IMPORTANT: Take care, this will overwrite existing translations on the Transifex.
	 *
	 * @param {String} packageName
	 * @returns {Promise}
	 */
	uploadTranslations( packageName ) {
		const updateTranslations = require( './translations/uploadtranslations' );
		const getToken = require( './translations/gettoken' );

		return getToken()
			.then( credentials => updateTranslations( credentials, packageName ) );
	}
};

module.exports = tasks;
