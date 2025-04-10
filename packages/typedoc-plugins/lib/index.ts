/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

// import { createRequire } from 'module';
// const require = createRequire( import.meta.url );
// export const TYPEDOC_PLUGIN_MODULE_FIXER = require.resolve( './module-fixer/index.ts' );

export { default as typeDocModuleFixer } from './module-fixer/index.js';
export { default as typeDocSymbolFixer } from './symbol-fixer/index.js';
export { default as typeDocTagError } from './tag-error/index.js';
export { default as typeDocTagEvent } from './tag-event/index.js';
export { default as typeDocTagObservable } from './tag-observable/index.js';
export { default as typeDocEventParamFixer } from './event-param-fixer/index.js';
