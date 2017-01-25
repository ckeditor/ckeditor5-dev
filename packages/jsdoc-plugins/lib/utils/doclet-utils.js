/**
 * @license Copyright (c) 2016-2017, CKSource - Frederico Knabben. All rights reserved.
 * Licensed under the terms of the MIT License (see LICENSE.md).
 */

'use strict';

/**
 * @param {Array.<Object>} doclets
 * @param {String} methodLongname
 * @returns {Bolean}
 */
function doesFieldExistInClass( doclets, methodLongname ) {
	const [ className, methodName ] = methodLongname.split( '#' );
	let currentClass = doclets.find( doclet => doclet.longname === className );

	while ( true ) {
		if ( !currentClass ) {
			return false;
		}

		if ( doclets.find( doclet => doclet.longname === currentClass.longname + '#' + methodName ) ) {
			return true;
		}

		if ( !currentClass.augments ) {
			return false;
		}

		currentClass = doclets.find( doclet => doclet.longname === currentClass.augments[0] );
	}
}

module.exports = {
	doesFieldExistInClass,
};
