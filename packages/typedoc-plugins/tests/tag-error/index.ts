/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { beforeAll, describe, expect, it } from 'vitest';
import { glob } from 'glob';
import upath from 'upath';
import {
	Application,
	ReflectionKind,
	type ProjectReflection,
	type DeclarationReflection,
	type UnionType,
	type ReferenceType
} from 'typedoc';

import { ROOT_TEST_DIRECTORY } from '../utils.js';
import { typeDocTagError } from '../../src/index.js';

describe( 'typedoc-plugins/tag-error', () => {
	let conversionResult: ProjectReflection;

	beforeAll( async () => {
		const FIXTURES_PATH = upath.join( ROOT_TEST_DIRECTORY, 'tag-error', 'fixtures' );

		const sourceFilePatterns = [
			upath.join( FIXTURES_PATH, '**', '*.ts' )
		];

		const files = ( await glob( sourceFilePatterns ) ).map( file => upath.normalize( file ) );
		const typeDoc = await Application.bootstrapWithPlugins( {
			logLevel: 'Error',
			entryPoints: files,
			tsconfig: upath.join( FIXTURES_PATH, 'tsconfig.json' ),
			plugin: [
				'typedoc-plugin-rename-defaults'
			]
		} );

		typeDocTagError( typeDoc );

		expect( files ).to.not.lengthOf( 0 );

		conversionResult = ( await typeDoc.convert() )!;

		expect( conversionResult ).to.be.an( 'object' );
	} );

	it( 'should not collect variable called "error', () => {
		const errorModule = conversionResult.children!.find( module => module.name === 'fixtures/error' )!;
		const errorDefinitions = errorModule.children!.filter( children => {
			return children.kind === ReflectionKind.Document;
		} );

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

			expect( comment ).to.have.property( 'summary' );
			expect( comment.summary ).to.lengthOf( 5 );
			expect( comment.summary[ 0 ] ).to.have.property( 'kind', 'text' );
			expect( comment.summary[ 0 ] ).to.have.property( 'text', 'An error statement occurring before the `@module` definition. See ' );

			expect( comment.summary[ 1 ] ).to.have.property( 'kind', 'inline-tag' );
			expect( comment.summary[ 1 ] ).to.have.property( 'tag', '@link' );
			expect( comment.summary[ 1 ] ).to.have.property( 'text', '~CustomError' );

			expect( comment.summary[ 2 ] ).to.have.property( 'kind', 'text' );
			expect( comment.summary[ 2 ] ).to.have.property( 'text', ' or\n' );

			expect( comment.summary[ 3 ] ).to.have.property( 'kind', 'inline-tag' );
			expect( comment.summary[ 3 ] ).to.have.property( 'tag', '@link' );
			expect( comment.summary[ 3 ] ).to.have.property( 'text', 'module:fixtures/customerror~CustomError Custom label' );

			expect( comment.summary[ 4 ] ).to.have.property( 'kind', 'text' );
			expect( comment.summary[ 4 ] ).to.have.property( 'text', '. A text after.' );
		} );

		it( 'should find an error tag after the module definition', () => {
			const errorDefinition = errorModule.children!.find( doclet => doclet.name === 'customerror-after-module' )!;

			expect( errorDefinition ).to.not.be.undefined;
			expect( errorDefinition.kind ).to.equal( ReflectionKind.Document );
			expect( errorDefinition.isCKEditor5Error ).to.equal( true );
			expect( errorDefinition ).to.have.property( 'comment' );

			const comment = errorDefinition.comment!;

			expect( comment.summary ).to.lengthOf( 1 );
			expect( comment.summary[ 0 ] ).to.have.property( 'kind', 'text' );
			expect( comment.summary[ 0 ] ).to.have.property( 'text', 'An error statement occurring after the "@module" definition.' );
		} );

		it( 'should find an error tag before the export keyword', () => {
			const errorDefinition = errorModule.children!.find( doclet => doclet.name === 'customerror-before-export' )!;

			expect( errorDefinition ).to.not.be.undefined;
			expect( errorDefinition.isCKEditor5Error ).to.equal( true );
			expect( errorDefinition ).to.have.property( 'comment' );

			const comment = errorDefinition.comment!;

			expect( comment.summary ).to.lengthOf( 1 );
			expect( comment.summary[ 0 ] ).to.have.property( 'kind', 'text' );
			expect( comment.summary[ 0 ] ).to.have.property( 'text',
				'An error statement occurring before the export keyword.'
			);
		} );

		it( 'should find an error tag after the export keyword', () => {
			const errorDefinition = errorModule.children!.find( doclet => doclet.name === 'customerror-after-export' )!;

			expect( errorDefinition ).to.not.be.undefined;
			expect( errorDefinition.isCKEditor5Error ).to.equal( true );
			expect( errorDefinition ).to.have.property( 'comment' );

			const comment = errorDefinition.comment!;

			expect( comment.summary ).to.lengthOf( 1 );
			expect( comment.summary[ 0 ] ).to.have.property( 'kind', 'text' );
			expect( comment.summary[ 0 ] ).to.have.property( 'text',
				'An error statement occurring after the export keyword.'
			);
		} );

		it( 'should find an error tag inside a method', () => {
			const errorDefinition = errorModule.children!.find( doclet => doclet.name === 'customerror-inside-method' )!;

			expect( errorDefinition ).to.not.be.undefined;
			expect( errorDefinition.name ).to.equal( 'customerror-inside-method' );
			expect( errorDefinition.isCKEditor5Error ).to.equal( true );
			expect( errorDefinition ).to.have.property( 'comment' );

			const comment = errorDefinition.comment!;

			expect( comment ).to.have.property( 'summary' );
			expect( comment.summary ).to.be.an( 'array' );
			expect( comment.summary ).to.lengthOf( 1 );
			expect( comment.summary[ 0 ] ).to.have.property( 'kind', 'text' );
			expect( comment.summary[ 0 ] ).to.have.property( 'text',
				'An error statement occurring inside a method.\n' +
				'\n' +
				'It contains a parameter.'
			);
		} );

		it( 'should find an error tag inside a function', () => {
			const errorDefinition = errorModule.children!.find( doclet => doclet.name === 'customerror-inside-function' )!;

			expect( errorDefinition ).to.not.be.undefined;
			expect( errorDefinition.name ).to.equal( 'customerror-inside-function' );
			expect( errorDefinition ).to.not.be.undefined;
			expect( errorDefinition.isCKEditor5Error ).to.equal( true );
			expect( errorDefinition ).to.have.property( 'comment' );

			const comment = errorDefinition.comment!;
			expect( comment.summary ).to.lengthOf( 1 );
			expect( comment.summary[ 0 ] ).to.deep.equal( {
				kind: 'text',
				text: 'An error statement occurring inside a function.\n' +
					'\n' +
					'It contains parameters.'
			} );
		} );

		it( 'should not crash when processing the "error" word in annotations', () => {
			const errorModule = conversionResult.children!.find( module => module.name === 'fixtures/events' )!;

			expect( errorModule.children!.find( doclet => doclet.name === 'ErrorEvent' ) ).to.not.equal( undefined );
			expect( errorModule.children!.find( doclet => doclet.name === 'PrefixErrorEvent' ) ).to.not.equal( undefined );
			expect( errorModule.children!.find( doclet => doclet.name === 'ErrorSuffixEvent' ) ).to.not.equal( undefined );
		} );

		describe( 'processing `@param` annotations', () => {
			let errorDefinition: DeclarationReflection;

			beforeAll( () => {
				errorDefinition = errorModule.children!.find( doclet => doclet.name === 'customerror-parameters' )!;

				expect( errorDefinition.isCKEditor5Error ).to.equal( true );
			} );

			it( 'should convert a comment of the `@param` annotation to a summary (including a full module path)', () => {
				const paramDefinition = errorDefinition.parameters.find( param => {
					return param.name === 'linkInDescriptionAbsolute';
				} )!;

				expect( paramDefinition ).to.not.be.undefined;
				expect( paramDefinition ).to.have.property( 'comment' );

				const comment = paramDefinition.comment!;

				expect( comment ).to.have.property( 'summary' );
				expect( comment.summary ).to.be.an( 'array' );
				expect( comment.summary ).to.lengthOf( 3 );
				expect( comment.summary[ 0 ] ).to.have.property( 'kind', 'text' );
				expect( comment.summary[ 0 ] ).to.have.property( 'text', 'A name ' );
				expect( comment.summary[ 1 ] ).to.have.property( 'kind', 'inline-tag' );
				expect( comment.summary[ 1 ] ).to.have.property( 'tag', '@link' );
				expect( comment.summary[ 1 ] ).to.have.property( 'text', 'module:utils/object~Object' );
				expect( comment.summary[ 2 ] ).to.have.property( 'kind', 'text' );
				expect( comment.summary[ 2 ] ).to.have.property( 'text', ' `description`.' );
			} );

			it( 'should convert a comment including an inline tag to a summary', () => {
				const paramDefinition = errorDefinition.parameters.find( param => {
					return param.name === 'linkInDescriptionRelative';
				} )!;

				expect( paramDefinition ).to.not.be.undefined;
				expect( paramDefinition ).to.have.property( 'comment' );

				const comment = paramDefinition.comment!;

				expect( comment.summary ).to.be.an( 'array' );
				expect( comment.summary ).to.lengthOf( 3 );
				expect( comment.summary[ 0 ] ).to.have.property( 'kind', 'text' );
				expect( comment.summary[ 0 ] ).to.have.property( 'text', 'Description of the error. Please, see ' );
				expect( comment.summary[ 1 ] ).to.have.property( 'kind', 'inline-tag' );
				expect( comment.summary[ 1 ] ).to.have.property( 'tag', '@link' );
				expect( comment.summary[ 1 ] ).to.have.property( 'text', '~CustomError' );
				expect( comment.summary[ 2 ] ).to.have.property( 'kind', 'text' );
				expect( comment.summary[ 2 ] ).to.have.property( 'text', '.' );
			} );

			it( 'should convert an intrinsic type (boolean) using a TypeDoc notation', () => {
				const paramDefinition = errorDefinition.parameters.find( param => {
					return param.name === 'intrinsicType';
				} )!;

				const intrinsicType = paramDefinition.type;

				expect( intrinsicType ).to.have.property( 'name', 'boolean' );
				expect( intrinsicType ).to.have.property( 'type', 'intrinsic' );
			} );

			it( 'should convert an intrinsic type (union) using a TypeDoc notation', () => {
				const paramDefinition = errorDefinition.parameters.find( param => {
					return param.name === 'unionType';
				} )!;

				const unionType = paramDefinition.type as UnionType;

				expect( unionType ).to.have.property( 'types' );

				const [ firstType, secondType ] = unionType.types;

				expect( firstType ).to.have.property( 'name', 'string' );
				expect( firstType ).to.have.property( 'type', 'intrinsic' );
				expect( secondType ).to.have.property( 'name', 'number' );
				expect( secondType ).to.have.property( 'type', 'intrinsic' );
			} );

			it( 'should convert a `module:` type to a reference if a module exists', () => {
				const paramDefinition = errorDefinition.parameters.find( param => {
					return param.name === 'exampleModule';
				} )!;

				const referenceType = paramDefinition.type as ReferenceType;

				expect( referenceType.reflection ).to.have.property( 'name', 'Error' );
				expect( referenceType.reflection ).to.have.property( 'kind', ReflectionKind.Class );
			} );

			it( 'should convert a `module:` type to a reference if a module exists (including children)', () => {
				const paramDefinition = errorDefinition.parameters.find( param => {
					return param.name === 'exampleInterfaceChildren';
				} )!;

				const referenceType = paramDefinition.type as ReferenceType;

				expect( referenceType.reflection ).to.have.property( 'name', 'customPropertyInInterface' );
				expect( referenceType.reflection ).to.have.property( 'kind', ReflectionKind.Property );
			} );

			it( 'should convert a `module:` type to `any` if a module does not exist', () => {
				const paramDefinition = errorDefinition.parameters.find( param => {
					return param.name === 'exampleMissingModule';
				} )!;

				const intrinsicType = paramDefinition.type;

				expect( intrinsicType ).to.have.property( 'name', 'any' );
				expect( intrinsicType ).to.have.property( 'type', 'intrinsic' );
			} );

			it( 'should convert a dot notation `@param` type to `any` (unsupported syntax)', () => {
				const paramDefinition = errorDefinition.parameters.find( param => {
					return param.name === 'nestedObject';
				} )!;

				const intrinsicType = paramDefinition.type;

				expect( intrinsicType ).to.have.property( 'name', 'any' );
				expect( intrinsicType ).to.have.property( 'type', 'intrinsic' );
			} );

			it( 'should ignore an `@param` annotation without a description', () => {
				const paramDefinition = errorDefinition.parameters.find( param => {
					return param.name === 'paramMissingDescription';
				} );

				expect( paramDefinition ).to.be.undefined;
			} );

			it( 'should ignore an `@param` annotation without a type (`{...}`)', () => {
				const paramDefinition = errorDefinition.parameters.find( param => {
					return param.name === 'paramMissingType';
				} );

				expect( paramDefinition ).to.be.undefined;
			} );
		} );
	} );
} );
