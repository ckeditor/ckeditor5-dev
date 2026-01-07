/**
 * @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { expect, vi } from 'vitest';
import swc from '@rollup/plugin-swc';
import type { RollupOutput, OutputChunk, OutputAsset, Plugin } from 'rollup';
import * as utils from '../../src/utils.js';

/**
 * Helper function for validating Rollup asset.
 */
export function verifyAsset(
	output: RollupOutput['output'],
	filename: string,
	source: string
): void {
	const chunk = output.find( output => output.fileName === filename );

	expect( chunk ).toBeDefined();
	expect( chunk!.type ).toBe( 'asset' );
	expect( ( chunk as OutputAsset ).source ).includes( source );
}

/**
 * Helper function for validating Rollup chunk.
 */
export function verifyChunk(
	output: RollupOutput['output'],
	filename: string,
	code: string
): void {
	const chunk = output.find( output => output.fileName === filename );

	expect( chunk ).toBeDefined();
	expect( chunk!.type ).toBe( 'chunk' );
	expect( ( chunk as OutputChunk ).code ).includes( code );
}

/**
 * Helper function for verifying `CSS` output.
 */
export function verifyDividedStyleSheet(
	output: RollupOutput['output'],
	outputFileName: string,
	expectedResult: string
): void {
	const styles = output.find( output => output.fileName === outputFileName );

	expect( styles ).toBeDefined();
	expect( styles!.type ).toBe( 'asset' );

	const source = ( styles as OutputAsset )!.source as string;

	expect( utils.removeWhitespace( source ) ).toEqual( expectedResult );
}

/**
 * Helper function for mocking `getUserDependency` function.
 */
export async function mockGetUserDependency( path: string, cb: () => any ): Promise<void> {
	const actualImport = utils.getUserDependency;

	vi
		.spyOn( utils, 'getUserDependency' )
		.mockImplementation( ( url: string ) => {
			if ( url === path ) {
				return cb();
			}

			return actualImport( url );
		} );
}

/**
 * Helper function for getting a preconfigured `swc` plugin.
 */
export function swcPlugin(): Plugin {
	return swc( {
		include: [ '**/*.[jt]s' ],
		swc: {
			jsc: {
				target: 'es2022'
			},
			module: {
				type: 'es6'
			}
		}
	} );
}
