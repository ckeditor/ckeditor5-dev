/**
 * @license Copyright (c) 2003-2017, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

/* jshint mocha:true */

'use strict';

const fs = require( 'fs' );
const chai = require( 'chai' );
const expect = chai.expect;
const sinon = require( 'sinon' );

describe( 'bundler', () => {
	let createEntryFile, sandbox;

	beforeEach( () => {
		sandbox = sinon.sandbox.create();

		createEntryFile = require( '../../lib/bundler/createentryfile' );
	} );

	afterEach( () => {
		sandbox.restore();
	} );

	describe( 'createEntryFile()', () => {
		it( 'should create an entry file', () => {
			const writeFileSyncStub = sandbox.stub( fs, 'writeFileSync' );

			createEntryFile( 'destination/path/file.js', './config-editor', {
				plugins: [
					'@ckeditor/ckeditor5-presets/src/article',
					'@ckeditor/ckeditor5-clipboard/src/clipboard'
				],
				moduleName: 'ClassicEditor',
				editor: '@ckeditor/ckeditor5-editor-classic/src/editor'
			} );

			const expectedEntryFile = `/**
 * @license Copyright (c) 2003-${ new Date().getFullYear() }, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import ClassicEditorBase from '@ckeditor/ckeditor5-editor-classic/src/editor';
import ArticlePlugin from '@ckeditor/ckeditor5-presets/src/article';
import ClipboardPlugin from '@ckeditor/ckeditor5-clipboard/src/clipboard';

export class ClassicEditor extends ClassicEditorBase {}

ClassicEditor.build = {
	plugins: [
		ArticlePlugin,
		ClipboardPlugin 
	],
	config: require( './config-editor' )
};
`;

			expect( writeFileSyncStub.calledOnce ).to.equal( true );
			expect( writeFileSyncStub.firstCall.args[ 0 ] ).to.equal( 'destination/path/file.js' );
			expect( writeFileSyncStub.firstCall.args[ 1 ] ).to.equal( expectedEntryFile );
		} );
	} );
} );
