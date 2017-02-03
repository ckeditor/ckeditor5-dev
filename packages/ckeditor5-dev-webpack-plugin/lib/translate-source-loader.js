'use strict';

/**
 * Very simple loader that runs the translateSource function only which is provided by the CKEditorWebpackPlugin.
 */
module.exports = function translateSourceLoader( source ) {
	return this.options.translateSource( source );
};

