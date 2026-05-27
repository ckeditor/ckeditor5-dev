/**
 * @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { resolve } from 'node:path';
import { readFileSync } from 'node:fs';
import { unified } from 'unified';
import remarkGfm from 'remark-gfm';
import remarkParse from 'remark-parse';
import remarkRehype from 'remark-rehype';
import { toHtml } from 'hast-util-to-html';
import type { ManualPageEntry } from './types.js';

const markdownProcessor = unified()
	.use( remarkParse )
	.use( remarkGfm )
	.use( remarkRehype );

export function loadRenderedInstructions( entry: ManualPageEntry, workspaceRoot: string ): string {
	if ( !entry.instructionsFilePath ) {
		return '';
	}

	const absolutePath = resolve( workspaceRoot, entry.instructionsFilePath.slice( 1 ) );
	const markdown = readFileSync( absolutePath, 'utf8' ).trim();

	if ( !markdown ) {
		return '';
	}

	const tree = markdownProcessor.runSync( markdownProcessor.parse( markdown ) );

	return toHtml( tree );
}

