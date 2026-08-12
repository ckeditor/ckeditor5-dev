/**
 * @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import fs from 'node:fs';
import upath from 'upath';
import { glob } from 'glob';
import { getFormula } from 'plural-forms';
import { TRANSLATION_FILES_PATH } from './constants.js';
import getLanguages from './getlanguages.js';
import { readTranslationFile, serializeTranslationFile } from './translationfile.js';

/**
 * @param {object} options
 * @param {Array.<TranslationsContext>} options.packageContexts An array of language contexts.
 * @param {Array.<TranslationMoveEntry>} options.config Configuration that defines the messages to move.
 */
export default async function moveTranslationsBetweenPackages( { packageContexts, config } ) {
	for ( const { source, destination, messageId } of config ) {
		if ( source === destination ) {
			continue;
		}

		const sourcePackageContext = packageContexts.find( context => context.packagePath === source );
		const destinationPackageContext = packageContexts.find( context => context.packagePath === destination );
		const messageContext = sourcePackageContext.contextContent[ messageId ];

		destinationPackageContext.contextContent[ messageId ] = messageContext;
		delete sourcePackageContext.contextContent[ messageId ];

		const translationFilesPattern = upath.join( source, TRANSLATION_FILES_PATH, '*.ts' );
		const translationFilePaths = glob.sync( translationFilesPattern )
			.map( filePath => upath.basename( filePath ) )
			.map( fileName => ( {
				sourceTranslationFilePath: upath.join( source, TRANSLATION_FILES_PATH, fileName ),
				destinationTranslationFilePath: upath.join( destination, TRANSLATION_FILES_PATH, fileName )
			} ) );

		for ( const { sourceTranslationFilePath, destinationTranslationFilePath } of translationFilePaths ) {
			const destinationTranslationFileExists = fs.existsSync( destinationTranslationFilePath );
			const sourceTranslations = await readTranslationFile( sourceTranslationFilePath );
			const destinationTranslations = destinationTranslationFileExists ?
				await readTranslationFile( destinationTranslationFilePath ) :
				{
					language: sourceTranslations.language,
					dictionary: {},
					translationsTypeImportSource: sourceTranslations.translationsTypeImportSource
				};
			const value = sourceTranslations.dictionary[ messageId ];

			delete sourceTranslations.dictionary[ messageId ];
			destinationTranslations.dictionary[ messageId ] = value;

			writePackageTranslation(
				source,
				sourceTranslationFilePath,
				sourceTranslations,
				sourcePackageContext.contextContent
			);
			writePackageTranslation(
				destination,
				destinationTranslationFilePath,
				destinationTranslations,
				destinationPackageContext.contextContent
			);
		}

		fs.mkdirSync( upath.dirname( sourcePackageContext.contextFilePath ), { recursive: true } );
		fs.mkdirSync( upath.dirname( destinationPackageContext.contextFilePath ), { recursive: true } );
		fs.writeFileSync(
			sourcePackageContext.contextFilePath,
			JSON.stringify( sourcePackageContext.contextContent, null, '\t' ),
			'utf-8'
		);
		fs.writeFileSync( destinationPackageContext.contextFilePath,
			JSON.stringify( destinationPackageContext.contextContent, null, '\t' ), 'utf-8' );
	}
}

function writePackageTranslation( packagePath, filePath, translations, contexts ) {
	const language = getLanguages().find( item => item.languageFileName === translations.language );
	const pluralFunction = upath.basename( packagePath ) === 'ckeditor5-core' ? getFormula( language.languageCode ) : null;
	const content = serializeTranslationFile( {
		language: translations.language,
		dictionary: translations.dictionary,
		contexts,
		pluralFunction,
		preamble: translations.preamble,
		translationsTypeImportSource: translations.translationsTypeImportSource
	} );

	fs.mkdirSync( upath.dirname( filePath ), { recursive: true } );
	fs.writeFileSync( filePath, content, 'utf-8' );
}
