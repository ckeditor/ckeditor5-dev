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
		// E.g. "core"
		const packageIndexName = reflection.parent.name.split( '/' ).shift();

		// E.g "core" + "CommandsMap"
		const packageIndexModule = context.project.getChildByName( [ packageIndexName, reflection.name ] );

		if ( !packageIndexModule ) {
			continue;
		}

		if ( !packageIndexModule.children ) {
			continue;
		}

		reflection.children = packageIndexModule.children.slice();
		reflection.groups = packageIndexModule.groups.slice();

		// The goal is to add a new reference as a child in the re-export main module.
		const newRef = new ReferenceReflection( packageIndexModule.name, reflection, packageIndexModule.parent );

		// context.postReflectionCreation( newRef );
		// context.project.removeReflection( packageIndexModule );

		// const propertyReflection = context
		// 	.withScope( packageIndexModule.parent )
		// 	.createDeclarationReflection(
		// 		ReflectionKind.Reference,
		// 		undefined,
		// 		undefined,
		// 		packageIndexModule.name
		// 	);
		// propertyReflection._target = reflection;

		// context.addChild( newRef );
	}
}
