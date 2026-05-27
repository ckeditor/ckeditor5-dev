/**
 * @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import path from 'node:path';
import { parse } from 'parse5';
import { describe, expect, test } from 'vitest';
import { getAttribute, isElementNode, query, queryAll, type Element } from '@parse5/tools';
import { createManualShellHtml } from '../../src/manual-test-plugin/shell-html.js';
import type { ManualPageEntry } from '../../src/manual-test-plugin/types.js';

describe( 'createManualShellHtml()', () => {
	const shellTemplateFilePath = path.resolve( import.meta.dirname, '../../theme/shell.html' );
	const workspaceRoot = path.resolve( '/workspace' );
	const entry: ManualPageEntry = {
		displayName: 'Iframe test',
		htmlFilePath: '/packages/ckeditor5-foo/tests/manual/iframe.html',
		packageName: 'ckeditor5-foo',
		scriptFilePath: '/packages/ckeditor5-foo/tests/manual/iframe.js',
		slug: 'iframe',
		source: 'commercial'
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
} );
