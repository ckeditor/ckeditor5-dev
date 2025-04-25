/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { glob } from 'glob';
import upath from 'upath';
import { Application, OptionDefaults } from 'typedoc';
import {
	typeDocRestoreProgramAfterConversion,
	typeDocModuleFixer,
	typeDocSymbolFixer,
	typeDocTagError,
	typeDocTagEvent,
	typeDocTagObservable,
	typeDocEventParamFixer,
	typeDocEventInheritanceFixer,
	typeDocInterfaceAugmentationFixer,
	typeDocPurgePrivateApiDocs,
	typeDocReferenceFixer,
	validate
} from '@ckeditor/typedoc-plugins';

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

	const files = ( await glob( sourceFilePatterns, {
		ignore: ignoreFiles
	} ) ).map( upath.normalize );

	const app = await Application.bootstrapWithPlugins( {
		tsconfig: config.tsconfig,
		excludeExternals: true,
		excludePrivate: false,
		entryPoints: files,
		logLevel: 'Warn',
		basePath: config.cwd,

		blockTags: [
			...OptionDefaults.blockTags,
			'@eventName',
			'@export',
			'@fires',
			'@label',
			'@observable'
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

	typeDocRestoreProgramAfterConversion( app );
	typeDocModuleFixer( app );
	typeDocSymbolFixer( app );
	typeDocTagError( app );
	typeDocTagEvent( app );
	typeDocTagObservable( app );
	typeDocEventParamFixer( app );
	typeDocEventInheritanceFixer( app );
	typeDocInterfaceAugmentationFixer( app );
	typeDocPurgePrivateApiDocs( app );
	typeDocReferenceFixer( app );

	console.log( 'Typedoc started...' );

	const conversionResult = await app.convert();

	if ( !conversionResult ) {
		throw 'Something went wrong with TypeDoc.';
	}

	const validationResult = validate( app, validatorOptions );

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
