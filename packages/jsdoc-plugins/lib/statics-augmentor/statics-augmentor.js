/**
 * @license Copyright (c) 2017, CKSource - Frederico Knabben. All rights reserved.
 * Licensed under the terms of the MIT License (see LICENSE.md).
 */

'use strict';

/**
 * Manually adds doclets for inherited static members.
 * Jsdoc doesn't support inheritance of static members which is why this plugin is needed.
 */
class StaticsAugmentor {
	/**
	 * @param {Array.<Doclet>} doclets
	 */
	constructor( doclets ) {
		this._data = doclets;
	}

	/**
	 * Main method responsible for inheriting static members.
	 */
	augmentStatics() {
		const childClasses = this._getDescendants();

		for ( const child of childClasses ) {
			const parents = child.augments;

			for ( const parent of parents ) {
				const staticMembers = this._getStaticMembers( parent );

				for ( const member of staticMembers ) {
					this._handleStaticMember( member, child );
				}
			}
		}
	}

	/**
	 * Finds doclets of child classes which need to have inherited static members added.
	 * These have to be of kind `class` or `interface` and have a non empty `augments` array.
	 *
	 * @returns {Array.<Doclet>}
	 * @private
	 */
	_getDescendants() {
		return this._data.filter( doclet =>
			Array.isArray( doclet.augments ) &&
			doclet.augments.length > 0 &&
			( doclet.kind === 'class' || doclet.kind === 'interface' )
		);
	}

	/**
	 * Gets all static members of a doclet.
	 *
	 * @param {String} longname
	 * @returns {Array.<Doclet>}
	 * @private
	 */
	_getStaticMembers( longname ) {
		return this._data.filter( doclet => doclet.memberof === longname && doclet.scope === 'static' );
	}

	/**
	 * @param {Doclet}member
	 * @param {Doclet} childClass
	 * @private
	 */
	_handleStaticMember( member, childClass ) {
		if ( member.undocumented || member.ignore ) {
			return;
		}
		// Deep clone member.
		const clone = JSON.parse( JSON.stringify( member ) );

		this._addNewDoclet( clone, member, childClass );
	}

	/**
	 * Modifies and adds new doclet to array of doclets. Makes existing doclets ignored if needed.
	 *
	 * @param {Doclet} doclet New doclet which will be added to doclets array.
	 * @param {Doclet} original Doclet from which new doclet is created.
	 * @param {Doclet} childClass Doclet of a child class.
	 * @private
	 */
	_addNewDoclet( doclet, original, childClass ) {
		let parts;

		if ( !doclet.inherited ) {
			doclet.inherits = doclet.longname;
		}
		doclet.inherited = true;

		doclet.memberof = childClass.longname;

		// Static members are separated by a dot.
		parts = doclet.longname.split( '.' );
		parts[ 0 ] = childClass.longname;
		doclet.longname = parts.join( '.' );

		if ( this._getDocletsByLongname( doclet.longname ).length > 0 ) {
			doclet.overrides = original.longname;
		} else {
			delete doclet.overrides;
		}

		const docletsWithSameLongname = this._getDocletsByLongname( doclet.longname );

		if ( docletsWithSameLongname.length === 0 ) {
			// If there was no doclet for that member, simply add it to existing doclets.
			this._data.push( doclet );
		} else if ( this._explicitlyInherits( docletsWithSameLongname ) ) {
			// If doclet for that member already existed and used `inheritdoc` or`overrides`.
			// Add `ignore` property to existing doclets.
			docletsWithSameLongname.forEach( d => d.ignore = true );

			// Remove properties which are no longer accurate or needed.
			if ( doclet.virtual ) {
				delete doclet.virtual;
			}

			if ( doclet.inheritdoc ) {
				delete doclet.inheritdoc;
			}

			if ( doclet.override ) {
				delete doclet.override;
			}

			// Add new doclet.
			this._data.push( doclet );
		} else {
			// If doclet for that member already existed and didnt use `inheritdoc` or `overrides`.
			// Then don't do anything except adding `overrides` property.
			docletsWithSameLongname.forEach( d => d.overrides = original.longname );
		}
	}

	/**
	 * Returns doclets by longname which are documented and not ignored.
	 * @param {String} longname
	 * @returns {Array.<Doclet>}
	 * @private
	 */
	_getDocletsByLongname( longname ) {
		return this._data.filter( doclet => doclet.longname === longname && !doclet.ignore && !doclet.undocumented );
	}

	/**
	 * Checks if `@inheritdoc` or `@overrides` tags were used.
	 *
	 * @private
	 * @param {Array.<Doclet>} doclets
	 * @returns {Boolean}
	 */
	_explicitlyInherits( doclets ) {
		for ( const doclet of doclets ) {
			if ( typeof doclet.inheritdoc !== 'undefined' || typeof doclet.override !== 'undefined' ) {
				return true;
			}
		}

		return false;
	}
}

module.exports = StaticsAugmentor;
