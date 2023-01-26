/**
 * @license Copyright (c) 2003-2023, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const { tools } = require( '@ckeditor/ckeditor5-dev-utils' );

/**
 * Updates dependencies and devDependencies in `package.json`.
 *
 * @param {Map} dependencies Packages with versions of CKEditor 5 dependencies.
 * @param {String} packageJsonPath An absolute path to the `package.json` file.
 */
module.exports = function updateDependenciesVersions( dependencies, packageJsonPath ) {
	tools.updateJSONFile( packageJsonPath, json => {
		for ( const item of dependencies.keys() ) {
			const version = dependencies.get( item );

			if ( json.dependencies && json.dependencies[ item ] ) {
				json.dependencies[ item ] = `^${ version }`;
			} else if ( json.devDependencies && json.devDependencies[ item ] ) {
				json.devDependencies[ item ] = `^${ version }`;
			} else if ( json.peerDependencies && json.peerDependencies[ item ] ) {
				json.peerDependencies[ item ] = version;
			}
		}

		return json;
	} );
};
