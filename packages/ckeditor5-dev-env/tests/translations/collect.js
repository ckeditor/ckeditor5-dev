/**
 * @license Copyright (c) 2003-2017, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

/* global describe, it, beforeEach, afterEach */

'use strict';

const sinon = require( 'sinon' );
const utils = require( '../../lib/translations/collect-utils' );
const collect = require( '../../lib/translations/collect' );

describe( 'collect', () => {
	let sandbox;

	beforeEach( () => {
		sandbox = sinon.sandbox.create();
	} );

	afterEach( () => {
		sandbox.restore();
	} );

	it( 'should collect translations', () => {
		sandbox.stub( utils, 'getContexts', () => new Map( [ [
			'ckeditor5-ui',
			{
				filePath: 'path/to/file',
				content: {}
			}
		] ] ) );
		sandbox.stub( utils, 'collectTranslations', () => [] );
		sandbox.stub( utils, 'getUnusedContextErrorMessages', () => [] );
		sandbox.stub( utils, 'getMissingContextErrorMessages', () => [] );
		sandbox.stub( utils, 'getRepeatedContextErrorMessages', () => [] );
		sandbox.stub( utils, 'createPotFileHeader', () => 'header' );
		sandbox.stub( utils, 'createPotFileContent', () => 'content' );

		const savePotFileStub = sandbox.stub( utils, 'savePotFile', () => [] );

		collect();

		sinon.assert.calledOnce( savePotFileStub );
		sinon.assert.calledWithExactly( savePotFileStub, 'ckeditor5-ui', 'headercontent' );
	} );
} );
