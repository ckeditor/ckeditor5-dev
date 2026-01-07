/**
 * @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { createRequire } from 'node:module';

const require = createRequire( import.meta.url );

/**
 * This can be replaced with `fileURLToPath( import.meta.resolve( '<NAME>' ) )`
 * once Vitest 4 releases and we update to it.
 *
 * In Vitest 3 and earlier, `import.meta.resolve` results in the following error:
 *
 * ```
 * __vite_ssr_import_meta__.resolve is not a function
 * ```
 */
export function resolveLoader( loaderName: string ): string {
	return require.resolve( loaderName );
}
