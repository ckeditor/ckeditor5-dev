/**
 * @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { defineConfig } from 'rolldown';
import { declarationFilesPlugin } from '../../scripts/plugin-declarations.js';
import pkg from './package.json' with { type: 'json' };

const externals = [
	...Object.keys( pkg.dependencies || {} ),
	...Object.keys( pkg.peerDependencies || {} )
];

const sharedConfig = defineConfig( {
	platform: 'node',
	external: id => externals.some( name => id.startsWith( name ) )
} );

export default defineConfig( [
	{
		input: 'src/index.ts',
		output: {
			cleanDir: true,
			format: 'esm',
			dir: 'dist',
			entryFileNames: 'index.js',
			assetFileNames: '[name][extname]'
		},
		plugins: [
			declarationFilesPlugin()
		],
		...sharedConfig
	},
	{
		input: 'src/template.ts',
		output: {
			format: 'esm',
			dir: 'dist',
			entryFileNames: 'template.js',
			assetFileNames: '[name][extname]'
		},
		...sharedConfig
	}
] );
