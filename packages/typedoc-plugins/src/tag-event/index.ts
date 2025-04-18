/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import {
	Comment,
	Converter,
	IntrinsicType,
	ParameterReflection,
	ReflectionFlag,
	ReflectionKind,
	type Application,
	type Context, DeclarationReflection,
	type Reflection,
	type TupleType,
	type SomeType
} from 'typedoc';
import { getTarget } from '../utils/index.js';

import EventTagSerializer from './eventtagserializer.js';
import './augmentation.js';

/**
 * The `typedoc-plugin-tag-event` collects event definitions from the `@eventName` tag and assigns them as the children of the class or
 * the `Observable` interface.
 *
 * We are not using the `@event` tag, known from the JSDoc specification, because it has a special meaning in the TypeDoc, and it would be
 * difficult to get it to work as we expect. This is why we have introduced a support for the custom `@eventName` tag, which now replaces
 * the old `@event` tag.
 *
 * To correctly define an event, it must be associated with the exported type that describes that event, with the `name` and `args`
 * properties. The value for the `@eventName` tag must be a valid link to a class or to an interface, either a relative or an absolute one.
 *
 * To correctly define the event parameters, they must be defined in the `args` property. The `args` property is an array, where each item
 * describes a parameter that event emits. Item can be either of a primitive type, or a custom type that has own definition.
 *
 * Example:
 *
 * ```ts
 * 		export class ExampleClass {}
 *
 * 		export type ExampleType = {
 * 			name: string;
 * 		};
 *
 * 		/**
 * 		 * An event associated with exported type.
 * 		 *
 * 		 * @eventName ~ExampleClass#foo-event
 * 		 * @param p1 Description for first param.
 * 		 * @param p2 Description for second param.
 * 		 * @param p3 Description for third param.
 * 		 * /
 * 		export type FooEvent = {
 * 			name: string;
 * 			args: [
 * 				p1: string;
 * 				p2: number;
 * 				p3: ExampleType;
 * 			];
 * 		};
 * ```
 *
 * Exported type may contain multiple `@eventName` tags to re-use the same type to create many different events.
 */
export default function( app: Application ): void {
	app.converter.on( Converter.EVENT_END, onEventEnd );

	// TODO: To resolve types.
	// @ts-expect-error TS2345
	// Argument of type CustomFlagSerializer is not assignable to parameter of type SerializerComponent<Reflection>
	// The types returned by toObject(...) are incompatible between these types.
	app.serializer.addSerializer( new EventTagSerializer() );
}

function onEventEnd( context: Context ) {
	// Get all resolved reflections that could be an event.
	const eventKind = /* ReflectionKind.TypeLiteral |*/ ReflectionKind.TypeAlias;
	const reflections = context.project.getReflectionsByKind( eventKind ) as Array<DeclarationReflection>;

	// Then, for each potential event reflection...
	for ( const reflection of reflections ) {
		// ...skip it, if it does not contain the `@eventName` tag.
		if ( !reflection.comment || !reflection.comment.getTag( '@eventName' ) ) {
			continue;
		}

		// Otherwise, if there is at least one `@eventName` tag found in a comment, extract the link to the event owner for each found tag.
		// The link to the event owner is the string just after the tag name.
		//
		// Example: for the `@eventName ~ExampleClass#foo-event`, the event link would be `~ExampleClass#foo-event`.
		const eventTags = reflection.comment.getTags( '@eventName' )
			.map( tag => tag.content.at( 0 )!.text );

		// Then, try to find the owner reflection for each found tag to properly associate the event in the hierarchy.
		for ( const eventTag of eventTags ) {
			const [ eventOwner, eventName ] = eventTag.split( '#' ) as [ string, string ];
			const ownerReflection = getTarget( context, reflection, eventOwner )! as DeclarationReflection;

			// The owner for an event can be either a class or an interface.
			if ( !isClassOrInterface( ownerReflection ) ) {
				const symbol = context.getSymbolFromReflection( reflection )!;
				const node = symbol.declarations![ 0 ]!;

				context.logger.warn( `Skipping unsupported "${ eventTag }" event.`, node );

				continue;
			}

			const eventReflection = createNewEventReflection( context, reflection, eventName );
			eventReflection.parent = ownerReflection;

			ownerReflection.ckeditor5Events ??= [];
			ownerReflection.ckeditor5Events.push( eventReflection );
		}
	}
}

/**
 * Checks if the found owner reflection for an event is either an interface or a class.
 */
function isClassOrInterface( reflection: Reflection | null ) {
	if ( !reflection ) {
		return false;
	}

	if ( reflection.kind !== ReflectionKind.Class && reflection.kind !== ReflectionKind.Interface ) {
		return false;
	}

	return true;
}

/**
 * Creates new reflection for the provided event name, in the event owner's scope.
 */
function createNewEventReflection(
	context: Context,
	sourceReflection: DeclarationReflection,
	eventName: string
): DeclarationReflection {
	const eventReflection = new DeclarationReflection( normalizeEventName( eventName ), ReflectionKind.Document );

	eventReflection.isCKEditor5Event = true;

	const paramTags = sourceReflection.comment!.getTags( '@param' );

	// Try to find parameters for the event, which are defined in the `args` tuple.
	const argsReflection = getArgsTuple( sourceReflection );

	// Then, for each found parameter, get its type and try to find the description from the `@param` tag.
	const eventParameters = argsReflection.map( ( arg, index ) => {
		let argName: string;

		// If the parameter is not anonymous, take its name.
		if ( arg.type === 'namedTupleMember' ) {
			argName = arg.name;
		}
		// Otherwise, take the name from the `@param` tag at the current index (if it exists).
		else if ( paramTags[ index ] ) {
			argName = paramTags[ index ]!.name!;
		}
		// Otherwise, just set the fallback name to show something.
		else {
			argName = '<anonymous>';
		}

		const param = new ParameterReflection( argName, ReflectionKind.Parameter, eventReflection );
		param.type = arg;

		// TypeDoc does not mark an optional parameter, so let's do it manually.
		if ( ( arg.type === 'namedTupleMember' && arg.isOptional ) || param.type.type === 'optional' ) {
			param.setFlag( ReflectionFlag.Optional );
		}

		const comment = paramTags.find( tag => tag.name === argName );

		if ( comment ) {
			param.comment = new Comment( comment.content );
		}

		return param;
	} );

	eventReflection.parameters = eventParameters;

	// Copy the whole comment. In addition to the comment summary, it can contain other useful data (i.e. block tags, modifier tags).
	eventReflection.comment = sourceReflection.comment!.clone();

	// Copy the source location as it is the same as the location of the reflection containing the event.
	eventReflection.sources = [ ...sourceReflection.sources! ];

	// Finalize the reflection registration with TypeScript symbol.
	context.postReflectionCreation( eventReflection, context.getSymbolFromReflection( sourceReflection ), undefined );

	return eventReflection;
}

/**
 * Tries to find the `args` tuple, that is associated with the event, and it contains all event parameters.
 */
function getArgsTuple( reflection: DeclarationReflection ): Array<SomeType> {
	// The target reflection, that defines the `args` tuple, might be located in one of two (or both) places:
	// - in the type arguments (generic),
	// - in the type of the reflection (children).
	//
	// Let's take the type arguments first, if they exist, because if the `args` tuple is defined there, this seems more desirable.
	const targetTypeReflections = [
		// A generic type.
		...getTypeArgumentsFromReflection( reflection ),
		// A literal type.
		...getChildrenFromReflection( reflection ),
		// A direct reference to another type.
		reflection.type!
	].flatMap( type => getTargetTypeReflections( type ) );

	// Then, try to find the `args` tuple.
	const argsTuple: DeclarationReflection | undefined = targetTypeReflections
		.flatMap( type => {
			if ( type.type === 'reflection' ) {
				// The `args` tuple could be one of the reflection child.
				return type.declaration.children || [];
			}

			return type as DeclarationReflection;
		} )
		.find( property => property.name === 'args' );

	if ( !argsTuple ) {
		return [];
	}

	const tupleType = argsTuple.type as TupleType;

	// If the `args` tuple is of a "complex" type (e.g. a conditional type) without ready-to-process elements,
	// just consider it as any type for now.
	if ( !tupleType.elements ) {
		return [ new IntrinsicType( 'any' ) ];
	}

	return tupleType.elements;
}

function getTypeArgumentsFromReflection( reflection: DeclarationReflection ): Array<SomeType> {
	if ( !reflection.type ) {
		return [];
	}

	if ( reflection.type.type === 'reference' ) {
		return reflection.type!.typeArguments || [];
	}

	return [];
}

function getChildrenFromReflection( reflection: DeclarationReflection ): Array<DeclarationReflection> {
	return reflection.children || [];
}

/**
 * Returns all type reflections for the specified reflection.
 *
 * If the type reflection is a reference to another one, it recursively walks deep until the final declaration is reached.
 * If the type reflection is an intersection, all member reflections are recursively checked.
 */
function getTargetTypeReflections( reflectionType: DeclarationReflection | SomeType | null ): Array<DeclarationReflection | SomeType> {
	if ( !reflectionType ) {
		return [];
	}

	if ( reflectionType.type === 'reference' ) {
		if ( !reflectionType.reflection ) {
			return [];
		}

		const reflection = reflectionType.reflection as DeclarationReflection;

		if ( !reflection.type ) {
			return reflection.children || [];
		}

		return getTargetTypeReflections( reflection.type );
	}

	if ( reflectionType.type === 'intersection' ) {
		return reflectionType.types.flatMap( type => getTargetTypeReflections( type ) );
	}

	return [
		reflectionType
	];
}

/**
 * Returns the normalized event name to make sure that it always starts with the "event:" prefix.
 */
function normalizeEventName( eventName: string ): string {
	if ( eventName.startsWith( 'event:' ) ) {
		return eventName.replace( 'event:', '' );
	}

	return eventName;
}
