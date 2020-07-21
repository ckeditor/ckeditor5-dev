/**
 * @license Copyright (c) 2003-2020, CKSource - Frederico Knabben. All rights reserved.
 * Licensed under the terms of the MIT License (see LICENSE.md).
 */

/**
 * A fixer for doclet descriptions including code snippets.
 * After upgrading JSDoc to v. 3.6.4 snippets started to contain leading tabs or spaces.
 * This plugin removes that left padding.
 */
exports.handlers = {
	parseComplete: e => {
		for ( const doclet of e.doclets ) {
			if ( doclet.description ) {
				doclet.description = fixDescription( doclet.description );
			}

			if ( doclet.classdesc ) {
				doclet.classdesc = fixDescription( doclet.classdesc );
			}
		}
	}
};

function fixDescription( desc ) {
	return desc.replace( /<pre><code>(.*?)<\/code><\/pre>/gs, ( _match, codeSnippetContent ) => {
		const codeRows = codeSnippetContent.split( '\n' );

		let paddingSize = 0;

		while ( true ) {
			const paddingText = codeRows[ 0 ].slice( 0, paddingSize + 1 );

			// When some row starts with a different text or
			// padding contains some non-whitespace characters
			// then it means that it is no loner a padding.
			if (
				( codeRows.some( row => /\S/.test( row ) && !row.startsWith( paddingText ) ) ) ||
				/\S/.test( paddingText )
			) {
				break;
			}

			paddingSize++;
		}

		return (
			'<pre><code>' +
			codeRows.map( row => row.slice( paddingSize ) ).join( '\n' ) +
			'</code></pre>'
		);
	} );
}
