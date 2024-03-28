/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { join } from 'path';
import { describe, test } from 'vitest';
import { rollup, type RollupOutput } from 'rollup';

import styles from 'rollup-plugin-styles';
import postcssNesting from 'postcss-nesting';
import postcssMixins from 'postcss-mixins';

import { verifyDividedStyleSheet } from '../../_utils/utils.js';
import { splitCss, type RollupSplitCssOptions } from '../../../src/index.js';
import { removeWhitespace } from '../../../src/utils.js';

/**
 * Helper function for creating a bundle that won't be written to the file system.
 */
async function generateBundle(
	input: string,
	options: RollupSplitCssOptions,
	banner?: string
): Promise<RollupOutput['output']> {
	const bundle = await rollup( {
		input: join( import.meta.dirname, input ),
		plugins: [
			styles( {
				mode: [ 'extract', 'styles.css' ],
				plugins: [
					postcssNesting,
					postcssMixins
				]
			} ),
			splitCss( options )
		]
	} );

	const { output } = await bundle.generate( {
		format: 'esm',
		file: 'input.js',
		assetFileNames: '[name][extname]',
		banner
	} );

	return output;
}

describe( 'splitCss', () => {
	test( 'should import a single `CSS` file', async () => {
		const output = await generateBundle(
			'./fixtures/single-import/input.ts',
			{ baseFileName: 'styles.css' }
		);

		const expectedResult = removeWhitespace(
			`body {
				color: '#000';
			}
		` );

		verifyDividedStyleSheet( output, 'editor-styles.css', expectedResult );
		verifyDividedStyleSheet( output, 'content-styles.css', '' );
	} );

	test( 'should import multiple `CSS` files', async () => {
		const output = await generateBundle(
			'./fixtures/multiple-import/input.ts',
			{ baseFileName: 'styles.css' }
		);

		const expectedResult = removeWhitespace(
			`body {
				color: '#000';
			}
			div {
				display: grid;
			}
		` );

		verifyDividedStyleSheet( output, 'editor-styles.css', expectedResult );
		verifyDividedStyleSheet( output, 'content-styles.css', '' );
	} );

	test( 'should import `CSS` file only once (without duplication)', async () => {
		const output = await generateBundle(
			'./fixtures/import-only-once/input.ts',
			{ baseFileName: 'styles.css' }
		);

		const expectedEditorResult = removeWhitespace(
			`.ck-feature {
				display: grid;
			}
		` );

		const expectedContentResult = removeWhitespace(
			`.ck-content.ck-feature {
				display: block;
			}
		` );

		verifyDividedStyleSheet( output, 'editor-styles.css', expectedEditorResult );
		verifyDividedStyleSheet( output, 'content-styles.css', expectedContentResult );
	} );

	test( 'should ignore `CSS` comments', async () => {
		const output = await generateBundle(
			'./fixtures/ignore-comments/input.ts',
			{ baseFileName: 'styles.css' }
		);

		const expectedResult = removeWhitespace(
			`body {
				color: '#000';
			}
		` );

		verifyDividedStyleSheet( output, 'editor-styles.css', expectedResult );
		verifyDividedStyleSheet( output, 'content-styles.css', '' );
	} );

	test( 'should combine `:root` declarations from multiple entries into one', async () => {
		const output = await generateBundle(
			'./fixtures/combine-root-definitions/input.ts',
			{ baseFileName: 'styles.css' }
		);

		const expectedResult = removeWhitespace(
			`:root {
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

		verifyDividedStyleSheet( output, 'editor-styles.css', expectedResult );
		verifyDividedStyleSheet( output, 'content-styles.css', '' );
	} );

	test( 'should filter `:root` declaration based on `CSS` variables usage', async () => {
		const output = await generateBundle(
			'./fixtures/filter-root-definitions/input.ts',
			{ baseFileName: 'styles.css' }
		);

		const expectedEditorResult = removeWhitespace(
			`:root {
				--variable1: blue;
				--variable2: red;
			}
			.ck-feature {
				color: var(--variable1);
				background-color: var(--variable2);
			}
		` );

		const expectedContentResult = removeWhitespace(
			`:root {
				--variable3: red;
				--variable4: pink;
			}
			.ck-content.ck-feature {
				color: var(--variable3);
				background-color: var(--variable4);
			}
		` );

		verifyDividedStyleSheet( output, 'editor-styles.css', expectedEditorResult );
		verifyDividedStyleSheet( output, 'content-styles.css', expectedContentResult );
	} );

	test( 'should omit `:root` declaration when it\'s not exist', async () => {
		const output = await generateBundle(
			'./fixtures/omit-root-definitions/input.ts',
			{ baseFileName: 'styles.css' }
		);

		const expectedEditorResult = removeWhitespace(
			`:root {
				--variable1: blue;
				--variable2: red;
			}
			.ck-feature {
				color: var(--variable1);
				background-color: var(--variable2);
			}
		` );

		const expectedContentResult = removeWhitespace(
			`.ck-content.ck-feature {
				color: red;
				background-color: blue;
			}
		` );

		verifyDividedStyleSheet( output, 'editor-styles.css', expectedEditorResult );
		verifyDividedStyleSheet( output, 'content-styles.css', expectedContentResult );
	} );

	test( 'should divide classes into files based on its purpose', async () => {
		const output = await generateBundle(
			'./fixtures/divide-classes/input.ts',
			{ baseFileName: 'styles.css' }
		);

		const expectedEditorResult = removeWhitespace(
			`.ck-feature {
				display: grid;
			}
		` );

		const expectedContentResult = removeWhitespace(
			`.ck-content.ck-feature {
				display: block;
			}
		` );

		verifyDividedStyleSheet( output, 'editor-styles.css', expectedEditorResult );
		verifyDividedStyleSheet( output, 'content-styles.css', expectedContentResult );
	} );

	test( 'should prepare empty `CSS` files when no styles imported', async () => {
		const output = await generateBundle(
			'./fixtures/no-styles/input.ts',
			{ baseFileName: 'styles.css' }
		);

		verifyDividedStyleSheet( output, 'editor-styles.css', '' );
		verifyDividedStyleSheet( output, 'content-styles.css', '' );
	} );

	test( 'should minify the content output', async () => {
		const output = await generateBundle(
			'./fixtures/single-import/input.ts',
			{ baseFileName: 'styles.min.css', minimize: true }
		);

		const expectedResult = 'body{color:"#000"}';

		verifyDividedStyleSheet( output, 'editor-styles.min.css', expectedResult );
		verifyDividedStyleSheet( output, 'content-styles.min.css', '' );
	} );
} );
