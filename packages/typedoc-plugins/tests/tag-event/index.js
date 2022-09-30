/**
 * @license Copyright (c) 2003-2022, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

const { expect } = require( 'chai' );
const glob = require( 'fast-glob' );
const TypeDoc = require( 'typedoc' );

const utils = require( '../utils' );

describe( 'typedoc-plugins/tag-event', function() {
	this.timeout( 10 * 1000 );

	let conversionResult;

	const FIXTURES_PATH = utils.normalizePath( utils.ROOT_TEST_DIRECTORY, 'tag-event', 'fixtures' );

	before( async () => {
		const sourceFilePatterns = [
			utils.normalizePath( FIXTURES_PATH, '**', '*.ts' )
		];

		const files = await glob( sourceFilePatterns );
		const typeDoc = new TypeDoc.Application();

		expect( files ).to.not.lengthOf( 0 );

		typeDoc.options.addReader( new TypeDoc.TSConfigReader() );
		typeDoc.options.addReader( new TypeDoc.TypeDocReader() );

		typeDoc.bootstrap( {
			logLevel: 'Error',
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

	it( 'should collect the event annotations from comments and insert them as class children', () => {
		const eventDefinitions = conversionResult.children
			.find( entry => entry.name === 'customexampleclass' ).children
			.find( entry => entry.kindString === 'Class' ).children
			.filter( children => children.name.startsWith( 'event:' ) );

		expect( eventDefinitions ).to.not.lengthOf( 0 );
	} );

	describe( 'event definitions', () => {
		// let classDefinition;

		// before( () => {
		// 	classDefinition = conversionResult.children
		// 		.find( entry => entry.name === 'customexampleclass' ).children
		// 		.find( entry => entry.kindString === 'Class' ).children;
		// } );
	} );
} );
