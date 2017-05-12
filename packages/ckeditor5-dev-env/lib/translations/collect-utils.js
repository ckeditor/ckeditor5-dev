/**
 * @license Copyright (c) 2003-2017, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const del = require( 'del' );
const glob = require( 'glob' );
const fs = require( 'fs-extra' );
const path = require( 'path' );
const logger = require( '@ckeditor/ckeditor5-dev-utils' ).logger();
const { findOriginalStrings } = require( '@ckeditor/ckeditor5-dev-utils' ).translations;

const langContextSuffix = path.join( 'lang', 'contexts.json' );
const corePackageName = 'ckeditor5-core';

const utils = {
	/**
	 * Collect translations and returns array of translations.
	 *
	 * @returns {Array.<Object>}
	 */
	collectTranslations() {
		const srcPaths = [ process.cwd(), 'packages', '*', 'src', '**', '*.js' ].join( '/' );

		const files = glob.sync( srcPaths )
			.filter( srcPath => !srcPath.match( /packages\/[^/]+\/src\/lib\// ) );

		const translations = [];

		for ( const filePath of files ) {
			const content = fs.readFileSync( filePath, 'utf-8' );

			translations.push( ...utils._getTranslationCallsFromFile( filePath, content ) );
		}

		return translations;
	},

	/**
	 * Traverse all packages and returns Map of the all founded language contexts informations
	 * (file content and file name).
	 *
	 * @returns {Map.<String, Object>}
	 */
	getContexts() {
		const ckeditor5PackagesDir = path.join( process.cwd(), 'packages' );
		const mapEntries = utils._getPackagesContainingContexts( ckeditor5PackagesDir ).map( packageName => {
			const pathToContext = path.join( ckeditor5PackagesDir, packageName, langContextSuffix );

			return [ packageName, {
				filePath: pathToContext,
				content: JSON.parse( fs.readFileSync( pathToContext, 'utf-8' ) )
			} ];
		} );

		return new Map( mapEntries );
	},

	/**
	 * @param {Map.<String, Object>} contexts Map of the language contexts.
	 * @param {Array.<Object>} translations Array of the translations.
	 * @returns {Array.<String>}
	 */
	getMissingContextErrorMessages( contexts, translations ) {
		const errors = [];

		for ( const translation of translations ) {
			const errorMessage = utils._validateContexts( contexts, translation );

			if ( errorMessage ) {
				errors.push( errorMessage );
			}
		}

		return errors;
	},

	/**
	 * @param {Map.<String, Object>} contexts Map of the language contexts.
	 * @param {Array.<Object>} translations Array of the translations.
	 * @returns {Array.<String>}
	 */
	getUnusedContextErrorMessages( contexts, translations ) {
		const usedContextMap = new Map();

		for ( const [ packageName, context ] of contexts ) {
			for ( const key in context.content ) {
				usedContextMap.set( packageName + '/' + key, false );
			}
		}

		for ( const translation of translations ) {
			usedContextMap.set( translation.package + '/' + translation.key, true );
			usedContextMap.set( corePackageName + '/' + translation.key, true );
		}

		return [ ...usedContextMap ]
			.filter( ( [ key, usage ] ) => !usage ) // eslint-disable-line no-unused-vars
			.map( ( [ key ] ) => `Unused context: ${ key }.` );
	},

	/**
	 * @param {Map.<String, Object>} contexts Map of the language contexts.
	 * @returns {Array.<String>}
	 */
	getRepeatedContextErrorMessages( contexts ) {
		const errors = [];
		const keys = new Set();

		for ( const context of contexts.values() ) {
			for ( const key in context.content ) {
				if ( keys.has( key ) ) {
					errors.push( `Context is duplicated for the key: ${ key }.` );
				}

				keys.add( key );
			}
		}

		return errors;
	},

	removeExistingPotFiles() {
		const pathToTransifexDirectory = path.join( process.cwd(), 'build', '.transifex' );
		del.sync( pathToTransifexDirectory );
	},

	/**
	 * @param {Object} context Language contexts for a package.
	 * @returns {String}
	 */
	createPotFileContent( context ) {
		const translationObjects = Object.keys( context.content ).map( str => ( {
			id: str,
			str,
			ctxt: context.content[ str ]
		} ) );

		return utils._stringifyTranslationObjects( translationObjects );
	},

	/**
	 * @param {String} packageName
	 * @param {String} fileContent
	 */
	savePotFile( packageName, fileContent ) {
		const outputFilePath = path.join( process.cwd(), 'build', '.transifex', packageName, 'en.pot' );

		fs.outputFileSync( outputFilePath, fileContent );

		logger.info( `Created file: ${ outputFilePath }.` );
	},

	/**
	 * @returns {String}
	 */
	createPotFileHeader() {
		const year = new Date().getFullYear();

		return `# Copyright (c) Copyright (c) 2003-${ year }, CKSource - Frederico Knabben. All rights reserved.\n\n`;
	},

	_getTranslationCallsFromFile( filePath, fileContent ) {
		const originalStrings = findOriginalStrings( fileContent );

		return originalStrings.map( originalString => {
			const contextMatch = originalString.match( /\[context: ([^\]]+)\]/ );
			const sentenceMatch = originalString.match( /^[^[]+/ );
			const packageMatch = filePath.match( /\/(ckeditor5-[^/]+)\// );

			return {
				filePath,
				key: originalString,
				package: packageMatch[ 1 ],
				context: contextMatch ? contextMatch[ 1 ] : null,
				sentence: sentenceMatch[ 0 ].trim(),
			};
		} )
		.filter( translationCall => !!translationCall );
	},

	_stringifyTranslationObjects( translationObjects ) {
		return translationObjects.map( translationObject => {
			// Note that order is important.
			return [
				`msgctxt "${ translationObject.ctxt }"`,
				`msgid "${ translationObject.id }"`,
				`msgstr "${ translationObject.str }"`
			].map( x => x + '\n' ).join( '' );
		} ).join( '\n' );
	},

	_getPackagesContainingContexts( ckeditor5PackagesDir ) {
		return fs.readdirSync( ckeditor5PackagesDir )
			.filter( packageName => fs.existsSync(
				path.join( ckeditor5PackagesDir, packageName, langContextSuffix )
			) );
	},

	_validateContexts( contexts, translation ) {
		const packageContext = contexts.get( translation.package );
		const corePackageContext = contexts.get( corePackageName );
		let error;

		if ( !corePackageContext ) {
			error = `${ corePackageName }/lang/contexts.json file is missing.`;
		} else if ( !corePackageContext.content[ translation.key ] && !packageContext ) {
			error = 'contexts.json file or context for the translation key is missing ' +
				`(${ translation.package }, ${ translation.key }).`;
		}
		// xxx
		else if ( !corePackageContext.content[ translation.key ] && !packageContext.content[ translation.key ] ) {
			error = `Context for the translation key is missing (${ translation.package }, ${ translation.key }).`;
		}

		return error;
	}
};

module.exports = utils;
