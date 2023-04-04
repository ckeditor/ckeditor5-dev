/**
 * @license Copyright (c) 2003-2023, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const { Converter, ReflectionKind, TypeParameterReflection, Comment, TypeScript } = require( 'typedoc' );

/**
 * The `typedoc-plugin-tag-observable` handles the `@observable` tag that is assigned to the class property. If found, two new events are
 * created and inserted as a class children: `change:{property}` and `set:{property}`, where `{property}` is the name of the observable
 * class property.
 */
module.exports = {
	load( app ) {
		// Search for the `@observable` tag when the whole project has been converted. It is required that the parent-child relationship
		// already exists.
		app.converter.on( Converter.EVENT_END, onEventEnd );
	}
};

function onEventEnd( context ) {
	// Get all resolved reflections that could potentially have the `@observable` tag.
	const reflections = context.project.getReflectionsByKind( ReflectionKind.Property );

	// Then, for each potential observable reflection...
	for ( const reflection of reflections ) {
		// ...skip it, if it does not contain the `@observable` tag.
		if ( !reflection.comment || !reflection.comment.getTag( '@observable' ) ) {
			continue;
		}

		// Otherwise, if the property has the `@observable` tag, get its name and its parent class.
		const propertyName = reflection.name;
		const classReflection = reflection.parent;

		// An observable property fires two events - `change` and `set` - so two event reflections have to be inserted as a class child.
		for ( const eventName of [ 'change', 'set' ] ) {
			const eventReflection = context
				.withScope( classReflection )
				.createDeclarationReflection(
					ReflectionKind.ObjectLiteral,
					undefined,
					undefined,
					`event:${ eventName }:${ propertyName }`
				);

			eventReflection.kindString = 'Event';

			const nameParameter = typeParameterFactory( context, {
				name: 'name',
				parent: eventReflection,
				kind: TypeScript.SyntaxKind.StringKeyword,
				comment: `Name of the changed property (\`${ propertyName }\`).`
			} );

			const valueParameter = typeParameterFactory( context, {
				name: 'value',
				parent: eventReflection,
				comment: `New value of the \`${ propertyName }\` property with given key or \`null\`, if operation should remove property.`,
				type: reflection.type
			} );

			const oldValueParameter = typeParameterFactory( context, {
				name: 'oldValue',
				parent: eventReflection,
				comment: `Old value of the \`${ propertyName }\` property with given key or \`null\`, if property was not set before.`,
				type: reflection.type
			} );

			eventReflection.typeParameters = [ nameParameter, valueParameter, oldValueParameter ];

			eventReflection.comment = new Comment( [
				{
					kind: 'text',
					text: eventName === 'change' ?
						`Fired when the \`${ propertyName }\` property changed value.` :
						`Fired when the \`${ propertyName }\` property is going to be set but is not set yet ` +
						'(before the `change` event is fired).'
				}
			] );

			if ( reflection.inheritedFrom ) {
				eventReflection.inheritedFrom = reflection.inheritedFrom;
			}

			// Copy the source location as it is the same as the location of the reflection containing the event.
			eventReflection.sources = [ ...reflection.sources ];
		}
	}
}

/**
 * Creates and returns new type parameter reflection.
 *
 * @param {require('typedoc').Context} context Current state of the converter.
 * @param {Object} options
 * @param {String} options.name Parameter name.
 * @param {require('typedoc').Reflection} options.parent Parent reflection where the parameter should belong.
 * @param {require('ts').SyntaxKind} options.kind Kind of the parameter.
 * @param {String} options.comment Parameter comment.
 * @param {Object} options.type
 * @returns {require('typedoc').Reflection}
 */
function typeParameterFactory( context, options ) {
	const typeParameter = new TypeParameterReflection( options.name, undefined, undefined, options.parent );

	if ( options.type ) {
		typeParameter.type = options.type;
	} else {
		const scope = context.withScope( typeParameter );
		const type = {
			kind: options.kind
		};

		typeParameter.type = context.converter.convertType( scope, type );
	}

	typeParameter.comment = new Comment( [
		{
			kind: 'text',
			text: options.comment
		}
	] );

	return typeParameter;
}
