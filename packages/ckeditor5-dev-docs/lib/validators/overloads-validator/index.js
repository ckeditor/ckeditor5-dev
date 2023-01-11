/**
 * @license Copyright (c) 2003-2022, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const { ReflectionKind } = require( 'typedoc' );
const { getSource, isReflectionValid } = require( '../utils' );

/**
 * Validates the output produced by TypeDoc.
 *
 * It checks if overloaded methods and functions are described with the mandatory "@label" tag.
 *
 * @param {Object} project Generated output from TypeDoc to validate.
 * @param {Function} onError A callback that is executed when a validation error is detected.
 */
module.exports = function validate( project, onError ) {
	const kinds = ReflectionKind.Method | ReflectionKind.Constructor | ReflectionKind.Function;
	const reflections = project.getReflectionsByKind( kinds ).filter( isReflectionValid );

	for ( const reflection of reflections ) {
		if ( reflection.signatures.length === 1 ) {
			continue;
		}

		for ( const signature of reflection.signatures ) {
			if ( signature.comment && signature.comment.getTag( '@label' ) ) {
				continue;
			}

			onError( `[overloads validator] Missing "@label" tag for overloaded signature (${ getSource( signature ) }).` );
		}
	}
};
