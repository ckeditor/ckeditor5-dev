/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import {
	Comment,
	Converter,
	TypeScript,
	ReflectionKind,
	ParameterReflection,
	type Context,
	type Application,
	type SomeType,
	type DeclarationReflection
} from 'typedoc';
import { getPluginPriority } from '../utils/getpluginpriority.js';

/**
 * The `typedoc-plugin-tag-observable` handles the `@observable` tag that is assigned to the class property. If found, two new events are
 * created and inserted as a class children: `change:{property}` and `set:{property}`, where `{property}` is the name of the observable
 * class property.
 */
export function typeDocTagObservable( app: Application ): void {
	app.converter.on( Converter.EVENT_END, onEventEnd, getPluginPriority( typeDocTagObservable.name ) );
}

function onEventEnd( context: Context ) {
	// Get all resolved reflections that could potentially have the `@observable` tag.
	const kinds = ReflectionKind.Property | ReflectionKind.GetSignature | ReflectionKind.SetSignature;
	const reflections = context.project.getReflectionsByKind( kinds ) as Array<DeclarationReflection>;

	// Then, for each potential observable reflection...
	for ( const reflection of reflections ) {
		// ...skip it, if it does not contain the `@observable` tag.
		if ( !reflection.comment || !reflection.comment.getTag( '@observable' ) ) {
			continue;
		}

		/**
		 * Otherwise, if the property has the `@observable` tag, get its name and its parent class.
		 * Accessor reflections need to use their grandparent instead, otherwise it will be:
		 *
		 *   `module:core/editor/editor~Editor#isReadOnly`
		 *
		 * instead of:
		 *
		 *   `module:core/editor/editor~Editor`
		 */
		const propertyName = reflection.name;
		const ownerReflection = reflection.kind === ReflectionKind.Property ? reflection.parent! : reflection.parent!.parent!;

		// An observable property fires two events - `change` and `set` - so two event reflections have to be inserted as a class child.
		for ( const eventName of [ 'change', 'set' ] ) {
			const eventReflection = createNewEventReflection( context, { reflection, eventName, propertyName } );
			eventReflection.parent = ownerReflection;

			ownerReflection.ckeditor5Events ??= [];
			ownerReflection.ckeditor5Events.push( eventReflection );
		}
	}
}

type CreateEventReflectionOptions = {
	reflection: DeclarationReflection;
	eventName: string;
	propertyName: string;
};

/**
 * Creates new reflection for the provided event name.
 */
function createNewEventReflection( context: Context, options: CreateEventReflectionOptions ) {
	const { reflection, eventName, propertyName } = options;

	const eventReflection = context
		.createDeclarationReflection(
			ReflectionKind.Document,
			undefined,
			undefined,
			`${ eventName }:${ propertyName }`
		);

	eventReflection.isCKEditor5Event = true;

	const nameParameter = createParameter( context, {
		name: 'name',
		parent: eventReflection,
		kind: TypeScript.SyntaxKind.StringKeyword,
		comment: `Name of the changed property (\`${ propertyName }\`).`
	} );

	const valueParameter = createParameter( context, {
		name: 'value',
		parent: eventReflection,
		type: reflection.type,
		comment: `New value of the \`${ propertyName }\` property with given key or \`null\`, if operation should remove property.`
	} );

	const oldValueParameter = createParameter( context, {
		name: 'oldValue',
		parent: eventReflection,
		type: reflection.type,
		comment: `Old value of the \`${ propertyName }\` property with given key or \`null\`, if property was not set before.`
	} );

	eventReflection.parameters = [ nameParameter, valueParameter, oldValueParameter ];

	eventReflection.comment = new Comment( [
		{
			kind: 'text',
			text: eventName === 'change' ?
				`Fired when the \`${ propertyName }\` property changed value.` :
				`Fired when the \`${ propertyName }\` property is going to be set but is not set yet ` +
				'(before the `change` event is fired).'
		}
	] );

	// Copy the source location as it is the same as the location of the reflection containing the event.
	eventReflection.sources = [ ...reflection.sources! ];

	// Copy the inheritance information to make sure that the event will be marked as inherited in the documentation.
	if ( reflection.inheritedFrom ) {
		eventReflection.inheritedFrom = reflection.inheritedFrom;
	}

	return eventReflection;
}

type CreateParameterOptions = {
	name: string;
	parent: DeclarationReflection;
	comment: string;
	kind?: TypeScript.SyntaxKind;
	type?: SomeType;
};

/**
 * Creates and returns new parameter reflection.
 */
function createParameter( context: Context, options: CreateParameterOptions ) {
	const parameter = new ParameterReflection( options.name, ReflectionKind.Parameter, options.parent );

	if ( options.type ) {
		parameter.type = options.type;
	} else {
		const type = {
			kind: options.kind
		} as unknown as TypeScript.TypeNode;

		parameter.type = context.converter.convertType( context, type );
	}

	parameter.comment = new Comment( [
		{
			kind: 'text',
			text: options.comment
		}
	] );

	return parameter;
}
