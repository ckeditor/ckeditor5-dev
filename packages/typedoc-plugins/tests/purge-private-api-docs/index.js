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
			expect( conversionResult.getChildByName( 'public-package/classinpublicpackage' ) ).to.not.equal( undefined );
		} );
	} );

	describe( 'private packages without the `@publicApi` annotation', () => {
		it( 'should remove reflections', () => {
			expect( conversionResult.getChildByName( 'private-package/model/model' ) ).to.equal( undefined );
			expect( conversionResult.getChildByName( 'private-package/view/node/node' ) ).to.equal( undefined );
		} );
	} );

	describe( 'private packages with the `@publicApi` annotation', () => {
		beforeEach( () => {
			expect(
				conversionResult.getChildByName( 'private-public-api-package/classinprivatepublicapipackage' )
			).to.not.equal( undefined );
		} );

		it( 'should keep public reflections', () => {
			const publicValue = Object.values( conversionResult.reflections )
				.find( reflection => reflection.name === 'publicValue' && reflection.parent.name === 'ClassInPrivatePublicApiPackage' );

			expect( publicValue ).to.not.equal( undefined );
		} );

		it( 'should remove private reflections', () => {
			const privateValue = Object.values( conversionResult.reflections )
				.find( reflection => reflection.name === 'privateValue' && reflection.parent.name === 'ClassInPrivatePublicApiPackage' );

			expect( privateValue ).to.equal( undefined );
		} );

		it( 'should keep public reflections inherited from public packages', () => {
			const inheritedProtectedValueReflection = Object.values( conversionResult.reflections )
				.find( reflection => reflection.name === 'publicValue' && reflection.parent.name === 'PublicInheritor' );

			expect( inheritedProtectedValueReflection ).to.not.equal( undefined );
		} );

		it( 'should keep public reflections inherited from private packages', () => {
			const inheritedProtectedValueReflection = Object.values( conversionResult.reflections )
				.find( reflection => reflection.name === 'publicValue' && reflection.parent.name === 'PrivateInheritor' );

			expect( inheritedProtectedValueReflection ).to.not.equal( undefined );
		} );

		it( 'should keep protected reflections inherited from public packages', () => {
			const inheritedProtectedValueReflection = Object.values( conversionResult.reflections )
				.find( reflection => reflection.name === 'protectedValue' && reflection.parent.name === 'PublicInheritor' );

			expect( inheritedProtectedValueReflection ).to.not.equal( undefined );
		} );

		it( 'should remove protected reflections inherited from private packages', () => {
			const inheritedProtectedValueReflection = Object.values( conversionResult.reflections )
				.find( reflection => reflection.name === 'protectedValue' && reflection.parent.name === 'PrivateInheritor' );

			expect( inheritedProtectedValueReflection ).to.equal( undefined );
		} );
	} );
} );
