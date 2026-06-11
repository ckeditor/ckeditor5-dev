/**
 * @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { afterEach, beforeEach, describe, expect, test } from 'vitest';
import { loadRenderedInstructions } from '../../src/manual-test-plugin/parse-markdown.js';
import { createFile, createTemporaryDirectory, removeDirectory } from '../_utils/files.js';
import type { ManualPageEntry } from '../../src/manual-test-plugin/types.js';

describe( 'loadRenderedInstructions()', () => {
	let workspaceRoot: string;

	beforeEach( async () => {
		workspaceRoot = await createTemporaryDirectory( 'ckeditor5-manual-instructions-' );
	} );

	afterEach( async () => {
		await removeDirectory( workspaceRoot );
	} );

	test( 'returns an empty string for entries without instructions', () => {
		expect( loadRenderedInstructions( createEntry(), workspaceRoot ) ).to.equal( '' );
	} );

	test( 'returns an empty string for empty instructions', async () => {
		await createFile( workspaceRoot, 'packages/ckeditor5-foo/tests/manual/sample.md', '   \n' );

		expect( loadRenderedInstructions( createEntry( {
			instructionsFilePath: '/packages/ckeditor5-foo/tests/manual/sample.md'
		} ), workspaceRoot ) ).to.equal( '' );
	} );

	test( 'renders markdown instructions to HTML', async () => {
		await createFile( workspaceRoot, 'packages/ckeditor5-foo/tests/manual/sample.md', '## Steps\n\n- Click **Bold**' );

		expect( loadRenderedInstructions( createEntry( {
			instructionsFilePath: '/packages/ckeditor5-foo/tests/manual/sample.md'
		} ), workspaceRoot ) ).to.equal( '<h2>Steps</h2>\n<ul>\n<li>Click <strong>Bold</strong></li>\n</ul>' );
	} );

	test( 'preserves raw HTML in markdown instructions', async () => {
		await createFile(
			workspaceRoot,
			'packages/ckeditor5-foo/tests/manual/sample.md',
			'Press <kbd>Ctrl</kbd>+<kbd>B</kbd>.\n\n<details><summary>More</summary>Hidden steps.</details>'
		);

		expect( loadRenderedInstructions( createEntry( {
			instructionsFilePath: '/packages/ckeditor5-foo/tests/manual/sample.md'
		} ), workspaceRoot ) ).to.equal(
			'<p>Press <kbd>Ctrl</kbd>+<kbd>B</kbd>.</p>\n<details><summary>More</summary>Hidden steps.</details>'
		);
	} );
} );

function createEntry( overrides: Partial<ManualPageEntry> = {} ): ManualPageEntry {
	return {
		displayName: 'Sample',
		htmlFilePath: '/packages/ckeditor5-foo/tests/manual/sample.html',
		packageName: 'ckeditor5-foo',
		scriptFilePath: '/packages/ckeditor5-foo/tests/manual/sample.js',
		slug: 'sample',
		...overrides
	};
}
