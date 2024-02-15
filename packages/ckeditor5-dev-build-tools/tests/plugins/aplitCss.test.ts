/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { test, expect } from 'vitest';
import { rollup, type OutputAsset, type RollupOutput, type NormalizedOutputOptions } from 'rollup';

import { splitCss } from '../../src/index.js';

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

/**
 * Helper function for verifying `CSS` output.
 */
function verifyDividedStyleSheets(
	output: RollupOutput['output'],
	outputFileName: 'styles.css' | 'editor-styles.css' | 'content-styles.css',
	expectedResult: string
): void {
	const styles = output.find( output => output.fileName === outputFileName );

	expect( styles ).toBeDefined();
	expect( styles!.type ).toBe( 'asset' );
	expect( ( styles as OutputAsset )!.source ).toEqual( expectedResult );
}

test( 'Import of single `CSS` file', async () => {
	const output = await generateBundle( './tests/plugins/fixtures/splitCss/single-import/input.js' );
	const expectedResult = `
body {
color: '#000';
}
`;

	verifyDividedStyleSheets( output, 'styles.css', expectedResult );
	verifyDividedStyleSheets( output, 'editor-styles.css', expectedResult );
	verifyDividedStyleSheets( output, 'content-styles.css', '\n' );
} );

test( 'Import multiple `CSS` files', async () => {
	const output = await generateBundle( './tests/plugins/fixtures/splitCss/multiple-import/input.js' );

	const expectedResult = `
body {
color: '#000';
}
div {
display: grid;
}
`;

	verifyDividedStyleSheets( output, 'styles.css', expectedResult );
	verifyDividedStyleSheets( output, 'editor-styles.css', expectedResult );
	verifyDividedStyleSheets( output, 'content-styles.css', '\n' );
} );

test( 'Ignore `CSS` comments', async () => {
	const output = await generateBundle( './tests/plugins/fixtures/splitCss/ignore-comments/input.js' );
	const expectedResult = `
body {
color: '#000';
}
`;

	verifyDividedStyleSheets( output, 'styles.css', expectedResult );
	verifyDividedStyleSheets( output, 'editor-styles.css', expectedResult );
	verifyDividedStyleSheets( output, 'content-styles.css', '\n' );
} );

test( 'Combine `:root` declarations from multiple entries into one', async () => {
	const output = await generateBundle( './tests/plugins/fixtures/splitCss/combine-root-definitions/input.js' );

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

	verifyDividedStyleSheets( output, 'styles.css', expectedResult );
	verifyDividedStyleSheets( output, 'editor-styles.css', expectedResult );
	verifyDividedStyleSheets( output, 'content-styles.css', '\n' );
} );

test( 'Filter `:root` declaration based on `CSS` variables usage', async () => {
	const output = await generateBundle( './tests/plugins/fixtures/splitCss/filter-root-definitions/input.js' );

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

	verifyDividedStyleSheets( output, 'styles.css', expectedFullResult );
	verifyDividedStyleSheets( output, 'editor-styles.css', expectedEditorResult );
	verifyDividedStyleSheets( output, 'content-styles.css', expectedContentResult );
} );

test( 'Divide classes into files based on its purpose', async () => {
	const output = await generateBundle( './tests/plugins/fixtures/splitCss/divide-classes/input.js' );

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

	verifyDividedStyleSheets( output, 'styles.css', expectedFullResult );
	verifyDividedStyleSheets( output, 'editor-styles.css', expectedEditorResult );
	verifyDividedStyleSheets( output, 'content-styles.css', expectedContentResult );
} );
