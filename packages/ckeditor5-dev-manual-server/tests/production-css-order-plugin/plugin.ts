/**
 * @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { build, type HtmlTagDescriptor } from 'vite';
import { manualTestsPlugin } from '../../src/manual-test-plugin/plugin.js';
import { productionCssOrderPlugin } from '../../src/production-css-order-plugin/plugin.js';
import { stripLeadingSlash } from '../../src/utils.js';
import { createFile, createTemporaryDirectory, removeDirectory } from '../_utils/files.js';

type ConfigHook = () => {
	build: {
		rolldownOptions: {
			output: {
				strictExecutionOrder: boolean;
			};
		};
	};
};
type TransformIndexHtmlHook = {
	handler(
		html: string,
		context: { filename: string }
	): string | undefined | { html: string; tags: Array<HtmlTagDescriptor> };
};

describe( 'productionCssOrderPlugin()', () => {
	let workspaceRoot: string;

	beforeEach( async () => {
		workspaceRoot = await createTemporaryDirectory( 'ckeditor5-production-css-order-plugin-' );
		vi.spyOn( process, 'cwd' ).mockReturnValue( workspaceRoot );
	} );

	afterEach( async () => {
		await removeDirectory( workspaceRoot );
	} );

	it( 'runs only during builds', () => {
		const plugin = productionCssOrderPlugin();

		expect( plugin.apply ).to.equal( 'build' );
	} );

	it( 'enables strict module execution order', () => {
		const plugin = productionCssOrderPlugin();
		const config = ( plugin.config as ConfigHook )();

		expect( config.build.rolldownOptions.output.strictExecutionOrder ).to.be.true;
	} );

	it( 'injects production CSS in module execution order', async () => {
		await Promise.all( [
			createFile(
				workspaceRoot,
				'packages/ckeditor5-foo/manual/foo.manual.html',
				'<!DOCTYPE html><html><head><style>.inline-style { color: black; }</style>' +
					'<script type="module" src="./foo.js"></script></head><body></body></html>'
			),
			createFile(
				workspaceRoot,
				'packages/ckeditor5-foo/manual/bar.manual.html',
				'<!DOCTYPE html><html><head><script type="module" src="./bar.js"></script></head><body></body></html>'
			),
			createFile(
				workspaceRoot,
				'packages/ckeditor5-foo/manual/foo.js',
				'import \'./shared.js\';\nimport \'./first.js\';\n'
			),
			createFile(
				workspaceRoot,
				'packages/ckeditor5-foo/manual/bar.js',
				'import \'./shared.js\';\nimport \'./second.js\';\n'
			),
			createFile( workspaceRoot, 'packages/ckeditor5-foo/manual/shared.js', 'import \'./shared.css\';\n' ),
			createFile( workspaceRoot, 'packages/ckeditor5-foo/manual/first.js', 'import \'./first.css\';\n' ),
			createFile( workspaceRoot, 'packages/ckeditor5-foo/manual/second.js', 'import \'./second.css\';\n' ),
			createFile( workspaceRoot, 'packages/ckeditor5-foo/manual/shared.css', '.order-shared { color: red; }' ),
			createFile( workspaceRoot, 'packages/ckeditor5-foo/manual/first.css', '.order-first { color: green; }' ),
			createFile( workspaceRoot, 'packages/ckeditor5-foo/manual/second.css', '.order-second { color: orange; }' ),
			createFile( workspaceRoot, 'packages/ckeditor5-foo/theme/index-editor.css', '.order-theme { color: blue; }' )
		] );
		const manualPlugin = manualTestsPlugin( { paths: [ 'packages/*' ] } );
		const transformIndexHtml = manualPlugin.transformIndexHtml as TransformIndexHtmlHook;

		// Keep the fixture entry executable in Node by omitting the unrelated browser-only manual bootstrap,
		// while preserving the catalog transformation required by the production build.
		manualPlugin.transformIndexHtml = {
			order: 'pre',
			handler( html, context ) {
				if ( context.filename == resolve( workspaceRoot, 'index.html' ) ) {
					return transformIndexHtml.handler( html, context );
				}
			}
		};

		await build( {
			root: workspaceRoot,
			appType: 'mpa',
			configFile: false,
			logLevel: 'silent',
			plugins: [
				productionCssOrderPlugin(),
				manualPlugin
			],
			build: {
				outDir: 'build',
				modulePreload: false,
				minify: false
			}
		} );

		const htmlFilePath = join( workspaceRoot, 'build/packages/ckeditor5-foo/manual/foo.manual.html' );
		const html = readFileSync( htmlFilePath, 'utf8' );
		const entryPath = /<script type="module" crossorigin src="([^"]+)"><\/script>/.exec( html )![ 1 ]!;
		const injectedStyles: Array<string> = [];

		vi.stubGlobal( 'document', {
			createElement: () => ( {
				textContent: ''
			} ),
			head: {
				appendChild: ( style: { textContent: string } ) => injectedStyles.push( style.textContent )
			}
		} );

		await import( pathToFileURL( resolve( workspaceRoot, 'build', stripLeadingSlash( entryPath ) ) ).href );

		expect( injectedStyles ).to.have.length( 3 );
		expect( injectedStyles[ 0 ] ).to.contain( '.order-shared' );
		expect( injectedStyles[ 1 ] ).to.contain( '.order-first' );
		expect( injectedStyles[ 2 ] ).to.contain( '.order-theme' );
	} );
} );
