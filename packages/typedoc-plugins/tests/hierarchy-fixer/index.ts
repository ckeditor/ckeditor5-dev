/**
 * @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { describe, it, beforeAll, expect } from 'vitest';
import { glob } from 'glob';
import upath from 'upath';
import {
	Application,
	Converter,
	ReferenceType,
	ReflectionKind,
	type Context,
	type DeclarationReflection,
	type ProjectReflection
} from 'typedoc';

import { ROOT_TEST_DIRECTORY } from '../utils.js';
import { typeDocHierarchyFixer, typeDocRestoreProgramAfterConversion } from '../../src/index.js';
import { getPluginPriority } from '../../src/utils/getpluginpriority.js';

describe( 'typedoc-plugins/hierarchy-fixer', () => {
	let conversionResult: ProjectReflection;

	beforeAll( async () => {
		const FIXTURES_PATH = upath.join( ROOT_TEST_DIRECTORY, 'hierarchy-fixer', 'fixtures' );

		const sourceFilePatterns = [
			upath.join( FIXTURES_PATH, '**', '*.ts' )
		];

		const files = ( await glob( sourceFilePatterns ) ).map( file => upath.normalize( file ) );
		const typeDoc = await Application.bootstrapWithPlugins( {
			logLevel: 'Error',
			entryPoints: files,
			tsconfig: upath.join( FIXTURES_PATH, 'tsconfig.test.json' )
		} );

		typeDocRestoreProgramAfterConversion( typeDoc );
		typeDocHierarchyFixer( typeDoc );

		expect( files ).to.not.lengthOf( 0 );

		conversionResult = ( await typeDoc.convert() )!;

		expect( conversionResult ).to.be.an( 'object' );
	} );

	function getReflection( name: string, kind: ReflectionKind = ReflectionKind.Class ): DeclarationReflection {
		const reflection = conversionResult.getReflectionsByKind( kind )
			.find( reflection => reflection.name === name ) as DeclarationReflection | undefined;

		expect( reflection, `expected the "${ name }" reflection to exist` ).to.not.be.undefined;

		return reflection!;
	}

	function getReferenceNames( types: Array<unknown> | undefined ): Array<string | undefined> {
		return ( types || [] ).map( type => {
			expect( type ).to.be.instanceOf( ReferenceType );

			return ( type as ReferenceType ).reflection?.name;
		} );
	}

	it( 'should replace a broken reference to a mixin base with the actual base class', () => {
		const classicEditor = getReflection( 'ClassicEditor' );

		expect( getReferenceNames( classicEditor.extendedTypes ) ).to.deep.equal( [ 'Editor' ] );
	} );

	it( 'should add a class extending a mixin base to the "extendedBy" collection of the actual base class', () => {
		const editor = getReflection( 'Editor' );

		expect( getReferenceNames( editor.extendedBy ) ).to.include.members( [ 'ClassicEditor', 'ManualEditor', 'NestedEditor' ] );
	} );

	it( 'should add an interface implemented by a mixin to the "implementedTypes" collection of the extending class', () => {
		const classicEditor = getReflection( 'ClassicEditor' );
		const elementApi = getReflection( 'ElementApi', ReflectionKind.Interface );

		expect( getReferenceNames( classicEditor.implementedTypes ) ).to.deep.equal( [ 'ElementApi' ] );
		expect( getReferenceNames( elementApi.implementedBy ) ).to.include.members( [ 'ClassicEditor' ] );
	} );

	it( 'should remove a broken reference to a mixin that does not extend any class', () => {
		const editor = getReflection( 'Editor' );

		expect( editor.extendedTypes ).to.be.undefined;
		expect( getReferenceNames( editor.implementedTypes ) ).to.deep.equal( [ 'Emitter' ] );
	} );

	it( 'should resolve nested mixin calls to the actual base class and all mixin interfaces', () => {
		const nestedEditor = getReflection( 'NestedEditor' );

		expect( getReferenceNames( nestedEditor.extendedTypes ) ).to.deep.equal( [ 'Editor' ] );
		expect( getReferenceNames( nestedEditor.implementedTypes ) ).to.have.members( [ 'ElementApi', 'Emitter' ] );
	} );

	it( 'should not duplicate an interface that the extending class already implements explicitly', () => {
		const manualEditor = getReflection( 'ManualEditor' );

		expect( getReferenceNames( manualEditor.extendedTypes ) ).to.deep.equal( [ 'Editor' ] );
		expect( getReferenceNames( manualEditor.implementedTypes ) ).to.deep.equal( [ 'ElementApi' ] );
	} );

	it( 'should keep a class extending a type outside of the project as is', () => {
		const customError = getReflection( 'CustomError' );

		expect( customError.extendedTypes ).to.lengthOf( 1 );

		const [ extendedType ] = customError.extendedTypes!;

		expect( extendedType ).to.be.instanceOf( ReferenceType );
		expect( ( extendedType as ReferenceType ).name ).to.equal( 'Error' );
		expect( ( extendedType as ReferenceType ).reflection ).to.be.undefined;
	} );

	it( 'should not touch classes with an inheritance chain resolved by TypeDoc', () => {
		const regularDerived = getReflection( 'RegularDerived' );
		const regularBase = getReflection( 'RegularBase' );

		expect( getReferenceNames( regularDerived.extendedTypes ) ).to.deep.equal( [ 'RegularBase' ] );
		expect( getReferenceNames( regularBase.extendedBy ) ).to.deep.equal( [ 'RegularDerived' ] );
		expect( regularDerived.implementedTypes ).to.be.undefined;
	} );
} );

describe( 'typedoc-plugins/hierarchy-fixer (clean-up after removing reflections)', () => {
	let conversionResult: ProjectReflection;

	beforeAll( async () => {
		const FIXTURES_PATH = upath.join( ROOT_TEST_DIRECTORY, 'hierarchy-fixer', 'fixtures' );

		const sourceFilePatterns = [
			upath.join( FIXTURES_PATH, '**', '*.ts' )
		];

		const files = ( await glob( sourceFilePatterns ) ).map( file => upath.normalize( file ) );
		const typeDoc = await Application.bootstrapWithPlugins( {
			logLevel: 'Error',
			entryPoints: files,
			tsconfig: upath.join( FIXTURES_PATH, 'tsconfig.test.json' )
		} );

		typeDocRestoreProgramAfterConversion( typeDoc );
		typeDocHierarchyFixer( typeDoc );

		// Simulate the `typedoc-plugin-purge-private-api-docs` plugin removing a private class after fixing the hierarchy.
		typeDoc.converter.on( Converter.EVENT_END, ( context: Context ) => {
			const nestedEditor = context.project.getReflectionsByKind( ReflectionKind.Class )
				.find( reflection => reflection.name === 'NestedEditor' )!;

			context.project.removeReflection( nestedEditor );
		}, getPluginPriority( 'typeDocPurgePrivateApiDocs' ) );

		conversionResult = ( await typeDoc.convert() )!;

		expect( conversionResult ).to.be.an( 'object' );
	} );

	function getReflection( name: string, kind: ReflectionKind = ReflectionKind.Class ): DeclarationReflection {
		const reflection = conversionResult.getReflectionsByKind( kind )
			.find( reflection => reflection.name === name ) as DeclarationReflection | undefined;

		expect( reflection, `expected the "${ name }" reflection to exist` ).to.not.be.undefined;

		return reflection!;
	}

	it( 'should remove references to removed reflections from the "extendedBy" and "implementedBy" collections', () => {
		const editor = getReflection( 'Editor' );
		const elementApi = getReflection( 'ElementApi', ReflectionKind.Interface );

		for ( const reference of [ ...editor.extendedBy!, ...elementApi.implementedBy! ] ) {
			expect( reference.reflection, `expected the "${ reference.name }" reference to be resolved` ).to.not.be.undefined;
			expect( reference.name ).to.not.equal( 'NestedEditor' );
		}
	} );
} );
