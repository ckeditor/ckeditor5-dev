/**
 * @license Copyright (c) 2003-2022, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

const { expect } = require( 'chai' );
const glob = require( 'fast-glob' );
const TypeDoc = require( 'typedoc' );

const utils = require( '../utils' );

describe( 'typedoc-plugins/tag-observable', function() {
	this.timeout( 10 * 1000 );

	let typeDoc, conversionResult;

	const FIXTURES_PATH = utils.normalizePath( utils.ROOT_TEST_DIRECTORY, 'tag-observable', 'fixtures' );

	before( async () => {
		const sourceFilePatterns = [
			utils.normalizePath( FIXTURES_PATH, '**', '*.ts' )
		];

		const files = await glob( sourceFilePatterns );

		typeDoc = new TypeDoc.Application();

		expect( files ).to.not.lengthOf( 0 );

		typeDoc.options.addReader( new TypeDoc.TSConfigReader() );
		typeDoc.options.addReader( new TypeDoc.TypeDocReader() );

		typeDoc.bootstrap( {
			logLevel: 'Error',
			entryPoints: files,
			plugin: [
				require.resolve( '@ckeditor/typedoc-plugins/lib/tag-observable' )
			],
			// TODO: To resolve once the same problem is fixed in the `@ckeditor/ckeditor5-dev-docs` package.
			tsconfig: utils.normalizePath( FIXTURES_PATH, 'tsconfig.json' )
		} );

		conversionResult = typeDoc.convert();

		expect( conversionResult ).to.be.an( 'object' );
	} );

	it( 'should find all observable class properties within the project', () => {
		const reflections = conversionResult.getReflectionsByKind( TypeDoc.ReflectionKind.Property )
			.filter( item => item.comment && item.comment.getTag( '@observable' ) );

		// There should be the following observable properties:
		// - ExampleClass#key
		// - ExampleClass#value
		// - ExampleClass#secret
		// - CustomExampleClass#key (inherited from ExampleClass)
		// - CustomExampleClass#value (inherited from ExampleClass)
		// - CustomExampleClass#property
		// - CustomExampleClass.staticProperty
		expect( reflections ).to.lengthOf( 7 );

		// The order of found reflections does not matter, so just check if all expected observable properties are found.
		expect( reflections ).to.satisfy( reflections => {
			const expected = [
				{ parent: 'ExampleClass', property: 'key' },
				{ parent: 'ExampleClass', property: 'value' },
				{ parent: 'ExampleClass', property: 'secret' },
				{ parent: 'CustomExampleClass', property: 'key' },
				{ parent: 'CustomExampleClass', property: 'value' },
				{ parent: 'CustomExampleClass', property: 'property' },
				{ parent: 'CustomExampleClass', property: 'staticProperty' }
			];

			return expected.every( entry => {
				const found = reflections.some( reflection => {
					return reflection.name === entry.property && reflection.parent.name === entry.parent;
				} );

				if ( !found ) {
					throw new Error( `The "${ entry.parent }#${ entry.property }" property is not detected as observable.` );
				}

				return found;
			} );
		} );
	} );

	describe( 'events', () => {
		let baseClassDefinition, derivedClassDefinition;

		before( () => {
			baseClassDefinition = conversionResult.children
				.find( entry => entry.name === 'exampleclass' ).children
				.find( entry => entry.kindString === 'Class' && entry.name === 'ExampleClass' );

			derivedClassDefinition = conversionResult.children
				.find( entry => entry.name === 'customexampleclass' ).children
				.find( entry => entry.kindString === 'Class' && entry.name === 'CustomExampleClass' );
		} );

		it( 'should find all events in the base class', () => {
			const eventDefinitions = baseClassDefinition.children
				.filter( children => children.name.startsWith( 'event:' ) );

			expect( eventDefinitions ).to.lengthOf( 6 );
			expect( eventDefinitions.find( event => event.name === 'event:change:key' ) ).to.not.be.undefined;
			expect( eventDefinitions.find( event => event.name === 'event:change:value' ) ).to.not.be.undefined;
			expect( eventDefinitions.find( event => event.name === 'event:change:secret' ) ).to.not.be.undefined;
			expect( eventDefinitions.find( event => event.name === 'event:set:key' ) ).to.not.be.undefined;
			expect( eventDefinitions.find( event => event.name === 'event:set:value' ) ).to.not.be.undefined;
			expect( eventDefinitions.find( event => event.name === 'event:set:secret' ) ).to.not.be.undefined;
		} );

		it( 'should find all events in the derived class', () => {
			const eventDefinitions = derivedClassDefinition.children
				.filter( children => children.name.startsWith( 'event:' ) );

			expect( eventDefinitions ).to.lengthOf( 8 );
			expect( eventDefinitions.find( event => event.name === 'event:change:key' ) ).to.not.be.undefined;
			expect( eventDefinitions.find( event => event.name === 'event:change:value' ) ).to.not.be.undefined;
			expect( eventDefinitions.find( event => event.name === 'event:set:key' ) ).to.not.be.undefined;
			expect( eventDefinitions.find( event => event.name === 'event:set:value' ) ).to.not.be.undefined;
			expect( eventDefinitions.find( event => event.name === 'event:change:property' ) ).to.not.be.undefined;
			expect( eventDefinitions.find( event => event.name === 'event:change:staticProperty' ) ).to.not.be.undefined;
			expect( eventDefinitions.find( event => event.name === 'event:set:property' ) ).to.not.be.undefined;
			expect( eventDefinitions.find( event => event.name === 'event:set:staticProperty' ) ).to.not.be.undefined;
		} );

		for ( const eventName of [ 'change', 'set' ] ) {
			it( `should properly define the ${ eventName } event`, () => {
				const eventDefinition = baseClassDefinition.children
					.find( doclet => doclet.name === `event:${ eventName }:key` );

				expect( eventDefinition ).to.not.be.undefined;
				expect( eventDefinition.name ).to.equal( `event:${ eventName }:key` );
				expect( eventDefinition.originalName ).to.equal( `event:${ eventName }:key` );
				expect( eventDefinition.kindString ).to.equal( 'Event' );

				expect( eventDefinition.comment ).to.have.property( 'summary' );
				expect( eventDefinition.comment ).to.have.property( 'blockTags' );
				expect( eventDefinition.comment ).to.have.property( 'modifierTags' );

				expect( eventDefinition.comment.blockTags ).to.be.an( 'array' );
				expect( eventDefinition.comment.blockTags ).to.lengthOf( 0 );
				expect( eventDefinition.comment.modifierTags ).to.be.a( 'Set' );
				expect( eventDefinition.comment.modifierTags.size ).to.equal( 0 );
				expect( eventDefinition.comment.summary ).to.be.an( 'array' );
				expect( eventDefinition.comment.summary ).to.lengthOf( 1 );
				expect( eventDefinition.comment.summary[ 0 ] ).to.have.property( 'kind', 'text' );
				expect( eventDefinition.comment.summary[ 0 ] ).to.have.property( 'text',
					eventName === 'change' ?
						'Fired when the `key` property changed value.' :
						'Fired when the `key` property is going to be set but is not set yet (before the `change` event is fired).'
				);

				expect( eventDefinition.typeParameters ).to.be.an( 'array' );
				expect( eventDefinition.typeParameters ).to.lengthOf( 4 );

				expect( eventDefinition.typeParameters[ 0 ] ).to.have.property( 'name', 'eventInfo' );
				expect( eventDefinition.typeParameters[ 0 ] ).to.have.property( 'comment' );
				expect( eventDefinition.typeParameters[ 0 ].comment ).to.have.property( 'summary' );
				expect( eventDefinition.typeParameters[ 0 ].comment.summary ).to.be.an( 'array' );
				expect( eventDefinition.typeParameters[ 0 ].comment.summary[ 0 ] ).to.have.property( 'kind', 'text' );
				expect( eventDefinition.typeParameters[ 0 ].comment.summary[ 0 ] ).to.have.property( 'text',
					'An object containing information about the fired event.'
				);

				expect( eventDefinition.typeParameters[ 1 ] ).to.have.property( 'name', 'name' );
				expect( eventDefinition.typeParameters[ 1 ] ).to.have.property( 'type' );
				expect( eventDefinition.typeParameters[ 1 ].type ).to.have.property( 'name', 'string' );
				expect( eventDefinition.typeParameters[ 1 ] ).to.have.property( 'comment' );
				expect( eventDefinition.typeParameters[ 1 ].comment ).to.have.property( 'summary' );
				expect( eventDefinition.typeParameters[ 1 ].comment.summary ).to.be.an( 'array' );
				expect( eventDefinition.typeParameters[ 1 ].comment.summary[ 0 ] ).to.have.property( 'kind', 'text' );
				expect( eventDefinition.typeParameters[ 1 ].comment.summary[ 0 ] ).to.have.property( 'text',
					'Name of the changed property (`key`).'
				);

				expect( eventDefinition.typeParameters[ 2 ] ).to.have.property( 'name', 'value' );
				expect( eventDefinition.typeParameters[ 2 ] ).to.have.property( 'comment' );
				expect( eventDefinition.typeParameters[ 2 ].comment ).to.have.property( 'summary' );
				expect( eventDefinition.typeParameters[ 2 ].comment.summary ).to.be.an( 'array' );
				expect( eventDefinition.typeParameters[ 2 ].comment.summary[ 0 ] ).to.have.property( 'kind', 'text' );
				expect( eventDefinition.typeParameters[ 2 ].comment.summary[ 0 ] ).to.have.property( 'text',
					'New value of the `key` property with given key or `null`, if operation should remove property.'
				);

				expect( eventDefinition.typeParameters[ 3 ] ).to.have.property( 'name', 'oldValue' );
				expect( eventDefinition.typeParameters[ 3 ] ).to.have.property( 'comment' );
				expect( eventDefinition.typeParameters[ 3 ].comment ).to.have.property( 'summary' );
				expect( eventDefinition.typeParameters[ 3 ].comment.summary ).to.be.an( 'array' );
				expect( eventDefinition.typeParameters[ 3 ].comment.summary[ 0 ] ).to.have.property( 'kind', 'text' );
				expect( eventDefinition.typeParameters[ 3 ].comment.summary[ 0 ] ).to.have.property( 'text',
					'Old value of the `key` property with given key or `null`, if property was not set before.'
				);

				expect( eventDefinition.sources ).to.be.an( 'array' );
				expect( eventDefinition.sources ).to.lengthOf( 1 );
				expect( eventDefinition.sources[ 0 ] ).to.have.property( 'fileName', 'exampleclass.ts' );
				expect( eventDefinition.sources[ 0 ] ).to.have.property( 'fullFileName' );
				expect( eventDefinition.sources[ 0 ] ).to.have.property( 'line' );
				expect( eventDefinition.sources[ 0 ] ).to.have.property( 'character' );
				expect( eventDefinition.sources[ 0 ] ).to.have.property( 'url' );
			} );
		}
	} );
} );
