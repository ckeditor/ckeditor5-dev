/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { describe, beforeEach, expect, it, vi } from 'vitest';
import { glob } from 'glob';
import { Application, OptionDefaults } from 'typedoc';
import {
	typeDocModuleFixer,
	typeDocSymbolFixer,
	typeDocTagError,
	typeDocTagEvent,
	typeDocTagObservable,
	typeDocEventParamFixer,
	typeDocEventInheritanceFixer,
	typeDocInterfaceAugmentationFixer,
	typeDocPurgePrivateApiDocs,
	validate
} from '@ckeditor/typedoc-plugins';

import build from '../lib/build.js';

vi.mock( 'glob' );
vi.mock( 'typedoc' );
vi.mock( '@ckeditor/typedoc-plugins' );

describe( 'lib/build()', () => {
	const sourceFiles = [ 'path/to/project/**/*.ts' ];
	const ignoreFiles = [ 'path/to/project/_tests/**/*.ts' ];

	let stubs;

	beforeEach( () => {
		stubs = {
			app: {
				convert: vi.fn().mockResolvedValue( {} ),
				generateJson: vi.fn()
			}
		};

		vi.mocked( glob ).mockResolvedValue( [
			'path/to/project/a/1.ts',
			'path/to/project/a/2.ts',
			'path/to/project/b/1.ts',
			'path/to/project/b/2.ts'
		] );

		vi.mocked( Application.bootstrapWithPlugins ).mockResolvedValue( stubs.app );
	} );

	it( 'should search for source files', async () => {
		await build( {
			sourceFiles,
			ignoreFiles
		} );

		expect( glob ).toHaveBeenCalledTimes( 1 );
		expect( glob ).toHaveBeenCalledWith(
			[ 'path/to/project/**/*.ts' ],
			{ ignore: [ 'path/to/project/_tests/**/*.ts' ] }
		);
	} );

	it( 'should pass configuration options to TypeDoc', async () => {
		await build( {
			cwd: '/workspace',
			tsconfig: '/workspace/tsconfig.json',
			sourceFiles,
			ignoreFiles,
			extraPlugins: [ 'typedoc-plugin-custom' ]
		} );

		expect( Application.bootstrapWithPlugins ).toHaveBeenCalledTimes( 1 );
		expect( Application.bootstrapWithPlugins ).toHaveBeenCalledWith( expect.objectContaining( {
			tsconfig: '/workspace/tsconfig.json',
			basePath: '/workspace',
			excludeExternals: true,
			logLevel: 'Warn',
			blockTags: expect.arrayContaining( OptionDefaults.blockTags ),
			inlineTags: expect.arrayContaining( OptionDefaults.inlineTags ),
			modifierTags: expect.arrayContaining( OptionDefaults.modifierTags ),
			plugin: [
				'typedoc-plugin-rename-defaults',
				'typedoc-plugin-custom'
			]
		} ) );
	} );

	it( 'should pass normalized source paths to TypeDoc', async () => {
		vi.mocked( glob ).mockResolvedValue( [
			'path\\to\\project\\a\\1.ts',
			'path\\to\\project\\b\\1.ts'
		] );

		await build( {
			sourceFiles
		} );

		expect( Application.bootstrapWithPlugins ).toHaveBeenCalledTimes( 1 );
		expect( Application.bootstrapWithPlugins ).toHaveBeenCalledWith( expect.objectContaining( {
			entryPoints: [
				'path/to/project/a/1.ts',
				'path/to/project/b/1.ts'
			]
		} ) );
	} );

	it( 'should execute TypeDoc plugins before converting the documentation', async () => {
		await build( {
			sourceFiles
		} );

		const plugins = [
			typeDocModuleFixer,
			typeDocSymbolFixer,
			typeDocTagError,
			typeDocTagEvent,
			typeDocTagObservable,
			typeDocEventParamFixer,
			typeDocEventInheritanceFixer,
			typeDocInterfaceAugmentationFixer,
			typeDocPurgePrivateApiDocs
		];

		expect( stubs.app.convert ).toHaveBeenCalledTimes( 1 );

		plugins.forEach( plugin => {
			expect( plugin ).toHaveBeenCalledTimes( 1 );
			expect( plugin ).toHaveBeenCalledWith( stubs.app );

			expect( plugin ).toHaveBeenCalledBefore( stubs.app.convert );
		} );
	} );

	it( 'should validate the documentation after converting the documentation', async () => {
		await build( {
			sourceFiles,
			validatorOptions: {
				enableOverloadValidator: true
			}
		} );

		expect( stubs.app.convert ).toHaveBeenCalledTimes( 1 );
		expect( validate ).toHaveBeenCalledTimes( 1 );
		expect( validate ).toHaveBeenCalledWith( stubs.app, { enableOverloadValidator: true } );

		expect( validate ).toHaveBeenCalledAfter( stubs.app.convert );
	} );

	it( 'should create JSON output file', async () => {
		await build( {
			sourceFiles,
			outputPath: 'path/to/output.json'
		} );

		expect( stubs.app.generateJson ).toHaveBeenCalledTimes( 1 );
		expect( stubs.app.generateJson ).toHaveBeenCalledWith( expect.anything(), 'path/to/output.json' );
	} );

	it( 'should not create JSON output file if outputh path is not defined', async () => {
		await build( {
			sourceFiles
		} );

		expect( stubs.app.generateJson ).not.toHaveBeenCalled();
	} );

	it( 'should throw an error if conversion failed', async () => {
		stubs.app.convert.mockResolvedValue( null );

		return build( { sourceFiles } )
			.then(
				() => {
					throw new Error( 'Expected to throw.' );
				},
				err => {
					expect( err ).to.equal( 'Something went wrong with TypeDoc.' );
				}
			);
	} );

	it( 'should throw an error if validation failed in strict mode', async () => {
		vi.mocked( validate ).mockReturnValue( false );

		return build( { sourceFiles, strict: true } )
			.then(
				() => {
					throw new Error( 'Expected to throw.' );
				},
				err => {
					expect( err ).to.equal( 'Something went wrong with TypeDoc.' );
				}
			);
	} );

	it( 'should not throw an error if validation failed in non-strict mode', async () => {
		vi.mocked( validate ).mockReturnValue( false );

		return build( { sourceFiles, strict: false } )
			.catch( () => {
				throw new Error( 'Expected not to throw.' );
			} );
	} );
} );
