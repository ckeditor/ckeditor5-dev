/**
 * @license Copyright (c) 2003-2022, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const { ReflectionKind } = require( 'typedoc' );
const { getSource, isReflectionValid, isLinkValid } = require( '../utils' );

/**
 * Validates the CKEditor 5 documentation.
 *
 * @param {Object} project Generated output from TypeDoc to validate.
 * @param {Function} onError Called if validation error is detected.
 */
module.exports = function validate( project, onError ) {
	const reflections = project.getReflectionsByKind( ReflectionKind.All ).filter( isReflectionValid );

	for ( const reflection of reflections ) {
		const links = getLinks( reflection );

		if ( !links.length ) {
			continue;
		}

		for ( const link of links ) {
			const isValid = isLinkValid( project, reflection, link );

			if ( !isValid ) {
				onError( `Target doclet for "${ link }" link is not found`, getSource( reflection ) );
			}
		}
	}
};

function getLinks( reflection ) {
	if ( !reflection.comment ) {
		return [];
	}

	const parts = [
		...reflection.comment.summary,
		...reflection.comment.blockTags.flatMap( tag => tag.content )
	];

	return parts
		.filter( part => part.kind === 'inline-tag' && part.tag === '@link' )
		.map( part => {
			const [ link ] = part.text.split( ' ' );

			return link;
		} );
}
