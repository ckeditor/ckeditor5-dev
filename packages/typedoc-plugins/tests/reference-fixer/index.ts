/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { beforeAll, describe, expect, it } from 'vitest';
import { glob } from 'tinyglobby';
import upath from 'upath';
import {
	Application,
	ReflectionKind,
	type ProjectReflection,
	type ReferenceReflection,
	type DeclarationReflection
} from 'typedoc';

import { ROOT_TEST_DIRECTORY } from '../utils.js';
import { typeDocReferenceFixer, typeDocRestoreProgramAfterConversion } from '../../src/index.js';

describe( 'typedoc-plugins/reference-fixer', () => {
	let conversionResult: ProjectReflection;

	const FIXTURES_PATH = upath.join( ROOT_TEST_DIRECTORY, 'reference-fixer', 'fixtures' );

	const sourceFilePatterns = [ upath.join( FIXTURES_PATH, '**', '*.ts' ) ];

	beforeAll( async () => {
		const entryPoints = ( await glob( sourceFilePatterns ) ).map( file => upath.normalize( file ) );

		const typeDoc = await Application.bootstrapWithPlugins( {
			logLevel: 'Error',
			entryPoints,
			tsconfig: upath.join( FIXTURES_PATH, 'tsconfig.json' ),
			plugin: [
				'typedoc-plugin-rename-defaults'
			]
		} );

		typeDocReferenceFixer( typeDoc );
		typeDocRestoreProgramAfterConversion( typeDoc );

		expect( entryPoints ).to.not.lengthOf( 0 );

		conversionResult = ( await typeDoc.convert() )!;

		expect( conversionResult ).to.be.an( 'object' );
	} );

	it( 'should move reflection declaration from index module to source module', () => {
		const fooConfigDeclaration = conversionResult.getChildByName( [ 'foo/fooconfig', 'FooConfig' ] ) as DeclarationReflection;
		const versionDeclaration = conversionResult.getChildByName( [ 'utils/version', 'version' ] ) as DeclarationReflection;

		expect( fooConfigDeclaration ).to.not.be.undefined;
		expect( fooConfigDeclaration ).to.have.property( 'variant', 'declaration' );

		expect( versionDeclaration ).to.not.be.undefined;
		expect( versionDeclaration ).to.have.property( 'variant', 'declaration' );

		const fooConfigDeclarationParent = fooConfigDeclaration.parent as DeclarationReflection;
		const versionDeclarationParent = versionDeclaration.parent as DeclarationReflection;

		expect( fooConfigDeclarationParent.children ).to.have.length( 1 );
		expect( versionDeclarationParent.children ).to.have.length( 1 );
	} );

	it( 'should move reflection reference from source module to index module', () => {
		// The re-exported default export has name in lower case.
		const fooConfigReference = conversionResult.getChildByName( [ 'fixtures', 'fooconfig' ] ) as ReferenceReflection;
		const versionReference = conversionResult.getChildByName( [ 'fixtures', 'version' ] ) as ReferenceReflection;

		const fooConfigDeclaration = conversionResult.getChildByName( [ 'foo/fooconfig', 'FooConfig' ] ) as DeclarationReflection;
		const versionDeclaration = conversionResult.getChildByName( [ 'utils/version', 'version' ] ) as DeclarationReflection;

		const fooConfigTarget = fooConfigReference.getTargetReflectionDeep();
		const versionTarget = versionReference.getTargetReflectionDeep();

		expect( fooConfigReference ).to.not.be.undefined;
		expect( fooConfigReference ).to.have.property( 'variant', 'reference' );
		expect( fooConfigTarget ).to.not.be.undefined;
		expect( fooConfigTarget.id ).to.equal( fooConfigDeclaration.id );

		expect( versionReference ).to.not.be.undefined;
		expect( versionReference ).to.have.property( 'variant', 'reference' );
		expect( versionTarget ).to.not.be.undefined;
		expect( versionTarget.id ).to.equal( versionDeclaration.id );
	} );

	it( 'should add reflection declarations for each icon from `icons/index` module', () => {
		const iconRedoDeclaration = conversionResult.getChildByName( [ 'icons/index', 'IconRedo' ] ) as DeclarationReflection;
		const iconUndoDeclaration = conversionResult.getChildByName( [ 'icons/index', 'IconUndo' ] ) as DeclarationReflection;

		expect( iconRedoDeclaration ).to.not.be.undefined;
		expect( iconRedoDeclaration ).to.have.property( 'variant', 'declaration' );
		expect( iconRedoDeclaration ).to.have.property( 'kind', ReflectionKind.Variable );
		expect( iconRedoDeclaration ).to.have.property( 'type' );
		expect( iconRedoDeclaration.type ).to.have.property( 'name', 'string' );
		expect( iconRedoDeclaration ).to.have.property( 'flags' );
		expect( iconRedoDeclaration.flags.isConst ).to.equal( true );
		expect( iconRedoDeclaration ).to.have.property( 'sources' );
		expect( iconRedoDeclaration.sources![ 0 ].fileName ).to.equal( 'typings/types.d.ts' );

		expect( iconUndoDeclaration ).to.not.be.undefined;
		expect( iconUndoDeclaration ).to.have.property( 'variant', 'declaration' );
		expect( iconUndoDeclaration ).to.have.property( 'kind', ReflectionKind.Variable );
		expect( iconUndoDeclaration ).to.have.property( 'type' );
		expect( iconUndoDeclaration.type ).to.have.property( 'name', 'string' );
		expect( iconUndoDeclaration ).to.have.property( 'flags' );
		expect( iconUndoDeclaration.flags.isConst ).to.equal( true );
		expect( iconUndoDeclaration ).to.have.property( 'sources' );
		expect( iconUndoDeclaration.sources![ 0 ].fileName ).to.equal( 'packages/icons/index.ts' );
	} );
} );
