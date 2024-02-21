/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import type { OutputBundle, OutputChunk, NormalizedOutputOptions } from 'rollup';

/**
 * Get `banner` from the `Rollup` configuration object.
 */
export function getBanner( output: NormalizedOutputOptions, bundle: OutputBundle ): Promise<string> | string {
	const mainChunk = Object
		.values( bundle )
		.filter( ( output ): output is OutputChunk => output.type === 'chunk' )
		.find( chunk => chunk.isEntry )!;

	return output.banner( mainChunk );
}
