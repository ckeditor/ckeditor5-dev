/**
 * @license Copyright (c) 2003-2015, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

/* global describe, it, beforeEach, afterEach, after, before */

'use strict';

const gulp = require( 'gulp' );
const chai = require( 'chai' );
const expect = chai.expect;
const sinon = require( 'sinon' );
const path = require( 'path' );
const { tools, bundler } = require( '@ckeditor/ckeditor5-dev-utils' );
const compiler = require( '@ckeditor/ckeditor5-dev-compiler' );
const utils = require( '../lib/utils' );
const mockery = require( 'mockery' );
const mkdirp = require( 'mkdirp' );
const fs = require( 'fs' );
const rollup = require( 'rollup' );

describe( 'bundle-tasks', () => {
	let tasks;
	let sandbox;

	before( () => {
		mockery.enable( {
			warnOnReplace: true,
			warnOnUnregistered: false
		} );
		mockery.registerMock( 'gulp-uglify', () => {} );
		mockery.registerMock( 'gulp-cssnano', () => {} );
		mockery.registerMock( 'rollup-plugin-babel', config => config );

		tasks = require( '../lib/tasks' );
	} );

	after( () => {
		mockery.disable();
		mockery.deregisterAll();
	} );

	beforeEach( () => {
		sandbox = sinon.sandbox.create();
	} );

	afterEach( () => {
		sandbox.restore();
	} );

	describe( 'build()', () => {
		it( 'should run generateWithEntryPoint when entryPoint is specified', () => {
			sandbox.stub( utils, 'cleanFiles' );
			sandbox.stub( tasks, '_compile' ) ;
			const generateWithEntryPoint = sandbox.stub( tasks, '_generateBundleWithEntryPoint' ) ;
			const generateWithoutEntryPoint = sandbox.stub( tasks, '_generateBundleWithoutEntryPoint' ) ;
			sandbox.stub( tasks, '_minify' ) ;
			sandbox.stub( tasks, '_showSummary' );
			sandbox.stub( utils, 'maybeCleanDir' );

			const promise = tasks.build( {
				buildConfig: {
					entryPoint: 'a',
				},
			} );

			return promise.then( () => {
				expect( generateWithEntryPoint.called ).to.be.eq( true );
				expect( generateWithoutEntryPoint.called ).to.be.eq( false );
			} );
		} );
	} );

	describe( 'compile()', () => {
		it( 'should compile packages', () => {
			sandbox.stub( compiler.tasks, 'compile', config => config );

			const result = tasks._compile( 'sourceBuildDir', [ 'package1' ] );

			expect( result.formats.esnext ).to.be.equal( 'sourceBuildDir' );
			expect( result.packages ).to.deep.equal( [ 'package1' ] );
		} );
	} );

	describe( '_generateBundleWithEntryPoint', () => {
		it( 'should generate bundle nad use existing entry point', () => {
			sandbox.stub( tasks, '_generateJsBundle', config => Promise.resolve( config ) );
			sandbox.stub( tasks, '_generateCssBundle', config => Promise.resolve( config ) );
			sandbox.stub( path, 'join', ( ...args ) => args.join( '/' ) );

			const promise = tasks._generateBundleWithEntryPoint( {
				rollupOptions: {
					moduleName: 'moduleName',
				},
				destinationPath: 'destinationPath',
				entryPoint: 'entryPoint',
			}, 'sourceBuildDir', 'fileName' );

			return promise.then( ( [ jsBundle, cssBundle ] ) => {
				expect( jsBundle ).to.deep.equal( {
					filePath: 'destinationPath/fileName',
					entryPoint: 'entryPoint',
					rollupOptions: {
						moduleName: 'moduleName',
					},
				} );

				expect( cssBundle ).to.deep.equal( {
					sourceBuildDir: 'sourceBuildDir',
					fileName: 'fileName',
					filePath: 'destinationPath/fileName',
				} );
			} );
		} );
	} );

	describe( '_generateBundleWithoutEntryPoint()', () => {
		it( 'should create entry point and generate bundle', () => {
			sandbox.stub( tasks, '_generateJsBundle', config => Promise.resolve( config ) );
			sandbox.stub( tasks, '_generateCssBundle', config => Promise.resolve( config ) );
			sandbox.stub( tasks, '_saveLocallyTemporaryEntryFile', () => ( {
				temporaryEntryFilePath: 'tempEntryPoint',
				bundleTmpDir: 'bundleTemp',
			} ) );
			sandbox.stub( path, 'join', ( ...args ) => args.join( '/' ) );

			const promise = tasks._generateBundleWithoutEntryPoint( {
				rollupOptions: {
					moduleName: 'moduleName',
				},
				destinationPath: 'destinationPath',
				editor: 'editor',
				plugins: [],
			}, 'sourceBuildDir', 'fileName' );

			return promise.then( ( [ jsBundle, cssBundle ] ) => {
				expect( jsBundle ).to.deep.equal( {
					filePath: 'destinationPath/fileName',
					entryPoint: 'tempEntryPoint',
					bundleTmpDir: 'bundleTemp',
					rollupOptions: {
						moduleName: 'moduleName',
					},
				} );

				expect( cssBundle ).to.deep.equal( {
					sourceBuildDir: 'sourceBuildDir',
					fileName: 'fileName',
					filePath: 'destinationPath/fileName',
				} );
			} );
		} );
	} );

	describe( '_saveLocallyTemporaryEntryFile()', () => {
		it( 'should create temporary file with given name', () => {
			sandbox.stub( mkdirp, 'sync' );
			sandbox.stub( fs, 'mkdtempSync', path => path + 'temp' );
			sandbox.stub( path, 'join', ( x, y ) => x + '/' + y );
			sandbox.stub( path, 'sep', '/' );
			const createEntryFileStub = sandbox.stub( bundler, 'createEntryFile' );

			const result = tasks._saveLocallyTemporaryEntryFile( {
				destinationPath: 'destinationPath',
				moduleName: 'moduleName',
				sourceBuildDir: 'sourceBuildDir',
				editor: 'editor',
				plugins: [ 'plugin1' ],
			} );

			expect( result.temporaryEntryFilePath ).to.deep.eq( 'destinationPath/temp/entryfile.js' );
			expect( result.bundleTmpDir ).to.deep.eq( 'destinationPath/temp' );
			expect( createEntryFileStub.calledOnce ).to.equal( true );
			expect( createEntryFileStub.firstCall.args[ 0 ] ).to.equal( 'destinationPath/temp/entryfile.js' );
			expect( createEntryFileStub.firstCall.args[ 1 ] ).to.deep.equal( {
				moduleName: 'moduleName',
				editor: 'editor',
				plugins: [ 'plugin1' ]
			} );
		} );
	} );

	describe( '_generateJsBundle()', () => {
		it( 'should create js bundle', () => {
			sandbox.stub( tasks, '_rollupBundle' );
			sandbox.stub( tasks, '_writeBundle' );
			sandbox.stub( utils, 'maybeCleanDir' );
			const handleRollupErrorStub = sandbox.stub( tasks, '_handleRollupError' );

			const promise = tasks._generateJsBundle( {} );
			sinon.assert.notCalled( handleRollupErrorStub );

			return promise;
		} );
	} );

	describe( '_generateCssBundle', () => {
		it( 'should copy css files', () => {
			sandbox.stub( path, 'join', ( ...args ) => args.join( '/' ) );
			sandbox.stub( path, 'dirname', x => x.split( '/' ).slice( 0, -1 ).join( '/' ) );
			sandbox.stub( tools, 'copyFile', ( source, dest ) => Promise.resolve( { source, dest } ) );

			const promise = tasks._generateCssBundle( {
				sourceBuildDir: 'sourceBuildDir',
				fileName: 'fileName',
				filePath: 'path/to/file',
			} );

			return promise.then( result => {
				expect( result.source ).to.be.eq( 'sourceBuildDir/theme/ckeditor.css' );
				expect( result.dest ).to.be.eq( 'path/to/fileName.css' );
			} );
		} );
	} );

	describe( '_rollupBundle()', () => {
		it( 'should create js bundle', () => {
			sandbox.stub( rollup, 'rollup', config => Promise.resolve( config ) );
			const promise = tasks._rollupBundle( 'entryPoint' );

			return promise.then( result => {
				expect( result.entry ).to.be.eq( 'entryPoint' );
				expect( result.plugins[0].presets ).to.be.an( 'array' );
				expect( result.plugins[0].plugins ).to.be.an( 'array' );
			} );
		} );
	} );

	describe( '_writeBundle()', () => {
		it( 'should write bundle to the specific place', () => {
			const spy = sandbox.spy();

			tasks._writeBundle( {
				bundle: { write: spy },
				rollupOptions: {
					format: 'umd',
					moduleName: 'moduleName',
				},
				filePath: 'filePath',
			} );

			sinon.assert.calledWithExactly( spy, {
				dest: 'filePath.js',
				format: 'umd',
				moduleName: 'moduleName',
			} );
		} );

		it( 'should write bundle with default iife format', () => {
			const spy = sandbox.spy();

			tasks._writeBundle( {
				bundle: { write: spy },
				rollupOptions: {
					moduleName: 'moduleName',
				},
				filePath: 'filePath',
			} );

			sinon.assert.calledWithExactly( spy, {
				dest: 'filePath.js',
				format: 'iife',
				moduleName: 'moduleName',
			} );
		} );
	} );

	describe( '_minify()', ( ) => {
		it( 'should minify js and css', () => {
			const stream1 = gulp.src( [] );
			const stream2 = gulp.src( [] );

			sandbox.stub( tasks, '_minifyJs', text => {
				expect( text ).to.equal( 'destinationPath/fileName' );

				return stream1;
			} );

			sandbox.stub( tasks, '_minifyCss', text => {
				expect( text ).to.equal( 'destinationPath/fileName' );

				return stream2;
			} );
			sandbox.stub( path, 'join', ( ...args ) => args.join( '/' ) );

			return tasks._minify( 'destinationPath', 'fileName' );
		} );
	} );

	describe( '_minifyJs', () => {
		it( 'should minify js file', () => {
			sandbox.stub( gulp, 'src', () => ( {
				pipe: () => {}
			} ) );
			sandbox.stub( path, 'dirname', path => path.split( '/' ).slice( 0, -1 ).join( '/' ) );
			const saveMinified = sandbox.stub( utils, 'saveFileFromStreamAsMinified', path => path );

			tasks._minifyJs( 'path/to/editor' );

			expect( saveMinified.calledWithExactly( undefined, 'path/to' ) ).to.be.eq( true );
		} );
	} );

	describe( '_minifyCss', () => {
		it( 'should minify css file', () => {
			sandbox.stub( gulp, 'src', () => ( {
				pipe: () => {}
			} ) );
			sandbox.stub( path, 'dirname', path => path.split( '/' ).slice( 0, -1 ).join( '/' ) );
			const saveMinified = sandbox.stub( utils, 'saveFileFromStreamAsMinified' );

			tasks._minifyCss( 'path/to/editor' );

			expect( saveMinified.calledWithExactly( undefined, 'path/to' ) ).to.be.eq( true );
		} );
	} );

	describe( '_showSummary()', () => {
		it( 'should show file stats', ( done ) => {
			const fileStats = {
				'editor.js': { size: 123 },
				'editor.css': { size: 50 },
				'editor.min.js': { size: 12 },
				'editor.min.css': { size: 10 },
			};

			sandbox.stub( utils, 'getFilesSizeStats', ( files ) => {
				return files.map( fileName => ( {
					name: fileName,
					size: fileStats[ fileName ].size,
				} ) );
			} );

			sandbox.stub( utils, 'showFilesSummary', ( text, stats ) => {
				expect( stats ).to.deep.equal( [
					{ name: 'editor.js', size: 123 },
					{ name: 'editor.css', size: 50 },
					{ name: 'editor.min.js', size: 12 },
					{ name: 'editor.min.css', size: 10 },
				] );
				done();
			} );

			tasks._showSummary( 'destinationPath', 'editor' );
		} );
	} );
} );
