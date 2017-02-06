/**
 * @license Copyright (c) 2003-2017, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const path = require( 'path' );
const fs = require( 'fs' );
const parsePoFileContent = require( './parsepofilecontent' );
const acorn = require( 'acorn' );
const walk = require( 'acorn/dist/walk' );
const escodegen = require( 'escodegen' );

/**
 *
 */
module.exports = class TranslationService {
	/**
	 * @param {String} langauge Target language.
	 */
	constructor( language ) {
		this.language = language;
		this.packagePaths = new Set();
		this.dictionary = new Map();
	}

	/**
	 * Loads package and tries to get the po file from the package.
	 *
	 * @param {String} pathToPackage Path to the package containing translations.
	 */
	loadPackage( pathToPackage ) {
		if ( this.packagePaths.has( pathToPackage ) ) {
			return;
		}

		this.packagePaths.add( pathToPackage );

		const pathToPoFile = path.join( pathToPackage, 'lang', 'translations', this.language + '.po' );

		console.log( pathToPoFile );

		if ( !fs.existsSync( pathToPoFile ) ) {
			return;
		}

		const poFileContent = fs.readFileSync( pathToPoFile, 'utf-8' );
		const parsedTranslationFile = parsePoFileContent( poFileContent );

		for ( const translationKey in parsedTranslationFile ) {
			this.dictionary.set( translationKey, parsedTranslationFile[ translationKey ] );
		}
	}

	/**
	 * Parses source, translates t call arguments and returns modified output.
	 *
	 * @param {String} source JS source text which will be translated.
	 */
	translateSource( source ) {
		const comments = [];
		const tokens = [];

		const ast = acorn.parse( source, {
			sourceType: 'module',
			ranges: true,
			onComment: comments,
			onToken: tokens
		} );

		walk.simple( ast, {
			CallExpression: ( node ) => {
				if ( node.callee.name !== 't' ) {
					return;
				}

				if ( node.arguments[ 0 ].type !== 'Literal' ) {
					console.error( 'First T call argument should be literal type' );

					return;
				}

				node.arguments[ 0 ].value = this._translateString( node.arguments[ 0 ].value );
			}
		} );

		escodegen.attachComments( ast, comments, tokens );
		const output = escodegen.generate( ast, { comment: true } );

		return output;
	}

	/**
	 * Translates all t() call found in source text to the target language.
	 *
	 * @param {String} originalString Source text which will be translated.
	 * @returns {String}
	 */
	_translateString( originalString ) {
		let translation = this.dictionary.get( originalString );

		if ( !translation ) {
			console.error( `Missing translation for: ${ originalString }` );
			translation = originalString;
		}

		return translation;
	}
};
