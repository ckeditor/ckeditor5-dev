/**
 * @license Copyright (c) 2003-2017, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const path = require( 'path' );

/**
 * @param {Array.<String>} pluginPaths
 * @returns {Object}
 */
module.exports = function getPlugins( pluginPaths ) {
	const plugins = {};

	pluginPaths.forEach( ( pathToFile ) => {
		const basePluginName = capitalize( path.basename( pathToFile, '.js' ) );
		let pluginName = basePluginName + 'Plugin';
		let i = 0;

		while ( pluginName in plugins ) {
			pluginName = basePluginName + ( ++i ).toString() + 'Plugin';
		}

		plugins[ pluginName ] = pathToFile;
	} );

	return plugins;
};

function capitalize( string ) {
	return string.charAt( 0 ).toUpperCase() + string.slice( 1 );
}
