/**
 * @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { afterEach, beforeEach, describe, expect, test } from 'vitest';
import { loadRenderedInstructions } from '../../src/manual-test-plugin/parse-markdown.js';
import type { ManualPageEntry } from '../../src/manual-test-plugin/types.js';

describe( 'loadRenderedInstructions()', () => {
	let workspaceRoot: string;

	beforeEach( async () => {
		workspaceRoot = await mkdtemp( join( tmpdir(), 'ckeditor5-manual-instructions-' ) );
	} );

	afterEach( async () => {
		await rm( workspaceRoot, { recursive: true, force: true } );
	} );

	test( 'returns an empty string for entries without instructions', () => {
		expect( loadRenderedInstructions( createEntry(), workspaceRoot ) ).to.equal( '' );
	} );

	test( 'returns an empty string for empty instructions', async () => {
		await createFile( 'packages/ckeditor5-foo/tests/manual/sample.md', '   \n' );

		expect( loadRenderedInstructions( createEntry( {
			instructionsFilePath: '/packages/ckeditor5-foo/tests/manual/sample.md'
		} ), workspaceRoot ) ).to.equal( '' );
	} );

	test( 'renders markdown instructions to HTML', async () => {
		await createFile( 'packages/ckeditor5-foo/tests/manual/sample.md', '## Steps\n\n- Click **Bold**' );

		expect( loadRenderedInstructions( createEntry( {
			instructionsFilePath: '/packages/ckeditor5-foo/tests/manual/sample.md'
		} ), workspaceRoot ) ).to.equal( '<h2>Steps</h2>\n<ul>\n<li>Click <strong>Bold</strong></li>\n</ul>' );
	} );

	async function createFile( relativeFilePath: string, content: string ): Promise<void> {
		const filePath = join( workspaceRoot, relativeFilePath );

		await mkdir( dirname( filePath ), { recursive: true } );
		await writeFile( filePath, content );
	}
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
