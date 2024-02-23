/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { createFilter } from '@rollup/pluginutils';
import { parse, type Rule, type Declaration, type Stylesheet } from 'css';
import type { Plugin, OutputBundle, NormalizedOutputOptions, EmittedAsset } from 'rollup';
import type { Processor } from 'postcss';
import cssnano from 'cssnano';

export interface RollupSplitCssOptions {

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

export function splitCss( pluginOptions?: RollupSplitCssOptions ): Plugin {
	const options: Required<RollupSplitCssOptions> = Object.assign( {
		minimize: false
	}, pluginOptions || {} );

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
			const cssStylesheet = getCssStylesheet( bundle );

			// Parse `CSS` string and returns an `AST` object.
			const parsedCss = parse( cssStylesheet );

			// Generate split stylesheets for editor, content, and one that contains them all.
			const { editorStylesContent, editingViewStylesContent } = getSplittedStyleSheets( parsedCss );

			// Emit those styles ito files.
			this.emitFile( {
				type: 'asset',
				fileName: options.minimize ? 'editor-styles.min.css' : 'editor-styles.css',
				source: await unifyFileContentOutput( editorStylesContent, options.minimize )
			} );
			this.emitFile( {
				type: 'asset',
				fileName: options.minimize ? 'content-styles.min.css' : 'content-styles.css',
				source: await unifyFileContentOutput( editingViewStylesContent, options.minimize )
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
function getSplittedStyleSheets( parsedCss: Stylesheet ): Record< string, string> {
	const rules: Array<Rule> = parsedCss.stylesheet!.rules;

	const { rootDefinitions, dividedStylesheets } = getDividedStyleSheetsDependingOnItsPurpose( rules );

	if ( rootDefinitions.length ) {
		const {
			rootDeclarationForEditorStyles,
			rootDeclarationForEditingViewStyles
		} = filterCssVariablesBasedOnUsage( rootDefinitions, dividedStylesheets );

		dividedStylesheets.editorStylesContent = rootDeclarationForEditorStyles + dividedStylesheets.editorStylesContent;
		dividedStylesheets.editingViewStylesContent = rootDeclarationForEditingViewStyles + dividedStylesheets.editingViewStylesContent;
	}

	return dividedStylesheets;
}

/**
 * Returns `:root` definitions and divided Stylesheets.
 * @param rules List of `CSS` StyleSheet rules.
 */
function getDividedStyleSheetsDependingOnItsPurpose( rules: Array<Rule> ) {
	const rootDefinitionsList: Array<string> = [];

	let editorStylesContent = '';
	let editingViewStylesContent = '';

	rules.forEach( rule => {
		if ( rule.type !== 'rule' ) {
			return;
		}
		const objectWithDividedStyles = divideRuleStylesBetweenStylesheets( rule );

		editorStylesContent += objectWithDividedStyles.editorStyles;
		editingViewStylesContent += objectWithDividedStyles.editingViewStyles;

		if ( objectWithDividedStyles.rootDefinitions.length ) {
			rootDefinitionsList.push( ...objectWithDividedStyles.rootDefinitions );
		}
	} );

	const rootDefinitions = rootDefinitionsList.join( '' );

	return {
		rootDefinitions,
		dividedStylesheets: {
			editorStylesContent,
			editingViewStylesContent
		}
	};
}

/**
 * Returns `:root` declarations for editor and content stylesheets.
 */
function filterCssVariablesBasedOnUsage(
	rootDefinitions: string,
	dividedStylesheets: { [key: string]: string }
): Record<string, string> {
	const VARIABLE_DEFINITION_REGEXP = /--([\w-]+)/gm;

	const variablesUsedInEditorStylesContent: Set<string> = new Set(
		dividedStylesheets.editorStylesContent!.match( VARIABLE_DEFINITION_REGEXP )
	);

	const variablesUsedInEditingViewStylesContent: Set<string> = new Set(
		dividedStylesheets.editingViewStylesContent!.match( VARIABLE_DEFINITION_REGEXP )
	);

	const rootDeclarationForEditorStyles = createRootDeclarationOfUsedVariables(
		rootDefinitions,
		variablesUsedInEditorStylesContent
	);

	const rootDeclarationForEditingViewStyles = createRootDeclarationOfUsedVariables(
		rootDefinitions,
		variablesUsedInEditingViewStylesContent
	);

	return {
		rootDeclarationForEditorStyles,
		rootDeclarationForEditingViewStyles
	};
}

/**
 * Returns filtered `:root` declaration based on list of used `CSS` variables in stylesheet content.
 * @param rootDeclaration
 * @param listOfUsedVariables
 */
function createRootDeclarationOfUsedVariables( rootDefinition: string, listOfUsedVariables: Set<string> ): string {
	if ( rootDefinition.length === 0 || listOfUsedVariables.size === 0 ) {
		return '';
	}

	const rootDeclarationWithSelector = wrapDefinitionsIntoSelector( ':root', rootDefinition );
	const parsedRootDeclaration = parse( rootDeclarationWithSelector );
	const firstRule = parsedRootDeclaration.stylesheet!.rules[ 0 ] as Rule;
	const listOfDeclarations = firstRule.declarations as Array<Declaration>;

	const variablesDefinitions = listOfDeclarations.reduce( ( acc: string, currentDeclaration ) => {
		if ( !listOfUsedVariables.has( currentDeclaration.property! ) ) {
			return acc;
		}

		const property = `${ currentDeclaration.property }: ${ currentDeclaration.value };\n`;
		return acc + property;
	}, '' );

	return wrapDefinitionsIntoSelector( ':root', variablesDefinitions );
}

/**
 * Decides to which stylesheet should passed `rule` be placed or it should be in `:root` definition.
 */
function divideRuleStylesBetweenStylesheets( rule: Rule ) {
	const selector = rule.selectors![ 0 ]!;
	const rootDefinitions = [];

	let editorStyles = '';
	let editingViewStyles = '';

	const ruleDeclarations = getRuleDeclarations( rule.declarations! );
	const ruleDeclarationsWithSelector = wrapDefinitionsIntoSelector( selector, ruleDeclarations );
	const isRootSelector = selector.includes( ':root' );
	const isStartingWithContentSelector = selector.startsWith( '.ck-content' );

	// `:root` selector need to be in each file at the top.
	if ( isRootSelector ) {
		rootDefinitions.push( ruleDeclarations );
	} else {
		// Dividing styles depending on purpose
		if ( isStartingWithContentSelector ) {
			editingViewStyles += ruleDeclarationsWithSelector;
		} else {
			editorStyles += ruleDeclarationsWithSelector;
		}
	}

	return {
		rootDefinitions,
		editorStyles,
		editingViewStyles
	};
}

/**
 * Returns all `rule` declarations as a concatenated string.
 */
function getRuleDeclarations( declarations: Array<Declaration> ): string {
	return declarations.reduce( ( acc, currentDeclaration ) => {
		if ( currentDeclaration.type !== 'declaration' ) {
			return acc;
		}

		const property = `${ currentDeclaration.property }: ${ currentDeclaration.value };\n`;
		return acc + property;
	}, '' );
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
 * Wraps `declarations` list into passed `selector`;
 */
function wrapDefinitionsIntoSelector( selector: string, definitions: string ): string {
	return `${ selector } {\n${ definitions }}\n`;
}
