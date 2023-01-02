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
	const methodReflections = project.getReflectionsByKind( ReflectionKind.Method )
		.filter( reflection => reflection.parent.kindString === 'Class' );

	const functionReflections = project.getReflectionsByKind( ReflectionKind.Function )
		.filter( reflection => reflection.parent.kindString === 'Module' );

	const reflections = [ ...methodReflections, ...functionReflections ];

	for ( const reflection of reflections ) {
		if ( reflection.signatures.length === 1 ) {
			continue;
		}

		for ( const signature of reflection.signatures ) {
			if ( signature.comment && signature.comment.getTag( '@label' ) ) {
				continue;
			}

			onError( 'Missing "@label" tag for overloaded signature', signature.sources[ 0 ] );
		}
	}
};
