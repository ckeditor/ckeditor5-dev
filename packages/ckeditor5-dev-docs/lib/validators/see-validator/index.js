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
	const reflections = project.getReflectionsByKind( ReflectionKind.All )
		.filter( isValidReflection )
		.filter( hasSeeTag );

	for ( const reflection of reflections ) {
		const links = reflection.comment.getTags( '@see' )
			.flatMap( tag => tag.content.map( item => item.text.trim() ) )
			.filter( isLink );

		for ( const link of links ) {
			const result = isAbsoluteLink( link ) ?
				isAbsoluteLinkValid( project, link ) :
				isRelativeLinkValid( reflection, link );

			if ( !result ) {
				onError( 'Target doclet for "@see" tag is not found', reflection.sources[ 0 ] );
			}
		}
	}
};

function isValidReflection( reflection ) {
	return reflection.name !== '__type';
}

function hasSeeTag( reflection ) {
	return Boolean( reflection.comment && reflection.comment.getTag( '@see' ) );
}

function isLink( text ) {
	// Remove list markers (e.g. "-").
	if ( text.length <= 1 ) {
		return false;
	}

	// Remove external links.
	if ( /^https?:\/\//.test( text ) ) {
		return false;
	}

	return true;
}

function findTargetReflection( reflection, childName, kindStrings ) {
	let found = null;

	while ( reflection ) {
		if ( kindStrings.includes( reflection.kindString ) ) {
			found = reflection.children.find( child => child.name === childName ) || null;

			break;
		}

		reflection = reflection.parent;
	}

	return found;
}

function isAbsoluteLink( link ) {
	return link.startsWith( 'module:' );
}

function isAbsoluteLinkValid( project, link ) {
	const parts = link
		// Remove leading "module:" prefix from the doclet longname.
		.substring( 'module:'.length )
		// Then, split the rest of the longname into separate parts.
		.split( /#event:|#|~|\./ );

	let targetReflection = project.getChildByName( parts );

	if ( targetReflection ) {
		const isTargetReflectionStatic = Boolean( targetReflection.flags && targetReflection.flags.isStatic );
		const isSeparatorStatic = link.includes( '.' );

		if ( isTargetReflectionStatic !== isSeparatorStatic ) {
			targetReflection = null;
		}
	}

	return Boolean( targetReflection );
}

function isRelativeLinkValid( reflection, link ) {
	const separator = link[ 0 ];
	const targetName = link.substring( 1 );

	let targetReflection = null;

	switch ( separator ) {
		case '~':
			targetReflection = findTargetReflection( reflection, targetName, [ 'Module' ] );

			break;

		case '#':
		case '.':
			targetReflection = findTargetReflection( reflection, targetName, [ 'Class', 'Function', 'Interface', 'Type alias' ] );

			if ( targetReflection ) {
				const isTargetReflectionStatic = Boolean( targetReflection.flags && targetReflection.flags.isStatic );
				const isSeparatorStatic = separator === '.';

				if ( isTargetReflectionStatic !== isSeparatorStatic ) {
					targetReflection = null;
				}
			}

			break;
	}

	return Boolean( targetReflection );
}
