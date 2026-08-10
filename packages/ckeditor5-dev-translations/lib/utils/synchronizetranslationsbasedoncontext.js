/**
 * @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import upath from 'upath';
import fs from 'node:fs';
import { glob } from 'glob';
import { getFormula, getNPlurals } from 'plural-forms';
import createMissingPackageTranslations from './createmissingpackagetranslations.js';
import { TRANSLATION_FILES_PATH } from './constants.js';
import getLanguages from './getlanguages.js';
import addTranslation from './addtranslation.js';
import { readTranslationFile, serializeTranslationFile } from './translationfile.js';

/**
 * @param {object} options
 * @param {Array.<TranslationsContext>} options.packageContexts An array of language contexts.
 * @param {Array.<TranslatableEntry>} options.sourceMessages An array of i18n source messages.
 * @param {boolean} options.skipLicenseHeader Whether to skip adding the license header to newly created translation files.
 * @param {string} options.translationsTypeImportSource Module from which generated translation files import the `Translations` type.
 */
export default async function synchronizeTranslationsBasedOnContext( {
	packageContexts,
	sourceMessages,
	skipLicenseHeader,
	translationsTypeImportSource
} ) {
	const languages = getLanguages();

	for ( const { packagePath, contextContent } of packageContexts ) {
		if ( Object.keys( contextContent ).length === 0 ) {
			continue;
		}

		createMissingPackageTranslations( {
			packagePath,
			contexts: contextContent,
			skipLicenseHeader,
			translationsTypeImportSource
		} );

		const sourceMessagesForPackage = Object.keys( contextContent )
			.map( messageId => sourceMessages.find( message => message.id === messageId ) )
			.filter( Boolean );
		const translationFilePaths = glob.sync( upath.join( packagePath, TRANSLATION_FILES_PATH, '*.ts' ) );
		const englishTranslationFilePath = translationFilePaths.find( filePath => filePath.endsWith( 'en.ts' ) );
		const { dictionary: englishTranslations } = await readTranslationFile( englishTranslationFilePath );
		const changedEnglishTranslations = getChangedEnglishTranslations( englishTranslations, sourceMessagesForPackage );
		const isCorePackage = upath.basename( packagePath ) === 'ckeditor5-core';

		for ( const translationFilePath of translationFilePaths ) {
			const originalFile = fs.readFileSync( translationFilePath, 'utf-8' );
			const { language, dictionary } = await readTranslationFile( translationFilePath );
			const { languageCode } = languages.find( item => item.languageFileName === language );
			const numberOfPluralForms = getNPlurals( languageCode );
			const synchronizedDictionary = {};

			for ( const messageId of Object.keys( contextContent ) ) {
				const message = sourceMessagesForPackage.find( message => message.id === messageId );

				if ( !message ) {
					if ( Object.hasOwn( dictionary, messageId ) ) {
						const value = dictionary[ messageId ];

						synchronizedDictionary[ messageId ] = Array.isArray( value ) ?
							Array.from( { length: numberOfPluralForms }, ( unused, index ) => value[ index ] || '' ) :
							value;
					}

					continue;
				}

				let value = dictionary[ message.id ];

				if ( changedEnglishTranslations.includes( message.id ) || value === undefined ) {
					const translations = addTranslation( { languageCode, numberOfPluralForms, message } );
					value = message.plural ? translations : translations[ 0 ];
				}

				if ( message.plural ) {
					const values = Array.isArray( value ) ? value : [ value ];
					value = Array.from( { length: numberOfPluralForms }, ( unused, index ) => values[ index ] || '' );
				}

				synchronizedDictionary[ message.id ] = value;
			}

			const updatedFile = serializeTranslationFile( {
				language,
				dictionary: synchronizedDictionary,
				contexts: contextContent,
				pluralFunction: isCorePackage ? getFormula( languageCode ) : null,
				skipLicenseHeader,
				translationsTypeImportSource
			} );

			if ( originalFile !== updatedFile ) {
				fs.writeFileSync( translationFilePath, updatedFile, 'utf-8' );
			}
		}
	}
}

function getChangedEnglishTranslations( englishTranslations, sourceMessagesForPackage ) {
	return sourceMessagesForPackage
		.filter( message => {
			const translation = englishTranslations[ message.id ];

			if ( translation === undefined ) {
				return false;
			}

			const values = Array.isArray( translation ) ? translation : [ translation ];
			return values[ 0 ] !== message.string || ( message.plural ? values[ 1 ] !== message.plural : false );
		} )
		.map( message => message.id );
}
