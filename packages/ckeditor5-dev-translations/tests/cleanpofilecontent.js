/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { describe, expect, it } from 'vitest';
import cleanPoFileContent from '../lib/cleanpofilecontent.js';

describe( 'translations', () => {
	describe( 'cleanPoFileContent()', () => {
		it( 'cleans po files from personal data and add the special header', () => {
			const poFileContent =
// eslint-disable-next-line max-len
`# Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
# Translators:
# Xuxxx Satxxx <xxxx@gmail.com>, 2017
msgid ""
msgstr ""
"Last-Translator: Xuxxx Satxxx <xxxx@gmail.com>, 2017\\n"
"Language: ast\\n"
"Language-Team: Asturian (https://www.transifex.com/ckeditor/teams/11143/ast/)\\n"
"Plural-Forms: nplurals=2; plural=(n != 1);\\n"
"Content-Type: text/plain; charset=UTF-8\\n"

msgctxt "Label for the url input in the Link dialog."
msgid "Link URL"
msgstr "URL del enllaz"
`;

			const expectedResult =
// eslint-disable-next-line max-len
`# Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
#
#                                     !!! IMPORTANT !!!
#
#         Before you edit this file, please keep in mind that contributing to the project
#                translations is possible ONLY via the Transifex online service.
#
#         To submit your translations, visit https://www.transifex.com/ckeditor/ckeditor5.
#
#                   To learn more, check out the official contributor's guide:
#     https://ckeditor.com/docs/ckeditor5/latest/framework/guides/contributing/contributing.html
#
msgid ""
msgstr ""
"Language: ast\\n"
"Language-Team: Asturian (https://www.transifex.com/ckeditor/teams/11143/ast/)\\n"
"Plural-Forms: nplurals=2; plural=(n != 1);\\n"
"Content-Type: text/plain; charset=UTF-8\\n"

msgctxt "Label for the url input in the Link dialog."
msgid "Link URL"
msgstr "URL del enllaz"
`;

			const result = cleanPoFileContent( poFileContent );

			expect( result ).to.equal( expectedResult );
		} );

		it( 'does not add the copyright line if the source file misses it', () => {
			const poFileContent =
// eslint-disable-next-line max-len
`# Translators:
# Xuxxx Satxxx <xxxx@gmail.com>, 2017
msgid ""
msgstr ""
"Last-Translator: Xuxxx Satxxx <xxxx@gmail.com>, 2017\\n"
"Language: ast\\n"
"Language-Team: Asturian (https://www.transifex.com/ckeditor/teams/11143/ast/)\\n"
"Plural-Forms: nplurals=2; plural=(n != 1);\\n"
"Content-Type: text/plain; charset=UTF-8\\n"

msgctxt "Label for the url input in the Link dialog."
msgid "Link URL"
msgstr "URL del enllaz"
`;

			const expectedResult =
// eslint-disable-next-line max-len
`#                                     !!! IMPORTANT !!!
#
#         Before you edit this file, please keep in mind that contributing to the project
#                translations is possible ONLY via the Transifex online service.
#
#         To submit your translations, visit https://www.transifex.com/ckeditor/ckeditor5.
#
#                   To learn more, check out the official contributor's guide:
#     https://ckeditor.com/docs/ckeditor5/latest/framework/guides/contributing/contributing.html
#
msgid ""
msgstr ""
"Language: ast\\n"
"Language-Team: Asturian (https://www.transifex.com/ckeditor/teams/11143/ast/)\\n"
"Plural-Forms: nplurals=2; plural=(n != 1);\\n"
"Content-Type: text/plain; charset=UTF-8\\n"

msgctxt "Label for the url input in the Link dialog."
msgid "Link URL"
msgstr "URL del enllaz"
`;

			const result = cleanPoFileContent( poFileContent );

			expect( result ).to.equal( expectedResult );
		} );

		it( 'removes the contribute url when passing options.simplifyLicenseHeader=true ', () => {
			const poFileContent =
`# Translators:
# Xuxxx Satxxx <xxxx@gmail.com>, 2017
msgid ""
msgstr ""
"Last-Translator: Xuxxx Satxxx <xxxx@gmail.com>, 2017\\n"
"Language: ast\\n"
"Language-Team: Asturian (https://www.transifex.com/ckeditor/teams/11143/ast/)\\n"
"Plural-Forms: nplurals=2; plural=(n != 1);\\n"
"Content-Type: text/plain; charset=UTF-8\\n"

msgctxt "Label for the url input in the Link dialog."
msgid "Link URL"
msgstr "URL del enllaz"
`;

			const expectedResult =
`#                                     !!! IMPORTANT !!!
#
#         Before you edit this file, please keep in mind that contributing to the project
#                translations is possible ONLY via the Transifex online service.
#
msgid ""
msgstr ""
"Language: ast\\n"
"Language-Team: Asturian (https://www.transifex.com/ckeditor/teams/11143/ast/)\\n"
"Plural-Forms: nplurals=2; plural=(n != 1);\\n"
"Content-Type: text/plain; charset=UTF-8\\n"

msgctxt "Label for the url input in the Link dialog."
msgid "Link URL"
msgstr "URL del enllaz"
`;

			const result = cleanPoFileContent( poFileContent, { simplifyLicenseHeader: true } );

			expect( result ).to.equal( expectedResult );
		} );
	} );
} );
