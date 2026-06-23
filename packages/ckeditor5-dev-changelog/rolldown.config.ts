/**
 * @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { defineConfig, type RolldownOptions } from 'rolldown';
import { isBuiltin } from 'node:module';
import { declarationFiles } from '../ckeditor5-dev-build-tools/src/plugins/declarations.js';
import pkg from './package.json' with { type: 'json' };

const packageJson = pkg as {
	dependencies?: Record<string, string>;
	peerDependencies?: Record<string, string>;
};

const externals = [
	...Object.keys( packageJson.dependencies || {} ),
	...Object.keys( packageJson.peerDependencies || {} )
];

const sharedConfig = defineConfig( {
	platform: 'node',
	external: id => isBuiltin( id ) || externals.some( name => id.startsWith( name ) )
} ) as RolldownOptions;

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
			declarationFiles( {
				sourceDirectory: 'src'
			} )
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
