/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { createFilter } from '@rollup/pluginutils';
import type { Plugin, OutputBundle, NormalizedOutputOptions, EmittedAsset } from 'rollup';
import type { Processor } from 'postcss';
import cssnano from 'cssnano';
import litePreset from 'cssnano-preset-lite';
import { PurgeCSS } from 'purgecss';

export interface RollupSplitCssOptions {

	/**
	 * Base name of the output css file. This name will be prefixed with `content-` and `editor-`.
	 */
	baseFileName: string;

	/**
	 * Flag to choose if the output should be minimized or not.
	 *
	 * @default false
	 */
	minimize?: boolean;
}

/**
 * Filter files only with `css` extension.
 */
const filter = createFilter( [ '**/*.css' ] );

const commonPurgeCssOptions = {
	fontFace: true,
	keyframes: true,
	variables: true
};

const purgeCssOptionsForContent = {
	...commonPurgeCssOptions,
	content: [],
	safelist: { deep: [ /^ck-content/ ] },
	blocklist: []
};

const purgeCssOptionsForEditor = {
	...commonPurgeCssOptions,
	// Pseudo class`:where` is preserved only if the appropriate html structure matches the CSS selector.
	// It's a temporary solution to avoid removing selectors for Show blocks styles where `:where` occurs.
	// See: https://github.com/FullHuman/purgecss/issues/978
	content: [ {
		raw: '<html><body><div class="ck ck-editor__editable ck-editor__editable_inline ck-show-blocks">' +
			'<figure class="image"><figcaption></figcaption></figure></div></body></html>',
		extension: 'html'
	} ],
	safelist: {
		deep: [ /ck(?!-content)/, /^(?!.*ck)/ ]
	},
	// Option to preserve all CSS selectors that starts with `[dir=ltr/rtl]` attribute.
	dynamicAttributes: [ 'dir' ]
};

export function splitCss( pluginOptions: RollupSplitCssOptions ): Plugin {
	const options: Required<RollupSplitCssOptions> = Object.assign( {
		minimize: false
	}, pluginOptions );

	return {
		name: 'cke5-split-css',

		transform( code, id ) {
			if ( !filter( id ) ) {
				return;
			}

			return '';
		},

		async generateBundle( output: NormalizedOutputOptions, bundle: OutputBundle ) {
			// Get stylesheet from output bundle.
			const cssStylesheetFromBundle = getCssStylesheet( bundle );

			// Some of CSS variables are used with spaces after/before brackets:
			// var( --var-name )
			// PurgeCss parser currently doesn't respect this syntax and removes this variable from definitions.
			// See: https://github.com/FullHuman/purgecss/issues/1264
			//
			// Till it's not solved we need to remove spaces from variables.
			const cssStylesheet = removeWhitespaceFromVars( cssStylesheetFromBundle! );

			// Generate split stylesheets for editor, content, and one that contains them all.
			const { editorStylesContent, editingViewStylesContent } = await getSplittedStyleSheets( cssStylesheet, options.baseFileName );
			const contentStylesheet = await normalizeStylesheet( editorStylesContent! );
			const editingViewStylesheet = await normalizeStylesheet( editingViewStylesContent! );

			// Emit those styles into files.
			this.emitFile( {
				type: 'asset',
				fileName: `${ options.baseFileName }-editor.css`,
				source: await unifyFileContentOutput( editingViewStylesheet, options.minimize )
			} );

			this.emitFile( {
				type: 'asset',
				fileName: `${ options.baseFileName }-content.css`,
				source: await unifyFileContentOutput( contentStylesheet, options.minimize )
			} );
		}
	};
}

/**
 * @param bundle provides the full list of files being written or generated along with their details.
 */
function getCssStylesheet( bundle: OutputBundle ) {
	const cssStylesheetChunk = Object
		.values( bundle )
		.find( chunk => filter( chunk.fileName ) );

	if ( !cssStylesheetChunk ) {
		return '';
	}

	return ( cssStylesheetChunk as EmittedAsset ).source!.toString();
}

/**
 * Returns split stylesheets for editor, content, and one that contains all styles.
 */
async function getSplittedStyleSheets( cssStylesheet: string, filename: string ): Promise<Record<string, string>> {
	const purgeCSSResultForContent = await new PurgeCSS().purge( {
		...purgeCssOptionsForContent,
		css: [
			{
				raw: cssStylesheet
			},
			`${ filename }-content.css`
		]
	} );

	const purgeCSSResultForEditingView = await new PurgeCSS().purge( {
		...purgeCssOptionsForEditor,
		css: [
			{
				raw: cssStylesheet
			},
			`${ filename }-editor.css`
		]
	} );

	return {
		editorStylesContent: purgeCSSResultForContent[ 0 ]!.css,
		editingViewStylesContent: purgeCSSResultForEditingView[ 0 ]!.css
	};
}

/**
 * @param content is a `CSS` content.
 * @param minimize When set to `true` it will minify the content.
 */
async function unifyFileContentOutput( content: string = '', minimize: boolean ): Promise<string> {
	if ( !minimize ) {
		return content;
	}

	const minifier = cssnano() as Processor;
	const minifiedResult = await minifier.process( content, { from: undefined } );

	return minifiedResult.css;
}

/**
 * Returns normalized stylesheet content.
 */
async function normalizeStylesheet( content: string ): Promise<string> {
	const normalizeContent = await cssnano( { preset: litePreset( {
		normalizeWhitespace: false
	} ) } ).process( content!, { from: undefined } );

	return normalizeContent.css;
}

/*
 * Removes whitespace between brackets from CSS variables.
 */
function removeWhitespaceFromVars( content: string ): string {
	const regex = /(?<=var\()\s+|\s+(?=\))/g;

	return content.replace( regex, '' );
}
