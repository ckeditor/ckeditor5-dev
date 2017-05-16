/**
 * @license Copyright (c) 2003-2017, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const { tools } = require( '@ckeditor/ckeditor5-dev-utils' );

/**
 * Updates dependencies and devDependencies in `package.json`.
 *
 * @param {Map} dependencies Packages with versions of CKEditor 5 dependencies.
 * @param {String} packageJsonPath An absolute path to the `package.json` file.
 * @returns {Boolean}
 */
module.exports = function updateDependenciesVersions( dependencies, packageJsonPath ) {
	tools.updateJSONFile( packageJsonPath, json => {
		for ( const item of dependencies.keys() ) {
			const version = dependencies.get( item ).version;

			if ( json.dependencies && json.dependencies[ item ] ) {
				json.dependencies[ item ] = `^${ version }`;
			} else if ( json.devDependencies && json.devDependencies[ item ] ) {
				json.devDependencies[ item ] = `^${ version }`;
			}
		}

		return json;
	} );
};
