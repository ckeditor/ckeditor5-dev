/**
 * @license Copyright (c) 2003-2022, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

/**
 */
module.exports = {
	isReflectionValid,
	isLinkValid,
	isAbsoluteLink,
	getSource
};

function isReflectionValid( reflection ) {
	if ( reflection.name === '__type' ) {
		return false;
	}

	if ( reflection.parent ) {
		return isReflectionValid( reflection.parent );
	}

	return true;
}

function isLinkValid( project, reflection, link ) {
	const absoluteLink = isAbsoluteLink( link ) ?
		link :
		toAbsoluteLink( reflection, link );

	return Boolean( getTarget( project, absoluteLink ) );
}

function isAbsoluteLink( link ) {
	return link.startsWith( 'module:' );
}

function toAbsoluteLink( reflection, link ) {
	const separator = link[ 0 ];
	const longName = getLongName( reflection );
	const [ part ] = longName.split( separator );

	return part + link;
}

function getLongName( reflection ) {
	let longName = '';

	while ( reflection ) {
		longName = getLongNamePart( reflection ) + longName;

		reflection = reflection.kindString === 'Module' ?
			null :
			reflection.parent;
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

	return separator + reflection.name;
}

function getSource( reflection ) {
	return reflection.sources ?
		reflection.sources[ 0 ] :
		getSource( reflection.parent );
}

function getTarget( project, link ) {
	const parts = link
		// Remove leading "module:" prefix from the doclet longname.
		.substring( 'module:'.length )
		// Then, split the rest of the longname into separate parts.
		.split( /#event:|#|~|\./ );

	const targetReflection = project.getChildByName( parts ) || null;

	if ( targetReflection ) {
		const isLinkToStatic = link.includes( '.' );
		const isTargetReflectionStatic = Boolean( targetReflection.flags && targetReflection.flags.isStatic );

		if ( isLinkToStatic !== isTargetReflectionStatic ) {
			return null;
		}

		const isLinkToEvent = link.includes( '#event:' );
		const isTargetReflectionEvent = targetReflection.kindString === 'Event';

		if ( isLinkToEvent && !isTargetReflectionEvent ) {
			return null;
		}
	}

	return targetReflection;
}
