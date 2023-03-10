/**
 * @license Copyright (c) 2003-2023, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const { ReflectionKind } = require( 'typedoc' );
const { utils } = require( '@ckeditor/typedoc-plugins' );

/**
 * Validates the output produced by TypeDoc.
 *
 * It checks if the identifier in the "@link" tag points to an existing doclet.
 *
 * @param {Object} project Generated output from TypeDoc to validate.
 * @param {Function} onError A callback that is executed when a validation error is detected.
 */
module.exports = function validate( project, onError ) {
	const reflections = project.getReflectionsByKind( ReflectionKind.All ).filter( utils.isReflectionValid );

	for ( const reflection of reflections ) {
		const identifiers = getIdentifiersFromLinkTag( reflection );

		if ( !identifiers.length ) {
			continue;
		}

		for ( const identifier of identifiers ) {
			const isValid = utils.isIdentifierValid( reflection, identifier );

			if ( !isValid ) {
				onError( `Incorrect link: "${ identifier }"`, reflection );
			}
		}
	}
};

function getIdentifiersFromLinkTag( reflection ) {
	if ( !reflection.comment ) {
		return [];
	}

	// The "@link" tag can be located in the comment summary or it can be nested in other block tags.
	const parts = [
		...reflection.comment.summary,
		...reflection.comment.blockTags.flatMap( tag => tag.content )
	];

	return parts
		.filter( part => part.kind === 'inline-tag' && part.tag === '@link' )
		.map( part => {
			// The "@link" tag may contain the actual identifier and the display name after a space.
			// Split by space to extract only the identifier from the whole tag.
			const [ identifier ] = part.text.split( ' ' );

			return identifier;
		} );
}
