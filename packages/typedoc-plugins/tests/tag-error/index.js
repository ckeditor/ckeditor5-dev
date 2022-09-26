/**
 * @license Copyright (c) 2003-2022, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

const { expect } = require( 'chai' );
const glob = require( 'fast-glob' );
const TypeDoc = require( 'typedoc' );

const utils = require( '../utils' );

describe( 'typedoc-plugins/tag-error', function() {
	this.timeout( 10 * 1000 );

	let conversionResult;

	const FIXTURES_PATH = utils.normalizePath( utils.ROOT_TEST_DIRECTORY, 'tag-error', 'fixtures' );

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
				require.resolve( '@ckeditor/typedoc-plugins/lib/tag-error' )
			],
			// TODO: To resolve once the same problem is fixed in the `@ckeditor/ckeditor5-dev-docs` package.
			tsconfig: utils.normalizePath( FIXTURES_PATH, 'tsconfig.json' )
		} );

		conversionResult = typeDoc.convert();

		expect( conversionResult ).to.be.an( 'object' );
	} );

	it( 'should find an error tag before the module definition', () => {
		const errorDefinition = conversionResult.children.find( doclet => doclet.name === 'customerror-before-module' );

		expect( errorDefinition ).to.not.be.undefined;
	} );

	it( 'should find an error tag after the module definition', () => {
		const errorDefinition = conversionResult.children.find( doclet => doclet.name === 'customerror-after-module' );

		expect( errorDefinition ).to.not.be.undefined;
	} );

	it( 'should find an error tag before the export keyword', () => {
		const errorDefinition = conversionResult.children.find( doclet => doclet.name === 'customerror-before-export' );

		expect( errorDefinition ).to.not.be.undefined;
	} );

	it( 'should find an error tag after the export keyword', () => {
		const errorDefinition = conversionResult.children.find( doclet => doclet.name === 'customerror-after-export' );

		expect( errorDefinition ).to.not.be.undefined;
	} );

	it( 'should find an error tag inside a method', () => {
		const errorDefinition = conversionResult.children.find( doclet => doclet.name === 'customerror-inside-method' );

		expect( errorDefinition ).to.not.be.undefined;
		expect( errorDefinition.name ).to.equal( 'customerror-inside-method' );
		expect( errorDefinition.originalName ).to.equal( 'EventDeclaration' );
		expect( errorDefinition.comment ).to.have.property( 'summary' );
		expect( errorDefinition.comment.summary ).to.be.an( 'array' );
		expect( errorDefinition.comment.summary ).to.lengthOf( 1 );
		expect( errorDefinition.comment.summary[ 0 ] ).to.deep.equal( {
			kind: 'text',
			text: 'An error statement occurring inside a method.\n' +
				'\n' +
				'It contains a parameter.'
		} );
		expect( errorDefinition.comment ).to.have.property( 'blockTags' );
		expect( errorDefinition.comment.blockTags ).to.be.an( 'array' );
		expect( errorDefinition.comment.blockTags ).to.lengthOf( 1 );
		expect( errorDefinition.comment.blockTags[ 0 ] ).to.deep.equal( {
			tag: '@param',
			name: 'errorName',
			content: [
				{
					kind: 'text',
					text: 'Description of the error.'
				}
			]
		} );
	} );

	it( 'should find an error tag inside a function', () => {
		const errorDefinition = conversionResult.children.find( doclet => doclet.name === 'customerror-inside-function' );

		expect( errorDefinition ).to.not.be.undefined;
		expect( errorDefinition.name ).to.equal( 'customerror-inside-function' );
		expect( errorDefinition.originalName ).to.equal( 'EventDeclaration' );
		expect( errorDefinition.comment ).to.have.property( 'summary' );
		expect( errorDefinition.comment.summary ).to.be.an( 'array' );
		expect( errorDefinition.comment.summary ).to.lengthOf( 1 );
		expect( errorDefinition.comment.summary[ 0 ] ).to.deep.equal( {
			kind: 'text',
			text: 'An error statement occurring inside a function.\n' +
				'\n' +
				'It contains parameters.'
		} );
		expect( errorDefinition.comment ).to.have.property( 'blockTags' );
		expect( errorDefinition.comment.blockTags ).to.be.an( 'array' );
		expect( errorDefinition.comment.blockTags ).to.lengthOf( 2 );
		expect( errorDefinition.comment.blockTags[ 0 ] ).to.deep.equal( {
			tag: '@param',
			name: 'errorName',
			content: [
				{
					kind: 'text',
					text: 'Description of the error.'
				}
			]
		} );
		expect( errorDefinition.comment.blockTags[ 1 ] ).to.deep.equal( {
			tag: '@param',
			name: 'priority',
			content: [
				{
					kind: 'text',
					text: 'The priority of this error.'
				}
			]
		} );
	} );
} );
