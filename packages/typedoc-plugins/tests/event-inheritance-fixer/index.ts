/**
 * @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { glob } from 'glob';
import upath from 'upath';
import {
	Application,
	type ProjectReflection,
	type DeclarationReflection,
	type NamedTupleMember
} from 'typedoc';

import { ROOT_TEST_DIRECTORY } from '../utils.js';
import {
	typeDocTagEvent,
	typeDocEventInheritanceFixer,
	typeDocRestoreProgramAfterConversion
} from '../../src/index.js';

import typeDocRemoveClassC from './utils/typedoc-plugin-remove-class-c.js';

describe( 'typedoc-plugins/event-inheritance-fixer', () => {
	let conversionResult: ProjectReflection,
		entryPoints: Array<string>,
		events: Array<DeclarationReflection>;

	const FIXTURES_PATH = upath.join( ROOT_TEST_DIRECTORY, 'event-inheritance-fixer', 'fixtures' );

	const sourceFilePatterns = [ upath.join( FIXTURES_PATH, '**', '*.ts' ) ];

	beforeAll( async () => {
		entryPoints = ( await glob( sourceFilePatterns ) ).map( file => upath.normalize( file ) );

		const typeDoc = await Application.bootstrapWithPlugins( {
			logLevel: 'Error',
			entryPoints,
			tsconfig: upath.join( FIXTURES_PATH, 'tsconfig.test.json' ),
			plugin: [
				'typedoc-plugin-rename-defaults'
			]
		} );

		typeDocTagEvent( typeDoc );
		typeDocEventInheritanceFixer( typeDoc );
		typeDocRestoreProgramAfterConversion( typeDoc );

		expect( entryPoints ).to.not.lengthOf( 0 );

		conversionResult = ( await typeDoc.convert() )!;

		expect( conversionResult ).to.be.an( 'object' );
	} );

	beforeEach( () => {
		events = conversionResult.children!.filter( ref => ref.isCKEditor5Event );
	} );

	// ---------------
	// CLASS HIERARCHY
	// ---------------
	//
	// ClassA
	//  ⤷ ClassB
	//     ⤷ ClassC
	// ClassD
	//
	// ClassFoo
	//  ⤷ ClassMixinFoo extends Mixin( ClassFoo )
	//     ⤷ ClassMixinFooBar

	// -------------------
	// INTERFACE HIERARCHY
	// -------------------
	//
	// InterfaceA
	//  ⤷ InterfaceB
	//     ⤷ InterfaceC
	//        ⤷ MixedClass
	// InterfaceD
	// InterfaceE

	// ------
	// EVENTS
	// ------
	//
	// ClassA ⟶ "event-1-class-a"
	// ClassA ⟶ "event-2-class-a"
	//  ⤷ ClassB ⟶ "event-1-class-a" (inherited from ClassA)
	//  ⤷ ClassB ⟶ "event-2-class-a" (inherited from ClassA)
	//  ⤷ ClassB ⟶ "event-3-class-b"
	//     ⤷ ClassC ⟶ "event-1-class-a" (inherited from ClassA)
	//     ⤷ ClassC ⟶ "event-2-class-a" (overwritten in ClassC)
	//     ⤷ ClassC ⟶ "event-3-class-b" (inherited from ClassB)

	// ClassFoo ⟶ "property"
	//  ⤷ ClassMixinFoo ⟶ "property" (inherited from ClassFoo)
	//     ⤷ ClassMixinFooBar ⟶ "property" (inherited from ClassFoo)

	// InterfaceA ⟶ "event-1-interface-a"
	// InterfaceA ⟶ "event-2-interface-a"
	//  ⤷ InterfaceB ⟶ "event-1-interface-a" (inherited from InterfaceA)
	//  ⤷ InterfaceB ⟶ "event-2-interface-a" (inherited from InterfaceA)
	//  ⤷ InterfaceB ⟶ "event-3-interface-b"
	//     ⤷ InterfaceC ⟶ "event-1-interface-a" (inherited from InterfaceA)
	//     ⤷ InterfaceC ⟶ "event-2-interface-a" (overwritten in InterfaceC)
	//     ⤷ InterfaceC ⟶ "event-3-interface-b" (inherited from InterfaceB)
	//        ⤷ MixedClass ⟶ "event-1-interface-a" (inherited from InterfaceC)
	//        ⤷ MixedClass ⟶ "event-2-interface-a" (inherited from InterfaceC)
	//        ⤷ MixedClass ⟶ "event-3-interface-b" (inherited from InterfaceC)
	// InterfaceE ⟶ "event-1-interface-e"

	// The "MixedClass" implements the "InterfaceC", so all events from the "InterfaceC" will be cloned.

	it( 'should find all events within the project', () => {
		// There are 8 events from classes and 9 events from interfaces.
		// There are also 3 events from `MixedClass`, which implements the `InterfaceC`.
		// Also, 3 events come from the `ClassFoo` and its descendant classes.
		expect( events ).to.lengthOf( 23 );
	} );

	it( 'should find all events within the project (verifying classes A-C)', () => {
		expect( findEvent( 'ClassA', 'event-1-class-a' ) ).to.not.be.undefined;
		expect( findEvent( 'ClassA', 'event-2-class-a' ) ).to.not.be.undefined;
		expect( findEvent( 'ClassB', 'event-1-class-a' ) ).to.not.be.undefined;
		expect( findEvent( 'ClassB', 'event-2-class-a' ) ).to.not.be.undefined;
		expect( findEvent( 'ClassB', 'event-3-class-b' ) ).to.not.be.undefined;
		expect( findEvent( 'ClassC', 'event-1-class-a' ) ).to.not.be.undefined;
		expect( findEvent( 'ClassC', 'event-2-class-a' ) ).to.not.be.undefined;
		expect( findEvent( 'ClassC', 'event-3-class-b' ) ).to.not.be.undefined;
	} );

	it( 'should find all events within the project (verifying interfaces A-C)', () => {
		expect( findEvent( 'InterfaceA', 'event-1-interface-a' ) ).to.not.be.undefined;
		expect( findEvent( 'InterfaceA', 'event-2-interface-a' ) ).to.not.be.undefined;
		expect( findEvent( 'InterfaceB', 'event-1-interface-a' ) ).to.not.be.undefined;
		expect( findEvent( 'InterfaceB', 'event-2-interface-a' ) ).to.not.be.undefined;
		expect( findEvent( 'InterfaceB', 'event-3-interface-b' ) ).to.not.be.undefined;
		expect( findEvent( 'InterfaceC', 'event-1-interface-a' ) ).to.not.be.undefined;
		expect( findEvent( 'InterfaceC', 'event-2-interface-a' ) ).to.not.be.undefined;
		expect( findEvent( 'InterfaceC', 'event-3-interface-b' ) ).to.not.be.undefined;
		expect( findEvent( 'InterfaceE', 'event-1-interface-e' ) ).to.not.be.undefined;
	} );

	it( 'should find all events within the project (verifying a class that implements all interfaces)', () => {
		expect( findEvent( 'MixedClass', 'event-1-interface-a' ) ).to.not.be.undefined;
		expect( findEvent( 'MixedClass', 'event-2-interface-a' ) ).to.not.be.undefined;
		expect( findEvent( 'MixedClass', 'event-3-interface-b' ) ).to.not.be.undefined;
	} );

	it( 'should find all events within the project (verifying inheriting via mixin pattern)', () => {
		expect( findEvent( 'ClassFoo', 'property' ) ).to.not.be.undefined;
		expect( findEvent( 'ClassMixinFoo', 'property' ) ).to.not.be.undefined;
		expect( findEvent( 'ClassMixinFooBar', 'property' ) ).to.not.be.undefined;
	} );

	it( 'should create new events with own ids in the inherited classes and interfaces', () => {
		const numberOfUniqueEvents = new Set( events.map( event => event.id ) ).size;
		const numberOfExpectedEvents = events.length;

		expect( numberOfUniqueEvents ).to.equal( numberOfExpectedEvents );
	} );

	it( 'should clone event comment in the inherited classes and interfaces', () => {
		const baseEventClassA = findEvent( 'ClassA', 'event-1-class-a' );
		const inheritedEventClassB = findEvent( 'ClassB', 'event-1-class-a' );
		const inheritedEventClassC = findEvent( 'ClassC', 'event-1-class-a' );

		const baseEventInterfaceA = findEvent( 'InterfaceA', 'event-1-interface-a' );
		const inheritedEventInterfaceB = findEvent( 'InterfaceB', 'event-1-interface-a' );
		const inheritedEventInterfaceC = findEvent( 'InterfaceC', 'event-1-interface-a' );

		expect( baseEventClassA.comment ).to.not.equal( inheritedEventClassB.comment );
		expect( baseEventClassA.comment ).to.not.equal( inheritedEventClassC.comment );
		expect( inheritedEventClassB.comment ).to.not.equal( inheritedEventClassC.comment );

		expect( baseEventInterfaceA.comment ).to.not.equal( inheritedEventInterfaceB.comment );
		expect( baseEventInterfaceA.comment ).to.not.equal( inheritedEventInterfaceC.comment );
		expect( inheritedEventInterfaceB.comment ).to.not.equal( inheritedEventInterfaceC.comment );

		const eventsToCheck = [
			baseEventClassA,
			inheritedEventClassB,
			inheritedEventClassC,

			baseEventInterfaceA,
			inheritedEventInterfaceB,
			inheritedEventInterfaceC
		];

		for ( const event of eventsToCheck ) {
			expect( event.comment ).to.have.property( 'summary' );
			expect( event.comment ).to.have.property( 'blockTags' );
			expect( event.comment ).to.have.property( 'modifierTags' );

			expect( event.comment!.summary ).to.be.an( 'array' );
			expect( event.comment!.summary ).to.lengthOf( 1 );
			expect( event.comment!.summary[ 0 ] ).to.have.property( 'kind', 'text' );
			expect( event.comment!.summary[ 0 ] ).to.have.property( 'text' ).to.match( /Event 1 from (class|interface) A./ );
			expect( event.comment!.blockTags ).to.be.an( 'array' );
			expect( event.comment!.blockTags ).to.lengthOf( 4 );
			expect( event.comment!.blockTags[ 0 ] ).to.have.property( 'tag', '@eventName' );
			expect( event.comment!.blockTags[ 1 ] ).to.have.property( 'tag', '@param' );
			expect( event.comment!.blockTags[ 2 ] ).to.have.property( 'tag', '@param' );
			expect( event.comment!.blockTags[ 3 ] ).to.have.property( 'tag', '@param' );
			expect( event.comment!.modifierTags ).to.be.a( 'Set' );
			expect( event.comment!.modifierTags.size ).to.equal( 0 );
		}
	} );

	it( 'should clone event source in the inherited classes and interfaces, but keep the original source properties', () => {
		const baseEventClassA = findEvent( 'ClassA', 'event-1-class-a' );
		const inheritedEventClassB = findEvent( 'ClassB', 'event-1-class-a' );
		const inheritedEventClassC = findEvent( 'ClassC', 'event-1-class-a' );

		expect( baseEventClassA.sources ).to.not.equal( inheritedEventClassB.sources );
		expect( baseEventClassA.sources ).to.not.equal( inheritedEventClassC.sources );
		expect( inheritedEventClassB.sources ).to.not.equal( inheritedEventClassC.sources );

		expect( baseEventClassA.sources ).to.be.an( 'array' );
		expect( baseEventClassA.sources ).to.lengthOf( 1 );

		const eventSource = baseEventClassA.sources![ 0 ]!;

		expect( eventSource ).to.have.property( 'fileName' );
		expect( eventSource ).to.have.property( 'fullFileName' );
		expect( eventSource ).to.have.property( 'line' );
		expect( eventSource ).to.have.property( 'character' );
		expect( eventSource ).to.have.property( 'url' );

		for ( const event of [ inheritedEventClassB, inheritedEventClassC ] ) {
			expect( event.sources ).to.be.an( 'array' );
			expect( event.sources ).to.lengthOf( 1 );
			expect( event.sources![ 0 ] ).to.have.property( 'fileName', eventSource.fileName );
			expect( event.sources![ 0 ] ).to.have.property( 'fullFileName', eventSource.fullFileName );
			expect( event.sources![ 0 ] ).to.have.property( 'line', eventSource.line );
			expect( event.sources![ 0 ] ).to.have.property( 'character', eventSource.character );
			expect( event.sources![ 0 ] ).to.have.property( 'url', eventSource.url );
		}
	} );

	it( 'should set the `inheritedFrom` property in the inherited events', () => {
		const baseEventClassA = findEvent( 'ClassA', 'event-1-class-a' );
		const inheritedEventClassB = findEvent( 'ClassB', 'event-1-class-a' );
		const inheritedEventClassC = findEvent( 'ClassC', 'event-1-class-a' );

		expect( baseEventClassA ).to.property( 'inheritedFrom', undefined );
		expect( inheritedEventClassB ).to.have.property( 'inheritedFrom' );
		expect( inheritedEventClassC ).to.have.property( 'inheritedFrom' );

		for ( const event of [ inheritedEventClassB, inheritedEventClassC ] ) {
			expect( event.inheritedFrom ).to.have.property( 'type', 'reference' );
			expect( event.inheritedFrom ).to.have.property( 'name', 'ClassA.event-1-class-a' );
			expect( event.inheritedFrom!.reflection ).to.equal( baseEventClassA );
		}
	} );

	it( 'should copy event parameters and all their properties in the inherited classes and interfaces', () => {
		const baseEventClassA = findEvent( 'ClassA', 'event-1-class-a' );
		const inheritedEventClassB = findEvent( 'ClassB', 'event-1-class-a' );
		const inheritedEventClassC = findEvent( 'ClassC', 'event-1-class-a' );

		expect( baseEventClassA.parameters ).to.not.equal( inheritedEventClassB.parameters );
		expect( baseEventClassA.parameters ).to.not.equal( inheritedEventClassC.parameters );
		expect( inheritedEventClassB.parameters ).to.not.equal( inheritedEventClassC.parameters );

		for ( const event of [ baseEventClassA, inheritedEventClassB, inheritedEventClassC ] ) {
			expect( event.parameters ).to.be.an( 'array' );
			expect( event.parameters ).to.lengthOf( 3 );

			const firstParam = event.parameters[ 0 ]!;
			const firstParamComment = firstParam.comment!;
			const firstParamType = firstParam.type as NamedTupleMember;

			expect( firstParam ).to.have.property( 'name', 'p1' );
			expect( firstParam ).to.have.property( 'comment' );
			expect( firstParamComment ).to.have.property( 'summary' );
			expect( firstParamComment!.summary ).to.be.an( 'array' );
			expect( firstParamComment!.summary[ 0 ] ).to.have.property( 'kind', 'text' );
			expect( firstParamComment!.summary[ 0 ] ).to.have.property( 'text', 'Description for first param.' );

			expect( firstParam ).to.have.property( 'type' );
			expect( firstParamType ).to.have.property( 'element' );
			expect( firstParamType.element ).to.have.property( 'type', 'intrinsic' );
			expect( firstParamType.element ).to.have.property( 'name', 'string' );

			const secondParam = event.parameters[ 1 ]!;
			const secondParamComment = secondParam.comment!;
			const secondParamType = secondParam.type as NamedTupleMember;

			expect( secondParam ).to.have.property( 'name', 'p2' );
			expect( secondParam ).to.have.property( 'comment' );
			expect( secondParamComment ).to.have.property( 'summary' );
			expect( secondParamComment!.summary ).to.be.an( 'array' );
			expect( secondParamComment!.summary[ 0 ] ).to.have.property( 'kind', 'text' );
			expect( secondParamComment!.summary[ 0 ] ).to.have.property( 'text', 'Description for second param.' );

			expect( secondParam ).to.have.property( 'type' );
			expect( secondParamType ).to.have.property( 'element' );
			expect( secondParamType.element ).to.have.property( 'type', 'intrinsic' );
			expect( secondParamType.element ).to.have.property( 'name', 'number' );

			const thirdParam = event.parameters[ 2 ]!;
			const thirdParamComment = thirdParam.comment!;
			const thirdParamType = thirdParam.type as NamedTupleMember;

			expect( thirdParam ).to.have.property( 'name', 'p3' );
			expect( thirdParam ).to.have.property( 'comment' );
			expect( thirdParamComment ).to.have.property( 'summary' );
			expect( thirdParamComment!.summary ).to.be.an( 'array' );
			expect( thirdParamComment!.summary ).to.lengthOf( 5 );

			expect( thirdParamComment!.summary[ 0 ] ).to.have.property( 'kind', 'text' );
			expect( thirdParamComment!.summary[ 0 ] ).to.have.property( 'text', 'Complex ' );

			expect( thirdParamComment!.summary[ 1 ] ).to.have.property( 'kind', 'inline-tag' );
			expect( thirdParamComment!.summary[ 1 ] ).to.have.property( 'tag', '@link' );
			expect( thirdParamComment!.summary[ 1 ] ).to.have.property( 'text', 'module:utils/object~Object description' );

			expect( thirdParamComment!.summary[ 2 ] ).to.have.property( 'kind', 'text' );
			expect( thirdParamComment!.summary[ 2 ] ).to.have.property( 'text', ' for ' );

			expect( thirdParamComment!.summary[ 3 ] ).to.have.property( 'kind', 'code' );
			expect( thirdParamComment!.summary[ 3 ] ).to.have.property( 'text', '`third param`' );

			expect( thirdParamComment!.summary[ 4 ] ).to.have.property( 'kind', 'text' );
			expect( thirdParamComment!.summary[ 4 ] ).to.have.property( 'text', '.' );

			expect( thirdParam ).to.have.property( 'type' );
			expect( thirdParamType ).to.have.property( 'element' );
			expect( thirdParamType.element ).to.have.property( 'type', 'intrinsic' );
			expect( thirdParamType.element ).to.have.property( 'name', 'boolean' );
		}
	} );

	it( 'should not create a new event in derived class and interface if derived one already contains the overwritten event', () => {
		const baseEventClassA = findEvent( 'ClassA', 'event-2-class-a' );
		const overwrittenEventClassC = findEvent( 'ClassC', 'event-2-class-a' );

		expect( baseEventClassA.comment ).to.have.property( 'summary' );
		expect( baseEventClassA.comment!.summary ).to.be.an( 'array' );
		expect( baseEventClassA.comment!.summary ).to.lengthOf( 1 );
		expect( baseEventClassA.comment!.summary[ 0 ] ).to.have.property( 'kind', 'text' );
		expect( baseEventClassA.comment!.summary[ 0 ] ).to.have.property( 'text', 'Event 2 from class A.' );

		expect( overwrittenEventClassC.comment ).to.have.property( 'summary' );
		expect( overwrittenEventClassC.comment!.summary ).to.be.an( 'array' );
		expect( overwrittenEventClassC.comment!.summary ).to.lengthOf( 1 );
		expect( overwrittenEventClassC.comment!.summary[ 0 ] ).to.have.property( 'kind', 'text' );
		expect( overwrittenEventClassC.comment!.summary[ 0 ] ).to.have.property( 'text', 'Overwritten event 2 from class A.' );
	} );

	describe( 'processing a reflection that has been removed (purge-plugin)', () => {
		let conversionResult: ProjectReflection,
			events: Array<DeclarationReflection>;

		beforeAll( async () => {
			const typeDoc = await Application.bootstrapWithPlugins( {
				logLevel: 'Error',
				entryPoints,
				tsconfig: upath.join( FIXTURES_PATH, 'tsconfig.test.json' ),
				plugin: [
					'typedoc-plugin-rename-defaults'
				]
			} );

			typeDocRemoveClassC( typeDoc );
			typeDocTagEvent( typeDoc );
			typeDocEventInheritanceFixer( typeDoc );
			typeDocRestoreProgramAfterConversion( typeDoc );

			conversionResult = ( await typeDoc.convert() )!;
		} );

		beforeEach( () => {
			events = conversionResult.children!.filter( child => child.isCKEditor5Event );
		} );

		it( 'should find all events within the project', () => {
			expect( events ).to.lengthOf( 20 );
		} );

		it( 'should find all events within the project (verifying classes A-C)', () => {
			expect( findEvent( 'ClassA', 'event-1-class-a' ) ).to.not.be.undefined;
			expect( findEvent( 'ClassA', 'event-2-class-a' ) ).to.not.be.undefined;
			expect( findEvent( 'ClassB', 'event-1-class-a' ) ).to.not.be.undefined;
			expect( findEvent( 'ClassB', 'event-2-class-a' ) ).to.not.be.undefined;
			expect( findEvent( 'ClassB', 'event-3-class-b' ) ).to.not.be.undefined;
		} );

		it( 'should find all events within the project (verifying interfaces A-C)', () => {
			expect( findEvent( 'InterfaceA', 'event-1-interface-a' ) ).to.not.be.undefined;
			expect( findEvent( 'InterfaceA', 'event-2-interface-a' ) ).to.not.be.undefined;
			expect( findEvent( 'InterfaceB', 'event-1-interface-a' ) ).to.not.be.undefined;
			expect( findEvent( 'InterfaceB', 'event-2-interface-a' ) ).to.not.be.undefined;
			expect( findEvent( 'InterfaceB', 'event-3-interface-b' ) ).to.not.be.undefined;
			expect( findEvent( 'InterfaceC', 'event-1-interface-a' ) ).to.not.be.undefined;
			expect( findEvent( 'InterfaceC', 'event-2-interface-a' ) ).to.not.be.undefined;
			expect( findEvent( 'InterfaceC', 'event-3-interface-b' ) ).to.not.be.undefined;
			expect( findEvent( 'InterfaceE', 'event-1-interface-e' ) ).to.not.be.undefined;
		} );

		it( 'should find all events within the project (verifying a class that implements all interfaces)', () => {
			expect( findEvent( 'MixedClass', 'event-1-interface-a' ) ).to.not.be.undefined;
			expect( findEvent( 'MixedClass', 'event-2-interface-a' ) ).to.not.be.undefined;
			expect( findEvent( 'MixedClass', 'event-3-interface-b' ) ).to.not.be.undefined;
		} );

		it( 'should find all events within the project (verifying inheriting via mixin pattern)', () => {
			expect( findEvent( 'ClassFoo', 'property' ) ).to.not.be.undefined;
			expect( findEvent( 'ClassMixinFoo', 'property' ) ).to.not.be.undefined;
			expect( findEvent( 'ClassMixinFooBar', 'property' ) ).to.not.be.undefined;
		} );
	} );

	function findEvent( className: string, eventName: string ) {
		return events.find( evt => evt.parent!.name === className && evt.name === eventName )!;
	}
} );
