/**
 * @license Copyright (c) 2003-2022, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

const sinon = require( 'sinon' );
const { expect } = require( 'chai' );
const glob = require( 'fast-glob' );
const TypeDoc = require( 'typedoc' );

const utils = require( '../utils' );

describe( 'typedoc-plugins/tag-event', function() {
	this.timeout( 10 * 1000 );

	let typeDoc, conversionResult;

	const FIXTURES_PATH = utils.normalizePath( utils.ROOT_TEST_DIRECTORY, 'tag-event', 'fixtures' );

	before( async () => {
		const sourceFilePatterns = [
			utils.normalizePath( FIXTURES_PATH, '**', '*.ts' )
		];

		const files = await glob( sourceFilePatterns );

		typeDoc = new TypeDoc.Application();

		sinon.stub( typeDoc.logger, 'warn' );

		expect( files ).to.not.lengthOf( 0 );

		typeDoc.options.addReader( new TypeDoc.TSConfigReader() );
		typeDoc.options.addReader( new TypeDoc.TypeDocReader() );

		typeDoc.bootstrap( {
			logLevel: 'Warn',
			entryPoints: files,
			plugin: [
				require.resolve( '@ckeditor/typedoc-plugins/lib/tag-event' )
			],
			tsconfig: utils.normalizePath( FIXTURES_PATH, 'tsconfig.json' )
		} );

		conversionResult = typeDoc.convert();

		expect( conversionResult ).to.be.an( 'object' );
	} );

	after( () => {
		sinon.restore();
	} );

	it( 'should find all event tags within the project', () => {
		const eventDefinitions = conversionResult.getReflectionsByKind( TypeDoc.ReflectionKind.All )
			.filter( children => children.kindString === 'Event' );

		// There should be 6 correctly defined events:
		// 1. event-foo
		// 2. event-foo-no-text
		// 3. event-foo-with-params
		// 4. event-foo-in-class-with-fires
		// 5. change:{property}
		// 6. set:{property}
		// 7. event-foo-no-content
		// 8. event-foo-empty-args
		// 9. event-foo-optional-args
		// 10. event-foo-inline-args
		// 11. event-foo-anonymous-args
		// 12. event-foo-anonymous-optional-args
		// 13. event-foo-reference
		expect( eventDefinitions ).to.lengthOf( 13 );
	} );

	it( 'should inform if the class for an event has not been found', () => {
		expect( typeDoc.logger.warn.calledWith( 'Skipping unsupported "event-foo-no-class" event.' ) ).to.be.true;
	} );

	it( 'should first take into account the class that fires the event instead of the default class, if both exist in the module', () => {
		const classDefinition = conversionResult.children
			.find( entry => entry.name === 'customexampleclassfires' ).children
			.find( entry => entry.kindString === 'Class' && entry.name === 'CustomExampleClassFires' );

		const eventDefinition = classDefinition.children
			.find( doclet => doclet.name === 'event-foo-in-class-with-fires' );

		expect( eventDefinition ).to.not.be.undefined;
	} );

	it( 'should associate events to the `Observable` interface if it exists in the module, even if module has default class', () => {
		const interfaceDefinition = conversionResult.children
			.find( entry => entry.name === 'observableinterface' ).children
			.find( entry => entry.kindString === 'Interface' && entry.name === 'Observable' );

		const eventChange = interfaceDefinition.children.find( doclet => doclet.name === 'change:{property}' );
		const eventSet = interfaceDefinition.children.find( doclet => doclet.name === 'set:{property}' );

		expect( eventChange ).to.not.be.undefined;
		expect( eventSet ).to.not.be.undefined;
	} );

	describe( 'event definitions', () => {
		let classDefinition;

		before( () => {
			classDefinition = conversionResult.children
				.find( entry => entry.name === 'customexampleclass' ).children
				.find( entry => entry.kindString === 'Class' && entry.name === 'default' );
		} );

		it( 'should find all event tags within the class', () => {
			const eventDefinitions = classDefinition.children
				.filter( children => children.kindString === 'Event' );

			expect( eventDefinitions ).to.lengthOf( 10 );
		} );

		it( 'should find an event tag without description and parameters', () => {
			const eventDefinition = classDefinition.children.find( doclet => doclet.name === 'event-foo-no-text' );

			expect( eventDefinition ).to.not.be.undefined;
			expect( eventDefinition.name ).to.equal( 'event-foo-no-text' );
			expect( eventDefinition.originalName ).to.equal( 'event-foo-no-text' );
			expect( eventDefinition.kindString ).to.equal( 'Event' );

			expect( eventDefinition.comment ).to.have.property( 'summary' );
			expect( eventDefinition.comment ).to.have.property( 'blockTags' );
			expect( eventDefinition.comment ).to.have.property( 'modifierTags' );

			expect( eventDefinition.comment.summary ).to.be.an( 'array' );
			expect( eventDefinition.comment.summary ).to.lengthOf( 0 );
			expect( eventDefinition.comment.blockTags ).to.be.an( 'array' );
			expect( eventDefinition.comment.blockTags ).to.lengthOf( 1 );
			expect( eventDefinition.comment.blockTags[ 0 ] ).to.have.property( 'tag', '@eventName' );
			expect( eventDefinition.comment.modifierTags ).to.be.a( 'Set' );
			expect( eventDefinition.comment.modifierTags.size ).to.equal( 0 );

			expect( eventDefinition.sources ).to.be.an( 'array' );
			expect( eventDefinition.sources ).to.lengthOf( 1 );
			expect( eventDefinition.sources[ 0 ] ).to.have.property( 'fileName', 'customexampleclass.ts' );
			expect( eventDefinition.sources[ 0 ] ).to.have.property( 'fullFileName' );
			expect( eventDefinition.sources[ 0 ] ).to.have.property( 'line' );
			expect( eventDefinition.sources[ 0 ] ).to.have.property( 'character' );
			expect( eventDefinition.sources[ 0 ] ).to.have.property( 'url' );

			expect( eventDefinition.typeParameters ).to.be.undefined;
		} );

		it( 'should find an event tag with description and without parameters', () => {
			const eventDefinition = classDefinition.children.find( doclet => doclet.name === 'event-foo' );

			expect( eventDefinition ).to.not.be.undefined;
			expect( eventDefinition.name ).to.equal( 'event-foo' );
			expect( eventDefinition.originalName ).to.equal( 'event-foo' );
			expect( eventDefinition.kindString ).to.equal( 'Event' );

			expect( eventDefinition.comment ).to.have.property( 'summary' );
			expect( eventDefinition.comment ).to.have.property( 'blockTags' );
			expect( eventDefinition.comment ).to.have.property( 'modifierTags' );

			expect( eventDefinition.comment.summary ).to.be.an( 'array' );
			expect( eventDefinition.comment.summary ).to.lengthOf( 1 );
			expect( eventDefinition.comment.summary[ 0 ] ).to.have.property( 'kind', 'text' );
			expect( eventDefinition.comment.summary[ 0 ] ).to.have.property( 'text', 'An event associated with the type.' );
			expect( eventDefinition.comment.blockTags ).to.be.an( 'array' );
			expect( eventDefinition.comment.blockTags ).to.lengthOf( 1 );
			expect( eventDefinition.comment.blockTags[ 0 ] ).to.have.property( 'tag', '@eventName' );
			expect( eventDefinition.comment.modifierTags ).to.be.a( 'Set' );
			expect( eventDefinition.comment.modifierTags.size ).to.equal( 0 );

			expect( eventDefinition.typeParameters ).to.be.undefined;
		} );

		it( 'should find an event tag with description and parameters', () => {
			const eventDefinition = classDefinition.children.find( doclet => doclet.name === 'event-foo-with-params' );

			expect( eventDefinition ).to.not.be.undefined;
			expect( eventDefinition.name ).to.equal( 'event-foo-with-params' );
			expect( eventDefinition.originalName ).to.equal( 'event-foo-with-params' );
			expect( eventDefinition.kindString ).to.equal( 'Event' );

			expect( eventDefinition.comment ).to.have.property( 'summary' );
			expect( eventDefinition.comment ).to.have.property( 'blockTags' );
			expect( eventDefinition.comment ).to.have.property( 'modifierTags' );

			expect( eventDefinition.comment.summary ).to.be.an( 'array' );
			expect( eventDefinition.comment.summary ).to.lengthOf( 5 );

			expect( eventDefinition.comment.summary[ 0 ] ).to.have.property( 'kind', 'text' );
			expect( eventDefinition.comment.summary[ 0 ] ).to.have.property( 'text',
				'An event associated with the type. Event with three params.\n\nSee '
			);

			expect( eventDefinition.comment.summary[ 1 ] ).to.have.property( 'kind', 'inline-tag' );
			expect( eventDefinition.comment.summary[ 1 ] ).to.have.property( 'tag', '@link' );
			expect( eventDefinition.comment.summary[ 1 ] ).to.have.property( 'text', '~CustomExampleClass' );

			expect( eventDefinition.comment.summary[ 2 ] ).to.have.property( 'kind', 'text' );
			expect( eventDefinition.comment.summary[ 2 ] ).to.have.property( 'text', ' or ' );

			expect( eventDefinition.comment.summary[ 3 ] ).to.have.property( 'kind', 'inline-tag' );
			expect( eventDefinition.comment.summary[ 3 ] ).to.have.property( 'tag', '@link' );
			expect( eventDefinition.comment.summary[ 3 ] ).to.have.property( 'text',
				'module:fixtures/customexampleclass~CustomExampleClass Custom label'
			);

			expect( eventDefinition.comment.summary[ 4 ] ).to.have.property( 'kind', 'text' );
			expect( eventDefinition.comment.summary[ 4 ] ).to.have.property( 'text', '. A text after.' );

			expect( eventDefinition.comment.blockTags ).to.be.an( 'array' );
			expect( eventDefinition.comment.blockTags ).to.lengthOf( 5 );
			expect( eventDefinition.comment.blockTags[ 0 ] ).to.have.property( 'tag', '@eventName' );
			expect( eventDefinition.comment.blockTags[ 1 ] ).to.have.property( 'tag', '@param' );
			expect( eventDefinition.comment.blockTags[ 2 ] ).to.have.property( 'tag', '@param' );
			expect( eventDefinition.comment.blockTags[ 3 ] ).to.have.property( 'tag', '@param' );
			expect( eventDefinition.comment.blockTags[ 4 ] ).to.have.property( 'tag', '@deprecated' );

			expect( eventDefinition.comment.modifierTags ).to.be.a( 'Set' );
			expect( eventDefinition.comment.modifierTags.size ).to.equal( 0 );

			expect( eventDefinition.typeParameters ).to.be.an( 'array' );
			expect( eventDefinition.typeParameters ).to.lengthOf( 3 );

			expect( eventDefinition.typeParameters[ 0 ] ).to.have.property( 'name', 'p1' );
			expect( eventDefinition.typeParameters[ 0 ] ).to.have.property( 'comment' );
			expect( eventDefinition.typeParameters[ 0 ].comment ).to.have.property( 'summary' );
			expect( eventDefinition.typeParameters[ 0 ].comment.summary ).to.be.an( 'array' );
			expect( eventDefinition.typeParameters[ 0 ].comment.summary[ 0 ] ).to.have.property( 'kind', 'text' );
			expect( eventDefinition.typeParameters[ 0 ].comment.summary[ 0 ] ).to.have.property( 'text', 'Description for first param.' );

			expect( eventDefinition.typeParameters[ 1 ] ).to.have.property( 'name', 'p2' );
			expect( eventDefinition.typeParameters[ 1 ] ).to.have.property( 'comment' );
			expect( eventDefinition.typeParameters[ 1 ].comment ).to.have.property( 'summary' );
			expect( eventDefinition.typeParameters[ 1 ].comment.summary ).to.be.an( 'array' );
			expect( eventDefinition.typeParameters[ 1 ].comment.summary[ 0 ] ).to.have.property( 'kind', 'text' );
			expect( eventDefinition.typeParameters[ 1 ].comment.summary[ 0 ] ).to.have.property( 'text', 'Description for second param.' );

			expect( eventDefinition.typeParameters[ 2 ] ).to.have.property( 'name', 'p3' );
			expect( eventDefinition.typeParameters[ 2 ] ).to.have.property( 'comment' );
			expect( eventDefinition.typeParameters[ 2 ].comment ).to.have.property( 'summary' );
			expect( eventDefinition.typeParameters[ 2 ].comment.summary ).to.be.an( 'array' );
			expect( eventDefinition.typeParameters[ 2 ].comment.summary ).to.lengthOf( 5 );

			expect( eventDefinition.typeParameters[ 2 ].comment.summary[ 0 ] ).to.have.property( 'kind', 'text' );
			expect( eventDefinition.typeParameters[ 2 ].comment.summary[ 0 ] ).to.have.property( 'text', 'Complex ' );

			expect( eventDefinition.typeParameters[ 2 ].comment.summary[ 1 ] ).to.have.property( 'kind', 'inline-tag' );
			expect( eventDefinition.typeParameters[ 2 ].comment.summary[ 1 ] ).to.have.property( 'tag', '@link' );
			expect( eventDefinition.typeParameters[ 2 ].comment.summary[ 1 ] ).to.have.property( 'text',
				'module:utils/object~Object description'
			);

			expect( eventDefinition.typeParameters[ 2 ].comment.summary[ 2 ] ).to.have.property( 'kind', 'text' );
			expect( eventDefinition.typeParameters[ 2 ].comment.summary[ 2 ] ).to.have.property( 'text', ' for ' );

			expect( eventDefinition.typeParameters[ 2 ].comment.summary[ 3 ] ).to.have.property( 'kind', 'code' );
			expect( eventDefinition.typeParameters[ 2 ].comment.summary[ 3 ] ).to.have.property( 'text', '`third param`' );

			expect( eventDefinition.typeParameters[ 2 ].comment.summary[ 4 ] ).to.have.property( 'kind', 'text' );
			expect( eventDefinition.typeParameters[ 2 ].comment.summary[ 4 ] ).to.have.property( 'text', '.' );
		} );

		describe( 'event parameters', () => {
			it( 'should convert event parameters from the "args" property', () => {
				const eventDefinition = classDefinition.children.find( doclet => doclet.name === 'event-foo-with-params' );

				expect( eventDefinition ).to.not.be.undefined;
				expect( eventDefinition.typeParameters ).to.be.an( 'array' );
				expect( eventDefinition.typeParameters ).to.lengthOf( 3 );

				expect( eventDefinition.typeParameters[ 0 ] ).to.have.property( 'name', 'p1' );
				expect( eventDefinition.typeParameters[ 0 ] ).to.have.property( 'type' );
				expect( eventDefinition.typeParameters[ 0 ].type ).to.have.property( 'type', 'named-tuple-member' );
				expect( eventDefinition.typeParameters[ 0 ].type ).to.have.property( 'element' );
				expect( eventDefinition.typeParameters[ 0 ].type.element ).to.have.property( 'type', 'intrinsic' );
				expect( eventDefinition.typeParameters[ 0 ].type.element ).to.have.property( 'name', 'string' );

				expect( eventDefinition.typeParameters[ 1 ] ).to.have.property( 'name', 'p2' );
				expect( eventDefinition.typeParameters[ 1 ] ).to.have.property( 'type' );
				expect( eventDefinition.typeParameters[ 1 ].type ).to.have.property( 'type', 'named-tuple-member' );
				expect( eventDefinition.typeParameters[ 1 ].type ).to.have.property( 'element' );
				expect( eventDefinition.typeParameters[ 1 ].type.element ).to.have.property( 'type', 'intrinsic' );
				expect( eventDefinition.typeParameters[ 1 ].type.element ).to.have.property( 'name', 'number' );

				expect( eventDefinition.typeParameters[ 2 ] ).to.have.property( 'name', 'p3' );
				expect( eventDefinition.typeParameters[ 2 ] ).to.have.property( 'type' );
				expect( eventDefinition.typeParameters[ 2 ].type ).to.have.property( 'type', 'named-tuple-member' );
				expect( eventDefinition.typeParameters[ 2 ].type ).to.have.property( 'element' );
				expect( eventDefinition.typeParameters[ 2 ].type.element ).to.have.property( 'type', 'reference' );
				expect( eventDefinition.typeParameters[ 2 ].type.element ).to.have.property( 'name', 'ExampleType' );
			} );

			it( 'should not add type parameters for event without content', () => {
				const eventDefinition = classDefinition.children.find( doclet => doclet.name === 'event-foo-no-content' );

				expect( eventDefinition ).to.not.be.undefined;
				expect( eventDefinition.typeParameters ).to.be.undefined;
			} );

			it( 'should not add type parameters for event with empty args', () => {
				const eventDefinition = classDefinition.children.find( doclet => doclet.name === 'event-foo-empty-args' );

				expect( eventDefinition ).to.not.be.undefined;
				expect( eventDefinition.typeParameters ).to.be.undefined;
			} );

			it( 'should convert optional event parameter', () => {
				const eventDefinition = classDefinition.children.find( doclet => doclet.name === 'event-foo-optional-args' );

				expect( eventDefinition ).to.not.be.undefined;
				expect( eventDefinition.typeParameters ).to.be.an( 'array' );
				expect( eventDefinition.typeParameters ).to.lengthOf( 2 );

				expect( eventDefinition.typeParameters[ 0 ] ).to.have.property( 'name', 'p1' );
				expect( eventDefinition.typeParameters[ 0 ] ).to.have.property( 'flags' );
				expect( eventDefinition.typeParameters[ 0 ].flags ).to.have.property( 'isOptional', false );
				expect( eventDefinition.typeParameters[ 0 ] ).to.have.property( 'type' );
				expect( eventDefinition.typeParameters[ 0 ].type ).to.have.property( 'type', 'named-tuple-member' );
				expect( eventDefinition.typeParameters[ 0 ].type ).to.have.property( 'element' );
				expect( eventDefinition.typeParameters[ 0 ].type.element ).to.have.property( 'type', 'intrinsic' );
				expect( eventDefinition.typeParameters[ 0 ].type.element ).to.have.property( 'name', 'string' );

				expect( eventDefinition.typeParameters[ 1 ] ).to.have.property( 'name', 'p2' );
				expect( eventDefinition.typeParameters[ 1 ] ).to.have.property( 'flags' );
				expect( eventDefinition.typeParameters[ 1 ].flags ).to.have.property( 'isOptional', true );
				expect( eventDefinition.typeParameters[ 1 ] ).to.have.property( 'type' );
				expect( eventDefinition.typeParameters[ 1 ].type ).to.have.property( 'type', 'named-tuple-member' );
				expect( eventDefinition.typeParameters[ 1 ].type ).to.have.property( 'element' );
				expect( eventDefinition.typeParameters[ 1 ].type.element ).to.have.property( 'type', 'intrinsic' );
				expect( eventDefinition.typeParameters[ 1 ].type.element ).to.have.property( 'name', 'number' );
			} );

			it( 'should convert event parameter with name taken from @param tag', () => {
				const eventDefinition = classDefinition.children.find( doclet => doclet.name === 'event-foo-inline-args' );

				expect( eventDefinition ).to.not.be.undefined;
				expect( eventDefinition.typeParameters ).to.be.an( 'array' );
				expect( eventDefinition.typeParameters ).to.lengthOf( 1 );

				expect( eventDefinition.typeParameters[ 0 ] ).to.have.property( 'name', 'p1' );
				expect( eventDefinition.typeParameters[ 0 ] ).to.have.property( 'type' );
				expect( eventDefinition.typeParameters[ 0 ].type ).to.have.property( 'type', 'reflection' );
				expect( eventDefinition.typeParameters[ 0 ].type ).to.have.property( 'declaration' );
				expect( eventDefinition.typeParameters[ 0 ].type.declaration ).to.have.property( 'kindString', 'Type literal' );
			} );

			it( 'should convert event parameter without a name', () => {
				const eventDefinition = classDefinition.children.find( doclet => doclet.name === 'event-foo-anonymous-args' );

				expect( eventDefinition ).to.not.be.undefined;
				expect( eventDefinition.typeParameters ).to.be.an( 'array' );
				expect( eventDefinition.typeParameters ).to.lengthOf( 2 );

				expect( eventDefinition.typeParameters[ 0 ] ).to.have.property( 'name', '<anonymous>' );
				expect( eventDefinition.typeParameters[ 0 ] ).to.have.property( 'type' );
				expect( eventDefinition.typeParameters[ 0 ].type ).to.have.property( 'type', 'intrinsic' );
				expect( eventDefinition.typeParameters[ 0 ].type ).to.have.property( 'name', 'number' );

				expect( eventDefinition.typeParameters[ 1 ] ).to.have.property( 'name', '<anonymous>' );
				expect( eventDefinition.typeParameters[ 1 ] ).to.have.property( 'type' );
				expect( eventDefinition.typeParameters[ 1 ].type ).to.have.property( 'type', 'reflection' );
				expect( eventDefinition.typeParameters[ 1 ].type ).to.have.property( 'declaration' );
				expect( eventDefinition.typeParameters[ 1 ].type.declaration ).to.have.property( 'kindString', 'Type literal' );
			} );

			it( 'should convert optional event parameter without a name', () => {
				const eventDefinition = classDefinition.children.find( doclet => doclet.name === 'event-foo-anonymous-optional-args' );

				expect( eventDefinition ).to.not.be.undefined;
				expect( eventDefinition.typeParameters ).to.be.an( 'array' );
				expect( eventDefinition.typeParameters ).to.lengthOf( 2 );

				expect( eventDefinition.typeParameters[ 0 ] ).to.have.property( 'name', '<anonymous>' );
				expect( eventDefinition.typeParameters[ 0 ] ).to.have.property( 'flags' );
				expect( eventDefinition.typeParameters[ 0 ].flags ).to.have.property( 'isOptional', true );
				expect( eventDefinition.typeParameters[ 0 ] ).to.have.property( 'type' );
				expect( eventDefinition.typeParameters[ 0 ].type ).to.have.property( 'type', 'optional' );
				expect( eventDefinition.typeParameters[ 0 ].type ).to.have.property( 'elementType' );
				expect( eventDefinition.typeParameters[ 0 ].type.elementType ).to.have.property( 'type', 'intrinsic' );
				expect( eventDefinition.typeParameters[ 0 ].type.elementType ).to.have.property( 'name', 'number' );

				expect( eventDefinition.typeParameters[ 1 ] ).to.have.property( 'name', '<anonymous>' );
				expect( eventDefinition.typeParameters[ 1 ] ).to.have.property( 'flags' );
				expect( eventDefinition.typeParameters[ 1 ].flags ).to.have.property( 'isOptional', true );
				expect( eventDefinition.typeParameters[ 1 ] ).to.have.property( 'type' );
				expect( eventDefinition.typeParameters[ 1 ].type ).to.have.property( 'type', 'optional' );
				expect( eventDefinition.typeParameters[ 1 ].type ).to.have.property( 'elementType' );
				expect( eventDefinition.typeParameters[ 1 ].type.elementType ).to.have.property( 'type', 'reflection' );
				expect( eventDefinition.typeParameters[ 1 ].type.elementType ).to.have.property( 'declaration' );
				expect( eventDefinition.typeParameters[ 1 ].type.elementType.declaration ).to.have.property( 'kindString', 'Type literal' );
			} );

			it( 'should convert event parameter that is a reference to another type', () => {
				const eventDefinition = classDefinition.children.find( doclet => doclet.name === 'event-foo-reference' );

				expect( eventDefinition ).to.not.be.undefined;
				expect( eventDefinition.typeParameters ).to.be.an( 'array' );
				expect( eventDefinition.typeParameters ).to.lengthOf( 2 );

				expect( eventDefinition.typeParameters[ 0 ] ).to.have.property( 'name', 'p1' );
				expect( eventDefinition.typeParameters[ 0 ] ).to.have.property( 'type' );
				expect( eventDefinition.typeParameters[ 0 ].type ).to.have.property( 'type', 'named-tuple-member' );
				expect( eventDefinition.typeParameters[ 0 ].type ).to.have.property( 'element' );
				expect( eventDefinition.typeParameters[ 0 ].type.element ).to.have.property( 'type', 'intrinsic' );
				expect( eventDefinition.typeParameters[ 0 ].type.element ).to.have.property( 'name', 'string' );

				expect( eventDefinition.typeParameters[ 1 ] ).to.have.property( 'name', 'p2' );
				expect( eventDefinition.typeParameters[ 1 ] ).to.have.property( 'type' );
				expect( eventDefinition.typeParameters[ 1 ].type ).to.have.property( 'type', 'named-tuple-member' );
				expect( eventDefinition.typeParameters[ 1 ].type ).to.have.property( 'element' );
				expect( eventDefinition.typeParameters[ 1 ].type.element ).to.have.property( 'type', 'reference' );
				expect( eventDefinition.typeParameters[ 1 ].type.element ).to.have.property( 'name', 'ExampleType' );
			} );
		} );
	} );
} );
