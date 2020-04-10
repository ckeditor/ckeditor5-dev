/**
 * @license Copyright (c) 2003-2020, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const del = require( 'del' );
const fs = require( 'fs-extra' );
const path = require( 'path' );
const logger = require( '@ckeditor/ckeditor5-dev-utils' ).logger();
const { findMessages } = require( '@ckeditor/ckeditor5-dev-utils' ).translations;

const langContextSuffix = path.join( 'lang', 'contexts.json' );
const corePackageName = 'ckeditor5-core';

const utils = {
	/**
	 * Traverses all packages and returns a map of all found language contexts
	 * (file content and file name).
	 *
	 * TODO: Context should be retrieved from t( {} ) as well.
	 *
	 * @param {String[]} packagePaths An array of paths to packages, which will be used to find message contexts.
	 * @returns {Map.<String, Context>}
	 */
	getContexts( packagePaths, corePackagePath ) {
		// Add path to core package if not included in the package paths.
		if ( !packagePaths.includes( corePackagePath ) ) {
			packagePaths = [ ...packagePaths, corePackagePath ];
		}

		const mapEntries = packagePaths
			.filter( packageName => utils._containsContextFile( packageName ) )
			.map( packageName => {
				const pathToContext = path.join( packageName, langContextSuffix );

				return [ packageName, {
					filePath: pathToContext,
					content: JSON.parse( fs.readFileSync( pathToContext, 'utf-8' ) ),
					packageName
				} ];
			} );

		return new Map( mapEntries );
	},

	/**
	 * Returns an array of i18n source messages found in all source files.
	 *
	 * @returns {Array.<Message>}
	 */
	collectSourceMessages( sourceFiles ) {
		const messages = [];

		for ( const sourceFile of sourceFiles ) {
			const content = fs.readFileSync( sourceFile, 'utf-8' );

			messages.push( ...utils._getSourceMessagesFromFile( sourceFile, content ) );
		}

		return messages;
	},

	/**
	 * @param {Map.<String, Context>} contexts A map of language contexts.
	 * @param {Array.<Message>} sourceMessages An array of i18n source messages.
	 * @returns {Array.<String>}
	 */
	getMissingContextErrorMessages( contexts, sourceMessages ) {
		const errors = [];
		const contextSet = new Set();

		for ( const { content } of contexts.values() ) {
			for ( const messageId in content ) {
				contextSet.add( messageId );
			}
		}

		for ( const sourceMessage of sourceMessages ) {
			if ( sourceMessage.context && contextSet.has( sourceMessage.id ) ) {
				// TODO - a context is overwrite warning.
			}

			if ( sourceMessage.context ) {
				continue;
			}

			if ( !contextSet.has( sourceMessage.id ) ) {
				errors.push(
					`Context for the message id is missing ('${ sourceMessage.id }' from ${ sourceMessage.filePath }).`
				);
			}
		}

		return errors;
	},

	/**
	 * @param {Map.<String, Context>} contexts A map of language contexts.
	 * @param {Array.<Message>} sourceMessages An array of i18n source messages.
	 * @returns {Array.<String>}
	 */
	getUnusedContextErrorMessages( contexts, sourceMessages ) {
		const usedContextMap = new Map();

		for ( const [ packageName, context ] of contexts ) {
			for ( const id in context.content ) {
				usedContextMap.set( packageName + '/' + id, false );
			}
		}

		for ( const message of sourceMessages ) {
			usedContextMap.set( message.packageName + '/' + message.id, true );
			usedContextMap.set( corePackageName + '/' + message.id, true );
		}

		return [ ...usedContextMap ]
			.filter( ( [ , usage ] ) => !usage )
			.map( ( [ id ] ) => `Unused context: ${ id }.` );
	},

	/**
	 * @param {Map.<String, Context>} contexts A map of language contexts.
	 * @returns {Array.<String>}
	 */
	getRepeatedContextErrorMessages( contexts ) {
		const errors = [];
		const idOrigins = new Map();

		for ( const context of contexts.values() ) {
			for ( const id in context.content ) {
				if ( idOrigins.has( id ) ) {
					errors.push( `Context is duplicated for the id: '${ id }' in ${ context.filePath } and ${ idOrigins.get( id ) }.` );
				}

				idOrigins.set( id, context.filePath );
			}
		}

		return errors;
	},

	removeExistingPotFiles() {
		const pathToTransifexDirectory = path.join( process.cwd(), 'build', '.transifex' );
		del.sync( pathToTransifexDirectory );
	},

	/**
	 * Creates a POT file for the given package.
	 *
	 * It merges source messages for the given package with corresponding contexts.
	 *
	 * @param {String} packageName A package name.
	 * @param {Message[]} sourceMessages A package name.
	 * @param {Context} [context] A context file for the given package.
	 * @returns {String}
	 */
	createPotFileContent( packageName, sourceMessages, context ) {
		const packageSourceMessages = sourceMessages
			.filter( sourceMessage => sourceMessage.packageName === packageName );

		const messages = packageSourceMessages.map( sourceMessage => {
			const message = { ...sourceMessage };

			if ( context && !message.context ) {
				message.context = context.content[ message.id ];
			}

			return message;
		} );

		return utils._createPotFile( messages );
	},

	/**
	 * Creates a POT file for the given package and POT file content.
	 * The default place is `build/.transifex/[packageName]/en.pot`.
	 *
	 * @param {String} packageName
	 * @param {String} fileContent
	 */
	savePotFile( packageName, fileContent ) {
		const outputFilePath = path.join( process.cwd(), 'build', '.transifex', packageName, 'en.pot' );

		fs.outputFileSync( outputFilePath, fileContent );

		logger.info( `Created file: ${ outputFilePath }.` );
	},

	/**
	 * Creates a POT file header.
	 *
	 * @returns {String}
	 */
	createPotFileHeader() {
		const year = new Date().getFullYear();

		return `# Copyright (c) 2003-${ year }, CKSource - Frederico Knabben. All rights reserved.\n\n`;
	},

	/**
	 * Returns source messages found in the given file with additional data (`filePath` and `packageName`).
	 *
	 * @param {String} filePath
	 * @param {String} fileContent
	 * @returns {Message[]}
	 */
	_getSourceMessagesFromFile( filePath, fileContent ) {
		const packageMatch = filePath.match( /[/\\]([^/\\]+)[/\\]src[/\\]/ );
		const sourceMessages = [];

		findMessages( fileContent, filePath, message => {
			sourceMessages.push( {
				filePath,
				packageName: packageMatch[ 1 ],
				...message
			} );
		}, err => console.error( err ) );

		return sourceMessages;
	},

	/**
	 * Creates a POT file from the given i18n messages.
	 *
	 * @param {Message[]} messages
	 * @returns {String}
	 */
	_createPotFile( messages ) {
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
	},

	/**
	 * @param {String} packageDirectory
	 */
	_containsContextFile( packageDirectory ) {
		return fs.existsSync( path.join( packageDirectory, langContextSuffix ) );
	}
};

module.exports = utils;

/**
 * @typedef {Object} Message
 *
 * @property {String} id
 * @property {String} string
 * @property {String} filePath
 * @property {String} packageName
 * @property {String} [context]
 * @property {String} [plural]
*/

/**
 * @typedef {Object} Context
 *
 * @property {String} filePath A path to the context file.
 * @property {Object} content The context file content - a map of messageId->messageContext records.
 * @property {String} packageName An owner of the context file.
 */
