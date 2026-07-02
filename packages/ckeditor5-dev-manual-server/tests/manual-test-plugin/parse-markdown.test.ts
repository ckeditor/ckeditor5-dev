/**
 * @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { describe, expect, test } from 'vitest';
import { renderMarkdown } from '../../src/manual-test-plugin/parse-markdown.js';

describe( 'renderMarkdown()', () => {
	test( 'returns an empty string for empty input', () => {
		expect( renderMarkdown( '   \n' ) ).to.equal( '' );
	} );

	test( 'renders markdown to HTML', () => {
		expect( renderMarkdown( '## Steps\n\n- Click **Bold**' ) )
			.to.equal( '<h2>Steps</h2>\n<ul>\n<li>Click <strong>Bold</strong></li>\n</ul>' );
	} );

	test( 'preserves raw HTML in markdown', () => {
		expect( renderMarkdown(
			'Press <kbd>Ctrl</kbd>+<kbd>B</kbd>.\n\n<details><summary>More</summary>Hidden steps.</details>'
		) ).to.equal(
			'<p>Press <kbd>Ctrl</kbd>+<kbd>B</kbd>.</p>\n<details><summary>More</summary>Hidden steps.</details>'
		);
	} );
} );
