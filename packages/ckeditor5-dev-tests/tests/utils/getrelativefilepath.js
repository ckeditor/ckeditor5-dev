/**
 * @license Copyright (c) 2003-2021, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const path = require( 'path' );
const sinon = require( 'sinon' );
const { expect } = require( 'chai' );

describe( 'dev-tests/utils', () => {
	let getRelativeFilePath;

	beforeEach( () => {
		getRelativeFilePath = require( '../../lib/utils/getrelativefilepath' );
	} );

	describe( 'getRelativeFilePath()', () => {
		let sandbox;

		beforeEach( () => {
			sandbox = sinon.createSandbox();
		} );

		afterEach( () => {
			sandbox.restore();
		} );

		describe( 'Unix paths', () => {
			beforeEach( () => {
				sandbox.stub( path, 'join' ).callsFake( ( ...args ) => args.join( '/' ) );
			} );

			it( 'returns path which starts with package name (simple check)', () => {
				sandbox.stub( process, 'cwd' ).returns( '/Users/foo' );

				checkPath( '/Users/foo/packages/ckeditor5-foo/tests/manual/foo.js', 'ckeditor5-foo/tests/manual/foo.js' );
			} );

			it( 'returns path which starts with package name (workspace directory looks like package name)', () => {
				sandbox.stub( process, 'cwd' ).returns( '/Users/foo/ckeditor5-workspace/ckeditor5' );

				checkPath(
					'/Users/foo/ckeditor5-workspace/ckeditor5/packages/ckeditor5-foo/tests/manual/foo.js',
					'ckeditor5-foo/tests/manual/foo.js'
				);
			} );

			it( 'returns a proper path for "ckeditor-" prefix', () => {
				sandbox.stub( process, 'cwd' ).returns( '/work/space' );

				checkPath( '/work/space/packages/ckeditor-foo/tests/manual/foo.js', 'ckeditor-foo/tests/manual/foo.js' );
			} );

			it( 'returns a proper path for "ckeditor-" prefix and "ckeditor.js" file', () => {
				sandbox.stub( process, 'cwd' ).returns( '/work/space' );

				checkPath( '/work/space/packages/ckeditor-foo/tests/manual/ckeditor.js', 'ckeditor-foo/tests/manual/ckeditor.js' );
			} );

			it( 'returns a proper path to from the main (root) package', () => {
				sandbox.stub( process, 'cwd' ).returns( '/work/space' );
				checkPath( '/work/space/packages/ckeditor5/tests/manual/foo.js', 'ckeditor5/tests/manual/foo.js' );
			} );

			it( 'returns a proper path for "ckeditor5.js" file', () => {
				sandbox.stub( process, 'cwd' ).returns( '/work/space' );
				checkPath(
					'/work/space/packages/ckeditor5-build-a/tests/manual/ckeditor5.js',
					'ckeditor5-build-a/tests/manual/ckeditor5.js'
				);
			} );

			it( 'returns a proper path for "ckeditor.js" file', () => {
				sandbox.stub( process, 'cwd' ).returns( '/work/space' );
				checkPath(
					'/work/space/packages/ckeditor5-build-a/tests/manual/ckeditor.js',
					'ckeditor5-build-a/tests/manual/ckeditor.js' );
			} );
		} );

		describe( 'Windows paths', () => {
			beforeEach( () => {
				sandbox.stub( path, 'join' ).callsFake( ( ...args ) => args.join( '\\' ) );
			} );

			it( 'returns path which starts with package name (simple check)', () => {
				sandbox.stub( process, 'cwd' ).returns( 'C:\\work\\space' );

				checkPath( 'C:\\work\\space\\packages\\ckeditor5-foo\\tests\\manual\\foo.js', 'ckeditor5-foo\\tests\\manual\\foo.js' );
			} );

			it( 'returns path which starts with package name (workspace directory looks like package name)', () => {
				sandbox.stub( process, 'cwd' ).returns( 'C:\\Document and settings\\foo\\ckeditor5-workspace\\ckeditor5' );

				checkPath(
					'C:\\Document and settings\\foo\\ckeditor5-workspace\\ckeditor5\\packages\\ckeditor5-foo\\tests\\manual\\foo.js',
					'ckeditor5-foo\\tests\\manual\\foo.js'
				);
			} );

			it( 'returns a proper path for "ckeditor-" prefix', () => {
				sandbox.stub( process, 'cwd' ).returns( 'C:\\work\\space' );

				checkPath( 'C:\\work\\space\\packages\\ckeditor-foo\\tests\\manual\\foo.js', 'ckeditor-foo\\tests\\manual\\foo.js' );
			} );

			it( 'returns a proper path for "ckeditor-" prefix and "ckeditor.js" file', () => {
				sandbox.stub( process, 'cwd' ).returns( 'C:\\work\\space' );

				checkPath(
					'C:\\work\\space\\packages\\ckeditor-foo\\tests\\manual\\ckeditor.js',
					'ckeditor-foo\\tests\\manual\\ckeditor.js'
				);
			} );

			it( 'returns a proper path to from the main (root) package', () => {
				sandbox.stub( process, 'cwd' ).returns( 'C:\\work\\space' );
				checkPath( 'C:\\work\\space\\tests\\manual\\foo.js', 'ckeditor5\\tests\\manual\\foo.js' );
			} );

			it( 'returns a proper path for "ckeditor5.js" file', () => {
				sandbox.stub( process, 'cwd' ).returns( 'C:\\work\\space' );
				checkPath(
					'C:\\work\\space\\packages\\ckeditor5-build-a\\tests\\manual\\ckeditor5.js',
					'ckeditor5-build-a\\tests\\manual\\ckeditor5.js'
				);
			} );

			it( 'returns a proper path for "ckeditor.js" file', () => {
				sandbox.stub( process, 'cwd' ).returns( 'C:\\work\\space' );
				checkPath(
					'C:\\work\\space\\packages\\ckeditor5-build-a\\tests\\manual\\ckeditor.js',
					'ckeditor5-build-a\\tests\\manual\\ckeditor.js'
				);
			} );
		} );
	} );

	function checkPath( filePath, expectedPath ) {
		expect( getRelativeFilePath( filePath ) ).to.equal( expectedPath );
	}
} );
