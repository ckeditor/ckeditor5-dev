/**
 * @license Copyright (c) 2003-2020, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

module.exports = {
	meta: {
		type: 'problem',
		docs: {
			description: 'Disallow relative imports from CKEditor5 packages.',
			category: 'CKEditor5'
		},
		fixable: 'code',
		schema: []
	},
	create( context ) {
		return {
			ImportDeclaration: node => {
				const importPath = node.source.value;
				const indexOfLastDoubleDots = importPath.indexOf( '../ckeditor5-' );

				if ( indexOfLastDoubleDots >= 0 ) {
					context.report( {
						node,
						message: 'Imports of CKEditor5 packages shouldn\'t be relative.',
						fix: fixer => {
							// The range starts after the quote sign.
							const rangeStart = node.source.range[ 0 ] + 1;

							// The range end is the length of '../' string plus the index of '../ckeditor5-' in path.
							const rangeEnd = rangeStart + indexOfLastDoubleDots + 3;

							// Replace relative path in import '../[../]{0,n}' with '@ckeditor/' to make package import.
							return fixer.replaceTextRange( [ rangeStart, rangeEnd ], '@ckeditor/' );
						}
					} );
				}
			}
		};
	}
};
