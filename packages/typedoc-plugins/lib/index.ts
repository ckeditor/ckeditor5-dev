/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

// import { createRequire } from 'module';
//
// const require = createRequire( import.meta.url );

// export const TYPEDOC_PLUGIN_MODULE_FIXER = require.resolve( './module-fixer/index.ts' );

export { default as typeDocModuleFixer } from './module-fixer/index.js';
export { default as typeDocSymbolFixer } from './symbol-fixer/index.js';

// 'use strict';

// const utils = require( './utils' );

// module.exports = {
// 	plugins: {
// 		// Reviewed:
// 		'typedoc-plugin-module-fixer': require.resolve( './module-fixer' ),
//
//
// 		// To review:
// 		'typedoc-plugin-event-inheritance-fixer': require.resolve( './event-inheritance-fixer' ),
// 		'typedoc-plugin-event-param-fixer': require.resolve( './event-param-fixer' ),
// 		'typedoc-plugin-interface-augmentation-fixer': require.resolve( './interface-augmentation-fixer' ),
// 		'typedoc-plugin-purge-private-api-docs': require.resolve( './purge-private-api-docs' ),
// 		'typedoc-plugin-symbol-fixer': require.resolve( './symbol-fixer' ),
// 		'typedoc-plugin-tag-error': require.resolve( './tag-error' ),
// 		'typedoc-plugin-tag-event': require.resolve( './tag-event' ),
// 		'typedoc-plugin-tag-observable': require.resolve( './tag-observable' )
// 	},
// 	utils
// };
