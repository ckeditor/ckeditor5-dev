/**
 * @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { Buffer } from 'node:buffer';
import { createFilter } from '@rollup/pluginutils';
import type { Plugin, OutputBundle, NormalizedOutputOptions, EmittedAsset } from 'rollup';
import cssnano from 'cssnano';
import litePreset from 'cssnano-preset-lite';
import { transform, type Selector, type SelectorComponent } from 'lightningcss';
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

type PurgeCSSOptions = Omit<UserDefinedOptions, 'css'>;

type PurgeCSSContent = NonNullable<UserDefinedOptions[ 'content' ]>[ number ];

const filter = createFilter( [ '**/*.css' ] );

const REGEX_FOR_REMOVING_VAR_WHITESPACE = /(?<=var\()\s+|\s+(?=\))/g;

const CONTENT_PURGE_OPTIONS: PurgeCSSOptions = {
	content: [],
	safelist: { deep: [ /^ck-content/ ] },
	blocklist: [],
	fontFace: true,
	keyframes: true,
	variables: true
};

const EDITOR_PURGE_OPTIONS: PurgeCSSOptions = {
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

const FUNCTIONAL_SELECTOR_KINDS = new Set( [ 'is', 'where', 'any' ] );

const SYNTHETIC_TOKEN_PATTERN = /^[a-z0-9_-]+$/i;

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
			const contentStyles = await getStyles( normalizedCss, {
				...CONTENT_PURGE_OPTIONS,
				content: [
					...CONTENT_PURGE_OPTIONS.content,
					...createSyntheticContentSelectors( normalizedCss, 'ck-content' )
				]
			} );

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
async function getStyles( styles: string, purgeConfig: PurgeCSSOptions ): Promise<string> {
	const result = await new PurgeCSS().purge( {
		...purgeConfig,
		css: [ { raw: styles } ]
	} );

	return cleanContent( result[ 0 ]!.css );
}

/**
 * Creates synthetic content tokens that help PurgeCSS match selectors emitted with functional pseudo-classes like `:is()`.
 */
function createSyntheticContentSelectors( styles: string, className: string ): Array<PurgeCSSContent> {
	const syntheticContentSnippets = new Set<string>();

	transform( {
		filename: 'split-css-purge-workaround.css',
		code: Buffer.from( styles ),
		visitor: {
			Rule: rule => {
				if ( rule.type !== 'style' ) {
					return;
				}

				collectSyntheticContentSelectorTokens( rule.value.selectors, className, syntheticContentSnippets );
			}
		}
	} );

	return Array.from( syntheticContentSnippets, raw => ( {
		raw,
		extension: 'html'
	} ) );
}

/**
 * Collects selector tokens matching selectors that PurgeCSS would otherwise miss.
 */
function collectSyntheticContentSelectorTokens(
	selectors: Array<Selector>,
	className: string,
	syntheticContentSnippets: Set<string>
): void {
	for ( const selector of selectors ) {
		if ( !hasFunctionalPseudoSelector( selector ) ) {
			continue;
		}

		for ( const expandedSelector of expandFunctionalSelectors( selector ) ) {
			if ( !hasDirectClassComponent( expandedSelector, className ) ) {
				continue;
			}

			const selectorTokens = new Set<string>();

			collectSelectorTokens( expandedSelector, selectorTokens );

			if ( selectorTokens.size ) {
				syntheticContentSnippets.add( Array.from( selectorTokens ).join( ' ' ) );
			}
		}
	}
}

/**
 * Collects extractor-friendly tokens from selector components.
 */
function collectSelectorTokens( selector: Selector, selectorTokens: Set<string> ): void {
	for ( const component of selector ) {
		switch ( component.type ) {
			case 'type':
				addSyntheticToken( selectorTokens, component.name );
				break;
			case 'class':
				addSyntheticToken( selectorTokens, component.name );
				break;
			case 'id':
				addSyntheticToken( selectorTokens, component.name );
				break;
			case 'attribute':
				addSyntheticToken( selectorTokens, component.name );

				if ( component.operation?.value ) {
					addSyntheticToken( selectorTokens, component.operation.value );
				}
				break;
			case 'pseudo-class': {
				if ( component.kind === 'dir' ) {
					addSyntheticToken( selectorTokens, component.direction );
				}

				if ( component.kind === 'lang' ) {
					for ( const language of component.languages ) {
						addSyntheticToken( selectorTokens, language );
					}
				}
				break;
			}
			default:
				break;
		}
	}
}

/**
 * Adds a token that can be recognized by PurgeCSS default extractors.
 */
function addSyntheticToken( selectorTokens: Set<string>, token: string ): void {
	if ( SYNTHETIC_TOKEN_PATTERN.test( token ) ) {
		selectorTokens.add( token );
	}
}

/**
 * Returns whether the selector contains a functional pseudo-class that PurgeCSS may not match reliably.
 */
function hasFunctionalPseudoSelector( selector: Selector ): boolean {
	for ( const component of selector ) {
		if ( component.type !== 'pseudo-class' ) {
			continue;
		}

		if ( FUNCTIONAL_SELECTOR_KINDS.has( component.kind ) ) {
			return true;
		}

		const nestedSelectors = getNestedSelectors( component );

		if ( nestedSelectors?.some( nestedSelector => hasFunctionalPseudoSelector( nestedSelector ) ) ) {
			return true;
		}
	}

	return false;
}

/**
 * Expands `:is()`, `:where()` and `:any()` into plain selector branches.
 */
function expandFunctionalSelectors( selector: Selector ): Array<Selector> {
	let selectors: Array<Selector> = [ [] ];

	for ( const component of selector ) {
		const expandedComponents = expandFunctionalSelectorComponent( component );

		selectors = selectors.flatMap( currentSelector => {
			return expandedComponents.map( expandedComponent => [ ...currentSelector, ...expandedComponent ] );
		} );
	}

	return selectors;
}

/**
 * Expands a selector component that can contain selector lists.
 */
function expandFunctionalSelectorComponent( component: SelectorComponent ): Array<Array<SelectorComponent>> {
	if ( component.type !== 'pseudo-class' || !FUNCTIONAL_SELECTOR_KINDS.has( component.kind ) ) {
		return [ [ component ] ];
	}

	return getNestedSelectors( component )!.flatMap( selector => expandFunctionalSelectors( selector ) );
}

/**
 * Returns nested selectors from pseudo-classes that accept selector lists.
 */
function getNestedSelectors( component: SelectorComponent ): Array<Selector> | null {
	if ( component.type !== 'pseudo-class' ) {
		return null;
	}

	if (
		component.kind === 'is' ||
		component.kind === 'where' ||
		component.kind === 'any' ||
		component.kind === 'not' ||
		component.kind === 'has'
	) {
		return component.selectors;
	}

	return null;
}

/**
 * Returns whether the selector directly contains the provided class component.
 */
function hasDirectClassComponent( selector: Selector, className: string ): boolean {
	return selector.some( component => component.type === 'class' && component.name === className );
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
	const minifier = cssnano();
	const minifiedResult = await minifier.process( stylesheetContent, { from: undefined } );

	return minifiedResult.css;
}
