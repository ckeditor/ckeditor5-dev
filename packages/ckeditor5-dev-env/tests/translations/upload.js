/**
 * @license Copyright (c) 2003-2020, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const path = require( 'path' );
const sinon = require( 'sinon' );
const mockery = require( 'mockery' );
const { expect } = require( 'chai' );
const proxyquire = require( 'proxyquire' );

describe( 'upload', () => {
	let sandbox, stubs, upload, packageNames, serverResources, fileContents;

	beforeEach( () => {
		sandbox = sinon.createSandbox();

		mockery.enable( {
			useCleanCache: true,
			warnOnReplace: false,
			warnOnUnregistered: false
		} );

		stubs = {
			logger: {
				info: sandbox.stub(),
				warning: sandbox.stub(),
				error: sandbox.stub()
			},

			transifexService: {
				getResources: sandbox.spy( () => Promise.resolve( serverResources ) ),
				postResource: sandbox.spy( () => Promise.resolve( [] ) ),
				putResourceContent: sandbox.spy( () => Promise.resolve( {} ) )
			},

			fs: {
				readdirSync: sandbox.spy( () => packageNames ),
				createReadStream: sandbox.spy( fileName => fileContents[ fileName ] )
			}
		};

		mockery.registerMock( './transifex-service', stubs.transifexService );

		sandbox.stub( process, 'cwd' ).returns( path.join( 'workspace', 'ckeditor5' ) );

		upload = proxyquire( '../../lib/translations/upload', {
			'@ckeditor/ckeditor5-dev-utils': {
				logger: () => stubs.logger
			},
			'fs': stubs.fs
		} );
	} );

	afterEach( () => {
		mockery.disable();
		sandbox.restore();
	} );

	it( 'should create and update resources on the Transifex', () => {
		packageNames = [
			'ckeditor5-core',
			'ckeditor5-ui',
		];

		serverResources = [ {
			slug: 'ckeditor5-core'
		} ];

		fileContents = {
			'workspace/ckeditor5/build/.transifex/ckeditor5-ui/en.pot': '# ckeditor-ui en.pot content',
			'workspace/ckeditor5/build/.transifex/ckeditor5-core/en.pot': '# ckeditor-core en.pot content',
		};

		return upload( { token: 'secretToken' } )
			.then( () => {
				sinon.assert.calledOnce( stubs.transifexService.getResources );
				sinon.assert.calledWithExactly(
					stubs.fs.readdirSync, path.join( 'workspace', 'ckeditor5', 'build', '.transifex' )
				);

				sinon.assert.calledOnce( stubs.transifexService.postResource );
				sinon.assert.calledWithExactly( stubs.transifexService.postResource, {
					token: 'secretToken',
					name: 'ckeditor5-ui',
					slug: 'ckeditor5-ui',
					content: '# ckeditor-ui en.pot content'
				} );

				sinon.assert.calledOnce( stubs.transifexService.putResourceContent );

				sinon.assert.calledWithExactly( stubs.transifexService.putResourceContent, {
					token: 'secretToken',
					slug: 'ckeditor5-core',
					name: 'ckeditor5-core',
					content: '# ckeditor-core en.pot content'
				} );
			} );
	} );

	it( 'should report an error and throw it when something goes wrong', () => {
		const error = new Error();
		stubs.transifexService.getResources = sandbox.spy( () => Promise.reject( error ) );

		return upload( { token: 'secretToken' } )
			.then( () => {
				throw new Error( 'It should throws an error' );
			}, err => {
				expect( err ).to.equal( error );
				sinon.assert.calledOnce( stubs.logger.error );
				sinon.assert.calledWithExactly( stubs.logger.error, error );
			} );
	} );
} );
