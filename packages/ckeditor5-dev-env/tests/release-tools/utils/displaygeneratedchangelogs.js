/**
 * @license Copyright (c) 2003-2018, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const expect = require( 'chai' ).expect;
const sinon = require( 'sinon' );
const proxyquire = require( 'proxyquire' );

describe( 'dev-env/release-tools/utils', () => {
	let displayGeneratedChangelogs, sandbox, stubs;

	beforeEach( () => {
		sandbox = sinon.sandbox.create();

		stubs = {
			logger: {
				info: sandbox.stub(),
				warning: sandbox.stub(),
				error: sandbox.stub()
			}
		};

		displayGeneratedChangelogs = proxyquire( '../../../lib/release-tools/utils/displaygeneratedchangelogs', {
			'@ckeditor/ckeditor5-dev-utils': {
				logger() {
					return stubs.logger;
				}
			}
		} );
	} );

	afterEach( () => {
		sandbox.restore();
	} );

	describe( 'displayGeneratedChangelogs()', () => {
		it( 'displays name of packages that have been skipped', () => {
			const logMessage = [
				'Generated changelog for the following packages:',
				'  * "@ckeditor/ckeditor5-foo": v1.0.0',
				'  * "@ckeditor/ckeditor5-bar": v2.0.0'
			].join( '\n' );

			displayGeneratedChangelogs( new Map( [
				[ '@ckeditor/ckeditor5-foo', '1.0.0' ],
				[ '@ckeditor/ckeditor5-bar', '2.0.0' ]
			] ) );

			expect( stubs.logger.info.calledOnce ).to.equal( true );
			expect( stubs.logger.info.firstCall.args[ 0 ] ).to.equal( logMessage );
		} );

		it( 'does not display if given list is empty', () => {
			displayGeneratedChangelogs( new Map() );
			expect( stubs.logger.info.calledOnce ).to.equal( false );
		} );
	} );
} );
