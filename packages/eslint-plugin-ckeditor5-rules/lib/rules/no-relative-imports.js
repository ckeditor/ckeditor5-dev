'use strict';

module.exports = {
	meta: {
		type: 'problem',

		docs: {
			description: 'Disallow relative imports from CKEditor5 packages',
			category: 'CKEditor5'
		},
		fixable: 'code',
		schema: [] // no options
	},
	create( context ) {
		return {
			ImportDeclaration: node => {
				const importPath = node.source.value;

				if ( importPath.startsWith( '../../ckeditor5-' ) ) {
					context.report( {
						node,
						message: 'Imports of CKEditor5 packages shouldn\'t be relative',
						fix: fixer => {
							// The range starts after the quote sign
							const rangeStart = node.source.range[ 0 ] + 1;

							// Replace '../..' with '@ckeditor' to make package import.
							return fixer.replaceTextRange( [ rangeStart, rangeStart + 5 ], '@ckeditor' );
						}
					} );
				}
			}
		};
	}
};
