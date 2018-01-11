/**
 * @license Copyright (c) 2003-2018, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const PO = require( 'pofile' );

/**
 * Returns translations stripped from personal data.
 *
 * @param {String} poFileContent Content of the translation file.
 * @returns {String}
 */
module.exports = function cleanPoFileContent( poFileContent ) {
	const po = PO.parse( poFileContent );

	// Removes personal data from the headers
	po.headers = {
		Language: po.headers.Language,
		'Language-Team': po.headers[ 'Language-Team' ],
		'Plural-Forms': po.headers[ 'Plural-Forms' ],
	};

	// Removes comments other than the comment about copyrights.
	po.comments = [ po.comments.find( comment => comment.includes( 'Copyright' ) ) ];

	return po.toString();
};
