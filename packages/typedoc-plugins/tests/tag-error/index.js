/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

const { expect } = require( 'chai' );
const { glob } = require( 'glob' );
const TypeDoc = require( 'typedoc' );

const utils = require( '../utils' );
const { plugins } = require( '../../lib' );

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
				plugins[ 'typedoc-plugin-tag-error' ]
			],
			tsconfig: utils.normalizePath( FIXTURES_PATH, 'tsconfig.json' )
		} );

		conversionResult = typeDoc.convert();

		expect( conversionResult ).to.be.an( 'object' );
	} );

	it( 'should not collect variable called "error', () => {
		const errorModule = conversionResult.children.find( module => module.name === 'error' );

		const errorDefinitions = errorModule.children.filter( children => children.kindString === 'Error' );

		expect( errorDefinitions ).to.lengthOf( 0 );
	} );

	it( 'should collect the `@error` annotations from block comment codes', () => {
		const errorModule = conversionResult.children.find( module => module.name === 'customerror' );

		const errorDefinitions = errorModule.children.filter( children => children.kindString === 'Error' );

		expect( errorDefinitions ).to.not.lengthOf( 0 );
	} );

	describe( 'error definitions', () => {
		let errorModule;

		before( () => {
			errorModule = conversionResult.children.find( module => module.name === 'customerror' );
		} );

		it( 'should find an error tag without descriptions and parameters', () => {
			const errorDefinition = errorModule.children.find( doclet => doclet.name === 'customerror-inside-method-no-text' );

			expect( errorDefinition ).to.not.be.undefined;
			expect( errorDefinition.name ).to.equal( 'customerror-inside-method-no-text' );
			expect( errorDefinition.originalName ).to.equal( 'customerror-inside-method-no-text' );
			expect( errorDefinition.kindString ).to.equal( 'Error' );

			expect( errorDefinition.comment ).to.have.property( 'summary' );
			expect( errorDefinition.comment ).to.have.property( 'blockTags' );
			expect( errorDefinition.comment ).to.have.property( 'modifierTags' );

			expect( errorDefinition.comment.summary ).to.be.an( 'array' );
			expect( errorDefinition.comment.summary ).to.lengthOf( 0 );
			expect( errorDefinition.comment.blockTags ).to.be.an( 'array' );
			expect( errorDefinition.comment.blockTags ).to.lengthOf( 0 );
			expect( errorDefinition.comment.modifierTags ).to.be.a( 'Set' );
			expect( errorDefinition.comment.modifierTags.size ).to.equal( 0 );
		} );

		it( 'should find an error tag before the module definition (raw text)', () => {
			const errorDefinition = errorModule.children.find( doclet => doclet.name === 'customerror-before-module' );

			expect( errorDefinition ).to.not.be.undefined;
			expect( errorDefinition.name ).to.equal( 'customerror-before-module' );
			expect( errorDefinition.originalName ).to.equal( 'customerror-before-module' );
			expect( errorDefinition.kindString ).to.equal( 'Error' );
			expect( errorDefinition.comment.summary ).to.lengthOf( 1 );
			expect( errorDefinition.comment.summary[ 0 ] ).to.have.property( 'kind', 'text' );
			expect( errorDefinition.comment.summary[ 0 ] ).to.have.property( 'text',
				'An error statement occurring before the `@module` definition.'
			);
		} );

		it( 'should find an error tag before the module definition (with {@link})', () => {
			const errorDefinition = errorModule.children.find( doclet => doclet.name === 'customerror-before-module-with-links' );

			expect( errorDefinition ).to.not.be.undefined;
			expect( errorDefinition.name ).to.equal( 'customerror-before-module-with-links' );
			expect( errorDefinition.originalName ).to.equal( 'customerror-before-module-with-links' );
			expect( errorDefinition.kindString ).to.equal( 'Error' );
			expect( errorDefinition.comment ).to.have.property( 'summary' );
			expect( errorDefinition.comment.summary ).to.lengthOf( 5 );
			expect( errorDefinition.comment.summary[ 0 ] ).to.have.property( 'kind', 'text' );
			expect( errorDefinition.comment.summary[ 0 ] ).to.have.property( 'text',
				'An error statement occurring before the `@module` definition. See '
			);

			expect( errorDefinition.comment.summary[ 1 ] ).to.have.property( 'kind', 'inline-tag' );
			expect( errorDefinition.comment.summary[ 1 ] ).to.have.property( 'tag', '@link' );
			expect( errorDefinition.comment.summary[ 1 ] ).to.have.property( 'text', '~CustomError' );

			expect( errorDefinition.comment.summary[ 2 ] ).to.have.property( 'kind', 'text' );
			expect( errorDefinition.comment.summary[ 2 ] ).to.have.property( 'text', ' or\n' );

			expect( errorDefinition.comment.summary[ 3 ] ).to.have.property( 'kind', 'inline-tag' );
			expect( errorDefinition.comment.summary[ 3 ] ).to.have.property( 'tag', '@link' );
			expect( errorDefinition.comment.summary[ 3 ] ).to.have.property( 'text',
				'module:fixtures/customerror~CustomError Custom label'
			);

			expect( errorDefinition.comment.summary[ 4 ] ).to.have.property( 'kind', 'text' );
			expect( errorDefinition.comment.summary[ 4 ] ).to.have.property( 'text', '. A text after.' );
		} );

		it( 'should find an error tag after the module definition (error with params, pure text)', () => {
			const errorDefinition = errorModule.children.find( doclet => doclet.name === 'customerror-after-module' );

			expect( errorDefinition ).to.not.be.undefined;
			expect( errorDefinition.originalName ).to.equal( 'customerror-after-module' );
			expect( errorDefinition.kindString ).to.equal( 'Error' );
			expect( errorDefinition.comment.summary ).to.lengthOf( 1 );
			expect( errorDefinition.comment.summary[ 0 ] ).to.have.property( 'kind', 'text' );
			expect( errorDefinition.comment.summary[ 0 ] ).to.have.property( 'text',
				'An error statement occurring after the "@module" definition.'
			);
			expect( errorDefinition.typeParameters ).to.be.an( 'array' );
			expect( errorDefinition.typeParameters ).to.lengthOf( 2 );
			expect( errorDefinition.typeParameters[ 0 ] ).to.have.property( 'name', 'exampleNumber' );
			expect( errorDefinition.typeParameters[ 0 ] ).to.have.property( 'comment' );
			expect( errorDefinition.typeParameters[ 0 ].comment ).to.have.property( 'summary' );
			expect( errorDefinition.typeParameters[ 0 ].comment.summary ).to.be.an( 'array' );
			expect( errorDefinition.typeParameters[ 0 ].comment.summary[ 0 ] ).to.have.property( 'kind', 'text' );
			expect( errorDefinition.typeParameters[ 0 ].comment.summary[ 0 ] ).to.have.property( 'text', 'Number description.' );
			expect( errorDefinition.typeParameters[ 1 ] ).to.have.property( 'name', 'exampleString' );
			expect( errorDefinition.typeParameters[ 1 ] ).to.have.property( 'comment' );
			expect( errorDefinition.typeParameters[ 1 ].comment ).to.have.property( 'summary' );
			expect( errorDefinition.typeParameters[ 1 ].comment.summary ).to.be.an( 'array' );
			expect( errorDefinition.typeParameters[ 1 ].comment.summary[ 0 ] ).to.have.property( 'kind', 'text' );
			expect( errorDefinition.typeParameters[ 1 ].comment.summary[ 0 ] ).to.have.property( 'text', 'String `description`.' );
		} );

		it( 'should find an error tag before the export keyword', () => {
			const errorDefinition = errorModule.children.find( doclet => doclet.name === 'customerror-before-export' );

			expect( errorDefinition ).to.not.be.undefined;
			expect( errorDefinition.originalName ).to.equal( 'customerror-before-export' );
			expect( errorDefinition.kindString ).to.equal( 'Error' );
			expect( errorDefinition.comment.summary ).to.lengthOf( 1 );
			expect( errorDefinition.comment.summary[ 0 ] ).to.have.property( 'kind', 'text' );
			expect( errorDefinition.comment.summary[ 0 ] ).to.have.property( 'text',
				'An error statement occurring before the export keyword.'
			);
		} );

		it( 'should find an error tag after the export keyword', () => {
			const errorDefinition = errorModule.children.find( doclet => doclet.name === 'customerror-after-export' );

			expect( errorDefinition ).to.not.be.undefined;
			expect( errorDefinition.originalName ).to.equal( 'customerror-after-export' );
			expect( errorDefinition.kindString ).to.equal( 'Error' );
			expect( errorDefinition.comment.summary ).to.lengthOf( 1 );
			expect( errorDefinition.comment.summary[ 0 ] ).to.have.property( 'kind', 'text' );
			expect( errorDefinition.comment.summary[ 0 ] ).to.have.property( 'text',
				'An error statement occurring after the export keyword.'
			);
		} );

		it( 'should find an error tag inside a method', () => {
			const errorDefinition = errorModule.children.find( doclet => doclet.name === 'customerror-inside-method' );

			expect( errorDefinition ).to.not.be.undefined;
			expect( errorDefinition.name ).to.equal( 'customerror-inside-method' );
			expect( errorDefinition.originalName ).to.equal( 'customerror-inside-method' );
			expect( errorDefinition.kindString ).to.equal( 'Error' );
			expect( errorDefinition.comment ).to.have.property( 'summary' );
			expect( errorDefinition.comment.summary ).to.be.an( 'array' );
			expect( errorDefinition.comment.summary ).to.lengthOf( 1 );
			expect( errorDefinition.comment.summary[ 0 ] ).to.have.property( 'kind', 'text' );
			expect( errorDefinition.comment.summary[ 0 ] ).to.have.property( 'text',
				'An error statement occurring inside a method.\n' +
				'\n' +
				'It contains a parameter.'
			);

			expect( errorDefinition.typeParameters ).to.be.an( 'array' );
			expect( errorDefinition.typeParameters ).to.lengthOf( 3 );
			expect( errorDefinition.typeParameters[ 0 ] ).to.have.property( 'name', 'errorName' );
			expect( errorDefinition.typeParameters[ 0 ] ).to.have.property( 'comment' );
			expect( errorDefinition.typeParameters[ 0 ].comment ).to.have.property( 'summary' );
			expect( errorDefinition.typeParameters[ 0 ].comment.summary ).to.be.an( 'array' );
			expect( errorDefinition.typeParameters[ 0 ].comment.summary ).to.lengthOf( 3 );
			expect( errorDefinition.typeParameters[ 0 ].comment.summary[ 0 ] ).to.have.property( 'kind', 'text' );
			expect( errorDefinition.typeParameters[ 0 ].comment.summary[ 0 ] ).to.have.property( 'text',
				'Description of the error. Please, see '
			);
			expect( errorDefinition.typeParameters[ 0 ].comment.summary[ 1 ] ).to.have.property( 'kind', 'inline-tag' );
			expect( errorDefinition.typeParameters[ 0 ].comment.summary[ 1 ] ).to.have.property( 'tag', '@link' );
			expect( errorDefinition.typeParameters[ 0 ].comment.summary[ 1 ] ).to.have.property( 'text', '~CustomError' );
			expect( errorDefinition.typeParameters[ 0 ].comment.summary[ 2 ] ).to.have.property( 'kind', 'text' );
			expect( errorDefinition.typeParameters[ 0 ].comment.summary[ 2 ] ).to.have.property( 'text', '.' );
			expect( errorDefinition.typeParameters[ 1 ] ).to.have.property( 'name', 'exampleModule' );
			expect( errorDefinition.typeParameters[ 1 ] ).to.have.property( 'comment' );
			expect( errorDefinition.typeParameters[ 1 ].comment ).to.have.property( 'summary' );
			expect( errorDefinition.typeParameters[ 1 ].comment.summary ).to.be.an( 'array' );
			expect( errorDefinition.typeParameters[ 1 ].comment.summary ).to.lengthOf( 1 );
			expect( errorDefinition.typeParameters[ 1 ].comment.summary[ 0 ] ).to.have.property( 'kind', 'text' );
			expect( errorDefinition.typeParameters[ 1 ].comment.summary[ 0 ] ).to.have.property( 'text', 'Just a module.' );
			expect( errorDefinition.typeParameters[ 2 ] ).to.have.property( 'name', 'exampleObject' );
			expect( errorDefinition.typeParameters[ 2 ] ).to.have.property( 'comment' );
			expect( errorDefinition.typeParameters[ 2 ].comment ).to.have.property( 'summary' );
			expect( errorDefinition.typeParameters[ 2 ].comment.summary ).to.be.an( 'array' );
			expect( errorDefinition.typeParameters[ 2 ].comment.summary ).to.lengthOf( 3 );
			expect( errorDefinition.typeParameters[ 2 ].comment.summary[ 0 ] ).to.have.property( 'kind', 'text' );
			expect( errorDefinition.typeParameters[ 2 ].comment.summary[ 0 ] ).to.have.property( 'text', 'A name ' );
			expect( errorDefinition.typeParameters[ 2 ].comment.summary[ 1 ] ).to.have.property( 'kind', 'inline-tag' );
			expect( errorDefinition.typeParameters[ 2 ].comment.summary[ 1 ] ).to.have.property( 'tag', '@link' );
			expect( errorDefinition.typeParameters[ 2 ].comment.summary[ 1 ] ).to.have.property( 'text', 'module:utils/object~Object' );
			expect( errorDefinition.typeParameters[ 2 ].comment.summary[ 2 ] ).to.have.property( 'kind', 'text' );
			expect( errorDefinition.typeParameters[ 2 ].comment.summary[ 2 ] ).to.have.property( 'text', ' `description`.' );
		} );

		it( 'should find an error tag inside a function', () => {
			const errorDefinition = errorModule.children.find( doclet => doclet.name === 'customerror-inside-function' );

			expect( errorDefinition ).to.not.be.undefined;
			expect( errorDefinition.name ).to.equal( 'customerror-inside-function' );
			expect( errorDefinition.originalName ).to.equal( 'customerror-inside-function' );
			expect( errorDefinition.kindString ).to.equal( 'Error' );
			expect( errorDefinition.comment.summary ).to.lengthOf( 1 );
			expect( errorDefinition.comment.summary[ 0 ] ).to.deep.equal( {
				kind: 'text',
				text: 'An error statement occurring inside a function.\n' +
					'\n' +
					'It contains parameters.'
			} );
			expect( errorDefinition.typeParameters ).to.lengthOf( 2 );
			expect( errorDefinition.typeParameters[ 0 ] ).to.have.property( 'name', 'errorName' );
			expect( errorDefinition.typeParameters[ 0 ] ).to.have.property( 'comment' );
			expect( errorDefinition.typeParameters[ 0 ].comment ).to.have.property( 'summary' );
			expect( errorDefinition.typeParameters[ 0 ].comment.summary ).to.be.an( 'array' );
			expect( errorDefinition.typeParameters[ 0 ].comment.summary ).to.lengthOf( 1 );
			expect( errorDefinition.typeParameters[ 0 ].comment.summary[ 0 ] ).to.have.property( 'kind', 'text' );
			expect( errorDefinition.typeParameters[ 0 ].comment.summary[ 0 ] ).to.have.property( 'text', 'Description of the error.' );
			expect( errorDefinition.typeParameters[ 1 ] ).to.have.property( 'name', 'priority' );
			expect( errorDefinition.typeParameters[ 1 ] ).to.have.property( 'comment' );
			expect( errorDefinition.typeParameters[ 1 ].comment ).to.have.property( 'summary' );
			expect( errorDefinition.typeParameters[ 1 ].comment.summary ).to.be.an( 'array' );
			expect( errorDefinition.typeParameters[ 1 ].comment.summary ).to.lengthOf( 1 );
			expect( errorDefinition.typeParameters[ 1 ].comment.summary[ 0 ] ).to.have.property( 'kind', 'text' );
			expect( errorDefinition.typeParameters[ 1 ].comment.summary[ 0 ] ).to.have.property( 'text', 'The priority of this error.' );
		} );

		it( 'should not crash when processing the "error" word in annotations', () => {
			const errorModule = conversionResult.children.find( module => module.name === 'events' );

			expect( errorModule.children.find( doclet => doclet.name === 'ErrorEvent' ) ).to.not.equal( undefined );
			expect( errorModule.children.find( doclet => doclet.name === 'PrefixErrorEvent' ) ).to.not.equal( undefined );
			expect( errorModule.children.find( doclet => doclet.name === 'ErrorSuffixEvent' ) ).to.not.equal( undefined );
		} );
	} );
} );
