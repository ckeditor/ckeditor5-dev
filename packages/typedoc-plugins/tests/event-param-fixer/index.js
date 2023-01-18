/**
 * @license Copyright (c) 2003-2023, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

const sinon = require( 'sinon' );
const { expect } = require( 'chai' );
const glob = require( 'fast-glob' );
const TypeDoc = require( 'typedoc' );

const utils = require( '../utils' );

describe( 'typedoc-plugins/event-param-fixer', function() {
	this.timeout( 10 * 1000 );

	let typeDoc, conversionResult, files;

	const FIXTURES_PATH = utils.normalizePath( utils.ROOT_TEST_DIRECTORY, 'event-param-fixer', 'fixtures' );
	const TSCONFIG_PATH = utils.normalizePath( FIXTURES_PATH, 'tsconfig.json' );
	const PLUGINS = [
		'typedoc-plugin-rename-defaults',
		require.resolve( '@ckeditor/typedoc-plugins/lib/module-fixer' ),
		require.resolve( '@ckeditor/typedoc-plugins/lib/tag-event' ),
		require.resolve( '@ckeditor/typedoc-plugins/lib/tag-observable' ),
		require.resolve( '@ckeditor/typedoc-plugins/lib/event-param-fixer' )
	];

	before( async () => {
		files = await glob( utils.normalizePath( FIXTURES_PATH, '**', '*.ts' ) );

		typeDoc = new TypeDoc.Application();
		typeDoc.options.addReader( new TypeDoc.TSConfigReader() );
		typeDoc.options.addReader( new TypeDoc.TypeDocReader() );

		sinon.stub( typeDoc.logger, 'warn' );

		typeDoc.bootstrap( {
			logLevel: 'Warn',
			entryPoints: files,
			plugin: PLUGINS,
			tsconfig: TSCONFIG_PATH
		} );

		conversionResult = typeDoc.convert();

		expect( conversionResult ).to.be.an( 'object' );
	} );

	it( 'should find the "EventInfo" class', () => {
		const eventInfoClass = conversionResult.getChildByName( [ 'utils/eventinfo', 'EventInfo' ] );

		expect( eventInfoClass ).to.not.be.undefined;
		expect( typeDoc.logger.warn.notCalled ).to.equal( true );
	} );

	it( 'should warn if the "EventInfo" class is not found', async () => {
		const typeDoc = new TypeDoc.Application();
		typeDoc.options.addReader( new TypeDoc.TSConfigReader() );
		typeDoc.options.addReader( new TypeDoc.TypeDocReader() );

		sinon.stub( typeDoc.logger, 'warn' );

		typeDoc.bootstrap( {
			logLevel: 'Warn',
			// Do not process the "EventInfo" class.
			entryPoints: files.filter( file => !file.endsWith( 'eventinfo.ts' ) ),
			plugin: PLUGINS,
			tsconfig: TSCONFIG_PATH
		} );

		const eventInfoClass = typeDoc.convert().getChildByName( [ 'utils/eventinfo', 'EventInfo' ] );

		expect( eventInfoClass ).to.be.undefined;
		expect( typeDoc.logger.warn.calledOnce ).to.equal( true );
		expect( typeDoc.logger.warn.firstCall.args[ 0 ] ).to.equal( 'Unable to find the "EventInfo" class.' );
	} );

	describe( 'eventInfo parameter definition', () => {
		let eventFoo, eventFooNoText, eventFooWithParams, eventObservableChange, eventObservableSet, eventInfoClass;

		before( () => {
			eventFoo = conversionResult.getChildByName( [ 'fixtures/example', 'CustomExampleNonDefaultClass', 'event:event-foo' ] );
			eventFooNoText = conversionResult.getChildByName( [ 'fixtures/example', 'ExampleClass', 'event:event-foo-no-text' ] );
			eventFooWithParams = conversionResult.getChildByName( [ 'fixtures/example', 'ExampleClass', 'event:event-foo-with-params' ] );
			eventObservableChange = conversionResult.getChildByName( [ 'fixtures/example', 'ExampleClass', 'event:change:key' ] );
			eventObservableSet = conversionResult.getChildByName( [ 'fixtures/example', 'ExampleClass', 'event:set:key' ] );
			eventInfoClass = conversionResult.getChildByName( [ 'utils/eventinfo', 'EventInfo' ] );

			expect( eventFoo ).to.not.be.undefined;
			expect( eventFooNoText ).to.not.be.undefined;
			expect( eventFooWithParams ).to.not.be.undefined;
			expect( eventObservableChange ).to.not.be.undefined;
			expect( eventObservableSet ).to.not.be.undefined;
			expect( eventInfoClass ).to.not.be.undefined;
		} );

		it( 'should add the "eventInfo" parameter for event without params and without comment', () => {
			expect( eventFooNoText.name ).to.equal( 'event:event-foo-no-text' );
			expect( eventFooNoText.originalName ).to.equal( 'event:event-foo-no-text' );
			expect( eventFooNoText.kindString ).to.equal( 'Event' );

			expect( eventFooNoText.typeParameters ).to.be.an( 'array' );
			expect( eventFooNoText.typeParameters ).to.lengthOf( 1 );

			expect( eventFooNoText.typeParameters[ 0 ] ).to.have.property( 'name', 'eventInfo' );
			expect( eventFooNoText.typeParameters[ 0 ] ).to.have.property( 'originalName', 'eventInfo' );
			expect( eventFooNoText.typeParameters[ 0 ] ).to.have.property( 'type' );
			expect( eventFooNoText.typeParameters[ 0 ].type ).to.have.property( 'type', 'reference' );
			expect( eventFooNoText.typeParameters[ 0 ].type ).to.have.property( 'name', 'EventInfo' );
			expect( eventFooNoText.typeParameters[ 0 ].type ).to.have.property( 'reflection', eventInfoClass );
			expect( eventFooNoText.typeParameters[ 0 ] ).to.have.property( 'comment' );
			expect( eventFooNoText.typeParameters[ 0 ].comment ).to.have.property( 'summary' );
			expect( eventFooNoText.typeParameters[ 0 ].comment.summary ).to.be.an( 'array' );
			expect( eventFooNoText.typeParameters[ 0 ].comment.summary[ 0 ] ).to.have.property( 'kind', 'text' );
			expect( eventFooNoText.typeParameters[ 0 ].comment.summary[ 0 ] ).to.have.property( 'text',
				'An object containing information about the fired event.'
			);
		} );

		it( 'should add the "eventInfo" parameter for event without params, but with comment', () => {
			expect( eventFoo.name ).to.equal( 'event:event-foo' );
			expect( eventFoo.originalName ).to.equal( 'event:event-foo' );
			expect( eventFoo.kindString ).to.equal( 'Event' );

			expect( eventFoo.typeParameters ).to.be.an( 'array' );
			expect( eventFoo.typeParameters ).to.lengthOf( 1 );

			expect( eventFoo.typeParameters[ 0 ] ).to.have.property( 'name', 'eventInfo' );
			expect( eventFoo.typeParameters[ 0 ] ).to.have.property( 'originalName', 'eventInfo' );
			expect( eventFoo.typeParameters[ 0 ] ).to.have.property( 'type' );
			expect( eventFoo.typeParameters[ 0 ].type ).to.have.property( 'type', 'reference' );
			expect( eventFoo.typeParameters[ 0 ].type ).to.have.property( 'name', 'EventInfo' );
			expect( eventFoo.typeParameters[ 0 ].type ).to.have.property( 'reflection', eventInfoClass );
			expect( eventFoo.typeParameters[ 0 ] ).to.have.property( 'comment' );
			expect( eventFoo.typeParameters[ 0 ].comment ).to.have.property( 'summary' );
			expect( eventFoo.typeParameters[ 0 ].comment.summary ).to.be.an( 'array' );
			expect( eventFoo.typeParameters[ 0 ].comment.summary[ 0 ] ).to.have.property( 'kind', 'text' );
			expect( eventFoo.typeParameters[ 0 ].comment.summary[ 0 ] ).to.have.property( 'text',
				'An object containing information about the fired event.'
			);
		} );

		it( 'should add the "eventInfo" parameter for event with params and comment', () => {
			expect( eventFooWithParams.name ).to.equal( 'event:event-foo-with-params' );
			expect( eventFooWithParams.originalName ).to.equal( 'event:event-foo-with-params' );
			expect( eventFooWithParams.kindString ).to.equal( 'Event' );

			expect( eventFooWithParams.typeParameters ).to.be.an( 'array' );
			expect( eventFooWithParams.typeParameters ).to.lengthOf( 4 );

			expect( eventFooWithParams.typeParameters[ 0 ] ).to.have.property( 'name', 'eventInfo' );
			expect( eventFooWithParams.typeParameters[ 0 ] ).to.have.property( 'originalName', 'eventInfo' );
			expect( eventFooWithParams.typeParameters[ 0 ] ).to.have.property( 'type' );
			expect( eventFooWithParams.typeParameters[ 0 ].type ).to.have.property( 'type', 'reference' );
			expect( eventFooWithParams.typeParameters[ 0 ].type ).to.have.property( 'name', 'EventInfo' );
			expect( eventFooWithParams.typeParameters[ 0 ].type ).to.have.property( 'reflection', eventInfoClass );
			expect( eventFooWithParams.typeParameters[ 0 ] ).to.have.property( 'comment' );
			expect( eventFooWithParams.typeParameters[ 0 ].comment ).to.have.property( 'summary' );
			expect( eventFooWithParams.typeParameters[ 0 ].comment.summary ).to.be.an( 'array' );
			expect( eventFooWithParams.typeParameters[ 0 ].comment.summary[ 0 ] ).to.have.property( 'kind', 'text' );
			expect( eventFooWithParams.typeParameters[ 0 ].comment.summary[ 0 ] ).to.have.property( 'text',
				'An object containing information about the fired event.'
			);
		} );

		it( 'should add the "eventInfo" parameter for the "change" event for observable property', () => {
			expect( eventObservableChange.name ).to.equal( 'event:change:key' );
			expect( eventObservableChange.originalName ).to.equal( 'event:change:key' );
			expect( eventObservableChange.kindString ).to.equal( 'Event' );

			expect( eventObservableChange.typeParameters ).to.be.an( 'array' );
			expect( eventObservableChange.typeParameters ).to.lengthOf( 4 );

			expect( eventObservableChange.typeParameters[ 0 ] ).to.have.property( 'name', 'eventInfo' );
			expect( eventObservableChange.typeParameters[ 0 ] ).to.have.property( 'originalName', 'eventInfo' );
			expect( eventObservableChange.typeParameters[ 0 ] ).to.have.property( 'type' );
			expect( eventObservableChange.typeParameters[ 0 ].type ).to.have.property( 'type', 'reference' );
			expect( eventObservableChange.typeParameters[ 0 ].type ).to.have.property( 'name', 'EventInfo' );
			expect( eventObservableChange.typeParameters[ 0 ].type ).to.have.property( 'reflection', eventInfoClass );
			expect( eventObservableChange.typeParameters[ 0 ] ).to.have.property( 'comment' );
			expect( eventObservableChange.typeParameters[ 0 ].comment ).to.have.property( 'summary' );
			expect( eventObservableChange.typeParameters[ 0 ].comment.summary ).to.be.an( 'array' );
			expect( eventObservableChange.typeParameters[ 0 ].comment.summary[ 0 ] ).to.have.property( 'kind', 'text' );
			expect( eventObservableChange.typeParameters[ 0 ].comment.summary[ 0 ] ).to.have.property( 'text',
				'An object containing information about the fired event.'
			);
		} );

		it( 'should add the "eventInfo" parameter for the "set" event for observable property', () => {
			expect( eventObservableSet.name ).to.equal( 'event:set:key' );
			expect( eventObservableSet.originalName ).to.equal( 'event:set:key' );
			expect( eventObservableSet.kindString ).to.equal( 'Event' );

			expect( eventObservableSet.typeParameters ).to.be.an( 'array' );
			expect( eventObservableSet.typeParameters ).to.lengthOf( 4 );

			expect( eventObservableSet.typeParameters[ 0 ] ).to.have.property( 'name', 'eventInfo' );
			expect( eventObservableSet.typeParameters[ 0 ] ).to.have.property( 'originalName', 'eventInfo' );
			expect( eventObservableSet.typeParameters[ 0 ] ).to.have.property( 'type' );
			expect( eventObservableSet.typeParameters[ 0 ].type ).to.have.property( 'type', 'reference' );
			expect( eventObservableSet.typeParameters[ 0 ].type ).to.have.property( 'name', 'EventInfo' );
			expect( eventObservableSet.typeParameters[ 0 ].type ).to.have.property( 'reflection', eventInfoClass );
			expect( eventObservableSet.typeParameters[ 0 ] ).to.have.property( 'comment' );
			expect( eventObservableSet.typeParameters[ 0 ].comment ).to.have.property( 'summary' );
			expect( eventObservableSet.typeParameters[ 0 ].comment.summary ).to.be.an( 'array' );
			expect( eventObservableSet.typeParameters[ 0 ].comment.summary[ 0 ] ).to.have.property( 'kind', 'text' );
			expect( eventObservableSet.typeParameters[ 0 ].comment.summary[ 0 ] ).to.have.property( 'text',
				'An object containing information about the fired event.'
			);
		} );
	} );
} );
