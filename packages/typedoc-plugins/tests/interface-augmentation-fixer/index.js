/**
 * @license Copyright (c) 2003-2023, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

const { expect } = require( 'chai' );
const glob = require( 'fast-glob' );
const TypeDoc = require( 'typedoc' );

const utils = require( '../utils' );

describe( 'typedoc-plugins/interface-augmentation-fixer', function() {
	this.timeout( 10 * 1000 );

	let conversionResult;

	const FIXTURES_PATH = utils.normalizePath( utils.ROOT_TEST_DIRECTORY, 'interface-augmentation-fixer', 'fixtures' );

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
				require.resolve( '@ckeditor/typedoc-plugins/lib/interface-augmentation-fixer' )
			],
			tsconfig: utils.normalizePath( FIXTURES_PATH, 'tsconfig.json' )
		} );

		conversionResult = typeDoc.convert();

		expect( conversionResult ).to.be.an( 'object' );
	} );

	it( 'should add new properties to a non-empty interface definition (augmented by direct path and in re-exported "index.ts")', () => {
		const fooConfigInterface = conversionResult.getChildByName( [ 'interface-augmentation/foo', 'FooConfig' ] );

		expect( fooConfigInterface ).to.not.be.undefined;
		expect( fooConfigInterface ).to.have.property( 'name', 'FooConfig' );
		expect( fooConfigInterface ).to.have.property( 'children' );
		expect( fooConfigInterface.children ).to.be.an( 'array' );
		expect( fooConfigInterface.children ).to.lengthOf( 3 );
		expect( fooConfigInterface.children ).to.satisfy( items => items.some( item => item.name === 'propertyFoo' ) );
		expect( fooConfigInterface.children ).to.satisfy( items => items.some( item => item.name === 'propertyFoobarIndex' ) );
		expect( fooConfigInterface.children ).to.satisfy( items => items.some( item => item.name === 'propertyFoobarSource' ) );
	} );

	it( 'should add new property to an empty interface definition (augmented in re-exported "index.ts")', () => {
		const foobarConfigInterface = conversionResult.getChildByName( [ 'interface-augmentation/foobar', 'FoobarConfig' ] );

		expect( foobarConfigInterface ).to.not.be.undefined;
		expect( foobarConfigInterface ).to.have.property( 'name', 'FoobarConfig' );
		expect( foobarConfigInterface ).to.have.property( 'children' );
		expect( foobarConfigInterface.children ).to.be.an( 'array' );
		expect( foobarConfigInterface.children ).to.lengthOf( 1 );
		expect( foobarConfigInterface.children ).to.satisfy( items => items.some( item => item.name === 'propertyFoobazIndex' ) );
	} );

	it( 'should add new property to an empty interface definition (augmented by direct path)', () => {
		const foobazConfigInterface = conversionResult.getChildByName( [ 'interface-augmentation/foobaz', 'FoobazConfig' ] );

		expect( foobazConfigInterface ).to.not.be.undefined;
		expect( foobazConfigInterface ).to.have.property( 'name', 'FoobazConfig' );
		expect( foobazConfigInterface ).to.have.property( 'children' );
		expect( foobazConfigInterface.children ).to.be.an( 'array' );
		expect( foobazConfigInterface.children ).to.lengthOf( 1 );
		expect( foobazConfigInterface.children ).to.satisfy( items => items.some( item => item.name === 'propertyFoobazingaSource' ) );
	} );

	it( 'should keep the reference to the type after fixing the interface', () => {
		const fooConfigInterface = conversionResult.getChildByName( [ 'interface-augmentation/foo', 'FooConfig' ] );
		const foobarVariable = conversionResult.getChildByName( [ 'interface-augmentation/foobar', 'foobarVariable' ] );

		expect( foobarVariable ).to.not.be.undefined;
		expect( foobarVariable ).to.have.property( 'type' );
		expect( foobarVariable.type ).to.have.property( 'type', 'reference' );

		const target = foobarVariable.type.reflection.tryGetTargetReflectionDeep();

		expect( target ).to.equal( fooConfigInterface );
	} );
} );
