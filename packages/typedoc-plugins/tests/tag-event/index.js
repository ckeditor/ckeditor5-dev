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
			// TODO: To resolve once the same problem is fixed in the `@ckeditor/ckeditor5-dev-docs` package.
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
			.filter( children => children.name.startsWith( 'event:' ) );

		// There should be 3 correctly defined events:
		// 1. event-foo
		// 2. event-foo-no-text
		// 3. event-foo-with-params
		// 4. event-foo-in-class-with-fires
		expect( eventDefinitions ).to.lengthOf( 4 );
	} );

	it( 'should inform if the class for an event has not been found', () => {
		expect( typeDoc.logger.warn.calledOnce ).to.equal( true );
		expect( typeDoc.logger.warn.firstCall.args[ 0 ] ).to.equal( 'Skipping unsupported "event-foo-no-class" event.' );
		expect( typeDoc.logger.warn.firstCall.args[ 1 ] ).to.have.property( 'name' );
		expect( typeDoc.logger.warn.firstCall.args[ 1 ].name ).to.have.property( 'escapedText', 'EventFooNoText' );
	} );

	it( 'should first take into account the class that fires the event instead of the default class, if both exist in the module', () => {
		const classDefinition = conversionResult.children
			.find( entry => entry.name === 'customexampleclassfires' ).children
			.find( entry => entry.kindString === 'Class' && entry.name === 'CustomExampleClassFires' );

		const eventDefinition = classDefinition.children
			.find( doclet => doclet.name === 'event:event-foo-in-class-with-fires' );

		expect( eventDefinition ).to.not.be.undefined;
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
				.filter( children => children.name.startsWith( 'event:' ) );

			expect( eventDefinitions ).to.lengthOf( 3 );
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
			expect( eventDefinition.comment.blockTags ).to.lengthOf( 0 );
			expect( eventDefinition.comment.modifierTags ).to.be.a( 'Set' );
			expect( eventDefinition.comment.modifierTags.size ).to.equal( 0 );

			expect( eventDefinition.sources ).to.be.an( 'array' );
			expect( eventDefinition.sources ).to.lengthOf( 1 );
			expect( eventDefinition.sources[ 0 ] ).to.have.property( 'fileName', 'customexampleclass.ts' );
			expect( eventDefinition.sources[ 0 ] ).to.have.property( 'fullFileName' );
			expect( eventDefinition.sources[ 0 ] ).to.have.property( 'line' );
			expect( eventDefinition.sources[ 0 ] ).to.have.property( 'character' );
			expect( eventDefinition.sources[ 0 ] ).to.have.property( 'url' );

			expect( eventDefinition.typeParameters ).to.be.an( 'array' );
			expect( eventDefinition.typeParameters ).to.lengthOf( 1 );

			expect( eventDefinition.typeParameters[ 0 ] ).to.have.property( 'name', 'eventInfo' );
			expect( eventDefinition.typeParameters[ 0 ] ).to.have.property( 'comment' );
			expect( eventDefinition.typeParameters[ 0 ].comment ).to.have.property( 'summary' );
			expect( eventDefinition.typeParameters[ 0 ].comment.summary ).to.be.an( 'array' );
			expect( eventDefinition.typeParameters[ 0 ].comment.summary[ 0 ] ).to.have.property( 'kind', 'text' );
			expect( eventDefinition.typeParameters[ 0 ].comment.summary[ 0 ] ).to.have.property( 'text',
				'An object containing information about the fired event.'
			);
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
			expect( eventDefinition.comment.blockTags ).to.lengthOf( 0 );
			expect( eventDefinition.comment.modifierTags ).to.be.a( 'Set' );
			expect( eventDefinition.comment.modifierTags.size ).to.equal( 0 );

			expect( eventDefinition.typeParameters ).to.be.an( 'array' );
			expect( eventDefinition.typeParameters ).to.lengthOf( 1 );

			expect( eventDefinition.typeParameters[ 0 ] ).to.have.property( 'name', 'eventInfo' );
			expect( eventDefinition.typeParameters[ 0 ] ).to.have.property( 'comment' );
			expect( eventDefinition.typeParameters[ 0 ].comment ).to.have.property( 'summary' );
			expect( eventDefinition.typeParameters[ 0 ].comment.summary ).to.be.an( 'array' );
			expect( eventDefinition.typeParameters[ 0 ].comment.summary[ 0 ] ).to.have.property( 'kind', 'text' );
			expect( eventDefinition.typeParameters[ 0 ].comment.summary[ 0 ] ).to.have.property( 'text',
				'An object containing information about the fired event.'
			);
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
			expect( eventDefinition.comment.blockTags ).to.lengthOf( 0 );
			expect( eventDefinition.comment.modifierTags ).to.be.a( 'Set' );
			expect( eventDefinition.comment.modifierTags.size ).to.equal( 0 );

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

			expect( eventDefinition.typeParameters[ 1 ] ).to.have.property( 'name', 'p1' );
			expect( eventDefinition.typeParameters[ 1 ] ).to.have.property( 'comment' );
			expect( eventDefinition.typeParameters[ 1 ].comment ).to.have.property( 'summary' );
			expect( eventDefinition.typeParameters[ 1 ].comment.summary ).to.be.an( 'array' );
			expect( eventDefinition.typeParameters[ 1 ].comment.summary[ 0 ] ).to.have.property( 'kind', 'text' );
			expect( eventDefinition.typeParameters[ 1 ].comment.summary[ 0 ] ).to.have.property( 'text', 'Description for first param.' );

			expect( eventDefinition.typeParameters[ 2 ] ).to.have.property( 'name', 'p2' );
			expect( eventDefinition.typeParameters[ 2 ] ).to.have.property( 'comment' );
			expect( eventDefinition.typeParameters[ 2 ].comment ).to.have.property( 'summary' );
			expect( eventDefinition.typeParameters[ 2 ].comment.summary ).to.be.an( 'array' );
			expect( eventDefinition.typeParameters[ 2 ].comment.summary[ 0 ] ).to.have.property( 'kind', 'text' );
			expect( eventDefinition.typeParameters[ 2 ].comment.summary[ 0 ] ).to.have.property( 'text', 'Description for second param.' );

			expect( eventDefinition.typeParameters[ 3 ] ).to.have.property( 'name', 'p3' );
			expect( eventDefinition.typeParameters[ 3 ] ).to.have.property( 'comment' );
			expect( eventDefinition.typeParameters[ 3 ].comment ).to.have.property( 'summary' );
			expect( eventDefinition.typeParameters[ 3 ].comment.summary ).to.be.an( 'array' );
			expect( eventDefinition.typeParameters[ 3 ].comment.summary ).to.lengthOf( 5 );

			expect( eventDefinition.typeParameters[ 3 ].comment.summary[ 0 ] ).to.have.property( 'kind', 'text' );
			expect( eventDefinition.typeParameters[ 3 ].comment.summary[ 0 ] ).to.have.property( 'text', 'Complex ' );

			expect( eventDefinition.typeParameters[ 3 ].comment.summary[ 1 ] ).to.have.property( 'kind', 'inline-tag' );
			expect( eventDefinition.typeParameters[ 3 ].comment.summary[ 1 ] ).to.have.property( 'tag', '@link' );
			expect( eventDefinition.typeParameters[ 3 ].comment.summary[ 1 ] ).to.have.property( 'text',
				'module:utils/object~Object description'
			);

			expect( eventDefinition.typeParameters[ 3 ].comment.summary[ 2 ] ).to.have.property( 'kind', 'text' );
			expect( eventDefinition.typeParameters[ 3 ].comment.summary[ 2 ] ).to.have.property( 'text', ' for ' );

			expect( eventDefinition.typeParameters[ 3 ].comment.summary[ 3 ] ).to.have.property( 'kind', 'code' );
			expect( eventDefinition.typeParameters[ 3 ].comment.summary[ 3 ] ).to.have.property( 'text', '`third param`' );

			expect( eventDefinition.typeParameters[ 3 ].comment.summary[ 4 ] ).to.have.property( 'kind', 'text' );
			expect( eventDefinition.typeParameters[ 3 ].comment.summary[ 4 ] ).to.have.property( 'text', '.' );
		} );
	} );
} );
