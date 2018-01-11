/**
 * @license Copyright (c) 2003-2018, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

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

			createEntryFile( 'destination/path/file.js', {
				plugins: [
					'@ckeditor/ckeditor5-basic-styles/src/bold',
					'@ckeditor/ckeditor5-clipboard/src/clipboard'
				],
				moduleName: 'ClassicEditor',
				editor: '@ckeditor/ckeditor5-editor-classic/src/editor',
				config: {
					undo: {
						step: 3,
					},
					toolbar: [
						'image'
					]
				}
			} );

			const expectedEntryFile = `/**
 * @license Copyright (c) 2003-${ new Date().getFullYear() }, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import ClassicEditorBase from '@ckeditor/ckeditor5-editor-classic/src/editor';
import BoldPlugin from '@ckeditor/ckeditor5-basic-styles/src/bold';
import ClipboardPlugin from '@ckeditor/ckeditor5-clipboard/src/clipboard';

export default class ClassicEditor extends ClassicEditorBase {}

ClassicEditor.build = {
	plugins: [
		BoldPlugin,
		ClipboardPlugin
	],
	config: {
		undo: {
			step: 3
		},
		toolbar: [
			'image'
		]
	}
};
`;

			expect( writeFileSyncStub.calledOnce ).to.equal( true );
			expect( writeFileSyncStub.firstCall.args[ 0 ] ).to.equal( 'destination/path/file.js' );
			expect( writeFileSyncStub.firstCall.args[ 1 ] ).to.equal( expectedEntryFile );
		} );
	} );
} );
