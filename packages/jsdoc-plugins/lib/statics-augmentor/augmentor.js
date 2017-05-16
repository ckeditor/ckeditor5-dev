/**
 * @license Copyright (c) 2017, CKSource - Frederico Knabben. All rights reserved.
 * Licensed under the terms of the MIT License (see LICENSE.md).
 */

'use strict';

/**
 *
 */
class StaticsAugmentor {
	constructor( doclets ) {
		this._data = doclets;

		this._longnames = doclets.index.longname;

		this._documented = doclets.index.documented;
	}

	augmentStatics() {
		// find all classes and interfaces with 'augments' property, they may be missing inherited static members
		const candidates = this._getDescendants();

		for ( let candidate of candidates ) {
			// get all parent doclets
			const parents = this._getAncestors( candidate.augments );

			for ( let parent of parents ) {
				// get all static members which will be added as new doclets as members of candidates
				const staticMembers = this._getStaticMembers( parent.longname );

				for ( let member of staticMembers ) {
					this._handleStaticMember( member, candidate );
				}
			}
		}
	}

	/**
	 * Finds doclet candidates for having inherited static members added.
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

	_getDocletByLongname( longname ) {
		return this._data.find( doclet => doclet.longname === longname );
	}

	_getStaticMembers( longname ) {
		return this._data.filter( doclet => doclet.memberof === longname && doclet.scope === 'static' );
	}

	_handleStaticMember( member, candidate ) {
		if ( member.undocumented ) {
			return;
		}
		// deep clone member
		const clone = JSON.parse( JSON.stringify( member ) );

		this._addNewDoclet( clone, member, candidate );
	}

	_addNewDoclet( doclet, original, candidate ) {
		let parts;

		if ( !doclet.inherited ) {
			doclet.inherits = doclet.longname;
		}
		doclet.inherited = true;

		doclet.memberof = candidate.longname;

		parts = doclet.longname.split( '.' );
		parts[ 0 ] = candidate.longname;
		doclet.longname = parts.join( '.' );

		if ( this._longnames.hasOwnProperty( doclet.longname ) ) {
			doclet.overrides = original.longname;
		} else {
			delete doclet.overrides;
		}

		if ( !this._documented.hasOwnProperty( doclet.longname ) ) {
			this._data.push( doclet );
		} else if ( explicitlyInherits( this._documented[ doclet.longname ] ) ) {
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

			this._data.push( doclet );
		} else {
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