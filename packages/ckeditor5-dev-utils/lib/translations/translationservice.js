/**
 * @license Copyright (c) 2003-2017, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const path = require( 'path' );
const fs = require( 'fs' );
const createDictionaryFromPoFileContent = require( './createdictionaryfrompofilecontent' );
const acorn = require( 'acorn' );
const walk = require( 'acorn/dist/walk' );
const escodegen = require( 'escodegen' );
const logger = require( '../logger' )();

/**
 *
 */
module.exports = class TranslationService {
	/**
	 * @param {String} language Target language.
	 * @param {Object} [options] Optional config.
	 * @param {Function} [options.getPathToPoFile] Function that return a full path to the po file.
	 */
	constructor( language, options = {} ) {
		this.language = language;
		this.getPathToPoFile = options.getPathToPoFile || getDefaultPathToPoFile;

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

		const pathToPoFile = this.getPathToPoFile( pathToPackage, this.language );

		this._loadPoFile( pathToPoFile );
	}

	/**
	 * Parses source, translates `t()` call arguments and returns modified output.
	 *
	 * @param {String} source JS source text which will be translated.
	 * @returns {String}
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

		let changesInCode = false;

		walk.simple( ast, {
			CallExpression: node => {
				if ( node.callee.name !== 't' ) {
					return;
				}

				if ( node.arguments[ 0 ].type !== 'Literal' ) {
					logger.error( 'First t() call argument should be a string literal.' );

					return;
				}

				changesInCode = true;
				node.arguments[ 0 ].value = this._translateString( node.arguments[ 0 ].value );
			}
		} );

		// Optimization for files without t() calls.
		if ( !changesInCode ) {
			return source;
		}

		escodegen.attachComments( ast, comments, tokens );
		const output = escodegen.generate( ast, {
			comment: true
		} );

		return output;
	}

	// Loads translations from the po file.
	_loadPoFile( pathToPoFile ) {
		if ( !fs.existsSync( pathToPoFile ) ) {
			return;
		}

		const poFileContent = fs.readFileSync( pathToPoFile, 'utf-8' );
		const parsedTranslationFile = createDictionaryFromPoFileContent( poFileContent );

		for ( const translationKey in parsedTranslationFile ) {
			this.dictionary.set( translationKey, parsedTranslationFile[ translationKey ] );
		}
	}

	// Translates all t() call found in source text to the target language.
	_translateString( originalString ) {
		let translation = this.dictionary.get( originalString );

		if ( !translation ) {
			logger.error( `Missing translation for: ${ originalString }.` );

			translation = originalString;
		}

		return translation;
	}
};

function getDefaultPathToPoFile( pathToPackage, languageCode ) {
	return path.join( pathToPackage, 'lang', 'translations', languageCode + '.po' );
}
