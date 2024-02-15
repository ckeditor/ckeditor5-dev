/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { join } from 'path';
import { test } from 'vitest';
import { rollup, type RollupOutput, type NormalizedOutputOptions } from 'rollup';
import { verifyDividedStyleSheet } from '../../_utils/utils.js';

import { splitCss } from '../../../src/index.js';

const TEST_BANNER = `/**
 * License banner.
 */
`;

/**
 * Helper function for creating a bundle that won't be written to the file system.
 */
async function generateBundle(
	input: string,
	options?: NormalizedOutputOptions,
	banner?: string
): Promise<RollupOutput['output']> {
	const bundle = await rollup( {
		input,
		plugins: [
			splitCss()
		]
	} );

	const { output } = await bundle.generate( { format: 'esm', banner } );

	return output;
}

test( 'Import of single `CSS` file', async () => {
	const output = await generateBundle( join( import.meta.dirname, './fixtures/single-import/input.ts' ) );
	const expectedResult = `
body {
color: '#000';
}
`;

	verifyDividedStyleSheet( output, 'styles.css', expectedResult );
	verifyDividedStyleSheet( output, 'editor-styles.css', expectedResult );
	verifyDividedStyleSheet( output, 'content-styles.css', '\n' );
} );

test( 'Import of single `CSS` file with a banner', async () => {
	const output = await generateBundle( join( import.meta.dirname, './fixtures/single-import/input.ts' ), undefined, TEST_BANNER );
	const expectedResult = `${ TEST_BANNER }
body {
color: '#000';
}
`;

	const expectedEmptyResult = `${ TEST_BANNER }\n`;

	verifyDividedStyleSheet( output, 'styles.css', expectedResult );
	verifyDividedStyleSheet( output, 'editor-styles.css', expectedResult );
	verifyDividedStyleSheet( output, 'content-styles.css', expectedEmptyResult );
} );

test( 'Import multiple `CSS` files', async () => {
	const output = await generateBundle( join( import.meta.dirname, './fixtures/multiple-import/input.ts' ) );

	const expectedResult = `
body {
color: '#000';
}
div {
display: grid;
}
`;

	verifyDividedStyleSheet( output, 'styles.css', expectedResult );
	verifyDividedStyleSheet( output, 'editor-styles.css', expectedResult );
	verifyDividedStyleSheet( output, 'content-styles.css', '\n' );
} );

test( 'Import `CSS` file only once (without duplication)', async () => {
	const output = await generateBundle( join( import.meta.dirname, './fixtures/import-only-once/input.ts' ) );

	const expectedFullResult = `
.ck-content.ck-feature {
display: block;
}
.ck-feature {
display: grid;
}
`;

	const expectedEditorResult = `
.ck-feature {
display: grid;
}
`;

	const expectedContentResult = `
.ck-content.ck-feature {
display: block;
}
`;

	verifyDividedStyleSheet( output, 'styles.css', expectedFullResult );
	verifyDividedStyleSheet( output, 'editor-styles.css', expectedEditorResult );
	verifyDividedStyleSheet( output, 'content-styles.css', expectedContentResult );
} );

test( 'Ignore `CSS` comments', async () => {
	const output = await generateBundle( join( import.meta.dirname, './fixtures/ignore-comments/input.ts' ) );
	const expectedResult = `
body {
color: '#000';
}
`;

	verifyDividedStyleSheet( output, 'styles.css', expectedResult );
	verifyDividedStyleSheet( output, 'editor-styles.css', expectedResult );
	verifyDividedStyleSheet( output, 'content-styles.css', '\n' );
} );

test( 'Combine `:root` declarations from multiple entries into one', async () => {
	const output = await generateBundle( join( import.meta.dirname, './fixtures/combine-root-definitions/input.ts' ) );

	const expectedResult = `
:root {
--variable1: blue;
--variable2: red;
}
h1 {
color: var(--variable1);
}
p {
color: var(--variable2);
}
`;

	verifyDividedStyleSheet( output, 'styles.css', expectedResult );
	verifyDividedStyleSheet( output, 'editor-styles.css', expectedResult );
	verifyDividedStyleSheet( output, 'content-styles.css', '\n' );
} );

test( 'Filter `:root` declaration based on `CSS` variables usage', async () => {
	const output = await generateBundle( join( import.meta.dirname, './fixtures/filter-root-definitions/input.ts' ) );

	const expectedFullResult = `
:root {
--variable1: blue;
--variable2: red;
--variable3: red;
--variable4: pink;
}
.ck-feature {
color: var(--variable1);
background-color: var(--variable2);
}
.ck-content.ck-feature {
color: var(--variable3);
background-color: var(--variable4);
}
`;

	const expectedEditorResult = `
:root {
--variable1: blue;
--variable2: red;
}
.ck-feature {
color: var(--variable1);
background-color: var(--variable2);
}
`;

	const expectedContentResult = `
:root {
--variable3: red;
--variable4: pink;
}
.ck-content.ck-feature {
color: var(--variable3);
background-color: var(--variable4);
}
`;

	verifyDividedStyleSheet( output, 'styles.css', expectedFullResult );
	verifyDividedStyleSheet( output, 'editor-styles.css', expectedEditorResult );
	verifyDividedStyleSheet( output, 'content-styles.css', expectedContentResult );
} );

test( 'Omit `:root` declaration when it\'s not exist', async () => {
	const output = await generateBundle( join( import.meta.dirname, './fixtures/omit-root-definitions/input.ts' ) );

	const expectedFullResult = `
:root {
--variable1: blue;
--variable2: red;
--variable3: red;
--variable4: pink;
}
.ck-feature {
color: var(--variable1);
background-color: var(--variable2);
}
.ck-content.ck-feature {
color: red;
background-color: blue;
}
`;

	const expectedEditorResult = `
:root {
--variable1: blue;
--variable2: red;
}
.ck-feature {
color: var(--variable1);
background-color: var(--variable2);
}
`;

	const expectedContentResult = `
.ck-content.ck-feature {
color: red;
background-color: blue;
}
`;

	verifyDividedStyleSheet( output, 'styles.css', expectedFullResult );
	verifyDividedStyleSheet( output, 'editor-styles.css', expectedEditorResult );
	verifyDividedStyleSheet( output, 'content-styles.css', expectedContentResult );
} );

test( 'Divide classes into files based on its purpose', async () => {
	const output = await generateBundle( join( import.meta.dirname, './fixtures/divide-classes/input.ts' ) );

	const expectedFullResult = `
.ck-feature {
display: grid;
}
.ck-content.ck-feature {
display: block;
}
`;

	const expectedEditorResult = `
.ck-feature {
display: grid;
}
`;

	const expectedContentResult = `
.ck-content.ck-feature {
display: block;
}
`;

	verifyDividedStyleSheet( output, 'styles.css', expectedFullResult );
	verifyDividedStyleSheet( output, 'editor-styles.css', expectedEditorResult );
	verifyDividedStyleSheet( output, 'content-styles.css', expectedContentResult );
} );
