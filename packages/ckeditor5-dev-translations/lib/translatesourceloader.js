/**
 * @license Copyright (c) 2003-2023, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

/**
 * Very simple loader that runs the translateSource function only on the source.
 * translateSource is provided by the CKEditorTranslationsPlugin.
 *
 * @param {String} source Content of the resource file
 * @param {Object} map A source map consumed by the `source-map` package.
 */
module.exports = function translateSourceLoader( source, map ) {
	const output = this.query.translateSource( source, this.resourcePath );

	this.callback( null, output, map );
};
