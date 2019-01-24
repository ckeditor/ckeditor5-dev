/**
 * @license Copyright (c) 2003-2019, CKSource - Frederico Knabben. All rights reserved.
 * Licensed under the terms of the MIT License (see LICENSE.md).
 */

'use strict';

const compose = require( '../../utils/compose-functions' );
const assign = Object.assign;

// TODO - add class / interface range restrictions

/**
 * @param {Options} options
 * @returns {Options}
 */
function fixShortRefs( options ) {
	const { doclet, lastInterfaceOrClass } = options;

	if ( doclet.kind === 'interface' || doclet.kind === 'class' || doclet.kind === 'mixin' ) {
		options = assign( {}, options, { lastInterfaceOrClass: doclet } );

		return fixShortRefsInFireTag( options );
	}

	if (
		!lastInterfaceOrClass ||
		doclet.meta.path !== lastInterfaceOrClass.meta.path ||
		doclet.meta.filename !== lastInterfaceOrClass.meta.filename
	) {
		return options;
	}

	return compose(
		fixShortRefsInLongnameAndMemeberof,
		fixShortRefsInFireTag,
		fixShortRefsInSeeTag
	)( options );
}

/**
 * @param {Options} options
 * @returns {Options}
 */
function fixShortRefsInLongnameAndMemeberof( options ) {
	let doclet = options.doclet;
	const lastInterfaceOrClass = options.lastInterfaceOrClass;
	const firstNameChar = doclet.longname[ 0 ];

	if ( firstNameChar === '~' ) {
		doclet = assign( {}, doclet, {
			memberof: lastInterfaceOrClass.memberof + '~' + lastInterfaceOrClass.name,
			longname: lastInterfaceOrClass.memberof + doclet.longname,
		} );
	} else if ( firstNameChar === '#' ) {
		doclet = assign( {}, doclet, {
			memberof: lastInterfaceOrClass.longname,
			longname: lastInterfaceOrClass.longname + doclet.longname,
		} );
	}

	// Fixes longname in events containing ':' in their names (e.g. change:attribute)
	if ( doclet.kind === 'event' && !doclet.name.includes( 'event' ) && doclet.longname.includes( 'module:' ) ) {
		doclet = assign( {}, doclet, {
			memberof: lastInterfaceOrClass.longname,
			longname: lastInterfaceOrClass.longname + '#event:' + doclet.name,
		} );
	} else if ( doclet.kind === 'event' && !doclet.longname.includes( 'module:' ) ) {
		doclet = assign( {}, doclet, {
			memberof: lastInterfaceOrClass.longname,
			longname: lastInterfaceOrClass.longname + '#' + doclet.longname,
		} );
	}

	return assign( {}, options, { doclet } );
}

/**
 * @param {Options} options
 * @returns {Options}
 */
function fixShortRefsInFireTag( options ) {
	let { doclet } = options;

	if ( !doclet.fires ) {
		return options;
	}

	const fires = doclet.fires.map( event => {
		if ( event.includes( 'module:' ) ) {
			return event;
		}

		if ( !event.includes( 'event:' ) ) {
			event = 'event:' + event;
		}

		if ( doclet.memberof.includes( '~' ) ) {
			return doclet.memberof + '#' + event;
		}

		return doclet.longname + '#' + event;
	} );

	doclet = assign( {}, doclet, { fires } );

	return assign( {}, options, { doclet } );
}

/**
 * @param {Options} options
 * @returns {Options}
 */
function fixShortRefsInSeeTag( options ) {
	let doclet = options.doclet;
	const lastInterfaceOrClass = options.lastInterfaceOrClass;

	if ( !doclet.see ) {
		return options;
	}

	const see = doclet.see.map( see => {
		if ( see[ 0 ] === '#' ) {
			return lastInterfaceOrClass.longname + see;
		}

		if ( see[ 0 ] === '~' ) {
			return lastInterfaceOrClass.memberof + see;
		}

		return see;
	} );

	doclet = assign( {}, doclet, { see } );

	return assign( {}, options, { doclet } );
}

/**
 * typedef {Object} Options
 * @property {Doclet} doclet;
 * @property {Doclet} lastInterfaceOrClass.
 */

/**
 * typedef {Object} Doclet
 * @property {String} type
 */

module.exports = fixShortRefs;
