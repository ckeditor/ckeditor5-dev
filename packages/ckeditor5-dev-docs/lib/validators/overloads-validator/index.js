/**
 * @license Copyright (c) 2003-2022, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const path = require( 'path' );
const { ReflectionKind } = require( 'typedoc' );

/**
 * Validates the CKEditor 5 documentation.
 *
 * @param {Object} project Generated output from TypeDoc to validate.
 * @param {Function} onError Called if validation error is detected.
 *
 * @returns {Boolean}
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

			const sourceIndex = reflection.signatures.indexOf( signature );
			const source = reflection.sources[ sourceIndex ];
			const filePath = path.relative( project.name, source.fileName ) + ':' + source.line;
			const message = `Missing "@label" tag for overloaded signature (${ filePath }).`;

			onError( message );
		}
	}
};
