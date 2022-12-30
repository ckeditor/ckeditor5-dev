/**
 * @license Copyright (c) 2003-2022, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const glob = require( 'fast-glob' );
const TypeDoc = require( 'typedoc' );
const validators = require( './validators' );

/**
 * Builds CKEditor 5 documentation.
 *
 * @param {Object} config
 * @param {String} config.cwd
 * @param {String} config.tsconfig
 * @param {String} config.outputPath
 * @param {Array.<String>} config.sourceFiles Glob pattern with source files.
 * @param {String} config.readmePath Path to `README.md`.
 * @param {Boolean} [config.validateOnly=false] Whether JSDoc should only validate the documentation and finish
 * with error code `1`. If not passed, the errors will be printed to the console but the task will finish with `0`.
 * @param {Boolean} [config.strict=false] If `true`, errors found during the validation will finish the process
 * and exit code will be changed to `1`.
 * @param {String} [config.outputPath] A path to the place where extracted doclets will be saved.
 * @param {String} [config.extraPlugins] An array of path to extra plugins that will be added to JSDoc.
 *
 * @returns {Promise}
 */
module.exports = async function build( config ) {
	const sourceFilePatterns = [
		config.readmePath,
		...config.sourceFiles
	];

	// const validateOnly = config.validateOnly || false;
	// const strictCheck = config.strict || false;

	// Pass options to plugins via env variables.
	// Since plugins are added using `require` calls other forms are currently impossible.
	// process.env.JSDOC_OUTPUT_PATH = outputPath;

	// if ( validateOnly ) {
	// 	process.env.JSDOC_VALIDATE_ONLY = 'true';
	// }

	// if ( strictCheck ) {
	// 	process.env.JSDOC_STRICT_CHECK = 'true';
	// }

	const files = await glob( sourceFilePatterns );
	const typeDoc = new TypeDoc.Application();

	console.log( 'Source files', files );

	typeDoc.options.addReader( new TypeDoc.TSConfigReader() );
	typeDoc.options.addReader( new TypeDoc.TypeDocReader() );

	typeDoc.bootstrap( {
		tsconfig: config.tsconfig,
		entryPoints: files,
		// logLevel: 'Error',
		blockTags: [
			'@eventName'
		],
		inlineTags: [
			'@link',
			'@glink'
		],
		modifierTags: [
			'@publicApi',
			'@skipSource'
		],
		plugin: [
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
			require.resolve( '@ckeditor/typedoc-plugins/lib/event-param-fixer' )
		]
	} );

	const conversionResult = typeDoc.convert();

	if ( !conversionResult ) {
		throw 'Something went wrong with TypeDoc.';
	}

	const validationResult = validators.validate( conversionResult );

	if ( !validationResult ) {
		throw 'Something went wrong with TypeDoc.';
	}

	await typeDoc.generateJson( conversionResult, config.outputPath );

	// Uncomment this to generate TypeDoc documentation (build-in HTML template).
	// await typeDoc.generateDocs( conversionResult, 'docs/api/typedoc' );

	// const jsDocConfig = {
	// 	plugins: [
	// 		require.resolve( 'jsdoc/plugins/markdown' ),
	// 		require.resolve( '@ckeditor/jsdoc-plugins/lib/purge-private-api-docs' ),
	// 		require.resolve( '@ckeditor/jsdoc-plugins/lib/export-fixer/export-fixer' ),
	// 		require.resolve( '@ckeditor/jsdoc-plugins/lib/custom-tags/error' ),
	// 		require.resolve( '@ckeditor/jsdoc-plugins/lib/custom-tags/observable' ),
	// 		require.resolve( '@ckeditor/jsdoc-plugins/lib/observable-event-provider' ),
	// 		require.resolve( '@ckeditor/jsdoc-plugins/lib/longname-fixer/longname-fixer' ),
	// 		require.resolve( '@ckeditor/jsdoc-plugins/lib/fix-code-snippets' ),
	// 		require.resolve( '@ckeditor/jsdoc-plugins/lib/relation-fixer' ),
	// 		require.resolve( '@ckeditor/jsdoc-plugins/lib/event-extender/event-extender' ),
	// 		require.resolve( '@ckeditor/jsdoc-plugins/lib/cleanup' ),
	// 		require.resolve( '@ckeditor/jsdoc-plugins/lib/validator/validator' ),
	// 		require.resolve( '@ckeditor/jsdoc-plugins/lib/utils/doclet-logger' ),
	// 		...extraPlugins
	// 	],
	// 	source: {
	// 		include: files
	// 	},
	// 	opts: {
	// 		encoding: 'utf8',
	// 		recurse: true,
	// 		access: 'all',
	// 		template: 'templates/silent'
	// 	}
	// };

	// const tmpConfig = tmp.fileSync();

	// await fs.writeFile( tmpConfig.name, JSON.stringify( jsDocConfig ) );

	// console.log( 'JSDoc started...' );

	// try {
	// 	// Not so beautiful API as for 2020...
	// 	// See more in https://github.com/jsdoc/jsdoc/issues/938.
	// 	const cmd = require.resolve( 'jsdoc/jsdoc.js' );

	// 	// The `node` command is used for explicitly needed for Windows.
	// 	// See https://github.com/ckeditor/ckeditor5/issues/7212.
	// 	tools.shExec( `node ${ cmd } -c ${ tmpConfig.name }`, { verbosity: 'info' } );
	// } catch ( error ) {
	// 	console.error( 'An error was thrown by JSDoc:' );

	// 	throw error;
	// }

	console.log( `Documented ${ files.length } files!` );
};
