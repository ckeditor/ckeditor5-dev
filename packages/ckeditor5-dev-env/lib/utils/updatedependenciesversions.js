/**
 * @license Copyright (c) 2003-2017, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const { tools } = require( '@ckeditor/ckeditor5-dev-utils' );

/**
 * Updates dependencies and devDependencies in `package.json`.
 *
 * @param {Object} dependencies Packages with versions of CKEditor 5 dependencies.
 * @param {String} packageJsonPath An absolute path to the `package.json` file.
 */
module.exports = function updateDependenciesVersions( dependencies, packageJsonPath ) {
	const packageNames = Object.keys( dependencies );

	// Update the package.json dependencies.
	if ( !packageNames.length ) {
		return;
	}

	tools.updateJSONFile( packageJsonPath, ( json ) => {
		// Package does not have any dependencies.
		if ( !json.dependencies && !json.devDependencies ) {
			return json;
		}

		for ( const item of packageNames ) {
			if ( json.dependencies[ item ] ) {
				json.dependencies[ item ] = `^${ dependencies[ item ] }`;
			} else if ( json.devDependencies[ item ] ) {
				json.devDependencies[ item ] = `^${ dependencies[ item ] }`;
			}
		}

		return json;
	} );
};
