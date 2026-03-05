/**
 * @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */
import { type RollupOptions } from 'rollup';
import type { BuildOptions } from './build.js';
/**
 * Generates Rollup configurations.
 */
export declare function getRollupConfig(options: BuildOptions): Promise<RollupOptions>;
