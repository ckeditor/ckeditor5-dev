/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import upath from 'upath';
import fs from 'fs-extra';
import PO from 'pofile';
import { glob } from 'glob';
import { TRANSLATION_FILES_PATH } from './constants.js';
import cleanTranslationFileContent from './cleantranslationfilecontent.js';

/**
 * @param {object} options
 * @param {Array.<Context>} options.packageContexts An array of language contexts.
 * @param {Array.<TranslationMoveEntry>} options.config Configuration that defines the messages to move.
 */
export default function moveTranslationsBetweenPackages( { packageContexts, config } ) {
	// For each message to move:
	for ( const { source, destination, messageId } of config ) {
		// (1) Skip the message if its source and destination package is the same.
		if ( source === destination ) {
			continue;
		}

		// (2) Move translation context from source package to destination package.
		const sourcePackageContext = packageContexts.find( context => context.packagePath === source );
		const destinationPackageContext = packageContexts.find( context => context.packagePath === destination );

		destinationPackageContext.contextContent[ messageId ] = sourcePackageContext.contextContent[ messageId ];
		delete sourcePackageContext.contextContent[ messageId ];

		// (3) Prepare the list of paths to translation files ("*.po" files) in source and destination packages.
		// The source package defines the list of files for both packages.
		const translationFilesPattern = upath.join( source, TRANSLATION_FILES_PATH, '*.po' );
		const translationFilePaths = glob.sync( translationFilesPattern )
			.map( filePath => upath.basename( filePath ) )
			.map( fileName => ( {
				sourceTranslationFilePath: upath.join( source, TRANSLATION_FILES_PATH, fileName ),
				destinationTranslationFilePath: upath.join( destination, TRANSLATION_FILES_PATH, fileName )
			} ) );

		// Then, for each translation file:
		for ( const { sourceTranslationFilePath, destinationTranslationFilePath } of translationFilePaths ) {
			// (3.1) Read the source translation file.
			const sourceTranslationFile = fs.readFileSync( sourceTranslationFilePath, 'utf-8' );
			const sourceTranslations = PO.parse( sourceTranslationFile );

			// (3.2) Read the destination translation file.
			// If the destination file does not exist, use the source file as a base and remove all translations.
			const destinationTranslationFile = fs.existsSync( destinationTranslationFilePath ) ?
				fs.readFileSync( destinationTranslationFilePath, 'utf-8' ) :
				null;
			const destinationTranslations = PO.parse( destinationTranslationFile || sourceTranslationFile );

			if ( !destinationTranslationFile ) {
				destinationTranslations.items = [];
			}

			// (3.3) Move the translation from source file to destination file.
			const sourceMessage = sourceTranslations.items.find( item => item.msgid === messageId );
			sourceTranslations.items = sourceTranslations.items.filter( item => item.msgid !== messageId );

			destinationTranslations.items = destinationTranslations.items.filter( item => item.msgid !== messageId );
			destinationTranslations.items.push( sourceMessage );

			fs.outputFileSync( sourceTranslationFilePath, cleanTranslationFileContent( sourceTranslations ).toString(), 'utf-8' );
			fs.outputFileSync( destinationTranslationFilePath, cleanTranslationFileContent( destinationTranslations ).toString(), 'utf-8' );
		}

		fs.outputJsonSync( sourcePackageContext.contextFilePath, sourcePackageContext.contextContent, { spaces: '\t' } );
		fs.outputJsonSync( destinationPackageContext.contextFilePath, destinationPackageContext.contextContent, { spaces: '\t' } );
	}
}
