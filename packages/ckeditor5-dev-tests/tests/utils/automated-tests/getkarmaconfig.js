/**
 * @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import getWebpackConfigForAutomatedTests from '../../../lib/utils/automated-tests/getwebpackconfig.js';
import getKarmaConfig from '../../../lib/utils/automated-tests/getkarmaconfig.js';

vi.mock( 'path', async () => {
	const originalModule = await vi.importActual( 'path' );

	return {
		default: {
			join: vi.fn( ( ...chunks ) => chunks.join( '/' ) ),
			dirname: vi.fn(),
			resolve: originalModule.resolve
		}
	};
} );

vi.mock( '../../../lib/utils/automated-tests/getwebpackconfig.js' );

vi.mock( '../../../lib/utils/resolve-path.js', () => ( {
	resolvePath: ( pathToResolve, options ) => path.join( options.paths[ 0 ], 'node_modules', pathToResolve )
} ) );

describe( 'getKarmaConfig()', () => {
	const originalEnv = process.env;
	const karmaConfigOverrides = {
		// A relative path according to the tested file.
		// From: /ckeditor5-dev/packages/ckeditor5-dev-tests/lib/utils/automated-tests/getkarmaconfig.js
		// To: /ckeditor5-dev/packages/ckeditor5-dev-tests/tests/utils/automated-tests/fixtures/karma-config-overrides/*.cjs
		noop: '../../../tests/fixtures/karma-config-overrides/noop.cjs',
		removeCoverage: '../../../tests/fixtures/karma-config-overrides/removecoverage.cjs'
	};

	beforeEach( () => {
		vi.spyOn( process, 'cwd' ).mockReturnValue( 'workspace' );

		process.env = Object.assign( {}, originalEnv, { CI: false } );
	} );

	afterEach( () => {
		process.env = originalEnv;
	} );

	it( 'should return basic karma config for all tested files', () => {
		vi.mocked( getWebpackConfigForAutomatedTests ).mockReturnValue( { webpackConfig: true } );

		const options = {
			files: [ '*' ],
			reporter: 'mocha',
			sourceMap: false,
			coverage: false,
			browsers: [ 'Chrome' ],
			watch: false,
			verbose: false,
			themePath: 'workspace/path/to/theme.css',
			entryFile: 'workspace/entry-file.js',
			globPatterns: {
				'*': 'workspace/packages/ckeditor5-*/tests/**/*.js'
			}
		};

		const karmaConfig = getKarmaConfig( options );

		expect( vi.mocked( getWebpackConfigForAutomatedTests ) ).toHaveBeenCalledExactlyOnceWith( {
			...options,
			files: [
				'workspace/packages/ckeditor5-*/tests/**/*.js'
			]
		} );

		expect( karmaConfig ).toEqual( expect.objectContaining( {
			basePath: 'workspace',
			frameworks: expect.any( Array ),
			files: expect.any( Array ),
			preprocessors: expect.any( Object ),
			webpack: expect.any( Object ),
			webpackMiddleware: expect.any( Object ),
			reporters: expect.any( Array ),
			browsers: expect.any( Array ),
			singleRun: true
		} ) );

		expect( karmaConfig.webpack ).toEqual( expect.objectContaining( {
			webpackConfig: true
		} ) );
	} );

	// See: https://github.com/ckeditor/ckeditor5/issues/8823
	it( 'should define proxies to static assets resources', () => {
		const karmaConfig = getKarmaConfig( {
			files: [ '*' ],
			reporter: 'mocha',
			sourceMap: false,
			coverage: false,
			browsers: [ 'Chrome' ],
			watch: false,
			verbose: false,
			themePath: 'workspace/path/to/theme.css',
			entryFile: 'workspace/entry-file.js',
			globPatterns: {
				'*': 'workspace/packages/ckeditor5-*/tests/**/*.js'
			}
		} );

		expect( karmaConfig ).toEqual( expect.objectContaining( {
			proxies: expect.any( Object ),
			files: expect.any( Array )
		} ) );
		expect( karmaConfig.proxies ).toEqual( expect.objectContaining( {
			'/assets/': expect.any( String ),
			'/example.com/image.png': expect.any( String ),
			'/www.example.com/image.png': expect.any( String )
		} ) );

		expect( karmaConfig.files ).toHaveLength( 2 );
		expect( karmaConfig.files ).toEqual( expect.arrayContaining( [
			'workspace/entry-file.js',
			expect.objectContaining( {
				pattern: expect.stringContaining( 'ckeditor5-utils/tests/_assets/**/*' )
			} )
		] ) );
	} );

	it( 'should contain a list of available plugins', () => {
		const karmaConfig = getKarmaConfig( {
			files: [ '*' ],
			reporter: 'mocha',
			sourceMap: false,
			coverage: false,
			browsers: [ 'Chrome' ],
			watch: false,
			verbose: false,
			themePath: 'workspace/path/to/theme.css',
			entryFile: 'workspace/entry-file.js',
			globPatterns: {
				'*': 'workspace/packages/ckeditor5-*/tests/**/*.js'
			}
		} );

		expect( karmaConfig ).toEqual( expect.objectContaining( {
			files: expect.any( Array )
		} ) );
		expect( karmaConfig.files ).not.toHaveLength( 0 );
	} );

	it( 'should enable webpack watcher when passed the "karmaConfigOverrides" option (execute in Intellij)', () => {
		vi.mocked( getWebpackConfigForAutomatedTests ).mockReturnValue( { watch: null } );

		const karmaConfig = getKarmaConfig( {
			files: [ '*' ],
			reporter: 'mocha',
			karmaConfigOverrides: karmaConfigOverrides.noop,
			globPatterns: {
				'*': 'workspace/packages/ckeditor5-*/tests/**/*.js'
			}
		} );

		expect( karmaConfig.webpack ).toEqual( expect.objectContaining( {
			watch: true
		} ) );
	} );

	it( 'should configure coverage reporter', () => {
		vi.mocked( getWebpackConfigForAutomatedTests ).mockReturnValue( { } );

		const karmaConfig = getKarmaConfig( {
			files: [ '*' ],
			reporter: 'mocha',
			karmaConfigOverrides: karmaConfigOverrides.noop,
			globPatterns: {
				'*': 'workspace/packages/ckeditor5-*/tests/**/*.js'
			},
			coverage: true
		} );

		expect( karmaConfig ).toEqual( expect.objectContaining( {
			reporters: expect.arrayContaining( [ 'coverage' ] ),
			coverageReporter: {
				reporters: expect.any( Array ),
				watermarks: expect.any( Object )
			}
		} ) );
	} );

	it( 'should use `text-summary` reporter for local development', () => {
		vi.mocked( getWebpackConfigForAutomatedTests ).mockReturnValue( { } );

		const karmaConfig = getKarmaConfig( {
			files: [ '*' ],
			reporter: 'mocha',
			karmaConfigOverrides: karmaConfigOverrides.noop,
			globPatterns: {
				'*': 'workspace/packages/ckeditor5-*/tests/**/*.js'
			},
			coverage: true
		} );

		expect( karmaConfig ).toEqual( expect.objectContaining( {
			reporters: expect.arrayContaining( [ 'coverage' ] ),
			coverageReporter: {
				reporters: expect.arrayContaining( [ { type: 'text-summary' } ] ),
				watermarks: expect.any( Object )
			}
		} ) );
	} );

	it( 'should use `text` reporter on CI', () => {
		vi.mocked( getWebpackConfigForAutomatedTests ).mockReturnValue( { } );
		vi.stubEnv( 'CI', true );

		const karmaConfig = getKarmaConfig( {
			files: [ '*' ],
			reporter: 'mocha',
			karmaConfigOverrides: karmaConfigOverrides.noop,
			globPatterns: {
				'*': 'workspace/packages/ckeditor5-*/tests/**/*.js'
			},
			coverage: true
		} );

		expect( karmaConfig ).toEqual( expect.objectContaining( {
			reporters: expect.arrayContaining( [ 'coverage' ] ),
			coverageReporter: {
				reporters: expect.arrayContaining( [ { type: 'text' } ] ),
				watermarks: expect.any( Object )
			}
		} ) );

		vi.unstubAllEnvs();
	} );

	it( 'should remove webpack babel-loader if coverage reporter is removed by overrides', () => {
		vi.mocked( getWebpackConfigForAutomatedTests ).mockReturnValue( {
			module: {
				rules: [
					{
						loader: 'babel-loader'
					},
					{
						loader: 'other-loader'
					}
				]
			}
		} );

		const karmaConfig = getKarmaConfig( {
			files: [ '*' ],
			reporter: 'mocha',
			karmaConfigOverrides: karmaConfigOverrides.removeCoverage,
			globPatterns: {
				'*': 'workspace/packages/ckeditor5-*/tests/**/*.js'
			},
			coverage: true
		} );

		const loaders = karmaConfig.webpack.module.rules.map( rule => rule.loader );

		expect( karmaConfig ).not.toEqual( expect.objectContaining( {
			reporters: expect.arrayContaining( [ 'coverage' ] )
		} ) );

		expect( loaders ).not.toEqual( expect.arrayContaining( [ 'babel-loader' ] ) );
		expect( loaders ).toEqual( expect.arrayContaining( [ 'other-loader' ] ) );
	} );

	it( 'should return custom browser launchers with flags', () => {
		const options = {
			reporter: 'mocha',
			files: [ '*' ],
			globPatterns: {
				'*': 'workspace/packages/ckeditor5-*/tests/**/*.js'
			}
		};

		const karmaConfig = getKarmaConfig( options );

		expect( karmaConfig ).toEqual( expect.objectContaining( {
			customLaunchers: expect.any( Object )
		} ) );

		expect( karmaConfig.customLaunchers ).toEqual( expect.objectContaining( {
			CHROME_CI: expect.objectContaining( {
				base: 'Chrome',
				flags: [
					'--disable-background-timer-throttling',
					'--js-flags="--expose-gc"',
					'--disable-renderer-backgrounding',
					'--disable-backgrounding-occluded-windows',
					'--disable-search-engine-choice-screen',
					'--no-sandbox'
				]
			} )
		} ) );

		expect( karmaConfig.customLaunchers ).toEqual( expect.objectContaining( {
			CHROME_LOCAL: expect.objectContaining( {
				base: 'Chrome',
				flags: [
					'--disable-background-timer-throttling',
					'--js-flags="--expose-gc"',
					'--disable-renderer-backgrounding',
					'--disable-backgrounding-occluded-windows',
					'--disable-search-engine-choice-screen',
					'--remote-debugging-port=9222'
				]
			} )
		} ) );
	} );
} );
