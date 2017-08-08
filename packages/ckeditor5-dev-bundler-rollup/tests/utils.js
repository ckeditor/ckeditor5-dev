/**
 * @license Copyright (c) 2003-2015, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

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

	describe( 'maybeCleanDir()', () => {
		it( 'should clean directory if dir is provided', () => {
			const cleanStub = sandbox.stub( tools, 'clean' ).resolves();
			sandbox.stub( path, 'join' ).callsFake( x => x );

			const promise = utils.maybeCleanDir( 'dir' );
			sinon.assert.calledWithExactly( cleanStub, 'dir', '' );

			return promise;
		} );

		it( 'should return resolved promise if no dir is provided', () => {
			const cleanStub = sandbox.stub( tools, 'clean' ).resolves();
			sandbox.stub( path, 'join' ).callsFake( x => x );

			const promise = utils.maybeCleanDir();
			sinon.assert.notCalled( cleanStub );

			return promise;
		} );
	} );

	describe( 'cleanFiles()', () => {
		it( 'should clean every file with specific filename', () => {
			sandbox.stub( tools, 'clean' ).callsFake( ( path, filePattern ) => {
				return { path, filePattern };
			} );

			const result = utils.cleanFiles( 'destinationPath', 'fileName' );

			expect( result.path ).to.be.equal( 'destinationPath' );
			expect( result.filePattern ).to.be.equal( 'fileName.*' );
		} );
	} );

	describe( 'getFileSize', () => {
		it( 'should return file size in bytes', () => {
			const filePath = 'path/to/file';
			const size = 1337;
			const statSyncMock = sandbox.stub( fs, 'statSync' ).returns( { size } );

			expect( utils.getFileSize( filePath ) ).to.be.equal( size );
			sinon.assert.calledWithExactly( statSyncMock, filePath );
		} );
	} );

	describe( 'getGzippedFileSize', () => {
		it( 'should return file size in bytes', () => {
			const filePath = 'path/to/file';
			const size = 1337;
			const fileContent = 'some string';
			const readFileSyncMock = sandbox.stub( fs, 'readFileSync' ).returns( fileContent );
			const gzipSizeMock = sandbox.stub( gzipSize, 'sync' ).returns( 1337 );

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

			sandbox.stub( utils, 'getFileSize' ).returns( size );
			sandbox.stub( utils, 'getGzippedFileSize' ).returns( gzippedSize );
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
			const basenameSpy = sandbox.spy( path, 'basename' );
			const result = utils.getFilesSizeStats( [ 'sub/dir/file.js', 'other/sub/dir/file.css' ], 'root/path' );

			expect( result[ 0 ] ).to.have.property( 'name', 'file.js' );
			expect( result[ 1 ] ).to.have.property( 'name', 'file.css' );
			sinon.assert.calledWithExactly( basenameSpy.firstCall, 'root/path/sub/dir/file.js' );
			sinon.assert.calledWithExactly( basenameSpy.secondCall, 'root/path/other/sub/dir/file.css' );
		} );

		it( 'should get files if root directory is not specified', () => {
			const basenameSpy = sandbox.spy( path, 'basename' );
			const result = utils.getFilesSizeStats( [ 'sub/dir/file.js', 'file.css' ] );

			expect( result[ 0 ] ).to.have.property( 'name', 'file.js' );
			expect( result[ 1 ] ).to.have.property( 'name', 'file.css' );
			sinon.assert.calledWithExactly( basenameSpy.firstCall, 'sub/dir/file.js' );
			sinon.assert.calledWithExactly( basenameSpy.secondCall, 'file.css' );
		} );
	} );
} );
