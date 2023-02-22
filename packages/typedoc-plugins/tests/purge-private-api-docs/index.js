/**
 * @license Copyright (c) 2003-2023, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

const { expect } = require( 'chai' );
const glob = require( 'fast-glob' );
const TypeDoc = require( 'typedoc' );

const utils = require( '../utils' );

describe( 'typedoc-plugins/purge-private-api-docs', function() {
	this.timeout( 10 * 1000 );

	let conversionResult;

	const FIXTURES_PATH = utils.normalizePath( utils.ROOT_TEST_DIRECTORY, 'purge-private-api-docs', 'fixtures' );

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
			modifierTags: [
				'@internal'
			],
			plugin: [
				require.resolve( '@ckeditor/typedoc-plugins/lib/module-fixer' ),
				require.resolve( '@ckeditor/typedoc-plugins/lib/purge-private-api-docs' )
			],
			tsconfig: utils.normalizePath( FIXTURES_PATH, 'tsconfig.json' )
		} );

		conversionResult = typeDoc.convert();

		expect( conversionResult ).to.be.an( 'object' );
	} );

	describe( 'public packages', () => {
		it( 'should keep reflections', () => {
			const publicCollection = conversionResult.getChildByName( 'public-package/publiccollection' );

			expect( publicCollection ).to.not.equal( undefined );
			expect( publicCollection.children.length ).to.equal( 1 );
		} );
	} );

	describe( 'private packages without the `@publicApi` annotation', () => {
		it( 'should remove reflections', () => {
			const privateCollection = conversionResult.getChildByName( 'private-package/privatecollection' );

			expect( privateCollection ).to.equal( undefined );
		} );
	} );

	describe( 'private packages with the `@publicApi` annotation - extending a public package', () => {
		it( 'should keep inherited public reflections', () => {
			const extendPublicCollection = conversionResult.getChildByName( [
				'private-package-public-api/extendpubliccollection',
				'ExtendPublicCollection'
			] );

			const publicCollection = conversionResult.getChildByName( [
				'public-package/publiccollection',
				'PublicCollection'
			] );

			expect( publicCollection ).to.not.equal( undefined );
			expect( extendPublicCollection ).to.not.equal( undefined );

			const publicFields = [
				'publicValue',
				'declarePublicValue',
				'getPublicFunction'
			];

			for ( const field of publicFields ) {
				const parentClass = publicCollection.children.find( c => c.name === field );
				const inheritedClass = extendPublicCollection.children.find( c => c.name === field );

				expect( parentClass, `checking "${ field }" in parent class` ).to.not.equal( undefined );
				expect( inheritedClass, `checking "${ field }" in inherited class` ).to.not.equal( undefined );
			}
		} );

		it( 'should keep inherited protected reflections', () => {
			const extendPublicCollection = conversionResult.getChildByName( [
				'private-package-public-api/extendpubliccollection',
				'ExtendPublicCollection'
			] );

			const publicCollection = conversionResult.getChildByName( [
				'public-package/publiccollection',
				'PublicCollection'
			] );

			expect( publicCollection ).to.not.equal( undefined );
			expect( extendPublicCollection ).to.not.equal( undefined );

			const protectedFields = [
				'protectedValue',
				'declareProtectedValue',
				'getProtectedFunction'
			];

			for ( const field of protectedFields ) {
				const parentClass = publicCollection.children.find( c => c.name === field );
				const inheritedClass = extendPublicCollection.children.find( c => c.name === field );

				expect( parentClass, `checking "${ field }" in parent class` ).to.not.equal( undefined );
				expect( inheritedClass, `checking "${ field }" in inherited class` ).to.not.equal( undefined );
			}

			expect( extendPublicCollection.children.find( c => c.name === 'constructor' ) ).to.equal( undefined );
		} );

		it( 'should keep inherited internal reflections (`@internal`)', () => {
			const extendPublicCollection = conversionResult.getChildByName( [
				'private-package-public-api/extendpubliccollection',
				'ExtendPublicCollection'
			] );

			const publicCollection = conversionResult.getChildByName( [
				'public-package/publiccollection',
				'PublicCollection'
			] );

			expect( publicCollection ).to.not.equal( undefined );
			expect( extendPublicCollection ).to.not.equal( undefined );

			const internalFields = [
				'_internalValue',
				'_declareInternalValue',
				'_getInternalFunction'
			];

			for ( const field of internalFields ) {
				const parentClass = publicCollection.children.find( c => c.name === field );
				const inheritedClass = extendPublicCollection.children.find( c => c.name === field );

				expect( parentClass, `checking "${ field }" in parent class` ).to.not.equal( undefined );
				expect( inheritedClass, `checking "${ field }" in inherited class` ).to.not.equal( undefined );
			}
		} );

		it( 'should not keep inherited private reflections (cannot inherit private fields)', () => {
			const extendPublicCollection = conversionResult.getChildByName( [
				'private-package-public-api/extendpubliccollection',
				'ExtendPublicCollection'
			] );

			const publicCollection = conversionResult.getChildByName( [
				'public-package/publiccollection',
				'PublicCollection'
			] );

			expect( publicCollection ).to.not.equal( undefined );
			expect( extendPublicCollection ).to.not.equal( undefined );

			const privateFields = [
				'privateValue',
				'declarePrivateValue',
				'getPrivateFunction'
			];

			for ( const field of privateFields ) {
				const parentClass = publicCollection.children.find( c => c.name === field );
				const inheritedClass = extendPublicCollection.children.find( c => c.name === field );

				expect( parentClass, `checking "${ field }" in parent class` ).to.not.equal( undefined );
				expect( inheritedClass, `checking "${ field }" in inherited class` ).to.equal( undefined );
			}
		} );

		it( 'should remove non-public (direct) fields', () => {
			const extendPublicCollection = conversionResult.getChildByName( [
				'private-package-public-api/extendpubliccollection',
				'ExtendPublicCollection'
			] );

			expect( extendPublicCollection.children.find( c => c.name === 'parent' ) ).to.equal( undefined );
			expect( extendPublicCollection.children.find( c => c.name === 'awesomeProtectedNumber' ) ).to.equal( undefined );
			expect( extendPublicCollection.children.find( c => c.name === 'awesomePrivateNumber' ) ).to.equal( undefined );
			expect( extendPublicCollection.children.find( c => c.name === '_awesomeInternalNumber' ) ).to.equal( undefined );
		} );
	} );

	describe( 'private packages with the `@publicApi` annotation - extending a private package', () => {
		it( 'should keep inherited public reflections', () => {
			const extendPrivateCollection = conversionResult.getChildByName( [
				'private-package-public-api/extendprivatecollection',
				'ExtendPrivateCollection'
			] );

			expect( extendPrivateCollection ).to.not.equal( undefined );

			const publicFields = [
				'publicValue',
				'declarePublicValue',
				'getPublicFunction'
			];

			for ( const field of publicFields ) {
				const inheritedClass = extendPrivateCollection.children.find( c => c.name === field );

				expect( inheritedClass, `checking "${ field }" in inherited class` ).to.not.equal( undefined );
			}
		} );

		it( 'should not keep inherited protected reflections', () => {
			const extendPrivateCollection = conversionResult.getChildByName( [
				'private-package-public-api/extendprivatecollection',
				'ExtendPrivateCollection'
			] );

			expect( extendPrivateCollection ).to.not.equal( undefined );

			const protectedFields = [
				'protectedValue',
				'declareProtectedValue',
				'getProtectedFunction'
			];

			for ( const field of protectedFields ) {
				const inheritedClass = extendPrivateCollection.children.find( c => c.name === field );

				expect( inheritedClass, `checking "${ field }" in inherited class` ).to.equal( undefined );
			}

			expect( extendPrivateCollection.children.find( c => c.name === 'constructor' ) ).to.equal( undefined );
		} );

		it( 'should not keep inherited internal reflections (`@internal`)', () => {
			const extendPrivateCollection = conversionResult.getChildByName( [
				'private-package-public-api/extendprivatecollection',
				'ExtendPrivateCollection'
			] );

			expect( extendPrivateCollection ).to.not.equal( undefined );

			const internalFields = [
				'_internalValue',
				'_declareInternalValue',
				'_getInternalFunction'
			];

			for ( const field of internalFields ) {
				const inheritedClass = extendPrivateCollection.children.find( c => c.name === field );

				expect( inheritedClass, `checking "${ field }" in inherited class` ).to.equal( undefined );
			}
		} );

		it( 'should not keep inherited private reflections (cannot inherit private fields)', () => {
			const extendPrivateCollection = conversionResult.getChildByName( [
				'private-package-public-api/extendprivatecollection',
				'ExtendPrivateCollection'
			] );

			expect( extendPrivateCollection ).to.not.equal( undefined );

			const privateFields = [
				'privateValue',
				'declarePrivateValue',
				'getPrivateFunction'
			];

			for ( const field of privateFields ) {
				const inheritedClass = extendPrivateCollection.children.find( c => c.name === field );

				expect( inheritedClass, `checking "${ field }" in inherited class` ).to.equal( undefined );
			}
		} );

		it( 'should remove non-public (direct) fields', () => {
			const extendPrivateCollection = conversionResult.getChildByName( [
				'private-package-public-api/extendprivatecollection',
				'ExtendPrivateCollection'
			] );

			expect( extendPrivateCollection.children.find( c => c.name === 'parent' ) ).to.equal( undefined );
			expect( extendPrivateCollection.children.find( c => c.name === 'awesomeProtectedNumber' ) ).to.equal( undefined );
			expect( extendPrivateCollection.children.find( c => c.name === 'awesomePrivateNumber' ) ).to.equal( undefined );
			expect( extendPrivateCollection.children.find( c => c.name === '_awesomeInternalNumber' ) ).to.equal( undefined );
		} );
	} );
} );
