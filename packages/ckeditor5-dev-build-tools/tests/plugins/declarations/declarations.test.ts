/**
 * @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { join } from 'node:path';
import { expect, test, vi } from 'vitest';

const isolatedDeclarationMock = vi.hoisted( () => vi.fn() );

vi.mock( 'rolldown/experimental', () => ( {
	isolatedDeclaration: isolatedDeclarationMock
} ) );

import { declarationFiles } from '../../../src/plugins/declarations.js';

async function runGenerateBundle( plugin: ReturnType<typeof declarationFiles>, context: any ) {
	const generateBundle = typeof plugin.generateBundle == 'function' ? plugin.generateBundle : plugin.generateBundle!.handler;

	await generateBundle.call( context, {} as any, {}, false );
}

function createContext() {
	const emittedFiles: Array<any> = [];

	return {
		emitFile: vi.fn( file => emittedFiles.push( file ) ),
		error: ( message: string ) => {
			throw new Error( message );
		},
		emittedFiles
	};
}

test( 'Emits declaration files for TypeScript source files', async () => {
	isolatedDeclarationMock.mockResolvedValue( {
		errors: [],
		code: 'export declare const value: string;'
	} );

	const plugin = declarationFiles( {
		sourceDirectory: join( import.meta.dirname, './fixtures' )
	} );
	const context = createContext();

	await runGenerateBundle( plugin, context );

	expect( context.emittedFiles ).toContainEqual( {
		type: 'asset',
		fileName: 'valid.d.ts',
		source: 'export declare const value: string;'
	} );
	expect( context.emittedFiles ).toContainEqual( {
		type: 'asset',
		fileName: 'module.d.mts',
		source: 'export declare const value: string;'
	} );
	expect( context.emittedFiles ).toContainEqual( {
		type: 'asset',
		fileName: 'common.d.cts',
		source: 'export declare const value: string;'
	} );
} );

test( 'Throws formatted declaration generation errors', async () => {
	isolatedDeclarationMock.mockResolvedValue( {
		errors: [ {
			message: 'Declaration error',
			codeframe: 'const value = unknown;'
		} ],
		code: ''
	} );

	const plugin = declarationFiles( {
		sourceDirectory: join( import.meta.dirname, './fixtures' )
	} );

	await expect( runGenerateBundle( plugin, createContext() ) ).rejects.toThrow(
		/Could not generate a declaration file for ".+"\.\nDeclaration error\nconst value = unknown;/
	);
} );
