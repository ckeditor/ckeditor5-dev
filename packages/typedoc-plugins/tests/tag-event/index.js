/**
 * @license Copyright (c) 2003-2023, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

const sinon = require( 'sinon' );
const { expect } = require( 'chai' );
const glob = require( 'fast-glob' );
const TypeDoc = require( 'typedoc' );

const utils = require( '../utils' );
const { plugins } = require( '../../lib' );

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
				'typedoc-plugin-rename-defaults',
				plugins[ 'typedoc-plugin-tag-event' ]
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

		expect( eventDefinitions ).to.lengthOf( 20 );

		// The order of found events does not matter, so just check if all of them are found.
		expect( eventDefinitions.find( event => event.name === 'event:event-foo' ) ).to.not.be.undefined;
		expect( eventDefinitions.find( event => event.name === 'event:event-foo-no-text' ) ).to.not.be.undefined;
		expect( eventDefinitions.find( event => event.name === 'event:event-foo-with-params' ) ).to.not.be.undefined;
		expect( eventDefinitions.find( event => event.name === 'event:event-foo-no-content' ) ).to.not.be.undefined;
		expect( eventDefinitions.find( event => event.name === 'event:event-foo-empty-args' ) ).to.not.be.undefined;
		expect( eventDefinitions.find( event => event.name === 'event:event-foo-optional-args' ) ).to.not.be.undefined;
		expect( eventDefinitions.find( event => event.name === 'event:event-foo-inline-args' ) ).to.not.be.undefined;
		expect( eventDefinitions.find( event => event.name === 'event:event-foo-anonymous-args' ) ).to.not.be.undefined;
		expect( eventDefinitions.find( event => event.name === 'event:event-foo-anonymous-optional-args' ) ).to.not.be.undefined;
		expect( eventDefinitions.find( event => event.name === 'event:event-foo-reference' ) ).to.not.be.undefined;
		expect( eventDefinitions.find( event => event.name === 'event:event-foo-generic-from-type-arg' ) ).to.not.be.undefined;
		expect( eventDefinitions.find( event => event.name === 'event:event-foo-generic-from-base-type' ) ).to.not.be.undefined;
		expect( eventDefinitions.find( event => event.name === 'event:event-foo-complex' ) ).to.not.be.undefined;
		expect( eventDefinitions.find( event => event.name === 'event:event-foo-absolute' ) ).to.not.be.undefined;
		expect( eventDefinitions.find( event => event.name === 'event:event-foo-absolute-with-prefix' ) ).to.not.be.undefined;
		expect( eventDefinitions.find( event => event.name === 'event:event-change:{property}' ) ).to.not.be.undefined;
		expect( eventDefinitions.find( event => event.name === 'event:event-set:{property}' ) ).to.not.be.undefined;
		expect( eventDefinitions.find( event => event.name === 'event:multiple-names' ) ).to.not.be.undefined;
		expect( eventDefinitions.find( event => event.name === 'event:multiple-names:variant' ) ).to.not.be.undefined;
		expect( eventDefinitions.find( event => event.name === 'event:multiple-names:variant:subvariant' ) ).to.not.be.undefined;
	} );

	it( 'should find all event tags within the interface', () => {
		const eventDefinitions = conversionResult.children
			.find( entry => entry.name === 'exampleinterface' ).children
			.find( entry => entry.kindString === 'Interface' && entry.name === 'ExampleInterface' ).children
			.filter( children => children.kindString === 'Event' );

		expect( eventDefinitions ).to.lengthOf( 2 );
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
			expect( typeDoc.logger.warn.calledWith( `Skipping unsupported "${ eventName }" event.` ) ).to.be.true;
		}
	} );

	describe( 'event definitions', () => {
		let classDefinition;

		before( () => {
			classDefinition = conversionResult.children
				.find( entry => entry.name === 'eventsvalid' ).children
				.find( entry => entry.kindString === 'Class' && entry.name === 'EventsValidClass' );
		} );

		it( 'should find an event tag without description and parameters', () => {
			const eventDefinition = classDefinition.children.find( doclet => doclet.name === 'event:event-foo-no-text' );

			expect( eventDefinition ).to.not.be.undefined;
			expect( eventDefinition.name ).to.equal( 'event:event-foo-no-text' );
			expect( eventDefinition.originalName ).to.equal( 'event:event-foo-no-text' );
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
			expect( eventDefinition.sources[ 0 ] ).to.have.property( 'fileName', 'eventsvalid.ts' );
			expect( eventDefinition.sources[ 0 ] ).to.have.property( 'fullFileName' );
			expect( eventDefinition.sources[ 0 ] ).to.have.property( 'line' );
			expect( eventDefinition.sources[ 0 ] ).to.have.property( 'character' );
			expect( eventDefinition.sources[ 0 ] ).to.have.property( 'url' );

			expect( eventDefinition.typeParameters ).to.be.undefined;
		} );

		it( 'should find an event tag with description and without parameters', () => {
			const eventDefinition = classDefinition.children.find( doclet => doclet.name === 'event:event-foo' );

			expect( eventDefinition ).to.not.be.undefined;
			expect( eventDefinition.name ).to.equal( 'event:event-foo' );
			expect( eventDefinition.originalName ).to.equal( 'event:event-foo' );
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
			const eventDefinition = classDefinition.children.find( doclet => doclet.name === 'event:event-foo-with-params' );

			expect( eventDefinition ).to.not.be.undefined;
			expect( eventDefinition.name ).to.equal( 'event:event-foo-with-params' );
			expect( eventDefinition.originalName ).to.equal( 'event:event-foo-with-params' );
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
			expect( eventDefinition.comment.summary[ 1 ] ).to.have.property( 'text', '~EventsValidClass' );

			expect( eventDefinition.comment.summary[ 2 ] ).to.have.property( 'kind', 'text' );
			expect( eventDefinition.comment.summary[ 2 ] ).to.have.property( 'text', ' or ' );

			expect( eventDefinition.comment.summary[ 3 ] ).to.have.property( 'kind', 'inline-tag' );
			expect( eventDefinition.comment.summary[ 3 ] ).to.have.property( 'tag', '@link' );
			expect( eventDefinition.comment.summary[ 3 ] ).to.have.property( 'text',
				'module:fixtures/eventsvalid~EventsValidClass Custom label'
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
				const eventDefinition = classDefinition.children.find( doclet => doclet.name === 'event:event-foo-with-params' );

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
				const eventDefinition = classDefinition.children.find( doclet => doclet.name === 'event:event-foo-no-content' );

				expect( eventDefinition ).to.not.be.undefined;
				expect( eventDefinition.typeParameters ).to.be.undefined;
			} );

			it( 'should not add type parameters for event with empty args', () => {
				const eventDefinition = classDefinition.children.find( doclet => doclet.name === 'event:event-foo-empty-args' );

				expect( eventDefinition ).to.not.be.undefined;
				expect( eventDefinition.typeParameters ).to.be.undefined;
			} );

			it( 'should convert optional event parameter', () => {
				const eventDefinition = classDefinition.children.find( doclet => doclet.name === 'event:event-foo-optional-args' );

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
				const eventDefinition = classDefinition.children.find( doclet => doclet.name === 'event:event-foo-inline-args' );

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
				const eventDefinition = classDefinition.children.find( doclet => doclet.name === 'event:event-foo-anonymous-args' );

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
				const eventDefinition = classDefinition.children
					.find( doclet => doclet.name === 'event:event-foo-anonymous-optional-args' );

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
				const eventDefinition = classDefinition.children.find( doclet => doclet.name === 'event:event-foo-reference' );

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

			it( 'should convert event parameter that came from a generic event definition (from type argument)', () => {
				const eventDefinition = classDefinition.children.find( doclet => doclet.name === 'event:event-foo-generic-from-type-arg' );

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

			it( 'should convert event parameter that came from a generic event definition (from base type)', () => {
				const eventDefinition = classDefinition.children.find( doclet => doclet.name === 'event:event-foo-generic-from-base-type' );

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

			it( 'should convert a complex event parameter but set its type to any', () => {
				const eventDefinition = classDefinition.children.find( doclet => doclet.name === 'event:event-foo-complex' );

				expect( eventDefinition ).to.not.be.undefined;
				expect( eventDefinition.typeParameters ).to.be.an( 'array' );
				expect( eventDefinition.typeParameters ).to.lengthOf( 1 );

				expect( eventDefinition.typeParameters[ 0 ] ).to.have.property( 'name', '<anonymous>' );
				expect( eventDefinition.typeParameters[ 0 ] ).to.have.property( 'type' );
				expect( eventDefinition.typeParameters[ 0 ].type ).to.have.property( 'type', 'intrinsic' );
				expect( eventDefinition.typeParameters[ 0 ].type ).to.have.property( 'name', 'any' );
			} );
		} );
	} );

	describe( 'multiple event definitions', () => {
		it( 'should properly assign all events', () => {
			const event1 = conversionResult.getChildByName( [
				'eventsvalid',
				'EventsValidClass',
				'event:event-foo-multiple-names'
			] );

			const event2 = conversionResult.getChildByName( [
				'eventsvalid',
				'EventsValidClass',
				'event:event-foo-multiple-names:variant'
			] );

			const event3 = conversionResult.getChildByName( [
				'eventsvalid',
				'EventsValidAnotherClass',
				'event:event-foo-multiple-names:variant:subvariant'
			] );

			expect( event1 ).to.not.be.undefined;
			expect( event2 ).to.not.be.undefined;
			expect( event3 ).to.not.be.undefined;
		} );
	} );
} );
