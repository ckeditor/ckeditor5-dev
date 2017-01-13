/**
 * @license Copyright (c) 2003-2017, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

/* global describe, it, beforeEach, afterEach */

'use strict';

const path = require( 'path' );
const chai = require( 'chai' );
const sinon = require( 'sinon' );
const expect = chai.expect;
const mockery = require( 'mockery' );
const glob = require( 'glob' );
const fs = require( 'fs-extra' );

describe( 'collect-utils', () => {
	let sandbox;
	let utils;

	beforeEach( () => {
		sandbox = sinon.sandbox.create();
		sandbox.stub( process, 'cwd', () => path.join( 'workspace', 'ckeditor5' ) );
		utils = require( '../lib/tasks/translations/collect-utils' );
	} );

	afterEach( () => {
		mockery.deregisterAll();
		sandbox.restore();
	} );

	it( 'collectTranslations() should collect info about t() calls', () => {
		const fileContents = {
			'/ckeditor5-core/file1.js': '= t( \'Bold\' );',
			'/ckeditor5-utils/file2.js': '= t( \'Italic [context: italic style]\' );',
		};

		const globSyncStub = sandbox.stub( glob, 'sync', () => [
			path.sep + path.join( 'ckeditor5-core', 'file1.js' ),
			path.sep + path.join( 'ckeditor5-utils', 'file2.js' )
		] );

		const readFileStub = sandbox.stub( fs, 'readFileSync', fileName => fileContents[ fileName ] );

		const translations = utils.collectTranslations();

		sinon.assert.calledWithExactly( globSyncStub,
			path.join( 'workspace', 'ckeditor5', 'node_modules' ,'ckeditor5-!(dev)*', 'src', '**', '*.js' )
		);
		sinon.assert.calledTwice( readFileStub );
		sinon.assert.calledWithExactly( readFileStub, path.sep + path.join( 'ckeditor5-core', 'file1.js' ), 'utf-8' );
		sinon.assert.calledWithExactly( readFileStub, path.sep + path.join( 'ckeditor5-utils', 'file2.js' ), 'utf-8' );

		expect( translations ).to.deep.equal( [ {
			filePath: '/ckeditor5-core/file1.js',
			key: 'Bold',
			package: 'ckeditor5-core',
			context: null,
			sentence: 'Bold',
		}, {
			filePath: '/ckeditor5-utils/file2.js',
			key: 'Italic [context: italic style]',
			package: 'ckeditor5-utils',
			context: 'italic style',
			sentence: 'Italic',
		} ] );
	} );

	it( 'getContexts() should collect contexts.json files across ckeditor5/node_modules/ckeditor5-* packages', () => {
		const path1 = path.join( 'workspace', 'ckeditor5', 'node_modules', 'ckeditor5-core', 'lang', 'contexts.json' );
		const path2 = path.join( 'workspace', 'ckeditor5', 'node_modules', 'ckeditor5-utils', 'lang', 'contexts.json' );

		const fileContents = {
			[ path1 ]: '{ "italic style": "Italic style" }',
			[ path2 ]: '{}'
		};

		const readDirStub = sandbox.stub( fs, 'readdirSync', () => ( [ 'ckeditor5-core', 'ckeditor5-utils', 'docs-builder' ] ) );
		sandbox.stub( fs, 'existsSync', () => true );
		sandbox.stub( fs, 'readFileSync', ( filePath ) => fileContents[ filePath ] );

		const contexts = utils.getContexts();

		sinon.assert.calledWithExactly( readDirStub, path.join( 'workspace', 'ckeditor5', 'node_modules' ) );
		expect( [ ...contexts ] ).to.deep.equal( [
			[ 'ckeditor5-core', { filePath: path1, content: { 'italic style': 'Italic style' } } ],
			[ 'ckeditor5-utils', { filePath: path2, content: {} } ]
		] );
	} );
} );
