/**
 * @license Copyright (c) 2003-2020, CKSource - Frederico Knabben. All rights reserved.
 * Licensed under the terms of the MIT License (see LICENSE.md).
 */

'use strict';

module.exports = function fixLinks( config ) {
	const doclet = config.doclet;
	let memberof = config.doclet.memberof;

	// Errors have their own module 'module/errors'.
	// Shortened links in error descriptions should link to the class items, not the error module.
	if ( doclet.kind === 'error' ) {
		memberof = config.lastInterfaceOrClass.longname;
	}

	const linkRegExp = /{@link *([~#][^}]+)}/g;
	const replacer = ( fullLink, linkContent ) => {
		const [ ref, ...linkDescription ] = linkContent.split( ' ' );
		const [ className, methodName ] = ref.split( '#' );

		let result = '{@link ' + memberof;

		if ( !memberof.includes( className ) ) {
			return result + linkContent + '}';
		}

		if ( methodName ) {
			result += '#' + methodName;
		}

		result += linkDescription.map( word => ' ' + word ).join( ' ' );

		return result + '}';
	};

	const comment = doclet.comment.replace( linkRegExp, replacer );

	let description = doclet.description;

	if ( description ) {
		description = doclet.description.replace( linkRegExp, replacer );
	}

	return Object.assign( {}, config, {
		doclet: Object.assign( {}, doclet, { comment, description } )
	} );
};
