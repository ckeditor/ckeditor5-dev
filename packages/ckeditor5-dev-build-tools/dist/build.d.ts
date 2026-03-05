/**
 * @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */
import { type RollupOutput, type GlobalsOption, type LogLevelOption } from 'rollup';
export interface BuildOptions {
    input: string;
    output: string;
    tsconfig: string;
    name: string;
    globals: GlobalsOption | Array<string>;
    banner: string;
    external: Array<string>;
    rewrite: Array<[string, string]>;
    declarations: boolean;
    translations: string;
    sourceMap: boolean;
    minify: boolean;
    clean: boolean;
    logLevel: LogLevelOption;
    browser: boolean;
    cwd: string;
}
export declare const defaultOptions: BuildOptions;
/**
 * Builds project based on options provided as an object or CLI arguments.
 */
export declare function build(options?: Partial<BuildOptions>): Promise<RollupOutput>;
