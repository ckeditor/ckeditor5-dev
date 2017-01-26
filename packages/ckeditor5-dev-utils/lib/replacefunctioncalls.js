/**
 * @license Copyright (c) 2003-2017, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

/**
 * @param {String} content
 * @param {String} fnName Name of the function that will be matched.
 * @param {Function} callback Callback that will be firing on the parameter of the matched fn .
 */
module.exports = function replaceFunctionCalls( content, fnName, callback ) {
	return content.replace( new RegExp( ` ${ fnName }\\([^)]+`, 'gm' ), ( fullCall ) => {
		const parameters = fullCall.match( /'([^']+)/ )[ 1 ];

		return callback( parameters );
	} );
};
