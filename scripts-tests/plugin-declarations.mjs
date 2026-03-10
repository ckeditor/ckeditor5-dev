/**
 * @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { globSync, readFileSync } from 'node:fs';
import { isolatedDeclaration } from 'oxc-transform';
import { declarationFilesPlugin } from '../scripts/plugin-declarations.js';

vi.mock( 'node:fs', () => ( {
	globSync: vi.fn(),
	readFileSync: vi.fn()
} ) );

vi.mock( 'oxc-transform', () => ( {
	isolatedDeclaration: vi.fn()
} ) );

describe( 'scripts/plugin-declarations', () => {
	beforeEach( () => {
		vi.spyOn( process, 'cwd' ).mockReturnValue( '/workspace/package' );
	} );

	it( 'creates declaration assets for TypeScript source files', async () => {
		vi.mocked( globSync ).mockReturnValue( [
			'foo.ts',
			'nested/bar.tsx',
			'module.mts',
			'legacy.cts'
		] );

		vi.mocked( readFileSync ).mockImplementation( sourceFilePath => `source:${ sourceFilePath }` );
		vi.mocked( isolatedDeclaration ).mockImplementation( async filename => ( {
			errors: [],
			code: `declaration:${ filename }`
		} ) );

		const plugin = declarationFilesPlugin();
		const emitFile = vi.fn();
		const error = vi.fn();

		await plugin.generateBundle.call( { emitFile, error } );

		expect( globSync ).toHaveBeenCalledWith( '**/*.{ts,tsx,mts,cts}', {
			cwd: '/workspace/package/src',
			exclude: [ '**/*.d.ts', '**/*.d.mts', '**/*.d.cts' ]
		} );

		expect( readFileSync ).toHaveBeenNthCalledWith( 1, '/workspace/package/src/foo.ts', 'utf8' );
		expect( readFileSync ).toHaveBeenNthCalledWith( 2, '/workspace/package/src/nested/bar.tsx', 'utf8' );
		expect( readFileSync ).toHaveBeenNthCalledWith( 3, '/workspace/package/src/module.mts', 'utf8' );
		expect( readFileSync ).toHaveBeenNthCalledWith( 4, '/workspace/package/src/legacy.cts', 'utf8' );

		expect( isolatedDeclaration ).toHaveBeenNthCalledWith( 1, 'foo.ts', 'source:/workspace/package/src/foo.ts', {
			sourcemap: false,
			stripInternal: true
		} );

		expect( isolatedDeclaration ).toHaveBeenNthCalledWith( 2, 'nested/bar.tsx', 'source:/workspace/package/src/nested/bar.tsx', {
			sourcemap: false,
			stripInternal: true
		} );

		expect( isolatedDeclaration ).toHaveBeenNthCalledWith( 3, 'module.mts', 'source:/workspace/package/src/module.mts', {
			sourcemap: false,
			stripInternal: true
		} );

		expect( isolatedDeclaration ).toHaveBeenNthCalledWith( 4, 'legacy.cts', 'source:/workspace/package/src/legacy.cts', {
			sourcemap: false,
			stripInternal: true
		} );

		expect( emitFile ).toHaveBeenNthCalledWith( 1, {
			type: 'asset',
			fileName: 'foo.d.ts',
			source: 'declaration:foo.ts'
		} );

		expect( emitFile ).toHaveBeenNthCalledWith( 2, {
			type: 'asset',
			fileName: 'nested/bar.d.ts',
			source: 'declaration:nested/bar.tsx'
		} );

		expect( emitFile ).toHaveBeenNthCalledWith( 3, {
			type: 'asset',
			fileName: 'module.d.mts',
			source: 'declaration:module.mts'
		} );

		expect( emitFile ).toHaveBeenNthCalledWith( 4, {
			type: 'asset',
			fileName: 'legacy.d.cts',
			source: 'declaration:legacy.cts'
		} );

		expect( error ).not.toHaveBeenCalled();
	} );

	it( 'throws an error when declaration generation reports problems', async () => {
		vi.mocked( globSync ).mockReturnValue( [ 'broken.ts' ] );
		vi.mocked( readFileSync ).mockReturnValue( 'export const broken = true;' );
		vi.mocked( isolatedDeclaration ).mockResolvedValue( {
			errors: [
				{ message: 'Broken declaration', codeframe: 'line 1' },
				{ message: 'Another issue' }
			],
			code: ''
		} );

		const plugin = declarationFilesPlugin();
		const emitFile = vi.fn();
		const error = vi.fn( message => {
			throw new Error( message );
		} );

		await expect( plugin.generateBundle.call( { emitFile, error } ) ).rejects.toThrow(
			'Could not generate a declaration file for "broken.ts".\nBroken declaration\nline 1\n\nAnother issue'
		);

		expect( emitFile ).not.toHaveBeenCalled();
	} );
} );
