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

export default defineConfig( {
	input: 'src/index.ts',
	platform: 'node',
	output: {
		format: 'esm',
		dir: 'dist',
		assetFileNames: '[name][extname]'
	},
	plugins: [
		declarationFilesPlugin()
	],
	external: id => externals.some( name => id.startsWith( name ) )
} );
