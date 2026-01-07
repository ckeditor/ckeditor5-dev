/**
 * @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { createFilter } from '@rollup/pluginutils';
import type { Plugin, OutputBundle, NormalizedOutputOptions, EmittedAsset } from 'rollup';
import type { Processor } from 'postcss';
import cssnano from 'cssnano';
import litePreset from 'cssnano-preset-lite';
import { PurgeCSS, type UserDefinedOptions } from 'purgecss';

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

const filter = createFilter( [ '**/*.css' ] );

const REGEX_FOR_REMOVING_VAR_WHITESPACE = /(?<=var\()\s+|\s+(?=\))/g;

const CONTENT_PURGE_OPTIONS = {
	content: [],
	safelist: { deep: [ /^ck-content/ ] },
	blocklist: [],
	fontFace: true,
	keyframes: true,
	variables: true
};

const EDITOR_PURGE_OPTIONS = {
	// Pseudo class`:where` is preserved only if the appropriate html structure matches the CSS selector.
	// It's a temporary solution to avoid removing selectors for Show blocks styles where `:where` occurs.
	// For example this structure will be omitted without the HTML content:
	//
	// ```css
	// .ck.ck-editor__editable.ck-editor__editable_inline.ck-show-blocks:not(.ck-widget)
	//     :where(figure.image, figure.table) figcaption { /* ... */ }
	// ```
	//
	// See: https://github.com/FullHuman/purgecss/issues/978
	content: [ {
		raw: `<html>
				<body>
					<div class="ck ck-editor__editable ck-editor__editable_inline ck-show-blocks">
						<figure class="image">
							<figcaption></figcaption>
						</figure>
					</div>
				</body>
			</html>`,
		extension: 'html'
	} ],
	safelist: {
		deep: [ /ck(?!-content)/, /^(?!.*ck)/ ]
	},
	// Option to preserve all CSS selectors that starts with `[dir=ltr/rtl]` attribute.
	dynamicAttributes: [ 'dir' ],
	// We must preserve all variables, keyframes and font faces in splitted stylesheets.
	// For example this is caused by case when some of them can be defined in the `ckeditor5`
	// but used in `ckeditor5-premium-features` stylesheet and vice versa.
	fontFace: false,
	keyframes: false,
	variables: false
};

export function splitCss( pluginOptions: RollupSplitCssOptions ): Plugin {
	const options: Required<RollupSplitCssOptions> = Object.assign( {
		minimize: false
	}, pluginOptions );

	return {
		name: 'cke5-split-css',

		transform( code: string, id: string ): string | undefined {
			if ( !filter( id ) ) {
				return;
			}

			return '';
		},

		async generateBundle( output: NormalizedOutputOptions, bundle: OutputBundle ): Promise<void> {
			// Get stylesheet from output bundle.
			const css = getCssStylesheet( bundle );

			// Some of CSS variables are used with spaces after/before brackets:
			// var( --var-name )
			// PurgeCss parser currently doesn't respect this syntax and removes this variable from definitions.
			// See: https://github.com/FullHuman/purgecss/issues/1264
			//
			// Till it's not solved we need to remove spaces from variables.
			const normalizedCss = css.replace( REGEX_FOR_REMOVING_VAR_WHITESPACE, '' );

			// Generate stylesheets for editor and content.
			const editorStyles = await getStyles( normalizedCss, EDITOR_PURGE_OPTIONS );
			const contentStyles = await getStyles( normalizedCss, CONTENT_PURGE_OPTIONS );

			// Emit those styles into files.
			this.emitFile( {
				type: 'asset',
				fileName: `${ options.baseFileName }-editor.css`,
				source: options.minimize ? await minifyContent( editorStyles ) : editorStyles
			} );

			this.emitFile( {
				type: 'asset',
				fileName: `${ options.baseFileName }-content.css`,
				source: options.minimize ? await minifyContent( contentStyles ) : contentStyles
			} );
		}
	};
}

/**
 * Returns CSS stylesheet from the output bundle.
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
 * Returns stylesheets content after removing comments and unused or empty CSS rules.
 */
async function getStyles( styles: string, purgeConfig: Omit<UserDefinedOptions, 'css'> ): Promise<string> {
	const result = await new PurgeCSS().purge( {
		...purgeConfig,
		css: [ { raw: styles } ]
	} );

	return cleanContent( result[ 0 ]!.css );
}

/**
 * Safe and minimum CSS stylesheet transformation with removing comments and empty rules.
 */
async function cleanContent( content: string ): Promise<string> {
	const normalizeContent = await cssnano( {
		preset: litePreset( {
			normalizeWhitespace: false
		} )
	} ).process( content!, { from: undefined } );

	return normalizeContent.css;
}

/**
 * Returns minified stylesheet content.
 */
async function minifyContent( stylesheetContent: string = '' ): Promise<string> {
	const minifier = cssnano() as Processor;
	const minifiedResult = await minifier.process( stylesheetContent, { from: undefined } );

	return minifiedResult.css;
}
