/**
 * @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { expect, vi } from 'vitest';
import type { RolldownOutput, OutputChunk, OutputAsset } from 'rolldown';
import * as utils from '../../src/utils.js';

/**
 * Helper function for validating Rolldown asset.
 */
export function verifyAsset(
	output: RolldownOutput['output'],
	filename: string,
	source: string
): void {
	const chunk = output.find( output => output.fileName === filename );

	expect( chunk ).toBeDefined();
	expect( chunk!.type ).toBe( 'asset' );
	expect( ( chunk as OutputAsset ).source ).includes( source );
}

/**
 * Helper function for validating Rolldown chunk.
 */
export function verifyChunk(
	output: RolldownOutput['output'],
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
	output: RolldownOutput['output'],
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
	// In some tests, `mockGetUserDependency()` is executed twice.
	// Because of this, we need to check whether the import is already mocked.
	let actualImport = ( utils as any ).getUserDependency?.getMockImplementation?.();

	// If its not mocked yet, we take the original.
	if ( !actualImport ) {
		actualImport = ( await vi.importActual( '../../src/utils.js' ) ).getUserDependency;
	}

	vi
		.spyOn( utils, 'getUserDependency' )
		.mockImplementation( ( url: string ) => {
			if ( url === path ) {
				return cb();
			}

			return actualImport( url );
		} );
}
