/**
 * @license Copyright (c) 2003-2023, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const path = require( 'path' );
const fs = require( 'fs-extra' );
const del = require( 'del' );
const defaultLogger = require( '@ckeditor/ckeditor5-dev-utils' ).logger();
const { findMessages } = require( '@ckeditor/ckeditor5-dev-translations' );
const { verifyProperties } = require( './utils' );

const langContextSuffix = path.join( 'lang', 'contexts.json' );
const corePackageName = 'ckeditor5-core';

/**
 * Collects i18n messages for all packages using source messages from `t()` calls
 * and context files and saves them as POT files in the `build/.transifex` directory.
 *
 * @param {Object} options
 * @param {Array.<String>} options.sourceFiles An array of source files that contain messages to translate.
 * @param {Array.<String>} options.packagePaths An array of paths to packages, which will be used to find message contexts.
 * @param {String} options.corePackagePath A relative to `process.cwd()` path to the `@ckeditor/ckeditor5-core` package.
 * @param {String} options.translationsDirectory An absolute path to the directory where the results should be saved.
 * @param {Boolean} [options.ignoreUnusedCorePackageContexts=false] Whether to hide unused context errors related to
 * the `@ckeditor/ckeditor5-core` package.
 * @param {Boolean} [options.skipLicenseHeader=false] Whether to skip the license header in created `*.pot` files.
 * @param {Logger} [options.logger] A logger.
 */
module.exports = function createPotFiles( options ) {
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

	const packageContexts = getPackageContexts( packagePaths, corePackagePath );
	const sourceMessages = collectSourceMessages( { sourceFiles, logger } );

	const errors = [].concat(
		assertNoMissingContext( { packageContexts, sourceMessages } ),
		assertAllContextUsed( { packageContexts, sourceMessages, ignoreUnusedCorePackageContexts, corePackagePath } ),
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
};

/**
 * Traverses all packages and returns a map of all found language contexts
 * (file content and file name).
 *
 * @param {Array.<String>} packagePaths An array of paths to packages, which will be used to find message contexts.
 * @returns {Map.<String, Context>}
 */
function getPackageContexts( packagePaths, corePackagePath ) {
	// Add path to core package if not included in the package paths.
	if ( !packagePaths.includes( corePackagePath ) ) {
		packagePaths = [ ...packagePaths, corePackagePath ];
	}

	const mapEntries = packagePaths
		.filter( packagePath => containsContextFile( packagePath ) )
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
 * @param {Object} options
 * @param {Map.<String, Context>} options.packageContexts A map of language contexts.
 * @param {Array.<Message>} options.sourceMessages An array of i18n source messages.
 * @returns {Array.<String>}
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
 * @param {Object} options
 * @param {Map.<String, Context>} options.packageContexts A map of language contexts.
 * @param {Array.<Message>} options.sourceMessages An array of i18n source messages.
 * @returns {Array.<String>}
 */
function assertAllContextUsed( options ) {
	const { packageContexts, sourceMessages, ignoreUnusedCorePackageContexts, corePackagePath } = options;

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
 * @param {Object} options
 * @param {Map.<String, Context>} options.packageContexts A map of language contexts.
 * @returns {Array.<String>}
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
	del.sync( translationsDirectory );
}

/**
 * Creates a POT file for the given package and POT file content.
 * The default place is `build/.transifex/[packageName]/en.pot`.
 *
 * @param {Object} options
 * @param {Logger} options.logger
 * @param {String} options.packageName
 * @param {String} options.translationsDirectory
 * @param {String} options.fileContent
 */
function savePotFile( { packageName, fileContent, translationsDirectory, logger } ) {
	const outputFilePath = path.join( translationsDirectory, packageName, 'en.pot' );

	fs.outputFileSync( outputFilePath, fileContent );

	logger.info( `Created file: ${ outputFilePath }.` );
}

/**
 * Creates a POT file header.
 *
 * @returns {String}
 */
function createPotFileHeader() {
	const year = new Date().getFullYear();

	return `# Copyright (c) 2003-${ year }, CKSource Holding sp. z o.o. All rights reserved.\n\n`;
}

/**
 * Returns source messages found in the given file with additional data (`filePath` and `packageName`).
 *
 * @param {String} filePath
 * @param {String} fileContent
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
 * @returns {String}
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
 * @param {String} packageDirectory
 */
function containsContextFile( packageDirectory ) {
	return fs.existsSync( path.join( packageDirectory, langContextSuffix ) );
}

/**
 * @typedef {Object} Message
 *
 * @property {String} id
 * @property {String} string
 * @property {String} filePath
 * @property {String} packagePath
 * @property {String} context
 * @property {String} [plural]
 */

/**
 * @typedef {Object} Context
 *
 * @property {String} filePath A path to the context file.
 * @property {Object} content The context file content - a map of messageId->messageContext records.
 * @property {String} packagePath The owner of the context file.
 * @property {String} packageName The owner package name.
 */
