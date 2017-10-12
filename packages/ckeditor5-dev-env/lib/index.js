/**
 * @license Copyright (c) 2003-2017, CKSource - Frederico Knabben. All rights reserved.
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
};

module.exports = tasks;
