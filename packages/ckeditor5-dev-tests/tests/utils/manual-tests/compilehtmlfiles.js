/**
 * @license Copyright (c) 2003-2017, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

/* jshint mocha:true */

'use strict';

const mockery = require( 'mockery' );
const sinon = require( 'sinon' );
const path = require( 'path' );
const commonmark = require( 'commonmark' );
const fs = require( 'fs-extra' );
const chokidar = require( 'chokidar' );
const gutil = require( 'gulp-util' );

describe( 'compileHtmlFiles', () => {
	let sandbox;

	beforeEach( () => {
		mockery.enable( {
			warnOnReplace: false,
			warnOnUnregistered: false
		} );
		sandbox = sinon.sandbox.create();
	} );

	afterEach( () => {
		sandbox.restore();
		mockery.disable();
		mockery.deregisterAll();
	} );

	it( 'should compile md and html files to the output html file', () => {
		const fakeDirname = path.dirname( require.resolve( '../../../lib/utils/manual-tests/compilehtmlfiles' ) );
		const files = {
			[ path.join( fakeDirname, 'template.html' ) ]: '<div>template html content</div>',
			[ path.join( 'path', 'to', 'file.md' ) ]: '##Markdown header',
			[ path.join( 'path', 'to', 'file.html' ) ]: '<div>html file content</div>'
		};

		const patternFiles = {
			[ path.join( 'manualTestPattern', '*.md' ) ]: [
				path.join( 'path', 'to', 'file.md' )
			],
			[ path.join( 'path', 'to', '**', '*.!(js|html|md)' ) ]: [ 'static-file.png' ],
		};

		const mdParserSpy = sandbox.spy();
		const htmlRendererSpy = sandbox.spy( () => '<h2>Markdown header</h2>' );
		const getRelativeFilePathSpy = sandbox.spy( pathToFile => pathToFile );
		const readFileSyncSpy = sandbox.spy( ( pathToFile ) => files[ pathToFile ] );
		const globSyncSpy = sandbox.spy( ( pattern ) => patternFiles[ pattern ] );

		sandbox.stub( commonmark, 'Parser', sinon.spy( function() {
			return {
				parse( content ) {
					return mdParserSpy( content );
				}
			};
		} ) );

		sandbox.stub( commonmark, 'HtmlRenderer', sinon.spy( function() {
			return {
				render( content ) {
					return htmlRendererSpy( content );
				}
			};
		} ) );

		sandbox.stub( gutil, 'colors', { cyan: text => text } );
		sandbox.stub( fs, 'readFileSync', readFileSyncSpy );

		const ensureDirSyncStub = sandbox.stub( fs, 'ensureDirSync' );
		const outputFileSyncStub = sandbox.stub( fs, 'outputFileSync' );
		const copySyncStub = sandbox.stub( fs, 'copySync' );
		const chokidarWatchStub = sandbox.stub( chokidar, 'watch', () => ( { on: () => {} } ) );

		mockery.registerMock( '../getrelativefilepath', getRelativeFilePathSpy );
		mockery.registerMock( '../glob', globSyncSpy );
		mockery.registerMock( 'dom-combiner', ( ...args ) => args.join( '\n' ) );
		mockery.registerMock( '@ckeditor/ckeditor5-dev-utils', {
			logger: () => ( {
				info() { }
			} )
		} );

		const compileHtmlFiles = require( '../../../lib/utils/manual-tests/compilehtmlfiles' );
		compileHtmlFiles( 'buildDir', 'manualTestPattern' );

		sinon.assert.calledWithExactly( readFileSyncSpy, path.join( fakeDirname, 'template.html' ), 'utf-8' );
		sinon.assert.calledWithExactly( readFileSyncSpy, path.join( 'path', 'to', 'file.md' ), 'utf-8' );
		sinon.assert.calledWithExactly( readFileSyncSpy, path.join( 'path', 'to', 'file.html' ), 'utf-8' );
		sinon.assert.calledWithExactly( globSyncSpy, path.join( 'manualTestPattern', '*.md' ) );
		sinon.assert.calledWithExactly( mdParserSpy, '##Markdown header' );
		sinon.assert.calledWithExactly( ensureDirSyncStub, 'buildDir' );
		sinon.assert.calledWithExactly(
			outputFileSyncStub,
			path.join( 'buildDir', 'path', 'to', 'file.html' ),
			[
				'<div>template html content</div>',
				'<div class="manual-test-sidebar"><h2>Markdown header</h2></div>',
				'<div>html file content</div>',
				`<body class="manual-test-container"><script src="${ path.sep + path.join( 'path', 'to', 'file.js' ) }"></script></body>`
			].join( '\n' )
		);
		sinon.assert.calledWithExactly( chokidarWatchStub, path.join( 'path', 'to', 'file.md' ) );
		sinon.assert.calledWithExactly( chokidarWatchStub, path.join( 'path', 'to', 'file.html' ) );
		sinon.assert.calledWithExactly( copySyncStub, 'static-file.png', path.join( 'buildDir', 'static-file.png' ) );
	} );
} );
