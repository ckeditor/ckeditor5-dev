/**
 * @license Copyright (c) 2003-2022, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const { ParameterType } = require( 'typedoc' );

/**
 * The `typedoc-plugin-config-provider` adds declaration to the configuration object.
 */
module.exports = {
	load( app ) {
		app.options.addDeclaration( {
			type: ParameterType.String,
			name: 'cwd',
			help: 'An absolute path pointing to the project root directory.'
		} );
	}
};
