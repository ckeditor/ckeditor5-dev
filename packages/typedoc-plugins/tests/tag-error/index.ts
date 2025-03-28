/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { beforeAll, describe, expect, it } from 'vitest';
import { glob } from 'glob';
import { Application, type ProjectReflection, type DeclarationReflection, ReflectionKind } from 'typedoc';

import { normalizePath, ROOT_TEST_DIRECTORY } from '../utils.js';
import { typeDocTagError } from '../../lib/index.js';

describe( 'typedoc-plugins/tag-error', function () {
	let conversionResult: ProjectReflection;

	beforeAll( async () => {
		const FIXTURES_PATH = normalizePath( ROOT_TEST_DIRECTORY, 'tag-error', 'fixtures' );

		const sourceFilePatterns = [
			normalizePath( FIXTURES_PATH, '**', '*.ts' )
		];

		const files = await glob( sourceFilePatterns );
		const typeDoc = await Application.bootstrapWithPlugins( {
			logLevel: 'Error',
			entryPoints: files,
			tsconfig: normalizePath( FIXTURES_PATH, 'tsconfig.json' )
		} );

		typeDocTagError( typeDoc );

		expect( files ).to.not.lengthOf( 0 );

		conversionResult = ( await typeDoc.convert() )!;

		await typeDoc.generateJson(
			conversionResult,
			'/home/pomek/Projects/ckeditor/ckeditor5/external/ckeditor5-dev/packages/typedoc-plugins/output.json'
		);

		expect( conversionResult ).to.be.an( 'object' );
	} );

	it( 'should not collect variable called "error', () => {
		const errorModule = conversionResult.children!.find( module => module.name === 'fixtures/error' )!;

		// TODO: Align based on the remaining tests.
		const errorDefinitions = errorModule.children!.filter( children => children.kind === ReflectionKind.Document );

		expect( errorDefinitions ).to.lengthOf( 0 );
	} );

	it( 'should collect the `@error` annotations from block comment codes', () => {
		const errorModule = conversionResult.children!.find( module => module.name === 'customerror' );

		const errorDefinitions = errorModule!.children!.filter( children => {
			return children.kind === ReflectionKind.Document;
		} );

		expect( errorDefinitions ).to.not.lengthOf( 0 );
	} );

	describe( 'error definitions', () => {
		let errorModule: DeclarationReflection;

		beforeAll( () => {
			errorModule = conversionResult.children!.find( module => module.name === 'customerror' )!;
		} );

		it( 'should find an error tag without descriptions and parameters', () => {
			const errorDefinition = errorModule.children!.find( doclet => doclet.name === 'customerror-inside-method-no-text' )!;

			expect( errorDefinition ).to.not.be.undefined;
			expect( errorDefinition.name ).to.equal( 'customerror-inside-method-no-text' );
			expect( errorDefinition.kind ).to.equal( ReflectionKind.Document );
			expect( errorDefinition.isCKEditor5Error ).to.equal( true );

			expect( errorDefinition ).to.have.property( 'comment' );
			const comment = errorDefinition.comment!;

			expect( comment ).to.have.property( 'summary' );
			expect( comment ).to.have.property( 'blockTags' );
			expect( comment ).to.have.property( 'modifierTags' );
			expect( comment.summary ).to.be.an( 'array' );
			expect( comment.summary ).to.lengthOf( 0 );
			expect( comment.blockTags ).to.be.an( 'array' );
			expect( comment.blockTags ).to.lengthOf( 0 );
			expect( comment.modifierTags ).to.be.a( 'Set' );
			expect( comment.modifierTags.size ).to.equal( 0 );
		} );

		it( 'should find an error tag before the module definition (raw text)', () => {
			const errorDefinition = errorModule.children!.find( doclet => doclet.name === 'customerror-before-module' )!;

			expect( errorDefinition ).to.not.be.undefined;
			expect( errorDefinition.name ).to.equal( 'customerror-before-module' );
			expect( errorDefinition.kind ).to.equal( ReflectionKind.Document );
			expect( errorDefinition.isCKEditor5Error ).to.equal( true );
			expect( errorDefinition ).to.have.property( 'comment' );

			const comment = errorDefinition.comment!;

			expect( comment.summary ).to.lengthOf( 1 );
			expect( comment.summary[ 0 ] ).to.have.property( 'kind', 'text' );
			expect( comment.summary[ 0 ] ).to.have.property( 'text', 'An error statement occurring before the `@module` definition.' );
		} );

		it( 'should find an error tag before the module definition (with {@link})', () => {
			const errorDefinition = errorModule.children!.find( doclet => doclet.name === 'customerror-before-module-with-links' )!;

			expect( errorDefinition ).to.not.be.undefined;
			expect( errorDefinition.name ).to.equal( 'customerror-before-module-with-links' );
			expect( errorDefinition.kind ).to.equal( ReflectionKind.Document );
			expect( errorDefinition.isCKEditor5Error ).to.equal( true );
			expect( errorDefinition ).to.have.property( 'comment' );

			const comment = errorDefinition.comment!;

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
		//
		// it( 'should find an error tag after the module definition (error with params, pure text)', () => {
		// 	const errorDefinition = errorModule.children!.find( doclet => doclet.name === 'customerror-after-module' )!;
		//
		// 	expect( errorDefinition ).to.not.be.undefined;
		// 	expect( errorDefinition.originalName ).to.equal( 'customerror-after-module' );
		// 				expect( errorDefinition.kind ).to.equal( ReflectionKind.Document );
		// 	expect( errorDefinition.isCKEditor5Error ).to.equal( true );
		// 	expect( errorDefinition.comment.summary ).to.lengthOf( 1 );
		// 	expect( errorDefinition.comment.summary[ 0 ] ).to.have.property( 'kind', 'text' );
		// 	expect( errorDefinition.comment.summary[ 0 ] ).to.have.property( 'text',
		// 		'An error statement occurring after the "@module" definition.'
		// 	);
		// 	expect( errorDefinition.typeParameters ).to.be.an( 'array' );
		// 	expect( errorDefinition.typeParameters ).to.lengthOf( 2 );
		// 	expect( errorDefinition.typeParameters[ 0 ] ).to.have.property( 'name', 'exampleNumber' );
		// 	expect( errorDefinition.typeParameters[ 0 ] ).to.have.property( 'comment' );
		// 	expect( errorDefinition.typeParameters[ 0 ].comment ).to.have.property( 'summary' );
		// 	expect( errorDefinition.typeParameters[ 0 ].comment.summary ).to.be.an( 'array' );
		// 	expect( errorDefinition.typeParameters[ 0 ].comment.summary[ 0 ] ).to.have.property( 'kind', 'text' );
		// 	expect( errorDefinition.typeParameters[ 0 ].comment.summary[ 0 ] ).to.have.property( 'text', 'Number description.' );
		// 	expect( errorDefinition.typeParameters[ 1 ] ).to.have.property( 'name', 'exampleString' );
		// 	expect( errorDefinition.typeParameters[ 1 ] ).to.have.property( 'comment' );
		// 	expect( errorDefinition.typeParameters[ 1 ].comment ).to.have.property( 'summary' );
		// 	expect( errorDefinition.typeParameters[ 1 ].comment.summary ).to.be.an( 'array' );
		// 	expect( errorDefinition.typeParameters[ 1 ].comment.summary[ 0 ] ).to.have.property( 'kind', 'text' );
		// 	expect( errorDefinition.typeParameters[ 1 ].comment.summary[ 0 ] ).to.have.property( 'text', 'String `description`.' );
		// } );
		//
		// it( 'should find an error tag before the export keyword', () => {
		// 	const errorDefinition = errorModule.children!.find( doclet => doclet.name === 'customerror-before-export' )!;
		//
		// 	expect( errorDefinition ).to.not.be.undefined;
		// 	expect( errorDefinition.originalName ).to.equal( 'customerror-before-export' );
		// 				expect( errorDefinition.kind ).to.equal( ReflectionKind.Document );
		// 	expect( errorDefinition.isCKEditor5Error ).to.equal( true );
		// 	expect( errorDefinition.comment.summary ).to.lengthOf( 1 );
		// 	expect( errorDefinition.comment.summary[ 0 ] ).to.have.property( 'kind', 'text' );
		// 	expect( errorDefinition.comment.summary[ 0 ] ).to.have.property( 'text',
		// 		'An error statement occurring before the export keyword.'
		// 	);
		// } );
		//
		// it( 'should find an error tag after the export keyword', () => {
		// 	const errorDefinition = errorModule.children!.find( doclet => doclet.name === 'customerror-after-export' )!;
		//
		// 	expect( errorDefinition ).to.not.be.undefined;
		// 	expect( errorDefinition.originalName ).to.equal( 'customerror-after-export' );
		// 				expect( errorDefinition.kind ).to.equal( ReflectionKind.Document );
		// 	expect( errorDefinition.isCKEditor5Error ).to.equal( true );
		// 	expect( errorDefinition.comment.summary ).to.lengthOf( 1 );
		// 	expect( errorDefinition.comment.summary[ 0 ] ).to.have.property( 'kind', 'text' );
		// 	expect( errorDefinition.comment.summary[ 0 ] ).to.have.property( 'text',
		// 		'An error statement occurring after the export keyword.'
		// 	);
		// } );
		//
		// it( 'should find an error tag inside a method', () => {
		// 	const errorDefinition = errorModule.children!.find( doclet => doclet.name === 'customerror-inside-method' )!;
		//
		// 	expect( errorDefinition ).to.not.be.undefined;
		// 	expect( errorDefinition.name ).to.equal( 'customerror-inside-method' );
		// 	expect( errorDefinition.originalName ).to.equal( 'customerror-inside-method' );
		// 				expect( errorDefinition.kind ).to.equal( ReflectionKind.Document );
		// 	expect( errorDefinition.isCKEditor5Error ).to.equal( true );
		// 	expect( errorDefinition.comment ).to.have.property( 'summary' );
		// 	expect( errorDefinition.comment.summary ).to.be.an( 'array' );
		// 	expect( errorDefinition.comment.summary ).to.lengthOf( 1 );
		// 	expect( errorDefinition.comment.summary[ 0 ] ).to.have.property( 'kind', 'text' );
		// 	expect( errorDefinition.comment.summary[ 0 ] ).to.have.property( 'text',
		// 		'An error statement occurring inside a method.\n' +
		// 		'\n' +
		// 		'It contains a parameter.'
		// 	);
		//
		// 	expect( errorDefinition.typeParameters ).to.be.an( 'array' );
		// 	expect( errorDefinition.typeParameters ).to.lengthOf( 3 );
		// 	expect( errorDefinition.typeParameters[ 0 ] ).to.have.property( 'name', 'errorName' );
		// 	expect( errorDefinition.typeParameters[ 0 ] ).to.have.property( 'comment' );
		// 	expect( errorDefinition.typeParameters[ 0 ].comment ).to.have.property( 'summary' );
		// 	expect( errorDefinition.typeParameters[ 0 ].comment.summary ).to.be.an( 'array' );
		// 	expect( errorDefinition.typeParameters[ 0 ].comment.summary ).to.lengthOf( 3 );
		// 	expect( errorDefinition.typeParameters[ 0 ].comment.summary[ 0 ] ).to.have.property( 'kind', 'text' );
		// 	expect( errorDefinition.typeParameters[ 0 ].comment.summary[ 0 ] ).to.have.property( 'text',
		// 		'Description of the error. Please, see '
		// 	);
		// 	expect( errorDefinition.typeParameters[ 0 ].comment.summary[ 1 ] ).to.have.property( 'kind', 'inline-tag' );
		// 	expect( errorDefinition.typeParameters[ 0 ].comment.summary[ 1 ] ).to.have.property( 'tag', '@link' );
		// 	expect( errorDefinition.typeParameters[ 0 ].comment.summary[ 1 ] ).to.have.property( 'text', '~CustomError' );
		// 	expect( errorDefinition.typeParameters[ 0 ].comment.summary[ 2 ] ).to.have.property( 'kind', 'text' );
		// 	expect( errorDefinition.typeParameters[ 0 ].comment.summary[ 2 ] ).to.have.property( 'text', '.' );
		// 	expect( errorDefinition.typeParameters[ 1 ] ).to.have.property( 'name', 'exampleModule' );
		// 	expect( errorDefinition.typeParameters[ 1 ] ).to.have.property( 'comment' );
		// 	expect( errorDefinition.typeParameters[ 1 ].comment ).to.have.property( 'summary' );
		// 	expect( errorDefinition.typeParameters[ 1 ].comment.summary ).to.be.an( 'array' );
		// 	expect( errorDefinition.typeParameters[ 1 ].comment.summary ).to.lengthOf( 1 );
		// 	expect( errorDefinition.typeParameters[ 1 ].comment.summary[ 0 ] ).to.have.property( 'kind', 'text' );
		// 	expect( errorDefinition.typeParameters[ 1 ].comment.summary[ 0 ] ).to.have.property( 'text', 'Just a module.' );
		// 	expect( errorDefinition.typeParameters[ 2 ] ).to.have.property( 'name', 'exampleObject' );
		// 	expect( errorDefinition.typeParameters[ 2 ] ).to.have.property( 'comment' );
		// 	expect( errorDefinition.typeParameters[ 2 ].comment ).to.have.property( 'summary' );
		// 	expect( errorDefinition.typeParameters[ 2 ].comment.summary ).to.be.an( 'array' );
		// 	expect( errorDefinition.typeParameters[ 2 ].comment.summary ).to.lengthOf( 3 );
		// 	expect( errorDefinition.typeParameters[ 2 ].comment.summary[ 0 ] ).to.have.property( 'kind', 'text' );
		// 	expect( errorDefinition.typeParameters[ 2 ].comment.summary[ 0 ] ).to.have.property( 'text', 'A name ' );
		// 	expect( errorDefinition.typeParameters[ 2 ].comment.summary[ 1 ] ).to.have.property( 'kind', 'inline-tag' );
		// 	expect( errorDefinition.typeParameters[ 2 ].comment.summary[ 1 ] ).to.have.property( 'tag', '@link' );
		// 	expect( errorDefinition.typeParameters[ 2 ].comment.summary[ 1 ] ).to.have.property( 'text', 'module:utils/object~Object' );
		// 	expect( errorDefinition.typeParameters[ 2 ].comment.summary[ 2 ] ).to.have.property( 'kind', 'text' );
		// 	expect( errorDefinition.typeParameters[ 2 ].comment.summary[ 2 ] ).to.have.property( 'text', ' `description`.' );
		// } );
		//
		// it( 'should find an error tag inside a function', () => {
		// 	const errorDefinition = errorModule.children!.find( doclet => doclet.name === 'customerror-inside-function' )!;
		//
		// 	expect( errorDefinition ).to.not.be.undefined;
		// 	expect( errorDefinition.name ).to.equal( 'customerror-inside-function' );
		// 	expect( errorDefinition.originalName ).to.equal( 'customerror-inside-function' );
		// 				expect( errorDefinition.kind ).to.equal( ReflectionKind.Document );
		// 	expect( errorDefinition.isCKEditor5Error ).to.equal( true );
		// 	expect( errorDefinition.comment.summary ).to.lengthOf( 1 );
		// 	expect( errorDefinition.comment.summary[ 0 ] ).to.deep.equal( {
		// 		kind: 'text',
		// 		text: 'An error statement occurring inside a function.\n' +
		// 			'\n' +
		// 			'It contains parameters.'
		// 	} );
		// 	expect( errorDefinition.typeParameters ).to.lengthOf( 2 );
		// 	expect( errorDefinition.typeParameters[ 0 ] ).to.have.property( 'name', 'errorName' );
		// 	expect( errorDefinition.typeParameters[ 0 ] ).to.have.property( 'comment' );
		// 	expect( errorDefinition.typeParameters[ 0 ].comment ).to.have.property( 'summary' );
		// 	expect( errorDefinition.typeParameters[ 0 ].comment.summary ).to.be.an( 'array' );
		// 	expect( errorDefinition.typeParameters[ 0 ].comment.summary ).to.lengthOf( 1 );
		// 	expect( errorDefinition.typeParameters[ 0 ].comment.summary[ 0 ] ).to.have.property( 'kind', 'text' );
		// 	expect( errorDefinition.typeParameters[ 0 ].comment.summary[ 0 ] ).to.have.property( 'text', 'Description of the error.' );
		// 	expect( errorDefinition.typeParameters[ 1 ] ).to.have.property( 'name', 'priority' );
		// 	expect( errorDefinition.typeParameters[ 1 ] ).to.have.property( 'comment' );
		// 	expect( errorDefinition.typeParameters[ 1 ].comment ).to.have.property( 'summary' );
		// 	expect( errorDefinition.typeParameters[ 1 ].comment.summary ).to.be.an( 'array' );
		// 	expect( errorDefinition.typeParameters[ 1 ].comment.summary ).to.lengthOf( 1 );
		// 	expect( errorDefinition.typeParameters[ 1 ].comment.summary[ 0 ] ).to.have.property( 'kind', 'text' );
		// 	expect( errorDefinition.typeParameters[ 1 ].comment.summary[ 0 ] ).to.have.property( 'text', 'The priority of this error.' );
		// } );
		//
		// it( 'should not crash when processing the "error" word in annotations', () => {
		// 	const errorModule = conversionResult.children!.find( module => module.name === 'events' );
		//
		// 	expect( errorModule.children!.find( doclet => doclet.name === 'ErrorEvent' ) ).to.not.equal( undefined );
		// 	expect( errorModule.children!.find( doclet => doclet.name === 'PrefixErrorEvent' ) ).to.not.equal( undefined );
		// 	expect( errorModule.children!.find( doclet => doclet.name === 'ErrorSuffixEvent' ) ).to.not.equal( undefined );
		// } );
	} );
} );
