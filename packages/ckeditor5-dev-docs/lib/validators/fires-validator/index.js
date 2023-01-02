/**
 * @license Copyright (c) 2003-2022, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const { ReflectionKind } = require( 'typedoc' );

/**
 * Validates the CKEditor 5 documentation.
 *
 * @param {Object} project Generated output from TypeDoc to validate.
 * @param {Function} onError Called if validation error is detected.
 */
module.exports = function validate( project, onError ) {
	const reflections = project.getReflectionsByKind( ReflectionKind.Class | ReflectionKind.Method ).filter( hasFiresTag );

	for ( const reflection of reflections ) {
		const events = reflection.comment
			.getTags( '@fires' )
			.map( tag => tag.content[ 0 ].text );

		for ( const event of events ) {
			const result = isAbsoluteEvent( event ) ?
				isAbsoluteEventValid( project, event ) :
				isRelativeEventValid( reflection, event );

			if ( !result ) {
				onError( `Event "${ event }" is not found`, reflection.sources[ 0 ] );
			}
		}
	}
};

function hasFiresTag( reflection ) {
	return Boolean( reflection.comment && reflection.comment.getTag( '@fires' ) );
}

function isAbsoluteEvent( event ) {
	return event.startsWith( 'module:' );
}

function isAbsoluteEventValid( project, event ) {
	const parts = event
		// Remove leading "module:" prefix from the doclet longname.
		.substring( 'module:'.length )
		// Then, split the rest of the longname into separate parts.
		.split( /#event:|#|~|\./ );

	let targetReflection = project.getChildByName( parts );

	if ( targetReflection && targetReflection.kindString !== 'Event' ) {
		targetReflection = null;
	}

	return Boolean( targetReflection );
}

function isRelativeEventValid( reflection, event ) {
	const classReflection = findClassReflection( reflection );

	return classReflection.children.some( child => child.kindString === 'Event' && child.name === event );
}

function findClassReflection( reflection ) {
	if ( reflection.kindString === 'Class' ) {
		return reflection;
	}

	return findClassReflection( reflection.parent );
}
