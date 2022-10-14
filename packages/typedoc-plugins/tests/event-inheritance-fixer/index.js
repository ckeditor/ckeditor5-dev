/**
 * @license Copyright (c) 2003-2022, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

const { expect } = require( 'chai' );
const glob = require( 'fast-glob' );
const TypeDoc = require( 'typedoc' );

const utils = require( '../utils' );

describe( 'typedoc-plugins/event-inheritance-fixer', function() {
	this.timeout( 10 * 1000 );

	let typeDoc, conversionResult, files, events;

	const FIXTURES_PATH = utils.normalizePath( utils.ROOT_TEST_DIRECTORY, 'event-inheritance-fixer', 'fixtures' );
	const TSCONFIG_PATH = utils.normalizePath( FIXTURES_PATH, 'tsconfig.json' );
	const PLUGINS = [
		require.resolve( '@ckeditor/typedoc-plugins/lib/tag-event' ),
		require.resolve( '@ckeditor/typedoc-plugins/lib/event-inheritance-fixer' )
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
	} );

	// ---------------
	// CLASS HIERARCHY
	// ---------------
	//
	// ClassA
	//  ⤷ ClassB
	//     ⤷ ClassC
	// ClassD

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

	it( 'should find all events within the project', () => {
		expect( events ).to.lengthOf( 8 );

		// The order of found events does not matter, so just check if all of them are found.
		expect( events.find( event => event.parent.name === 'ClassA' && event.name === 'event:event-1-class-a' ) ).to.not.be.undefined;
		expect( events.find( event => event.parent.name === 'ClassA' && event.name === 'event:event-2-class-a' ) ).to.not.be.undefined;
		expect( events.find( event => event.parent.name === 'ClassB' && event.name === 'event:event-1-class-a' ) ).to.not.be.undefined;
		expect( events.find( event => event.parent.name === 'ClassB' && event.name === 'event:event-2-class-a' ) ).to.not.be.undefined;
		expect( events.find( event => event.parent.name === 'ClassB' && event.name === 'event:event-3-class-b' ) ).to.not.be.undefined;
		expect( events.find( event => event.parent.name === 'ClassC' && event.name === 'event:event-1-class-a' ) ).to.not.be.undefined;
		expect( events.find( event => event.parent.name === 'ClassC' && event.name === 'event:event-2-class-a' ) ).to.not.be.undefined;
		expect( events.find( event => event.parent.name === 'ClassC' && event.name === 'event:event-3-class-b' ) ).to.not.be.undefined;
	} );

	it( 'should create new events with own ids in the inherited classes', () => {
		const numberOfUniqueEvents = new Set( events.map( event => event.id ) ).size;
		const numberOfExpectedEvents = events.length;

		expect( numberOfUniqueEvents ).to.equal( numberOfExpectedEvents );
	} );

	it( 'should clone event comment in the inherited classes', () => {
		const baseEventClassA = events.find( event => event.parent.name === 'ClassA' && event.name === 'event:event-1-class-a' );
		const inheritedEventClassB = events.find( event => event.parent.name === 'ClassB' && event.name === 'event:event-1-class-a' );
		const inheritedEventClassC = events.find( event => event.parent.name === 'ClassC' && event.name === 'event:event-1-class-a' );

		expect( baseEventClassA.comment ).to.not.equal( inheritedEventClassB.comment );
		expect( baseEventClassA.comment ).to.not.equal( inheritedEventClassC.comment );
		expect( inheritedEventClassB.comment ).to.not.equal( inheritedEventClassC.comment );

		for ( const event of [ baseEventClassA, inheritedEventClassB, inheritedEventClassC ] ) {
			expect( event.comment ).to.have.property( 'summary' );
			expect( event.comment ).to.have.property( 'blockTags' );
			expect( event.comment ).to.have.property( 'modifierTags' );

			expect( event.comment.summary ).to.be.an( 'array' );
			expect( event.comment.summary ).to.lengthOf( 1 );
			expect( event.comment.summary[ 0 ] ).to.have.property( 'kind', 'text' );
			expect( event.comment.summary[ 0 ] ).to.have.property( 'text', 'Event 1 from class A.' );
			expect( event.comment.blockTags ).to.be.an( 'array' );
			expect( event.comment.blockTags ).to.lengthOf( 0 );
			expect( event.comment.modifierTags ).to.be.a( 'Set' );
			expect( event.comment.modifierTags.size ).to.equal( 0 );
		}
	} );

	it( 'should clone event source in the inherited classes but keep the original source properties', () => {
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

	it( 'should clone event parameters and all their properties in the inherited classes', () => {
		const baseEventClassA = events.find( event => event.parent.name === 'ClassA' && event.name === 'event:event-1-class-a' );
		const inheritedEventClassB = events.find( event => event.parent.name === 'ClassB' && event.name === 'event:event-1-class-a' );
		const inheritedEventClassC = events.find( event => event.parent.name === 'ClassC' && event.name === 'event:event-1-class-a' );

		expect( baseEventClassA.typeParameters ).to.not.equal( inheritedEventClassB.typeParameters );
		expect( baseEventClassA.typeParameters ).to.not.equal( inheritedEventClassC.typeParameters );
		expect( inheritedEventClassB.typeParameters ).to.not.equal( inheritedEventClassC.typeParameters );

		for ( const event of [ baseEventClassA, inheritedEventClassB, inheritedEventClassC ] ) {
			expect( event.typeParameters ).to.be.an( 'array' );
			expect( event.typeParameters ).to.lengthOf( 4 );

			expect( event.typeParameters[ 0 ] ).to.have.property( 'name', 'eventInfo' );
			expect( event.typeParameters[ 0 ] ).to.have.property( 'comment' );
			expect( event.typeParameters[ 0 ].comment ).to.have.property( 'summary' );
			expect( event.typeParameters[ 0 ].comment.summary ).to.be.an( 'array' );
			expect( event.typeParameters[ 0 ].comment.summary[ 0 ] ).to.have.property( 'kind', 'text' );
			expect( event.typeParameters[ 0 ].comment.summary[ 0 ] ).to.have.property( 'text',
				'An object containing information about the fired event.'
			);

			expect( event.typeParameters[ 1 ] ).to.have.property( 'name', 'p1' );
			expect( event.typeParameters[ 1 ] ).to.have.property( 'comment' );
			expect( event.typeParameters[ 1 ].comment ).to.have.property( 'summary' );
			expect( event.typeParameters[ 1 ].comment.summary ).to.be.an( 'array' );
			expect( event.typeParameters[ 1 ].comment.summary[ 0 ] ).to.have.property( 'kind', 'text' );
			expect( event.typeParameters[ 1 ].comment.summary[ 0 ] ).to.have.property( 'text', 'Description for first param.' );

			expect( event.typeParameters[ 2 ] ).to.have.property( 'name', 'p2' );
			expect( event.typeParameters[ 2 ] ).to.have.property( 'comment' );
			expect( event.typeParameters[ 2 ].comment ).to.have.property( 'summary' );
			expect( event.typeParameters[ 2 ].comment.summary ).to.be.an( 'array' );
			expect( event.typeParameters[ 2 ].comment.summary[ 0 ] ).to.have.property( 'kind', 'text' );
			expect( event.typeParameters[ 2 ].comment.summary[ 0 ] ).to.have.property( 'text', 'Description for second param.' );

			expect( event.typeParameters[ 3 ] ).to.have.property( 'name', 'p3' );
			expect( event.typeParameters[ 3 ] ).to.have.property( 'comment' );
			expect( event.typeParameters[ 3 ].comment ).to.have.property( 'summary' );
			expect( event.typeParameters[ 3 ].comment.summary ).to.be.an( 'array' );
			expect( event.typeParameters[ 3 ].comment.summary ).to.lengthOf( 5 );

			expect( event.typeParameters[ 3 ].comment.summary[ 0 ] ).to.have.property( 'kind', 'text' );
			expect( event.typeParameters[ 3 ].comment.summary[ 0 ] ).to.have.property( 'text', 'Complex ' );

			expect( event.typeParameters[ 3 ].comment.summary[ 1 ] ).to.have.property( 'kind', 'inline-tag' );
			expect( event.typeParameters[ 3 ].comment.summary[ 1 ] ).to.have.property( 'tag', '@link' );
			expect( event.typeParameters[ 3 ].comment.summary[ 1 ] ).to.have.property( 'text',
				'module:utils/object~Object description'
			);

			expect( event.typeParameters[ 3 ].comment.summary[ 2 ] ).to.have.property( 'kind', 'text' );
			expect( event.typeParameters[ 3 ].comment.summary[ 2 ] ).to.have.property( 'text', ' for ' );

			expect( event.typeParameters[ 3 ].comment.summary[ 3 ] ).to.have.property( 'kind', 'code' );
			expect( event.typeParameters[ 3 ].comment.summary[ 3 ] ).to.have.property( 'text', '`third param`' );

			expect( event.typeParameters[ 3 ].comment.summary[ 4 ] ).to.have.property( 'kind', 'text' );
			expect( event.typeParameters[ 3 ].comment.summary[ 4 ] ).to.have.property( 'text', '.' );
		}

		for ( const index of [ 0, 1, 2, 3 ] ) {
			const baseEventClassAParam = baseEventClassA.typeParameters[ index ];
			const inheritedEventClassBParam = inheritedEventClassB.typeParameters[ index ];
			const inheritedEventClassCParam = inheritedEventClassC.typeParameters[ index ];

			expect( baseEventClassAParam ).to.not.equal( inheritedEventClassBParam );
			expect( baseEventClassAParam ).to.not.equal( inheritedEventClassCParam );
			expect( inheritedEventClassBParam ).to.not.equal( inheritedEventClassCParam );

			expect( baseEventClassAParam.comment ).to.not.equal( inheritedEventClassBParam.comment );
			expect( baseEventClassAParam.comment ).to.not.equal( inheritedEventClassCParam.comment );
			expect( inheritedEventClassBParam.comment ).to.not.equal( inheritedEventClassCParam.comment );

			expect( baseEventClassAParam.type ).to.not.equal( inheritedEventClassBParam.type );
			expect( baseEventClassAParam.type ).to.not.equal( inheritedEventClassCParam.type );
			expect( inheritedEventClassBParam.type ).to.not.equal( inheritedEventClassCParam.type );
		}
	} );

	it( 'should not create a new event in derived class if derived class already contains the overwritten event', () => {
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
} );
