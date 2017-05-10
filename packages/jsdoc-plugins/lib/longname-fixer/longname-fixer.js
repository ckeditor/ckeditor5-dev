/**
 * @license Copyright (c) 2016-2017, CKSource - Frederico Knabben. All rights reserved.
 * Licensed under the terms of the MIT License (see LICENSE.md).
 */

/**
 * @see http://usejsdoc.org/about-plugins.html
 */

'use strict';

const fixLinks = require( './fixers/fix-links' );
const fixShortRefs = require( './fixers/fix-short-refs' );
const fixIncorrectClassLongname = require( './fixers/fix-incorrect-class-longname' );
const composeFunctions = require( '../utils/compose-functions' );

const setNewDoclet = doclet => {
	return config => {
		return Object.assign( {}, config, { doclet } );
	};
};

const docletHandler = ( () => {
	let config = {};

	return function( e ) {
		config = composeFunctions(
			setNewDoclet( e.doclet ),
			fixIncorrectClassLongname,
			fixShortRefs,
			fixLinks
		)( config );

		e.doclet = config.doclet;
	};
} )();

exports.handlers = {
	newDoclet: docletHandler,
};
