/**
 * @license Copyright (c) 2003-2018, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const mockery = require( 'mockery' );
const { expect } = require( 'chai' );

describe( 'getWebpackConfigForAutomatedTests()', () => {
	const escapedPathSep = require( 'path' ).sep == '/' ? '/' : '\\\\';
	let getWebpackConfigForAutomatedTests, postCssOptions;

	beforeEach( () => {
		mockery.enable( {
			warnOnReplace: false,
			warnOnUnregistered: false
		} );

		mockery.registerMock( '@ckeditor/ckeditor5-dev-utils', {
			styles: {
				getPostCssConfig: options => {
					postCssOptions = options;
				}
			}
		} );

		mockery.registerMock( 'CKEditorWebpackPlugin', function CKEditorWebpackPlugin( options ) {
			this.options = options;
		} );

		getWebpackConfigForAutomatedTests = require( '../../../lib/utils/automated-tests/getwebpackconfig' );
	} );

	afterEach( () => {
		mockery.disable();
		mockery.deregisterAll();
	} );

	it( 'should return basic webpack configutation object', () => {
		const webpackConfig = getWebpackConfigForAutomatedTests( {} );

		expect( webpackConfig.module.rules.length ).to.equal( 3 );
		expect( webpackConfig.resolveLoader.modules[ 0 ] ).to.equal( 'node_modules' );

		expect( webpackConfig.devtool ).to.equal( undefined );
	} );

	it( 'should return webpack configutation with babel loader and istanbul loader', () => {
		const webpackConfig = getWebpackConfigForAutomatedTests( {
			coverage: true,
			files: [ '**/*.js' ],
		} );

		const babelLoader = webpackConfig.module.rules
			.find( rule => rule.loader === 'babel-loader' );

		expect( babelLoader.query.plugins ).to.contain(
			require( 'babel-plugin-transform-es2015-modules-commonjs' )
		);

		const istanbulLoader = webpackConfig.module.rules
			.find( rule => rule.loader === 'istanbul-instrumenter-loader' );

		expect( istanbulLoader ).to.deep.equal( {
			test: /\.js$/,
			loader: 'istanbul-instrumenter-loader',
			include: [],
			exclude: [
				new RegExp( `${ escapedPathSep }(lib)${ escapedPathSep }` )
			],
			query: {
				esModules: true
			}
		} );
	} );

	it( 'should return webpack configutation with istanbul loader containing include regexp', () => {
		const webpackConfig = getWebpackConfigForAutomatedTests( {
			coverage: true,
			files: [ 'node_modules/ckeditor5-utils/tests/**/*.js' ],
		} );

		const istanbulLoader = webpackConfig.module.rules
			.find( rule => rule.loader === 'istanbul-instrumenter-loader' );

		const expectedRegExp = new RegExp( [ 'ckeditor5-utils', 'src', '' ].join( escapedPathSep ) );

		expect( istanbulLoader.include ).to.deep.equal( [ expectedRegExp ] );
	} );

	it( 'should return webpack configutation with istanbul loader containing include regexp', () => {
		const webpackConfig = getWebpackConfigForAutomatedTests( {
			coverage: true,
			files: [ 'node_modules/ckeditor5-!(utils)/tests/**/*.js' ],
		} );

		const istanbulLoader = webpackConfig.module.rules
			.find( rule => rule.loader === 'istanbul-instrumenter-loader' );

		const expectedRegExp = new RegExp( [ 'ckeditor5-!(utils)', 'src', '' ].join( escapedPathSep ) );

		expect( istanbulLoader.include ).to.deep.equal( [ expectedRegExp ] );
	} );

	it( 'should return webpack configutation with correct devtool', () => {
		const webpackConfig = getWebpackConfigForAutomatedTests( {
			sourceMap: true
		} );

		expect( webpackConfig.devtool ).to.equal( 'inline-source-map' );
	} );

	it( 'should contain a correct paths in resolveLoader', () => {
		const webpackConfig = getWebpackConfigForAutomatedTests( {} );

		const firstPath = webpackConfig.resolveLoader.modules[ 0 ];
		const secondPath = webpackConfig.resolveLoader.modules[ 1 ];

		expect( firstPath ).to.equal( 'node_modules' );

		expect( secondPath ).to.match( /node_modules$/ );
		expect( require( 'fs' ).existsSync( secondPath ) ).to.equal( true );
	} );

	it( 'should return webpack configutation with the correct setup of the postcss-loader', () => {
		getWebpackConfigForAutomatedTests( {
			themePath: 'path/to/theme'
		} );

		expect( postCssOptions ).to.deep.equal( {
			themeImporter: {
				themePath: 'path/to/theme'
			},
			minify: true
		} );
	} );

	it( 'should load svg files properly', () => {
		const webpackConfig = getWebpackConfigForAutomatedTests( {} );
		const svgRule = webpackConfig.module.rules.find( rule => {
			return rule.test.toString().endsWith( '.svg$/' );
		} );

		if ( !svgRule ) {
			throw new Error( 'Not found loader for "svg".' );
		}

		const svgRegExp = svgRule.test;

		expect( 'C:\\Program Files\\ckeditor\\ckeditor5-basic-styles\\theme\\icons\\italic.svg' ).to.match( svgRegExp, 'Windows' );
		expect( '/home/ckeditor/ckeditor5-basic-styles/theme/icons/italic.svg' ).to.match( svgRegExp, 'Linux' );
	} );
} );
