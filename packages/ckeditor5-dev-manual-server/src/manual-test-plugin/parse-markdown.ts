/**
 * @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { unified } from 'unified';
import remarkGfm from 'remark-gfm';
import remarkParse from 'remark-parse';
import remarkRehype from 'remark-rehype';
import { toHtml } from 'hast-util-to-html';

const markdownProcessor = unified()
	.use( remarkParse )
	.use( remarkGfm )
	.use( remarkRehype, { allowDangerousHtml: true } );

/**
 * Renders a Markdown string to HTML using the same pipeline the manual test server used for
 * legacy `.md` instruction sidecars. Kept so the corpus migration script (Phase 3) can convert
 * `.md` instructions into `<ck-manual-header>` slotted content with identical output.
 */
export function renderMarkdown( markdown: string ): string {
	const trimmed = markdown.trim();

	if ( !trimmed ) {
		return '';
	}

	const tree = markdownProcessor.runSync( markdownProcessor.parse( trimmed ) );

	return toHtml( tree, { allowDangerousHtml: true } );
}
