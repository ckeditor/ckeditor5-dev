/**
 * @license Copyright (c) 2003-2022, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const { Converter, ReflectionKind, ReflectionFlag, ReferenceType } = require( 'typedoc' );

const AT_MEMBER_TAG = '@memberOf';

/**
 * TODO.
 */
module.exports = {
	load( app ) {
		app.converter.on( Converter.EVENT_END, onEventEnd );
	}
};

function onEventEnd( context ) {
	// Get all resolved reflections that could be an interface.
	const interfaceKind = ReflectionKind.Interface;
	const reflections = context.project.getReflectionsByKind( interfaceKind );

	// Then, for each potential interface reflection...
	for ( const reflection of reflections ) {
		// ...skip it, if it does not contain the `@memberOf` tag.
		if ( !reflection.comment || !reflection.comment.getTag( AT_MEMBER_TAG ) ) {
			continue;
		}

		const atMember = reflection.comment.getTag( AT_MEMBER_TAG );

		// TODO: It cannot be empty.
		if ( !atMember ) {
			// throw.
		}

		// TODO: Make sure it is not equal to `undefined` at some point.
		const [ modulePath, propertyName ] = reflection.comment.getTag( AT_MEMBER_TAG ).content[ 0 ].text.split( ' ' );

		if ( !modulePath || !propertyName ) {
			// throw.
		}

		const [ moduleName, interfaceName ] = modulePath.replace( 'module:', '' ).split( '~' );

		const interfaceReflection = context.project.getChildByName( [ moduleName, interfaceName ] );

		// TODO: Is `interfaceReflection` interface?

		const propertyReflection = context
			.withScope( interfaceReflection )
			.createDeclarationReflection(
				ReflectionKind.Property,
				undefined,
				undefined,
				propertyName
			);

		// Each property in the configuration is optional.
		propertyReflection.setFlag( ReflectionFlag.Optional, true );

		// Copy the `sources` object to generate URLs to Github.
		propertyReflection.sources = reflection.sources;

		// Create a reference reflection.
		propertyReflection.type = ReferenceType.createResolvedReference( reflection.name, reflection, context.project );

		propertyReflection.kindString = 'Property';
	}
}
