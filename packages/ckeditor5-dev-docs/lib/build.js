/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { glob } from 'glob';
import TypeDoc from 'typedoc';
import typedocPlugins from '@ckeditor/typedoc-plugins';

import validators from './validators/index.js';

/**
 * Builds CKEditor 5 documentation using `typedoc`.
 *
 * @param {TypedocConfig} config
 * @returns {Promise}
 */
export default async function build( config ) {
	const { plugins } = typedocPlugins;
	const sourceFilePatterns = config.sourceFiles.filter( Boolean );
	const strictMode = config.strict || false;
	const extraPlugins = config.extraPlugins || [];
	const ignoreFiles = config.ignoreFiles || [];
	const validatorOptions = config.validatorOptions || {};

	const files = await glob( sourceFilePatterns, {
		ignore: ignoreFiles
	} );
	const typeDoc = new TypeDoc.Application();

	typeDoc.options.addReader( new TypeDoc.TSConfigReader() );
	typeDoc.options.addReader( new TypeDoc.TypeDocReader() );

	typeDoc.bootstrap( {
		tsconfig: config.tsconfig,
		excludeExternals: true,
		entryPoints: files,
		logLevel: 'Warn',
		basePath: config.cwd,
		blockTags: [
			'@eventName',
			'@default'
		],
		inlineTags: [
			'@link',
			'@glink'
		],
		modifierTags: [
			'@publicApi',
			'@skipSource',
			'@internal'
		],
		plugin: [
			// Fixes `"name": 'default" in the output project.
			'typedoc-plugin-rename-defaults',

			plugins[ 'typedoc-plugin-module-fixer' ],
			plugins[ 'typedoc-plugin-symbol-fixer' ],
			plugins[ 'typedoc-plugin-interface-augmentation-fixer' ],
			plugins[ 'typedoc-plugin-tag-error' ],
			plugins[ 'typedoc-plugin-tag-event' ],
			plugins[ 'typedoc-plugin-tag-observable' ],
			plugins[ 'typedoc-plugin-purge-private-api-docs' ],

			// The `event-inheritance-fixer` plugin must be loaded after `tag-event` plugin, as it depends on its output.
			plugins[ 'typedoc-plugin-event-inheritance-fixer' ],

			// The `event-param-fixer` plugin must be loaded after `tag-event` and `tag-observable` plugins, as it depends on their output.
			plugins[ 'typedoc-plugin-event-param-fixer' ],

			...extraPlugins
		]
	} );

	console.log( 'Typedoc started...' );

	const conversionResult = typeDoc.convert();

	if ( !conversionResult ) {
		throw 'Something went wrong with TypeDoc.';
	}

	const validationResult = validators.validate( conversionResult, typeDoc, validatorOptions );

	if ( !validationResult && strictMode ) {
		throw 'Something went wrong with TypeDoc.';
	}

	if ( config.outputPath ) {
		await typeDoc.generateJson( conversionResult, config.outputPath );
	}

	console.log( `Documented ${ files.length } files!` );
}

/**
 * @typedef {object} TypedocConfig
 *
 * @property {object} config
 *
 * @property {string} cwd
 *
 * @property {string} tsconfig
 *
 * @property {Array.<string>} sourceFiles Glob pattern with source files.
 *
 * @property {Array.<string>} [ignoreFiles=[]] Glob pattern with files to ignore.
 *
 * @property {boolean} [strict=false] If `true`, errors found during the validation will finish the process
 * and exit code will be changed to `1`.
 * @property {string} [outputPath] A path to the place where extracted doclets will be saved. Is an optional value due to tests.
 *
 * @property {string} [extraPlugins=[]] An array of path to extra plugins that will be added to Typedoc.
 *
 * @property {TypedocValidator} [validatorOptions={}] An optional configuration object for validator.
 */

/**
 * @typedef {object} TypedocValidator
 *
 * @property {boolean} [enableOverloadValidator=false] If set to `true`, the overloads validator will be enabled.
 */
