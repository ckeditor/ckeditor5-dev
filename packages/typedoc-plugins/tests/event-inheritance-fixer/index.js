/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

const { expect } = require( 'chai' );
const glob = require( 'fast-glob' );
const TypeDoc = require( 'typedoc' );

const utils = require( '../utils' );
const { plugins } = require( '../../lib' );

describe( 'typedoc-plugins/event-inheritance-fixer', function() {
	this.timeout( 20 * 1000 );

	let typeDoc, conversionResult, files, events;

	const FIXTURES_PATH = utils.normalizePath( utils.ROOT_TEST_DIRECTORY, 'event-inheritance-fixer', 'fixtures' );
	const TSCONFIG_PATH = utils.normalizePath( FIXTURES_PATH, 'tsconfig.json' );
	const PLUGINS = [
		plugins[ 'typedoc-plugin-tag-event' ],
		plugins[ 'typedoc-plugin-event-inheritance-fixer' ]
	];

	before( async () => {
		files = await glob( utils.normalizePath( FIXTURES_PATH, '**', '*.ts' ) );

		typeDoc = new TypeDoc.Application();
		typeDoc.options.addReader( new TypeDoc.TSConfigReader() );
		typeDoc.options.addReader( new TypeDoc.TypeDocReader() );

		typeDoc.bootstrap( {
			logLevel: 'Error',
			entryPoints: files,
			plugin: PLUGINS,
			tsconfig: TSCONFIG_PATH
		} );

		conversionResult = typeDoc.convert();

		expect( conversionResult ).to.be.an( 'object' );

		events = conversionResult
			.getReflectionsByKind( TypeDoc.ReflectionKind.All )
			.filter( child => child.kindString === 'Event' );

		// There are 8 events from classes and 9 events from interfaces.
		// There are also 3 events from `MixedClass`, which implements the `InterfaceC`.
		// Also, 3 events come from the `ClassFoo` and its descendant classes.
		expect( events ).to.lengthOf( 23 );
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
	// ClassA ⟶ "event:event-1-class-a"
	// ClassA ⟶ "event:event-2-class-a"
	//  ⤷ ClassB ⟶ "event:event-1-class-a" (inherited from ClassA)
	//  ⤷ ClassB ⟶ "event:event-2-class-a" (inherited from ClassA)
	//  ⤷ ClassB ⟶ "event:event-3-class-b"
	//     ⤷ ClassC ⟶ "event:event-1-class-a" (inherited from ClassA)
	//     ⤷ ClassC ⟶ "event:event-2-class-a" (overwritten in ClassC)
	//     ⤷ ClassC ⟶ "event:event-3-class-b" (inherited from ClassB)

	// ClassFoo ⟶ "event:property"
	//  ⤷ ClassMixinFoo ⟶ "event:property" (inherited from ClassFoo)
	//     ⤷ ClassMixinFooBar ⟶ "event:property" (inherited from ClassFoo)

	// InterfaceA ⟶ "event:event-1-interface-a"
	// InterfaceA ⟶ "event:event-2-interface-a"
	//  ⤷ InterfaceB ⟶ "event:event-1-interface-a" (inherited from InterfaceA)
	//  ⤷ InterfaceB ⟶ "event:event-2-interface-a" (inherited from InterfaceA)
	//  ⤷ InterfaceB ⟶ "event:event-3-interface-b"
	//     ⤷ InterfaceC ⟶ "event:event-1-interface-a" (inherited from InterfaceA)
	//     ⤷ InterfaceC ⟶ "event:event-2-interface-a" (overwritten in InterfaceC)
	//     ⤷ InterfaceC ⟶ "event:event-3-interface-b" (inherited from InterfaceB)
	//        ⤷ MixedClass ⟶ "event:event-1-interface-a" (inherited from InterfaceC)
	//        ⤷ MixedClass ⟶ "event:event-2-interface-a" (inherited from InterfaceC)
	//        ⤷ MixedClass ⟶ "event:event-3-interface-b" (inherited from InterfaceC)
	// InterfaceE ⟶ "event:event-1-interface-e"

	// The "MixedClass" implements the "InterfaceC", so all events from the "InterfaceC" will be cloned.

	it( 'should find all events within the project (verifying classes A-C)', () => {
		expect( findEvent( 'ClassA', 'event:event-1-class-a' ) ).to.not.be.undefined;
		expect( findEvent( 'ClassA', 'event:event-2-class-a' ) ).to.not.be.undefined;
		expect( findEvent( 'ClassB', 'event:event-1-class-a' ) ).to.not.be.undefined;
		expect( findEvent( 'ClassB', 'event:event-2-class-a' ) ).to.not.be.undefined;
		expect( findEvent( 'ClassB', 'event:event-3-class-b' ) ).to.not.be.undefined;
		expect( findEvent( 'ClassC', 'event:event-1-class-a' ) ).to.not.be.undefined;
		expect( findEvent( 'ClassC', 'event:event-2-class-a' ) ).to.not.be.undefined;
		expect( findEvent( 'ClassC', 'event:event-3-class-b' ) ).to.not.be.undefined;
	} );

	it( 'should find all events within the project (verifying interfaces A-C)', () => {
		expect( findEvent( 'InterfaceA', 'event:event-1-interface-a' ) ).to.not.be.undefined;
		expect( findEvent( 'InterfaceA', 'event:event-2-interface-a' ) ).to.not.be.undefined;
		expect( findEvent( 'InterfaceB', 'event:event-1-interface-a' ) ).to.not.be.undefined;
		expect( findEvent( 'InterfaceB', 'event:event-2-interface-a' ) ).to.not.be.undefined;
		expect( findEvent( 'InterfaceB', 'event:event-3-interface-b' ) ).to.not.be.undefined;
		expect( findEvent( 'InterfaceC', 'event:event-1-interface-a' ) ).to.not.be.undefined;
		expect( findEvent( 'InterfaceC', 'event:event-2-interface-a' ) ).to.not.be.undefined;
		expect( findEvent( 'InterfaceC', 'event:event-3-interface-b' ) ).to.not.be.undefined;
		expect( findEvent( 'InterfaceE', 'event:event-1-interface-e' ) ).to.not.be.undefined;
	} );

	it( 'should find all events within the project (verifying a class that implements all interfaces)', () => {
		expect( findEvent( 'MixedClass', 'event:event-1-interface-a' ) ).to.not.be.undefined;
		expect( findEvent( 'MixedClass', 'event:event-2-interface-a' ) ).to.not.be.undefined;
		expect( findEvent( 'MixedClass', 'event:event-3-interface-b' ) ).to.not.be.undefined;
	} );

	it( 'should find all events within the project (verifying inheriting via mixin pattern)', () => {
		expect( findEvent( 'ClassFoo', 'event:property' ) ).to.not.be.undefined;
		expect( findEvent( 'ClassMixinFoo', 'event:property' ) ).to.not.be.undefined;
		expect( findEvent( 'ClassMixinFooBar', 'event:property' ) ).to.not.be.undefined;
	} );

	it( 'should create new events with own ids in the inherited classes and interfaces', () => {
		const numberOfUniqueEvents = new Set( events.map( event => event.id ) ).size;
		const numberOfExpectedEvents = events.length;

		expect( numberOfUniqueEvents ).to.equal( numberOfExpectedEvents );
	} );

	it( 'should clone event comment in the inherited classes and interfaces', () => {
		const baseEventClassA = findEvent( 'ClassA', 'event:event-1-class-a' );
		const inheritedEventClassB = findEvent( 'ClassB', 'event:event-1-class-a' );
		const inheritedEventClassC = findEvent( 'ClassC', 'event:event-1-class-a' );

		const baseEventInterfaceA = findEvent( 'InterfaceA', 'event:event-1-interface-a' );
		const inheritedEventInterfaceB = findEvent( 'InterfaceB', 'event:event-1-interface-a' );
		const inheritedEventInterfaceC = findEvent( 'InterfaceC', 'event:event-1-interface-a' );

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

			expect( event.comment.summary ).to.be.an( 'array' );
			expect( event.comment.summary ).to.lengthOf( 1 );
			expect( event.comment.summary[ 0 ] ).to.have.property( 'kind', 'text' );
			expect( event.comment.summary[ 0 ] ).to.have.property( 'text' ).to.match( /Event 1 from (class|interface) A./ );
			expect( event.comment.blockTags ).to.be.an( 'array' );
			expect( event.comment.blockTags ).to.lengthOf( 4 );
			expect( event.comment.blockTags[ 0 ] ).to.have.property( 'tag', '@eventName' );
			expect( event.comment.blockTags[ 1 ] ).to.have.property( 'tag', '@param' );
			expect( event.comment.blockTags[ 2 ] ).to.have.property( 'tag', '@param' );
			expect( event.comment.blockTags[ 3 ] ).to.have.property( 'tag', '@param' );
			expect( event.comment.modifierTags ).to.be.a( 'Set' );
			expect( event.comment.modifierTags.size ).to.equal( 0 );
		}
	} );

	it( 'should clone event source in the inherited classes and interfaces, but keep the original source properties', () => {
		const baseEventClassA = events.find( event => event.parent.name === 'ClassA' && event.name === 'event:event-1-class-a' );
		const inheritedEventClassB = events.find( event => event.parent.name === 'ClassB' && event.name === 'event:event-1-class-a' );
		const inheritedEventClassC = events.find( event => event.parent.name === 'ClassC' && event.name === 'event:event-1-class-a' );

		expect( baseEventClassA.sources ).to.not.equal( inheritedEventClassB.sources );
		expect( baseEventClassA.sources ).to.not.equal( inheritedEventClassC.sources );
		expect( inheritedEventClassB.sources ).to.not.equal( inheritedEventClassC.sources );

		expect( baseEventClassA.sources ).to.be.an( 'array' );
		expect( baseEventClassA.sources ).to.lengthOf( 1 );
		expect( baseEventClassA.sources[ 0 ] ).to.have.property( 'fileName' );
		expect( baseEventClassA.sources[ 0 ] ).to.have.property( 'fullFileName' );
		expect( baseEventClassA.sources[ 0 ] ).to.have.property( 'line' );
		expect( baseEventClassA.sources[ 0 ] ).to.have.property( 'character' );
		expect( baseEventClassA.sources[ 0 ] ).to.have.property( 'url' );

		const eventSource = baseEventClassA.sources[ 0 ];

		for ( const event of [ inheritedEventClassB, inheritedEventClassC ] ) {
			expect( event.sources ).to.be.an( 'array' );
			expect( event.sources ).to.lengthOf( 1 );
			expect( event.sources[ 0 ] ).to.have.property( 'fileName', eventSource.fileName );
			expect( event.sources[ 0 ] ).to.have.property( 'fullFileName', eventSource.fullFileName );
			expect( event.sources[ 0 ] ).to.have.property( 'line', eventSource.line );
			expect( event.sources[ 0 ] ).to.have.property( 'character', eventSource.character );
			expect( event.sources[ 0 ] ).to.have.property( 'url', eventSource.url );
		}
	} );

	it( 'should set the `inheritedFrom` property in the inherited events', () => {
		const baseEventClassA = events.find( event => event.parent.name === 'ClassA' && event.name === 'event:event-1-class-a' );
		const inheritedEventClassB = events.find( event => event.parent.name === 'ClassB' && event.name === 'event:event-1-class-a' );
		const inheritedEventClassC = events.find( event => event.parent.name === 'ClassC' && event.name === 'event:event-1-class-a' );

		expect( baseEventClassA ).to.not.have.property( 'inheritedFrom' );
		expect( inheritedEventClassB ).to.have.property( 'inheritedFrom' );
		expect( inheritedEventClassC ).to.have.property( 'inheritedFrom' );

		for ( const event of [ inheritedEventClassB, inheritedEventClassC ] ) {
			expect( event.inheritedFrom ).to.have.property( 'type', 'reference' );
			expect( event.inheritedFrom ).to.have.property( 'name', 'ClassA.event:event-1-class-a' );
			expect( event.inheritedFrom.reflection ).to.equal( baseEventClassA );
		}
	} );

	it( 'should copy event parameters and all their properties in the inherited classes and interfaces', () => {
		const baseEventClassA = events.find( event => event.parent.name === 'ClassA' && event.name === 'event:event-1-class-a' );
		const inheritedEventClassB = events.find( event => event.parent.name === 'ClassB' && event.name === 'event:event-1-class-a' );
		const inheritedEventClassC = events.find( event => event.parent.name === 'ClassC' && event.name === 'event:event-1-class-a' );

		expect( baseEventClassA.typeParameters ).to.not.equal( inheritedEventClassB.typeParameters );
		expect( baseEventClassA.typeParameters ).to.not.equal( inheritedEventClassC.typeParameters );
		expect( inheritedEventClassB.typeParameters ).to.not.equal( inheritedEventClassC.typeParameters );

		for ( const event of [ baseEventClassA, inheritedEventClassB, inheritedEventClassC ] ) {
			expect( event.typeParameters ).to.be.an( 'array' );
			expect( event.typeParameters ).to.lengthOf( 3 );

			expect( event.typeParameters[ 0 ] ).to.have.property( 'name', 'p1' );
			expect( event.typeParameters[ 0 ] ).to.have.property( 'comment' );
			expect( event.typeParameters[ 0 ].comment ).to.have.property( 'summary' );
			expect( event.typeParameters[ 0 ].comment.summary ).to.be.an( 'array' );
			expect( event.typeParameters[ 0 ].comment.summary[ 0 ] ).to.have.property( 'kind', 'text' );
			expect( event.typeParameters[ 0 ].comment.summary[ 0 ] ).to.have.property( 'text', 'Description for first param.' );

			expect( event.typeParameters[ 0 ] ).to.have.property( 'type' );
			expect( event.typeParameters[ 0 ].type ).to.have.property( 'element' );
			expect( event.typeParameters[ 0 ].type.element ).to.have.property( 'type', 'intrinsic' );
			expect( event.typeParameters[ 0 ].type.element ).to.have.property( 'name', 'string' );

			expect( event.typeParameters[ 1 ] ).to.have.property( 'name', 'p2' );
			expect( event.typeParameters[ 1 ] ).to.have.property( 'comment' );
			expect( event.typeParameters[ 1 ].comment ).to.have.property( 'summary' );
			expect( event.typeParameters[ 1 ].comment.summary ).to.be.an( 'array' );
			expect( event.typeParameters[ 1 ].comment.summary[ 0 ] ).to.have.property( 'kind', 'text' );
			expect( event.typeParameters[ 1 ].comment.summary[ 0 ] ).to.have.property( 'text', 'Description for second param.' );

			expect( event.typeParameters[ 1 ] ).to.have.property( 'type' );
			expect( event.typeParameters[ 1 ].type ).to.have.property( 'element' );
			expect( event.typeParameters[ 1 ].type.element ).to.have.property( 'type', 'intrinsic' );
			expect( event.typeParameters[ 1 ].type.element ).to.have.property( 'name', 'number' );

			expect( event.typeParameters[ 2 ] ).to.have.property( 'name', 'p3' );
			expect( event.typeParameters[ 2 ] ).to.have.property( 'comment' );
			expect( event.typeParameters[ 2 ].comment ).to.have.property( 'summary' );
			expect( event.typeParameters[ 2 ].comment.summary ).to.be.an( 'array' );
			expect( event.typeParameters[ 2 ].comment.summary ).to.lengthOf( 5 );

			expect( event.typeParameters[ 2 ].comment.summary[ 0 ] ).to.have.property( 'kind', 'text' );
			expect( event.typeParameters[ 2 ].comment.summary[ 0 ] ).to.have.property( 'text', 'Complex ' );

			expect( event.typeParameters[ 2 ].comment.summary[ 1 ] ).to.have.property( 'kind', 'inline-tag' );
			expect( event.typeParameters[ 2 ].comment.summary[ 1 ] ).to.have.property( 'tag', '@link' );
			expect( event.typeParameters[ 2 ].comment.summary[ 1 ] ).to.have.property( 'text',
				'module:utils/object~Object description'
			);

			expect( event.typeParameters[ 2 ].comment.summary[ 2 ] ).to.have.property( 'kind', 'text' );
			expect( event.typeParameters[ 2 ].comment.summary[ 2 ] ).to.have.property( 'text', ' for ' );

			expect( event.typeParameters[ 2 ].comment.summary[ 3 ] ).to.have.property( 'kind', 'code' );
			expect( event.typeParameters[ 2 ].comment.summary[ 3 ] ).to.have.property( 'text', '`third param`' );

			expect( event.typeParameters[ 2 ].comment.summary[ 4 ] ).to.have.property( 'kind', 'text' );
			expect( event.typeParameters[ 2 ].comment.summary[ 4 ] ).to.have.property( 'text', '.' );

			expect( event.typeParameters[ 2 ] ).to.have.property( 'type' );
			expect( event.typeParameters[ 2 ].type ).to.have.property( 'element' );
			expect( event.typeParameters[ 2 ].type.element ).to.have.property( 'type', 'intrinsic' );
			expect( event.typeParameters[ 2 ].type.element ).to.have.property( 'name', 'boolean' );
		}
	} );

	it( 'should not create a new event in derived class and interface if derived one already contains the overwritten event', () => {
		const baseEventClassA = events.find( event => event.parent.name === 'ClassA' && event.name === 'event:event-2-class-a' );
		const overwrittenEventClassC = events.find( event => event.parent.name === 'ClassC' && event.name === 'event:event-2-class-a' );

		expect( baseEventClassA.comment ).to.have.property( 'summary' );
		expect( baseEventClassA.comment.summary ).to.be.an( 'array' );
		expect( baseEventClassA.comment.summary ).to.lengthOf( 1 );
		expect( baseEventClassA.comment.summary[ 0 ] ).to.have.property( 'kind', 'text' );
		expect( baseEventClassA.comment.summary[ 0 ] ).to.have.property( 'text', 'Event 2 from class A.' );

		expect( overwrittenEventClassC.comment ).to.have.property( 'summary' );
		expect( overwrittenEventClassC.comment.summary ).to.be.an( 'array' );
		expect( overwrittenEventClassC.comment.summary ).to.lengthOf( 1 );
		expect( overwrittenEventClassC.comment.summary[ 0 ] ).to.have.property( 'kind', 'text' );
		expect( overwrittenEventClassC.comment.summary[ 0 ] ).to.have.property( 'text', 'Overwritten event 2 from class A.' );
	} );

	describe( 'processing a reflection that has been removed (purge-plugin)', () => {
		before( () => {
			const typeDoc = new TypeDoc.Application();

			typeDoc.options.addReader( new TypeDoc.TSConfigReader() );
			typeDoc.options.addReader( new TypeDoc.TypeDocReader() );

			typeDoc.bootstrap( {
				logLevel: 'Error',
				entryPoints: files,
				plugin: [
					// The "typedoc-plugin-remove-class-c" plugin removes the "ClassC" class from the project.
					utils.normalizePath( utils.ROOT_TEST_DIRECTORY, 'event-inheritance-fixer', 'typedoc-plugin-remove-class-c' ),
					...PLUGINS
				],
				tsconfig: TSCONFIG_PATH
			} );

			const conversionResult = typeDoc.convert();

			events = conversionResult
				.getReflectionsByKind( TypeDoc.ReflectionKind.All )
				.filter( child => child.kindString === 'Event' );

			expect( events ).to.lengthOf( 20 );
		} );

		it( 'should find all events within the project (verifying classes A-C)', () => {
			expect( findEvent( 'ClassA', 'event:event-1-class-a' ) ).to.not.be.undefined;
			expect( findEvent( 'ClassA', 'event:event-2-class-a' ) ).to.not.be.undefined;
			expect( findEvent( 'ClassB', 'event:event-1-class-a' ) ).to.not.be.undefined;
			expect( findEvent( 'ClassB', 'event:event-2-class-a' ) ).to.not.be.undefined;
			expect( findEvent( 'ClassB', 'event:event-3-class-b' ) ).to.not.be.undefined;
		} );

		it( 'should find all events within the project (verifying interfaces A-C)', () => {
			expect( findEvent( 'InterfaceA', 'event:event-1-interface-a' ) ).to.not.be.undefined;
			expect( findEvent( 'InterfaceA', 'event:event-2-interface-a' ) ).to.not.be.undefined;
			expect( findEvent( 'InterfaceB', 'event:event-1-interface-a' ) ).to.not.be.undefined;
			expect( findEvent( 'InterfaceB', 'event:event-2-interface-a' ) ).to.not.be.undefined;
			expect( findEvent( 'InterfaceB', 'event:event-3-interface-b' ) ).to.not.be.undefined;
			expect( findEvent( 'InterfaceC', 'event:event-1-interface-a' ) ).to.not.be.undefined;
			expect( findEvent( 'InterfaceC', 'event:event-2-interface-a' ) ).to.not.be.undefined;
			expect( findEvent( 'InterfaceC', 'event:event-3-interface-b' ) ).to.not.be.undefined;
			expect( findEvent( 'InterfaceE', 'event:event-1-interface-e' ) ).to.not.be.undefined;
		} );

		it( 'should find all events within the project (verifying a class that implements all interfaces)', () => {
			expect( findEvent( 'MixedClass', 'event:event-1-interface-a' ) ).to.not.be.undefined;
			expect( findEvent( 'MixedClass', 'event:event-2-interface-a' ) ).to.not.be.undefined;
			expect( findEvent( 'MixedClass', 'event:event-3-interface-b' ) ).to.not.be.undefined;
		} );

		it( 'should find all events within the project (verifying inheriting via mixin pattern)', () => {
			expect( findEvent( 'ClassFoo', 'event:property' ) ).to.not.be.undefined;
			expect( findEvent( 'ClassMixinFoo', 'event:property' ) ).to.not.be.undefined;
			expect( findEvent( 'ClassMixinFooBar', 'event:property' ) ).to.not.be.undefined;
		} );
	} );

	function findEvent( className, eventName ) {
		return events.find( evt => evt.parent.name === className && evt.name === eventName );
	}
} );
