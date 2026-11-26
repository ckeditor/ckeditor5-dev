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
 * @param {string} [options.corePackagePath] Path to the core package. If omitted, the package basename is used for backwards compatibility.
 * @param {boolean} options.skipLicenseHeader Whether to skip adding the license header to newly created translation files.
 * @param {string} options.translationsTypeImportSource Module from which generated translation files import the `Translations` type.
 * @param {boolean} [options.dryRun=false] Whether to only find the missing and outdated translation files, without changing any file.
 * @returns {Promise<{ missingFilePaths: Array.<string>, outdatedFilePaths: Array.<string> }>} Paths to the translation files that did not
 * exist and to the translation files that were not synchronized before the call.
 */
export default async function synchronizeTranslationsBasedOnContext( {
	packageContexts,
	sourceMessages,
	corePackagePath,
	skipLicenseHeader,
	translationsTypeImportSource,
	dryRun = false
} ) {
	const languages = getLanguages();
	const missingFilePaths = [];
	const outdatedFilePaths = [];

	for ( const { packagePath, contextContent } of packageContexts ) {
		if ( Object.keys( contextContent ).length === 0 ) {
			continue;
		}

		missingFilePaths.push( ...createMissingPackageTranslations( {
			packagePath,
			contexts: contextContent,
			corePackagePath,
			skipLicenseHeader,
			translationsTypeImportSource,
			dryRun
		} ) );

		const sourceMessagesForPackage = Object.keys( contextContent )
			.map( messageId => sourceMessages.find( message => message.id === messageId ) )
			.filter( Boolean );
		const translationFilePaths = glob.sync( upath.join( packagePath, TRANSLATION_FILES_PATH, '*.ts' ) ).sort();
		const englishTranslationFilePath = translationFilePaths.find( filePath => filePath.endsWith( 'en.ts' ) );

		// In the dry run, the English file can be missing. The synchronization would create it with an empty dictionary.
		const { dictionary: englishTranslations } = englishTranslationFilePath ?
			await readTranslationFile( englishTranslationFilePath ) :
			{ dictionary: {} };
		const changedEnglishTranslations = getChangedEnglishTranslations( englishTranslations, sourceMessagesForPackage );
		const isCorePackage = corePackagePath ? packagePath === corePackagePath : upath.basename( packagePath ) === 'ckeditor5-core';

		for ( const translationFilePath of translationFilePaths ) {
			const originalFile = fs.readFileSync( translationFilePath, 'utf-8' );
			const { language, dictionary, preamble } = await readTranslationFile( translationFilePath );
			const languageInfo = languages.find( item => item.languageFileName === language );

			if ( !languageInfo ) {
				throw new Error( `Unsupported translation language "${ language }" in file "${ translationFilePath }".` );
			}

			const { languageCode } = languageInfo;
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
				preamble,
				translationsTypeImportSource
			} );

			if ( originalFile === updatedFile ) {
				continue;
			}

			outdatedFilePaths.push( translationFilePath );

			if ( !dryRun ) {
				fs.writeFileSync( translationFilePath, updatedFile, 'utf-8' );
			}
		}
	}

	return { missingFilePaths, outdatedFilePaths };
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
