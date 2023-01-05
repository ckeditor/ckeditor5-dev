/**
 * @license Copyright (c) 2003-2022, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const path = require( 'path' );

/**
 * Common utils for TypeDoc validators.
 */
module.exports = {
	isReflectionValid,
	isIdentifierValid,
	isAbsoluteIdentifier,
	getSource
};

/**
 * Checks if the reflection can be considered as "valid" (supported). Only reflections that are not nested inside a type are supported.
 *
 * @param {require('typedoc').Reflection} reflection The reflection to check if it is valid.
 * @returns {Boolean}
 */
function isReflectionValid( reflection ) {
	if ( reflection.name === '__type' ) {
		return false;
	}

	if ( reflection.parent ) {
		return isReflectionValid( reflection.parent );
	}

	return true;
}

/**
 * Checks if the name (identifier) that is provided for a tag, points to an existing reflection in the whole project.
 * The identifier can be either a relative or an absolute one.
 *
 * @param {require('typedoc').Reflection} reflection The reflection that contain given identifier.
 * @param {String} identifier An identifier to check.
 * @returns {Boolean}
 */
function isIdentifierValid( reflection, identifier ) {
	const absoluteIdentifier = isAbsoluteIdentifier( identifier ) ?
		identifier :
		toAbsoluteIdentifier( reflection, identifier );

	return Boolean( getTarget( reflection.project, absoluteIdentifier ) );
}

/**
 * Checks if the identifier is an absolute one.
 *
 * @param {String} identifier An identifier to check.
 * @returns {Boolean}
 */
function isAbsoluteIdentifier( identifier ) {
	return identifier.startsWith( 'module:' );
}

/**
 * Converts a relative identifier into an absolute one.
 *
 * @param {require('typedoc').Reflection} reflection The reflection that contain given identifier.
 * @param {String} identifier An identifier to convert.
 * @returns {String}
 */
function toAbsoluteIdentifier( reflection, identifier ) {
	const separator = identifier[ 0 ];
	const longName = getLongName( reflection );
	const [ part ] = longName.split( separator );

	return part + identifier;
}

/**
 * Returns a longname for given reflection by traversing up the hierarchy until the module is reached.
 *
 * @param {require('typedoc').Reflection} reflection A reflection for which we want to get its longname.
 * @returns {String}
 */
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

/**
 * Returns a longname fragment: the separator based on the reflection's kind followed by the reflection name.
 *
 * @param {require('typedoc').Reflection} reflection A reflection for which we want to get its longname.
 * @returns {String}
 */
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

/**
 * Returns the path to the reflection source, where it is located. Returned path contains the line number. The path is relative to the
 * project root.
 *
 * Not all reflections have the `sources` property, so this function takes this into account as well and gets the source from its parent.
 *
 * @param {require('typedoc').Reflection} reflection A reflection for which we want to get its longname.
 * @returns {String}
 */
function getSource( reflection ) {
	if ( reflection.sources ) {
		const source = reflection.sources[ 0 ];

		return path.relative( reflection.project.name, source.fileName ) + ':' + source.line;
	}

	return getSource( reflection.parent );
}

/**
 * Returns the target reflection located by the identifier. Returns `null` if target is not found.
 *
 * @param {require('typedoc').ProjectReflection} project The project refletion.
 * @param {String} identifier The absolute identifier to locate the target reflection.
 * @returns {require('typedoc').Reflection|null}
 */
function getTarget( project, identifier ) {
	const parts = identifier
		// Remove leading "module:" prefix from the doclet longname.
		.substring( 'module:'.length )
		// Then, split the rest of the longname into separate parts.
		.split( /#event:|#|~|\./ );

	const targetReflection = project.getChildByName( parts ) || null;

	if ( targetReflection ) {
		const isIdentifierStatic = identifier.includes( '.' );
		const isTargetReflectionStatic = Boolean( targetReflection.flags && targetReflection.flags.isStatic );

		// The static/non-static reflection flag does not match the separator used in the identifier.
		if ( isIdentifierStatic !== isTargetReflectionStatic ) {
			return null;
		}

		const isIdentifierEvent = identifier.includes( '#event:' );
		const isTargetReflectionEvent = targetReflection.kindString === 'Event';

		// Identifier targets an event but the found target reflection is not an event.
		if ( isIdentifierEvent && !isTargetReflectionEvent ) {
			return null;
		}
	}

	return targetReflection;
}
