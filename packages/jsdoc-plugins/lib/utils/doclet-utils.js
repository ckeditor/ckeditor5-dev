/**
 * @license Copyright (c) 2003-2020, CKSource - Frederico Knabben. All rights reserved.
 * Licensed under the terms of the MIT License (see LICENSE.md).
 */

'use strict';

/**
 * @param {Record.<String,Object>} doclets
 * @param {String} methodLongname
 * @returns {Boolean}
 */
function doesFieldExistInClass( doclets, methodLongname ) {
	const [ className, methodName ] = methodLongname.split( '#' );
	let currentClass = doclets[ className ];

	while ( true ) {
		if ( !currentClass ) {
			return false;
		}

		if ( doclets[ currentClass.longname + '#' + methodName ] ) {
			return true;
		}

		if ( !currentClass.augments ) {
			return false;
		}

		currentClass = doclets[ currentClass.augments[ 0 ] ];
	}
}

module.exports = {
	doesFieldExistInClass
};
