/**
 * @license Copyright (c) 2003-2017, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const executeOnDependencies = require( './release-tools/utils/executeondependencies' );

const tasks = {
	generateChangelog: require( './release-tools/tasks/generatechangelog' ),

	createRelease: require( './release-tools/tasks/createrelease' ),

	/**
	 * Generates the changelog for dependencies.
	 *
	 * @param {Object} options
	 * @params {String} options.cwd Current work directory.
	 * @params {String} options.packages A relative path to the packages.
	 * @returns {Promise}
	 */
	generateChangelogForDependencies( options ) {
		const execOptions = {
			cwd: options.cwd,
			packages: options.packages
		};

		const functionToExecute = ( repositoryName, repositoryPath ) => {
			process.chdir( repositoryPath );

			return tasks.generateChangelog();
		};

		return executeOnDependencies( execOptions, functionToExecute )
			.then( () => {
				process.chdir( options.cwd );
			} );
	},

	/**
	 * Generates the changelog for dependencies.
	 *
	 * @param {Object} options
	 * @params {String} options.cwd Current work directory.
	 * @params {String} options.packages A relative path to the packages.
	 * @params {String} options.token GitHub token used to authenticate.
	 * @params {Object} options.dependencies Dependencies with versions of other CKEditor5 package.
	 * @returns {Promise}
	 */
	releaseDependencies( options ) {
		const execOptions = {
			cwd: options.cwd,
			packages: options.packages
		};

		const functionToExecute = ( repositoryName, repositoryPath ) => {
			process.chdir( repositoryPath );

			return tasks.createRelease( {
				token: options.token,
				dependencies: options.dependencies
			} );
		};

		return executeOnDependencies( execOptions, functionToExecute )
			.then( () => {
				process.chdir( options.cwd );
			} );
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
		const loginOptions = require( './translations/getloginoptions' )( process.argv.slice( 2 ) );

		return uploadTranslations( loginOptions );
	},

	/**
	 * Download translations from the Transifex server.
	 *
	 * @returns {Promise}
	 */
	downloadTranslations() {
		const downloadTranslations = require( './translations/download' );
		const loginOptions = require( './translations/getloginoptions' )( process.argv.slice( 2 ) );

		return downloadTranslations( loginOptions );
	}
};

module.exports = tasks;
