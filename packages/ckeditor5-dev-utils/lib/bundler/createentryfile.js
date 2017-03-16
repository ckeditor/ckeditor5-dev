/**
 * @license Copyright (c) 2003-2017, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const fs = require( 'fs' );
const getPlugins = require( './getplugins' );
const getEditorConfig = require( './geteditorconfig' );

/**
 * @param {String} destinationPath A path where entry file will be saved.
 * @param {Object} options
 * @param {Array.<String>} options.plugins
 * @param {String} options.moduleName
 * @param {String} options.editor
 * @param {Object} options.config
 */
module.exports = function createEntryFile( destinationPath, options ) {
	const entryFileContent = renderEntryFile( options );

	fs.writeFileSync( destinationPath, entryFileContent );
};

function renderEntryFile( options ) {
	const plugins = getPlugins( options.plugins );

	let content = `/**
 * @license Copyright (c) 2003-2017, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */
 
import ${ options.moduleName }Base from '${ options.editor }';
`;

	for ( const pluginName of Object.keys( plugins ) ) {
		content += `import ${ pluginName } from '${ plugins[ pluginName ] }';\n`;
	}

	content += `
export default class ${ options.moduleName } extends ${ options.moduleName }Base {}

${ options.moduleName }.build = {
	plugins: [ ${ Object.keys( plugins ).join( ', ' ) } ],
	config: ${ getEditorConfig( options.config ) }
};
`;

	return content;
}
