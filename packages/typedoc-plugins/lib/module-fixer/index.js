/**
 * @license Copyright (c) 2003-2022, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const { Converter, ReflectionKind } = require( 'typedoc' );

/**
 * The `typedoc-plugin-module-fixer` reads the module name specified in the `@module` tag name.
 *
 *      @module package/file
 *
 * For the example specified above, a name of the parsed module should be equal to "package/file".
 *
 * It may happen that import statements are specified above the "@module" block code.
 * In such a case, built-in plugin in `typedoc` does not read its value properly.
 */
module.exports = {
	load( app ) {
		app.converter.on(
			Converter.EVENT_CREATE_DECLARATION,
			function( _context, reflection, node ) {
				if ( reflection.kind !== ReflectionKind.Module ) {
					return;
				}

				// Iterate over statements...
				for ( const statement of node.statements ) {
					if ( !Array.isArray( statement.jsDoc ) ) {
						continue;
					}

					// ...to find a JSDoc block code...
					for ( const jsDoc of statement.jsDoc ) {
						// ...that represents a module definition.
						const [ moduleTag ] = ( jsDoc.tags || [] ).filter( tag => {
							return tag.tagName.originalKeywordKind === 141;
						} );

						if ( !moduleTag ) {
							continue;
						}

						// When found, use its value as a module name.
						if ( reflection.name !== moduleTag.comment ) {
							reflection.originalName = reflection.name;
							reflection.name = moduleTag.comment;

							return;
						}
					}
				}
			}
		);
	}
};
