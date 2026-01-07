/**
 * @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { join } from 'node:path';
import { test } from 'vitest';
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

test( 'should import a single `CSS` file', async () => {
	const output = await generateBundle(
		'./fixtures/single-import/input.ts',
		{ baseFileName: 'styles' }
	);

	const expectedResult = removeWhitespace(
		`body{
			color:'#000';
		}
	` );

	verifyDividedStyleSheet( output, 'styles-editor.css', expectedResult );
	verifyDividedStyleSheet( output, 'styles-content.css', '\n' );
} );

test( 'should import multiple `CSS` files', async () => {
	const output = await generateBundle(
		'./fixtures/multiple-import/input.ts',
		{ baseFileName: 'styles' }
	);

	const expectedResult = removeWhitespace(
		`body{
			color:'#000';
		}
		div{
			display:grid;
		}
	` );

	verifyDividedStyleSheet( output, 'styles-editor.css', expectedResult );
	verifyDividedStyleSheet( output, 'styles-content.css', '\n' );
} );

test( 'should import `CSS` file only once (without duplication)', async () => {
	const output = await generateBundle(
		'./fixtures/import-only-once/input.ts',
		{ baseFileName: 'styles' }
	);

	const expectedEditorResult = removeWhitespace(
		`.ck-feature{
			display:grid;
		}
	` );

	const expectedContentResult = removeWhitespace(
		`.ck-content.ck-feature{
			display:block;
		}
	` );

	verifyDividedStyleSheet( output, 'styles-editor.css', expectedEditorResult );
	verifyDividedStyleSheet( output, 'styles-content.css', expectedContentResult );
} );

test( 'should ignore `CSS` comments', async () => {
	const output = await generateBundle(
		'./fixtures/ignore-comments/input.ts',
		{ baseFileName: 'styles' }
	);

	const expectedResult = removeWhitespace(
		`body{
			color:'#000';
		}
	` );

	verifyDividedStyleSheet( output, 'styles-editor.css', expectedResult );
	verifyDividedStyleSheet( output, 'styles-content.css', '\n' );
} );

test( 'should filter `:root` declaration based on `CSS` variables usage only for `content` stylesheet', async () => {
	const output = await generateBundle(
		'./fixtures/filter-root-definitions/input.ts',
		{ baseFileName: 'styles' }
	);

	const expectedEditorResult = removeWhitespace(
		`:root{
			--variable1:blue;
			--variable2:red;
			--variable3:red;
			--variable4:pink;
		}
		.ck-feature{
			color:var(--variable1);
			background-color:var(--variable2);
		}
	` );

	const expectedContentResult = removeWhitespace(
		`:root{
			--variable3:red;
			--variable4:pink;
		}
		.ck-content.ck-feature{
			color:var(--variable3);
			background-color:var(--variable4);
		}
	` );

	verifyDividedStyleSheet( output, 'styles-editor.css', expectedEditorResult );
	verifyDividedStyleSheet( output, 'styles-content.css', expectedContentResult );
} );

test( 'should omit `:root` declaration when it\'s empty', async () => {
	const output = await generateBundle(
		'./fixtures/omit-root-definitions/input.ts',
		{ baseFileName: 'styles' }
	);

	const expectedEditorResult = removeWhitespace(
		`.ck-feature{
			color:red;
			background-color:blue;
		}
	` );

	const expectedContentResult = removeWhitespace(
		`.ck-content.ck-feature{
			color:red;
			background-color:blue;
		}
	` );

	verifyDividedStyleSheet( output, 'styles-editor.css', expectedEditorResult );
	verifyDividedStyleSheet( output, 'styles-content.css', expectedContentResult );
} );

test( 'should divide classes into files based on its purpose', async () => {
	const output = await generateBundle(
		'./fixtures/divide-classes/input.ts',
		{ baseFileName: 'styles' }
	);

	const expectedEditorResult = removeWhitespace(
		`.ck-feature{
			display:grid;
		}
	` );

	const expectedContentResult = removeWhitespace(
		`.ck-content.ck-feature{
			display:block;
		}
	` );

	verifyDividedStyleSheet( output, 'styles-editor.css', expectedEditorResult );
	verifyDividedStyleSheet( output, 'styles-content.css', expectedContentResult );
} );

test( 'should prepare empty `CSS` files when no styles imported', async () => {
	const output = await generateBundle(
		'./fixtures/no-styles/input.ts',
		{ baseFileName: 'styles' }
	);

	verifyDividedStyleSheet( output, 'styles-editor.css', '' );
	verifyDividedStyleSheet( output, 'styles-content.css', '' );
} );

test( 'should minify the content output', async () => {
	const output = await generateBundle(
		'./fixtures/single-import/input.ts',
		{ baseFileName: 'styles', minimize: true }
	);

	const expectedResult = 'body{color:"#000"}';

	verifyDividedStyleSheet( output, 'styles-editor.css', expectedResult );
	verifyDividedStyleSheet( output, 'styles-content.css', '' );
} );

test( 'should correctly parse the `data:image` style definition (should do not add new lines)', async () => {
	const output = await generateBundle(
		'./fixtures/import-data-image/input.ts',
		{ baseFileName: 'styles' }
	);

	const expectedResult = removeWhitespace(
		'.ck{\n' +
			'background-image:url("data:image/svg+xml;utf8,<svg width=\'120\' height=\'12\' xmlns=\'http://www.w3.org/2000/svg\' >' +
			'<text style=\'paint-order:stroke fill; clip-path: inset(-3px);transform: translate(-2px, 0)\' stroke=\'%23EAEAEA\' ' +
			'stroke-width=\'13\' dominant-baseline=\'middle\' fill=\'black\' x=\'100%\' text-anchor=\'end\' y=\'7\' font-size=\'9px\' ' +
			'font-family=\'Consolas, %22Lucida Console%22, %22Lucida Sans Typewriter%22, %22DejaVu Sans Mono%22, ' +
			'%22Bitstream Vera Sans Mono%22, %22Liberation Mono%22, Monaco, %22Courier New%22, Courier, monospace\'>' +
			'FIGCAPTION</text></svg>");\nbackground-position:calc(100% - 1px) 1px;\n}\n' );

	verifyDividedStyleSheet( output, 'styles-editor.css', expectedResult );
	verifyDividedStyleSheet( output, 'styles-content.css', '\n' );
} );

test( 'should keep CSS variables used by other CSS variables', async () => {
	const output = await generateBundle(
		'./fixtures/nested-css-variables/input.ts',
		{ baseFileName: 'styles' }
	);

	const expectedResult = removeWhitespace(
		`:root{
			--ck-spacing-unit:var(--ck-variable-1);
			--ck-variable-1:var(--ck-variable-2);
			--ck-variable-2:var(--ck-nonexistent-variable, var(--ck-variable-3));
			--ck-variable-3:0.6em;
			--ck-variable-4:1px;
			--ck-variable-5:1em;
			--ck-calc-variables:calc( var(--ck-variable-4) + var(--ck-variable-5));
		}
		.ck{
			margin:var(--ck-spacing-unit);
		}
		.ck{
			transform:translateX( var(--ck-calc-variables));
		}
	` );

	verifyDividedStyleSheet( output, 'styles-editor.css', expectedResult );
} );

test( 'should preserve all selectors', async () => {
	const output = await generateBundle(
		'./fixtures/more-than-one-selector/input.ts',
		{ baseFileName: 'styles' }
	);

	const expectedResult = removeWhitespace(
		`.ck,
		.second-selector,
		.third-selector p{
			color:red;
		}
	` );

	verifyDividedStyleSheet( output, 'styles-editor.css', expectedResult );
} );

test( 'should preserve all `@media` queries and split it correctly', async () => {
	const output = await generateBundle(
		'./fixtures/media-query/input.ts',
		{ baseFileName: 'styles' }
	);

	const expectedEditorResult = removeWhitespace(
		`@media (prefers-reduced-motion: reduce){
			.ck-image-upload-complete-icon{
				animation-duration:0ms;
			}
		}
	` );

	const expectedContentResult = removeWhitespace(
		`@media print{
			.ck-content .page-break{
				padding:0;
			}
		}
		@media screen and (max-width: 600px){
			.ck-content{
				width:100%;
			}
		}
	` );

	verifyDividedStyleSheet( output, 'styles-editor.css', expectedEditorResult );
	verifyDividedStyleSheet( output, 'styles-content.css', expectedContentResult );
} );

test( 'should filter `@keyframes` queries based on class names usage only for `content` stylesheet', async () => {
	const output = await generateBundle(
		'./fixtures/keyframes/input.ts',
		{ baseFileName: 'styles' }
	);

	const expectedEditorResult = removeWhitespace(
		`.animation{
			animation:fadeIn 1s;
		}
		@keyframes fadeIn{
			from{
				opacity:0;
			}
			to{ opacity:1; }
		}
		@keyframes ck-animation{
			0%{
				background-color:white;
			}
			100%{
				background-color:black;
			}
		}
	` );

	const expectedContentResult = removeWhitespace(
		`@media (forced-colors: none){
			.ck-content.animation-in-media-query{
				animation:ck-animation 1s ease-out;
			}
		}
		@keyframes ck-animation{
			0%{
				background-color:white;
			}
			100%{
				background-color:black;
			}
		}
	` );

	verifyDividedStyleSheet( output, 'styles-editor.css', expectedEditorResult );
	verifyDividedStyleSheet( output, 'styles-content.css', expectedContentResult );
} );
