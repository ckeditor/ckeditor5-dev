/**
 * @license Copyright (c) 2003-2017, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

/* global describe, it, beforeEach, afterEach */

'use strict';

const path = require( 'path' );
const sinon = require( 'sinon' );
const mockery = require( 'mockery' );
const transifexService = require( '../../lib/translations/transifex-service' );
const fs = require( 'fs' );

describe( 'upload', () => {
	let sandbox;
	let upload;

	beforeEach( () => {
		sandbox = sinon.sandbox.create();
		mockery.registerMock( '@ckeditor/ckeditor5-dev-utils', {
			logger: () => ( {
				info() {},
				error() {}
			} )
		} );
		sandbox.stub( process, 'cwd', () => path.join( 'workspace', 'ckeditor5' ) );

		upload = require( '../../lib/translations/upload' );
	} );

	afterEach( () => {
		mockery.deregisterAll();
		sandbox.restore();
	} );

	it( 'should be able to create and update resource on Transifex', () => {
		const packageNames = [
			'ckeditor5-core',
			'ckeditor5-ui',
		];

		const getResourcesSpy = sandbox.spy( () => ( [ {
			slug: 'ckeditor5-core'
		} ] ) );
		const postResourceSpy = sandbox.spy( () => Promise.resolve( '[]' ) );
		const putResourceContentSpy = sandbox.spy( () => Promise.resolve( '{}' ) );

		sandbox.stub( transifexService, 'getResources', getResourcesSpy );
		sandbox.stub( transifexService, 'postResource', postResourceSpy );
		sandbox.stub( transifexService, 'putResourceContent', putResourceContentSpy );

		const readDirSyncStub = sandbox.stub( fs, 'readdirSync', () => packageNames );
		const createReadStreamStub = sandbox.stub( fs, 'createReadStream', ( path ) => `${path} content` );

		return upload( { username: 'username', password: 'password' } ).then( () => {
			sinon.assert.calledOnce( getResourcesSpy );
			sinon.assert.calledTwice( createReadStreamStub );
			sinon.assert.calledWithExactly( readDirSyncStub, path.join( 'workspace', 'ckeditor5', 'build', '.transifex' ) );

			sinon.assert.calledOnce( postResourceSpy );
			sinon.assert.calledWithExactly( postResourceSpy, {
				username: 'username',
				password: 'password',
				name: 'ckeditor5-ui',
				slug: 'ckeditor5-ui',
				content: 'workspace/ckeditor5/build/.transifex/ckeditor5-ui/en.pot content'
			} );

			sinon.assert.calledOnce( putResourceContentSpy );

			sinon.assert.calledWithExactly( putResourceContentSpy, {
				username: 'username',
				password: 'password',
				slug: 'ckeditor5-core',
				name: 'ckeditor5-core',
				content: 'workspace/ckeditor5/build/.transifex/ckeditor5-core/en.pot content'
			} );
		} );
	} );
} );
