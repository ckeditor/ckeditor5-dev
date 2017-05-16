/**
 * @license Copyright (c) 2017, CKSource - Frederico Knabben. All rights reserved.
 * Licensed under the terms of the MIT License (see LICENSE.md).
 */

'use strict';

/**
 * Class which manually adds doclets for inherited static members.
 * Jsdoc doesn't support inheritance of static members which is why this plugin is needed.
 */
class StaticsAugmentor {
	constructor( doclets ) {
		this._data = doclets;

		/**
		 * Doclets
		 */
		this._longnames = doclets.index.longname;

		this._documented = doclets.index.documented;
	}

	augmentStatics() { //todo: remove these comments below becauase method docs will explain it
		// find all classes and interfaces with 'augments' property, they may be missing inherited static members
		const childClasses = this._getDescendants();

		for ( let child of childClasses ) {
			// get all parent doclets
			const parents = this._getAncestors( child.augments );

			for ( let parent of parents ) {
				// get all static members which will be added as new doclets as members of children classes
				const staticMembers = this._getStaticMembers( parent.longname );

				for ( let member of staticMembers ) {
					this._handleStaticMember( member, child );
				}
			}
		}
	}

	/**
	 * Finds doclets of child classes which need to have inherited static members added.
	 * These have to be of kind `class` or `interface` and have a non empty `augments` array.
	 * @returns {Array}
	 * @private
	 */
	_getDescendants() {
		return this._data.filter( doclet => Array.isArray( doclet.augments ) &&
			doclet.augments.length > 0 &&
			( doclet.kind === 'class' || doclet.kind === 'interface' )
		);
	}

	_getAncestors( longnames ) {
		return longnames.map( name => this._getDocletByLongname( name ) )
			.filter( name => !!( name ) );
	}

	// todo: check if there is only one doclet with a given longname
	_getDocletByLongname( longname ) {
		return this._data.find( doclet => doclet.longname === longname );
	}

	_getStaticMembers( longname ) {
		return this._data.filter( doclet => doclet.memberof === longname && doclet.scope === 'static' );
	}

	_handleStaticMember( member, childClass ) {
		if ( member.undocumented ) {
			return;
		}
		// deep clone member
		const clone = JSON.parse( JSON.stringify( member ) );

		this._addNewDoclet( clone, member, childClass );
	}

	_addNewDoclet( doclet, original, childClass ) {
		let parts;

		if ( !doclet.inherited ) {
			doclet.inherits = doclet.longname;
		}
		doclet.inherited = true;

		doclet.memberof = childClass.longname;

		parts = doclet.longname.split( '.' );
		parts[ 0 ] = childClass.longname;
		doclet.longname = parts.join( '.' );

		if ( this._longnames.hasOwnProperty( doclet.longname ) ) {
			doclet.overrides = original.longname;
		} else {
			delete doclet.overrides;
		}

		if ( !this._documented.hasOwnProperty( doclet.longname ) ) {
			// if there was no doclet for that member, simply add it to existing doclets
			this._data.push( doclet );
		} else if ( explicitlyInherits( this._documented[ doclet.longname ] ) ) {
			// if doclet for that member already existed and used `inheritdoc` or`overrides`
			// add `ignore` property to existing doclets
			this._documented[ doclet.longname ].forEach( ( d ) => {
				d.ignore = true;
			} );

			// remove properties which are no longer accurate or needed
			if ( doclet.virtual ) {
				delete doclet.virtual;
			}

			if ( doclet.inheritdoc ) {
				delete doclet.inheritdoc;
			}

			if ( doclet.override ) {
				delete doclet.override;
			}

			// add new doclet
			this._data.push( doclet );
		} else {
			// if doclet for that member already existed and didnt use `inheritdoc` or `overrides`
			// then don't do anything except add `overrides` property
			this._documented[ doclet.longname ].forEach( ( d ) => {
				d.overrides = original.longname;
			} );
		}
	}
}

function explicitlyInherits( doclets ) {
	let doclet;
	let inherits = false;

	for ( let i = 0, l = doclets.length; i < l; i++ ) {
		doclet = doclets[ i ];

		if ( typeof doclet.inheritdoc !== 'undefined' || typeof doclet.override !== 'undefined' ) {
			inherits = true;
			break;
		}
	}

	return inherits;
}

module.exports = StaticsAugmentor;