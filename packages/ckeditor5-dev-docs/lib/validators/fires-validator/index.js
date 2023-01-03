/**
 * @license Copyright (c) 2003-2022, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const { ReflectionKind } = require( 'typedoc' );
const { getSource, isReflectionValid, isLinkValid, isAbsoluteLink } = require( '../utils' );

/**
 * Validates the CKEditor 5 documentation.
 *
 * @param {Object} project Generated output from TypeDoc to validate.
 * @param {Function} onError Called if validation error is detected.
 */
module.exports = function validate( project, onError ) {
	const reflections = project.getReflectionsByKind( ReflectionKind.Class | ReflectionKind.Method ).filter( isReflectionValid );

	for ( const reflection of reflections ) {
		const events = getFiredEvents( reflection );

		if ( !events.length ) {
			continue;
		}

		for ( const event of events ) {
			const isValid = isLinkValid( project, reflection, event );

			if ( !isValid ) {
				onError( `Event "${ event }" is not found`, getSource( reflection ) );
			}
		}
	}
};

function getFiredEvents( reflection ) {
	if ( !reflection.comment ) {
		return [];
	}

	return reflection.comment.getTags( '@fires' )
		.flatMap( tag => tag.content.map( item => item.text.trim() ) )
		.map( event => isAbsoluteLink( event ) ? event : '#event:' + event );
}
