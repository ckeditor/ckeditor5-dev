/**
 * @license Copyright (c) 2003-2023, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const { ReflectionKind } = require( 'typedoc' );
const { utils } = require( '@ckeditor/typedoc-plugins' );

// The `@label` validator is currently not used.
// See: https://github.com/ckeditor/ckeditor5/issues/13591.

/**
 * Validates the output produced by TypeDoc.
 *
 * It checks if overloaded methods and functions are described with the mandatory "@label" tag.
 *
 * Also, it prevents using the same name twice for overloaded structures.
 *
 * @param {Object} project Generated output from TypeDoc to validate.
 * @param {Function} onError A callback that is executed when a validation error is detected.
 */
module.exports = function validate( project, onError ) {
	const kinds = ReflectionKind.Method | ReflectionKind.Constructor | ReflectionKind.Function;
	const reflections = project.getReflectionsByKind( kinds ).filter( utils.isReflectionValid );

	for ( const reflection of reflections ) {
		// Omit non-overloaded structures.
		if ( reflection.signatures.length === 1 ) {
			continue;
		}

		const uniqueValues = new Set();

		const isInherited = !!reflection.inheritedFrom;
		const errorMessageSuffix = isInherited ? ' due the inherited structure' : '';

		for ( const signature of reflection.signatures ) {
			// Check if a signature has a label...
			if ( signature.comment && signature.comment.getTag( '@label' ) ) {
				const [ { text: label } ] = signature.comment.getTag( '@label' ).content;

				// ...and whether it is a unique value.
				if ( uniqueValues.has( label ) ) {
					onError( `Duplicated name: "${ label }" in the @label tag` + errorMessageSuffix, signature );
				} else {
					uniqueValues.add( label );
				}
			} else {
				onError( 'Overloaded signature misses the @label tag' + errorMessageSuffix, signature );
			}
		}
	}
};
