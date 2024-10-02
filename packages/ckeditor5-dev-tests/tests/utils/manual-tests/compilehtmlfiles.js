/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import path from 'path';
import fs from 'fs-extra';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { logger } from '@ckeditor/ckeditor5-dev-utils';
import { globSync } from 'glob';
import chokidar from 'chokidar';
import chalk from 'chalk';
import domCombiner from 'dom-combiner';
import compileHtmlFiles from '../../../lib/utils/manual-tests/compilehtmlfiles.js';
import getRelativeFilePath from '../../../lib/utils/getrelativefilepath.js';

const stubs = vi.hoisted( () => ( {
	commonmark: {
		parser: {
			parse: vi.fn()
		},
		htmlRenderer: {
			render: vi.fn()
		}
	},
	log: {
		info: vi.fn()
	}
} ) );

vi.mock( 'path' );
vi.mock( 'commonmark', () => ( {
	Parser: class Parser {
		parse( ...args ) {
			return stubs.commonmark.parser.parse( ...args );
		}
	},

	HtmlRenderer: class HtmlRenderer {
		render( ...args ) {
			return stubs.commonmark.htmlRenderer.render( ...args );
		}
	}
} ) );
vi.mock( 'path' );
vi.mock( 'glob' );
vi.mock( 'fs-extra' );
vi.mock( 'chokidar' );
vi.mock( 'chalk', () => ( {
	default: {
		cyan: vi.fn()
	}
} ) );
vi.mock( 'dom-combiner' );
vi.mock( '@ckeditor/ckeditor5-dev-utils' );
vi.mock( '../../../lib/utils/getrelativefilepath.js' );

describe( 'compileHtmlFiles()', () => {
	let files;
	let patternFiles = {};
	let separator = '/';

	beforeEach( () => {
		stubs.commonmark.htmlRenderer.render.mockReturnValue( '<h2>Markdown header</h2>' );
		vi.mocked( logger ).mockReturnValue( stubs.log );
		vi.mocked( chalk ).cyan.mockImplementation( input => input );
		vi.mocked( fs ).readFileSync.mockImplementation( pathToFile => files[ pathToFile ] );
		vi.mocked( path ).join.mockImplementation( ( ...chunks ) => chunks.join( separator ) );
		vi.mocked( path ).parse.mockImplementation( pathToParse => {
			const chunks = pathToParse.split( separator );
			const fileName = chunks.pop();

			return {
				dir: chunks.join( separator ),
				name: fileName.split( '.' ).slice( 0, -1 ).join( '.' )
			};
		} );
		vi.mocked( path ).dirname.mockImplementation( pathToParse => {
			return pathToParse.split( separator ).slice( 0, -1 ).join( separator );
		} );
		vi.mocked( chokidar ).watch.mockImplementation( () => ( {
			on: vi.fn()
		} ) );
		vi.mocked( getRelativeFilePath ).mockImplementation( pathToFile => pathToFile );
		vi.mocked( globSync ).mockImplementation( pattern => patternFiles[ pattern ] );
		vi.mocked( domCombiner ).mockImplementation( ( ...args ) => args.join( '\n' ) );
	} );

	describe( 'Unix environment', () => {
		beforeEach( () => {
			separator = '/';
		} );

		it( 'creates a build directory where compiled files are saved', () => {
			files = {};

			compileHtmlFiles( {
				buildDir: 'buildDir',
				language: 'en',
				sourceFiles: []
			} );

			expect( vi.mocked( fs ).ensureDirSync ).toHaveBeenCalledExactlyOnceWith( 'buildDir' );
		} );

		it( 'should compile md and html files to the output html file', () => {
			files = {
				'/template.html': '<div>template html content</div>',
				'path/to/manual/file.md': '## Markdown header',
				'path/to/manual/file.html': '<div>html file content</div>'
			};

			patternFiles = {
				'path/to/manual/**/*.!(js|html|md)': [ 'static-file.png' ]
			};

			compileHtmlFiles( {
				buildDir: 'buildDir',
				language: 'en',
				sourceFiles: [ 'path/to/manual/file.js' ]
			} );

			expect( stubs.commonmark.parser.parse ).toHaveBeenCalledExactlyOnceWith( '## Markdown header' );

			expect( vi.mocked( fs ).outputFileSync ).toHaveBeenCalledExactlyOnceWith(
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
					'<script src="/socket.io/socket.io.js"></script>' +
					'<script src="/assets/websocket.js"></script>' +
					'<script src="/assets/inspector.js"></script>' +
					'<script src="/assets/attachinspector.js"></script>' +
					'<script src="/assets/globallicensekey.js"></script>' +
					'<script src="/path/to/manual/file.js"></script>' +
					'</body>'
				].join( '\n' )
			);

			expect( stubs.log.info ).toHaveBeenCalledTimes( 2 );
			expect( stubs.log.info ).toHaveBeenCalledWith( expect.stringMatching( /^Processing/ ) );
			expect( stubs.log.info ).toHaveBeenCalledWith( expect.stringMatching( /^Finished writing/ ) );
		} );

		it( 'should listen to changes in source files', () => {
			files = {
				'/template.html': '<div>template html content</div>',
				'path/to/manual/file.md': '## Markdown header',
				'path/to/manual/file.html': '<div>html file content</div>'
			};

			patternFiles = {
				'path/to/manual/**/*.!(js|html|md)': [ 'static-file.png' ]
			};

			compileHtmlFiles( {
				buildDir: 'buildDir',
				language: 'en',
				sourceFiles: [ 'path/to/manual/file.js' ]
			} );

			expect( vi.mocked( chokidar ).watch ).toHaveBeenCalledTimes( 2 );
			expect( vi.mocked( chokidar ).watch ).toHaveBeenCalledWith(
				'path/to/manual/file.md', { ignoreInitial: true }
			);
			expect( vi.mocked( chokidar ).watch ).toHaveBeenCalledWith(
				'path/to/manual/file.html', { ignoreInitial: true }
			);
		} );

		it( 'should copy static resources', () => {
			files = {
				'/template.html': '<div>template html content</div>',
				'path/to/manual/file.md': '## Markdown header',
				'path/to/manual/file.html': '<div>html file content</div>'
			};

			patternFiles = {
				'path/to/manual/**/*.!(js|html|md)': [ 'static-file.png' ]
			};

			compileHtmlFiles( {
				buildDir: 'buildDir',
				language: 'en',
				sourceFiles: [ 'path/to/manual/file.js' ]
			} );

			expect( vi.mocked( fs ).copySync ).toHaveBeenCalledExactlyOnceWith( 'static-file.png', 'buildDir/static-file.png' );
		} );

		it( 'should compile files with options#language specified', () => {
			files = {
				'/template.html': '<div>template html content</div>',
				'path/to/manual/file.md': '## Markdown header',
				'path/to/manual/file.html': '<div>html file content</div>'
			};

			patternFiles = {
				'path/to/manual/**/*.!(js|html|md)': []
			};

			compileHtmlFiles( {
				buildDir: 'buildDir',
				language: 'en',
				additionalLanguages: [ 'pl', 'ar' ],
				sourceFiles: [ 'path/to/manual/file.js' ]
			} );

			expect( vi.mocked( fs ).outputFileSync ).toHaveBeenCalledExactlyOnceWith(
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
					'<script src="/socket.io/socket.io.js"></script>' +
					'<script src="/assets/websocket.js"></script>' +
					'<script src="/assets/inspector.js"></script>' +
					'<script src="/assets/attachinspector.js"></script>' +
					'<script src="/assets/globallicensekey.js"></script>' +
					'<script src="/translations/en.js"></script>' +
					'<script src="/translations/pl.js"></script>' +
					'<script src="/translations/ar.js"></script>' +
					'<script src="/path/to/manual/file.js"></script>' +
					'</body>'
				].join( '\n' )
			);
		} );

		it( 'should work with files containing dots in their names', () => {
			files = {
				'/template.html': '<div>template html content</div>',
				'path/to/manual/file.abc.md': '## Markdown header',
				'path/to/manual/file.abc.html': '<div>html file content</div>'
			};

			patternFiles = {
				'path/to/manual/**/*.!(js|html|md)': []
			};

			compileHtmlFiles( {
				buildDir: 'buildDir',
				sourceFiles: [ 'path/to/manual/file.abc.js' ]
			} );

			expect( vi.mocked( fs ).outputFileSync ).toHaveBeenCalledExactlyOnceWith(
				'buildDir/path/to/manual/file.abc.html',
				expect.stringContaining( '<script src="/path/to/manual/file.abc.js"></script>' )
			);
		} );

		it( 'should work with a few entry points patterns', () => {
			files = {
				'/template.html': '<div>template html content</div>',
				'path/to/manual/file.md': '## Markdown header',
				'path/to/manual/file.html': '<div>html file content</div>',
				'path/to/another/manual/file.md': '## Markdown header',
				'path/to/another/manual/file.html': '<div>html file content</div>'
			};

			patternFiles = {
				'path/to/manual/**/*.!(js|html|md)': [ 'static-file.png' ],
				'path/to/another/manual/**/*.!(js|html|md)': []
			};

			compileHtmlFiles( {
				buildDir: 'buildDir',
				sourceFiles: [
					'path/to/manual/file.js',
					'path/to/another/manual/file.js'
				]
			} );

			expect( vi.mocked( fs ).outputFileSync ).toHaveBeenCalledTimes( 2 );

			expect( vi.mocked( fs ).outputFileSync ).toHaveBeenCalledWith(
				'buildDir/path/to/manual/file.html',
				expect.stringContaining( '<script src="/path/to/manual/file.js"></script>' )
			);

			expect( vi.mocked( fs ).outputFileSync ).toHaveBeenCalledWith(
				'buildDir/path/to/another/manual/file.html',
				expect.stringContaining( '<script src="/path/to/another/manual/file.js"></script>' )
			);
		} );

		it( 'should not copy md files containing dots in their file names', () => {
			files = {
				'/template.html': '<div>template html content</div>',
				'path/to/manual/file.md': '## Markdown header',
				'path/to/manual/file.html': '<div>html file content</div>'
			};

			patternFiles = {
				// Glob pattern has problem with file names containing dots.
				'path/to/manual/**/*.!(js|html|md)': [ 'some.file.md' ]
			};

			compileHtmlFiles( {
				buildDir: 'buildDir',
				sourceFiles: [ 'path/to/manual/file.js' ]
			} );

			expect( vi.mocked( fs ).copySync ).not.toHaveBeenCalled();
		} );

		it( 'should compile the manual test and do not inform about the processed file', () => {
			files = {
				'/template.html': '<div>template html content</div>',
				'path/to/manual/file.md': '## Markdown header',
				'path/to/manual/file.html': '<div>html file content</div>'
			};

			patternFiles = {
				'path/to/manual/**/*.!(js|html|md)': [ 'static-file.png' ]
			};

			compileHtmlFiles( {
				buildDir: 'buildDir',
				language: 'en',
				sourceFiles: [ 'path/to/manual/file.js' ],
				silent: true
			} );

			expect( stubs.log.info ).not.toHaveBeenCalled();
		} );
	} );

	describe( 'Windows environment', () => {
		beforeEach( () => {
			separator = '\\';
		} );

		it( 'should work on Windows environments', () => {
			patternFiles = {
				'path/to/manual/**/*.!(js|html|md)': [ 'static-file.png' ]
			};

			files = {
				'\\template.html': '<div>template html content</div>',
				'path\\to\\manual\\file.md': '## Markdown header',
				'path\\to\\manual\\file.html': '<div>html file content</div>'
			};

			compileHtmlFiles( {
				buildDir: 'buildDir',
				sourceFiles: [ 'path\\to\\manual\\file.js' ]
			} );

			expect( vi.mocked( fs ).outputFileSync ).toHaveBeenCalledExactlyOnceWith(
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
					'<script src="/socket.io/socket.io.js"></script>' +
					'<script src="/assets/websocket.js"></script>' +
					'<script src="/assets/inspector.js"></script>' +
					'<script src="/assets/attachinspector.js"></script>' +
					'<script src="/assets/globallicensekey.js"></script>' +
					'<script src="/path/to/manual/file.js"></script>' +
					'</body>'
				].join( '\n' )
			);
		} );

		it( 'should listen to changes in source files', () => {
			patternFiles = {
				'path/to/manual/**/*.!(js|html|md)': [ 'static-file.png' ]
			};

			files = {
				'\\template.html': '<div>template html content</div>',
				'path\\to\\manual\\file.md': '## Markdown header',
				'path\\to\\manual\\file.html': '<div>html file content</div>'
			};

			compileHtmlFiles( {
				buildDir: 'buildDir',
				sourceFiles: [ 'path\\to\\manual\\file.js' ]
			} );

			expect( vi.mocked( chokidar ).watch ).toHaveBeenCalledTimes( 2 );
			expect( vi.mocked( chokidar ).watch ).toHaveBeenCalledWith(
				'path\\to\\manual\\file.md', { ignoreInitial: true }
			);
			expect( vi.mocked( chokidar ).watch ).toHaveBeenCalledWith(
				'path\\to\\manual\\file.html', { ignoreInitial: true }
			);
		} );

		it( 'should copy static resources', () => {
			patternFiles = {
				'path/to/manual/**/*.!(js|html|md)': [ 'static-file.png' ]
			};

			files = {
				'\\template.html': '<div>template html content</div>',
				'path\\to\\manual\\file.md': '## Markdown header',
				'path\\to\\manual\\file.html': '<div>html file content</div>'
			};

			compileHtmlFiles( {
				buildDir: 'buildDir',
				sourceFiles: [ 'path\\to\\manual\\file.js' ]
			} );

			expect( vi.mocked( fs ).copySync ).toHaveBeenCalledExactlyOnceWith( 'static-file.png', 'buildDir\\static-file.png' );
		} );
	} );
} );
