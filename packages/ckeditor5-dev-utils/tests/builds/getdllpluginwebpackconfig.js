/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';
import fs from 'fs-extra';
import getDllPluginWebpackConfig from '../../lib/builds/getdllpluginwebpackconfig.js';
import { getLicenseBanner } from '../../lib/bundler/index.js';
import { getIconsLoader, getStylesLoader, getTypeScriptLoader } from '../../lib/loaders/index.js';

const stubs = vi.hoisted( () => ( {
	CKEditorTranslationsPlugin: {
		constructor: vi.fn()
	},
	TerserPlugin: {
		constructor: vi.fn()
	},
	webpack: {
		BannerPlugin: vi.fn(),
		DllReferencePlugin: vi.fn()
	},
	manifest: {
		content: {
			'../../node_modules/lodash-es/_DataView.js': {
				id: '../../node_modules/lodash-es/_DataView.js',
				buildMeta: {
					buildMeta: 'namespace',
					providedExports: [
						'default'
					]
				}
			}
		}
	}
} ) );

vi.mock( '../../lib/loaders/index.js' );
vi.mock( '../../lib/bundler/index.js' );
vi.mock( 'fs-extra' );
vi.mock( 'path', () => ( {
	default: {
		join: vi.fn( ( ...chunks ) => chunks.join( '/' ) )
	}
} ) );
vi.mock( '@ckeditor/ckeditor5-dev-translations', () => ( {
	CKEditorTranslationsPlugin: class {
		constructor( ...args ) {
			stubs.CKEditorTranslationsPlugin.constructor( ...args );
		}
	}
} ) );
vi.mock( 'terser-webpack-plugin', () => ( {
	default: class TerserPluginMock {
		constructor( ...args ) {
			stubs.TerserPlugin.constructor( ...args );
		}
	}
} ) );

describe( 'builds/getDllPluginWebpackConfig()', () => {
	beforeEach( () => {
		vi.mocked( fs ).readJsonSync.mockImplementation( input => {
			if ( input === '/manifest/path' ) {
				return stubs.manifest;
			}

			if ( input === '/package/html-embed/package.json' ) {
				return {
					name: '@ckeditor/ckeditor5-html-embed'
				};
			}

			return {
				name: '@ckeditor/ckeditor5-dev'
			};
		} );
	} );

	it( 'returns the webpack configuration in production mode by default', async () => {
		const webpackConfig = await getDllPluginWebpackConfig( stubs.webpack, {
			packagePath: '/package/path',
			themePath: '/theme/path',
			manifestPath: '/manifest/path'
		} );

		expect( webpackConfig ).to.be.an( 'object' );

		expect( webpackConfig.mode ).to.equal( 'production' );

		expect( webpackConfig.entry ).to.equal( '/package/path/src/index.ts' );
		expect( webpackConfig.output.library ).to.deep.equal( [ 'CKEditor5', 'dev' ] );
		expect( webpackConfig.output.path ).to.equal( '/package/path/build' );
		expect( webpackConfig.output.filename ).to.equal( 'dev.js' );
		expect( webpackConfig.plugins ).to.be.an( 'array' );

		expect( webpackConfig.optimization.minimize ).to.equal( true );
		expect( webpackConfig.optimization.minimizer ).to.be.an( 'array' );
		expect( webpackConfig.optimization.minimizer.length ).to.equal( 1 );

		// Due to versions mismatch, the `instanceof` check does not pass.
		expect( webpackConfig.optimization.minimizer[ 0 ].constructor.name ).to.equal( 'TerserPluginMock' );
	} );

	it( 'transforms package with many dashes in its name', async () => {
		const webpackConfig = await getDllPluginWebpackConfig( stubs.webpack, {
			packagePath: '/package/html-embed',
			themePath: '/theme/path',
			manifestPath: '/manifest/path'
		} );

		expect( webpackConfig ).to.be.an( 'object' );
		expect( webpackConfig.output.library ).to.deep.equal( [ 'CKEditor5', 'htmlEmbed' ] );
		expect( webpackConfig.output.filename ).to.equal( 'html-embed.js' );
	} );

	it( 'does not minify the destination file when in dev mode', async () => {
		const webpackConfig = await getDllPluginWebpackConfig( stubs.webpack, {
			packagePath: '/package/path',
			themePath: '/theme/path',
			manifestPath: '/manifest/path',
			isDevelopmentMode: true
		} );

		expect( webpackConfig.mode ).to.equal( 'development' );
		expect( webpackConfig.optimization.minimize ).to.equal( false );
		expect( webpackConfig.optimization.minimizer ).to.be.undefined;
	} );

	it( 'should not export any library by default', async () => {
		const webpackConfig = await getDllPluginWebpackConfig( stubs.webpack, {
			packagePath: '/package/path',
			themePath: '/theme/path',
			manifestPath: '/manifest/path'
		} );

		expect( webpackConfig.output.libraryExport ).to.be.undefined;
	} );

	it( 'uses index.ts entry file by default', async () => {
		vi.mocked( fs ).existsSync.mockImplementation( file => file == '/package/path/src/index.ts' )

		const webpackConfig = await getDllPluginWebpackConfig( stubs.webpack, {
			packagePath: '/package/path',
			themePath: '/theme/path',
			manifestPath: '/manifest/path'
		} );

		expect( webpackConfig.entry ).to.equal( '/package/path/src/index.ts' );
	} );

	it( 'uses index.js entry file if exists (over its TS version)', async () => {
		vi.mocked( fs ).existsSync.mockImplementation( file => file == '/package/path/src/index.js' );

		const webpackConfig = await getDllPluginWebpackConfig( stubs.webpack, {
			packagePath: '/package/path',
			themePath: '/theme/path',
			manifestPath: '/manifest/path'
		} );

		expect( webpackConfig.entry ).to.equal( '/package/path/src/index.js' );
	} );

	it( 'loads JavaScript files over TypeScript when building for a JavaScript package', async () => {
		vi.mocked( fs ).existsSync.mockImplementation( file => file == '/package/path/src/index.js' );

		const webpackConfig = await getDllPluginWebpackConfig( stubs.webpack, {
			packagePath: '/package/path',
			themePath: '/theme/path',
			manifestPath: '/manifest/path'
		} );

		expect( webpackConfig.resolve.extensions[ 0 ] ).to.equal( '.js' );
	} );

	describe( '#plugins', () => {
		it( 'loads the webpack.DllReferencePlugin plugin', async () => {
			const webpackConfig = await getDllPluginWebpackConfig( stubs.webpack, {
				packagePath: '/package/path',
				themePath: '/theme/path',
				manifestPath: '/manifest/path'
			} );

			const dllReferencePlugin = webpackConfig.plugins.find( plugin => plugin instanceof stubs.webpack.DllReferencePlugin );

			expect( dllReferencePlugin ).to.be.an.instanceOf( stubs.webpack.DllReferencePlugin );
			expect( stubs.webpack.DllReferencePlugin ).toHaveBeenCalledExactlyOnceWith( {
				manifest: stubs.manifest,
				scope: 'ckeditor5/src',
				name: 'CKEditor5.dll'
			} );
		} );

		it( 'loads the CKEditorTranslationsPlugin plugin when lang dir exists', async () => {
			stubs.fs.existsSync.returns( true );

			const webpackConfig = await getDllPluginWebpackConfig( stubs.webpack, {
				packagePath: '/package/path',
				themePath: '/theme/path',
				manifestPath: '/manifest/path'
			} );

			// Due to versions mismatch, the `instanceof` check does not pass.
			const ckeditor5TranslationsPlugin = webpackConfig.plugins
				.find( plugin => plugin.constructor.name === 'CKEditorTranslationsPlugin' );

			expect( ckeditor5TranslationsPlugin ).to.not.be.undefined;
			expect( ckeditor5TranslationsPlugin.options.language ).to.equal( 'en' );
			expect( ckeditor5TranslationsPlugin.options.additionalLanguages ).to.equal( 'all' );
			expect( ckeditor5TranslationsPlugin.options.skipPluralFormFunction ).to.equal( true );
			expect( 'src/bold.js' ).to.match( ckeditor5TranslationsPlugin.options.sourceFilesPattern );
			expect( 'src/bold.ts' ).to.match( ckeditor5TranslationsPlugin.options.sourceFilesPattern );
			expect( 'ckeditor5-basic-styles/src/bold.js' ).to.not.match( ckeditor5TranslationsPlugin.options.sourceFilesPattern );
			expect( 'ckeditor5-basic-styles/src/bold.ts' ).to.not.match( ckeditor5TranslationsPlugin.options.sourceFilesPattern );
		} );

		it( 'does not load the CKEditorTranslationsPlugin plugin when lang dir does not exist', async () => {
			stubs.fs.existsSync.returns( false );

			const webpackConfig = await getDllPluginWebpackConfig( stubs.webpack, {
				packagePath: '/package/path',
				themePath: '/theme/path',
				manifestPath: '/manifest/path'
			} );

			// Due to versions mismatch, the `instanceof` check does not pass.
			const ckeditor5TranslationsPlugin = webpackConfig.plugins
				.find( plugin => plugin.constructor.name === 'CKEditorTranslationsPlugin' );

			expect( ckeditor5TranslationsPlugin ).to.be.undefined;
		} );
	} );

	describe( '#loaders', () => {
		describe( 'getTypeScriptLoader()', () => {
			it( 'it should use the default tsconfig.json if the "options.tsconfigPath" option is not specified', async () => {
				getDllPluginWebpackConfig( stubs.webpack, {
					packagePath: '/package/path',
					themePath: '/theme/path',
					manifestPath: '/manifest/path'
				} );

				expect( stubs.loaders.getTypeScriptLoader.calledOnce ).to.equal( true );

				const options = stubs.loaders.getTypeScriptLoader.firstCall.args[ 0 ];
				expect( options ).to.have.property( 'configFile', 'tsconfig.json' );
			} );

			it( 'it should the specified "options.tsconfigPath" value', async () => {
				getDllPluginWebpackConfig( stubs.webpack, {
					packagePath: '/package/path',
					themePath: '/theme/path',
					manifestPath: '/manifest/path',
					tsconfigPath: '/config/tsconfig.json'
				} );

				expect( stubs.loaders.getTypeScriptLoader.calledOnce ).to.equal( true );

				const options = stubs.loaders.getTypeScriptLoader.firstCall.args[ 0 ];
				expect( options ).to.have.property( 'configFile', '/config/tsconfig.json' );
			} );
		} );

		describe( 'getIconsLoader()', () => {
			it( 'it should get the loader', async () => {
				getDllPluginWebpackConfig( stubs.webpack, {
					packagePath: '/package/path',
					themePath: '/theme/path',
					manifestPath: '/manifest/path'
				} );

				expect( stubs.loaders.getIconsLoader.calledOnce ).to.equal( true );

				const options = stubs.loaders.getIconsLoader.firstCall.args[ 0 ];
				expect( options ).to.have.property( 'matchExtensionOnly', true );
			} );
		} );

		describe( 'getStylesLoader()', () => {
			it( 'it should get the loader', async () => {
				getDllPluginWebpackConfig( stubs.webpack, {
					packagePath: '/package/path',
					themePath: '/theme/path',
					manifestPath: '/manifest/path'
				} );

				expect( stubs.loaders.getStylesLoader.calledOnce ).to.equal( true );

				const options = stubs.loaders.getStylesLoader.firstCall.args[ 0 ];
				expect( options ).to.have.property( 'minify', true );
				expect( options ).to.have.property( 'themePath', '/theme/path' );
			} );
		} );
	} );
} );
