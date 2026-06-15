/**
 * @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { resolve } from 'node:path';
import { parse } from 'parse5';
import { describe, expect, test } from 'vitest';
import { getAttribute, isElementNode, query, queryAll, type Element } from '@parse5/tools';
import { createManualShellHtml } from '../../src/manual-test-plugin/shell-html.js';
import { createFile, createTemporaryDirectory, removeDirectory } from '../_utils/files.js';
import type { ManualPageEntry } from '../../src/manual-test-plugin/types.js';

describe( 'createManualShellHtml()', () => {
	const shellTemplateFilePath = resolve( import.meta.dirname, '../../theme/shell.html' );
	const workspaceRoot = resolve( '/workspace' );
	const entry: ManualPageEntry = {
		displayName: 'Iframe test',
		htmlFilePath: '/packages/ckeditor5-foo/tests/manual/iframe.html',
		packageName: 'ckeditor5-foo',
		scriptFilePath: '/packages/ckeditor5-foo/tests/manual/iframe.js',
		slug: 'iframe'
	};

	test( 'wraps manual test content during HTML transform to avoid runtime iframe reparenting', () => {
		const html = createManualShellHtml( {
			entry,
			html: '<h2>Manual test</h2><iframe src="assets/frame.html"></iframe>',
			shellScriptPublicPath: '/theme/shell.ts',
			shellTemplateFilePath,
			workspaceRoot
		} );
		const document = parse( html );
		const containers = [ ...queryAll<Element>( document, node => {
			return isElementNode( node ) && getAttribute( node, 'class' ) == 'manual-test-container';
		} ) ];

		expect( containers ).to.have.length( 1 );

		const iframe = query<Element>( containers[ 0 ]!, node => isElementNode( node ) && node.tagName == 'iframe' );

		expect( containers[ 0 ]!.parentNode ).to.equal( query<Element>( document, node => {
			return isElementNode( node ) && node.tagName == 'body';
		} ) );
		expect( iframe ).not.to.be.null;
		expect( getAttribute( iframe!, 'src' ) ).to.equal( 'assets/frame.html' );
	} );

	test( 'preserves manual body attributes on the shell body', () => {
		const html = createManualShellHtml( {
			entry,
			html: '<body class="ai-multi-manual" data-test="preserved"><p>Manual test</p></body>',
			shellScriptPublicPath: '/theme/shell.ts',
			shellTemplateFilePath,
			workspaceRoot
		} );
		const document = parse( html );
		const body = query<Element>( document, node => isElementNode( node ) && node.tagName == 'body' )!;

		expect( getAttribute( body, 'class' ) ).to.equal( 'ai-multi-manual' );
		expect( getAttribute( body, 'data-test' ) ).to.equal( 'preserved' );
	} );

	test( 'sets the catalog link href', () => {
		const html = createManualShellHtml( {
			catalogPublicPath: '../../../../index.html',
			entry,
			html: '<p>Manual test</p>',
			shellScriptPublicPath: '/theme/shell.ts',
			shellTemplateFilePath,
			workspaceRoot
		} );
		expect( html ).to.contain( 'href="../../../../index.html" title="Back to test index"' );
	} );

	test( 'keeps existing shell body attributes when manual body duplicates them', async () => {
		const temporaryDirectory = await createTemporaryDirectory( 'ckeditor5-manual-shell-html-' );

		try {
			const customShellTemplateFilePath = await createFile( temporaryDirectory, 'shell.html', [
				'<!DOCTYPE html><html><head>',
				'<title></title>',
				'<script type="module" data-manual-shell-script></script>',
				'<script type="module" data-manual-test-script></script>',
				'</head><body data-test="shell">',
				'<script id="manual-shell-data" type="application/json"></script>',
				'</body></html>'
			].join( '' ) );
			const html = createManualShellHtml( {
				entry,
				html: '<body data-test="manual" data-extra="preserved"><p>Manual test</p></body>',
				shellScriptPublicPath: '/theme/shell.ts',
				shellTemplateFilePath: customShellTemplateFilePath,
				workspaceRoot
			} );
			const document = parse( html );
			const body = query<Element>( document, node => isElementNode( node ) && node.tagName == 'body' )!;

			expect( getAttribute( body, 'data-test' ) ).to.equal( 'shell' );
			expect( getAttribute( body, 'data-extra' ) ).to.equal( 'preserved' );
		} finally {
			await removeDirectory( temporaryDirectory );
		}
	} );

	test( 'keeps only the shell-injected manual test script', () => {
		const html = createManualShellHtml( {
			entry,
			html: [
				'<head>',
				'<script type="module" src="./iframe.js"></script>',
				'<script>window.inline = true;</script>',
				'<script src="https://cdn.example.com/iframe.js"></script>',
				'<script type="module" src="./helper.js"></script>',
				'</head>',
				'<body>',
				'<script type="module" src="./iframe.js?v=1"></script>',
				'</body>'
			].join( '' ),
			shellScriptPublicPath: '/theme/shell.ts',
			shellTemplateFilePath,
			workspaceRoot
		} );
		const document = parse( html );
		const scriptSources = [ ...queryAll<Element>( document, node => isElementNode( node ) && node.tagName == 'script' ) ]
			.map( script => getAttribute( script, 'src' ) )
			.filter( ( source ): source is string => Boolean( source ) );

		expect( scriptSources.filter( source => source == './iframe.js' ) ).to.have.length( 1 );
		expect( scriptSources ).to.include( 'https://cdn.example.com/iframe.js' );
		expect( scriptSources ).to.include( './helper.js' );
		expect( html ).to.contain( '<script>window.inline = true;</script>' );
	} );

	test( 'moves supported manual head nodes and skips duplicated shell metadata', () => {
		const html = createManualShellHtml( {
			entry,
			html: [
				'<head>',
				'<!-- manual comment -->',
				'<meta charset="utf-8">',
				'<meta name="viewport" content="width=device-width">',
				'<meta name="robots" content="noindex">',
				'<style>.manual { color: red; }</style>',
				'</head>'
			].join( '' ),
			shellScriptPublicPath: '/theme/shell.ts',
			shellTemplateFilePath,
			workspaceRoot
		} );

		expect( html ).to.contain( '<!-- manual comment -->' );
		expect( html ).to.contain( '<meta name="robots" content="noindex">' );
		expect( html ).to.contain( '<style>.manual { color: red; }</style>' );
		expect( html ).not.to.contain( '<meta charset="utf-8"><meta charset="utf-8">' );
		expect( html ).not.to.contain( '<meta name="viewport" content="width=device-width"><meta name="viewport"' );
	} );

	test( 'removes stale JavaScript test script when TypeScript test script is selected', () => {
		const html = createManualShellHtml( {
			entry: {
				...entry,
				scriptFilePath: '/packages/ckeditor5-foo/tests/manual/iframe.ts'
			},
			html: [
				'<head>',
				'<script type="module" src="./iframe.js"></script>',
				'<script type="module" src="./iframe-helper.js"></script>',
				'</head>'
			].join( '' ),
			shellScriptPublicPath: '/theme/shell.ts',
			shellTemplateFilePath,
			workspaceRoot
		} );
		const document = parse( html );
		const scriptSources = [ ...queryAll<Element>( document, node => isElementNode( node ) && node.tagName == 'script' ) ]
			.map( script => getAttribute( script, 'src' ) )
			.filter( ( source ): source is string => Boolean( source ) );

		expect( scriptSources ).to.include( './iframe.ts' );
		expect( scriptSources ).to.include( './iframe-helper.js' );
		expect( scriptSources ).not.to.include( './iframe.js' );
	} );
} );
