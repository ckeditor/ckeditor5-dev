/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import path from 'path';
import webpack from 'webpack';
import { loaders } from '@ckeditor/ckeditor5-dev-utils';
import getDefinitionsFromFile from '../getdefinitionsfromfile.js';
import TreatWarningsAsErrorsWebpackPlugin from './treatwarningsaserrorswebpackplugin.js';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath( import.meta.url );
const __dirname = path.dirname( __filename );

/**
 * @param {Object} options
 * @returns {Object}
 */
export default function getWebpackConfigForAutomatedTests( options ) {
	const definitions = Object.assign( {}, getDefinitionsFromFile( options.identityFile ) );

	const config = {
		mode: 'development',

		watchOptions: {
			aggregateTimeout: 500
		},

		plugins: [
			new webpack.DefinePlugin( definitions ),
			new webpack.ProvidePlugin( {
				Buffer: [ 'buffer', 'Buffer' ],
				process: 'process/browser.js'
			} )
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
				path.resolve( __dirname, '..', '..', '..', 'node_modules' )
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

		// Since webpack v5 it looks like splitting out the source code into the commons and runtime chunks broke the source map support.
		config.optimization = {
			runtimeChunk: false,
			splitChunks: false
		};
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
