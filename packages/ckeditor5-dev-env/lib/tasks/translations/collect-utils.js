/**
 * @license Copyright (c) 2003-2017, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const glob = require( 'glob' );
const fs = require( 'fs-extra' );
const path = require( 'path' );
const logger = require( '@ckeditor/ckeditor5-dev-utils' ).logger();

const nodeModulesDir = path.join( process.cwd(), 'node_modules' );
const langContextSuffix = path.join( 'lang', 'contexts.json' );
const corePackageName = 'ckeditor5-core';

const utils = {
	collectTranslations() {
		const srcPaths = [ process.cwd(), 'node_modules', 'ckeditor5-!(dev)*', 'src', '**', '*.js' ].join( '/' );
		const files = glob.sync( srcPaths  );
		const translations = [];

		for ( const filePath of files ) {
			const content =  fs.readFileSync( filePath, 'utf-8' );

			translations.push( ...utils._getTranslationCallsFromFile( filePath, content ) );
		}

		return translations;
	},

	_getTranslationCallsFromFile( filePath, fileContent ) {
		const fullMatches = fileContent.match( / t\([^)]+?\)/gm ) || [];

		return fullMatches.map( ( fullMatch ) => {
			const stringMatch = fullMatch.match( /'([^']+?)'/ );

			if ( !stringMatch ) {
				logger.error( `Invalid translation call: ${ fullMatch } in ${ filePath }` );

				return;
			}

			const key = stringMatch[1];

			const contextMatch = key.match( /\[context: ([^\]]+)\]/ );
			const sentenceMatch = key.match( /^[^\[]+/ );
			const packageMatch = filePath.match( /\/(ckeditor5-[^\/]+)\// );

			return {
				filePath,
				key,
				package: packageMatch[1],
				context: contextMatch ? contextMatch[1] : null,
				sentence: sentenceMatch[0].trim(),
			};
		} )
		.filter( translationCall => !!translationCall );
	},

	getContexts() {
		return fs.readdirSync( nodeModulesDir )
			.filter( fileOrDirectory => /ckeditor5-[^/\//]+$/.test( fileOrDirectory ) )
			.reduce( ( map, packageName ) => {
				const pathToContext = path.join( nodeModulesDir, packageName, langContextSuffix );

				if ( fs.existsSync( pathToContext ) ) {
					map.set( packageName, {
						filePath: pathToContext,
						content: JSON.parse( fs.readFileSync( pathToContext, 'utf-8' ) )
					} );
				}

				return map;
			}, new Map() );
	},

	// @param {Map.<Object>} contexts
	// @param {Array.<Object>} translations
	getMissingContextErrorMessages: function getMissingContextErrorMessages( contexts, translations ) {
		const errors = [];

		for ( const translation of translations ) {
			const errorMessage = utils.maybeGetContextErrorMessage( contexts, translation );

			if ( errorMessage ) {
				errors.push( errorMessage );
			}
		}

		return errors;
	},

	maybeGetContextErrorMessage( contexts, translation ) {
		const packageContext = contexts.get( translation.package );
		const corePackageContext = contexts.get( corePackageName );
		let error;

		if ( !corePackageContext ) {
			error = `${corePackageName}/lang/contexts.json file is missing.`;
		}

		else if ( !corePackageContext.content[ translation.key ] && !packageContext ) {
			error = `contexts.json file or context for the translation key is missing (${ translation.package }, ${ translation.key }).`;
		}

		else if ( !corePackageContext.content[ translation.key ] && !packageContext.content[ translation.key ] ) {
			error = `Context for the translation key is missing (${ translation.package }, ${ translation.key }).`;
		}

		return error;
	},

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
			.filter( ( [ key, usage ] ) => !usage )
			.map( ( [ key ] ) => `Unused context: ${ key }` );
	},

	getRepeatedContextErrorMessages( contexts ) {
		const errors = [];
		const keys = new Set();

		for ( const context of contexts.values() ) {
			for ( const key in context.content ) {
				if ( keys.has( key ) ) {
					errors.push( `Context is duplicated for the key: ${ key }` );
				}
				keys.add( key );
			}
		}

		return errors;
	},

	createPoFileContent( contexts, translations ) {
		const messages = translations.map( ( translation ) => {
			const ctxtMessage = utils.getContextMessage( contexts, translation );

			return {
				id: translation.sentence,
				str: translation.sentence,
				ctxt: ctxtMessage
			};
		} );

		return utils.jsonToPoFile( messages );
	},

	getContextMessage( contexts, translation ) {
		const packageContext = contexts.get( translation.package );
		const corePackageContext = contexts.get( corePackageName );

		return corePackageContext.content[ translation.key ] || packageContext.content[ translation.key ];
	},

	jsonToPoFile( messages ) {
		return messages.map( ( msg ) => {
			return [
				`msgid "${msg.id}"`,
				`msgstr "${msg.str}"`,
				`msgctxt "${msg.ctxt}"`
			].map( x => x + '\n' ).join( '' );
		} ).join( '\n' );
	},

	savePoFile( fileContent ) {
		const outputFile = path.join( process.cwd(), 'build', '.transifex', 'english.po' );

		fs.outputFileSync( outputFile, fileContent );

		logger.info( `Created file: ${ outputFile }` );
	},

	getUniqueTranslations( translations ) {
		const uniqueTranslations = [];
		const uniqueTranslationKeys = [];

		for ( const translation of translations ) {
			if ( !uniqueTranslationKeys.includes( translation.key ) ) {
				uniqueTranslations.push( translation );
				uniqueTranslationKeys.push( translation.key );
			}
		}

		return uniqueTranslations;
	},
};

module.exports = utils;