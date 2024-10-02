/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import path from 'path';
import fs from 'fs-extra';
import { deleteSync } from 'del';
import { logger as utilsLogger } from '@ckeditor/ckeditor5-dev-utils';
import { findMessages } from '@ckeditor/ckeditor5-dev-translations';
import { verifyProperties } from './utils.js';

const corePackageName = 'ckeditor5-core';

/**
 * Collects i18n messages for all packages using source messages from `t()` calls
 * and context files and saves them as POT files in the `build/.transifex` directory.
 *
 * @param {object} options
 * @param {Array.<string>} options.sourceFiles An array of source files that contain messages to translate.
 * @param {Array.<string>} options.packagePaths An array of paths to packages, which will be used to find message contexts.
 * @param {string} options.corePackagePath A relative to `process.cwd()` path to the `@ckeditor/ckeditor5-core` package.
 * @param {string} options.translationsDirectory An absolute path to the directory where the results should be saved.
 * @param {boolean} [options.ignoreUnusedCorePackageContexts=false] Whether to hide unused context errors related to
 * the `@ckeditor/ckeditor5-core` package.
 * @param {boolean} [options.skipLicenseHeader=false] Whether to skip the license header in created `*.pot` files.
 * @param {Logger} [options.logger] A logger.
 */
export default function createPotFiles( options ) {
	const defaultLogger = utilsLogger();
	const langContextSuffix = path.join( 'lang', 'contexts.json' );

	verifyProperties( options, [ 'sourceFiles', 'packagePaths', 'corePackagePath', 'translationsDirectory' ] );

	const {
		sourceFiles,
		packagePaths,
		corePackagePath,
		translationsDirectory,
		ignoreUnusedCorePackageContexts = false,
		skipLicenseHeader = false,
		logger = defaultLogger
	} = options;

	const packageContexts = getPackageContexts( packagePaths, corePackagePath, langContextSuffix );
	const sourceMessages = collectSourceMessages( { sourceFiles, logger } );

	const errors = [].concat(
		assertNoMissingContext( { packageContexts, sourceMessages } ),
		assertAllContextUsed( { packageContexts, sourceMessages, ignoreUnusedCorePackageContexts, corePackagePath, langContextSuffix } ),
		assertNoRepeatedContext( { packageContexts } )
	);

	for ( const error of errors ) {
		logger.error( error );
		process.exitCode = 1;
	}

	removeExistingPotFiles( translationsDirectory );

	for ( const { packageName, content } of packageContexts.values() ) {
		// Skip generating packages for the core package if the core package was not
		// added to the list of packages.
		if ( packageName === corePackageName && !packagePaths.includes( corePackagePath ) ) {
			continue;
		}

		// Create message from source messages and corresponding contexts.
		const messages = Object.keys( content ).map( messageId => {
			return Object.assign(
				{ context: content[ messageId ] },
				sourceMessages.find( message => message.id === messageId )
			);
		} );

		const potFileContent = createPotFileContent( messages );
		const fileContent = skipLicenseHeader ? potFileContent : createPotFileHeader() + potFileContent;

		savePotFile( {
			packageName,
			fileContent,
			logger,
			translationsDirectory
		} );
	}
}

/**
 * Traverses all packages and returns a map of all found language contexts
 * (file content and file name).
 *
 * @param {Array.<string>} packagePaths An array of paths to packages, which will be used to find message contexts.
 * @returns {Map.<string, Context>}
 */
function getPackageContexts( packagePaths, corePackagePath, langContextSuffix ) {
	// Add path to core package if not included in the package paths.
	if ( !packagePaths.includes( corePackagePath ) ) {
		packagePaths = [ ...packagePaths, corePackagePath ];
	}

	const mapEntries = packagePaths
		.filter( packagePath => containsContextFile( packagePath, langContextSuffix ) )
		.map( packagePath => {
			const pathToContext = path.join( packagePath, langContextSuffix );
			const packageName = packagePath.split( /[\\/]/ ).pop();

			return [
				packageName, {
					filePath: pathToContext,
					content: JSON.parse( fs.readFileSync( pathToContext, 'utf-8' ) ),
					packagePath,
					packageName
				}
			];
		} );

	return new Map( mapEntries );
}

/**
 * Returns an array of i18n source messages found in all source files.
 *
 * @returns {Array.<Message>}
 */
function collectSourceMessages( { sourceFiles, logger } ) {
	const messages = [];

	for ( const sourceFile of sourceFiles ) {
		const fileContent = fs.readFileSync( sourceFile, 'utf-8' );

		messages.push(
			...getSourceMessagesFromFile( { filePath: sourceFile, fileContent, logger } )
		);
	}

	return messages;
}

/**
 * @param {object} options
 * @param {Map.<string, Context>} options.packageContexts A map of language contexts.
 * @param {Array.<Message>} options.sourceMessages An array of i18n source messages.
 * @returns {Array.<string>}
 */
function assertNoMissingContext( { packageContexts, sourceMessages } ) {
	const errors = [];
	const contextIdOrigins = new Map();

	for ( const [ packageName, { content } ] of packageContexts ) {
		for ( const messageId in content ) {
			contextIdOrigins.set( messageId, packageName );
		}
	}

	for ( const sourceMessage of sourceMessages ) {
		if ( !contextIdOrigins.has( sourceMessage.id ) ) {
			errors.push( `Context for the message id is missing ('${ sourceMessage.id }' from ${ sourceMessage.filePath }).` );
		}
	}

	return errors;
}

/**
 * @param {object} options
 * @param {Map.<string, Context>} options.packageContexts A map of language contexts.
 * @param {Array.<Message>} options.sourceMessages An array of i18n source messages.
 * @returns {Array.<string>}
 */
function assertAllContextUsed( options ) {
	const { packageContexts, sourceMessages, ignoreUnusedCorePackageContexts, corePackagePath, langContextSuffix } = options;

	const usedContextMap = new Map();
	const errors = [];

	// TODO - Message id might contain the `/` character.

	for ( const [ packageName, context ] of packageContexts ) {
		// Ignore errors from the `@ckeditor/ckeditor5-core` package.
		if ( ignoreUnusedCorePackageContexts && context.packagePath.includes( corePackagePath ) ) {
			continue;
		}

		for ( const id in context.content ) {
			usedContextMap.set( packageName + '/' + id, false );
		}
	}

	for ( const message of sourceMessages ) {
		usedContextMap.set( message.packageName + '/' + message.id, true );
		usedContextMap.set( corePackageName + '/' + message.id, true );
	}

	for ( const [ id, used ] of usedContextMap ) {
		// TODO - splitting by the `/` char is risky.
		const packageNameParts = id.split( '/' );
		const messageId = packageNameParts.pop();

		const contextFilePath = path.join( ...packageNameParts, langContextSuffix );

		if ( !used ) {
			errors.push( `Unused context: '${ messageId }' in ${ contextFilePath }` );
		}
	}

	return errors;
}

/**
 * @param {object} options
 * @param {Map.<string, Context>} options.packageContexts A map of language contexts.
 * @returns {Array.<string>}
 */
function assertNoRepeatedContext( { packageContexts } ) {
	const errors = [];
	const idOrigins = new Map();

	for ( const context of packageContexts.values() ) {
		for ( const id in context.content ) {
			if ( idOrigins.has( id ) ) {
				errors.push( `Context is duplicated for the id: '${ id }' in ${ context.filePath } and ${ idOrigins.get( id ) }.` );
			}

			idOrigins.set( id, context.filePath );
		}
	}

	return errors;
}

function removeExistingPotFiles( translationsDirectory ) {
	deleteSync( translationsDirectory );
}

/**
 * Creates a POT file for the given package and POT file content.
 * The default place is `build/.transifex/[packageName]/en.pot`.
 *
 * @param {object} options
 * @param {Logger} options.logger
 * @param {string} options.packageName
 * @param {string} options.translationsDirectory
 * @param {string} options.fileContent
 */
function savePotFile( { packageName, fileContent, translationsDirectory, logger } ) {
	const outputFilePath = path.join( translationsDirectory, packageName, 'en.pot' );

	fs.outputFileSync( outputFilePath, fileContent );

	logger.info( `Created file: ${ outputFilePath }.` );
}

/**
 * Creates a POT file header.
 *
 * @returns {string}
 */
function createPotFileHeader() {
	const year = new Date().getFullYear();

	return `# Copyright (c) 2003-${ year }, CKSource Holding sp. z o.o. All rights reserved.\n\n`;
}

/**
 * Returns source messages found in the given file with additional data (`filePath` and `packageName`).
 *
 * @param {string} filePath
 * @param {string} fileContent
 * @returns {Array.<Message>}
 */
function getSourceMessagesFromFile( { filePath, fileContent, logger } ) {
	const packageMatch = filePath.match( /([^/\\]+)[/\\]src[/\\]/ );
	const sourceMessages = [];

	const onErrorCallback = err => {
		logger.error( err );
		process.exitCode = 1;
	};

	findMessages( fileContent, filePath, message => {
		sourceMessages.push( Object.assign( {
			filePath,
			packageName: packageMatch[ 1 ]
		}, message ) );
	}, onErrorCallback );

	return sourceMessages;
}

/**
 * Creates a POT file from the given i18n messages.
 *
 * @param {Array.<Message>} messages
 * @returns {string}
 */
function createPotFileContent( messages ) {
	return messages.map( message => {
		const potFileMessageEntry = [];

		// Note the usage of `JSON.stringify()` instead of `"` + `"`.
		// It's because the message can contain an apostrophe.
		// Note also that the order is important.

		if ( message.context ) {
			potFileMessageEntry.push( `msgctxt ${ JSON.stringify( message.context ) }` );
		}

		potFileMessageEntry.push( `msgid ${ JSON.stringify( message.id ) }` );

		if ( message.plural ) {
			potFileMessageEntry.push( `msgid_plural ${ JSON.stringify( message.plural ) }` );
			potFileMessageEntry.push( `msgstr[0] ${ JSON.stringify( message.string ) }` );
			potFileMessageEntry.push( `msgstr[1] ${ JSON.stringify( message.plural ) }` );
		} else {
			potFileMessageEntry.push( `msgstr ${ JSON.stringify( message.string ) }` );
		}

		return potFileMessageEntry
			.map( x => x + '\n' )
			.join( '' );
	} ).join( '\n' );
}

/**
 * @param {string} packageDirectory
 */
function containsContextFile( packageDirectory, langContextSuffix ) {
	return fs.existsSync( path.join( packageDirectory, langContextSuffix ) );
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
 * @property {string} filePath A path to the context file.
 * @property {object} content The context file content - a map of messageId->messageContext records.
 * @property {string} packagePath The owner of the context file.
 * @property {string} packageName The owner package name.
 */
