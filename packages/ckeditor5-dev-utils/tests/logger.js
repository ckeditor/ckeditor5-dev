/**
 * @license Copyright (c) 2003-2023, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const sinon = require( 'sinon' );
const chai = require( 'chai' );
const expect = chai.expect;
const logger = require( '../lib/logger' );

describe( 'logger', () => {
	const logMessage = 'An example.';
	let sandbox, log;

	beforeEach( () => {
		sandbox = sinon.createSandbox();
	} );

	afterEach( () => {
		sandbox.restore();
	} );

	it( 'provides an API for set verbosity level', () => {
		expect( logger ).to.be.a( 'function' );
	} );

	describe( 'verbosity = info', () => {
		beforeEach( () => {
			log = logger( 'info' );
		} );

		describe( 'logger.info()', () => {
			it( 'should log a message', () => {
				const consoleLog = sandbox.stub( console, 'log' );

				log.info( logMessage );

				expect( consoleLog.calledOnce ).to.equal( true );
				expect( consoleLog.firstCall.args[ 0 ] ).to.equal( logMessage );

				consoleLog.restore();
			} );
		} );

		describe( 'logger.warning()', () => {
			it( 'should log a message', () => {
				const consoleLog = sandbox.stub( console, 'log' );

				log.warning( logMessage );

				expect( consoleLog.calledOnce ).to.equal( true );
				expect( consoleLog.firstCall.args[ 0 ] ).to.match( new RegExp( logMessage ) );

				consoleLog.restore();
			} );
		} );

		describe( 'logger.error()', () => {
			it( 'should log a message', () => {
				const consoleLog = sandbox.stub( console, 'log' );

				log.error( logMessage );

				expect( consoleLog.calledOnce ).to.equal( true );
				expect( consoleLog.firstCall.args[ 0 ] ).to.match( new RegExp( logMessage ) );

				consoleLog.restore();
			} );
		} );
	} );

	describe( 'verbosity = warning', () => {
		beforeEach( () => {
			log = logger( 'warning' );
		} );

		describe( 'logger.info()', () => {
			it( 'should not log any message', () => {
				const consoleLog = sandbox.stub( console, 'log' );

				log.info( logMessage );

				expect( consoleLog.called ).to.equal( false );

				consoleLog.restore();
			} );
		} );

		describe( 'logger.warning()', () => {
			it( 'should log a message', () => {
				const consoleLog = sandbox.stub( console, 'log' );

				log.warning( logMessage );

				expect( consoleLog.calledOnce ).to.equal( true );
				expect( consoleLog.firstCall.args[ 0 ] ).to.match( new RegExp( logMessage ) );

				consoleLog.restore();
			} );
		} );

		describe( 'logger.error()', () => {
			it( 'should log a message', () => {
				const consoleLog = sandbox.stub( console, 'log' );

				log.error( logMessage );

				expect( consoleLog.calledOnce ).to.equal( true );
				expect( consoleLog.firstCall.args[ 0 ] ).to.match( new RegExp( logMessage ) );

				consoleLog.restore();
			} );
		} );
	} );

	describe( 'verbosity = error', () => {
		beforeEach( () => {
			log = logger( 'error' );
		} );

		describe( 'logger.info()', () => {
			it( 'should not log any message', () => {
				const consoleLog = sandbox.stub( console, 'log' );

				log.info( logMessage );

				expect( consoleLog.called ).to.equal( false );

				consoleLog.restore();
			} );
		} );

		describe( 'logger.warning()', () => {
			it( 'should not log any message', () => {
				const consoleLog = sandbox.stub( console, 'log' );

				log.warning( logMessage );

				expect( consoleLog.called ).to.equal( false );

				consoleLog.restore();
			} );
		} );

		describe( 'logger.error()', () => {
			it( 'should log a message', () => {
				const consoleLog = sandbox.stub( console, 'log' );

				log.error( logMessage );

				expect( consoleLog.calledOnce ).to.equal( true );
				expect( consoleLog.firstCall.args[ 0 ] ).to.match( new RegExp( logMessage ) );

				consoleLog.restore();
			} );
		} );
	} );

	describe( 'uses default verbosity', () => {
		beforeEach( () => {
			log = logger();
		} );

		describe( 'logger.info()', () => {
			it( 'should log a message', () => {
				const consoleLog = sandbox.stub( console, 'log' );

				log.info( logMessage );

				expect( consoleLog.calledOnce ).to.equal( true );
				expect( consoleLog.firstCall.args[ 0 ] ).to.equal( logMessage );

				consoleLog.restore();
			} );
		} );
	} );

	describe( 'printing error', () => {
		beforeEach( () => {
			log = logger();
		} );

		it( 'should log a message', () => {
			const consoleLog = sandbox.stub( console, 'log' );
			const consoleDir = sandbox.stub( console, 'dir' );

			const error = new Error();

			log.error( logMessage, error );

			expect( consoleDir.calledOnce ).to.equal( true );
			expect( consoleDir.firstCall.args[ 0 ] ).to.equal( error );
			expect( consoleDir.firstCall.args[ 1 ] ).to.deep.equal( { depth: null } );

			consoleLog.restore();
			consoleDir.restore();
		} );
	} );
} );
