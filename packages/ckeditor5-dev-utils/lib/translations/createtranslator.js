/**
 * @license Copyright (c) 2003-2017, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

/**
 * @param {Map<String>} allTranslations
 * @returns {Function}
 */
module.exports = function createTranslator( allTranslations ) {
	return function translate( englishString ) {
		let translation = allTranslations.get( englishString );

		if ( !translation ) {
			console.error( new Error( `Missing translation for: ${ englishString }` ) );
			translation = englishString;
		}

		return translation;
	};
};
