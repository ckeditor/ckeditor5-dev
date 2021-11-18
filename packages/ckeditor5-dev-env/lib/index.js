/**
 * @license Copyright (c) 2003-2021, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

module.exports = {
	async releaseSubRepositories( ...args ) {
		return require( './release-tools/tasks/releasesubrepositories' )( ...args );
	},

	async bumpVersions( ...args ) {
		return require( './release-tools/tasks/bumpversions' )( ...args );
	},

	async generateChangelogForSinglePackage( ...args ) {
		return require( './release-tools/tasks/generatechangelogforsinglepackage' )( ...args );
	},

	async generateChangelogForMonoRepository( ...args ) {
		return require( './release-tools/tasks/generatechangelogformonorepository' )( ...args );
	},

	createPotFiles( ...args ) {
		return require( './translations/createpotfiles' )( ...args );
	},

	async uploadPotFiles( ...args ) {
		return require( './translations/upload' )( ...args );
	},

	async downloadTranslations( ...args ) {
		return require( './translations/download' )( ...args );
	}
};
