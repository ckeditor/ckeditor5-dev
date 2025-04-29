/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { glob } from 'glob';
import upath from 'upath';
import { Application, OptionDefaults } from 'typedoc';
import * as plugins from '@ckeditor/typedoc-plugins';

/**
 * Builds CKEditor 5 documentation using `typedoc`.
 *
 * @param {TypedocConfig} config
 * @returns {Promise}
 */
export default async function build( config ) {
	const sourceFilePatterns = config.sourceFiles.filter( Boolean );
	const strictMode = config.strict || false;
	const extraPlugins = config.extraPlugins || [];
	const ignoreFiles = config.ignoreFiles || [];
	const validatorOptions = config.validatorOptions || {};
	const verbose = config.verbose || false;

	const files = ( await glob( sourceFilePatterns, {
		ignore: ignoreFiles
	} ) ).map( upath.normalize );

	const app = await Application.bootstrapWithPlugins( {
		tsconfig: config.tsconfig,
		excludeExternals: true,
		excludePrivate: false,
		entryPoints: files,
		logLevel: verbose ? 'Info' : 'Warn',
		basePath: config.cwd,
		readme: 'none',

		blockTags: [
			...OptionDefaults.blockTags,
			'@eventName',
			'@export',
			'@fires',
			'@label',
			'@observable',
			'@error'
		],
		inlineTags: [
			...OptionDefaults.inlineTags,
			'@glink'
		],
		modifierTags: [
			...OptionDefaults.modifierTags,
			'@publicApi',
			'@skipSource'
		],
		plugin: [
			// Fixes `"name": 'default" in the output project.
			'typedoc-plugin-rename-defaults',
			...extraPlugins
		]
	} );

	plugins.typeDocRestoreProgramAfterConversion( app );
	plugins.typeDocModuleFixer( app );
	plugins.typeDocSymbolFixer( app );
	plugins.typeDocTagError( app );
	plugins.typeDocTagEvent( app );
	plugins.typeDocTagObservable( app );
	plugins.typeDocEventParamFixer( app );
	plugins.typeDocEventInheritanceFixer( app );
	plugins.typeDocInterfaceAugmentationFixer( app );
	plugins.typeDocPurgePrivateApiDocs( app );
	plugins.typeDocReferenceFixer( app );
	plugins.typeDocOutputCleanUp( app );

	console.log( 'Typedoc started...' );

	const conversionResult = await app.convert();

	if ( !conversionResult ) {
		throw 'Something went wrong with TypeDoc.';
	}

	const validationResult = plugins.validate( app, validatorOptions );

	if ( !validationResult && strictMode ) {
		throw 'Something went wrong with TypeDoc.';
	}

	if ( config.outputPath ) {
		await app.generateJson( conversionResult, config.outputPath );
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
 *
 * @property {boolean} [verbose=false] If `true`, the output will be verbose.
 *
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
