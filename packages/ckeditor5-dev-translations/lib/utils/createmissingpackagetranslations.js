/**
 * @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import upath from 'upath';
import fs from 'node:fs';
import { getFormula } from 'plural-forms';
import getLanguages from './getlanguages.js';
import { TRANSLATION_FILES_PATH } from './constants.js';
import { serializeTranslationFile } from './translationfile.js';

/**
 * @param {object} options
 * @param {string} options.packagePath Path to the package to check for missing translations.
 * @param {Record<string, string>} options.contexts Translation contexts.
 * @param {string} [options.corePackagePath] Path to the core package. If omitted, the package basename is used for backwards compatibility.
 * @param {boolean} options.skipLicenseHeader Whether to skip adding the license header to newly created translation files.
 * @param {string} options.translationsTypeImportSource Module from which generated translation files import the `Translations` type.
 */
export default function createMissingPackageTranslations( {
	packagePath,
	contexts,
	corePackagePath,
	skipLicenseHeader,
	translationsTypeImportSource
} ) {
	const isCorePackage = corePackagePath ? packagePath === corePackagePath : upath.basename( packagePath ) === 'ckeditor5-core';

	for ( const { languageCode, languageFileName } of getLanguages() ) {
		const translationFilePath = upath.join( packagePath, TRANSLATION_FILES_PATH, `${ languageFileName }.ts` );

		if ( fs.existsSync( translationFilePath ) ) {
			continue;
		}

		const content = serializeTranslationFile( {
			language: languageFileName,
			dictionary: {},
			contexts,
			pluralFunction: isCorePackage ? getFormula( languageCode ) : null,
			skipLicenseHeader,
			translationsTypeImportSource
		} );

		fs.mkdirSync( upath.dirname( translationFilePath ), { recursive: true } );
		fs.writeFileSync( translationFilePath, content, 'utf-8' );
	}
}
