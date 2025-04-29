/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { beforeAll, describe, expect, it } from 'vitest';
import { glob } from 'glob';
import upath from 'upath';
import {
	Application,
	Converter,
	ReflectionKind,
	SourceReference,
	DeclarationReflection,
	type Context,
	type ProjectReflection
} from 'typedoc';

import { ROOT_TEST_DIRECTORY } from '../utils.js';
import { typeDocPurgePrivateApiDocs, typeDocRestoreProgramAfterConversion } from '../../src/index.js';

function storeAugmentedInterface( app: Application ) {
	// TODO: To resolve types.
	// @ts-expect-error TS2339
	// Property 'on' does not exist on type 'Converter'.
	app.converter.on( Converter.EVENT_END, ( context: Context ) => {
		context.project.ckeditor5AugmentedInterfaces = [
			createInterface( 'AugmentedInterfacePublic' ),
			createInterface( 'AugmentedInterfacePrivate', true )
		];
	} );
}

function createInterface( name: string, isPrivate?: boolean ) {
	const privatePath = '/fixtures/private-package/src/augmentedinterface.ts';
	const publicPath = '/fixtures/public-package/src/augmentedinterface.ts';
	const fullFileName = upath.join( __dirname + ( isPrivate ? privatePath : publicPath ) );

	const source = new SourceReference( fullFileName, 1, 1 );
	source.url = 'https://github.com/ckeditor/ckeditor5-dev/blob/hash/file.ts#L1';

	const reflection = new DeclarationReflection( name, ReflectionKind.Interface );
	reflection.sources = [ source ];

	return reflection;
}

describe( 'typedoc-plugins/purge-private-api-docs', function() {
	let conversionResult: ProjectReflection;

	const FIXTURES_PATH = upath.join( ROOT_TEST_DIRECTORY, 'purge-private-api-docs', 'fixtures' );

	const sourceFilePatterns = [ upath.join( FIXTURES_PATH, '**', '*.ts' ) ];

	beforeAll( async () => {
		const entryPoints = ( await glob( sourceFilePatterns ) ).map( file => upath.normalize( file ) );

		const typeDoc = await Application.bootstrapWithPlugins( {
			logLevel: 'Error',
			entryPoints,
			tsconfig: upath.join( FIXTURES_PATH, 'tsconfig.json' ),
			plugin: [
				'typedoc-plugin-rename-defaults'
			],
			// TODO: To resolve types.
			// @ts-expect-error TS2322
			// Type 'boolean' is not assignable to type 'string'.
			// For unknown reasons `excludePrivate` type is resolved as `string`.
			excludePrivate: false
		} );

		storeAugmentedInterface( typeDoc );
		typeDocPurgePrivateApiDocs( typeDoc );
		typeDocRestoreProgramAfterConversion( typeDoc );

		expect( entryPoints ).to.not.lengthOf( 0 );

		conversionResult = ( await typeDoc.convert() )!;

		expect( conversionResult ).to.be.an( 'object' );
	} );

	describe( 'public packages', () => {
		it( 'should keep reflections', () => {
			const publicCollection = conversionResult.getChildByName( 'public-package/publiccollection' ) as DeclarationReflection;

			expect( publicCollection ).to.not.equal( undefined );
			expect( publicCollection.children?.length ).to.equal( 1 );
		} );
	} );

	describe( 'private packages without the `@publicApi` annotation', () => {
		it( 'should remove reflections', () => {
			const privateCollection = conversionResult.getChildByName( 'private-package/privatecollection' ) as DeclarationReflection;

			expect( privateCollection ).to.equal( undefined );
		} );
	} );

	describe( 'private packages with the `@publicApi` annotation - extending a public package', () => {
		it( 'should keep inherited public reflections', () => {
			const extendPublicCollection = conversionResult.getChildByName( [
				'private-package-public-api/extendpubliccollection',
				'ExtendPublicCollection'
			] ) as DeclarationReflection;

			const publicCollection = conversionResult.getChildByName( [
				'public-package/publiccollection',
				'PublicCollection'
			] ) as DeclarationReflection;

			expect( publicCollection ).to.not.equal( undefined );
			expect( extendPublicCollection ).to.not.equal( undefined );

			const publicFields = [
				'publicValue',
				'declarePublicValue',
				'getPublicFunction'
			];

			for ( const field of publicFields ) {
				const parentClass = publicCollection.children!.find( c => c.name === field );
				const inheritedClass = extendPublicCollection.children!.find( c => c.name === field );

				expect( parentClass, `checking "${ field }" in parent class` ).to.not.equal( undefined );
				expect( inheritedClass, `checking "${ field }" in inherited class` ).to.not.equal( undefined );
			}
		} );

		it( 'should keep inherited protected reflections', () => {
			const extendPublicCollection = conversionResult.getChildByName( [
				'private-package-public-api/extendpubliccollection',
				'ExtendPublicCollection'
			] ) as DeclarationReflection;

			const publicCollection = conversionResult.getChildByName( [
				'public-package/publiccollection',
				'PublicCollection'
			] ) as DeclarationReflection;

			expect( publicCollection ).to.not.equal( undefined );
			expect( extendPublicCollection ).to.not.equal( undefined );

			const protectedFields = [
				'protectedValue',
				'declareProtectedValue',
				'getProtectedFunction'
			];

			for ( const field of protectedFields ) {
				const parentClass = publicCollection.children!.find( c => c.name === field );
				const inheritedClass = extendPublicCollection.children!.find( c => c.name === field );

				expect( parentClass, `checking "${ field }" in parent class` ).to.not.equal( undefined );
				expect( inheritedClass, `checking "${ field }" in inherited class` ).to.not.equal( undefined );
			}

			expect( extendPublicCollection.children!.find( c => c.name === 'constructor' ) ).to.equal( undefined );
		} );

		it( 'should keep inherited internal reflections (`@internal`)', () => {
			const extendPublicCollection = conversionResult.getChildByName( [
				'private-package-public-api/extendpubliccollection',
				'ExtendPublicCollection'
			] ) as DeclarationReflection;

			const publicCollection = conversionResult.getChildByName( [
				'public-package/publiccollection',
				'PublicCollection'
			] ) as DeclarationReflection;

			expect( publicCollection ).to.not.equal( undefined );
			expect( extendPublicCollection ).to.not.equal( undefined );

			const internalFields = [
				'_internalValue',
				'_declareInternalValue',
				'_getInternalFunction'
			];

			for ( const field of internalFields ) {
				const parentClass = publicCollection.children!.find( c => c.name === field );
				const inheritedClass = extendPublicCollection.children!.find( c => c.name === field );

				expect( parentClass, `checking "${ field }" in parent class` ).to.not.equal( undefined );
				expect( inheritedClass, `checking "${ field }" in inherited class` ).to.not.equal( undefined );
			}
		} );

		it( 'should not keep inherited private reflections (cannot inherit private fields)', () => {
			const extendPublicCollection = conversionResult.getChildByName( [
				'private-package-public-api/extendpubliccollection',
				'ExtendPublicCollection'
			] ) as DeclarationReflection;

			const publicCollection = conversionResult.getChildByName( [
				'public-package/publiccollection',
				'PublicCollection'
			] ) as DeclarationReflection;

			expect( publicCollection ).to.not.equal( undefined );
			expect( extendPublicCollection ).to.not.equal( undefined );

			const privateFields = [
				'privateValue',
				'declarePrivateValue',
				'getPrivateFunction'
			];

			for ( const field of privateFields ) {
				const parentClass = publicCollection.children!.find( c => c.name === field );
				const inheritedClass = extendPublicCollection.children!.find( c => c.name === field );

				expect( parentClass, `checking "${ field }" in parent class` ).to.not.equal( undefined );
				expect( inheritedClass, `checking "${ field }" in inherited class` ).to.equal( undefined );
			}
		} );

		it( 'should remove non-public (direct) fields', () => {
			const extendPublicCollection = conversionResult.getChildByName( [
				'private-package-public-api/extendpubliccollection',
				'ExtendPublicCollection'
			] ) as DeclarationReflection;

			expect( extendPublicCollection.children!.find( c => c.name === 'parent' ) ).to.equal( undefined );
			expect( extendPublicCollection.children!.find( c => c.name === 'awesomeProtectedNumber' ) ).to.equal( undefined );
			expect( extendPublicCollection.children!.find( c => c.name === 'awesomePrivateNumber' ) ).to.equal( undefined );
			expect( extendPublicCollection.children!.find( c => c.name === '_awesomeInternalNumber' ) ).to.equal( undefined );
		} );
	} );

	describe( 'private packages with the `@publicApi` annotation - extending a private package', () => {
		it( 'should keep inherited public reflections', () => {
			const extendPrivateCollection = conversionResult.getChildByName( [
				'private-package-public-api/extendprivatecollection',
				'ExtendPrivateCollection'
			] ) as DeclarationReflection;

			expect( extendPrivateCollection ).to.not.equal( undefined );

			const publicFields = [
				'publicValue',
				'declarePublicValue',
				'getPublicFunction'
			];

			for ( const field of publicFields ) {
				const inheritedClass = extendPrivateCollection.children!.find( c => c.name === field );

				expect( inheritedClass, `checking "${ field }" in inherited class` ).to.not.equal( undefined );
			}
		} );

		it( 'should not keep inherited protected reflections', () => {
			const extendPrivateCollection = conversionResult.getChildByName( [
				'private-package-public-api/extendprivatecollection',
				'ExtendPrivateCollection'
			] ) as DeclarationReflection;

			expect( extendPrivateCollection ).to.not.equal( undefined );

			const protectedFields = [
				'protectedValue',
				'declareProtectedValue',
				'getProtectedFunction'
			];

			for ( const field of protectedFields ) {
				const inheritedClass = extendPrivateCollection.children!.find( c => c.name === field );

				expect( inheritedClass, `checking "${ field }" in inherited class` ).to.equal( undefined );
			}

			expect( extendPrivateCollection.children!.find( c => c.name === 'constructor' ) ).to.equal( undefined );
		} );

		it( 'should not keep inherited internal reflections (`@internal`)', () => {
			const extendPrivateCollection = conversionResult.getChildByName( [
				'private-package-public-api/extendprivatecollection',
				'ExtendPrivateCollection'
			] ) as DeclarationReflection;

			expect( extendPrivateCollection ).to.not.equal( undefined );

			const internalFields = [
				'_internalValue',
				'_declareInternalValue',
				'_getInternalFunction'
			];

			for ( const field of internalFields ) {
				const inheritedClass = extendPrivateCollection.children!.find( c => c.name === field );

				expect( inheritedClass, `checking "${ field }" in inherited class` ).to.equal( undefined );
			}
		} );

		it( 'should not keep inherited private reflections (cannot inherit private fields)', () => {
			const extendPrivateCollection = conversionResult.getChildByName( [
				'private-package-public-api/extendprivatecollection',
				'ExtendPrivateCollection'
			] ) as DeclarationReflection;

			expect( extendPrivateCollection ).to.not.equal( undefined );

			const privateFields = [
				'privateValue',
				'declarePrivateValue',
				'getPrivateFunction'
			];

			for ( const field of privateFields ) {
				const inheritedClass = extendPrivateCollection.children!.find( c => c.name === field );

				expect( inheritedClass, `checking "${ field }" in inherited class` ).to.equal( undefined );
			}
		} );

		it( 'should remove non-public (direct) fields', () => {
			const extendPrivateCollection = conversionResult.getChildByName( [
				'private-package-public-api/extendprivatecollection',
				'ExtendPrivateCollection'
			] ) as DeclarationReflection;

			expect( extendPrivateCollection.children!.find( c => c.name === 'parent' ) ).to.equal( undefined );
			expect( extendPrivateCollection.children!.find( c => c.name === 'awesomeProtectedNumber' ) ).to.equal( undefined );
			expect( extendPrivateCollection.children!.find( c => c.name === 'awesomePrivateNumber' ) ).to.equal( undefined );
			expect( extendPrivateCollection.children!.find( c => c.name === '_awesomeInternalNumber' ) ).to.equal( undefined );
		} );
	} );

	describe( 'augmented interfaces', () => {
		it( 'should remove sources only from private reflections', () => {
			const [ augmentedInterfacePublic, augmentedInterfacePrivate ] = conversionResult.ckeditor5AugmentedInterfaces!;

			expect( augmentedInterfacePublic.sources![ 0 ].url ).not.to.be.undefined;
			expect( augmentedInterfacePrivate.sources![ 0 ].url ).to.be.undefined;
		} );
	} );
} );
