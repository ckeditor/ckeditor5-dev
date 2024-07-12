/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { createFilter } from '@rollup/pluginutils';
import {
	parse,
	type Rule,
	type Declaration,
	type Stylesheet,
	type KeyFrames,
	type KeyFrame,
	type Media
} from 'css';
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

/**
 * CSS rule type which are supported by this plugin.
 */
const SUPPORTED_RULE_TYPES = [ 'rule', 'media', 'keyframes' ];

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
	let keyframesRules = '';

	rules.forEach( rule => {
		if ( !SUPPORTED_RULE_TYPES.includes( rule.type! ) ) {
			return;
		}
		const objectWithDividedStyles = divideRuleStylesBetweenStylesheets( rule );

		editorStylesContent += objectWithDividedStyles.editorStyles;
		editingViewStylesContent += objectWithDividedStyles.editingViewStyles;
		keyframesRules += objectWithDividedStyles.keyframesRules;

		if ( objectWithDividedStyles.rootDefinitions.length ) {
			rootDefinitionsList.push( ...objectWithDividedStyles.rootDefinitions );
		}
	} );

	const rootDefinitions = rootDefinitionsList.join( '' );

	// Parse all gathered `@keyframe` rules as a full CSS AST tree.
	const parsedKeyframesRules = parse( keyframesRules );
	// Get all `@keyframe` rules.
	const allKeyframesRules: Array<KeyFrames> = parsedKeyframesRules.stylesheet!.rules;
	// Get all rules containing `animation` or `animation-name` properties.
	const allRulesContainingAnimations = getAllRulesContainingAnimations( rules );
	// Gel all `@keyframe` styles divided between editor and content stylesheets.
	const { editorStyles, editingViewStyles } = getSplittedStyleKeyframes( allKeyframesRules, allRulesContainingAnimations );

	editorStylesContent += editorStyles;
	editingViewStylesContent += editingViewStyles;

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
 * It also decides where to place the `@media` queries and animation `@keyframes`.
 */
function divideRuleStylesBetweenStylesheets( rule: Rule | Media | KeyFrames ) {
	if ( rule.type === 'rule' ) {
		return divideStylesBetweenStylesheetsByRule( rule as Rule );
	} else if ( rule.type === 'media' ) {
		return divideStylesBetweenStylesheetsByMedia( rule as Media );
	} else if ( rule.type === 'keyframes' ) {
		return divideStylesBetweenStylesheetsByKeyframes( rule as KeyFrames );
	} else {
		return {
			rootDefinitions: [],
			editorStyles: '',
			editingViewStyles: '',
			keyframesRules: ''
		};
	}
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

/**
 * Returns all rules containing property `animation` or `animation-name`.
 */
function getAllRulesContainingAnimations( rules: Array<Rule | Media> ): Array<Rule> {
	const regularRules = getAllRulesContainingAnimationsFromRules( rules );
	const mediaRules = getAllRulesContainingAnimationsFromMediaRules( rules );

	return [ ...regularRules, ...mediaRules ];
}

/**
 * Returns all rules containing property `animation` or `animation-name` from regular rules.
 */
function getAllRulesContainingAnimationsFromRules( rules: Array<Rule | Media> ): Array<Rule> {
	return rules.filter( rule => {
		return getAnimationDeclarations( rule );
	} );
}

/**
 * Returns all rules containing property `animation` or `animation-name` from `@media` rules.
 */
function getAllRulesContainingAnimationsFromMediaRules( rules: Array<Rule | Media> ): Array<Rule> {
	let mediaRules: Array<Rule> = [];

	rules.forEach( rule => {
		if ( rule.type === 'media' ) {
			const rulesFromMedia = ( rule as Media ).rules!;

			mediaRules = getAllRulesContainingAnimationsFromRules( rulesFromMedia );
		}
	} );

	return mediaRules;
}

/**
 * Returns `true` if passed `rule` contains `animation` or `animation-name` property.
 */
function getAnimationDeclarations( rule: Rule ) {
	// Filtering potential comments.
	if ( rule.type !== 'rule' ) {
		return false;
	}

	const declarations = rule.declarations as Array<Declaration>;

	return declarations.some(
		declaration => {
			// Filtering potential comments.
			if ( declaration.type !== 'declaration' ) {
				return false;
			}

			return declaration.property!.includes( 'animation' ) || declaration.property!.includes( 'animation-name' );
		}
	);
}

/**
 * @param keyframesRules List of `@keyframes` rules gathered from whole stylesheet.
 * @param allRulesContainingAnimations List of all rules containing `animation` or `animation-name` gathered from whole stylesheet.
 * @returns divided CSS `@keyframes` between editor and content stylesheets.
 */
function getSplittedStyleKeyframes( keyframesRules: Array<KeyFrames>, allRulesContainingAnimations: Array<Rule> ) {
	let editorStyles = '';
	let editingViewStyles = '';

	keyframesRules.forEach( keyframeRule => {
		const animationName = keyframeRule.name;

		allRulesContainingAnimations.forEach( rule => {
			const declarations = rule.declarations as Array<Declaration>;
			const selectorStartsWithCkContent = isSelectorStartsWithCkContent( rule );
			const selectorStartsWithoutCkContent = isSelectorStartsWithoutCkContent( rule );

			declarations.forEach( declaration => {
				// Filtering potential comments.
				if ( declaration.type !== 'declaration' ) {
					return;
				}

				if ( declaration.value!.includes( animationName! ) ) {
					const selector = `@keyframes ${ animationName }`;
					const keyframeEntries = getKeyframesEntries( keyframeRule );
					const ruleDeclarationsWithSelector = wrapDefinitionsIntoSelector( selector, keyframeEntries );

					if ( selectorStartsWithCkContent ) {
						editingViewStyles += ruleDeclarationsWithSelector;
					}

					if ( selectorStartsWithoutCkContent ) {
						editorStyles += ruleDeclarationsWithSelector;
					}
				}
			} );
		} );
	} );

	return {
		editorStyles,
		editingViewStyles
	};
}

/**
 * Divides styles between editor and content stylesheets by CSS rule.
 */
function divideStylesBetweenStylesheetsByRule( rule: Rule ) {
	const rootDefinitions = [];
	const selector = rule.selectors!.join( ',\n' );
	const ruleDeclarations = getRuleDeclarations( rule.declarations! );
	const isRootSelector = selector.includes( ':root' );
	// Filtering selectors that started with `.ck-content` prefix and concatenate it into string separated by a comma.
	const selectorWithCkContent = rule.selectors!.filter( selector => selector.startsWith( '.ck-content' ) ).join( ',\n' );
	// Filtering selectors that aren't started with `.ck-content` prefix and concatenate it into string separated by a comma.
	const selectorWithoutCkContent = rule.selectors!.filter( selector => !selector.startsWith( '.ck-content' ) ).join( ',\n' );

	let editorStyles = '';
	let editingViewStyles = '';

	// `:root` selector need to be in each file at the top.
	if ( isRootSelector ) {
		rootDefinitions.push( ruleDeclarations );
	} else {
		// Dividing styles depending on purpose
		if ( selectorWithCkContent ) {
			editingViewStyles += wrapDefinitionsIntoSelector( selectorWithCkContent, ruleDeclarations );
		}
		if ( selectorWithoutCkContent ) {
			editorStyles += wrapDefinitionsIntoSelector( selectorWithoutCkContent, ruleDeclarations );
		}
	}

	return {
		rootDefinitions,
		editorStyles,
		editingViewStyles,
		keyframesRules: ''
	};
}

/**
 * Divides styles between editor and content stylesheets by CSS `@media` rule.
 */
function divideStylesBetweenStylesheetsByMedia( rule: Media ) {
	const selector = `@media ${ rule.media }`;

	let editorStyles = '';
	let editingViewStyles = '';
	let ruleDeclarationsWithSelectorForEditor = '';
	let ruleDeclarationsWithSelectorForContent = '';

	rule.rules!.forEach( rule => {
		const objectWithDividedStyles = divideRuleStylesBetweenStylesheets( rule );

		editorStyles += objectWithDividedStyles.editorStyles;
		editingViewStyles += objectWithDividedStyles.editingViewStyles;
	} );

	if ( editorStyles ) {
		ruleDeclarationsWithSelectorForEditor = wrapDefinitionsIntoSelector( selector, editorStyles );
	}

	if ( editingViewStyles ) {
		ruleDeclarationsWithSelectorForContent = wrapDefinitionsIntoSelector( selector, editingViewStyles );
	}

	return {
		rootDefinitions: [],
		editorStyles: ruleDeclarationsWithSelectorForEditor,
		editingViewStyles: ruleDeclarationsWithSelectorForContent,
		keyframesRules: ''
	};
}

/**
 * Divides styles between editor and content stylesheets by CSS `@keyframes` rule.
 */
function divideStylesBetweenStylesheetsByKeyframes( rule: KeyFrames ) {
	const selector = `@keyframes ${ rule.name }`;
	const keyframeEntries = getKeyframesEntries( rule );
	const keyframeDeclarationsWithSelector = wrapDefinitionsIntoSelector( selector, keyframeEntries );

	return {
		rootDefinitions: [],
		editorStyles: '',
		editingViewStyles: '',
		keyframesRules: keyframeDeclarationsWithSelector
	};
}

/**
 * Returns concatenated keyframes entries.
 */
function getKeyframesEntries( rule: KeyFrames ) {
	let keyframeEntries = '';

	rule.keyframes!.forEach( keyframe => {
		// Filtering potential comments.
		if ( 'comment' in keyframe ) {
			return;
		}
		const keyFrameSelector = ( keyframe as KeyFrame ).values!.join( ',\n' );
		const keyFrameDeclarations = getRuleDeclarations( ( keyframe as KeyFrame ).declarations! );
		keyframeEntries += ` ${ keyFrameSelector } { ${ keyFrameDeclarations } }`;
	} );

	return keyframeEntries;
}

function isSelectorStartsWithCkContent( rule: Rule ) {
	return !!rule.selectors!.filter( selector => selector.startsWith( '.ck-content' ) ).length;
}

function isSelectorStartsWithoutCkContent( rule: Rule ) {
	return !!rule.selectors!.filter( selector => !selector.startsWith( '.ck-content' ) ).length;
}
