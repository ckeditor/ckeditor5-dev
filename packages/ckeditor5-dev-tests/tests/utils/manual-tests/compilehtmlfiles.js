/**
 * @license Copyright (c) 2003-2021, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const path = require( 'path' );
const mockery = require( 'mockery' );
const sinon = require( 'sinon' );
const { use, expect } = require( 'chai' );
const chokidar = require( 'chokidar' );
const sinonChai = require( 'sinon-chai' );

use( sinonChai );

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
				join: sandbox.stub().callsFake( ( ...chunks ) => chunks.join( separator ) ),
				parse: sandbox.stub().callsFake( pathToParse => {
					const chunks = pathToParse.split( separator );
					const fileName = chunks.pop();

					return {
						dir: chunks.join( separator ),
						name: fileName.split( '.' ).slice( 0, -1 ).join( '.' )
					};
				} ),
				dirname: sandbox.stub().callsFake( pathToParse => {
					return pathToParse.split( separator ).slice( 0, -1 ).join( separator );
				} ),
				sep: separator
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

		mockery.registerMock( 'path', stubs.path );
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
	} );

	afterEach( () => {
		sandbox.restore();
		mockery.deregisterAll();
		mockery.disable();
	} );

	describe( 'Unix environment', () => {
		beforeEach( () => {
			separator = '/';
			compileHtmlFiles = require( '../../../lib/utils/manual-tests/compilehtmlfiles' );
		} );

		it( 'should compile md and html files to the output html file', () => {
			files = {
				[ `${ fakeDirname }/template.html` ]: '<div>template html content</div>',
				'path/to/manual/file.md': '## Markdown header',
				'path/to/manual/file.html': '<div>html file content</div>'
			};

			patternFiles = {
				'manualTestPattern/*.js': [ 'path/to/manual/file.js' ],
				'path/to/manual/**/*.!(js|html|md)': [ 'static-file.png' ]
			};

			compileHtmlFiles( {
				buildDir: 'buildDir',
				language: 'en',
				patterns: [ 'manualTestPattern/*.js' ]
			} );

			expect( stubs.commonmark.parse ).to.be.calledWithExactly( '## Markdown header' );
			expect( stubs.fs.ensureDirSync ).to.be.calledWithExactly( 'buildDir' );

			/* eslint-disable max-len */
			expect(	stubs.fs.outputFileSync ).to.be.calledWithExactly(
				'buildDir/path/to/manual/file.html', [
					'<div>template html content</div>',
					'<div class="manual-test-sidebar"><h2>Markdown header</h2></div>',
					'<button class="manual-test-sidebar__toggle" type="button" title="Toggle sidebar">' +
						'<span></span><span></span><span></span>' +
					'</button>',
					'<a href="/" class="manual-test-sidebar__root-link-button" title="Back to the list">' +
						'<span></span><span></span><span></span><span></span>' +
					'</button>',
					'<div>html file content</div>',
					'<body class="manual-test-container manual-test-container_no-transitions">' +
						'<script src="/assets/togglesidebar.js"></script>' +
						'<script src="/assets/inspector.js"></script>' +
						'<script src="/assets/attachinspector.js"></script>' +
						'<script src="/path/to/manual/file.js"></script>' +
					'</body>'
				].join( '\n' )
			);
			/* eslint-enable max-len */

			expect( stubs.chokidar.watch ).to.be.calledWithExactly(
				'path/to/manual/file.md', { ignoreInitial: true }
			);
			expect( stubs.chokidar.watch ).to.be.calledWithExactly(
				'path/to/manual/file.html', { ignoreInitial: true }
			);
			expect( stubs.fs.copySync ).to.be.calledWithExactly(
				'static-file.png', 'buildDir/static-file.png'
			);

			expect( stubs.logger.info.callCount ).to.equal( 2 );
			expect( stubs.logger.info.firstCall.args[ 0 ] ).to.match( /^Processing/ );
			expect( stubs.logger.info.secondCall.args[ 0 ] ).to.match( /^Finished writing/ );
		} );

		it( 'should compile files with options#language specified', () => {
			compileHtmlFiles( {
				buildDir: 'buildDir',
				language: 'en',
				additionalLanguages: [ 'pl', 'ar' ],
				patterns: [ 'manualTestPattern/*.js' ]
			} );

			/* eslint-disable max-len */
			expect( stubs.fs.outputFileSync ).to.be.calledWithExactly(
				'buildDir/path/to/manual/file.html', [
					'<div>template html content</div>',
					'<div class="manual-test-sidebar"><h2>Markdown header</h2></div>',
					'<button class="manual-test-sidebar__toggle" type="button" title="Toggle sidebar">' +
						'<span></span><span></span><span></span>' +
					'</button>',
					'<a href="/" class="manual-test-sidebar__root-link-button" title="Back to the list">' +
						'<span></span><span></span><span></span><span></span>' +
					'</button>',
					'<div>html file content</div>',
					'<body class="manual-test-container manual-test-container_no-transitions">' +
						'<script src="/assets/togglesidebar.js"></script>' +
						'<script src="/assets/inspector.js"></script>' +
						'<script src="/assets/attachinspector.js"></script>' +
						'<script src="/translations/en.js"></script>' +
						'<script src="/translations/pl.js"></script>' +
						'<script src="/translations/ar.js"></script>' +
						'<script src="/path/to/manual/file.js"></script>' +
					'</body>'
				].join( '\n' )
			);
			/* eslint-enable max-len */
		} );

		it( 'should work with files containing dots in their names', () => {
			files = {
				[ `${ fakeDirname }/template.html` ]: '<div>template html content</div>',
				'path/to/manual/file.abc.md': '## Markdown header',
				'path/to/manual/file.abc.html': '<div>html file content</div>'
			};

			patternFiles = {
				'manualTestPattern/*.js': [ 'path/to/manual/file.abc.js' ],
				'path/to/manual/**/*.!(js|html|md)': []
			};

			compileHtmlFiles( {
				buildDir: 'buildDir',
				patterns: [ 'manualTestPattern/*.js' ]
			} );

			/* eslint-disable max-len */
			expect( stubs.fs.outputFileSync ).to.be.calledWith(
				'buildDir/path/to/manual/file.abc.html', [
					'<div>template html content</div>',
					'<div class="manual-test-sidebar"><h2>Markdown header</h2></div>',
					'<button class="manual-test-sidebar__toggle" type="button" title="Toggle sidebar">' +
						'<span></span><span></span><span></span>' +
					'</button>',
					'<a href="/" class="manual-test-sidebar__root-link-button" title="Back to the list">' +
						'<span></span><span></span><span></span><span></span>' +
					'</button>',
					'<div>html file content</div>',
					'<body class="manual-test-container manual-test-container_no-transitions">' +
						'<script src="/assets/togglesidebar.js"></script>' +
						'<script src="/assets/inspector.js"></script>' +
						'<script src="/assets/attachinspector.js"></script>' +
						'<script src="/path/to/manual/file.abc.js"></script>' +
					'</body>'
				].join( '\n' )
			);
			/* eslint-enable max-len */
		} );

		it( 'should work with a few entry points patterns', () => {
			files = {
				[ `${ fakeDirname }/template.html` ]: '<div>template html content</div>',
				'path/to/manual/file.md': '## Markdown header',
				'path/to/manual/file.html': '<div>html file content</div>',
				'path/to/another/manual/file.md': '## Markdown header',
				'path/to/another/manual/file.html': '<div>html file content</div>'
			};

			patternFiles = {
				'manualTestPattern/*.js': [ 'path/to/manual/file.js' ],
				'anotherPattern/*.js': [ 'path/to/another/manual/file.js' ],
				'path/to/manual/**/*.!(js|html|md)': [ 'static-file.png' ],
				'path/to/another/manual/**/*.!(js|html|md)': []
			};

			compileHtmlFiles( {
				buildDir: 'buildDir',
				patterns: [
					'manualTestPattern/*.js',
					'anotherPattern/*.js'
				]
			} );

			expect( stubs.chokidar.watch ).to.be.calledWithExactly( 'path/to/manual/file.md', { ignoreInitial: true } );
			expect( stubs.chokidar.watch ).to.be.calledWithExactly( 'path/to/manual/file.html', { ignoreInitial: true } );
			expect( stubs.chokidar.watch ).to.be.calledWithExactly( 'path/to/another/manual/file.html', { ignoreInitial: true } );
			expect( stubs.chokidar.watch ).to.be.calledWithExactly( 'path/to/another/manual/file.html', { ignoreInitial: true } );
		} );

		it( 'should compile only manual test files', () => {
			files = {
				[ `${ fakeDirname }/template.html` ]: '<div>template html content</div>',
				'path/to/manual/file.md': '## Markdown header',
				'path/to/manual/file.html': '<div>html file content</div>',
				'path/to/another/file.md': '## Markdown header',
				'path/to/another/file.html': '<div>html file content</div>'
			};

			patternFiles = {
				'manualTestPattern/*.js': [
					'path/to/manual/file.js',
					'path/to/manual/_utils/secretplugin.js'
				],
				'anotherPattern/*.js': [ 'path/to/another/file.js' ],
				'path/to/manual/**/*.!(js|html|md)': [ 'static-file.png' ]
			};

			compileHtmlFiles( {
				buildDir: 'buildDir',
				patterns: [
					'manualTestPattern/*.js',
					'anotherPattern/*.js'
				]
			} );

			expect( stubs.chokidar.watch ).to.be.calledWithExactly( 'path/to/manual/file.md', { ignoreInitial: true } );
			expect( stubs.chokidar.watch ).to.be.calledWithExactly( 'path/to/manual/file.html', { ignoreInitial: true } );
			expect( stubs.chokidar.watch ).not.to.be.calledWith( 'path/to/another/file.html', { ignoreInitial: true } );
			expect( stubs.chokidar.watch ).not.to.be.calledWith( 'path/to/another/file.html', { ignoreInitial: true } );
		} );

		it( 'should not copy md files containing dots in their file names', () => {
			files = {
				[ `${ fakeDirname }/template.html` ]: '<div>template html content</div>',
				'path/to/manual/file.md': '## Markdown header',
				'path/to/manual/file.html': '<div>html file content</div>'
			};

			patternFiles = {
				'manualTestPattern/*.js': [ 'path/to/manual/file.js' ],
				// Glob pattern has problem with file names containing dots.
				'path/to/manual/**/*.!(js|html|md)': [ 'some.file.md' ]
			};

			compileHtmlFiles( {
				buildDir: 'buildDir',
				patterns: [
					'manualTestPattern/*.js'
				]
			} );

			expect( stubs.commonmark.parse ).to.be.calledWithExactly( '## Markdown header' );
			expect( stubs.fs.ensureDirSync ).to.be.calledWithExactly( 'buildDir' );

			/* eslint-disable max-len */
			expect( stubs.fs.outputFileSync ).to.be.calledWithExactly(
				'buildDir/path/to/manual/file.html', [
					'<div>template html content</div>',
					'<div class="manual-test-sidebar"><h2>Markdown header</h2></div>',
					'<button class="manual-test-sidebar__toggle" type="button" title="Toggle sidebar">' +
						'<span></span><span></span><span></span>' +
					'</button>',
					'<a href="/" class="manual-test-sidebar__root-link-button" title="Back to the list">' +
						'<span></span><span></span><span></span><span></span>' +
					'</button>',
					'<div>html file content</div>',
					'<body class="manual-test-container manual-test-container_no-transitions">' +
						'<script src="/assets/togglesidebar.js"></script>' +
						'<script src="/assets/inspector.js"></script>' +
						'<script src="/assets/attachinspector.js"></script>' +
						'<script src="/path/to/manual/file.js"></script>' +
					'</body>'
				].join( '\n' )
			);
			/* eslint-enable max-len */

			expect( stubs.chokidar.watch ).to.be.calledWithExactly( 'path/to/manual/file.md', { ignoreInitial: true } );
			expect( stubs.chokidar.watch ).to.be.calledWithExactly( 'path/to/manual/file.html', { ignoreInitial: true } );
			expect( stubs.fs.copySync ).not.to.be.calledWith( 'some.file.md', 'buildDir/some.file.md' );
		} );

		it( 'should compile the manual test and do not inform about the processed file', () => {
			files = {
				[ `${ fakeDirname }/template.html` ]: '<div>template html content</div>',
				'path/to/manual/file.md': '## Markdown header',
				'path/to/manual/file.html': '<div>html file content</div>'
			};

			patternFiles = {
				'manualTestPattern/*.js': [ 'path/to/manual/file.js' ],
				'path/to/manual/**/*.!(js|html|md)': [ 'static-file.png' ]
			};

			compileHtmlFiles( {
				buildDir: 'buildDir',
				language: 'en',
				patterns: [ 'manualTestPattern/*.js' ],
				silent: true
			} );

			expect( stubs.commonmark.parse ).to.be.calledWithExactly( '## Markdown header' );
			expect( stubs.fs.ensureDirSync ).to.be.calledWithExactly( 'buildDir' );

			expect( stubs.logger.info.callCount ).to.equal( 0 );
		} );
	} );

	describe( 'Windows environment', () => {
		beforeEach( () => {
			separator = '\\';
			compileHtmlFiles = require( '../../../lib/utils/manual-tests/compilehtmlfiles' );
		} );

		it( 'should work on Windows environments', () => {
			// Our wrapper on Glob returns proper paths for Unix and Windows.
			patternFiles = {
				'manualTestPattern/*.js': [ 'path\\to\\manual\\file.js' ],
				'path\\to\\manual\\**\\*.!(js|html|md)': [ 'static-file.png' ]
			};

			files = {
				[ fakeDirname + '\\template.html' ]: '<div>template html content</div>',
				'path\\to\\manual\\file.md': '## Markdown header',
				'path\\to\\manual\\file.html': '<div>html file content</div>'
			};

			compileHtmlFiles( {
				buildDir: 'buildDir',
				patterns: [ 'manualTestPattern/*.js' ]
			} );

			expect( stubs.commonmark.parse ).to.be.calledWithExactly( '## Markdown header' );
			expect( stubs.fs.ensureDirSync ).to.be.calledWithExactly( 'buildDir' );

			/* eslint-disable max-len */
			expect( stubs.fs.outputFileSync ).to.be.calledWithExactly(
				'buildDir\\path\\to\\manual\\file.html', [
					'<div>template html content</div>',
					'<div class="manual-test-sidebar"><h2>Markdown header</h2></div>',
					'<button class="manual-test-sidebar__toggle" type="button" title="Toggle sidebar">' +
						'<span></span><span></span><span></span>' +
					'</button>',
					'<a href="/" class="manual-test-sidebar__root-link-button" title="Back to the list">' +
						'<span></span><span></span><span></span><span></span>' +
					'</button>',
					'<div>html file content</div>',
					'<body class="manual-test-container manual-test-container_no-transitions">' +
						'<script src="/assets/togglesidebar.js"></script>' +
						'<script src="/assets/inspector.js"></script>' +
						'<script src="/assets/attachinspector.js"></script>' +
						'<script src="/path/to/manual/file.js"></script>' +
					'</body>'
				].join( '\n' )
			);
			/* eslint-enable max-len */

			expect( stubs.chokidar.watch ).to.be.calledWithExactly(
				'path\\to\\manual\\file.md', { ignoreInitial: true }
			);
			expect( stubs.chokidar.watch ).to.be.calledWithExactly(
				'path\\to\\manual\\file.html', { ignoreInitial: true }
			);
			expect( stubs.fs.copySync ).to.be.calledWithExactly(
				'static-file.png', 'buildDir\\static-file.png'
			);
		} );
	} );
} );
