/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import upath from 'upath';
import fs from 'fs-extra';
import PO from 'pofile';
import { fileURLToPath } from 'url';
import getLanguages from './getlanguages.js';
import { TRANSLATION_FILES_PATH } from './constants.js';
import cleanTranslationFileContent from './cleantranslationfilecontent.js';
import getHeaders from './getheaders.js';

const __filename = fileURLToPath( import.meta.url );
const __dirname = upath.dirname( __filename );

const TRANSLATION_TEMPLATE_PATH = upath.join( __dirname, '../templates/translation.po' );

/**
 * @param {object} options
 * @param {string} options.packagePath Path to the package to check for missing translations.
 * @param {boolean} options.skipLicenseHeader Whether to skip adding the license header to newly created translation files.
 */
export default function createMissingPackageTranslations( { packagePath, skipLicenseHeader } ) {
	const translationsTemplate = skipLicenseHeader ? '' : fs.readFileSync( TRANSLATION_TEMPLATE_PATH, 'utf-8' );

	for ( const { localeCode, languageCode, languageFileName } of getLanguages() ) {
		const translationFilePath = upath.join( packagePath, TRANSLATION_FILES_PATH, `${ languageFileName }.po` );

		if ( fs.existsSync( translationFilePath ) ) {
			continue;
		}

		const translations = PO.parse( translationsTemplate );
		translations.headers = getHeaders( languageCode, localeCode );

		fs.outputFileSync( translationFilePath, cleanTranslationFileContent( translations ).toString(), 'utf-8' );
	}
}
