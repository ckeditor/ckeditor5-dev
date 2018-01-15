/**
 * @license Copyright (c) 2003-2018, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const chai = require( 'chai' );
const expect = chai.expect;
const cleanPoFileContent = require( '../../lib/translations/cleanpofilecontent' );

describe( 'translations', () => {
	describe( 'cleanPoFileContent()', () => {
		it( 'clean po files from personal data', () => {
			const poFileContent =
// eslint-disable-next-line max-len
`# Copyright (c) 2003-2018, CKSource - Frederico Knabben. All rights reserved.
# Translators:
# Xuxxx Satxxx <xxxx@gmail.com>, 2017
msgid ""
msgstr ""
"Last-Translator: Xuxxx Satxxx <xxxx@gmail.com>, 2017\\n"
"Language: ast\\n"
"Language-Team: Asturian (https://www.transifex.com/ckeditor/teams/11143/ast/)\\n"
"Plural-Forms: nplurals=2; plural=(n != 1);\\n"

msgctxt "Label for the url input in the Link dialog."
msgid "Link URL"
msgstr "URL del enllaz"
`;

			const expectedResult =
// eslint-disable-next-line max-len
`# Copyright (c) 2003-2018, CKSource - Frederico Knabben. All rights reserved.
msgid ""
msgstr ""
"Language: ast\\n"
"Language-Team: Asturian (https://www.transifex.com/ckeditor/teams/11143/ast/)\\n"
"Plural-Forms: nplurals=2; plural=(n != 1);\\n"

msgctxt "Label for the url input in the Link dialog."
msgid "Link URL"
msgstr "URL del enllaz"
`;

			const result = cleanPoFileContent( poFileContent );

			expect( result ).to.equal( expectedResult );
		} );
	} );
} );
