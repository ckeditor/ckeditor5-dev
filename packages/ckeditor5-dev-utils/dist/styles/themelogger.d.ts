/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */
import type { Plugin } from 'postcss';
/**
 * A plugin that prepends a path to the file in the comment for each file
 * processed by PostCSS.
 */
declare function themeLogger(): Plugin;
declare namespace themeLogger {
    var postcss: boolean;
}
export default themeLogger;
