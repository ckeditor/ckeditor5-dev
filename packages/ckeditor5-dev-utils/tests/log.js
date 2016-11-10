/**
 * @license Copyright (c) 2003-2016, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

/* global describe, it, beforeEach, afterEach */

'use strict';

const sinon = require( 'sinon' );
const chai = require( 'chai' );
const expect = chai.expect;
const gutil = require( 'gulp-util' );
const log = require( '../lib/log' );

describe( 'log', () => {
	const logMessage = 'An example.';
	let sandbox, logger;

	beforeEach( () => {
		sandbox = sinon.sandbox.create();
	} );

	afterEach( () => {
		sandbox.restore();
	} );

	it( 'provides an API for set verbosity level', () => {
		expect( log ).to.be.a( 'function' );
	} );

	describe( 'verbosity = info', () => {
		beforeEach( () => {
			logger = log( 'info' );
		} );

		describe( 'log.info()', () => {
			it( 'should log a message', () => {
				const gutilLog = sandbox.stub( gutil, 'log' );

				logger.info( logMessage );

				expect( gutilLog.calledOnce ).to.equal( true );
				expect( gutilLog.firstCall.args[ 0 ] ).to.equal( logMessage );
			} );

			it( 'should log a non-modified message', () => {
				const consoleLog = sandbox.stub( console, 'log' );

				logger.info( logMessage, { raw: true } );

				expect( consoleLog.calledOnce ).to.equal( true );
				expect( consoleLog.firstCall.args[ 0 ] ).to.equal( logMessage );
				consoleLog.restore();
			} );
		} );

		describe( 'log.warning()', () => {
			it( 'should log a message', () => {
				const gutilLog = sandbox.stub( gutil, 'log' );

				logger.warning( logMessage );

				expect( gutilLog.calledOnce ).to.equal( true );
				expect( gutilLog.firstCall.args[ 0 ] ).to.match( new RegExp( logMessage ) );
			} );

			it( 'should log a non-modified message', () => {
				const consoleLog = sandbox.stub( console, 'log' );

				logger.warning( logMessage, { raw: true } );

				expect( consoleLog.calledOnce ).to.equal( true );
				expect( consoleLog.firstCall.args[ 0 ] ).to.match( new RegExp( logMessage ) );
				consoleLog.restore();
			} );
		} );

		describe( 'log.error()', () => {
			it( 'should log a message', () => {
				const gutilLog = sandbox.stub( gutil, 'log' );

				logger.error( logMessage );

				expect( gutilLog.calledOnce ).to.equal( true );
				expect( gutilLog.firstCall.args[ 0 ] ).to.match( new RegExp( logMessage ) );
			} );

			it( 'should log a non-modified message', () => {
				const consoleLog = sandbox.stub( console, 'log' );

				logger.error( logMessage, { raw: true } );

				expect( consoleLog.calledOnce ).to.equal( true );
				expect( consoleLog.firstCall.args[ 0 ] ).to.match( new RegExp( logMessage ) );
				consoleLog.restore();
			} );
		} );
	} );

	describe( 'verbosity = warning', () => {
		beforeEach( () => {
			logger = log( 'warning' );
		} );

		describe( 'log.info()', () => {
			it( 'should not log any message', () => {
				const gutilLog = sandbox.stub( gutil, 'log' );
				const consoleLog = sandbox.stub( console, 'log' );

				logger.info( logMessage );
				logger.info( logMessage, { raw: true } );

				expect( gutilLog.called ).to.equal( false );
				expect( consoleLog.called ).to.equal( false );

				consoleLog.restore();
			} );
		} );

		describe( 'log.warning()', () => {
			it( 'should log a message', () => {
				const gutilLog = sandbox.stub( gutil, 'log' );

				logger.warning( logMessage );

				expect( gutilLog.calledOnce ).to.equal( true );
				expect( gutilLog.firstCall.args[ 0 ] ).to.match( new RegExp( logMessage ) );
			} );

			it( 'should log a non-modified message', () => {
				const consoleLog = sandbox.stub( console, 'log' );

				logger.warning( logMessage, { raw: true } );

				expect( consoleLog.calledOnce ).to.equal( true );
				expect( consoleLog.firstCall.args[ 0 ] ).to.match( new RegExp( logMessage ) );
				consoleLog.restore();
			} );
		} );

		describe( 'log.error()', () => {
			it( 'should log a message', () => {
				const gutilLog = sandbox.stub( gutil, 'log' );

				logger.error( logMessage );

				expect( gutilLog.calledOnce ).to.equal( true );
				expect( gutilLog.firstCall.args[ 0 ] ).to.match( new RegExp( logMessage ) );
			} );

			it( 'should log a non-modified message', () => {
				const consoleLog = sandbox.stub( console, 'log' );

				logger.error( logMessage, { raw: true } );

				expect( consoleLog.calledOnce ).to.equal( true );
				expect( consoleLog.firstCall.args[ 0 ] ).to.match( new RegExp( logMessage ) );
				consoleLog.restore();
			} );
		} );
	} );

	describe( 'verbosity = error', () => {
		beforeEach( () => {
			logger = log( 'error' );
		} );

		describe( 'log.info()', () => {
			it( 'should not log any message', () => {
				const gutilLog = sandbox.stub( gutil, 'log' );
				const consoleLog = sandbox.stub( console, 'log' );

				logger.info( logMessage );
				logger.info( logMessage, { raw: true } );

				expect( gutilLog.called ).to.equal( false );
				expect( consoleLog.called ).to.equal( false );

				consoleLog.restore();
			} );
		} );

		describe( 'log.warning()', () => {
			it( 'should not log any message', () => {
				const gutilLog = sandbox.stub( gutil, 'log' );
				const consoleLog = sandbox.stub( console, 'log' );

				logger.warning( logMessage );
				logger.warning( logMessage, { raw: true } );

				expect( gutilLog.called ).to.equal( false );
				expect( consoleLog.called ).to.equal( false );

				consoleLog.restore();
			} );
		} );

		describe( 'log.error()', () => {
			it( 'should log a message', () => {
				const gutilLog = sandbox.stub( gutil, 'log' );

				logger.error( logMessage );

				expect( gutilLog.calledOnce ).to.equal( true );
				expect( gutilLog.firstCall.args[ 0 ] ).to.match( new RegExp( logMessage ) );
			} );

			it( 'should log a non-modified message', () => {
				const consoleLog = sandbox.stub( console, 'log' );

				logger.error( logMessage, { raw: true } );

				expect( consoleLog.calledOnce ).to.equal( true );
				expect( consoleLog.firstCall.args[ 0 ] ).to.match( new RegExp( logMessage ) );
				consoleLog.restore();
			} );
		} );
	} );
} );
