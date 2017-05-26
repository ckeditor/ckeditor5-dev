/**
 * @license Copyright (c) 2003-2017, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const fs = require( 'fs' );
const getPlugins = require( './getplugins' );

/**
 * Generates an entry file which can be compiled by bundler, e.g. Webpack or Rollup.
 *
 * @param {String} destinationPath A path where entry file will be saved.
 * @param {Object} options
 * @param {String} configPath A path to the configuration of the build. The file must expose a "config" key as a config for the editor.
 * @param {Array.<String>} options.plugins An array with paths to the plugins for the editor.
 * @param {String} options.moduleName Name of exported UMD module.
 * @param {String} options.editor A path to class which defined the editor.
 */
module.exports = function createEntryFile( destinationPath, configPath, options ) {
	const entryFileContent = renderEntryFile( configPath, options );

	fs.writeFileSync( destinationPath, entryFileContent );
};

function renderEntryFile( configPath, options ) {
	const plugins = getPlugins( options.plugins );
	const date = new Date();

	let content = `/**
 * @license Copyright (c) 2003-${ date.getFullYear() }, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import ${ options.moduleName }Base from '${ options.editor }';
`;

	for ( const pluginName of Object.keys( plugins ) ) {
		content += `import ${ pluginName } from '${ plugins[ pluginName ] }';\n`;
	}

	content += `
export class ${ options.moduleName } extends ${ options.moduleName }Base {}

${ options.moduleName }.build = {
	plugins: [
		${ Object.keys( plugins ).join( ',\n\t\t' ) }
	],
	config: require( '${ configPath }' ).config
};
`;

	return content;
}
