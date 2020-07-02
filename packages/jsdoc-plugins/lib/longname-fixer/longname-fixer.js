/**
 * @license Copyright (c) 2003-2020, CKSource - Frederico Knabben. All rights reserved.
 * Licensed under the terms of the MIT License (see LICENSE.md).
 */

/**
 * @see http://usejsdoc.org/about-plugins.html
 */

'use strict';

const convertShortRefsToFullRefs = require( './fixers/convert-short-refs-to-full-refs' );
const fixIncorrectClassConstructor = require( './fixers/fix-incorrect-class-constructor' );

exports.handlers = {
	parseComplete: ( { doclets } ) => {
		fixIncorrectClassConstructor( doclets );
		convertShortRefsToFullRefs( doclets );

		// Fix exported functions.
		// All exported functions should be marked as module's `inner`.
		for ( const doclet of doclets ) {
			if ( doclet.kind === 'function' && doclet.scope === 'static' && doclet.memberof.match( /module:[a-zA-Z]+(\/[a-zA-Z]+)*$/ ) ) {
				doclet.scope = 'inner';
				doclet.longname = doclet.longname.replace( /\./, '~' );
			}
		}
	}
};
