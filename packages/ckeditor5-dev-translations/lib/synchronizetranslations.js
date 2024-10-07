/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import upath from 'upath';
import fs from 'fs-extra';
import PO from 'pofile';
import { glob } from 'glob';
import { logger } from '@ckeditor/ckeditor5-dev-utils';
import cleanPoFileContent from './cleanpofilecontent.js';
import findMessages from './findmessages.js';

const CONTEXT_FILE_PATH = upath.join( 'lang', 'contexts.json' );
const TRANSLATIONS_FILES_PATTERN = upath.join( 'lang', 'translations', '*.po' );

/**
 * Synchronizes translations in provided packages by performing the following steps:
 * * Collect all i18n messages from all provided packages by finding `t()` calls.
 * * Detect if translation context is valid, i.e. whether there is no missing, unused or duplicated context.
 * * If there are no validation errors, update all translation files (*.po files) to be in sync with the context file.
 *
 * @param {object} options
 * @param {Array.<string>} options.sourceFiles An array of source files that contain messages to translate.
 * @param {Array.<string>} options.packagePaths An array of paths to packages, which will be used to find message contexts.
 * @param {string} options.corePackagePath A relative to `process.cwd()` path to the `@ckeditor/ckeditor5-core` package.
 * @param {boolean} [options.ignoreUnusedCorePackageContexts=false] Whether to skip unused context errors related to
 * the `@ckeditor/ckeditor5-core` package.
 */
export default function synchronizeTranslations( options ) {
	const {
		sourceFiles,
		packagePaths,
		corePackagePath,
		ignoreUnusedCorePackageContexts = false
	} = options;

	const errors = [];
	const log = logger();

	log.info( '📍 Loading translations contexts...' );
	const packageContexts = getPackageContexts( { packagePaths, corePackagePath } );

	log.info( '📍 Loading messages from source files...' );
	const sourceMessages = getSourceMessages( { packagePaths, sourceFiles, onErrorCallback: error => errors.push( error ) } );

	log.info( '📍 Validating translations contexts against the source messages...' );
	errors.push(
		...assertNoMissingContext( { packageContexts, sourceMessages, corePackagePath } ),
		...assertAllContextUsed( { packageContexts, sourceMessages, corePackagePath, ignoreUnusedCorePackageContexts } ),
		...assertNoRepeatedContext( { packageContexts } )
	);

	if ( errors.length ) {
		log.error( '🔥 The following errors have been found:' );

		for ( const error of errors ) {
			log.error( `   - ${ error }` );
		}

		process.exit( 1 );
	}

	log.info( '📍 Synchronizing translations files...' );
	updatePackageTranslations( { packageContexts, sourceMessages } );

	log.info( '✨ Done.' );
}

/**
 * @param {object} options
 * @param {Array.<string>} options.packagePaths An array of paths to packages, which will be used to find message contexts.
 * @param {string} options.corePackagePath A relative to `process.cwd()` path to the `@ckeditor/ckeditor5-core` package.
 * @returns {Array.<Context>}
 */
function getPackageContexts( { packagePaths, corePackagePath } ) {
	// Add path to the core package if not included in the package paths.
	// The core package contains common contexts shared between other packages.
	if ( !packagePaths.includes( corePackagePath ) ) {
		packagePaths.push( corePackagePath );
	}

	return packagePaths.map( packagePath => {
		const contextFilePath = upath.join( packagePath, CONTEXT_FILE_PATH );
		const contextContent = fs.existsSync( contextFilePath ) ? fs.readJsonSync( contextFilePath ) : [];

		return {
			contextContent,
			contextFilePath,
			packagePath
		};
	} );
}

/**
 * @param {object} options
 * @param {Array.<string>} options.packagePaths An array of paths to packages, which will be used to find message contexts.
 * @param {Array.<string>} options.sourceFiles An array of source files that contain messages to translate.
 * @param {Function} options.onErrorCallback Called when there is an error with parsing the source files.
 * @returns {Array.<Message>}
 */
function getSourceMessages( { packagePaths, sourceFiles, onErrorCallback } ) {
	return sourceFiles.flatMap( filePath => {
		const fileContent = fs.readFileSync( filePath, 'utf-8' );
		const packagePath = packagePaths.find( packagePath => filePath.includes( packagePath ) );
		const sourceMessages = [];

		const onMessageCallback = message => {
			sourceMessages.push( { filePath, packagePath, ...message } );
		};

		findMessages( fileContent, filePath, onMessageCallback, onErrorCallback );

		return sourceMessages;
	} );
}

/**
 * @param {object} options
 * @param {Array.<Context>} options.packageContexts An array of language contexts.
 * @param {Array.<Message>} options.sourceMessages An array of i18n source messages.
 */
function updatePackageTranslations( { packageContexts, sourceMessages } ) {
	// For each package:
	for ( const { packagePath, contextContent } of packageContexts ) {
		// (1) Find all source messages that are defined in the language context.
		const sourceMessagesForPackage = Object.keys( contextContent )
			.map( messageId => sourceMessages.find( message => message.id === messageId ) )
			.filter( Boolean );

		// (2) Find all translation files (*.po files).
		const translationsFiles = glob.sync( upath.join( packagePath, TRANSLATIONS_FILES_PATTERN ) );

		// Then, for each translation file in a package:
		for ( const translationsFile of translationsFiles ) {
			const translations = PO.parse( fs.readFileSync( translationsFile, 'utf-8' ) );

			// (2.1) Remove unused translations.
			translations.items = translations.items.filter( item => contextContent[ item.msgid ] );

			// (2.2) Add missing translations.
			translations.items.push(
				...sourceMessagesForPackage
					.filter( message => !translations.items.find( item => item.msgid === message.id ) )
					.map( message => {
						const numberOfPluralForms = PO.parsePluralForms( translations.headers[ 'Plural-Forms' ] ).nplurals;
						const item = new PO.Item( { nplurals: numberOfPluralForms } );

						item.msgctxt = contextContent[ message.id ];
						item.msgid = message.string;
						item.msgstr.push( message.string );

						if ( message.plural ) {
							item.msgid_plural = message.plural;
							item.msgstr.push( ...Array( numberOfPluralForms - 1 ).fill( message.plural ) );
						}

						return item;
					} )
			);

			fs.writeFileSync( translationsFile, cleanPoFileContent( translations.toString() ), 'utf-8' );
		}
	}
}

/**
 * @param {object} options
 * @param {Array.<Context>} options.packageContexts An array of language contexts.
 * @param {Array.<Message>} options.sourceMessages An array of i18n source messages.
 * @param {string} options.corePackagePath A relative to `process.cwd()` path to the `@ckeditor/ckeditor5-core` package.
 * @returns {Array.<string>}
 */
function assertNoMissingContext( { packageContexts, sourceMessages, corePackagePath } ) {
	const contextMessageIdsGroupedByPackage = packageContexts.reduce( ( result, context ) => {
		result[ context.packagePath ] = Object.keys( context.contextContent );

		return result;
	}, {} );

	return sourceMessages
		.filter( message => {
			const contextMessageIds = [
				...contextMessageIdsGroupedByPackage[ message.packagePath ],
				...contextMessageIdsGroupedByPackage[ corePackagePath ]
			];

			return !contextMessageIds.includes( message.id );
		} )
		.map( message => `Missing context "${ message.id }" in "${ message.filePath }".` );
}

/**
 * @param {object} options
 * @param {Array.<Context>} options.packageContexts An array of language contexts.
 * @param {Array.<Message>} options.sourceMessages An array of i18n source messages.
 * @param {string} options.corePackagePath A relative to `process.cwd()` path to the `@ckeditor/ckeditor5-core` package.
 * @param {boolean} options.ignoreUnusedCorePackageContexts Whether to skip unused context errors related to the `@ckeditor/ckeditor5-core`
 * package.
 * @returns {Array.<string>}
 */
function assertAllContextUsed( { packageContexts, sourceMessages, corePackagePath, ignoreUnusedCorePackageContexts } ) {
	const sourceMessageIds = sourceMessages.map( message => message.id );

	const sourceMessageIdsGroupedByPackage = sourceMessages.reduce( ( result, message ) => {
		result[ message.packagePath ] = result[ message.packagePath ] || [];
		result[ message.packagePath ].push( message.id );

		return result;
	}, {} );

	return packageContexts
		.flatMap( context => {
			const { packagePath, contextContent } = context;
			const messageIds = Object.keys( contextContent );

			return messageIds.map( messageId => ( { messageId, packagePath } ) );
		} )
		.filter( ( { messageId, packagePath } ) => {
			if ( packagePath === corePackagePath ) {
				return !sourceMessageIds.includes( messageId );
			}

			return !sourceMessageIdsGroupedByPackage[ packagePath ].includes( messageId );
		} )
		.filter( ( { packagePath } ) => {
			if ( ignoreUnusedCorePackageContexts && packagePath === corePackagePath ) {
				return false;
			}

			return true;
		} )
		.map( ( { messageId, packagePath } ) => `Unused context "${ messageId }" in "${ upath.join( packagePath, CONTEXT_FILE_PATH ) }".` );
}

/**
 * @param {object} options
 * @param {Array.<Context>} options.packageContexts An array of language contexts.
 * @returns {Array.<string>}
 */
function assertNoRepeatedContext( { packageContexts } ) {
	const contextMessageIds = packageContexts
		.flatMap( context => {
			const { contextFilePath, contextContent } = context;
			const messageIds = Object.keys( contextContent );

			return messageIds.map( messageId => ( { messageId, contextFilePath } ) );
		} )
		.reduce( ( result, { messageId, contextFilePath } ) => {
			result[ messageId ] = result[ messageId ] || [];
			result[ messageId ].push( contextFilePath );

			return result;
		}, {} );

	return Object.entries( contextMessageIds )
		.filter( ( [ , contextFilePaths ] ) => contextFilePaths.length > 1 )
		.map( ( [ messageId, contextFilePaths ] ) => {
			return `Duplicated context "${ messageId }" in "${ contextFilePaths.join( '", "' ) }".`;
		} );
}

/**
 * @typedef {object} Message
 *
 * @property {string} id
 * @property {string} string
 * @property {string} filePath
 * @property {string} packagePath
 * @property {string} context
 * @property {string} [plural]
 */

/**
 * @typedef {object} Context
 *
 * @property {string} contextFilePath
 * @property {object} contextContent
 * @property {string} packagePath
 */
