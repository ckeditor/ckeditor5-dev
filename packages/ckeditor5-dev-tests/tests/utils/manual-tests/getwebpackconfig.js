/**
 * @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { loaders } from '@ckeditor/ckeditor5-dev-utils';
import getDefinitionsFromFile from '../../../lib/utils/getdefinitionsfromfile.js';
import getWebpackConfigForManualTests from '../../../lib/utils/manual-tests/getwebpackconfig.js';

const stubs = vi.hoisted( () => ( {
	translations: {
		plugin: {
			constructor: vi.fn()
		}
	}
} ) );

vi.mock( 'webpack', () => ( {
	default: {
		DefinePlugin: class {},
		ProvidePlugin: class {},
		SourceMapDevToolPlugin: class {}
	}
} ) );
vi.mock( '@ckeditor/ckeditor5-dev-utils' );
vi.mock( '@ckeditor/ckeditor5-dev-translations', () => ( {
	CKEditorTranslationsPlugin: class CKEditorTranslationsPlugin {
		constructor( ...args ) {
			stubs.translations.plugin.constructor( ...args );
		}
	}
} ) );
vi.mock( '../../../lib/utils/getdefinitionsfromfile.js' );

describe( 'getWebpackConfigForManualTests()', () => {
	beforeEach( () => {
		vi.mocked( getDefinitionsFromFile ).mockReturnValue( {} );
		vi.mocked( loaders ).getIconsLoader.mockReturnValue( {} );
		vi.mocked( loaders ).getStylesLoader.mockReturnValue( {} );
		vi.mocked( loaders ).getTypeScriptLoader.mockReturnValue( {} );
		vi.mocked( loaders ).getFormattedTextLoader.mockReturnValue( {} );
		vi.mocked( loaders ).getCoverageLoader.mockReturnValue( {} );
		vi.mocked( loaders ).getJavaScriptLoader.mockReturnValue( {} );
	} );

	it( 'should return webpack configuration object', () => {
		const entries = {
			'ckeditor5/tests/manual/all-features': '/home/ckeditor/ckeditor5/tests/manual/all-features.js'
		};
		const buildDir = '/home/ckeditor/ckeditor5/build/.manual-tests';
		const debug = [];

		const webpackConfig = getWebpackConfigForManualTests( {
			entries,
			buildDir,
			debug,
			themePath: '/theme/path',
			tsconfig: '/tsconfig/path'
		} );

		expect( vi.mocked( loaders ).getIconsLoader ).toHaveBeenCalledExactlyOnceWith( {
			matchExtensionOnly: true
		} );
		expect( vi.mocked( loaders ).getStylesLoader ).toHaveBeenCalledExactlyOnceWith( {
			themePath: '/theme/path',
			sourceMap: true
		} );

		expect( vi.mocked( loaders ).getTypeScriptLoader ).toHaveBeenCalledExactlyOnceWith( {
			debugFlags: debug,
			configFile: '/tsconfig/path',
			includeDebugLoader: true
		} );

		expect( vi.mocked( loaders ).getFormattedTextLoader ).toHaveBeenCalledOnce();

		expect( vi.mocked( loaders ).getJavaScriptLoader ).toHaveBeenCalledExactlyOnceWith( {
			debugFlags: debug
		} );

		expect( vi.mocked( loaders ).getCoverageLoader ).not.toHaveBeenCalledOnce();

		expect( webpackConfig ).toEqual( expect.objectContaining( {
			// To avoid "eval()" in files.
			mode: 'none',
			entry: entries,
			output: {
				path: buildDir
			},
			plugins: expect.any( Array ),
			watch: true,
			resolve: expect.any( Object )
		} ) );

		expect( webpackConfig.resolve.fallback.timers ).to.equal( false );

		// The `devtool` property has been replaced by the `SourceMapDevToolPlugin()`.
		expect( webpackConfig ).to.not.have.property( 'devtool' );
	} );

	it( 'should disable watcher mechanism when passing the "disableWatch" option', () => {
		const webpackConfig = getWebpackConfigForManualTests( { disableWatch: true } );

		expect( webpackConfig ).to.be.an( 'object' );
		expect( webpackConfig ).to.not.have.property( 'devtool' );
		expect( webpackConfig ).to.not.have.property( 'watch' );
	} );

	it( 'pattern passed to CKEditorTranslationsPlugin should match paths to ckeditor5 packages', () => {
		const webpackConfig = getWebpackConfigForManualTests( { disableWatch: true } );

		expect( stubs.translations.plugin.constructor ).toHaveBeenCalledOnce();

		const CKEditorTranslationsPlugin = webpackConfig.plugins.find( plugin => plugin.constructor.name === 'CKEditorTranslationsPlugin' );

		expect( CKEditorTranslationsPlugin ).toBeTruthy();

		const [ firstCall ] = stubs.translations.plugin.constructor.mock.calls;
		const [ firstArg ] = firstCall;
		const { packageNamesPattern: pattern } = firstArg;

		expect( 'packages/ckeditor5-foo/bar'.match( pattern )[ 0 ] ).to.equal( 'packages/ckeditor5-foo/' );
	} );

	it( 'pattern passed to CKEditorTranslationsPlugin should match paths to external repositories named like ckeditor5 package', () => {
		const webpackConfig = getWebpackConfigForManualTests( { disableWatch: true } );

		expect( stubs.translations.plugin.constructor ).toHaveBeenCalledOnce();

		const CKEditorTranslationsPlugin = webpackConfig.plugins.find( plugin => plugin.constructor.name === 'CKEditorTranslationsPlugin' );

		expect( CKEditorTranslationsPlugin ).toBeTruthy();

		const [ firstCall ] = stubs.translations.plugin.constructor.mock.calls;
		const [ firstArg ] = firstCall;
		const { packageNamesPattern: pattern } = firstArg;

		expect( 'external/ckeditor5-foo/packages/ckeditor5-bar/baz'.match( pattern )[ 0 ] ).to.equal( 'packages/ckeditor5-bar/' );
	} );

	it( 'should load TypeScript files first when importing JS files', () => {
		const entries = {
			'ckeditor5/tests/manual/all-features': '/home/ckeditor/ckeditor5/tests/manual/all-features.js'
		};

		const buildDir = '/home/ckeditor/ckeditor5/build/.manual-tests';

		const debug = [];

		const webpackConfig = getWebpackConfigForManualTests( {
			entries,
			buildDir,
			debug,
			themePath: '/theme/path',
			tsconfig: '/tsconfig/path'
		} );

		expect( webpackConfig.resolve.extensionAlias ).to.be.an( 'object' );
		expect( webpackConfig.resolve.extensionAlias[ '.js' ] ).to.be.an( 'array' );
		expect( webpackConfig.resolve.extensionAlias[ '.js' ] ).to.deep.equal( [
			'.ts',
			'.js'
		] );
	} );
} );
