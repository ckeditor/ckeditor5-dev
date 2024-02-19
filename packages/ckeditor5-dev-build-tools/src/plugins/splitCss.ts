/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { createFilter } from '@rollup/pluginutils';
import { parse, type Rule, type Declaration, type Stylesheet } from 'css';
import type { Plugin, GetModuleInfo, OutputBundle, OutputChunk, NormalizedOutputOptions } from 'rollup';
import MagicString, { Bundle } from 'magic-string';

import { getBanner } from './utils.js';

/**
 * Filter files only with `css` extension.
 */
const filter = createFilter( [ '**/*.css' ] );

export function splitCss(): Plugin {
	const stylesheetsFiles: Record<string, string> = {};

	return {
		name: 'cke5-styles',
		transform( code, id ) {
			if ( !filter( id ) ) {
				return;
			}

			stylesheetsFiles[ id ] = code;

			return '';
		},
		async generateBundle( output: NormalizedOutputOptions, bundle: OutputBundle ) {
			// Get license banner.
			const banner = await getBanner( output, bundle );

			// Import `CSS` files in same order as they were imported.
			const filesIdsInImportOrder = getFilesIdsInImportOrder( bundle, this.getModuleInfo );

			// Combine all preprocessed `CSS` files into one.
			const cssStylesheet = getAllStylesAsSingleStyleSheet( filesIdsInImportOrder, stylesheetsFiles );

			// Parse `CSS` string and returns an `AST` object.
			const parsedCss = parse( cssStylesheet );

			// Generate split stylesheets for editor, content, and one that contains them all.
			const { editorStylesContent, editingViewStylesContent, allStylesContent } = getSplittedStyleSheets( parsedCss );

			// Emit those styles ito files.
			this.emitFile( {
				type: 'asset',
				fileName: 'styles.css',
				source: unifyFileContentOutput( allStylesContent, banner )
			} );
			this.emitFile( {
				type: 'asset',
				fileName: 'editor-styles.css',
				source: unifyFileContentOutput( editorStylesContent, banner )
			} );
			this.emitFile( {
				type: 'asset',
				fileName: 'content-styles.css',
				source: unifyFileContentOutput( editingViewStylesContent, banner )
			} );
		}
	};
}

/**
 * Get files Ids in orders files in order as they were imported.
 * @param bundle provides the full list of files being written or generated along with their details.
 * @param getModuleInfo Function that returns additional information about the module in question.
 */
function getFilesIdsInImportOrder( bundle: OutputBundle, getModuleInfo: GetModuleInfo ) {
	const ids: Set<string> = new Set();

	for ( const file in bundle ) {
		const outputChunk = bundle[ file ]! as OutputChunk;
		const root = outputChunk.facadeModuleId!;
		const modules = getCSSModules( root, getModuleInfo );

		modules.forEach( id => ids.add( id as string ) );
	}

	return ids;
}

/**
 * Get all CSS modules in the order that they were imported
 *
 * @param id module Id.
 * @param getModuleInfo Function that returns additional information about the module in question.
 * @param modules Set of modules.
 * @param visitedModules Set of visited modules.
 */
function getCSSModules( id: string, getModuleInfo: GetModuleInfo, modules = new Set(), visitedModules = new Set() ): Set<unknown> {
	if ( modules.has( id ) || visitedModules.has( id ) ) {
		return new Set();
	}

	if ( filter( id ) ) {
		modules.add( id );
	}

	// Prevent infinite recursion with circular dependencies
	visitedModules.add( id );

	// Recursively retrieve all of imported CSS modules
	const info = getModuleInfo( id );

	if ( info ) {
		info.importedIds.forEach( importId => {
			modules = new Set( [
				...Array.from( modules ),
				...Array.from( getCSSModules( importId, getModuleInfo, modules, visitedModules ) )
			] );
		} );
	}

	return modules;
}

function getAllStylesAsSingleStyleSheet( ids: Set<string>, stylesheetsFiles: Record<string, string> ): string {
	return Array.from( ids ).map( id => stylesheetsFiles[ id ] ).join( '\n' );
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

		const ruleDeclarationsWithSelector = wrapDefinitionsIntoSelector( ':root', rootDefinitions );

		dividedStylesheets.editorStylesContent = rootDeclarationForEditorStyles + dividedStylesheets.editorStylesContent;
		dividedStylesheets.editingViewStylesContent = rootDeclarationForEditingViewStyles + dividedStylesheets.editingViewStylesContent;
		dividedStylesheets.allStylesContent = ruleDeclarationsWithSelector + dividedStylesheets.allStylesContent;
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
	let allStylesContent = '';

	rules.forEach( rule => {
		if ( rule.type !== 'rule' ) {
			return;
		}
		const objectWithDividedStyles = divideRuleStylesBetweenStylesheets( rule );

		editorStylesContent += objectWithDividedStyles.editorStyles;
		editingViewStylesContent += objectWithDividedStyles.editingViewStyles;
		allStylesContent += objectWithDividedStyles.allStyles;

		if ( objectWithDividedStyles.rootDefinitions.length ) {
			rootDefinitionsList.push( ...objectWithDividedStyles.rootDefinitions );
		}
	} );

	const rootDefinitions = rootDefinitionsList.join( '' );

	return {
		rootDefinitions,
		dividedStylesheets: {
			editorStylesContent,
			editingViewStylesContent,
			allStylesContent
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
	let allStyles = '';

	const ruleDeclarations = getRuleDeclarations( rule.declarations! );
	const ruleDeclarationsWithSelector = wrapDefinitionsIntoSelector( selector, ruleDeclarations );
	const isRootSelector = selector.includes( ':root' );
	const isStartingWithContentSelector = selector.startsWith( '.ck-content' );

	// `:root` selector need to be in each file at the top.
	if ( isRootSelector ) {
		rootDefinitions.push( ruleDeclarations );
	}

	// Dividing styles depending on purpose
	if ( !isRootSelector ) {
		allStyles += ruleDeclarationsWithSelector;

		if ( isStartingWithContentSelector ) {
			editingViewStyles += ruleDeclarationsWithSelector;
		} else {
			editorStyles += ruleDeclarationsWithSelector;
		}
	}

	return {
		rootDefinitions,
		editorStyles,
		editingViewStyles,
		allStyles
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
 * @param banner license header.
 */
function unifyFileContentOutput( content: string | undefined, banner: string ): string {
	const bundle = new Bundle();

	bundle.addSource( {
		content: new MagicString( content ? content : '' )
	} );

	bundle.prepend( `${ banner }\n` );

	return bundle.toString();
}

/**
 * Wraps `declarations` list into passed `selector`;
 */
function wrapDefinitionsIntoSelector( selector: string, definitions: string ): string {
	return `${ selector } {\n${ definitions }}\n`;
}
