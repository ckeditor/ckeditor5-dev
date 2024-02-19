/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { join } from 'path';
import { describe, test } from 'vitest';
import { rollup, type RollupOutput, type NormalizedOutputOptions } from 'rollup';
import { verifyDividedStyleSheet, removeWhitespace } from '../../_utils/utils.js';

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
		input: join( import.meta.dirname, input ),
		plugins: [
			splitCss()
		]
	} );

	const { output } = await bundle.generate( { format: 'esm', banner } );

	return output;
}

describe( 'splitCss', () => {
	test( 'should import a single `CSS` file', async () => {
		const output = await generateBundle( './fixtures/single-import/input.ts' );
		const expectedResult = removeWhitespace( `
			body {
				color: '#000';
			}
		` );

		verifyDividedStyleSheet( output, 'styles.css', expectedResult );
		verifyDividedStyleSheet( output, 'editor-styles.css', expectedResult );
		verifyDividedStyleSheet( output, 'content-styles.css', '\n' );
	} );

	test( 'should import a single `CSS` file with a banner', async () => {
		const output = await generateBundle( './fixtures/single-import/input.ts', undefined, TEST_BANNER );
		const expectedResult = TEST_BANNER + removeWhitespace( `
			body {
				color: '#000';
			}
		` );

		const expectedEmptyResult = `${ TEST_BANNER }\n`;

		verifyDividedStyleSheet( output, 'styles.css', expectedResult );
		verifyDividedStyleSheet( output, 'editor-styles.css', expectedResult );
		verifyDividedStyleSheet( output, 'content-styles.css', expectedEmptyResult );
	} );

	test( 'should import multiple `CSS` files', async () => {
		const output = await generateBundle( './fixtures/multiple-import/input.ts' );

		const expectedResult = removeWhitespace( `
			body {
				color: '#000';
			}
			div {
				display: grid;
			}
		` );

		verifyDividedStyleSheet( output, 'styles.css', expectedResult );
		verifyDividedStyleSheet( output, 'editor-styles.css', expectedResult );
		verifyDividedStyleSheet( output, 'content-styles.css', '\n' );
	} );

	test( 'should import `CSS` file only once (without duplication)', async () => {
		const output = await generateBundle( './fixtures/import-only-once/input.ts' );

		const expectedFullResult = removeWhitespace( `
			.ck-content.ck-feature {
				display: block;
			}
			.ck-feature {
				display: grid;
			}
		` );

		const expectedEditorResult = removeWhitespace( `
			.ck-feature {
				display: grid;
			}
		` );

		const expectedContentResult = removeWhitespace( `
			.ck-content.ck-feature {
				display: block;
			}
		` );

		verifyDividedStyleSheet( output, 'styles.css', expectedFullResult );
		verifyDividedStyleSheet( output, 'editor-styles.css', expectedEditorResult );
		verifyDividedStyleSheet( output, 'content-styles.css', expectedContentResult );
	} );

	test( 'should ignore `CSS` comments', async () => {
		const output = await generateBundle( './fixtures/ignore-comments/input.ts' );
		const expectedResult = removeWhitespace( `
			body {
				color: '#000';
			}
		` );

		verifyDividedStyleSheet( output, 'styles.css', expectedResult );
		verifyDividedStyleSheet( output, 'editor-styles.css', expectedResult );
		verifyDividedStyleSheet( output, 'content-styles.css', '\n' );
	} );

	test( 'should combine `:root` declarations from multiple entries into one', async () => {
		const output = await generateBundle( './fixtures/combine-root-definitions/input.ts' );

		const expectedResult = removeWhitespace( `
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
		` );

		verifyDividedStyleSheet( output, 'styles.css', expectedResult );
		verifyDividedStyleSheet( output, 'editor-styles.css', expectedResult );
		verifyDividedStyleSheet( output, 'content-styles.css', '\n' );
	} );

	test( 'should filter `:root` declaration based on `CSS` variables usage', async () => {
		const output = await generateBundle( './fixtures/filter-root-definitions/input.ts' );

		const expectedFullResult = removeWhitespace( `
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
		` );

		const expectedEditorResult = removeWhitespace( `
			:root {
				--variable1: blue;
				--variable2: red;
			}
			.ck-feature {
				color: var(--variable1);
				background-color: var(--variable2);
			}
		` );

		const expectedContentResult = removeWhitespace( `
			:root {
				--variable3: red;
				--variable4: pink;
			}
			.ck-content.ck-feature {
				color: var(--variable3);
				background-color: var(--variable4);
			}
		` );

		verifyDividedStyleSheet( output, 'styles.css', expectedFullResult );
		verifyDividedStyleSheet( output, 'editor-styles.css', expectedEditorResult );
		verifyDividedStyleSheet( output, 'content-styles.css', expectedContentResult );
	} );

	test( 'should omit `:root` declaration when it\'s not exist', async () => {
		const output = await generateBundle( './fixtures/omit-root-definitions/input.ts' );

		const expectedFullResult = removeWhitespace( `
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
		` );

		const expectedEditorResult = removeWhitespace( `
			:root {
				--variable1: blue;
				--variable2: red;
			}
			.ck-feature {
				color: var(--variable1);
				background-color: var(--variable2);
			}
		` );

		const expectedContentResult = removeWhitespace( `
			.ck-content.ck-feature {
				color: red;
				background-color: blue;
			}
		` );

		verifyDividedStyleSheet( output, 'styles.css', expectedFullResult );
		verifyDividedStyleSheet( output, 'editor-styles.css', expectedEditorResult );
		verifyDividedStyleSheet( output, 'content-styles.css', expectedContentResult );
	} );

	test( 'should divide classes into files based on its purpose', async () => {
		const output = await generateBundle( './fixtures/divide-classes/input.ts' );

		const expectedFullResult = removeWhitespace( `
			.ck-feature {
				display: grid;
			}
			.ck-content.ck-feature {
				display: block;
			}
		` );

		const expectedEditorResult = removeWhitespace( `
			.ck-feature {
				display: grid;
			}
		` );

		const expectedContentResult = removeWhitespace( `
			.ck-content.ck-feature {
				display: block;
			}
		` );

		verifyDividedStyleSheet( output, 'styles.css', expectedFullResult );
		verifyDividedStyleSheet( output, 'editor-styles.css', expectedEditorResult );
		verifyDividedStyleSheet( output, 'content-styles.css', expectedContentResult );
	} );

	test( 'should prepare empty `CSS` files when no styles imported', async () => {
		const output = await generateBundle( './fixtures/no-styles/input.ts' );

		verifyDividedStyleSheet( output, 'styles.css', '\n' );
		verifyDividedStyleSheet( output, 'editor-styles.css', '\n' );
		verifyDividedStyleSheet( output, 'content-styles.css', '\n' );
	} );
} );
