/**
 * @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { glob } from 'glob';
import upath from 'upath';
import {
	Application,
	type DeclarationReflection,
	type NamedTupleMember,
	type OptionalType,
	type ProjectReflection,
	ReflectionKind,
	type ReflectionType
} from 'typedoc';

import { ROOT_TEST_DIRECTORY } from '../utils.js';
import { typeDocRestoreProgramAfterConversion, typeDocTagEvent } from '../../src/index.js';

function assertEventExists( events: Array<DeclarationReflection>, eventName: string ) {
	const event = events.find( event => {
		return event.name === eventName;
	} );

	expect( event, eventName ).to.not.be.undefined;
}

describe( 'typedoc-plugins/tag-event', () => {
	let conversionResult: ProjectReflection,
		warnSpy: any;

	beforeAll( async () => {
		const FIXTURES_PATH = upath.join( ROOT_TEST_DIRECTORY, 'tag-event', 'fixtures' );

		const sourceFilePatterns = [
			upath.join( FIXTURES_PATH, '**', '*.ts' )
		];

		const files = ( await glob( sourceFilePatterns ) ).map( file => upath.normalize( file ) );
		const typeDoc = await Application.bootstrapWithPlugins( {
			logLevel: 'Error',
			entryPoints: files,
			tsconfig: upath.join( FIXTURES_PATH, 'tsconfig.json' ),
			plugin: [
				'typedoc-plugin-rename-defaults'
			]
		} );

		warnSpy = vi.spyOn( typeDoc.logger, 'warn' );

		typeDocTagEvent( typeDoc );
		typeDocRestoreProgramAfterConversion( typeDoc );

		expect( files ).to.not.lengthOf( 0 );

		conversionResult = ( await typeDoc.convert() )!;

		expect( conversionResult ).to.be.an( 'object' );
	} );

	afterAll( () => {
		vi.restoreAllMocks();
	} );

	it( 'should find all event tags within classes', () => {
		const eventDefinitions = conversionResult.getReflectionsByKind( ReflectionKind.Class )
			.flatMap( classReflection => classReflection.ckeditor5Events || [] ) as Array<DeclarationReflection>;

		expect( eventDefinitions ).to.lengthOf( 18 );

		// The order of found events does not matter, so just check if all of them are found.
		assertEventExists( eventDefinitions, 'event-foo-no-text' );
		assertEventExists( eventDefinitions, 'event-foo' );
		assertEventExists( eventDefinitions, 'event-foo-with-params' );
		assertEventExists( eventDefinitions, 'event-foo-no-content' );
		assertEventExists( eventDefinitions, 'event-foo-empty-args' );
		assertEventExists( eventDefinitions, 'event-foo-optional-args' );
		assertEventExists( eventDefinitions, 'event-foo-inline-args' );
		assertEventExists( eventDefinitions, 'event-foo-anonymous-args' );
		assertEventExists( eventDefinitions, 'event-foo-anonymous-optional-args' );
		assertEventExists( eventDefinitions, 'event-foo-reference' );
		assertEventExists( eventDefinitions, 'event-foo-generic-from-type-arg' );
		assertEventExists( eventDefinitions, 'event-foo-generic-from-base-type' );
		assertEventExists( eventDefinitions, 'event-foo-complex' );
		assertEventExists( eventDefinitions, 'event-foo-absolute' );
		assertEventExists( eventDefinitions, 'event-foo-absolute-with-prefix' );
		assertEventExists( eventDefinitions, 'event-foo-multiple-names' );
		assertEventExists( eventDefinitions, 'event-foo-multiple-names:variant' );
		assertEventExists( eventDefinitions, 'event-foo-multiple-names:variant:subvariant' );
	} );

	it( 'should find all event tags within interfaces', () => {
		const eventDefinitions = conversionResult.getReflectionsByKind( ReflectionKind.Interface )
			.flatMap( classReflection => classReflection.ckeditor5Events || [] ) as Array<DeclarationReflection>;

		expect( eventDefinitions ).to.lengthOf( 2 );

		// The order of found events does not matter, so just check if all of them are found.
		assertEventExists( eventDefinitions, 'event-change:{property}' );
		assertEventExists( eventDefinitions, 'event-set:{property}' );
	} );

	it( 'should inform if the class for an event has not been found', () => {
		const invalidEventNameTags = [
			'~InvalidClass#event-foo-relative-invalid-class',
			'~ExampleType#event-foo-relative-invalid-parent',
			'#event-foo-relative-invalid-name-with-separator',
			'event-foo-relative-invalid-name-without-separator',
			'module:invalidmodule~EventsInvalidClass#event-foo-absolute-invalid-module',
			'module:eventsvalid~InvalidClass#event-foo-absolute-invalid-class',
			'module:eventsvalid~ExampleType#event-foo-absolute-invalid-parent'
		];

		for ( const eventName of invalidEventNameTags ) {
			expect( warnSpy ).toHaveBeenCalledWith( `Skipping unsupported "${ eventName }" event.`, expect.anything() );
		}
	} );

	describe( 'event definitions', () => {
		let classDefinition: DeclarationReflection;

		beforeAll( () => {
			classDefinition = conversionResult.children!
				.find( entry => entry.name === 'fixtures/eventsvalid' )!
				.children!
				.find( entry => entry.name === 'EventsValidClass' )!;
		} );

		it( 'should find an event tag without description and parameters', () => {
			const eventDefinition = classDefinition.ckeditor5Events!
				.find( doclet => doclet.name === 'event-foo-no-text' )! as DeclarationReflection;

			expect( eventDefinition ).to.not.be.undefined;
			expect( eventDefinition.isCKEditor5Event ).to.equal( true );
			expect( eventDefinition.kind ).to.equal( ReflectionKind.Document );
			expect( eventDefinition ).to.have.property( 'comment' );

			const comment = eventDefinition.comment!;

			expect( comment ).to.have.property( 'summary' );
			expect( comment ).to.have.property( 'blockTags' );
			expect( comment ).to.have.property( 'modifierTags' );

			expect( comment.summary ).to.be.an( 'array' );
			expect( comment.summary ).to.lengthOf( 0 );
			expect( comment.blockTags ).to.be.an( 'array' );
			expect( comment.blockTags ).to.lengthOf( 1 );
			expect( comment.blockTags[ 0 ] ).to.have.property( 'tag', '@eventName' );
			expect( comment.modifierTags ).to.be.a( 'Set' );
			expect( comment.modifierTags.size ).to.equal( 0 );

			expect( eventDefinition.sources ).to.be.an( 'array' );
			expect( eventDefinition.sources ).to.lengthOf( 1 );
			expect( eventDefinition.sources![ 0 ] ).to.have.property( 'fileName', 'eventsvalid.ts' );
			expect( eventDefinition.sources![ 0 ] ).to.have.property( 'fullFileName' );
			expect( eventDefinition.sources![ 0 ] ).to.have.property( 'line' );
			expect( eventDefinition.sources![ 0 ] ).to.have.property( 'character' );
			expect( eventDefinition.sources![ 0 ] ).to.have.property( 'url' );

			expect( eventDefinition.parameters ).to.be.an( 'array' );
			expect( eventDefinition.parameters ).to.lengthOf( 0 );
		} );

		it( 'should find an event tag with description and without parameters', () => {
			const eventDefinition = classDefinition.ckeditor5Events!
				.find( doclet => doclet.name === 'event-foo' )!;

			expect( eventDefinition ).to.not.be.undefined;
			expect( eventDefinition.isCKEditor5Event ).to.equal( true );
			expect( eventDefinition.kind ).to.equal( ReflectionKind.Document );
			expect( eventDefinition ).to.have.property( 'comment' );

			const comment = eventDefinition.comment!;

			expect( comment ).to.have.property( 'summary' );
			expect( comment ).to.have.property( 'blockTags' );
			expect( comment ).to.have.property( 'modifierTags' );

			expect( comment.summary ).to.be.an( 'array' );
			expect( comment.summary ).to.lengthOf( 1 );
			expect( comment.summary[ 0 ] ).to.have.property( 'kind', 'text' );
			expect( comment.summary[ 0 ] ).to.have.property( 'text', 'An event associated with the type.' );
			expect( comment.blockTags ).to.be.an( 'array' );
			expect( comment.blockTags ).to.lengthOf( 1 );
			expect( comment.blockTags[ 0 ] ).to.have.property( 'tag', '@eventName' );
			expect( comment.modifierTags ).to.be.a( 'Set' );
			expect( comment.modifierTags.size ).to.equal( 0 );

			expect( eventDefinition.parameters ).to.be.an( 'array' );
			expect( eventDefinition.parameters ).to.lengthOf( 0 );
		} );

		it( 'should find an event tag with description and parameters', () => {
			const eventDefinition = classDefinition.ckeditor5Events!
				.find( doclet => doclet.name === 'event-foo-with-params' )!;

			expect( eventDefinition ).to.not.be.undefined;
			expect( eventDefinition.isCKEditor5Event ).to.equal( true );
			expect( eventDefinition.kind ).to.equal( ReflectionKind.Document );
			expect( eventDefinition ).to.have.property( 'comment' );

			const comment = eventDefinition.comment!;

			expect( comment ).to.have.property( 'summary' );
			expect( comment ).to.have.property( 'blockTags' );
			expect( comment ).to.have.property( 'modifierTags' );

			expect( comment.summary ).to.be.an( 'array' );
			expect( comment.summary ).to.lengthOf( 5 );

			expect( comment.summary[ 0 ] ).to.have.property( 'kind', 'text' );
			expect( comment.summary[ 0 ] ).to.have.property( 'text',
				'An event associated with the type. Event with three params.\n\nSee '
			);

			expect( comment.summary[ 1 ] ).to.have.property( 'kind', 'inline-tag' );
			expect( comment.summary[ 1 ] ).to.have.property( 'tag', '@link' );
			expect( comment.summary[ 1 ] ).to.have.property( 'text', '~EventsValidClass' );

			expect( comment.summary[ 2 ] ).to.have.property( 'kind', 'text' );
			expect( comment.summary[ 2 ] ).to.have.property( 'text', ' or ' );

			expect( comment.summary[ 3 ] ).to.have.property( 'kind', 'inline-tag' );
			expect( comment.summary[ 3 ] ).to.have.property( 'tag', '@link' );
			expect( comment.summary[ 3 ] ).to.have.property( 'text',
				'module:fixtures/eventsvalid~EventsValidClass Custom label'
			);

			expect( comment.summary[ 4 ] ).to.have.property( 'kind', 'text' );
			expect( comment.summary[ 4 ] ).to.have.property( 'text', '. A text after.' );

			expect( comment.blockTags ).to.be.an( 'array' );
			expect( comment.blockTags ).to.lengthOf( 5 );
			expect( comment.blockTags[ 0 ] ).to.have.property( 'tag', '@eventName' );
			expect( comment.blockTags[ 1 ] ).to.have.property( 'tag', '@param' );
			expect( comment.blockTags[ 2 ] ).to.have.property( 'tag', '@param' );
			expect( comment.blockTags[ 3 ] ).to.have.property( 'tag', '@param' );
			expect( comment.blockTags[ 4 ] ).to.have.property( 'tag', '@deprecated' );

			expect( comment.modifierTags ).to.be.a( 'Set' );
			expect( comment.modifierTags.size ).to.equal( 0 );

			expect( eventDefinition.parameters ).to.be.an( 'array' );
			expect( eventDefinition.parameters ).to.lengthOf( 3 );

			expect( eventDefinition.parameters[ 0 ] ).to.have.property( 'name', 'p1' );
			expect( eventDefinition.parameters[ 0 ] ).to.have.property( 'comment' );

			const firstParamComment = eventDefinition.parameters[ 0 ].comment!;

			expect( firstParamComment ).to.have.property( 'summary' );
			expect( firstParamComment.summary ).to.be.an( 'array' );
			expect( firstParamComment.summary[ 0 ] ).to.have.property( 'kind', 'text' );
			expect( firstParamComment.summary[ 0 ] ).to.have.property( 'text', 'Description for first param.' );

			expect( eventDefinition.parameters[ 1 ] ).to.have.property( 'name', 'p2' );
			expect( eventDefinition.parameters[ 1 ] ).to.have.property( 'comment' );

			const secondParamComment = eventDefinition.parameters[ 1 ].comment!;

			expect( secondParamComment ).to.have.property( 'summary' );
			expect( secondParamComment.summary ).to.be.an( 'array' );
			expect( secondParamComment.summary[ 0 ] ).to.have.property( 'kind', 'text' );
			expect( secondParamComment.summary[ 0 ] ).to.have.property( 'text', 'Description for second param.' );

			expect( eventDefinition.parameters[ 2 ] ).to.have.property( 'name', 'p3' );
			expect( eventDefinition.parameters[ 2 ] ).to.have.property( 'comment' );

			const thirdParamComment = eventDefinition.parameters[ 2 ].comment!;

			expect( thirdParamComment ).to.have.property( 'summary' );
			expect( thirdParamComment.summary ).to.be.an( 'array' );
			expect( thirdParamComment.summary ).to.lengthOf( 5 );

			expect( thirdParamComment.summary[ 0 ] ).to.have.property( 'kind', 'text' );
			expect( thirdParamComment.summary[ 0 ] ).to.have.property( 'text', 'Complex ' );

			expect( thirdParamComment.summary[ 1 ] ).to.have.property( 'kind', 'inline-tag' );
			expect( thirdParamComment.summary[ 1 ] ).to.have.property( 'tag', '@link' );
			expect( thirdParamComment.summary[ 1 ] ).to.have.property( 'text',
				'module:utils/object~Object description'
			);

			expect( thirdParamComment.summary[ 2 ] ).to.have.property( 'kind', 'text' );
			expect( thirdParamComment.summary[ 2 ] ).to.have.property( 'text', ' for ' );

			expect( thirdParamComment.summary[ 3 ] ).to.have.property( 'kind', 'code' );
			expect( thirdParamComment.summary[ 3 ] ).to.have.property( 'text', '`third param`' );

			expect( thirdParamComment.summary[ 4 ] ).to.have.property( 'kind', 'text' );
			expect( thirdParamComment.summary[ 4 ] ).to.have.property( 'text', '.' );
		} );

		describe( 'event parameters', () => {
			it( 'should convert event parameters from the "args" property', () => {
				const eventDefinition = classDefinition.ckeditor5Events!
					.find( doclet => doclet.name === 'event-foo-with-params' )!;

				expect( eventDefinition ).to.not.be.undefined;
				expect( eventDefinition.isCKEditor5Event ).to.equal( true );
				expect( eventDefinition.kind ).to.equal( ReflectionKind.Document );

				expect( eventDefinition ).to.not.be.undefined;
				expect( eventDefinition.parameters ).to.be.an( 'array' );
				expect( eventDefinition.parameters ).to.lengthOf( 3 );

				expect( eventDefinition.parameters[ 0 ] ).to.have.property( 'name', 'p1' );
				expect( eventDefinition.parameters[ 0 ] ).to.have.property( 'type' );

				const firstParam = eventDefinition.parameters[ 0 ].type as NamedTupleMember;

				expect( firstParam ).to.have.property( 'type', 'namedTupleMember' );
				expect( firstParam ).to.have.property( 'element' );
				expect( firstParam.element ).to.have.property( 'type', 'intrinsic' );
				expect( firstParam.element ).to.have.property( 'name', 'string' );

				expect( eventDefinition.parameters[ 1 ] ).to.have.property( 'name', 'p2' );
				expect( eventDefinition.parameters[ 1 ] ).to.have.property( 'type' );

				const secondParam = eventDefinition.parameters[ 1 ].type as NamedTupleMember;

				expect( secondParam ).to.have.property( 'type', 'namedTupleMember' );
				expect( secondParam ).to.have.property( 'element' );
				expect( secondParam.element ).to.have.property( 'type', 'intrinsic' );
				expect( secondParam.element ).to.have.property( 'name', 'number' );

				expect( eventDefinition.parameters[ 2 ] ).to.have.property( 'name', 'p3' );
				expect( eventDefinition.parameters[ 2 ] ).to.have.property( 'type' );

				const thirdParam = eventDefinition.parameters[ 2 ].type as NamedTupleMember;

				expect( thirdParam ).to.have.property( 'type', 'namedTupleMember' );
				expect( thirdParam ).to.have.property( 'element' );
				expect( thirdParam.element ).to.have.property( 'type', 'reference' );
				expect( thirdParam.element ).to.have.property( 'name', 'ExampleType' );
			} );

			it( 'should not add type parameters for event without content', () => {
				const eventDefinition = classDefinition.ckeditor5Events!
					.find( doclet => doclet.name === 'event-foo-no-content' )!;

				expect( eventDefinition ).to.not.be.undefined;
				expect( eventDefinition.parameters ).to.be.an( 'array' );
				expect( eventDefinition.parameters ).to.lengthOf( 0 );
			} );

			it( 'should not add type parameters for event with empty args', () => {
				const eventDefinition = classDefinition.ckeditor5Events!
					.find( doclet => doclet.name === 'event-foo-empty-args' )!;

				expect( eventDefinition ).to.not.be.undefined;
				expect( eventDefinition.parameters ).to.be.an( 'array' );
				expect( eventDefinition.parameters ).to.lengthOf( 0 );
			} );

			it( 'should convert optional event parameter', () => {
				const eventDefinition = classDefinition.ckeditor5Events!
					.find( doclet => doclet.name === 'event-foo-optional-args' )!;

				expect( eventDefinition ).to.not.be.undefined;
				expect( eventDefinition.parameters ).to.be.an( 'array' );
				expect( eventDefinition.parameters ).to.lengthOf( 2 );

				expect( eventDefinition.parameters[ 0 ] ).to.have.property( 'name', 'p1' );
				expect( eventDefinition.parameters[ 0 ] ).to.have.property( 'flags' );
				expect( eventDefinition.parameters[ 0 ].flags ).to.have.property( 'isOptional', false );
				expect( eventDefinition.parameters[ 0 ] ).to.have.property( 'type' );

				const firstParam = eventDefinition.parameters[ 0 ].type as NamedTupleMember;

				expect( firstParam ).to.have.property( 'type', 'namedTupleMember' );
				expect( firstParam ).to.have.property( 'element' );
				expect( firstParam.element ).to.have.property( 'type', 'intrinsic' );
				expect( firstParam.element ).to.have.property( 'name', 'string' );

				expect( eventDefinition.parameters[ 1 ] ).to.have.property( 'name', 'p2' );
				expect( eventDefinition.parameters[ 1 ] ).to.have.property( 'flags' );
				expect( eventDefinition.parameters[ 1 ].flags ).to.have.property( 'isOptional', true );
				expect( eventDefinition.parameters[ 1 ] ).to.have.property( 'type' );

				const secondParam = eventDefinition.parameters[ 1 ].type as NamedTupleMember;

				expect( secondParam ).to.have.property( 'type', 'namedTupleMember' );
				expect( secondParam ).to.have.property( 'element' );
				expect( secondParam.element ).to.have.property( 'type', 'intrinsic' );
				expect( secondParam.element ).to.have.property( 'name', 'number' );
			} );

			it( 'should convert event parameter with name taken from @param tag', () => {
				const eventDefinition = classDefinition.ckeditor5Events!
					.find( doclet => doclet.name === 'event-foo-inline-args' )!;

				expect( eventDefinition ).to.not.be.undefined;
				expect( eventDefinition.parameters ).to.be.an( 'array' );
				expect( eventDefinition.parameters ).to.lengthOf( 1 );

				expect( eventDefinition.parameters[ 0 ] ).to.have.property( 'name', 'p1' );
				expect( eventDefinition.parameters[ 0 ] ).to.have.property( 'type' );

				const firstParam = eventDefinition.parameters[ 0 ].type as ReflectionType;

				expect( firstParam ).to.have.property( 'type', 'reflection' );
				expect( firstParam ).to.have.property( 'declaration' );
				expect( firstParam.declaration ).to.have.property( 'kind', ReflectionKind.TypeLiteral );
			} );

			it( 'should convert event parameter without a name', () => {
				const eventDefinition = classDefinition.ckeditor5Events
					.find( doclet => doclet.name === 'event-foo-anonymous-args' )!;

				expect( eventDefinition ).to.not.be.undefined;
				expect( eventDefinition.parameters ).to.be.an( 'array' );
				expect( eventDefinition.parameters ).to.lengthOf( 2 );

				expect( eventDefinition.parameters[ 0 ] ).to.have.property( 'name', '<anonymous>' );
				expect( eventDefinition.parameters[ 0 ] ).to.have.property( 'type' );
				expect( eventDefinition.parameters[ 0 ].type ).to.have.property( 'type', 'intrinsic' );
				expect( eventDefinition.parameters[ 0 ].type ).to.have.property( 'name', 'number' );

				expect( eventDefinition.parameters[ 1 ] ).to.have.property( 'name', '<anonymous>' );
				expect( eventDefinition.parameters[ 1 ] ).to.have.property( 'type' );

				const secondParam = eventDefinition.parameters[ 1 ].type as ReflectionType;

				expect( secondParam ).to.have.property( 'type', 'reflection' );
				expect( secondParam ).to.have.property( 'declaration' );
				expect( secondParam.declaration ).to.have.property( 'kind', ReflectionKind.TypeLiteral );
			} );

			it( 'should convert optional event parameter without a name', () => {
				const eventDefinition = classDefinition.ckeditor5Events
					.find( doclet => doclet.name === 'event-foo-anonymous-optional-args' )!;

				expect( eventDefinition ).to.not.be.undefined;
				expect( eventDefinition.parameters ).to.be.an( 'array' );
				expect( eventDefinition.parameters ).to.lengthOf( 2 );

				expect( eventDefinition.parameters[ 0 ] ).to.have.property( 'name', '<anonymous>' );
				expect( eventDefinition.parameters[ 0 ] ).to.have.property( 'flags' );
				expect( eventDefinition.parameters[ 0 ].flags ).to.have.property( 'isOptional', true );
				expect( eventDefinition.parameters[ 0 ] ).to.have.property( 'type' );
				expect( eventDefinition.parameters[ 0 ].type ).to.have.property( 'type', 'optional' );
				expect( eventDefinition.parameters[ 0 ].type ).to.have.property( 'elementType' );

				const firstParam = eventDefinition.parameters[ 0 ].type as OptionalType;

				expect( firstParam.elementType ).to.have.property( 'type', 'intrinsic' );
				expect( firstParam.elementType ).to.have.property( 'name', 'number' );

				expect( eventDefinition.parameters[ 1 ] ).to.have.property( 'name', '<anonymous>' );
				expect( eventDefinition.parameters[ 1 ] ).to.have.property( 'flags' );
				expect( eventDefinition.parameters[ 1 ].flags ).to.have.property( 'isOptional', true );
				expect( eventDefinition.parameters[ 1 ] ).to.have.property( 'type' );
				expect( eventDefinition.parameters[ 1 ].type ).to.have.property( 'type', 'optional' );
				expect( eventDefinition.parameters[ 1 ].type ).to.have.property( 'elementType' );

				const secondParam = eventDefinition.parameters[ 1 ].type as OptionalType;

				expect( secondParam.elementType ).to.have.property( 'type', 'reflection' );
				expect( secondParam.elementType ).to.have.property( 'declaration' );
				expect( ( secondParam.elementType as ReflectionType ).declaration ).to.have.property( 'kind', ReflectionKind.TypeLiteral );
			} );

			it( 'should convert event parameter that is a reference to another type', () => {
				const eventDefinition = classDefinition.ckeditor5Events
					.find( doclet => doclet.name === 'event-foo-reference' )!;

				expect( eventDefinition ).to.not.be.undefined;
				expect( eventDefinition.parameters ).to.be.an( 'array' );
				expect( eventDefinition.parameters ).to.lengthOf( 2 );

				expect( eventDefinition.parameters[ 0 ] ).to.have.property( 'name', 'p1' );
				expect( eventDefinition.parameters[ 0 ] ).to.have.property( 'type' );
				expect( eventDefinition.parameters[ 0 ].type ).to.have.property( 'type', 'namedTupleMember' );
				expect( eventDefinition.parameters[ 0 ].type ).to.have.property( 'element' );

				const firstParam = eventDefinition.parameters[ 0 ].type as NamedTupleMember;

				expect( firstParam.element ).to.have.property( 'type', 'intrinsic' );
				expect( firstParam.element ).to.have.property( 'name', 'string' );

				expect( eventDefinition.parameters[ 1 ] ).to.have.property( 'name', 'p2' );
				expect( eventDefinition.parameters[ 1 ] ).to.have.property( 'type' );
				expect( eventDefinition.parameters[ 1 ].type ).to.have.property( 'type', 'namedTupleMember' );
				expect( eventDefinition.parameters[ 1 ].type ).to.have.property( 'element' );

				const secondParam = eventDefinition.parameters[ 1 ].type as NamedTupleMember;

				expect( secondParam.element ).to.have.property( 'type', 'reference' );
				expect( secondParam.element ).to.have.property( 'name', 'ExampleType' );
			} );

			it( 'should convert event parameter that came from a generic event definition (from type argument)', () => {
				const eventDefinition = classDefinition.ckeditor5Events
					.find( doclet => doclet.name === 'event-foo-generic-from-type-arg' )!;

				expect( eventDefinition ).to.not.be.undefined;
				expect( eventDefinition.parameters ).to.be.an( 'array' );
				expect( eventDefinition.parameters ).to.lengthOf( 2 );

				expect( eventDefinition.parameters[ 0 ] ).to.have.property( 'name', 'p1' );
				expect( eventDefinition.parameters[ 0 ] ).to.have.property( 'type' );
				expect( eventDefinition.parameters[ 0 ].type ).to.have.property( 'type', 'namedTupleMember' );
				expect( eventDefinition.parameters[ 0 ].type ).to.have.property( 'element' );

				const firstParam = eventDefinition.parameters[ 0 ].type as NamedTupleMember;

				expect( firstParam.element ).to.have.property( 'type', 'intrinsic' );
				expect( firstParam.element ).to.have.property( 'name', 'string' );

				expect( eventDefinition.parameters[ 1 ] ).to.have.property( 'name', 'p2' );
				expect( eventDefinition.parameters[ 1 ] ).to.have.property( 'type' );
				expect( eventDefinition.parameters[ 1 ].type ).to.have.property( 'type', 'namedTupleMember' );
				expect( eventDefinition.parameters[ 1 ].type ).to.have.property( 'element' );

				const secondParam = eventDefinition.parameters[ 1 ].type as NamedTupleMember;

				expect( secondParam.element ).to.have.property( 'type', 'reference' );
				expect( secondParam.element ).to.have.property( 'name', 'ExampleType' );
			} );

			it( 'should convert event parameter that came from a generic event definition (from base type)', () => {
				const eventDefinition = classDefinition.ckeditor5Events
					.find( doclet => doclet.name === 'event-foo-generic-from-base-type' )!;

				expect( eventDefinition ).to.not.be.undefined;
				expect( eventDefinition.parameters ).to.be.an( 'array' );
				expect( eventDefinition.parameters ).to.lengthOf( 2 );

				expect( eventDefinition.parameters[ 0 ] ).to.have.property( 'name', 'p1' );
				expect( eventDefinition.parameters[ 0 ] ).to.have.property( 'type' );
				expect( eventDefinition.parameters[ 0 ].type ).to.have.property( 'type', 'namedTupleMember' );
				expect( eventDefinition.parameters[ 0 ].type ).to.have.property( 'element' );

				const firstParam = eventDefinition.parameters[ 0 ].type as NamedTupleMember;

				expect( firstParam.element ).to.have.property( 'type', 'intrinsic' );
				expect( firstParam.element ).to.have.property( 'name', 'string' );

				expect( eventDefinition.parameters[ 1 ] ).to.have.property( 'name', 'p2' );
				expect( eventDefinition.parameters[ 1 ] ).to.have.property( 'type' );
				expect( eventDefinition.parameters[ 1 ].type ).to.have.property( 'type', 'namedTupleMember' );
				expect( eventDefinition.parameters[ 1 ].type ).to.have.property( 'element' );

				const secondParam = eventDefinition.parameters[ 1 ].type as NamedTupleMember;
				expect( secondParam.element ).to.have.property( 'type', 'reference' );
				expect( secondParam.element ).to.have.property( 'name', 'ExampleType' );
			} );

			it( 'should convert a complex event parameter but set its type to any', () => {
				const eventDefinition = classDefinition.ckeditor5Events
					.find( doclet => doclet.name === 'event-foo-complex' )!;

				expect( eventDefinition ).to.not.be.undefined;
				expect( eventDefinition.parameters ).to.be.an( 'array' );
				expect( eventDefinition.parameters ).to.lengthOf( 1 );

				expect( eventDefinition.parameters[ 0 ] ).to.have.property( 'name', '<anonymous>' );
				expect( eventDefinition.parameters[ 0 ] ).to.have.property( 'type' );
				expect( eventDefinition.parameters[ 0 ].type ).to.have.property( 'type', 'intrinsic' );
				expect( eventDefinition.parameters[ 0 ].type ).to.have.property( 'name', 'any' );
			} );
		} );
	} );

	describe( 'multiple event definitions', () => {
		it( 'should properly assign all events', () => {
			const eventsValidClass = conversionResult
				.getChildByName( [ 'fixtures/eventsvalid', 'EventsValidClass' ] ) as DeclarationReflection;
			const eventsValidAnotherClass = conversionResult
				.getChildByName( [ 'fixtures/eventsvalid', 'EventsValidAnotherClass' ] ) as DeclarationReflection;

			const event1 = eventsValidClass.ckeditor5Events
				.find( doclet => doclet.name === 'event-foo-multiple-names' );
			const event2 = eventsValidClass.ckeditor5Events
				.find( doclet => doclet.name === 'event-foo-multiple-names:variant' );
			const event3 = eventsValidAnotherClass.ckeditor5Events
				.find( doclet => doclet.name === 'event-foo-multiple-names:variant:subvariant' );

			expect( event1 ).to.not.be.undefined;
			expect( event2 ).to.not.be.undefined;
			expect( event3 ).to.not.be.undefined;
		} );
	} );
} );
