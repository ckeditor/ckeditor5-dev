/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { expect } from 'vitest';
import type { RollupOutput, OutputChunk, OutputAsset } from 'rollup';

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
