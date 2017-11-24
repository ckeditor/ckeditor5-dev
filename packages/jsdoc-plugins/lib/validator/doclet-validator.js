/**
 * @license Copyright (c) 2016-2017, CKSource - Frederico Knabben. All rights reserved.
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
	}

	/**
	 * Creates doclets grouped by doclet kind
	 * @private
	 * @returns {Collection}
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
	 * @returns {Object[]}
	 */
	findErrors() {
		this._errors = [];

		this._lintMembers();
		this._lintMemberofProperty();
		this._lintLongnamePropertyInClasses();
		this._lintParams();
		this._lintLinks();
		this._lintEvents();
		this._lintInterfaces();
		this._lintModuleDocumentedExports();
		this._lintReturnTypes();
		this._lintSeeReferences();
		this._lintTypedefs();

		return this._errors;
	}

	/**
	 * Finds errors in member names
	 * JSDoc changes member name 'a' to module:someModule/a when founds no such name
	 * @protected
	*/
	_lintMembers() {
		this._collection.get( 'member' )
			.filter( member => member.name.includes( 'module:' ) )
			.filter( member => member.scope === 'inner' )
			.forEach( member => this._addError( member, `Incorrect member name: ${ member.name }` ) );
	}

	/**
	 * protected
	 */
	_lintMemberofProperty() {
		this._collection.getAll()
			.filter( el => el.memberof && !el.memberof.includes( 'module:' ) )
			.filter( el => el.memberof.indexOf( '<anonymous>' ) === -1 ) // local variables, functions
			.filter( el => !el.undocumented ) // undocummented inner code.
			.forEach( el => {
				this._addError( el, `Memberof property should start with 'module:'. Got '${ el.memberof }' instead.` );
			} );
	}

	_lintLongnamePropertyInClasses() {
		this._collection.getAll()
			.filter( el => el.longname )
			.filter( el => {
				const match = el.longname.match( /~([\w]+)\.([\w]+)$/ ); // e.g module:utils/ckeditorerror~CKEditorError.CKEditorError

				return match && match[ 1 ] === match[ 2 ];
			} )
			.forEach( el => this._addError( el, `Incorrect class reference name. Got ${ el.longname }` ) );
	}

	_lintLongnameProperty() {
		this._collection.getAll()
			.filter( el => el.longname && !el.longname.includes( 'module:' ) )
			.forEach( el => {
				this._addError( el, `Longname property should start with 'module:'. Got ${ el.longname } instead` );
			} );
	}

	/**
	 * Finds errors in parameter types
	 * @protected */
	_lintParams() {
		const collections = [
			...this._collection.get( 'function' ),
			...this._collection.get( 'class' ),
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
		const allLinkRegExp = /\{@link\s+[^}\s]+[\s\w]*\}/g;
		const pathRegExp = /^\{@link\s+([^}\s]+)[\s\w]*\}$/;

		for ( const element of this._collection.getAll() ) {
			if ( !element.comment ) {
				continue;
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

	_getAllLongNames() {
		return this._collection.getAll()
			.map( el => el.longname );
	}

	/**
	 * @private
	 * @param {string} errorMessage
	 */
	_addError( doclet, errorMessage ) {
		this._errors.push( Object.assign( {
			message: errorMessage,
		}, this._getErrorData( doclet ) ) );
	}

	/**
	 * @private
	 * @param {Object} member
	 */
	_getErrorData( doclet ) {
		return {
			parent: doclet.memberof,
			line: doclet.meta.lineno,
			file: doclet.meta.path + '/' + doclet.meta.filename,
		};
	}

	/**
	 * Naive implementation of simple parser.
	 *
	 * @protected
	 * @param {String} type to assert
	 * @param {Array.<Object>} [additionalTypes]
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
			return this._isCorrectReference( type );
		}

		type = type.trim();

		return ALL_TYPES.includes( type ) ||
			/^'[^']+'$/.test( type ); // string literal type - e.g. 'forward', 'backward';
	}

	_isCorrectReference( type ) {
		type = type.trim();
		const doclets = this._collection.getAll();
		const allRefs = this._collection.getAllLongnames();

		if ( !type.includes( 'module:' ) ) {
			return false;
		}

		if ( type.includes( '#' ) ) {
			return doesFieldExistInClass( doclets, type );
		}

		return allRefs.includes( type );
	}
}

module.exports = DocletValidator;
