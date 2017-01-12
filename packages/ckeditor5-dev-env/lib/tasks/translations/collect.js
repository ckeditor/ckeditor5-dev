/**
 * @license Copyright (c) 2003-2016, CKSource - Frederico Knabben. All rights reserved.
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

module.exports = function collect() {
	const contexts = getContexts();
	const translations = collectTranslations();

	const errors = [
		...getUnusedContextErrorMessages( contexts, translations ),
		...getMissingContextErrorMessages( contexts, translations ),
		...getRepeatedContextErrorMessages( contexts )
	];

	if ( errors.length > 0 ) {
		errors.forEach( error => logger.error( error ) );

		return;
	}

	const uniqueTranlations = getUniqueTranslations( translations );

	const poFileContent = createPoFileContent( contexts, uniqueTranlations );

	savePoFile( poFileContent );
};

function collectTranslations() {
	const srcPaths = [ process.cwd(), 'node_modules', 'ckeditor5-!(dev)*', 'src', '**', '*.js' ].join( '/' );
	const files = glob.sync( srcPaths  );
	const translations = [];

	for ( const filePath of files ) {
		const content =  fs.readFileSync( filePath, 'utf-8' );

		translations.push( ...getTranslationCallsFromFile( filePath, content ) );
	}

	return translations;
}

function getTranslationCallsFromFile( filePath, fileContent ) {
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
			sentence: sentenceMatch[0],
		};
	} )
	.filter( translationCall => !!translationCall );
}

function getContexts() {
	return fs.readdirSync( path.join( nodeModulesDir ) )
		.filter( fileOrDirectory => /ckeditor5-[^/\//]+$/.test( fileOrDirectory ) )
		.reduce( ( map, packageName ) => {
			const pathToContext = path.join( nodeModulesDir, packageName, langContextSuffix );

			if ( !fs.existsSync( pathToContext ) ) {
				return map;
			}

			return map.set( packageName, {
				filePath: pathToContext,
				content: JSON.parse( fs.readFileSync( pathToContext, 'utf-8' ) )
			} );
		}, new Map() );
}

// @param {Map.<Object>} contexts
// @param {Array.<Object>} translations
function getMissingContextErrorMessages( contexts, translations ) {
	const errors = [];

	for ( const translation of translations ) {
		const errorMessage = maybeGetContextErrorMessage( contexts, translation );

		if ( errorMessage ) {
			errors.push( errorMessage );
		}
	}

	return errors;
}

function maybeGetContextErrorMessage( contexts, translation ) {
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
}

function getUnusedContextErrorMessages( contexts, translations ) {
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
}

function getRepeatedContextErrorMessages( contexts ) {
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
}

function createPoFileContent( contexts, translations ) {
	const messages = translations.map( ( translation ) => {
		const ctxtMessage = getContextMessage( contexts, translation );

		return {
			id: translation.sentence,
			str: translation.sentence,
			ctxt: ctxtMessage
		};
	} );

	return jsonToPoFile( messages );
}

function getContextMessage( contexts, translation ) {
	const packageContext = contexts.get( translation.package );
	const corePackageContext = contexts.get( corePackageName );

	return corePackageContext.content[ translation.key ] || packageContext.content[ translation.key ];
}

function jsonToPoFile( messages ) {
	return messages.map( ( msg ) => {
		return [
			`msgid "${msg.id}"`,
			`msgstr "${msg.str}"`,
			`msgctxt "${msg.ctxt}"`
		].map( x => x + '\n' ).join( '' );
	} ).join( '\n' );
}

function savePoFile( fileContent ) {
	const outputFile = path.join( process.cwd(), 'build', '.transifex', 'english.po' );

	fs.outputFileSync( outputFile, fileContent );

	logger.info( `Created file: ${ outputFile }` );
}

function getUniqueTranslations( translations ) {
	const uniqueTranslations = [];
	const uniqueTranslationKeys = [];

	for ( const translation of translations ) {
		if ( !uniqueTranslationKeys.includes( translation.key ) ) {
			uniqueTranslations.push( translation );
			uniqueTranslationKeys.push( translation.key );
		}
	}

	return uniqueTranslations;
}
