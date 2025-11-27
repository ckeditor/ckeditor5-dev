/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import path from 'path';
import rspack from '@rspack/core';
import { loaders } from '@ckeditor/ckeditor5-dev-utils';
import getDefinitionsFromFile from '../getdefinitionsfromfile.js';
import TreatWarningsAsErrorsWebpackPlugin from './treatwarningsaserrorswebpackplugin.js';

/**
 * @param {object} options
 * @returns {object}
 */
export default function getWebpackConfigForAutomatedTests( options ) {
	const definitions = Object.assign( {}, getDefinitionsFromFile( options.identityFile ) );

	const config = {
		mode: 'development',

		watchOptions: {
			aggregateTimeout: 500
		},

		plugins: [
			new rspack.DefinePlugin( definitions ),
			new rspack.ProvidePlugin( {
				Buffer: [ 'buffer', 'Buffer' ],
				process: 'process/browser.js'
			} ),

			/**
			 * Disable tree-shaking because it removes tests for packages with `sideEffects` field in `package.json`.
			 *
			 * Workaround for https://github.com/ckeditor/ckeditor5/issues/17767#issuecomment-2598263796.
			 */
			{
				apply( compiler ) {
					compiler.options.optimization = {
						...compiler.options.optimization,
						sideEffects: false
					};
				}
			}
		],

		resolve: {
			fallback: {
				'timers': false
			},

			extensions: options.resolveJsFirst ?
				[ '.js', '.ts', '.json' ] :
				[ '.ts', '.js', '.json' ],

			extensionAlias: {
				'.js': [ '.ts', '.js' ]
			}
		},

		module: {
			rules: [
				options.coverage ? loaders.getCoverageLoader( { files: options.files } ) : null,

				loaders.getIconsLoader(),

				loaders.getStylesLoader( {
					themePath: options.themePath,
					minify: true
				} ),

				loaders.getTypeScriptLoader( { configFile: options.tsconfig } ),

				loaders.getFormattedTextLoader()
			].filter( Boolean )
		},

		resolveLoader: {
			modules: [
				'node_modules',
				path.resolve( import.meta.dirname, '..', '..', '..', 'node_modules' )
			]
		},

		output: {
			// Get rid of the "webpack://" protocol to make the paths clickable in the terminal.
			devtoolModuleFilenameTemplate: info => info.resourcePath
		}
	};

	if ( options.sourceMap ) {
		// After bumping the webpack to v5 and other related tools/libs/whatever, the source maps stopped working for unknown reasons.
		// The only way to make them work again was to use the inline source maps.
		//
		// See https://github.com/ckeditor/ckeditor5/issues/11006.
		config.devtool = 'inline-source-map';
	}

	if ( options.cache ) {
		config.cache = {
			type: 'filesystem'
		};
	}

	if ( options.production ) {
		config.plugins.push( new TreatWarningsAsErrorsWebpackPlugin() );
	}

	return config;
}
