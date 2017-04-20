/**
 * @license Copyright (c) 2003-2017, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const getPackageJson = require( './getpackagejson' );
const versions = require( './versions' );

/**
 * Returns the latest created tag for given repository. E.g:
 *   - some-package@0.0.1 - for package located in multi-package repository,
 *   - v0.0.1 - for package located in single-package repository
 *
 * Returns null if any tag has not created yet.
 *
 * @param {Object} options
 * @param {Boolean} options.isSubPackage Is the function called inside a repository
 * with multiple packages (which is management by Lerna)?
 * @returns {String|null}
 */
module.exports = function getLastTagForPackage( options ) {
	const fromVersion = versions.getLastFromChangelog();

	if ( !fromVersion ) {
		return null;
	}

	if ( options.isSubPackage ) {
		const packageJson = getPackageJson();

		return packageJson.name + '@' + fromVersion;
	}

	return 'v' + fromVersion;
};
