/**
 * @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

export { build } from './build.js';
export { addBanner, type RollupBannerOptions } from './plugins/banner.js';
export { bundleCss, type RollupBundleCssOptions } from './plugins/bundleCss.js';
export { declarationFiles, type RolldownDeclarationOptions } from './plugins/declarations.js';
export { loadSourcemaps } from './plugins/loadSourcemaps.js';
export { rawImport } from './plugins/rawImport.js';
export { translations, type RollupTranslationsOptions } from './plugins/translations.js';
