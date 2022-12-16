/**
 * @license Copyright (c) 2003-2022, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const { Converter, ReflectionKind, ReferenceReflection } = require( 'typedoc' );

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
		// A name of the main module exported by package.
		const moduleName = reflection.parent.name.split( '/' ).shift();

		// An interface reflection from which we want to copy children.
		const interfaceToCopy = context.project.getChildByName( [ moduleName, reflection.name ] );

		// A reflection does not exist.
		if ( !interfaceToCopy ) {
			continue;
		}

		// An interface does not contain children. Hence, there is nothing to copy.
		if ( !interfaceToCopy.children ) {
			continue;
		}

		// Copy properties from an extended interface exported via the main package `index.ts` (module augmentation).
		reflection.children = interfaceToCopy.children.slice();
		reflection.groups = interfaceToCopy.groups.slice();

		// We do not want to have the same interface defined twice.
		// The goal is to have a reference as a child in the main module.
		// `ReferenceReflection#constructor()` is an internal API. We should find a proper way to create such objects.
		const newRef = new ReferenceReflection( interfaceToCopy.name, reflection, interfaceToCopy.parent );

		newRef.kindString = 'Reference';
		newRef.sources = interfaceToCopy.sources;

		context.project.removeReflection( interfaceToCopy );
		context.withScope( newRef.parent ).addChild( newRef );
	}
}
