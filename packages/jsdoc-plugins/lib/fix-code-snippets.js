/**
 * @license Copyright (c) 2003-2023, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

/**
 * A fixer for doclet descriptions including code snippets.
 * After upgrading JSDoc to v. 3.6.4 snippets started to contain leading tabs or spaces.
 * This plugin removes that left padding.
 */
exports.handlers = {
	parseComplete: e => {
		/** @type {Array.<Doclet>} */
		const doclets = e.doclets;

		for ( const doclet of doclets ) {
			if ( doclet.description ) {
				doclet.description = fixDescription( doclet.description );
			}

			if ( doclet.classdesc ) {
				doclet.classdesc = fixDescription( doclet.classdesc );
			}

			if ( doclet.params ) {
				for ( const param of doclet.params ) {
					if ( param.description ) {
						param.description = fixDescription( param.description );
					}
				}
			}

			if ( doclet.returns ) {
				for ( const returnObject of doclet.returns ) {
					if ( returnObject.description ) {
						returnObject.description = fixDescription( returnObject.description );
					}
				}
			}

			if ( doclet.properties ) {
				for ( const property of doclet.properties ) {
					if ( property.description ) {
						property.description = fixDescription( property.description );
					}
				}
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
