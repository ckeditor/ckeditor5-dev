/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

export { build } from './build.js';
export { addBanner, type RollupBannerOptions } from './plugins/banner.js';
export { emitCss, type RollupEmitCssOptions } from './plugins/emitCss.js';
export { loadSourcemaps } from './plugins/loadSourcemaps.js';
export { rawImport } from './plugins/rawImport.js';
export { replaceImports, type RollupReplaceOptions } from './plugins/replace.js';
export { splitCss, type RollupSplitCssOptions } from './plugins/splitCss.js';
export { translations, type RollupTranslationsOptions } from './plugins/translations.js';
