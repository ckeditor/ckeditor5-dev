/**
 * @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';
import fs from 'node:fs';
import getDllPluginWebpackConfig from '../../src/builds/getdllpluginwebpackconfig.js';
import { getIconsLoader, getStylesLoader, getTypeScriptLoader } from '../../src/loaders/index.js';

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

vi.mock( '../../src/loaders/index.js' );
vi.mock( '../../src/bundler/index.js' );
vi.mock( 'fs' );
vi.mock( 'path', () => ( {
	default: {
		join: vi.fn( ( ...chunks ) => chunks.join( '/' ) ),
		dirname: vi.fn()
	}
} ) );
vi.mock( '@ckeditor/ckeditor5-dev-translations', () => ( {
	CKEditorTranslationsPlugin: class CKEditorTranslationsPlugin {
		protected readonly name: string;

		constructor( ...args: Array<unknown> ) {
			this.name = 'CKEditorTranslationsPlugin';

			stubs.CKEditorTranslationsPlugin.constructor( ...args );
		}
	}
} ) );
vi.mock( 'terser-webpack-plugin', () => ( {
	default: class TerserPlugin {
		constructor( ...args: Array<unknown> ) {
			stubs.TerserPlugin.constructor( ...args );
		}
	}
} ) );

describe( 'getDllPluginWebpackConfig()', () => {
	beforeEach( () => {
		vi.mocked( fs ).readFileSync.mockImplementation( input => {
			if ( input === '/manifest/path' ) {
				return JSON.stringify( stubs.manifest );
			}

			if ( input === '/package/html-embed/package.json' ) {
				return JSON.stringify( {
					name: '@ckeditor/ckeditor5-html-embed'
				} );
			}

			return JSON.stringify( {
				name: '@ckeditor/ckeditor5-dev'
			} );
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
		expect( webpackConfig.optimization.minimizer!.length ).to.equal( 1 );

		// Due to versions mismatch, the `instanceof` check does not pass.
		expect( webpackConfig.optimization.minimizer!.at( 0 )!.constructor.name ).to.equal( 'TerserPlugin' );
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

		expect( 'libraryExport' in webpackConfig.output ).to.be.false;
	} );

	it( 'uses index.ts entry file by default', async () => {
		vi.mocked( fs ).existsSync.mockImplementation( file => file === '/package/path/src/index.ts' );

		const webpackConfig = await getDllPluginWebpackConfig( stubs.webpack, {
			packagePath: '/package/path',
			themePath: '/theme/path',
			manifestPath: '/manifest/path'
		} );

		expect( webpackConfig.entry ).to.equal( '/package/path/src/index.ts' );
	} );

	it( 'uses index.js entry file if exists (over its TS version)', async () => {
		vi.mocked( fs ).existsSync.mockImplementation( file => file === '/package/path/src/index.js' );

		const webpackConfig = await getDllPluginWebpackConfig( stubs.webpack, {
			packagePath: '/package/path',
			themePath: '/theme/path',
			manifestPath: '/manifest/path'
		} );

		expect( webpackConfig.entry ).to.equal( '/package/path/src/index.js' );
	} );

	it( 'loads JavaScript files over TypeScript when building for a JavaScript package', async () => {
		vi.mocked( fs ).existsSync.mockImplementation( file => file === '/package/path/src/index.js' );

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
			vi.mocked( fs ).existsSync.mockReturnValue( true );

			const webpackConfig = await getDllPluginWebpackConfig( stubs.webpack, {
				packagePath: '/package/path',
				themePath: '/theme/path',
				manifestPath: '/manifest/path'
			} );

			// Due to versions mismatch, the `instanceof` check does not pass.
			const ckeditor5TranslationsPlugin = webpackConfig.plugins
				.find( plugin => plugin.constructor.name === 'CKEditorTranslationsPlugin' );

			expect( ckeditor5TranslationsPlugin ).to.not.be.undefined;

			expect( stubs.CKEditorTranslationsPlugin.constructor ).toHaveBeenCalledExactlyOnceWith( expect.objectContaining( {
				language: 'en',
				additionalLanguages: 'all',
				skipPluralFormFunction: true
			} ) );

			const [ firstCall ] = stubs.CKEditorTranslationsPlugin.constructor.mock.calls;
			const { sourceFilesPattern } = firstCall!.at( 0 )!;

			expect( 'src/bold.js' ).to.match( sourceFilesPattern );
			expect( 'src/bold.ts' ).to.match( sourceFilesPattern );
			expect( 'ckeditor5-basic-styles/src/bold.js' ).to.not.match( sourceFilesPattern );
			expect( 'ckeditor5-basic-styles/src/bold.ts' ).to.not.match( sourceFilesPattern );
		} );

		it( 'does not load the CKEditorTranslationsPlugin plugin when lang dir does not exist', async () => {
			vi.mocked( fs ).existsSync.mockReturnValue( false );

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
				await getDllPluginWebpackConfig( stubs.webpack, {
					packagePath: '/package/path',
					themePath: '/theme/path',
					manifestPath: '/manifest/path'
				} );

				expect( vi.mocked( getTypeScriptLoader ) ).toHaveBeenCalledExactlyOnceWith( {
					configFile: 'tsconfig.json'
				} );
			} );

			it( 'it should the specified "options.tsconfigPath" value', async () => {
				await getDllPluginWebpackConfig( stubs.webpack, {
					packagePath: '/package/path',
					themePath: '/theme/path',
					manifestPath: '/manifest/path',
					tsconfigPath: '/config/tsconfig.json'
				} );

				expect( vi.mocked( getTypeScriptLoader ) ).toHaveBeenCalledExactlyOnceWith( {
					configFile: '/config/tsconfig.json'
				} );
			} );
		} );

		describe( 'getIconsLoader()', () => {
			it( 'it should get the loader', async () => {
				await getDllPluginWebpackConfig( stubs.webpack, {
					packagePath: '/package/path',
					themePath: '/theme/path',
					manifestPath: '/manifest/path'
				} );

				expect( vi.mocked( getIconsLoader ) ).toHaveBeenCalledExactlyOnceWith( {
					matchExtensionOnly: true
				} );
			} );
		} );

		describe( 'getStylesLoader()', () => {
			it( 'it should get the loader', async () => {
				await getDllPluginWebpackConfig( stubs.webpack, {
					packagePath: '/package/path',
					themePath: '/theme/path',
					manifestPath: '/manifest/path'
				} );

				expect( vi.mocked( getStylesLoader ) ).toHaveBeenCalledExactlyOnceWith( {
					minify: true,
					themePath: '/theme/path'
				} );
			} );
		} );
	} );
} );
