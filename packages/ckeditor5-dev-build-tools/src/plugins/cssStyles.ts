/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { createFilter } from '@rollup/pluginutils'
import { parse, type Rule, type Declaration, type StyleRules, type Stylesheet } from 'css';
import type { Plugin, GetModuleInfo, OutputBundle } from 'rollup';

export function cssStyles(): Plugin {
	const styles: Record<string, string> = {};

	return {
		name: 'ck5-styles',
		transform( code, id ) {
			if ( !filter( id ) ) {
				return
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
		generateBundle( opts, bundle: OutputBundle ) {
			const ids: Set<string> = new Set();

			// Determine import order of files
			for ( const file in bundle ) {
				const root = bundle[ file ]!.facadeModuleId;
				const modules = getCSSModules( root, this.getModuleInfo );

				modules.forEach( id => ids.add( id as string ) );
			}

			const cssStylesheet = combineStylesheetsIntoOne( ids, styles );
			const parsedCss = parse( cssStylesheet );
			const { editorStylesContent, editingViewStylesContent, allStylesContent } = divideStylesheetDependingOnItsPurpose( parsedCss );

			// Emit styles to files
			this.emitFile( { type: 'asset', fileName: 'styles.css', source: allStylesContent + '\n' } );
			this.emitFile( { type: 'asset', fileName: 'editor-styles.css', source: editorStylesContent + '\n' } );
			this.emitFile( { type: 'asset', fileName: 'content-styles.css', source: editingViewStylesContent + '\n' } );
		}
	}
}

/**
 * Filter files only with `css` extension.
 */
const filter = createFilter( ['**/*.css'] );

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

function combineStylesheetsIntoOne( ids: Set<string>, styles:Record<string, string> ): string {
	return Array.from( ids ).map( id => styles[ id ] ).join( '\n' );
}

/**
 * TODO
 * @returns
 */

function divideStylesheetDependingOnItsPurpose( parsedCss: Stylesheet ): Record< string, string> {
	const rules = parsedCss.stylesheet!.rules;

	let rootDefinitionsList:Array<string> = [];
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

	const rootDefinitionsText = rootDefinitionsList.join( '' );

	if ( rootDefinitionsText.length ) {

		const dividedRootCssVariables = filterCssVariablesBasedOnUsage(
			rootDefinitionsText,
			{
				editorStylesContent,
				editingViewStylesContent
			} );

		const ruleDeclarationsWithSelector = wrapDefinitionsIntoSelector( ':root', rootDefinitionsText );

		editorStylesContent = dividedRootCssVariables.rootDeclarationForEditorStyles + editorStylesContent;
		editingViewStylesContent = dividedRootCssVariables.rootDeclarationForEditingViewStyles + editingViewStylesContent;
		allStylesContent = ruleDeclarationsWithSelector + allStylesContent;
	}

	return { editorStylesContent, editingViewStylesContent, allStylesContent }
}

/**
 * TODO
 * @returns
 */

function filterCssVariablesBasedOnUsage( rootDefinitionsText: string, dividedStylesheets: { [key: string]: string; } ): Record<string, string> {
	const VARIABLE_DEFINITION_REGEXP = /--([\w-]+)/gm;

	if ( rootDefinitionsText.length === 0 ) {
		return {
			rootDeclarationForEditorStyles: '',
			rootDeclarationForEditingViewStyles: ''
		}
	}

	const variablesUsedInEditorStylesContent: Set<string> = new Set( dividedStylesheets.editorStylesContent!.match( VARIABLE_DEFINITION_REGEXP ) );
	const variablesUsedInEditingViewStylesContent: Set<string> = new Set( dividedStylesheets.editingViewStylesContent!.match( VARIABLE_DEFINITION_REGEXP ) );

	const rootDeclarationWithSelector = wrapDefinitionsIntoSelector( ':root', rootDefinitionsText );

	const rootDeclarationForEditorStyles = createRootDeclarationOfUsedVariables( rootDeclarationWithSelector, variablesUsedInEditorStylesContent );
	const rootDeclarationForEditingViewStyles = createRootDeclarationOfUsedVariables( rootDeclarationWithSelector, variablesUsedInEditingViewStylesContent );

	return {
		rootDeclarationForEditorStyles,
		rootDeclarationForEditingViewStyles
	}
}

/**
 * TODO
 * @param rootDeclaration
 * @param listUsedVariables
 * @returns
 */
function createRootDeclarationOfUsedVariables( rootDeclaration: string, listUsedVariables: Set<string> ): string {
	const parsedRootDeclaration = parse( rootDeclaration );
	const firstRule = parsedRootDeclaration.stylesheet!.rules[ 0 ] as Rule;
	const listOfDeclarations = firstRule.declarations as Array<Declaration>;

	const variablesDefinitions = listOfDeclarations.reduce( ( acc: string, currentDeclaration ) => {
		if ( !listUsedVariables.has( currentDeclaration.property! ) ) {
			return acc;
		}

		const property = `${ currentDeclaration.property }: ${ currentDeclaration.value };\n`
		return acc + property;
	}, '' );

	if ( variablesDefinitions.length === 0 ) {
		return '';
	}

	const rootDeclarationWithSelector = wrapDefinitionsIntoSelector( ':root', variablesDefinitions );

	return rootDeclarationWithSelector;
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

		const property = `${ currentDeclaration.property }: ${ currentDeclaration.value };\n`
		return acc + property;
	}, '' );
}

/**
 * TODO
 * @returns
 */
function divideRuleStylesBetweenStylesheets( rule: Rule ) {
	const selector = rule.selectors![ 0 ] || '';

	let rootDefinitions = [];
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
		allStyles += ruleDeclarationsWithSelector
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
 */
function wrapDefinitionsIntoSelector( selector: string, definitions: string ): string {
	return `${ selector } {\n${ definitions }}\n`;
}
