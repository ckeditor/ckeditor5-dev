/**
 * @license Copyright (c) 2003-2023, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const fs = require( 'fs-extra' );
const tmp = require( 'tmp' );
const glob = require( 'fast-glob' );
const { tools } = require( '@ckeditor/ckeditor5-dev-utils' );

/**
 * Builds CKEditor 5 documentation using `jsdoc`.
 *
 * @param {JSDocConfig} config
 * @returns {Promise}
 */
module.exports = async function build( config ) {
	const sourceFilePatterns = [
		config.readmePath,
		...config.sourceFiles
	];

	const extraPlugins = config.extraPlugins || [];
	const outputPath = config.outputPath || 'docs/api/output.json';
	const validateOnly = config.validateOnly || false;
	const strictCheck = config.strict || false;

	// Pass options to plugins via env variables.
	// Since plugins are added using `require` calls other forms are currently impossible.
	process.env.JSDOC_OUTPUT_PATH = outputPath;

	if ( validateOnly ) {
		process.env.JSDOC_VALIDATE_ONLY = 'true';
	}

	if ( strictCheck ) {
		process.env.JSDOC_STRICT_CHECK = 'true';
	}

	const files = await glob( sourceFilePatterns );

	const jsDocConfig = {
		plugins: [
			require.resolve( 'jsdoc/plugins/markdown' ),
			require.resolve( '@ckeditor/jsdoc-plugins/lib/purge-private-api-docs' ),
			require.resolve( '@ckeditor/jsdoc-plugins/lib/export-fixer/export-fixer' ),
			require.resolve( '@ckeditor/jsdoc-plugins/lib/custom-tags/error' ),
			require.resolve( '@ckeditor/jsdoc-plugins/lib/custom-tags/observable' ),
			require.resolve( '@ckeditor/jsdoc-plugins/lib/observable-event-provider' ),
			require.resolve( '@ckeditor/jsdoc-plugins/lib/longname-fixer/longname-fixer' ),
			require.resolve( '@ckeditor/jsdoc-plugins/lib/fix-code-snippets' ),
			require.resolve( '@ckeditor/jsdoc-plugins/lib/relation-fixer' ),
			require.resolve( '@ckeditor/jsdoc-plugins/lib/event-extender/event-extender' ),
			require.resolve( '@ckeditor/jsdoc-plugins/lib/cleanup' ),
			require.resolve( '@ckeditor/jsdoc-plugins/lib/validator/validator' ),
			require.resolve( '@ckeditor/jsdoc-plugins/lib/utils/doclet-logger' ),
			...extraPlugins
		],
		source: {
			include: files
		},
		opts: {
			encoding: 'utf8',
			recurse: true,
			access: 'all',
			template: 'templates/silent'
		}
	};

	const tmpConfig = tmp.fileSync();

	await fs.writeFile( tmpConfig.name, JSON.stringify( jsDocConfig ) );

	console.log( 'JSDoc started...' );

	try {
		// Not so beautiful API as for 2020...
		// See more in https://github.com/jsdoc/jsdoc/issues/938.
		const cmd = require.resolve( 'jsdoc/jsdoc.js' );

		// The `node` command is used for explicitly needed for Windows.
		// See https://github.com/ckeditor/ckeditor5/issues/7212.
		tools.shExec( `node ${ cmd } -c ${ tmpConfig.name }`, { verbosity: 'info' } );
	} catch ( error ) {
		console.error( 'An error was thrown by JSDoc:' );

		throw error;
	}

	console.log( `Documented ${ files.length } files!` );
};
