/**
 * @license Copyright (c) 2003-2022, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const { Converter, ReflectionKind } = require( 'typedoc' );

module.exports = {
	load( app ) {
		app.converter.on(
			Converter.EVENT_CREATE_DECLARATION,
			function( _context, reflection ) {
				if ( reflection.kind === ReflectionKind.Module && reflection.name.endsWith( 'inserttopriorityarray' ) ) {
					// console.log( node.externalModuleIndicator );
					// console.log( Object.keys(reflection) );
					// console.log( reflection.sources[0].file.reflections );
					// console.log( require( 'util' ).inspect( reflection, { showHidden: false, depth: 1, colors: true } ) );
				}
			}
		);
	}
};
