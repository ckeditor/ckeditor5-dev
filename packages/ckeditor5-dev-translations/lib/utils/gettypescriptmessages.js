/**
 * @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import ts from 'typescript';
import upath from 'upath';

const LOCALE_TRANSLATE_DECLARATION_FILE_PATH = /[/\\]ckeditor5-utils[/\\].*[/\\]locale(?:\.d)?\.ts$/;

/**
 * @param {object} options
 * @param {string} [options.cwd=process.cwd()] Current working directory used to locate a TypeScript config.
 * @param {Array.<string>} options.sourceFiles An array of source files that contain messages to translate.
 * @param {Function} options.onErrorCallback Called when there is an error with parsing a source file.
 * @returns {Map<string, Array.<Message>>|null}
 */
export default function getTypeScriptMessages( { cwd = process.cwd(), sourceFiles, onErrorCallback } ) {
	const program = createProgram( { cwd, sourceFiles } );

	if ( !program ) {
		return null;
	}

	const checker = program.getTypeChecker();
	const sourceMessages = new Map();

	for ( const filePath of sourceFiles ) {
		const normalizedFilePath = upath.normalize( filePath );
		const sourceFile = program.getSourceFile( normalizedFilePath ) || program.getSourceFile( filePath );

		if ( !sourceFile ) {
			continue;
		}

		const messages = [];

		collectMessages( {
			sourceFile,
			checker,
			onMessageFound: message => messages.push( message ),
			onErrorFound: onErrorCallback
		} );

		sourceMessages.set( normalizedFilePath, messages );
	}

	return sourceMessages;
}

/**
 * @param {object} options
 * @param {string} options.cwd
 * @param {Array.<string>} options.sourceFiles
 * @returns {import( 'typescript' ).Program|null}
 */
function createProgram( { cwd, sourceFiles } ) {
	const tsconfigPath = ts.findConfigFile( cwd, ts.sys.fileExists, 'tsconfig.json' );

	if ( !tsconfigPath ) {
		return null;
	}

	const config = ts.readConfigFile( tsconfigPath, ts.sys.readFile );

	if ( config.error ) {
		return null;
	}

	const parsedConfig = ts.parseJsonConfigFileContent( config.config, ts.sys, upath.dirname( tsconfigPath ), undefined, tsconfigPath );
	const rootNames = Array.from( new Set( [
		...parsedConfig.fileNames.map( filePath => upath.normalize( filePath ) ),
		...sourceFiles.map( filePath => upath.normalize( filePath ) )
	] ) );

	return ts.createProgram( {
		rootNames,
		options: parsedConfig.options,
		projectReferences: parsedConfig.projectReferences
	} );
}

/**
 * @param {object} options
 * @param {import( 'typescript' ).SourceFile} options.sourceFile
 * @param {import( 'typescript' ).TypeChecker} options.checker
 * @param {( msg: Message ) => void} options.onMessageFound
 * @param {( err: string ) => void} options.onErrorFound
 */
function collectMessages( { sourceFile, checker, onMessageFound, onErrorFound } ) {
	const visit = node => {
		if ( ts.isCallExpression( node ) && isTranslationCallExpression( node, checker ) ) {
			const firstArgument = node.arguments[ 0 ];

			if ( firstArgument ) {
				findMessagesInExpression( firstArgument, sourceFile.fileName, onMessageFound, onErrorFound );
			}
		}

		ts.forEachChild( node, visit );
	};

	visit( sourceFile );
}

/**
 * @param {import( 'typescript' ).CallExpression} node
 * @param {import( 'typescript' ).TypeChecker} checker
 * @returns {boolean}
 */
function isTranslationCallExpression( node, checker ) {
	return isDirectTFunctionCallExpression( node.expression ) || isTMethodCallExpression( node.expression, checker );
}

/**
 * @param {import( 'typescript' ).Expression} expression
 * @returns {boolean}
 */
function isDirectTFunctionCallExpression( expression ) {
	const unwrappedExpression = unwrapExpression( expression );

	return ts.isIdentifier( unwrappedExpression ) && unwrappedExpression.text === 't';
}

/**
 * @param {import( 'typescript' ).CallExpression} callExpression
 * @param {import( 'typescript' ).TypeChecker} checker
 * @returns {boolean}
 */
function isTMethodCallExpression( expression, checker ) {
	const unwrappedExpression = unwrapExpression( expression );

	if ( ts.isPropertyAccessExpression( unwrappedExpression ) ) {
		return unwrappedExpression.name.text === 't' && isLocaleTranslateType( checker.getTypeAtLocation( unwrappedExpression ) );
	}

	if ( ts.isElementAccessExpression( unwrappedExpression ) && unwrappedExpression.argumentExpression ) {
		const argumentExpression = unwrapExpression( unwrappedExpression.argumentExpression );

		return ts.isStringLiteralLike( argumentExpression ) && argumentExpression.text === 't' &&
			isLocaleTranslateType( checker.getTypeAtLocation( unwrappedExpression ) );
	}

	return false;
}

/**
 * @param {import( 'typescript' ).Type|undefined} type
 * @param {Set<import( 'typescript' ).Type>} visitedTypes
 * @returns {boolean}
 */
function isLocaleTranslateType( type, visitedTypes = new Set() ) {
	if ( !type || visitedTypes.has( type ) ) {
		return false;
	}

	visitedTypes.add( type );

	const aliasSymbol = type.aliasSymbol;

	if ( aliasSymbol?.getName() === 'LocaleTranslate' && aliasSymbol.declarations?.some( isLocaleTranslateDeclaration ) ) {
		return true;
	}

	const symbol = type.getSymbol();

	if ( symbol?.getName() === 'LocaleTranslate' && symbol.declarations?.some( isLocaleTranslateDeclaration ) ) {
		return true;
	}

	if ( type.flags & ( ts.TypeFlags.Union | ts.TypeFlags.Intersection ) ) {
		return type.types.some( innerType => isLocaleTranslateType( innerType, visitedTypes ) );
	}

	return type.getCallSignatures().some( signature => isLocaleTranslateSignature( signature ) );
}

/**
 * @param {import( 'typescript' ).Signature|undefined} signature
 * @returns {boolean}
 */
function isLocaleTranslateSignature( signature ) {
	const declaration = signature?.getDeclaration();

	return !!declaration && isNodeInsideLocaleTranslateDeclaration( declaration );
}

/**
 * @param {import( 'typescript' ).Node} node
 * @returns {boolean}
 */
function isNodeInsideLocaleTranslateDeclaration( node ) {
	let currentNode = node;

	while ( currentNode ) {
		if ( ts.isTypeAliasDeclaration( currentNode ) ) {
			return isLocaleTranslateDeclaration( currentNode );
		}

		currentNode = currentNode.parent;
	}

	return false;
}

/**
 * @param {import( 'typescript' ).Node} node
 * @returns {boolean}
 */
function isLocaleTranslateDeclaration( node ) {
	if ( !ts.isTypeAliasDeclaration( node ) ) {
		return false;
	}

	return node.name.text === 'LocaleTranslate' &&
		LOCALE_TRANSLATE_DECLARATION_FILE_PATH.test( upath.normalize( node.getSourceFile().fileName ) );
}

/**
 * @param {import( 'typescript' ).Expression} node
 * @param {string} sourceFile
 * @param {( msg: Message ) => void} onMessageFound
 * @param {( err: string ) => void} onErrorFound
 */
function findMessagesInExpression( node, sourceFile, onMessageFound, onErrorFound ) {
	const unwrappedNode = unwrapExpression( node );

	if ( ts.isObjectLiteralExpression( unwrappedNode ) ) {
		const idProperty = getProperty( unwrappedNode.properties, 'id' );
		const stringProperty = getProperty( unwrappedNode.properties, 'string' );
		const pluralProperty = getProperty( unwrappedNode.properties, 'plural' );

		if ( !stringProperty ) {
			onErrorFound( `First t() call argument should be a string literal or an object literal (${ sourceFile }).` );
			return;
		}

		const stringValue = getLiteralStringValue( stringProperty.initializer );
		const idValue = idProperty ? getLiteralStringValue( idProperty.initializer ) : null;
		const pluralValue = pluralProperty ? getLiteralStringValue( pluralProperty.initializer ) : null;

		if ( !stringValue || ( idProperty && !idValue ) || ( pluralProperty && !pluralValue ) ) {
			onErrorFound( `First t() call argument should be a string literal or an object literal (${ sourceFile }).` );
			return;
		}

		/** @type {Message} */
		const message = {
			string: stringValue,
			id: idValue || stringValue
		};

		if ( pluralValue ) {
			message.plural = pluralValue;
		}

		onMessageFound( message );

		return;
	}

	if ( ts.isStringLiteralLike( unwrappedNode ) ) {
		onMessageFound( {
			string: unwrappedNode.text,
			id: unwrappedNode.text
		} );

		return;
	}

	if ( ts.isConditionalExpression( unwrappedNode ) ) {
		findMessagesInExpression( unwrappedNode.whenTrue, sourceFile, onMessageFound, onErrorFound );
		findMessagesInExpression( unwrappedNode.whenFalse, sourceFile, onMessageFound, onErrorFound );

		return;
	}

	onErrorFound( `First t() call argument should be a string literal or an object literal (${ sourceFile }).` );
}

/**
 * @param {import( 'typescript' ).NodeArray<import( 'typescript' ).ObjectLiteralElementLike>} properties
 * @param {string} propertyName
 * @returns {import( 'typescript' ).PropertyAssignment|null}
 */
function getProperty( properties, propertyName ) {
	return properties.find( property => {
		if ( !ts.isPropertyAssignment( property ) ) {
			return false;
		}

		if ( ts.isIdentifier( property.name ) ) {
			return property.name.text === propertyName;
		}

		if ( ts.isStringLiteralLike( property.name ) ) {
			return property.name.text === propertyName;
		}

		return false;
	} ) || null;
}

/**
 * @param {import( 'typescript' ).Expression} expression
 * @returns {string|null}
 */
function getLiteralStringValue( expression ) {
	const unwrappedExpression = unwrapExpression( expression );

	return ts.isStringLiteralLike( unwrappedExpression ) ? unwrappedExpression.text : null;
}

/**
 * @param {import( 'typescript' ).Expression} expression
 * @returns {import( 'typescript' ).Expression}
 */
function unwrapExpression( expression ) {
	let currentExpression = expression;

	while (
		ts.isParenthesizedExpression( currentExpression ) ||
		ts.isAsExpression( currentExpression ) ||
		ts.isNonNullExpression( currentExpression ) ||
		ts.isTypeAssertionExpression( currentExpression ) ||
		ts.isPartiallyEmittedExpression( currentExpression ) ||
		ts.isSatisfiesExpression( currentExpression )
	) {
		currentExpression = currentExpression.expression;
	}

	return currentExpression;
}

/**
 * @typedef {object} Message
 *
 * @property {string} id
 * @property {string} string
 * @property {string} [plural]
 */
