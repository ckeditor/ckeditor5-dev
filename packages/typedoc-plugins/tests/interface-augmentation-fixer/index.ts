/**
 * @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { beforeAll, describe, expect, it } from 'vitest';
import { glob } from 'glob';
import upath from 'upath';
import {
	Application,
	type ProjectReflection,
	type ReferenceType,
	type ReferenceReflection,
	type DeclarationReflection
} from 'typedoc';

import { ROOT_TEST_DIRECTORY } from '../utils.js';
import { typeDocInterfaceAugmentationFixer, typeDocRestoreProgramAfterConversion } from '../../src/index.js';

describe( 'typedoc-plugins/interface-augmentation-fixer', () => {
	let conversionResult: ProjectReflection;

	const FIXTURES_PATH = upath.join( ROOT_TEST_DIRECTORY, 'interface-augmentation-fixer', 'fixtures' );

	const sourceFilePatterns = [ upath.join( FIXTURES_PATH, '**', '*.ts' ) ];

	beforeAll( async () => {
		const entryPoints = ( await glob( sourceFilePatterns ) ).map( file => upath.normalize( file ) );

		const typeDoc = await Application.bootstrapWithPlugins( {
			logLevel: 'Error',
			entryPoints,
			tsconfig: upath.join( FIXTURES_PATH, 'tsconfig.test.json' ),
			plugin: [
				'typedoc-plugin-rename-defaults'
			]
		} );

		typeDocInterfaceAugmentationFixer( typeDoc );
		typeDocRestoreProgramAfterConversion( typeDoc );

		expect( entryPoints ).to.not.lengthOf( 0 );

		conversionResult = ( await typeDoc.convert() )!;

		expect( conversionResult ).to.be.an( 'object' );
	} );

	it( 'should add new properties to a non-empty interface definition (augmented by direct path and in re-exported "index.ts")', () => {
		const fooConfigInterface = conversionResult
			.getChildByName( [ 'interface-augmentation/foo', 'FooConfig' ] ) as DeclarationReflection;

		expect( fooConfigInterface ).to.not.be.undefined;
		expect( fooConfigInterface ).to.have.property( 'name', 'FooConfig' );
		expect( fooConfigInterface ).to.have.property( 'children' );
		expect( fooConfigInterface.children ).to.be.an( 'array' );
		expect( fooConfigInterface.children ).to.lengthOf( 3 );
		expect( fooConfigInterface.children ).to.satisfy(
			( items: Array<DeclarationReflection> ) => items.some( item => item.name === 'propertyFoo' )
		);
		expect( fooConfigInterface.children ).to.satisfy(
			( items: Array<DeclarationReflection> ) => items.some( item => item.name === 'propertyFoobarIndex' )
		);
		expect( fooConfigInterface.children ).to.satisfy(
			( items: Array<DeclarationReflection> ) => items.some( item => item.name === 'propertyFoobarSource' )
		);
	} );

	it( 'should add new property to an empty interface definition (augmented in re-exported "index.ts")', () => {
		const foobarConfigInterface = conversionResult
			.getChildByName( [ 'interface-augmentation/foobar', 'FoobarConfig' ] ) as DeclarationReflection;

		expect( foobarConfigInterface ).to.not.be.undefined;
		expect( foobarConfigInterface ).to.have.property( 'name', 'FoobarConfig' );
		expect( foobarConfigInterface ).to.have.property( 'children' );
		expect( foobarConfigInterface.children ).to.be.an( 'array' );
		expect( foobarConfigInterface.children ).to.lengthOf( 1 );
		expect( foobarConfigInterface.children ).to.satisfy(
			( items: Array<DeclarationReflection> ) => items.some( item => item.name === 'propertyFoobazIndex' )
		);
	} );

	it( 'should add new property to an empty interface definition (augmented by direct path)', () => {
		const foobazConfigInterface = conversionResult
			.getChildByName( [ 'interface-augmentation/foobaz', 'FoobazConfig' ] ) as DeclarationReflection;

		expect( foobazConfigInterface ).to.not.be.undefined;
		expect( foobazConfigInterface ).to.have.property( 'name', 'FoobazConfig' );
		expect( foobazConfigInterface ).to.have.property( 'children' );
		expect( foobazConfigInterface.children ).to.be.an( 'array' );
		expect( foobazConfigInterface.children ).to.lengthOf( 1 );
		expect( foobazConfigInterface.children ).to.satisfy(
			( items: Array<DeclarationReflection> ) => items.some( item => item.name === 'propertyFoobazingaSource' )
		);
	} );

	it( 'should keep the reference to the type after fixing the interface', () => {
		const fooConfigInterface = conversionResult
			.getChildByName( [ 'interface-augmentation/foo', 'FooConfig' ] ) as DeclarationReflection;
		const foobarVariable = conversionResult
			.getChildByName( [ 'interface-augmentation/foobar', 'foobarVariable' ] ) as DeclarationReflection;

		expect( foobarVariable ).to.not.be.undefined;
		expect( foobarVariable ).to.have.property( 'type' );
		expect( foobarVariable.type ).to.have.property( 'type', 'reference' );

		const reflection = ( foobarVariable.type as ReferenceType ).reflection as ReferenceReflection;

		expect( reflection ).to.equal( fooConfigInterface );
	} );

	it( 'should store augmented interfaces which are re-exported in "index.ts"', () => {
		const augmentedInterfaces = conversionResult.project.ckeditor5AugmentedInterfaces!;

		expect( augmentedInterfaces ).to.have.length( 2 );

		const [ foobarConfigInterface, fooConfigInterface ] = augmentedInterfaces;

		expect( foobarConfigInterface ).not.to.be.undefined;
		expect( foobarConfigInterface ).to.have.property( 'name', 'FoobarConfig' );

		expect( fooConfigInterface ).not.to.be.undefined;
		expect( fooConfigInterface ).to.have.property( 'name', 'FooConfig' );
	} );
} );
