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
 * It checks if the event in the "@fires" tag exists.
 *
 * @param {Object} project Generated output from TypeDoc to validate.
 * @param {Function} onError A callback that is executed when a validation error is detected.
 */
module.exports = function validate( project, onError ) {
	const reflections = project
		.getReflectionsByKind( ReflectionKind.Class | ReflectionKind.CallSignature )
		.filter( utils.isReflectionValid );

	for ( const reflection of reflections ) {
		const identifiers = getIdentifiersFromFiresTag( reflection );

		if ( !identifiers.length ) {
			continue;
		}

		for ( const identifier of identifiers ) {
			const isValid = utils.isIdentifierValid( reflection, identifier );

			if ( !isValid ) {
				const eventName = identifier.replace( /^#event:/, '' );

				onError( `Incorrect event name: "${ eventName }" in the @fires tag`, reflection );
			}
		}
	}
};

function getIdentifiersFromFiresTag( reflection ) {
	if ( !reflection.comment ) {
		return [];
	}

	return reflection.comment.getTags( '@fires' )
		.flatMap( tag => tag.content.map( item => item.text.trim() ) )
		.map( identifier => {
			if ( utils.isAbsoluteIdentifier( identifier ) ) {
				return identifier;
			}

			return '#event:' + identifier;
		} );
}
