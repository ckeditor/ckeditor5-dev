/**
 * @license Copyright (c) 2003-2016, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

/* global describe, it, beforeEach, afterEach */

'use strict';

const sinon = require( 'sinon' );
const chai = require( 'chai' );
const expect = chai.expect;
const { workspace } = require( '@ckeditor/ckeditor5-dev-utils' );
const proxyquire = require( 'proxyquire' );

describe( 'dev-init', () => {
	let initTask, spies;
	const ckeditor5Path = 'path/to/ckeditor5';
	const workspaceRoot = '..';

	beforeEach( () => {
		spies = {
			loggerInfo: sinon.spy(),
			loggerWarning: sinon.spy(),
			loggerError: sinon.spy(),
			getDependencies: sinon.spy( workspace, 'getDependencies' ),
			installFunction: sinon.spy()
		};

		initTask = proxyquire( '../lib/tasks/init', {
			'@ckeditor/ckeditor5-dev-utils': {
				logger: () => {
					return {
						info: spies.loggerInfo,
						warning: spies.loggerWarning,
						error: spies.loggerError
					};
				}
			}
		} );
	} );

	afterEach( () => {
		for ( let spy in spies ) {
			spy = spies[ spy ];

			if ( spy.restore ) {
				spy.restore();
			}
		}
	} );

	it( 'should get all ckedtior5- dependencies and execute dev-install on them', () => {
		const JSON = {
			dependencies: {
				'ckeditor5-core': 'ckeditor/ckeditor5-code',
				'non-ckeditor-plugin': '^2.0.0',
				'ckeditor5-plugin-devtest': 'ckeditor/ckeditor5-plugin-devtest'
			}
		};
		const deps = JSON.dependencies;

		initTask( spies.installFunction, ckeditor5Path, JSON, workspaceRoot );

		expect( spies.getDependencies.calledOnce ).to.equal( true );
		expect( spies.getDependencies.firstCall.args[ 0 ] ).to.equal( deps );
		expect( spies.installFunction.calledTwice ).to.equal( true );
		expect( spies.installFunction.firstCall.args[ 0 ] ).to.equal( ckeditor5Path );
		expect( spies.installFunction.firstCall.args[ 1 ] ).to.equal( workspaceRoot );
		expect( spies.installFunction.firstCall.args[ 2 ] ).to.equal( deps[ 'ckeditor5-core' ] );
		expect( spies.installFunction.secondCall.args[ 0 ] ).to.equal( ckeditor5Path );
		expect( spies.installFunction.secondCall.args[ 1 ] ).to.equal( workspaceRoot );
		expect( spies.installFunction.secondCall.args[ 2 ] ).to.equal( deps[ 'ckeditor5-plugin-devtest' ] );
		expect( spies.loggerInfo.calledTwice ).to.equal( true );
		expect( spies.loggerInfo.firstCall.args[ 0 ] ).to.match( /ckeditor5-core/ );
		expect( spies.loggerInfo.secondCall.args[ 0 ] ).to.match( /ckeditor5-plugin-devtest/ );
	} );

	it( 'should not call dev-install if no ckedtior5- dependencies', () => {
		const JSON = {
			dependencies: {}
		};

		initTask( spies.installFunction, ckeditor5Path, JSON, workspaceRoot );

		expect( spies.getDependencies.calledOnce ).to.equal( true );
		expect( spies.getDependencies.firstCall.args[ 0 ] ).to.deep.equal( {} );
		expect( spies.installFunction.called ).to.equal( false );
		expect( spies.loggerInfo.calledOnce ).to.equal( true );
		expect( spies.loggerInfo.firstCall.args[ 0 ] ).to.equal( 'No CKEditor5 dependencies (ckeditor5-) found in package.json file.' );
	} );
} );
