/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { readFileSync } from 'fs';
import { builtinModules } from 'module';
import path from 'upath';
import { defineConfig } from 'rollup';
import commonjs from '@rollup/plugin-commonjs';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import typescript from '@rollup/plugin-typescript';

// Current working directory
const cwd = process.cwd();

// Content of the `package.json`
const pkg = JSON.parse(
	readFileSync( path.join( cwd, 'package.json' ) )
);

// List of external dependencies
const externals = [
	...Object.keys( pkg.dependencies || {} ),
	...Object.keys( pkg.peerDependencies || {} ),
	...builtinModules
];

export default defineConfig( {
	input: 'src/index.ts',
	output: {
		format: 'esm',
		dir: path.join( cwd, 'dist' ),
		assetFileNames: '[name][extname]'
	},
	external: id => externals.some( name => id.startsWith( name ) ),
	plugins: [
		commonjs(),
		nodeResolve( {
			extensions: [ '.mjs', '.js', '.json', '.node', '.ts', '.mts' ],
			preferBuiltins: true
		} ),
		typescript()
	]
} );
