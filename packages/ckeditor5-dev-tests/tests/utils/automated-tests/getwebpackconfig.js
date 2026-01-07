/**
 * @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { describe, expect, it, vi } from 'vitest';
import { loaders } from '@ckeditor/ckeditor5-dev-utils';
import TreatWarningsAsErrorsWebpackPlugin from '../../../lib/utils/automated-tests/treatwarningsaserrorswebpackplugin.js';
import getWebpackConfigForAutomatedTests from '../../../lib/utils/automated-tests/getwebpackconfig.js';
import getDefinitionsFromFile from '../../../lib/utils/getdefinitionsfromfile.js';

vi.mock( '@ckeditor/ckeditor5-dev-utils' );
vi.mock( '../../../lib/utils/getdefinitionsfromfile.js' );
vi.mock( '../../../lib/utils/automated-tests/treatwarningsaserrorswebpackplugin', () => ( {
	default: class TreatWarningsAsErrorsWebpackPlugin {}
} ) );

describe( 'getWebpackConfigForAutomatedTests()', () => {
	it( 'should return basic webpack configuration object', () => {
		const webpackConfig = getWebpackConfigForAutomatedTests( {
			debug: [],
			themePath: '/theme/path',
			tsconfig: '/tsconfig/path'
		} );

		expect( webpackConfig.resolve.extensions ).to.deep.equal( [ '.ts', '.js', '.json' ] );
		expect( webpackConfig.resolve.fallback.timers ).to.equal( false );

		expect( vi.mocked( loaders.getIconsLoader ) ).toHaveBeenCalledOnce();
		expect( vi.mocked( loaders.getFormattedTextLoader ) ).toHaveBeenCalledOnce();
		expect( vi.mocked( loaders.getCoverageLoader ) ).not.toHaveBeenCalledOnce();
		expect( vi.mocked( loaders.getStylesLoader ) ).toHaveBeenCalledExactlyOnceWith( {
			themePath: '/theme/path',
			minify: true
		} );
		expect( vi.mocked( loaders.getTypeScriptLoader ) ).toHaveBeenCalledExactlyOnceWith( {
			configFile: '/tsconfig/path'
		} );

		expect( webpackConfig.resolveLoader.modules[ 0 ] ).to.equal( 'node_modules' );
		expect( webpackConfig.devtool ).to.equal( undefined );
		expect( webpackConfig.output ).to.have.property( 'devtoolModuleFilenameTemplate' );
	} );

	it( 'should aggregate events when running with the enabled watch mode', () => {
		const webpackConfig = getWebpackConfigForAutomatedTests( {} );

		expect( webpackConfig ).to.have.property( 'watchOptions' );
		expect( webpackConfig.watchOptions ).to.have.property( 'aggregateTimeout', 500 );
	} );

	it( 'should not include the ck-debug-loader', () => {
		getWebpackConfigForAutomatedTests( {
			files: [ '**/*.js' ]
		} );

		expect( vi.mocked( loaders.getJavaScriptLoader ) ).not.toHaveBeenCalledOnce();
	} );

	it( 'should return webpack configuration containing a loader for measuring the coverage', () => {
		getWebpackConfigForAutomatedTests( {
			coverage: true,
			files: [ '**/*.js' ]
		} );

		expect( vi.mocked( loaders.getCoverageLoader ) ).toHaveBeenCalledOnce();
	} );

	it( 'should return webpack configuration with source map support', () => {
		const webpackConfig = getWebpackConfigForAutomatedTests( {
			sourceMap: true
		} );

		expect( webpackConfig.devtool ).to.equal( 'inline-source-map' );
		expect( webpackConfig.optimization ).to.deep.equal( {
			runtimeChunk: false,
			splitChunks: false
		} );
	} );

	it( 'should contain a correct paths in resolveLoader', () => {
		const webpackConfig = getWebpackConfigForAutomatedTests( {} );

		const firstPath = webpackConfig.resolveLoader.modules[ 0 ];
		const secondPath = webpackConfig.resolveLoader.modules[ 1 ];

		expect( firstPath ).to.equal( 'node_modules' );

		expect( secondPath ).to.match( /node_modules$/ );
		expect( require( 'node:fs' ).existsSync( secondPath ) ).to.equal( true );
	} );

	it( 'should return webpack configuration with loaded identity file', () => {
		vi.mocked( getDefinitionsFromFile ).mockReturnValue( { LICENSE_KEY: 'secret' } );

		const webpackConfig = getWebpackConfigForAutomatedTests( {
			identityFile: 'path/to/secrets.js'
		} );

		const plugin = webpackConfig.plugins[ 0 ];

		expect( vi.mocked( getDefinitionsFromFile ) ).toHaveBeenCalledExactlyOnceWith( 'path/to/secrets.js' );
		expect( plugin.definitions.LICENSE_KEY ).to.equal( 'secret' );
	} );

	it( 'should return webpack configuration with correct extension resolve order', () => {
		const webpackConfig = getWebpackConfigForAutomatedTests( {
			resolveJsFirst: true
		} );

		expect( webpackConfig.resolve.extensions ).to.deep.equal( [ '.js', '.ts', '.json' ] );
	} );

	it( 'should return webpack configuration with cache enabled', () => {
		const webpackConfig = getWebpackConfigForAutomatedTests( {
			cache: true
		} );

		expect( webpackConfig.cache ).to.deep.equal( {
			type: 'filesystem'
		} );
	} );

	it( 'should get rid of the "webpack://" protocol to make the paths clickable in the terminal', () => {
		const webpackConfig = getWebpackConfigForAutomatedTests( {} );

		const { devtoolModuleFilenameTemplate } = webpackConfig.output;

		const info = { resourcePath: 'foo/bar/baz' };

		expect( devtoolModuleFilenameTemplate( info ) ).to.equal( info.resourcePath );
	} );

	it( 'should add TreatWarningsAsErrorsWebpackPlugin to plugins if options.production is true', () => {
		const webpackConfig = getWebpackConfigForAutomatedTests( {
			production: true
		} );

		const plugin = webpackConfig.plugins.find( plugin => plugin instanceof TreatWarningsAsErrorsWebpackPlugin );

		expect( plugin ).toBeTruthy();
	} );

	it( 'should load TypeScript files first when importing JS files', () => {
		const webpackConfig = getWebpackConfigForAutomatedTests( {
			production: true
		} );

		expect( webpackConfig.resolve.extensionAlias ).to.be.an( 'object' );
		expect( webpackConfig.resolve.extensionAlias[ '.js' ] ).to.be.an( 'array' );
		expect( webpackConfig.resolve.extensionAlias[ '.js' ] ).to.deep.equal( [
			'.ts',
			'.js'
		] );
	} );
} );
