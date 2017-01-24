/**
 * @license Copyright (c) 2016-2017, CKSource - Frederico Knabben. All rights reserved.
 * Licensed under the terms of the MIT License (see LICENSE.md).
 */

'use strict';

function fixLinks( config ) {
	let { doclet } = config;
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

	doclet = Object.assign( {}, doclet, { comment, description } );

	return Object.assign( {}, config, { doclet } );
}

module.exports = fixLinks;
