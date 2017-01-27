/**
 * @license Copyright (c) 2003-2017, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

/**
 * @param {String} content
 * @param {String} fnName Name of the function that will be added to RegExp match.
 * @param {Function} callback Callback that will be firing on the first fn parameter of each match.
 */
module.exports = function replaceFirstFunctionParameter( content, fnName, callback ) {
	return content.replace( new RegExp( ` ${ fnName }\\([^)]+\\)`, 'gm' ), ( fullCall ) => {
		const match = fullCall.match( /'([^']+)'/ );
		const firstParameter = match[ 1 ];
		const firstParameterIndex = fullCall.indexOf( firstParameter );
		const restFunctionParameters = fullCall.slice( firstParameterIndex + firstParameter.length + 1 );

		return ` ${ fnName }( '${ callback( firstParameter ) }'${ restFunctionParameters }`;
	} );
};
