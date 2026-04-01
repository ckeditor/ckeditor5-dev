/**
 * @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { beforeAll, describe, expect, it } from 'vitest';
import { glob } from 'glob';
import upath from 'upath';
import {
	Application,
	ReflectionKind,
	type DeclarationReflection,
	type DocumentReflection,
	type ProjectReflection
} from 'typedoc';

import { ROOT_TEST_DIRECTORY } from '../utils.js';
import {
	typeDocExperimentalTagFixer,
	typeDocRestoreProgramAfterConversion,
	typeDocTagObservable
} from '../../src/index.js';

describe( 'typedoc-plugins/experimental-tag-fixer', () => {
	let conversionResult: ProjectReflection;

	beforeAll( async () => {
		const fixturesPath = upath.join( ROOT_TEST_DIRECTORY, 'experimental-tag-fixer', 'fixtures' );
		const files = ( await glob( [ upath.join( fixturesPath, '**', '*.ts' ) ] ) ).map( ( file: string ) => upath.normalize( file ) );
		const typeDoc = await Application.bootstrapWithPlugins( {
			logLevel: 'Error',
			entryPoints: files,
			tsconfig: upath.join( fixturesPath, 'tsconfig.json' ),
			plugin: [
				'typedoc-plugin-rename-defaults'
			],
			// TODO: To resolve types.
			// @ts-expect-error TS2322
			// Type 'boolean' is not assignable to type 'string'.
			// For unknown reasons `excludePrivate` type is resolved as `string`.
			excludePrivate: false
		} );

		typeDocExperimentalTagFixer( typeDoc );
		typeDocTagObservable( typeDoc );
		typeDocRestoreProgramAfterConversion( typeDoc );

		conversionResult = ( await typeDoc.convert() )!;
	} );

	it( 'should keep @experimental only on explicitly documented class members', () => {
		const classDefinition = conversionResult.getReflectionsByKind( ReflectionKind.Class )
			.find( entry => entry.name === 'ExampleClass' ) as DeclarationReflection;

		const constructorDefinition = classDefinition.children!.find( ( entry: DeclarationReflection ) => entry.name === 'constructor' )!;
		const pluginNameDefinition = classDefinition.children!.find( ( entry: DeclarationReflection ) => entry.name === 'pluginName' )!;
		const regularPropertyDefinition = classDefinition.children!.find( ( entry: DeclarationReflection ) => {
			return entry.name === 'regularProperty';
		} )!;
		const experimentalPropertyDefinition = classDefinition.children!.find( ( entry: DeclarationReflection ) => {
			return entry.name === 'experimentalProperty';
		} )!;
		const regularMethodDefinition = classDefinition.children!.find( ( entry: DeclarationReflection ) => {
			return entry.name === 'regularMethod';
		} )!;
		const experimentalMethodDefinition = classDefinition.children!.find( ( entry: DeclarationReflection ) => {
			return entry.name === 'experimentalMethod';
		} )!;

		expect( classDefinition.comment!.modifierTags.has( '@experimental' ) ).to.equal( true );
		expect( constructorDefinition.signatures![ 0 ]!.comment!.modifierTags.has( '@experimental' ) ).to.equal( false );
		expect( pluginNameDefinition.getSignature!.comment!.modifierTags.has( '@experimental' ) ).to.equal( false );
		expect( regularPropertyDefinition.comment!.modifierTags.has( '@experimental' ) ).to.equal( false );
		expect( experimentalPropertyDefinition.comment!.modifierTags.has( '@experimental' ) ).to.equal( true );
		expect( regularMethodDefinition.signatures![ 0 ]!.comment!.modifierTags.has( '@experimental' ) ).to.equal( false );
		expect( experimentalMethodDefinition.signatures![ 0 ]!.comment!.modifierTags.has( '@experimental' ) ).to.equal( true );
	} );

	it( 'should prevent non-explicit observable events from inheriting @experimental', () => {
		const classDefinition = conversionResult.getReflectionsByKind( ReflectionKind.Class )
			.find( entry => entry.name === 'ExampleClass' ) as DeclarationReflection;

		const regularEvents = classDefinition.ckeditor5Events!.filter( ( ( event: DocumentReflection ) => {
			return event.name === 'change:regularProperty' || event.name === 'set:regularProperty';
		} ) as any );
		const experimentalEvents = classDefinition.ckeditor5Events!.filter( ( ( event: DocumentReflection ) => {
			return event.name === 'change:experimentalProperty' || event.name === 'set:experimentalProperty';
		} ) as any );

		expect( regularEvents ).to.have.lengthOf( 2 );
		expect( experimentalEvents ).to.have.lengthOf( 2 );

		for ( const event of regularEvents ) {
			expect( event.comment!.modifierTags.has( '@experimental' ) ).to.equal( false );
		}

		for ( const event of experimentalEvents ) {
			expect( event.comment!.modifierTags.has( '@experimental' ) ).to.equal( true );
		}
	} );
} );
