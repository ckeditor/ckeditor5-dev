/**
 * @license Copyright (c) 2003-2016, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const glob = require( 'glob' );
const fs = require( 'fs' );
const path = require( 'path' );
const logger = require( '@ckeditor/ckeditor5-dev-utils' ).logger();

const nodeModulesDir = path.join( process.cwd(), 'node_modules' );
const langContextSuffix = path.join( 'lang', 'contexts.json' );

module.exports = function collect() {
	const contexts = getContexts();
	const translations = collectTranslations();

	// getUnsedContexts( contexts, translations )
	// 	.map( error => logger.error( error ) );

	getMissingContexts( contexts, translations )
		.map( error => logger.error( error ) );

	const poFileContent = createPOFile( contexts, translations );

	console.log( poFileContent );

	return translations;
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
	const fullMatches = fileContent.match( /[\s]t\([^)]+?\)/g ) || [];

	return fullMatches.map( ( fullMatch ) => {
		const stringMatch = fullMatch.match( /'([^']+?)'/ );

		if ( !stringMatch ) {
			logger.error( `Invalid translation call: ${ fullMatch } in ${ filePath }` );

			return;
		}

		const translationId = stringMatch[1];

		const contextMatch = translationId.match( /\[context: ([^\]]+)\]/ );
		const sentenceMatch = translationId.match( /^[^\[]+/ );
		const packageMatch = filePath.match( /\/(ckeditor5-[^\/]+)\// );

		return {
			filePath,
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
				logger.error( `Context file is missing: ${ pathToContext }` );

				return;
			}

			return map.set( packageName, {
				filePath: pathToContext,
				content: JSON.parse( fs.readFileSync( pathToContext, 'utf-8' ) )
			} );
		}, new Map() );
}

// @param {Map.<Object>} contexts
// @param {Array.<Object>} translations
function getMissingContexts( contexts, translations ) {
	const errors = [];

	for ( const translation of translations ) {
		const msgInfo = getContextMessageInfo( contexts, translation );

		if ( !( msgInfo.message ) ) {
			errors.push(
				`Missing context message for translation key: ${ msgInfo.fullTranslationKey }`,
				`\tin ${ msgInfo.packageContext.filePath }\n`
			);
		}
	}

	return errors;
}

function createPOFile( contexts, translations ) {
	const messages = translations.map( ( translation ) => {
		const msgInfo = getContextMessageInfo( contexts, translation );

		return {
			id: translation.sentence,
			str: translation.sentence,
			ctxt: msgInfo.message
		};
	} );

	return jsonToPoFile( messages );
}

function getContextMessageInfo( contexts, translation ) {
	const packageContext = contexts.get( translation.package );

	const fullTranslationKey = translation.context ?
		`${translation.sentence} [context: ${translation.context}]` :
		translation.sentence;

	return {
		fullTranslationKey,
		packageContext,
		message: packageContext.content[ fullTranslationKey ]
	};
}

function jsonToPoFile( messages ) {
	return messages.map( ( msg ) => {
		return [
			`msgid ${msg.id}`,
			`msgstr ${msg.str}`,
			`msgctxt ${msg.ctxt}`
		].map( x => x + '\n' ).join( '' );
	} ).join( '\n' );
}

// function savePOFile( ) {
//
// }
