/**
 * @license Copyright (c) 2016-2017, CKSource - Frederico Knabben. All rights reserved.
 * Licensed under the terms of the MIT License (see LICENSE.md).
 */

'use strict';

/* eslint-disable max-len */
/**
 * Fixes:
 * module:utils/ckeditorerror~CKEditorError.CKEditorError to module:utils/ckeditorerror~CKEditorError#constructor
 * module:utils/ckeditorerror~CKEditorError.CKEditorError#someMethod to module:utils/ckeditorerror~CKEditorError#someMethod
 *
 * @param {Options} options
 * @returns {Options}
 */
/* eslint-enable max-len */
function fixIncorrectClassConstructor( object ) {
	let { doclet } = object;

	const match = doclet.longname.match( /~([\w]+)\.([\w]+)/ );

	if ( !match || match[1] !== match[2] ) {
		return object;
	}

	if ( doclet.kind === 'class' ) {
		doclet = Object.assign( {}, doclet, {
			longname: doclet.longname.replace( '.' + match[1], '#constructor' ),
			memberof: doclet.memberof.replace( '.' + match[1], '' ),
			kind: 'function',
			scope: 'instance',
			name: 'constructor',
		} );
	} else {
		doclet = Object.assign( {}, doclet, {
			longname: doclet.longname.replace( '.' + match[1], '' ),
			memberof: doclet.memberof.replace( '.' + match[1], '' ),
		} );
	}

	return Object.assign( {}, object, { doclet } );
}

module.exports = fixIncorrectClassConstructor;
