/**
 * @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { glob } from 'glob';
import upath from 'upath';
import {
	Application,
	ReflectionKind,
	type DeclarationReflection,
	type ProjectReflection
} from 'typedoc';

import { ROOT_TEST_DIRECTORY } from '../utils.js';
import { typeDocRestoreProgramAfterConversion, typeDocTagObservable } from '../../src/index.js';

type AssertObservableExistsType = {
	reflections: Array<DeclarationReflection>;
	parentName: string;
	observableName: string;
};

function assertObservableExists( { reflections, parentName, observableName }: AssertObservableExistsType ) {
	const observable = reflections.find( ref => {
		const ownerReflection = ref.kind === ReflectionKind.Property ? ref.parent! : ref.parent!.parent!;

		return ownerReflection.name === parentName && ref.name === observableName;
	} );

	expect( observable, `"${ observableName }" not found in "${ parentName }"` ).to.not.be.undefined;
}

describe( 'typedoc-plugins/tag-observable', () => {
	let conversionResult: ProjectReflection;

	const FIXTURES_PATH = upath.join( ROOT_TEST_DIRECTORY, 'tag-observable', 'fixtures' );

	beforeAll( async () => {
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
			],
			// TODO: To resolve types.
			// @ts-expect-error TS2322
			// Type 'boolean' is not assignable to type 'string'.
			// For unknown reasons `excludePrivate` type is resolved as `string`.
			excludePrivate: false
		} );

		typeDocTagObservable( typeDoc );
		typeDocRestoreProgramAfterConversion( typeDoc );

		expect( files ).to.not.lengthOf( 0 );

		conversionResult = ( await typeDoc.convert() )!;

		expect( conversionResult ).to.be.an( 'object' );
	} );

	it( 'should find all observable class properties within the project', () => {
		const reflections = conversionResult.getReflectionsByKind( ReflectionKind.Property )
			.filter( item => item.comment && item.comment.getTag( '@observable' ) ) as Array<DeclarationReflection>;

		// There should be found the following observables:
		// * ExampleClass#key
		// * ExampleClass#value
		// * ExampleClass#secret
		// * CustomExampleClass#key (inherited from ExampleClass)
		// * CustomExampleClass#value (inherited from ExampleClass)
		// * CustomExampleClass#property
		// * CustomExampleClass#anotherProperty
		// * CustomExampleClass.staticProperty
		expect( reflections ).to.lengthOf( 8 );

		// The order of found reflections does not matter, so just check if all expected observables are found.
		assertObservableExists( { reflections, parentName: 'ExampleClass', observableName: 'key' } );
		assertObservableExists( { reflections, parentName: 'ExampleClass', observableName: 'value' } );
		assertObservableExists( { reflections, parentName: 'ExampleClass', observableName: 'secret' } );
		assertObservableExists( { reflections, parentName: 'CustomExampleClass', observableName: 'key' } );
		assertObservableExists( { reflections, parentName: 'CustomExampleClass', observableName: 'value' } );
		assertObservableExists( { reflections, parentName: 'CustomExampleClass', observableName: 'property' } );
		assertObservableExists( { reflections, parentName: 'CustomExampleClass', observableName: 'anotherProperty' } );
		assertObservableExists( { reflections, parentName: 'CustomExampleClass', observableName: 'staticProperty' } );
	} );

	it( 'should find all observable class getters and setters within the project', () => {
		const reflections = conversionResult.getReflectionsByKind( ReflectionKind.GetSignature | ReflectionKind.SetSignature )
			.filter( item => item.comment && item.comment.getTag( '@observable' ) ) as Array<DeclarationReflection>;

		// There should be found the following observables:
		// * ExampleClass#hasSecret
		// * ExampleClass#setSecret
		// * CustomExampleClass#hasSecret (inherited from ExampleClass)
		// * CustomExampleClass#setSecret (inherited from ExampleClass)
		expect( reflections ).to.lengthOf( 4 );

		// The order of found reflections does not matter, so just check if all expected observables are found.
		assertObservableExists( { reflections, parentName: 'ExampleClass', observableName: 'hasSecret' } );
		assertObservableExists( { reflections, parentName: 'ExampleClass', observableName: 'setSecret' } );
		assertObservableExists( { reflections, parentName: 'CustomExampleClass', observableName: 'hasSecret' } );
		assertObservableExists( { reflections, parentName: 'CustomExampleClass', observableName: 'setSecret' } );
	} );

	describe( 'events', () => {
		let baseClassDefinition: DeclarationReflection,
			derivedClassDefinition: DeclarationReflection;

		beforeAll( () => {
			baseClassDefinition = conversionResult.children!
				.find( entry => entry.name === 'fixtures/exampleclass' )!.children!
				.find( entry => entry.name === 'ExampleClass' )!;

			derivedClassDefinition = conversionResult.children!
				.find( entry => entry.name === 'fixtures/customexampleclass' )!.children!
				.find( entry => entry.name === 'CustomExampleClass' )!;
		} );

		it( 'should find all events in the base class', () => {
			const eventDefinitions = baseClassDefinition.ckeditor5Events
				.filter( children => children.isCKEditor5Event );

			expect( eventDefinitions ).to.lengthOf( 10 );

			expect( eventDefinitions.map( event => event.name ) ).to.have.members( [
				'change:key',
				'change:value',
				'change:secret',
				'change:setSecret',
				'change:hasSecret',

				'set:key',
				'set:value',
				'set:secret',
				'set:setSecret',
				'set:hasSecret'
			] );
		} );

		it( 'should find all events in the derived class', () => {
			const eventDefinitions = derivedClassDefinition.ckeditor5Events
				.filter( children => children.isCKEditor5Event );

			expect( eventDefinitions ).to.lengthOf( 14 );

			expect( eventDefinitions.map( event => event.name ) ).to.have.members( [
				'change:key',
				'change:value',
				'change:property',
				'change:staticProperty',
				'change:anotherProperty',
				'change:setSecret',
				'change:hasSecret',

				'set:key',
				'set:value',
				'set:property',
				'set:staticProperty',
				'set:anotherProperty',
				'set:setSecret',
				'set:hasSecret'
			] );
		} );

		for ( const eventName of [ 'key', 'hasSecret' ] ) {
			for ( const eventType of [ 'change', 'set' ] ) {
				let eventDefinition: DeclarationReflection;

				beforeEach( () => {
					eventDefinition = baseClassDefinition.ckeditor5Events
						.find( doclet => doclet.name === `${ eventType }:${ eventName }` )!;
				} );

				it( `should create the "${ eventType }:${ eventName }" event`, () => {
					expect( eventDefinition ).to.not.be.undefined;
					expect( eventDefinition.isCKEditor5Event ).to.equal( true );
					expect( eventDefinition.kind ).to.equal( ReflectionKind.Document );
					expect( eventDefinition.sources ).to.be.an( 'array' );
					expect( eventDefinition.sources ).to.lengthOf( 1 );

					const eventSource = eventDefinition.sources![ 0 ]!;

					expect( eventSource ).to.have.property( 'fileName', 'exampleclass.ts' );
					expect( eventSource ).to.have.property( 'fullFileName' );
					expect( eventSource ).to.have.property( 'line' );
					expect( eventSource ).to.have.property( 'character' );
					expect( eventSource ).to.have.property( 'url' );
				} );

				it( `should define comment in the "${ eventType }:${ eventName }" event`, () => {
					const expectedCommentSummary = `Fired when the \`${ eventName }\` property ` + (
						eventType === 'change' ?
							'changed value.' :
							'is going to be set but is not set yet (before the `change` event is fired).'
					);

					const comment = eventDefinition.comment!;

					expect( comment ).to.have.property( 'summary' );
					expect( comment ).to.have.property( 'blockTags' );
					expect( comment ).to.have.property( 'modifierTags' );

					expect( comment.blockTags ).to.be.an( 'array' );
					expect( comment.blockTags ).to.lengthOf( 0 );
					expect( comment.modifierTags ).to.be.a( 'Set' );
					expect( comment.modifierTags.size ).to.equal( 0 );
					expect( comment.summary ).to.be.an( 'array' );
					expect( comment.summary ).to.lengthOf( 1 );
					expect( comment.summary[ 0 ] ).to.have.property( 'kind', 'text' );
					expect( comment.summary[ 0 ] ).to.have.property( 'text', expectedCommentSummary );
				} );

				it( `should define parameters in the "${ eventType }:${ eventName }" event`, () => {
					expect( eventDefinition.parameters ).to.be.an( 'array' );
					expect( eventDefinition.parameters ).to.lengthOf( 3 );

					const firstParam = eventDefinition.parameters[ 0 ]!;
					const secondParam = eventDefinition.parameters[ 1 ]!;
					const thirdParam = eventDefinition.parameters[ 2 ]!;

					expect( firstParam ).to.have.property( 'name', 'name' );
					expect( firstParam ).to.have.property( 'type' );
					expect( firstParam.type ).to.have.property( 'name', 'string' );
					expect( firstParam ).to.have.property( 'comment' );

					const firstParamComment = firstParam.comment!;

					expect( firstParamComment ).to.have.property( 'summary' );
					expect( firstParamComment.summary ).to.be.an( 'array' );
					expect( firstParamComment.summary[ 0 ] ).to.have.property( 'kind', 'text' );
					expect( firstParamComment.summary[ 0 ] ).to.have.property( 'text',
						`Name of the changed property (\`${ eventName }\`).`
					);

					expect( secondParam ).to.have.property( 'name', 'value' );
					expect( secondParam ).to.have.property( 'comment' );

					const secondParamComment = secondParam.comment!;

					expect( secondParamComment ).to.have.property( 'summary' );
					expect( secondParamComment.summary ).to.be.an( 'array' );
					expect( secondParamComment.summary[ 0 ] ).to.have.property( 'kind', 'text' );
					expect( secondParamComment.summary[ 0 ] ).to.have.property( 'text',
						`New value of the \`${ eventName }\` property with given key or \`null\`, if operation should remove property.`
					);

					expect( thirdParam ).to.have.property( 'name', 'oldValue' );
					expect( thirdParam ).to.have.property( 'comment' );

					const thirdParamComment = thirdParam.comment!;

					expect( thirdParamComment ).to.have.property( 'summary' );
					expect( thirdParamComment.summary ).to.be.an( 'array' );
					expect( thirdParamComment.summary[ 0 ] ).to.have.property( 'kind', 'text' );
					expect( thirdParamComment.summary[ 0 ] ).to.have.property( 'text',
						`Old value of the \`${ eventName }\` property with given key or \`null\`, if property was not set before.`
					);
				} );
			}
		}

		it( 'should define the `inheritedFrom` property for an inherited observable property ("change:key" event)', () => {
			const changeKeyEvent = derivedClassDefinition.ckeditor5Events
				.filter( children => children.isCKEditor5Event )
				.find( event => event.name === 'change:key' )!;

			expect( changeKeyEvent ).to.not.be.undefined;
			expect( changeKeyEvent ).to.have.property( 'inheritedFrom' );

			expect( changeKeyEvent.inheritedFrom!.reflection!.parent ).to.equal( baseClassDefinition );
		} );

		it( 'should define the `inheritedFrom` property for an inherited observable property ("set:key" event)', () => {
			const setKeyEvent = derivedClassDefinition.ckeditor5Events
				.filter( children => children.isCKEditor5Event )
				.find( event => event.name === 'set:key' )!;

			expect( setKeyEvent ).to.not.be.undefined;
			expect( setKeyEvent ).to.have.property( 'inheritedFrom' );

			expect( setKeyEvent.inheritedFrom!.reflection!.parent ).to.equal( baseClassDefinition );
		} );
	} );
} );
