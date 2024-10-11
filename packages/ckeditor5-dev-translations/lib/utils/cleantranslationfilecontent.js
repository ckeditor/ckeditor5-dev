/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import PO from 'pofile';

/**
 * Removes unused headers from the translation file.
 *
 * @param {string} translationFileContent Content of the translation file.
 * @returns {string}
 */
export default function cleanTranslationFileContent( translationFileContent ) {
	const translations = PO.parse( translationFileContent );

	translations.headers = {
		Language: translations.headers.Language,
		'Plural-Forms': translations.headers[ 'Plural-Forms' ],
		'Content-Type': 'text/plain; charset=UTF-8'
	};

	return translations.toString();
}
