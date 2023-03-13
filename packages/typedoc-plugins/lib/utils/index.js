/**
 * @license Copyright (c) 2003-2023, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

/**
 * Common utils for TypeDoc validators.
 */
module.exports = {
	isReflectionValid,
	isIdentifierValid,
	isAbsoluteIdentifier,
	getTarget,
	getNode
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
	// We don't want to validate inherited identifiers, because they should be checked only once in the base class.
	// Inherited reflections could contain identifiers (links) that are valid only in the base class and not in the derived class.
	if ( reflection.inheritedFrom ) {
		return true;
	}

	return !!getTarget( reflection, identifier );
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
	const parts = getLongNameParts( reflection );

	return separator === '~' ?
		'module:' + parts[ 0 ] + identifier :
		'module:' + parts[ 0 ] + '~' + parts[ 1 ] + identifier;
}

/**
 * Returns a longname for a reflection, divided into separate parts.
 *
 * @param {require('typedoc').Reflection} reflection A reflection for which we want to get its longname.
 * @returns {Array.<String>}
 */
function getLongNameParts( reflection ) {
	// Kinds of reflection that affect the longname format.
	const kinds = [
		'Module',
		'Class',
		'Function',
		'Interface',
		'Type alias',
		'Accessor',
		'Variable',
		'Method',
		'Property',
		'Event'
	];

	const parts = [];

	while ( reflection ) {
		if ( kinds.includes( reflection.kindString ) ) {
			parts.unshift( reflection.name );
		}

		reflection = reflection.parent;
	}

	return parts;
}

/**
 * Returns the TypeScript node from the reflection.
 *
 * @param {require('typedoc').Reflection} reflection A reflection for which we want to get its TypeScript node.
 * @returns {Object|null}
 */
function getNode( reflection ) {
	let symbol = reflection.project.getSymbolFromReflection( reflection );
	let declarationIndex = 0;

	if ( !symbol ) {
		// The TypeDoc project does not store symbols for signatures. To get the TypeScript node from a signature, we need to get the
		// symbol from its parent, which contains all nodes for each signature.
		symbol = reflection.project.getSymbolFromReflection( reflection.parent );
		declarationIndex = reflection.parent.signatures ? reflection.parent.signatures.indexOf( reflection ) : 0;
	}

	// Not a ES6 module.
	if ( !symbol ) {
		return null;
	}

	return symbol.declarations[ declarationIndex ];
}

/**
 * Checks if the provided identifier targets an existing reflection within the whole project and returns found reflection.
 * If the target is not found, returns null.
 *
 * @param {require('typedoc').Reflection} reflection The reflection that contain given identifier.
 * @param {String} identifier The identifier to locate the target reflection.
 * @returns {require('typedoc').Reflection|null}
 */
function getTarget( reflection, identifier ) {
	if ( !identifier ) {
		return null;
	}

	const absoluteIdentifier = isAbsoluteIdentifier( identifier ) ?
		identifier :
		toAbsoluteIdentifier( reflection, identifier );

	const parts = absoluteIdentifier
		// Remove leading "module:" prefix from the doclet longname.
		.substring( 'module:'.length )
		// Then, split the rest of the longname into separate parts.
		.split( /#|~|\./ );

	// The last part of the longname may contain a colon, which can be either a part of the event name, or it indicates that the name
	// targets a labeled signature.
	const lastPart = parts.pop();
	const [ lastPartName, lastPartLabel ] = lastPart.split( ':' );

	const isIdentifierEvent = lastPart.startsWith( 'event:' );
	const isIdentifierLabeledSignature = !isIdentifierEvent && lastPart.includes( ':' );

	if ( isIdentifierLabeledSignature ) {
		// If the identifier is a labeled signature, just use the method/function name and the labeled signature will be searched later.
		parts.push( lastPartName );
	} else {
		// Otherwise, restore the original identifier part.
		parts.push( lastPart );
	}

	const targetReflection = reflection.project.getChildByName( parts );

	if ( !targetReflection ) {
		return null;
	}

	// Now, when the target reflection is found, do some checks whether it matches the identifier.
	// (1) Check if the labeled signature targets an existing signature.
	if ( isIdentifierLabeledSignature ) {
		if ( !targetReflection.signatures ) {
			return null;
		}

		const targetSignature = targetReflection.signatures.find( signature => {
			if ( !signature.comment ) {
				return false;
			}

			const labelTag = signature.comment.getTag( '@label' );

			if ( !labelTag ) {
				return false;
			}

			return labelTag.content[ 0 ].text === lastPartLabel;
		} );

		return targetSignature || null;
	}

	const isIdentifierStatic = absoluteIdentifier.includes( '.' );
	const isTargetReflectionStatic = Boolean( targetReflection.flags && targetReflection.flags.isStatic );

	// (2) Check if the static/non-static reflection flag matches the separator used in the identifier.
	if ( isIdentifierStatic !== isTargetReflectionStatic ) {
		return null;
	}

	return targetReflection;
}
