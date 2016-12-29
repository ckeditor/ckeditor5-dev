/**
 * @license Copyright (c) 2003-2015, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

/* global describe, it, beforeEach, afterEach */

'use strict';

const chai = require( 'chai' );
const expect = chai.expect;
const sinon = require( 'sinon' );
const path = require( 'path' );
const fs = require( 'fs' );
const gzipSize = require( 'gzip-size' );
const { tools } = require( '@ckeditor/ckeditor5-dev-utils' );

describe( 'bundle-utils', () => {
	const utils = require( '../lib/utils' );
	let sandbox;

	beforeEach( () => {
		sandbox = sinon.sandbox.create();
	} );

	afterEach( () => {
		sandbox.restore();
	} );

	describe( 'getModuleFullPath', () => {
		it( 'should return full path when passed path not relative', () => {
			expect( utils.getModuleFullPath( 'editor-classic/classic', 'path/to/build' ) )
				.to.equal( 'path/to/build/ckeditor5/editor-classic/classic.js' );
		} );

		it( 'should return unmodified path when passed path is a relative', () => {
			expect( utils.getModuleFullPath( './path/to/editor-classic/classic' ) ).to.equal( './path/to/editor-classic/classic.js' );
			expect( utils.getModuleFullPath( '../path/to/editor-classic/classic' ) ).to.equal( '../path/to/editor-classic/classic.js' );
		} );
	} );

	describe( 'getPluginPath()', () => {
		it( 'should resolve a simple plugin name to the full path', () => {
			expect( utils.getPluginPath( 'typing', 'path/to/build' ) )
				.to.equal( 'path/to/build/ckeditor5/typing/typing.js' );
		} );

		it( 'should return full path if passed argument is a relative path', () => {
			expect( utils.getPluginPath( 'typing/typing', 'path/to/build'  ) )
				.to.equal( 'path/to/build/ckeditor5/typing/typing.js' );
		} );

		it( 'should return unmodified plugin path if passed argument is a relative path', () => {
			expect( utils.getPluginPath( './typing' ) ).to.equal( './typing.js' );
			expect( utils.getPluginPath( '../typing' ) ).to.equal( '../typing.js' );
		} );
	} );

	describe( 'capitalize()', () => {
		it( 'should transform first letter of the passed string to uppercase', () => {
			expect( utils.capitalize( 'string' ) ).to.equal( 'String' );
			expect( utils.capitalize( 'multi word string' ) ).to.equal( 'Multi word string' );
		} );
	} );

	describe( 'maybeCleanDir()', () => {
		it( 'should clean directory if dir is provided', () => {
			const cleanStub = sandbox.stub( tools, 'clean', () => Promise.resolve() );
			sandbox.stub( path, 'join', x => x );

			const promise = utils.maybeCleanDir( 'dir' );
			sinon.assert.calledWithExactly( cleanStub, 'dir', '' );

			return promise;
		} );

		it( 'should return resolved promise if no dir is provided', () => {
			const cleanStub = sandbox.stub( tools, 'clean', () => Promise.resolve() );
			sandbox.stub( path, 'join', x => x );

			const promise = utils.maybeCleanDir();
			sinon.assert.notCalled( cleanStub );

			return promise;
		} );
	} );

	describe( 'cleanFiles()', () => {
		it( 'should clean every file with specific filename', () => {
			sandbox.stub( tools, 'clean', ( path, filePattern ) => {
				return { path, filePattern };
			} );

			const result = utils.cleanFiles( 'destinationPath', 'fileName' );

			expect( result.path ).to.be.equal( 'destinationPath' );
			expect( result.filePattern ).to.be.equal( 'fileName.*' );
		} );
	} );

	describe( 'renderEntryFileContent()', () => {
		it( 'should render file content with proper data', () => {
			const result = utils.renderEntryFileContent( './bundle/tmp', {
				moduleName: 'MyCKEditor',
				editor: 'editor-classic/classic',
				plugins: [
					'delete',
					'path/to/default',
					'./path/to/custom'
				]
			}, 'path/to/build' );

			const expected = `
'use strict';

// Babel helpers.
import '../../node_modules/regenerator-runtime/runtime.js';

import Classic from '../../path/to/build/ckeditor5/editor-classic/classic.js';
import Delete from '../../path/to/build/ckeditor5/delete/delete.js';
import Default from '../../path/to/build/ckeditor5/path/to/default.js';
import Custom from '../../path/to/custom.js';


export default class MyCKEditor extends Classic {
	static create( element, config = {} ) {
		if ( !config.plugins ) {
			config.plugins = [];
		}

		config.plugins = [ ...config.plugins, Delete, Default, Custom ];

		return Classic.create( element, config );
	}
}
`;

			expect( result ).to.equal( expected );
		} );

		it( 'should render file content with unique plugin names', () => {
			const result = utils.renderEntryFileContent( './bundle/tmp', {
				moduleName: 'MyCKEditor',
				editor: 'editor-classic/classic',
				plugins: [
					'plugin',
					'path/to/plugin',
					'other/path/to/plugin'
				]
			}, 'path/to/build' );

			const expected = `
'use strict';

// Babel helpers.
import '../../node_modules/regenerator-runtime/runtime.js';

import Classic from '../../path/to/build/ckeditor5/editor-classic/classic.js';
import Plugin from '../../path/to/build/ckeditor5/plugin/plugin.js';
import Plugin1 from '../../path/to/build/ckeditor5/path/to/plugin.js';
import Plugin2 from '../../path/to/build/ckeditor5/other/path/to/plugin.js';


export default class MyCKEditor extends Classic {
	static create( element, config = {} ) {
		if ( !config.plugins ) {
			config.plugins = [];
		}

		config.plugins = [ ...config.plugins, Plugin, Plugin1, Plugin2 ];

		return Classic.create( element, config );
	}
}
`;

			expect( result ).to.equal( expected );
		} );

		it( 'should render file content with proper without plugins', () => {
			const result = utils.renderEntryFileContent( './bundle/tmp', {
				moduleName: 'MyCKEditor',
				editor: 'editor-classic/classic'
			}, 'path/to/build' );

			const expected = `
'use strict';

// Babel helpers.
import '../../node_modules/regenerator-runtime/runtime.js';

import Classic from '../../path/to/build/ckeditor5/editor-classic/classic.js';


export default class MyCKEditor extends Classic {
	static create( element, config = {} ) {
		if ( !config.plugins ) {
			config.plugins = [];
		}

		config.plugins = [ ...config.plugins,  ];

		return Classic.create( element, config );
	}
}
`;

			expect( result ).to.equal( expected );
		} );
	} );

	describe( 'getFileSize', () => {
		it( 'should return file size in bytes', () => {
			const filePath = 'path/to/file';
			const size = 1337;
			const statSyncMock = sandbox.stub( fs, 'statSync', () => {
				return { size };
			} );

			expect( utils.getFileSize( filePath ) ).to.be.equal( size );
			sinon.assert.calledWithExactly( statSyncMock, filePath );
		} );
	} );

	describe( 'getGzippedFileSize', () => {
		it( 'should return file size in bytes', () => {
			const filePath = 'path/to/file';
			const size = 1337;
			const fileContent = 'some string';
			const readFileSyncMock = sandbox.stub( fs, 'readFileSync', () => fileContent );
			const gzipSizeMock = sandbox.stub( gzipSize, 'sync', () => 1337 );

			expect( utils.getGzippedFileSize( filePath ) ).to.be.equal( size );
			sinon.assert.calledWithExactly( readFileSyncMock, filePath );
			sinon.assert.calledWithExactly( gzipSizeMock, fileContent );
		} );
	} );

	describe( 'getFilesSizeStats', () => {
		let size, gzippedSize;

		beforeEach( () => {
			size = 1337;
			gzippedSize = 543;

			sandbox.stub( utils, 'getFileSize', () => size );
			sandbox.stub( utils, 'getGzippedFileSize', () => gzippedSize );
		} );

		it( 'should returns an array with two elements', () => {
			const result = utils.getFilesSizeStats( [ 'sub/dir/file.js', 'other/sub/dir/file.css' ], 'root/path' );

			expect( result ).to.be.an( 'array' );
			expect( result ).to.have.length( 2 );
		} );

		it( 'should returns list of object with files stats', () => {
			const result = utils.getFilesSizeStats( [ 'sub/dir/file.js', 'other/sub/dir/file.css' ], 'root/path' );

			expect( result ).to.be.deep.equal( [
				{ name: 'file.js', size, gzippedSize },
				{ name: 'file.css', size, gzippedSize }
			] );
		} );

		it( 'should get files from root directory', () => {
			let basenameSpy = sandbox.spy( path, 'basename' );

			const result = utils.getFilesSizeStats( [ 'sub/dir/file.js', 'other/sub/dir/file.css' ], 'root/path' );

			expect( result[ 0 ] ).to.have.property( 'name', 'file.js' );
			expect( result[ 1 ] ).to.have.property( 'name', 'file.css' );
			sinon.assert.calledWithExactly( basenameSpy.firstCall, 'root/path/sub/dir/file.js' );
			sinon.assert.calledWithExactly( basenameSpy.secondCall, 'root/path/other/sub/dir/file.css' );
		} );

		it( 'should get files if root directory is not specified', () => {
			let basenameSpy = sandbox.spy( path, 'basename' );

			const result = utils.getFilesSizeStats( [ 'sub/dir/file.js', 'file.css' ] );

			expect( result[ 0 ] ).to.have.property( 'name', 'file.js' );
			expect( result[ 1 ] ).to.have.property( 'name', 'file.css' );
			sinon.assert.calledWithExactly( basenameSpy.firstCall, 'sub/dir/file.js' );
			sinon.assert.calledWithExactly( basenameSpy.secondCall, 'file.css' );
		} );
	} );
} );
