/**
 * @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

const PLUGIN_NAME = 'TreatWarningsAsErrorsWebpackPlugin';

/**
 * Webpack plugin that reassigns warnings as errors and makes the browser test run fail.
 */
export default class TreatWarningsAsErrorsWebpackPlugin {
	apply( compiler ) {
		compiler.hooks.thisCompilation.tap( PLUGIN_NAME, compilation => {
			compilation.hooks.processAssets.tap( {
				name: PLUGIN_NAME,
				stage: compiler.webpack.Compilation.PROCESS_ASSETS_STAGE_ADDITIONS
			}, () => {
				const warnings = compilation.warnings;

				if ( !warnings.length && !compilation.errors.length ) {
					return;
				}

				compilation.errors = [
					...compilation.errors,
					...warnings
				];

				compilation.warnings = [];

				prependFailureToEntrypoints( compilation, compiler.webpack.sources.ConcatSource );
			} );
		} );
	}
}

function prependFailureToEntrypoints( compilation, ConcatSource ) {
	const files = new Set();

	for ( const entrypoint of compilation.entrypoints.values() ) {
		for ( const file of entrypoint.getFiles() ) {
			if ( file.endsWith( '.js' ) ) {
				files.add( file );
			}
		}
	}

	for ( const file of files ) {
		compilation.updateAsset( file, source => new ConcatSource(
			'throw new Error( "Webpack compilation failed. See terminal output for details." );\n',
			source
		) );
	}
}
