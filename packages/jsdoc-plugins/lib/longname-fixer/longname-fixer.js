/**
 * @license Copyright (c) 2003-2021, CKSource - Frederico Knabben. All rights reserved.
 * Licensed under the terms of the MIT License (see LICENSE.md).
 */

/**
 * @see http://usejsdoc.org/about-plugins.html
 */

'use strict';

const convertShortRefsToFullRefs = require( './fixers/convert-short-refs-to-full-refs' );
const fixIncorrectClassConstructor = require( './fixers/fix-incorrect-class-constructor' );

const modulePattern = /module:[\w-]+(\/[\w-]+)*$/;

exports.handlers = {
	parseComplete: e => {
		const doclets = e.doclets;

		fixIncorrectClassConstructor( doclets );
		convertShortRefsToFullRefs( doclets );

		// Fix exported functions.
		// All exported functions should be marked as module's `inner`.
		for ( const doclet of doclets ) {
			if ( doclet.kind === 'function' && doclet.scope === 'static' && modulePattern.test( doclet.memberof ) ) {
				doclet.scope = 'inner';
				doclet.longname = doclet.longname.replace( /\./, '~' );
			}

			if ( doclet.kind === 'constant' && doclet.scope === 'static' && modulePattern.test( doclet.memberof ) ) {
				doclet.scope = 'inner';
				doclet.longname = doclet.longname.replace( /\./, '~' );
			}
		}

		// Filter out incorrect doclets.
		e.doclets = doclets.filter( doclet => !doclet.ignore );
	}
};
