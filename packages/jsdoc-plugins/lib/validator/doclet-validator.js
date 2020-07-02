/**
 * @license Copyright (c) 2003-2020, CKSource - Frederico Knabben. All rights reserved.
 * Licensed under the terms of the MIT License (see LICENSE.md).
 */

'use strict';

const DocletCollection = require( '../utils/doclet-collection' );
const { doesFieldExistInClass } = require( '../utils/doclet-utils' );
const { ALL_TYPES, GENERIC_TYPES } = require( './types' );

/**
 * Main validation class
 */
class DocletValidator {
	/**
	 * Creates DocletLinter
	 */
	constructor( doclets ) {
		/**
		 * 	Errors founded in findErrors method.
		 *  @protected
		 * */
		this._errors = [];

		/**
		 * doclets grouped by doclet kind
		 * @private
		 */
		this._collection = this._createDocletCollection( doclets );

		this._docletMap = createDocletMap( doclets );
	}

	/**
	 * Creates doclets grouped by doclet kind
	 * @private
	 * @returns {DocletCollection}
	 */
	_createDocletCollection( doclets ) {
		const collection = new DocletCollection();

		for ( const doclet of doclets ) {
			collection.add( doclet.kind, doclet );
		}

		return collection;
	}

	/**
	 * @public
	 * @returns {Array.<Object>}
	 */
	findErrors() {
		this._errors = [];

		this._lintMembers();
		this._lintMemberofProperty();
		this._lintLongnamePropertyInClasses();
		this._lintParams();
		this._lintLinks();
		// this._lintEvents();
		this._lintInterfaces();
		this._lintModuleDocumentedExports();
		this._lintReturnTypes();
		this._lintSeeReferences();
		this._lintTypedefs();
		this._lintExtensibility();

		return this._errors;
	}

	/**
	 * Finds errors in member names
	 * JSDoc changes member name `a` to `module:someModule/a` when founds no such name.
	 * @protected
	*/
	_lintMembers() {
		this._collection.get( 'member' )
			.filter( member => member.name.includes( 'module:' ) )
			.filter( member => member.scope === 'inner' )
			.forEach( member => this._addError( member, `Incorrect member name: ${ member.name }` ) );
	}

	/**
	 * @protected
	 */
	_lintMemberofProperty() {
		this._collection.getAll()
			.filter( el => el.memberof && !el.memberof.includes( 'module:' ) )
			.filter( el => el.memberof.indexOf( '<anonymous>' ) === -1 ) // Local variables, functions.
			.filter( el => !el.undocumented ) // Undocumented inner code. E.g members of local variables.
			.forEach( el => {
				this._addError( el, `Memberof property should start with 'module:'. Got '${ el.memberof }' instead.` );
			} );
	}

	/**
	 * @protected
	 */
	_lintLongnamePropertyInClasses() {
		this._collection.getAll()
			.filter( el => el.longname )
			.filter( el => {
				const match = el.longname.match( /~([\w]+)\.([\w]+)$/ ); // e.g module:utils/ckeditorerror~CKEditorError.CKEditorError

				return match && match[ 1 ] === match[ 2 ];
			} )
			.forEach( el => this._addError( el, `Incorrect class reference name. Got ${ el.longname }` ) );
	}

	/**
	 * @protected
	 */
	_lintLongnameProperty() {
		this._collection.getAll()
			.filter( el => el.longname && !el.longname.includes( 'module:' ) )
			.forEach( el => {
				this._addError( el, `Longname property should start with 'module:'. Got ${ el.longname } instead` );
			} );
	}

	/**
	 * Finds errors in parameter types
	 * @protected
	 */
	_lintParams() {
		const collections = [
			...this._collection.get( 'function' ),
			...this._collection.get( 'class' )
		]
			.filter( el => !!el.params );

		for ( const element of collections ) {
			for ( const param of element.params ) {
				this._lintElementParams( element, param );
			}
		}
	}

	/**
	 * @private
	 */
	_lintElementParams( element, param ) {
		if ( !param.type ) {
			return;
		}

		const paramFullNames = Array.isArray( param.type.names ) ? param.type.names : [];

		for ( const paramFullName of paramFullNames ) {
			if ( !paramFullName ) {
				continue;
			}

			if ( !this._isCorrectType( paramFullName ) ) {
				this._addError( element, `Incorrect param type: ${ paramFullName }` );
			}
		}
	}

	/**
	 * Finds errors in links
	 *
	 * @protected
	 */
	_lintLinks() {
		const allLinkRegExp = /\{@link\s+[^}]+\}/g;
		const pathRegExp = /^\{@link\s+([^}\s]+)[^}]*\}$/;

		const optionalTagWithBracedContentRegExp = /(@[a-z]+ )?\{[^}]+\}/g;

		for ( const element of this._collection.getAll() ) {
			if ( !element.comment ) {
				continue;
			}

			// Find all missing `@link` parts inside comments.
			for ( const commentPart of element.comment.match( optionalTagWithBracedContentRegExp ) || [] ) {
				if ( commentPart.startsWith( '{module:' ) ) {
					// If the comment part starts with the '{module:' it means that:
					// * it's not a normal tag (tags starts with `@` and the tagName).
					// * it's not a link (the part misses the `@link` part), but it supposed to be (it contains the `module:` part).
					this._addError( element, `Link misses the '@link' part: ${ commentPart }` );
				}
			}

			const refs = ( element.comment.match( allLinkRegExp ) || [] )
				.map( link => link.match( pathRegExp )[ 1 ] );

			for ( const ref of refs ) {
				if ( !this._isCorrectReference( ref ) ) {
					this._addError( element, `Incorrect link: ${ ref }` );
				}
			}
		}
	}

	/**
	 * Finds errors in tag 'fires'.
	 *
	 * @protected
	 */
	_lintEvents() {
		const eventNames = this._collection.get( 'event' ).map( event => event.longname );

		for ( const element of this._collection.getAll() ) {
			for ( const event of element.fires || [] ) {
				if ( !eventNames.includes( event ) ) {
					this._addError( element, `Incorrect event name: ${ event } in @fires tag` );
				}
			}
		}
	}

	/**
	 * Finds errors in tag 'implements'
	 *
	 * @protected
	 */
	_lintInterfaces() {
		const classesAndMixins = [ ...this._collection.get( 'class' ), ...this._collection.get( 'mixin' ) ];
		const interfaceLongNames = this._collection.get( 'interface' )
			.map( i => i.longname );

		for ( const someClassOrMixin of classesAndMixins ) {
			for ( const someInterface of someClassOrMixin.implements || [] ) {
				if ( !interfaceLongNames.includes( someInterface ) ) {
					this._addError( someClassOrMixin, `Incorrect interface name: ${ someInterface }` );
				}
			}
		}
	}

	/**
	 * @protected
	 */
	_lintModuleDocumentedExports() {
		const moduleNames = this._collection.get( 'module' )
			.map( module => module.longname );
		const members = this._collection.get( 'member' )
			.filter( member => member.scope === 'inner' )
			.filter( member => !member.undocumented );

		for ( const member of members ) {
			if ( moduleNames.includes( member.memberof ) ) {
				this._addError( member, `Module ${ member.memberof } exports member: ${ member.name }` );
			}
		}
	}

	/**
	 * @protected
	 */
	_lintReturnTypes() {
		const returnElements = this._collection.getAll()
			.filter( el => !!el.returns );

		for ( const returnEl of returnElements ) {
			if ( !returnEl.returns[ 0 ].type ) {
				this._addError( returnEl, 'Invalid return type.' );
				continue;
			}

			for ( const typeName of returnEl.returns[ 0 ].type.names ) {
				if ( !this._isCorrectType( typeName ) ) {
					this._addError( returnEl, `Invalid return type: ${ typeName }.` );
				}
			}
		}
	}

	/**
	 * @protected
	 */
	_lintSeeReferences() {
		for ( const doclet of this._collection.getAll() ) {
			for ( const seeReference of doclet.see || [] ) {
				if ( !this._isCorrectReference( seeReference ) ) {
					this._addError( doclet, `Invalid @see reference: ${ seeReference }.` );
				}
			}
		}
	}

	/**
	 * @protected
	 */
	_lintTypedefs() {
		for ( const doclet of this._collection.getAll() ) {
			for ( const prop of doclet.properties || [] ) {
				for ( const typeName of prop.type.names ) {
					if ( !this._isCorrectType( typeName ) ) {
						this._addError( doclet, `Invalid @property type: ${ typeName }.` );
					}
				}
			}
		}
	}

	/**
	 * Checks whether the reference in the `@extends` tag is correct.
	 *
	 * @protected
	 */
	_lintExtensibility() {
		for ( const doclet of this._collection.getAll() ) {
			for ( const base of doclet.augments || [] ) {
				if ( !this._isCorrectReference( base ) && !this._isValidBuiltInType( base ) ) {
					this._addError(
						doclet,
						`Invalid @extends reference: ${ base }.`
					);
				}
			}
		}
	}

	/**
	 * @private
	 * @param {Doclet} doclet
	 * @param {string} errorMessage
	 */
	_addError( doclet, errorMessage ) {
		this._errors.push( Object.assign( {
			message: errorMessage
		}, this._getErrorData( doclet ) ) );
	}

	/**
	 * @private
	 * @param {Doclet} doclet
	 */
	_getErrorData( doclet ) {
		return {
			parent: doclet.memberof,
			line: doclet.meta.lineno,
			file: doclet.meta.path + '/' + doclet.meta.filename
		};
	}

	/**
	 * Naive implementation of simple parser.
	 *
	 * @protected
	 * @param {String} type to assert
	 *
	 * @returns {Boolean}
	 */
	_isCorrectType( type ) {
		// JSDoc converts `Type.<Function>` to `Type.<function()>` for some reason...
		type = type.replace( 'function()', 'function' );

		const complexTypeRegExp = /^([\w]+)\.<\(?([^)^>]+)\)?>$/;

		if ( complexTypeRegExp.test( type ) ) {
			const [ , genericType, innerType ] = type.match( complexTypeRegExp );

			return GENERIC_TYPES.includes( genericType ) && this._isCorrectType( innerType );
		}

		if ( type.includes( '|' ) ) {
			return type.split( '|' ).every( unionType => this._isCorrectType( unionType ) );
		}

		if ( type.includes( ',' ) ) {
			return type.split( ',' ).every( type => this._isCorrectType( type ) );
		}

		if ( type.includes( 'module:' ) ) {
			return this._isCorrectReferenceType( type );
		}

		type = type.trim();

		return this._isValidBuiltInType( type ) ||
			this._isStringLiteralType( type );
	}

	/** @private */
	_isValidBuiltInType( type ) {
		return ALL_TYPES.includes( type );
	}

	/**
	 * A string literal type - e.g. 'forward' or 'backward';
	 *
	 * @private
	 */
	_isStringLiteralType( type ) {
		return /^'[^']+'$/.test( type );
	}

	/**
	 * @private
	 * @param {String} type
	 */
	_isCorrectReference( type ) {
		type = type.trim();

		if ( !type.includes( 'module:' ) ) {
			return false;
		}

		if ( type.includes( '#' ) ) {
			return doesFieldExistInClass( this._docletMap, type );
		}

		return !!this._docletMap[ type ];
	}

	/**
	 * Returns `true` when the reference points to the symbol which is one of:
	 * * class
	 * * interface
	 * * typedef
	 * * function
	 *
	 * @private
	 * @param {String} type
	 */
	_isCorrectReferenceType( type ) {
		type = type.trim();

		if ( !type.includes( 'module:' ) ) {
			return false;
		}

		const doclet = this._docletMap[ type ];

		if ( !doclet ) {
			return false;
		}

		return doclet.kind === 'class' ||
			doclet.kind === 'interface' ||
			doclet.kind === 'typedef' ||
			doclet.kind === 'function';
	}
}

function createDocletMap( doclets ) {
	const map = {};

	for ( const doclet of doclets ) {
		map[ doclet.longname ] = doclet;
	}

	return map;
}

module.exports = DocletValidator;
