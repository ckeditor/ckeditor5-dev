/**
 * @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { beforeAll, afterAll, describe, expect, it, vi } from 'vitest';
import { glob } from 'glob';
import upath from 'upath';
import {
	Application,
	ReflectionKind,
	type ProjectReflection,
	type ParameterReflection,
	type DeclarationReflection
} from 'typedoc';

import { ROOT_TEST_DIRECTORY } from '../utils.js';
import {
	typeDocTagEvent,
	typeDocTagObservable,
	typeDocEventParamFixer,
	typeDocRestoreProgramAfterConversion
} from '../../src/index.js';

function assertEventInfoParameter( eventInfoParameter: ParameterReflection, eventInfoClass: DeclarationReflection ) {
	expect( eventInfoParameter ).to.have.property( 'name', 'eventInfo' );
	expect( eventInfoParameter ).to.have.property( 'type' );
	expect( eventInfoParameter.type ).to.have.property( 'type', 'reference' );
	expect( eventInfoParameter.type ).to.have.property( 'name', 'EventInfo' );
	expect( eventInfoParameter.type ).to.have.property( 'reflection', eventInfoClass );
	expect( eventInfoParameter ).to.have.property( 'comment' );
	expect( eventInfoParameter.comment ).to.have.property( 'summary' );
	expect( eventInfoParameter.comment!.summary ).to.be.an( 'array' );
	expect( eventInfoParameter.comment!.summary[ 0 ] ).to.have.property( 'kind', 'text' );
	expect( eventInfoParameter.comment!.summary[ 0 ] ).to.have.property( 'text',
		'An object containing information about the fired event.'
	);
}

describe( 'typedoc-plugins/event-param-fixer', () => {
	let conversionResult: ProjectReflection,
		entryPoints: Array<string>,
		warnSpy: any;

	const FIXTURES_PATH = upath.join( ROOT_TEST_DIRECTORY, 'event-param-fixer', 'fixtures' );

	const sourceFilePatterns = [ upath.join( FIXTURES_PATH, '**', '*.ts' ) ];

	beforeAll( async () => {
		entryPoints = ( await glob( sourceFilePatterns ) ).map( file => upath.normalize( file ) );

		const typeDoc = await Application.bootstrapWithPlugins( {
			logLevel: 'Warn',
			entryPoints,
			tsconfig: upath.join( FIXTURES_PATH, 'tsconfig.json' ),
			plugin: [
				'typedoc-plugin-rename-defaults'
			]
		} );

		warnSpy = vi.spyOn( typeDoc.logger, 'warn' ).mockImplementation( () => {} );

		typeDocTagEvent( typeDoc );
		typeDocTagObservable( typeDoc );
		typeDocEventParamFixer( typeDoc );
		typeDocRestoreProgramAfterConversion( typeDoc );

		expect( entryPoints ).to.not.lengthOf( 0 );

		conversionResult = ( await typeDoc.convert() )!;

		expect( conversionResult ).to.be.an( 'object' );
	} );

	afterAll( () => {
		vi.restoreAllMocks();
	} );

	it( 'should find the "EventInfo" class', () => {
		const eventInfoClass = conversionResult.getChildByName( [ 'utils/eventinfo', 'EventInfo' ] );

		expect( eventInfoClass ).to.not.be.undefined;
		expect( warnSpy ).not.toHaveBeenCalledWith( 'Unable to find the "EventInfo" class.' );
	} );

	it( 'should warn if the "EventInfo" class is not found', async () => {
		const typeDoc = await Application.bootstrapWithPlugins( {
			logLevel: 'Warn',
			// Do not process the "EventInfo" class.
			entryPoints: entryPoints.filter( file => !file.endsWith( 'eventinfo.ts' ) ),
			tsconfig: upath.join( FIXTURES_PATH, 'tsconfig.json' ),
			plugin: [
				'typedoc-plugin-rename-defaults'
			]
		} );

		const warnSpy = vi.spyOn( typeDoc.logger, 'warn' ).mockImplementation( () => {} );

		typeDocTagEvent( typeDoc );
		typeDocTagObservable( typeDoc );
		typeDocEventParamFixer( typeDoc );
		typeDocRestoreProgramAfterConversion( typeDoc );

		const conversionResult = ( await typeDoc.convert() )!;
		const eventInfoClass = conversionResult.getChildByName( [ 'utils/eventinfo', 'EventInfo' ] );

		expect( eventInfoClass ).to.be.undefined;
		expect( warnSpy ).toHaveBeenCalledWith( 'Unable to find the "EventInfo" class.' );
	} );

	describe( 'eventInfo parameter definition', () => {
		let eventFoo: DeclarationReflection,
			eventFooNoText: DeclarationReflection,
			eventFooWithParams: DeclarationReflection,
			eventObservableChange: DeclarationReflection,
			eventObservableSet: DeclarationReflection,
			eventInfoClass: DeclarationReflection;

		beforeAll( () => {
			const eventDefinitions = conversionResult.getReflectionsByKind( ReflectionKind.Class | ReflectionKind.Interface )
				.flatMap( ref => ref.ckeditor5Events || [] ) as Array<DeclarationReflection>;

			expect( eventDefinitions ).to.lengthOf( 5 );

			eventFoo = eventDefinitions.find( event => event.name === 'event-foo' )!;
			eventFooNoText = eventDefinitions.find( event => event.name === 'event-foo-no-text' )!;
			eventFooWithParams = eventDefinitions.find( event => event.name === 'event-foo-with-params' )!;
			eventObservableChange = eventDefinitions.find( event => event.name === 'change:key' )!;
			eventObservableSet = eventDefinitions.find( event => event.name === 'set:key' )!;

			expect( eventFoo ).to.not.be.undefined;
			expect( eventFooNoText ).to.not.be.undefined;
			expect( eventFooWithParams ).to.not.be.undefined;
			expect( eventObservableChange ).to.not.be.undefined;
			expect( eventObservableSet ).to.not.be.undefined;

			eventInfoClass = conversionResult.getChildByName( [ 'utils/eventinfo', 'EventInfo' ] )! as DeclarationReflection;

			expect( eventInfoClass ).to.not.be.undefined;
		} );

		it( 'should add the "eventInfo" parameter for event without params and without comment', () => {
			expect( eventFooNoText.name ).to.equal( 'event-foo-no-text' );
			expect( eventFooNoText.parameters ).to.be.an( 'array' );
			expect( eventFooNoText.parameters ).to.lengthOf( 1 );

			const eventInfoParameter = eventFooNoText.parameters[ 0 ]!;

			assertEventInfoParameter( eventInfoParameter, eventInfoClass );
		} );

		it( 'should add the "eventInfo" parameter for event without params, but with comment', () => {
			expect( eventFoo.name ).to.equal( 'event-foo' );
			expect( eventFoo.parameters ).to.be.an( 'array' );
			expect( eventFoo.parameters ).to.lengthOf( 1 );

			const eventInfoParameter = eventFooNoText.parameters[ 0 ]!;

			assertEventInfoParameter( eventInfoParameter, eventInfoClass );
		} );

		it( 'should add the "eventInfo" parameter for event with params and comment', () => {
			expect( eventFooWithParams.name ).to.equal( 'event-foo-with-params' );
			expect( eventFooWithParams.parameters ).to.be.an( 'array' );
			expect( eventFooWithParams.parameters ).to.lengthOf( 4 );

			const eventInfoParameter = eventFooNoText.parameters[ 0 ]!;

			assertEventInfoParameter( eventInfoParameter, eventInfoClass );
		} );

		it( 'should add the "eventInfo" parameter for the "change" event for observable property', () => {
			expect( eventObservableChange.name ).to.equal( 'change:key' );
			expect( eventObservableChange.parameters ).to.be.an( 'array' );
			expect( eventObservableChange.parameters ).to.lengthOf( 4 );

			const eventInfoParameter = eventFooNoText.parameters[ 0 ]!;

			assertEventInfoParameter( eventInfoParameter, eventInfoClass );
		} );

		it( 'should add the "eventInfo" parameter for the "set" event for observable property', () => {
			expect( eventObservableSet.name ).to.equal( 'set:key' );
			expect( eventObservableSet.parameters ).to.be.an( 'array' );
			expect( eventObservableSet.parameters ).to.lengthOf( 4 );

			const eventInfoParameter = eventFooNoText.parameters[ 0 ]!;

			assertEventInfoParameter( eventInfoParameter, eventInfoClass );
		} );
	} );
} );
