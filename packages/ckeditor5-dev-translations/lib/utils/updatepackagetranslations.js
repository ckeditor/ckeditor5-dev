/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import upath from 'upath';
import fs from 'fs-extra';
import PO from 'pofile';
import { glob } from 'glob';
import cleanPoFileContent from '../cleanpofilecontent.js';
import createMissingPackageTranslations from './createmissingpackagetranslations.js';
import { TRANSLATION_FILES_PATH } from './constants.js';

/**
 * @param {object} options
 * @param {Array.<Context>} options.packageContexts An array of language contexts.
 * @param {Array.<Message>} options.sourceMessages An array of i18n source messages.
 */
export default function updatePackageTranslations( { packageContexts, sourceMessages } ) {
	// For each package:
	for ( const { packagePath, contextContent } of packageContexts ) {
		// (1) Skip packages that do not contain language context.
		const hasContext = Object.keys( contextContent ).length > 0;

		if ( !hasContext ) {
			continue;
		}

		// (2) Create missing translation files for languages that do not have own "*.po" file yet.
		createMissingPackageTranslations( { packagePath } );

		// (3) Find all source messages that are defined in the language context.
		const sourceMessagesForPackage = Object.keys( contextContent )
			.map( messageId => sourceMessages.find( message => message.id === messageId ) )
			.filter( Boolean );

		// (4) Find all translation files ("*.po" files).
		const translationFilePaths = glob.sync( upath.join( packagePath, TRANSLATION_FILES_PATH, '*.po' ) );

		// Then, for each translation file in a package:
		for ( const translationFilePath of translationFilePaths ) {
			const translationFile = fs.readFileSync( translationFilePath, 'utf-8' );
			const translations = PO.parse( translationFile );

			// (4.1) Remove unused translations.
			translations.items = translations.items.filter( item => contextContent[ item.msgid ] );

			// (4.2) Add missing translations.
			translations.items.push(
				...sourceMessagesForPackage
					.filter( message => !translations.items.find( item => item.msgid === message.id ) )
					.map( message => {
						const numberOfPluralForms = PO.parsePluralForms( translations.headers[ 'Plural-Forms' ] ).nplurals;
						const item = new PO.Item( { nplurals: numberOfPluralForms } );

						item.msgctxt = contextContent[ message.id ];
						item.msgid = message.string;
						item.msgstr.push( '' );

						if ( message.plural ) {
							item.msgid_plural = message.plural;
							item.msgstr.push( ...Array( numberOfPluralForms - 1 ).fill( '' ) );
						}

						return item;
					} )
			);

			const translationFileUpdated = cleanPoFileContent( translations.toString() );

			// (4.3) Save translation file only if it has been updated.
			if ( translationFile === translationFileUpdated ) {
				continue;
			}

			fs.writeFileSync( translationFilePath, translationFileUpdated, 'utf-8' );
		}
	}
}
