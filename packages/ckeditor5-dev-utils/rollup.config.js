/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { readFileSync } from 'node:fs';
import path from 'upath';
import { defineConfig } from 'rollup';
import typescript from '@rollup/plugin-typescript';
import { nodeResolve } from '@rollup/plugin-node-resolve';

// Current working directory
const cwd = process.cwd();

// Content of the `package.json`
const pkg = JSON.parse(
	readFileSync( path.join( cwd, 'package.json' ) )
);

// List of external dependencies
const externals = [
	...Object.keys( pkg.dependencies || {} ),
	...Object.keys( pkg.peerDependencies || {} )
];

export default defineConfig( {
	input: {
		main: 'src/index.ts',
		debug: 'src/loaders/ck-debug-loader.ts'
	},
	output: {
		dir: path.join( cwd, 'dist' ),
		format: 'esm',
		entryFileNames: chunk => {
			if ( chunk.name === 'main' ) {
				return 'index.js';
			}

			// Webpack debug loader.
			if ( chunk.name === 'debug' ) {
				return 'ck-debug-loader.js';
			}

			return '[name].js';
		},
		assetFileNames: '[name][extname]'
	},
	external: id => externals.some( name => id.startsWith( name ) ),
	plugins: [
		typescript(),
		nodeResolve( {
			extensions: [ '.mjs', '.js', '.json', '.node', '.ts', '.mts' ],
			preferBuiltins: true
		} )
	]
} );
