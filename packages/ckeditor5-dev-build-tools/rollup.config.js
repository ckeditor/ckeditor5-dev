/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */

import { readFile } from 'fs/promises';

import path from 'upath';
import { defineConfig } from 'rollup';
import commonjs from '@rollup/plugin-commonjs';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import typescript from '@rollup/plugin-typescript';

// Current working directory
const cwd = process.cwd();

// Content of the `package.json`
const pkg = JSON.parse( await readFile( path.join( cwd, 'package.json' ) ) );

// List of external dependencies
const externals = [
	...Object.keys( pkg.dependencies || {} ),
	...Object.keys( pkg.peerDependencies || {} )
];

export default defineConfig( {
	input: 'src/index.ts',
	output: {
		format: 'esm',
		file: path.join( cwd, 'dist', 'index.js' ),
		assetFileNames: '[name][extname]'
	},
	external: id => externals.some( name => id.startsWith( name ) ),
	plugins: [
		commonjs(),
		nodeResolve( {
			preferBuiltins: true
		} ),
		typescript()
	]
} );
