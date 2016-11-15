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
const logger = require( '../lib/logger' );

describe( 'logger', () => {
	const logMessage = 'An example.';
	let sandbox, log;

	beforeEach( () => {
		sandbox = sinon.sandbox.create();
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

		describe( 'loggger.info()', () => {
			it( 'should log a message', () => {
				const gutilLog = sandbox.stub( gutil, 'log' );

				log.info( logMessage );

				expect( gutilLog.calledOnce ).to.equal( true );
				expect( gutilLog.firstCall.args[ 0 ] ).to.equal( logMessage );
			} );

			it( 'should log a non-modified message', () => {
				const consoleLog = sandbox.stub( console, 'log' );

				log.info( logMessage, { raw: true } );

				expect( consoleLog.calledOnce ).to.equal( true );
				expect( consoleLog.firstCall.args[ 0 ] ).to.equal( logMessage );
				consoleLog.restore();
			} );
		} );

		describe( 'loggger.warning()', () => {
			it( 'should log a message', () => {
				const gutilLog = sandbox.stub( gutil, 'log' );

				log.warning( logMessage );

				expect( gutilLog.calledOnce ).to.equal( true );
				expect( gutilLog.firstCall.args[ 0 ] ).to.match( new RegExp( logMessage ) );
			} );

			it( 'should log a non-modified message', () => {
				const consoleLog = sandbox.stub( console, 'log' );

				log.warning( logMessage, { raw: true } );

				expect( consoleLog.calledOnce ).to.equal( true );
				expect( consoleLog.firstCall.args[ 0 ] ).to.match( new RegExp( logMessage ) );
				consoleLog.restore();
			} );
		} );

		describe( 'loggger.error()', () => {
			it( 'should log a message', () => {
				const gutilLog = sandbox.stub( gutil, 'log' );

				log.error( logMessage );

				expect( gutilLog.calledOnce ).to.equal( true );
				expect( gutilLog.firstCall.args[ 0 ] ).to.match( new RegExp( logMessage ) );
			} );

			it( 'should log a non-modified message', () => {
				const consoleLog = sandbox.stub( console, 'log' );

				log.error( logMessage, { raw: true } );

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

		describe( 'loggger.info()', () => {
			it( 'should not log any message', () => {
				const gutilLog = sandbox.stub( gutil, 'log' );
				const consoleLog = sandbox.stub( console, 'log' );

				log.info( logMessage );
				log.info( logMessage, { raw: true } );

				expect( gutilLog.called ).to.equal( false );
				expect( consoleLog.called ).to.equal( false );

				consoleLog.restore();
			} );
		} );

		describe( 'loggger.warning()', () => {
			it( 'should log a message', () => {
				const gutilLog = sandbox.stub( gutil, 'log' );

				log.warning( logMessage );

				expect( gutilLog.calledOnce ).to.equal( true );
				expect( gutilLog.firstCall.args[ 0 ] ).to.match( new RegExp( logMessage ) );
			} );

			it( 'should log a non-modified message', () => {
				const consoleLog = sandbox.stub( console, 'log' );

				log.warning( logMessage, { raw: true } );

				expect( consoleLog.calledOnce ).to.equal( true );
				expect( consoleLog.firstCall.args[ 0 ] ).to.match( new RegExp( logMessage ) );
				consoleLog.restore();
			} );
		} );

		describe( 'loggger.error()', () => {
			it( 'should log a message', () => {
				const gutilLog = sandbox.stub( gutil, 'log' );

				log.error( logMessage );

				expect( gutilLog.calledOnce ).to.equal( true );
				expect( gutilLog.firstCall.args[ 0 ] ).to.match( new RegExp( logMessage ) );
			} );

			it( 'should log a non-modified message', () => {
				const consoleLog = sandbox.stub( console, 'log' );

				log.error( logMessage, { raw: true } );

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

		describe( 'loggger.info()', () => {
			it( 'should not log any message', () => {
				const gutilLog = sandbox.stub( gutil, 'log' );
				const consoleLog = sandbox.stub( console, 'log' );

				log.info( logMessage );
				log.info( logMessage, { raw: true } );

				expect( gutilLog.called ).to.equal( false );
				expect( consoleLog.called ).to.equal( false );

				consoleLog.restore();
			} );
		} );

		describe( 'loggger.warning()', () => {
			it( 'should not log any message', () => {
				const gutilLog = sandbox.stub( gutil, 'log' );
				const consoleLog = sandbox.stub( console, 'log' );

				log.warning( logMessage );
				log.warning( logMessage, { raw: true } );

				expect( gutilLog.called ).to.equal( false );
				expect( consoleLog.called ).to.equal( false );

				consoleLog.restore();
			} );
		} );

		describe( 'loggger.error()', () => {
			it( 'should log a message', () => {
				const gutilLog = sandbox.stub( gutil, 'log' );

				log.error( logMessage );

				expect( gutilLog.calledOnce ).to.equal( true );
				expect( gutilLog.firstCall.args[ 0 ] ).to.match( new RegExp( logMessage ) );
			} );

			it( 'should log a non-modified message', () => {
				const consoleLog = sandbox.stub( console, 'log' );

				log.error( logMessage, { raw: true } );

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

		describe( 'loggger.info()', () => {
			it( 'should log a message', () => {
				const gutilLog = sandbox.stub( gutil, 'log' );

				log.info( logMessage );

				expect( gutilLog.calledOnce ).to.equal( true );
				expect( gutilLog.firstCall.args[ 0 ] ).to.equal( logMessage );
			} );
		} );
	} );
} );
