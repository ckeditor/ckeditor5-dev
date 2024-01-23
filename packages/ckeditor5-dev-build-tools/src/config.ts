// TODO: When it's close to being production ready, remove the comment below.
/* v8 ignore start */

import path from 'upath';
import typescript from 'typescript';
import { defineConfig } from 'rollup';
import commonjs from '@rollup/plugin-commonjs';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import typescriptPlugin from '@rollup/plugin-typescript';

import { translations } from './plugins/translations.js';

const cwd = process.cwd();
const tsConfigPath = path.join( cwd, 'tsconfig.release-ckeditor5.json');

const banner =
`/*!
 * @license Copyright (c) 2003-2023, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */`;

export const buildConfig = defineConfig( {
	input: 'src/index.ts',
	output: {
		format: 'esm',
		file: path.join( cwd, 'dist', 'index.js' ),
		assetFileNames: '[name][extname]',
		sourcemap: false, // TODO
		banner
	},
	plugins: [
		commonjs(),
		nodeResolve(),
		typescriptPlugin( {
			tsconfig: tsConfigPath,
			typescript,
			compilerOptions: {
				rootDir: path.join( cwd, 'src' ),
				declaration: true,
				declarationDir: path.join( cwd, 'dist', 'types' ),
				declarationMap: false, // TODO
			},
			sourceMap: false // TODO
		} ),
		translations()
	]
} );
