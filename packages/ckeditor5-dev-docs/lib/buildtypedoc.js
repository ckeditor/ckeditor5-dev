/**
 * @license Copyright (c) 2003-2023, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const glob = require( 'fast-glob' );
const TypeDoc = require( 'typedoc' );
const validators = require( './validators' );

/**
 * Builds CKEditor 5 documentation using `typedoc`.
 *
 * @param {TypedocConfig} config
 * @returns {Promise}
 */
module.exports = async function build( config ) {
	const sourceFilePatterns = config.sourceFiles.filter( Boolean );
	const strictMode = config.strict || false;
	const extraPlugins = config.extraPlugins || [];
	const validatorOptions = config.validatorOptions || {};

	const files = await glob( sourceFilePatterns );
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

			require.resolve( '@ckeditor/typedoc-plugins/lib/module-fixer' ),
			require.resolve( '@ckeditor/typedoc-plugins/lib/symbol-fixer' ),
			require.resolve( '@ckeditor/typedoc-plugins/lib/interface-augmentation-fixer' ),
			require.resolve( '@ckeditor/typedoc-plugins/lib/tag-error' ),
			require.resolve( '@ckeditor/typedoc-plugins/lib/tag-event' ),
			require.resolve( '@ckeditor/typedoc-plugins/lib/tag-observable' ),
			require.resolve( '@ckeditor/typedoc-plugins/lib/purge-private-api-docs' ),

			// The `event-inheritance-fixer` plugin must be loaded after `tag-event` plugin, as it depends on its output.
			require.resolve( '@ckeditor/typedoc-plugins/lib/event-inheritance-fixer' ),

			// The `event-param-fixer` plugin must be loaded after `tag-event` and `tag-observable` plugins, as it depends on their output.
			require.resolve( '@ckeditor/typedoc-plugins/lib/event-param-fixer' ),

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
};
