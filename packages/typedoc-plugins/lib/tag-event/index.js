/**
 * @license Copyright (c) 2003-2022, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const { Converter, ReflectionKind, ParameterReflection, Comment } = require( 'typedoc' );

/**
 * TODO
 */
module.exports = {
	load( app ) {
		app.converter.on( Converter.EVENT_END, onEvent );
	}
};

function onEvent( context ) {
	try {
		const reflections = context.project.getReflectionsByKind( ReflectionKind.All );

		for ( const reflection of reflections ) {
			const comment = reflection.comment;

			if ( !comment || !comment.getTag( '@eventName' ) ) {
				continue;
			}

			const eventName = reflection.comment.getTag( '@eventName' ).content[ 0 ].text;
			const parent = findParentForEvent( eventName, reflection );

			const eventReflection = context
				.withScope( parent )
				.createDeclarationReflection(
					ReflectionKind.ObjectLiteral,
					undefined,
					undefined,
					`event:${ eventName }`
				);

			eventReflection.comment = reflection.comment.clone();
			eventReflection.kindString = 'Event';

			// const param = new TypeParameterReflection( 'nameFoo', undefined, undefined, eventReflection );

			// eventReflection.typeParameters = eventReflection.typeParameters || [];
			// eventReflection.typeParameters.push( param );

			// const param = new ParameterReflection( 'nazwa parametru', ReflectionKind.TypeLiteral, eventReflection );
			// param.type = context.converter.convertType( context.withScope( param ), param.type );

			eventReflection.parameters = comment.getTags( '@param' ).map( tag => {
				const param = new ParameterReflection( tag.name, ReflectionKind.TypeLiteral, eventReflection );

				param.type = context.converter.convertType( context.withScope( param ) );
				param.comment = new Comment( tag.content );

				return param;
			} );

			console.log(
				'-'.repeat( 100 ) + '\n',
				require( 'util' ).inspect( eventReflection, { showHidden: false, depth: 5, colors: true } )
			);
		}

		// const indexes = comment.tags.reduce( ( prev, tag, index ) => {
		// 	if ( tag.tagName === 'event' ) {
		// 		prev.push( index );
		// 	}

		// 	return prev;
		// }, [] );

		// const length = indexes.length;

		// if ( length === 1 ) {
		// 	const index = indexes[ 0 ];

		// 	comment.text += prepareExample( preferredLanguage, comment.tags[ index ].text );
		// 	comment.tags.splice( index, 1 );

		// 	continue;
		// }

		// let counter = 0;

		// for ( const index of indexes ) {
		// 	comment.text += prepareExample( preferredLanguage, comment.tags[ index ].text, ++counter );

		// 	if ( counter !== length ) { comment.text += '\n'; }
		// }

		// indexes.reverse().forEach( index => comment.tags.splice( index, 1 ) );
	} catch ( err ) {
		console.log( err );
	}
}

function findParentForEvent( eventName, reflection ) {
	let parentForEvent = reflection.parent.children.find( child => {
		if ( !child.comment ) {
			return false;
		}

		return child.comment
			.getTags( '@fires' )
			.some( tag => tag.content[ 0 ].text === eventName );
	} );

	if ( parentForEvent ) {
		return parentForEvent;
	}

	parentForEvent = reflection.parent.children.find( child => {
		if ( child.kindString !== 'Class' ) {
			return false;
		}

		if ( child.originalName !== 'default' ) {
			return false;
		}

		return true;
	} );

	if ( parentForEvent ) {
		return parentForEvent;
	}

	return reflection.parent;
}
