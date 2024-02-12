/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { createFilter } from '@rollup/pluginutils';
import { parse, type Rule, type Declaration, type Stylesheet } from 'css';
import type { Plugin, GetModuleInfo, OutputBundle, OutputChunk, NormalizedOutputOptions } from 'rollup';

/**
 * Filter files only with `css` extension.
 */
const filter = createFilter( [ '**/*.css' ] );

export function cssStyles(): Plugin {
	const styles: Record<string, string> = {};

	return {
		name: 'ck5-styles',
		transform( code, id ) {
			if ( !filter( id ) ) {
				return;
			}

			styles[ id ] = code;

			return '';
		},
		// ////
		// `moduleParsed` is just for debugging.
		// ////
		moduleParsed( moduleInfo ) {
			console.log( `Module ${ moduleInfo.id } has been parsed.` );
		},
		async generateBundle( output: NormalizedOutputOptions, bundle: OutputBundle ) {
			const banner = await getBanner( output, bundle );
			const ids: Set<string> = new Set();

			// Determine import order of files
			for ( const file in bundle ) {
				const outputChunk = bundle[ file ]! as OutputChunk;
				const root = outputChunk.facadeModuleId!;
				const modules = getCSSModules( root, this.getModuleInfo );

				modules.forEach( id => ids.add( id as string ) );
			}

			const cssStylesheet = combineStylesheetsIntoOne( ids, styles );
			const parsedCss = parse( cssStylesheet );
			const { editorStylesContent, editingViewStylesContent, allStylesContent } = divideStylesheetDependingOnItsPurpose( parsedCss );

			// Emit styles to files
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
 * @param content is a CSS file content.
 * @param banner
 */
function unifyFileContentOutput( content: string | undefined, banner: string ): string {
	return `${ banner }\n${ content ? content : '' }\n`;
}

/**
 * Get `banner` from the `Rollup` configuration object.
 */
function getBanner( output: NormalizedOutputOptions, bundle: OutputBundle ): Promise<string> | string {
	const mainChunk = Object
		.values( bundle )
		.filter( ( output ): output is OutputChunk => output.type === 'chunk' )
		.find( chunk => chunk.isEntry )!;

	return output.banner( mainChunk );
}

/**
 * Get all CSS modules in the order that they were imported
 *
 * @param id
 * @param getModuleInfo
 * @param modules
 * @param visitedModules
 * @returns
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

	if ( !info ) {
		return modules;
	}

	info.importedIds.forEach( importId => {
		modules = new Set( [
			...Array.from( modules ),
			...Array.from( getCSSModules( importId, getModuleInfo, modules, visitedModules ) )
		] );
	} );

	return modules;
}

function combineStylesheetsIntoOne( ids: Set<string>, styles: Record<string, string> ): string {
	return Array.from( ids ).map( id => styles[ id ] ).join( '\n' );
}

/**
 * TODO
 * @returns
 */

function divideStylesheetDependingOnItsPurpose( parsedCss: Stylesheet ): Record< string, string> {
	const rules: Array<Rule> = parsedCss.stylesheet!.rules;
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

	if ( rootDefinitions.length ) {
		const dividedRootCssVariables = filterCssVariablesBasedOnUsage(
			rootDefinitions,
			{
				editorStylesContent,
				editingViewStylesContent
			} );

		const ruleDeclarationsWithSelector = wrapDefinitionsIntoSelector( ':root', rootDefinitions );

		editorStylesContent = dividedRootCssVariables.rootDeclarationForEditorStyles + editorStylesContent;
		editingViewStylesContent = dividedRootCssVariables.rootDeclarationForEditingViewStyles + editingViewStylesContent;
		allStylesContent = ruleDeclarationsWithSelector + allStylesContent;
	}

	return { editorStylesContent, editingViewStylesContent, allStylesContent };
}

/**
 * TODO
 * @returns
 */

function filterCssVariablesBasedOnUsage(
	rootDefinitions: string,
	dividedStylesheets: { [key: string]: string }
): Record<string, string> {
	const VARIABLE_DEFINITION_REGEXP = /--([\w-]+)/gm;

	if ( rootDefinitions.length === 0 ) {
		return {
			rootDeclarationForEditorStyles: '',
			rootDeclarationForEditingViewStyles: ''
		};
	}

	const variablesUsedInEditorStylesContent: Set<string> = new Set(
		dividedStylesheets.editorStylesContent!.match( VARIABLE_DEFINITION_REGEXP ) );
	const variablesUsedInEditingViewStylesContent: Set<string> = new Set(
		dividedStylesheets.editingViewStylesContent!.match( VARIABLE_DEFINITION_REGEXP ) );

	const rootDeclarationForEditorStyles = createRootDeclarationOfUsedVariables(
		rootDefinitions, variablesUsedInEditorStylesContent );
	const rootDeclarationForEditingViewStyles = createRootDeclarationOfUsedVariables(
		rootDefinitions, variablesUsedInEditingViewStylesContent );

	return {
		rootDeclarationForEditorStyles,
		rootDeclarationForEditingViewStyles
	};
}

/**
 * TODO
 * @param rootDeclaration
 * @param listUsedVariables
 * @returns
 */
function createRootDeclarationOfUsedVariables( rootDefinitions: string, listUsedVariables: Set<string> ): string {
	if ( rootDefinitions.length === 0 || listUsedVariables.size === 0 ) {
		return '';
	}

	const rootDeclarationWithSelector = wrapDefinitionsIntoSelector( ':root', rootDefinitions );
	const parsedRootDeclaration = parse( rootDeclarationWithSelector );
	const firstRule = parsedRootDeclaration.stylesheet!.rules[ 0 ] as Rule;
	const listOfDeclarations = firstRule.declarations as Array<Declaration>;

	const variablesDefinitions = listOfDeclarations.reduce( ( acc: string, currentDeclaration ) => {
		if ( !listUsedVariables.has( currentDeclaration.property! ) ) {
			return acc;
		}

		const property = `${ currentDeclaration.property }: ${ currentDeclaration.value };\n`;
		return acc + property;
	}, '' );

	return wrapDefinitionsIntoSelector( ':root', variablesDefinitions );
}

/**
 * TODO
 * @returns
 */
function divideRuleStylesBetweenStylesheets( rule: Rule ) {
	const selector = rule.selectors![ 0 ] || '';
	const rootDefinitions = [];

	let editorStyles = '';
	let editingViewStyles = '';
	let allStyles = '';

	const ruleDeclarations = getRuleDeclarations( rule.declarations! );
	const ruleDeclarationsWithSelector = wrapDefinitionsIntoSelector( selector, ruleDeclarations );
	const isRootSelector = selector.includes( ':root' );
	const isStartingWithContentSelector = selector.startsWith( '.ck-content' );

	// :root need to be in both places at the top
	if ( isRootSelector ) {
		rootDefinitions.push( ruleDeclarations );
	}

	// all styles
	if ( !isRootSelector ) {
		allStyles += ruleDeclarationsWithSelector;
	}

	if ( isStartingWithContentSelector ) {
		editingViewStyles += ruleDeclarationsWithSelector;
	} else {
		editorStyles += ruleDeclarationsWithSelector;
	}

	return {
		rootDefinitions,
		editorStyles,
		editingViewStyles,
		allStyles
	};
}

/**
 * TODO
 * @returns
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
 * TODO
 */
function wrapDefinitionsIntoSelector( selector: string, definitions: string ): string {
	return `${ selector } {\n${ definitions }}\n`;
}
