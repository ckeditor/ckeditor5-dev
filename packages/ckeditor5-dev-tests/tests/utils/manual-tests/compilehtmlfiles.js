/**
 * @license Copyright (c) 2003-2018, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const mockery = require( 'mockery' );
const sinon = require( 'sinon' );
const path = require( 'path' );
const chokidar = require( 'chokidar' );

const fakeDirname = path.dirname( require.resolve( '../../../lib/utils/manual-tests/compilehtmlfiles' ) );

describe( 'compileHtmlFiles', () => {
	let sandbox, stubs, files, compileHtmlFiles;
	let patternFiles = {};
	let separator = '/';

	beforeEach( () => {
		mockery.enable( {
			useCleanCache: true,
			warnOnReplace: false,
			warnOnUnregistered: false
		} );

		sandbox = sinon.createSandbox();

		stubs = {
			fs: {
				readFileSync: sandbox.spy( pathToFile => files[ pathToFile ] ),
				ensureDirSync: sandbox.stub(),
				outputFileSync: sandbox.stub(),
				copySync: sandbox.stub()
			},

			path: {
				join: sandbox.stub( path, 'join' ).callsFake( ( ...chunks ) => chunks.join( separator ) ),
				parse: sandbox.stub( path, 'parse' ).callsFake( pathToParse => {
					const chunks = pathToParse.split( separator );
					const fileName = chunks.pop();

					return {
						dir: chunks.join( separator ),
						name: fileName.split( '.' ).slice( 0, -1 ).join( '.' )
					};
				} ),
				dirname: sandbox.stub( path, 'dirname' ).callsFake( pathToParse => {
					return pathToParse.split( separator ).slice( 0, -1 ).join( separator );
				} ),
				sep: sandbox.stub( path, 'sep' ).value( separator )
			},

			logger: {
				info: sandbox.stub(),
				warning: sandbox.stub(),
				error: sandbox.stub()
			},

			commonmark: {
				parse: sandbox.spy(),
				render: sandbox.spy( () => '<h2>Markdown header</h2>' )
			},

			chalk: {
				cyan: sandbox.spy( text => text )
			},

			chokidar: {
				watch: sandbox.stub( chokidar, 'watch' ).callsFake( () => ( {
					on: () => {
					}
				} ) )
			},

			getRelativeFilePath: sandbox.spy( pathToFile => pathToFile ),
			glob: sandbox.spy( pattern => patternFiles[ pattern ] ),
			domCombiner: sandbox.spy( ( ...args ) => args.join( '\n' ) )
		};

		mockery.registerMock( 'commonmark', {
			Parser: class Parser {
				parse( ...args ) {
					return stubs.commonmark.parse( ...args );
				}
			},

			HtmlRenderer: class HtmlRenderer {
				render( ...args ) {
					return stubs.commonmark.render( ...args );
				}
			}
		} );
		mockery.registerMock( 'fs-extra', stubs.fs );
		mockery.registerMock( 'chokidar', stubs.chokidar );
		mockery.registerMock( 'dom-combiner', stubs.domCombiner );
		mockery.registerMock( '@ckeditor/ckeditor5-dev-utils', {
			logger() {
				return stubs.logger;
			}
		} );
		mockery.registerMock( '../getrelativefilepath', stubs.getRelativeFilePath );
		mockery.registerMock( '../glob', stubs.glob );

		compileHtmlFiles = require( '../../../lib/utils/manual-tests/compilehtmlfiles' );
	} );

	afterEach( () => {
		sandbox.restore();
		mockery.disable();
	} );

	it( 'should compile md and html files to the output html file', () => {
		files = {
			[ path.join( fakeDirname, 'template.html' ) ]: '<div>template html content</div>',
			[ path.join( 'path', 'to', 'manual', 'file.md' ) ]: '## Markdown header',
			[ path.join( 'path', 'to', 'manual', 'file.html' ) ]: '<div>html file content</div>'
		};

		patternFiles = {
			[ path.join( 'manualTestPattern', '*.js' ) ]: [ path.join( 'path', 'to', 'manual', 'file.js' ) ],
			[ path.join( 'path', 'to', 'manual', '**', '*.!(js|html|md)' ) ]: [ 'static-file.png' ]
		};

		compileHtmlFiles( 'buildDir', [ path.join( 'manualTestPattern', '*.js' ) ] );

		sinon.assert.calledWithExactly( stubs.commonmark.parse, '## Markdown header' );
		sinon.assert.calledWithExactly( stubs.fs.ensureDirSync, 'buildDir' );

		/* eslint-disable max-len */
		sinon.assert.calledWithExactly(
			stubs.fs.outputFileSync,
			path.join( 'buildDir', 'path', 'to', 'manual', 'file.html' ), [
				'<div>template html content</div>',
				'<div class="manual-test-sidebar"><a href="/" class="manual-test-root-link">&larr; Back to the list</a><h2>Markdown header</h2></div>',
				'<div>html file content</div>',
				`<body class="manual-test-container"><script src="${ path.sep + path.join( 'path', 'to', 'manual', 'file.js' ) }"></script></body>`
			].join( '\n' )
		);
		/* eslint-enable max-len */

		sinon.assert.calledWithExactly( stubs.chokidar.watch, path.join( 'path', 'to', 'manual', 'file.md' ), { ignoreInitial: true } );
		sinon.assert.calledWithExactly( stubs.chokidar.watch, path.join( 'path', 'to', 'manual', 'file.html' ), { ignoreInitial: true } );
		sinon.assert.calledWithExactly(
			stubs.fs.copySync, 'static-file.png', path.join( 'buildDir', 'static-file.png' )
		);
	} );

	it( 'should work with files containing dots in their names', () => {
		files = {
			[ path.join( fakeDirname, 'template.html' ) ]: '<div>template html content</div>',
			[ path.join( 'path', 'to', 'manual', 'file.abc.md' ) ]: '## Markdown header',
			[ path.join( 'path', 'to', 'manual', 'file.abc.html' ) ]: '<div>html file content</div>'
		};

		patternFiles = {
			[ path.join( 'manualTestPattern', '*.js' ) ]: [ path.join( 'path', 'to', 'manual', 'file.abc.js' ) ],
			[ path.join( 'path', 'to', 'manual', '**', '*.!(js|html|md)' ) ]: []
		};

		compileHtmlFiles( 'buildDir', [ path.join( 'manualTestPattern', '*.js' ) ] );

		/* eslint-disable max-len */
		sinon.assert.calledWith(
			stubs.fs.outputFileSync,
			path.join( 'buildDir', 'path', 'to', 'manual', 'file.abc.html' ), [
				'<div>template html content</div>',
				'<div class="manual-test-sidebar"><a href="/" class="manual-test-root-link">&larr; Back to the list</a><h2>Markdown header</h2></div>',
				'<div>html file content</div>',
				`<body class="manual-test-container"><script src="${ path.sep + path.join( 'path', 'to', 'manual', 'file.abc.js' ) }"></script></body>`
			].join( '\n' )
		);
		/* eslint-enable max-len */
	} );

	it( 'should work with a few entry points patterns', () => {
		files = {
			[ path.join( fakeDirname, 'template.html' ) ]: '<div>template html content</div>',
			[ path.join( 'path', 'to', 'manual', 'file.md' ) ]: '## Markdown header',
			[ path.join( 'path', 'to', 'manual', 'file.html' ) ]: '<div>html file content</div>',
			[ path.join( 'path', 'to', 'another', 'manual', 'file.md' ) ]: '## Markdown header',
			[ path.join( 'path', 'to', 'another', 'manual', 'file.html' ) ]: '<div>html file content</div>'
		};

		patternFiles = {
			[ path.join( 'manualTestPattern', '*.js' ) ]: [ path.join( 'path', 'to', 'manual', 'file.js' ) ],
			[ path.join( 'anotherPattern', '*.js' ) ]: [ path.join( 'path', 'to', 'another', 'manual', 'file.js' ) ],
			[ path.join( 'path', 'to', 'manual', '**', '*.!(js|html|md)' ) ]: [ 'static-file.png' ],
			[ path.join( 'path', 'to', 'another', 'manual', '**', '*.!(js|html|md)' ) ]: []
		};

		compileHtmlFiles( 'buildDir', [
			path.join( 'manualTestPattern', '*.js' ),
			path.join( 'anotherPattern', '*.js' )
		] );

		sinon.assert.calledWithExactly( stubs.chokidar.watch, path.join( 'path', 'to', 'manual', 'file.md' ), { ignoreInitial: true } );
		sinon.assert.calledWithExactly( stubs.chokidar.watch, path.join( 'path', 'to', 'manual', 'file.html' ), { ignoreInitial: true } );
		sinon.assert.calledWithExactly(
			stubs.chokidar.watch, path.join( 'path', 'to', 'another', 'manual', 'file.html' ), { ignoreInitial: true }
		);
		sinon.assert.calledWithExactly(
			stubs.chokidar.watch, path.join( 'path', 'to', 'another', 'manual', 'file.html' ), { ignoreInitial: true }
		);
	} );

	it( 'should compile only manual test files', () => {
		files = {
			[ path.join( fakeDirname, 'template.html' ) ]: '<div>template html content</div>',
			[ path.join( 'path', 'to', 'manual', 'file.md' ) ]: '## Markdown header',
			[ path.join( 'path', 'to', 'manual', 'file.html' ) ]: '<div>html file content</div>',
			[ path.join( 'path', 'to', 'another', 'file.md' ) ]: '## Markdown header',
			[ path.join( 'path', 'to', 'another', 'file.html' ) ]: '<div>html file content</div>'
		};

		patternFiles = {
			[ path.join( 'manualTestPattern', '*.js' ) ]: [ path.join( 'path', 'to', 'manual', 'file.js' ) ],
			[ path.join( 'anotherPattern', '*.js' ) ]: [ path.join( 'path', 'to', 'another', 'file.js' ) ],
			[ path.join( 'path', 'to', 'manual', '**', '*.!(js|html|md)' ) ]: [ 'static-file.png' ]
		};

		compileHtmlFiles( 'buildDir', [
			path.join( 'manualTestPattern', '*.js' ),
			path.join( 'anotherPattern', '*.js' )
		] );

		sinon.assert.calledWithExactly( stubs.chokidar.watch, path.join( 'path', 'to', 'manual', 'file.md' ), { ignoreInitial: true } );
		sinon.assert.calledWithExactly( stubs.chokidar.watch, path.join( 'path', 'to', 'manual', 'file.html' ), { ignoreInitial: true } );
		sinon.assert.neverCalledWith( stubs.chokidar.watch, path.join( 'path', 'to', 'another', 'file.html' ), { ignoreInitial: true } );
		sinon.assert.neverCalledWith( stubs.chokidar.watch, path.join( 'path', 'to', 'another', 'file.html' ), { ignoreInitial: true } );
	} );

	it( 'should not copy md files containing dots in their file names', () => {
		files = {
			[ path.join( fakeDirname, 'template.html' ) ]: '<div>template html content</div>',
			[ path.join( 'path', 'to', 'manual', 'file.md' ) ]: '## Markdown header',
			[ path.join( 'path', 'to', 'manual', 'file.html' ) ]: '<div>html file content</div>'
		};

		patternFiles = {
			[ path.join( 'manualTestPattern', '*.js' ) ]: [ path.join( 'path', 'to', 'manual', 'file.js' ) ],
			// Glob pattern has problem with file names containing dots.
			[ path.join( 'path', 'to', 'manual', '**', '*.!(js|html|md)' ) ]: [ 'some.file.md' ]
		};

		compileHtmlFiles( 'buildDir', [ path.join( 'manualTestPattern', '*.js' ) ] );

		sinon.assert.calledWithExactly( stubs.commonmark.parse, '## Markdown header' );
		sinon.assert.calledWithExactly( stubs.fs.ensureDirSync, 'buildDir' );

		/* eslint-disable max-len */
		sinon.assert.calledWithExactly(
			stubs.fs.outputFileSync,
			path.join( 'buildDir', 'path', 'to', 'manual', 'file.html' ), [
				'<div>template html content</div>',
				'<div class="manual-test-sidebar"><a href="/" class="manual-test-root-link">&larr; Back to the list</a><h2>Markdown header</h2></div>',
				'<div>html file content</div>',
				`<body class="manual-test-container"><script src="${ path.sep +
				path.join( 'path', 'to', 'manual', 'file.js' ) }"></script></body>`
			].join( '\n' )
		);
		/* eslint-enable max-len */

		sinon.assert.calledWithExactly( stubs.chokidar.watch, path.join( 'path', 'to', 'manual', 'file.md' ), { ignoreInitial: true } );
		sinon.assert.calledWithExactly( stubs.chokidar.watch, path.join( 'path', 'to', 'manual', 'file.html' ), { ignoreInitial: true } );
		sinon.assert.neverCalledWith( stubs.fs.copySync, 'some.file.md', path.join( 'buildDir', 'some.file.md' ) );
	} );

	it( 'should work on Windows environments', () => {
		separator = '\\';
		stubs.path.sep.resetHistory();
		stubs.path.sep.value( separator );

		// Our wrapper on Glob returns proper paths for Unix and Windows.
		patternFiles = {
			'manualTestPattern\\*.js': [ 'path\\to\\manual\\file.js' ],
			'path\\to\\manual\\**\\*.!(js|html|md)': [ 'static-file.png' ]
		};

		files = {
			[ fakeDirname + '\\template.html' ]: '<div>template html content</div>',
			'path\\to\\manual\\file.md': '## Markdown header',
			'path\\to\\manual\\file.html': '<div>html file content</div>'
		};

		compileHtmlFiles( 'buildDir', [ path.join( 'manualTestPattern', '*.js' ) ] );

		sinon.assert.calledWithExactly( stubs.commonmark.parse, '## Markdown header' );
		sinon.assert.calledWithExactly( stubs.fs.ensureDirSync, 'buildDir' );

		/* eslint-disable max-len */
		sinon.assert.calledWithExactly(
			stubs.fs.outputFileSync,
			path.join( 'buildDir', 'path', 'to', 'manual', 'file.html' ), [
				'<div>template html content</div>',
				'<div class="manual-test-sidebar"><a href="/" class="manual-test-root-link">&larr; Back to the list</a><h2>Markdown header</h2></div>',
				'<div>html file content</div>',
				`<body class="manual-test-container"><script src="/${ path.join( 'path', 'to', 'manual', 'file.js' ) }"></script></body>`
			].join( '\n' )
		);
		/* eslint-enable max-len */

		sinon.assert.calledWithExactly( stubs.chokidar.watch, path.join( 'path', 'to', 'manual', 'file.md' ), { ignoreInitial: true } );
		sinon.assert.calledWithExactly( stubs.chokidar.watch, path.join( 'path', 'to', 'manual', 'file.html' ), { ignoreInitial: true } );
		sinon.assert.calledWithExactly(
			stubs.fs.copySync, 'static-file.png', path.join( 'buildDir', 'static-file.png' )
		);

		separator = '/';
	} );
} );
