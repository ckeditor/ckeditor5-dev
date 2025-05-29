/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { readFileSync } from 'fs';
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

const sharedConfig = defineConfig( {
	external: id => externals.some( name => id.startsWith( name ) ),
	plugins: [
		typescript(),
		nodeResolve( {
			extensions: [ '.mjs', '.js', '.json', '.node', '.ts', '.mts' ],
			preferBuiltins: true
		} )
	]
} );

export default defineConfig( [
	{
		input: 'src/index.ts',
		output: {
			format: 'esm',
			file: path.join( cwd, 'dist', 'index.js' ),
			assetFileNames: '[name][extname]'
		},
		...sharedConfig
	},
	{
		input: 'src/template.ts',
		output: {
			format: 'esm',
			file: path.join( cwd, 'dist', 'template.js' ),
			assetFileNames: '[name][extname]'
		},
		...sharedConfig
	}
] );
