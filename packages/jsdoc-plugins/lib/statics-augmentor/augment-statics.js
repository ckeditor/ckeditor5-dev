/**
 * @license Copyright (c) 2017, CKSource - Frederico Knabben. All rights reserved.
 * Licensed under the terms of the MIT License (see LICENSE.md).
 */

'use strict';

/**
 * Manually adds doclets for inherited static members.
 * JSDoc doesn't support inheritance of static members which is why a plugin is needed.
 * This function mutates input param.
 *
 * @param {Array.<Doclet>} doclets
 */
function augmentStatics( doclets ) {
	const childClasses = getDescendants( doclets );

	for ( const child of childClasses ) {
		const parents = child.augments;

		for ( const parent of parents ) {
			const staticMembers = getStaticMembers( doclets, parent );

			for ( const member of staticMembers ) {
				handleStaticMember( doclets, member, child );
			}
		}
	}
}

/**
 * Finds doclets of child classes which need to have inherited static members added.
 * These have to be of kind `class` or `interface` and have a non empty `augments` array.
 *
 * @private
 * @param {Array.<Doclet>} doclets
 * @returns {Array.<Doclet>}
 */
function getDescendants( doclets ) {
	return doclets.filter( doclet => {
		return Array.isArray( doclet.augments ) &&
			doclet.augments.length > 0 &&
			( doclet.kind === 'class' || doclet.kind === 'interface' );
	} );
}

/**
 * Gets all static members of a doclet.
 *
 * @private
 * @param {Array.<Doclet>} doclets
 * @param {String} longname
 * @returns {Array.<Doclet>}
 */
function getStaticMembers( doclets, longname ) {
	return doclets.filter( doclet => {
		return doclet.memberof === longname && doclet.scope === 'static';
	} );
}

/**
 * @private
 * @param {Array.<Doclet>} doclets
 * @param {Doclet} member
 * @param {Doclet} childClass
 */
function handleStaticMember( doclets, member, childClass ) {
	if ( member.undocumented || member.ignore ) {
		return;
	}

	// Deep clone member.
	const clone = JSON.parse( JSON.stringify( member ) );

	addNewDoclet( doclets, clone, member, childClass );
}

/**
 * Modifies and adds new doclet to array of doclets. Makes existing doclets ignored if needed.
 *
 * @private
 * @param {Array.<Doclet>} doclets Existing doclets.
 * @param {Doclet} doclet New doclet which will be added to doclets array.
 * @param {Doclet} original Doclet from which new doclet is created.
 * @param {Doclet} childClass Doclet of a child class.
 */
function addNewDoclet( doclets, doclet, original, childClass ) {
	if ( !doclet.inherited ) {
		doclet.inherits = doclet.longname;
	}
	doclet.inherited = true;

	doclet.memberof = childClass.longname;

	// Static members are separated by a dot.
	const parts = doclet.longname.split( '.' );
	parts[ 0 ] = childClass.longname;
	doclet.longname = parts.join( '.' );

	if ( getDocletsByLongname( doclets, doclet.longname ).length > 0 ) {
		doclet.overrides = original.longname;
	} else {
		delete doclet.overrides;
	}

	const docletsWithSameLongname = getDocletsByLongname( doclets, doclet.longname );

	if ( docletsWithSameLongname.length === 0 ) {
		// If there was no doclet for that member, simply add it to existing doclets.
		doclets.push( doclet );
	} else if ( checkExplicitlyInherits( docletsWithSameLongname ) ) {
		// If doclet for that member already existed and used `inheritdoc` or`overrides`.
		// Add `ignore` property to existing doclets.
		docletsWithSameLongname.forEach( d => {
			d.ignore = true;
		} );

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
		doclets.push( doclet );
	} else {
		// If doclet for that member already existed and didnt use `inheritdoc` or `overrides`.
		// Then don't do anything except adding `overrides` property.
		docletsWithSameLongname.forEach( d => {
			d.overrides = original.longname;
		} );
	}
}

/**
 * Returns doclets by longname which are documented and not ignored.
 *
 * @private
 * @param {Array.<Doclet>} doclets
 * @param {String} longname
 * @returns {Array.<Doclet>}
 */
function getDocletsByLongname( doclets, longname ) {
	return doclets.filter( doclet => {
		return doclet.longname === longname && !doclet.ignore && !doclet.undocumented;
	} );
}

/**
 * Checks if `@inheritdoc` or `@overrides` tags were used.
 *
 * @private
 * @param {Array.<Doclet>} doclets
 * @returns {Boolean}
 */
function checkExplicitlyInherits( doclets ) {
	for ( const doclet of doclets ) {
		if ( typeof doclet.inheritdoc !== 'undefined' || typeof doclet.override !== 'undefined' ) {
			return true;
		}
	}

	return false;
}

module.exports = augmentStatics;
