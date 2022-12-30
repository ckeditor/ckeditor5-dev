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
 *
 * @returns {Boolean}
 */
module.exports = function validate( project, onError ) {
	const reflections = project.getReflectionsByKind( ReflectionKind.All ).filter( hasSeeTag );

	for ( const reflection of reflections ) {
		const links = reflection.comment.getTags( '@see' )
			.flatMap( tag => {
				return tag.content
					.map( item => item.text.trim() )
					// To remove list markers.
					.filter( text => text.length > 1 );
			} );

		for ( const link of links ) {
			if ( isAbsoluteLink( link ) ) {
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

				if ( !targetReflection ) {
					// Call `onError()`, because the relative link is invalid.
				}
			} else {
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

				if ( !targetReflection ) {
					// Call `onError()`, because the relative link is invalid.
				}
			}
		}
	}
};

// function getSeeLinks( reflection ) {
// 	const absoluteLinks = [];
// 	const relativeLinks = [];

// 	const tags = reflection.comment.getTags( '@see' );

// 	for ( const tag of tags ) {
// 		absoluteLinks.push( tag.content.filter( item => item.kind === 'text' && item.startsWith( 'module:' ) ) );
// 	}
// }

function hasSeeTag( reflection ) {
	return Boolean( reflection.comment && reflection.comment.getTag( '@see' ) );
}

function getLongName( reflection ) {
	let longName = '';

	while ( reflection ) {
		const longNamePart = getLongNamePart( reflection );

		if ( !longName.startsWith( longNamePart ) ) {
			longName = longNamePart + longName;
		}

		reflection = reflection.kindString === 'Module' ? null : reflection.parent;
	}

	return longName;
}

function getLongNamePart( reflection ) {
	let separator;

	switch ( reflection.kindString ) {
		case 'Module':
			separator = 'module:';
			break;

		case 'Class':
		case 'Function':
		case 'Interface':
		case 'Type alias':
			separator = '~';
			break;

		case 'Event':
			separator = '#event:';
			break;

		default:
			separator = reflection.flags && reflection.flags.isStatic ? '.' : '#';
			break;
	}

	return `${ separator }${ reflection.name }`;
}

function isAbsoluteLink( link ) {
	return link.startsWith( 'module:' );
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
