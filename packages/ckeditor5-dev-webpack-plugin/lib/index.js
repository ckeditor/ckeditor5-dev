/**
 * @license Copyright (c) 2003-2017, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const path = require( 'path' );
const fs = require( 'fs' );

module.exports = class CKEditorWebpackPlugin {
	/**
	 * @param {Object} [options]
	 * @param {Array.<String>} [options.packages] Array of directories in which packages will be looked for.
	 */
	constructor( options = {} ) {
		this.options = options;
	}

	apply( compiler ) {
		const { languages } = this.options;

		if ( languages && languages.length == 1 ) {
			replaceTranslationCallsForOneLangauge( compiler, languages[0] );
		}
	}
};

function replaceTranslationCallsForOneLangauge( compiler, language ) {
	const packageNames = new Set();

	compiler.plugin( 'after-resolvers', ( compiler ) => {
		compiler.resolvers.normal.plugin( 'before-resolve', ( obj, done ) => {
			const match = obj.request.match( /@ckeditor[\\\/]([^\\\/]+)/ );

			if ( match ) {
				packageNames.add( match[ 1 ] );
			}

			done();
		} );
	} );

	compiler.plugin( 'emit', ( options, done ) => {
		const allTranslations = getTranslationDictionary( packageNames, language );
		console.log( allTranslations );

		for ( const assetName in options.assets ) {
			replaceTCalls( options.assets[ assetName ], allTranslations );
		}

		done();
	} );
}

function replaceTCalls( assetContent, allTranslations ) {
	const source = assetContent.source().replace( / t\([^)]+?\)/gm, ( tCall ) => {
		const englishString = tCall.match( /'([^']+)/ )[ 1 ];

		const translation = allTranslations.get( englishString );

		if ( !translation ) {
			console.error( new Error( `Missing translation for: ${ englishString }` ) );

			return ` '${ englishString }'`;
		}

		return ` '${ translation }'`;
	} );

	assetContent.source = () => source;
	assetContent.size = () => source.size;
}

function getTranslationDictionary( packageNames, language ) {
	const dictionary = new Map();

	for ( const packageName of packageNames ) {
		const pathToPackage = path.join( process.cwd(), 'node_modules', '@ckeditor', packageName );
		const pathToTranslationFile = path.join( pathToPackage, 'lang', 'translations', language + '.json' );

		if ( fs.existsSync( pathToTranslationFile ) ) {
			const fileData = fs.readFileSync( pathToTranslationFile, 'utf-8' );
			const parsedTranslationFile = JSON.parse( fileData );

			for ( const translationKey in parsedTranslationFile ) {
				dictionary.set( translationKey, parsedTranslationFile[ translationKey ] || translationKey );
			}
		}
	}

	return dictionary;
}