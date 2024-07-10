/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { createFilter } from '@rollup/pluginutils';
import { parse, type Rule, type Declaration, type Stylesheet } from 'css';
import type { Plugin, OutputBundle, NormalizedOutputOptions, EmittedAsset } from 'rollup';
import type { Processor } from 'postcss';
import cssnano from 'cssnano';
import { removeNewline } from '../utils';

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

/**
 * Regular expression to match CSS variables.
 */
const VARIABLE_DEFINITION_REGEXP = /--([\w-]+)/gm;

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
			const cssStylesheet = getCssStylesheet( bundle );

			// Parse `CSS` string and returns an `AST` object.
			const parsedCss = parse( cssStylesheet );

			// Generate split stylesheets for editor, content, and one that contains them all.
			const { editorStylesContent, editingViewStylesContent } = getSplittedStyleSheets( parsedCss );

			// Emit those styles ito files.
			this.emitFile( {
				type: 'asset',
				fileName: `${ options.baseFileName }-editor.css`,
				source: await unifyFileContentOutput( editorStylesContent, options.minimize )
			} );

			this.emitFile( {
				type: 'asset',
				fileName: `${ options.baseFileName }-content.css`,
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
 * Extracts all `CSS` variables from passed `styles`.
 */
function getCssVariables(
	styles: string
): Set<string> {
	return new Set( styles.match( VARIABLE_DEFINITION_REGEXP ) );
}

/**
 * Recursively gets all used CSS variables from the `allDeclarations` list.
 * This is required, because CSS variables can contain other CSS variables.
 */
function recursivelyGetCssVariables(
	variables: Set<string>,
	allDeclarations: Array<Declaration>
): Array<Declaration> {
	return allDeclarations
		// Filter out declarations of unused CSS variables.
		.filter( ( declaration: Declaration ) => variables.has( declaration.property! ) )
		// Because CSS variables can themselves contain other CSS variables, we need to recursively get all of them.
		.reduce( ( acc: Array<Declaration>, declaration: Declaration ) => {
			const nestedVariables = recursivelyGetCssVariables(
				getCssVariables( declaration.value! ),
				allDeclarations
			);

			acc.push( declaration, ...nestedVariables );

			return acc;
		}, [] )
		// Flatten the array of arrays.
		.flat( 20 ); // `20` instead of `Infinity` so that TypeScript doesn't complain.
}

/**
 * Returns `:root` declarations for editor and content stylesheets.
 */
function filterCssVariablesBasedOnUsage(
	rootDefinitions: string,
	dividedStylesheets: { [key: string]: string }
): Record<string, string> {
	const rootDeclarationForEditorStyles = createRootDeclarationOfUsedVariables(
		rootDefinitions,
		getCssVariables( dividedStylesheets.editorStylesContent! )
	);

	const rootDeclarationForEditingViewStyles = createRootDeclarationOfUsedVariables(
		rootDefinitions,
		getCssVariables( dividedStylesheets.editingViewStylesContent! )
	);

	return {
		rootDeclarationForEditorStyles,
		rootDeclarationForEditingViewStyles
	};
}

/**
 * Returns filtered `:root` declaration based on list of used `CSS` variables in stylesheet content.
 */
function createRootDeclarationOfUsedVariables(
	rootDefinition: string,
	usedVariables: Set<string>
): string {
	if ( rootDefinition.length === 0 || usedVariables.size === 0 ) {
		return '';
	}

	const rootDeclarationWithSelector = wrapDefinitionsIntoSelector( ':root', rootDefinition );
	const parsedRootDeclaration = parse( rootDeclarationWithSelector );
	const firstRule = parsedRootDeclaration.stylesheet!.rules[ 0 ] as Rule;
	const allDeclarations = firstRule.declarations as Array<Declaration>;

	const variables: string = recursivelyGetCssVariables( usedVariables, allDeclarations )
		// Convert declarations to CSS string.
		.map( ( declaration: Declaration ) => `${ declaration.property }: ${ declaration.value };` )
		// Remove duplicates.
		.filter( ( item, pos, self ) => self.indexOf( item ) == pos )
		// Join declarations into a single string.
		.join( '\n' );

	return wrapDefinitionsIntoSelector( ':root', variables );
}

/**
 * Decides to which stylesheet should passed `rule` be placed or it should be in `:root` definition.
 */
function divideRuleStylesBetweenStylesheets( rule: Rule ) {
	const selector = rule.selectors!.join( ',\n' );
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
	// When definition contains `data:image` it should be in one line following the specification.
	// Currently used tool responsible for parsing definitions tries to split each definition into new line.
	// When `data:image` contains `SVG` with style attribute which contains CSS definitions it splits it into new lines,
	// which breaks the CSS.
	if ( definitions.includes( 'data:image' ) ) {
		definitions = removeNewline( definitions );
	}

	return `${ selector } {\n${ definitions }\n}\n`;
}
