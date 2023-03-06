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
 * It checks if the identifier in the "@see" tag points to an existing doclet.
 *
 * @param {Object} project Generated output from TypeDoc to validate.
 * @param {Function} onError A callback that is executed when a validation error is detected.
 */
module.exports = function validate( project, onError ) {
	const reflections = project.getReflectionsByKind( ReflectionKind.All ).filter( utils.isReflectionValid );

	for ( const reflection of reflections ) {
		const identifiers = getIdentifiersFromSeeTag( reflection );

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

function getIdentifiersFromSeeTag( reflection ) {
	if ( !reflection.comment ) {
		return [];
	}

	return reflection.comment.getTags( '@see' )
		.flatMap( tag => tag.content.map( item => item.text.trim() ) )
		.filter( text => {
			// Remove list markers (e.g. "-").
			if ( text.length <= 1 ) {
				return false;
			}

			// Remove external links.
			if ( /^https?:\/\//.test( text ) ) {
				return false;
			}

			return true;
		} );
}
