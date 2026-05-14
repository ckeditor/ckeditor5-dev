/**
 * @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { defineConfig, type RolldownOptions } from 'rolldown';
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

export default defineConfig( {
	input: {
		index: 'src/index.ts',
		template: 'src/template.ts'
	},
	platform: 'node',
	output: {
		cleanDir: true,
		format: 'esm',
		dir: 'dist',
		assetFileNames: '[name][extname]'
	},
	external: id => externals.some( name => id.startsWith( name ) ),
	plugins: [
		declarationFiles( {
			sourceDirectory: 'src'
		} )
	]
} ) as RolldownOptions;
