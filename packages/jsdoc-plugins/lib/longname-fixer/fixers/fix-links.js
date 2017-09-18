/**
 * @license Copyright (c) 2016-2017, CKSource - Frederico Knabben. All rights reserved.
 * Licensed under the terms of the MIT License (see LICENSE.md).
 */

'use strict';

module.exports = function fixLinks( config ) {
	const originalDoclet = config.doclet;

	let doclet = originalDoclet;

	// Errors have their own module 'module/errors'.
	// Shortened links in error descriptions should link to the class items, not the error module.
	if ( originalDoclet.kind === 'error' ) {
		doclet = config.lastInterfaceOrClass;
	}

	const linkRegExp = /{@link *([~#][^}]+)}/g;
	const replacer = ( fullLink, linkContent ) => {
		const [ ref, ...linkDescription ] = linkContent.split( ' ' );
		const [ className, methodName ] = ref.split( '#' );

		let result = '{@link ' + doclet.memberof;

		if ( !doclet.memberof.includes( className ) ) {
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

	const updatedDoclet = Object.assign( {}, originalDoclet, { comment, description } );

	return Object.assign( {}, config, { doclet: updatedDoclet } );
};
