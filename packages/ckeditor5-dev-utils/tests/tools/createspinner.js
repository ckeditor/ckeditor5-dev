/**
 * @license Copyright (c) 2003-2023, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const sinon = require( 'sinon' );
const expect = require( 'chai' ).expect;
const mockery = require( 'mockery' );

describe( 'lib/utils/create-spinner', () => {
	let createSpinner, clock, stubs;

	beforeEach( () => {
		mockery.enable( {
			useCleanCache: true,
			warnOnReplace: false,
			warnOnUnregistered: false
		} );

		clock = sinon.useFakeTimers();

		stubs = {
			isInteractive: sinon.stub(),
			cliSpinners: {
				dots12: {
					frames: [ '|', '/', '-', '\\' ],
					interval: 5
				}
			},
			cliCursor: {
				show: sinon.stub(),
				hide: sinon.stub()
			},
			readline: {
				clearLine: sinon.stub(),
				cursorTo: sinon.stub()
			}
		};

		mockery.registerMock( 'is-interactive', stubs.isInteractive );
		mockery.registerMock( 'cli-spinners', stubs.cliSpinners );
		mockery.registerMock( 'cli-cursor', stubs.cliCursor );
		mockery.registerMock( 'readline', stubs.readline );

		createSpinner = require( '../../lib/tools/createspinner' );
	} );

	afterEach( () => {
		sinon.restore();
		clock.restore();
		mockery.disable();
	} );

	it( 'should be a function', () => {
		expect( createSpinner ).to.be.an( 'function' );
	} );

	it( 'should return an object that allows starting and finishing spinning', () => {
		const spinner = createSpinner( 'Foo.' );

		expect( spinner ).to.be.an( 'object' );

		expect( spinner ).to.have.property( 'start' );
		expect( spinner.start ).to.be.a( 'function' );

		expect( spinner ).to.have.property( 'finish' );
		expect( spinner.finish ).to.be.a( 'function' );

		expect( spinner ).to.have.property( 'increase' );
		expect( spinner.increase ).to.be.a( 'function' );
	} );

	describe( 'type: spinner', () => {
		describe( '#start', () => {
			beforeEach( () => {
				stubs.isInteractive.returns( true );
			} );

			it( 'prints the specified title if spinner should be disabled', () => {
				const spinner = createSpinner( 'Foo.', { isDisabled: true } );
				const consoleStub = sinon.stub( console, 'log' );

				spinner.start();

				consoleStub.restore();

				expect( consoleStub.calledOnce ).to.equal( true );
				expect( consoleStub.firstCall.args[ 0 ] ).to.equal( '📍 Foo.' );
			} );

			it( 'prints the specified title if spinner cannot be created if CLI is not interactive', () => {
				stubs.isInteractive.returns( false );

				const spinner = createSpinner( 'Foo.' );
				const consoleStub = sinon.stub( console, 'log' );

				spinner.start();

				consoleStub.restore();

				expect( consoleStub.calledOnce ).to.equal( true );
				expect( consoleStub.firstCall.args[ 0 ] ).to.equal( '📍 Foo.' );
			} );

			it( 'uses "setInterval" for creating a loop', () => {
				const spinner = createSpinner( 'Foo.' );

				spinner.start();

				const timer = Object.values( clock.timers ).shift();

				expect( timer ).to.be.an( 'object' );
				expect( timer.type ).to.equal( 'Interval' );
			} );

			it( 'prints always spinner in the last line', () => {
				const spinner = createSpinner( 'Foo.' );

				spinner.start();

				const writeStub = sinon.stub( process.stdout, 'write' );

				clock.tick( 5 );
				expect( writeStub.callCount ).to.equal( 1 );
				expect( writeStub.getCall( 0 ).args[ 0 ] ).to.equal( '| Foo.' );

				clock.tick( 5 );
				expect( writeStub.callCount ).to.equal( 2 );
				expect( writeStub.getCall( 1 ).args[ 0 ] ).to.equal( '/ Foo.' );

				clock.tick( 5 );
				expect( writeStub.callCount ).to.equal( 3 );
				expect( writeStub.getCall( 2 ).args[ 0 ] ).to.equal( '- Foo.' );

				clock.tick( 5 );
				expect( writeStub.callCount ).to.equal( 4 );
				expect( writeStub.getCall( 3 ).args[ 0 ] ).to.equal( '\\ Foo.' );

				clock.tick( 5 );
				expect( writeStub.callCount ).to.equal( 5 );
				expect( writeStub.getCall( 4 ).args[ 0 ] ).to.equal( '| Foo.' );

				// It does not clear the last line for an initial spin.
				expect( stubs.readline.clearLine.callCount ).to.equal( 4 );
				expect( stubs.readline.cursorTo.callCount ).to.equal( 4 );

				expect( stubs.readline.clearLine.firstCall.args[ 0 ] ).to.equal( process.stdout );
				expect( stubs.readline.clearLine.firstCall.args[ 1 ] ).to.equal( 1 );

				expect( stubs.readline.cursorTo.firstCall.args[ 0 ] ).to.equal( process.stdout );
				expect( stubs.readline.cursorTo.firstCall.args[ 1 ] ).to.equal( 0 );

				writeStub.restore();
			} );

			it( 'hides a cursor when starting spinning', () => {
				const spinner = createSpinner( 'Foo.' );

				spinner.start();

				expect( stubs.cliCursor.hide.calledOnce ).to.equal( true );
			} );

			it( 'allows indenting messages by specifying the "options.indentLevel" option', () => {
				const spinner = createSpinner( 'Foo.', { indentLevel: 1 } );

				spinner.start();

				const writeStub = sinon.stub( process.stdout, 'write' );

				clock.tick( 5 );
				expect( writeStub.callCount ).to.equal( 1 );
				expect( writeStub.getCall( 0 ).args[ 0 ] ).to.equal( '   | Foo.' );

				clock.tick( 5 );
				expect( writeStub.callCount ).to.equal( 2 );
				expect( writeStub.getCall( 1 ).args[ 0 ] ).to.equal( '   / Foo.' );

				clock.tick( 5 );
				expect( writeStub.callCount ).to.equal( 3 );
				expect( writeStub.getCall( 2 ).args[ 0 ] ).to.equal( '   - Foo.' );

				clock.tick( 5 );
				expect( writeStub.callCount ).to.equal( 4 );
				expect( writeStub.getCall( 3 ).args[ 0 ] ).to.equal( '   \\ Foo.' );

				clock.tick( 5 );
				expect( writeStub.callCount ).to.equal( 5 );
				expect( writeStub.getCall( 4 ).args[ 0 ] ).to.equal( '   | Foo.' );

				writeStub.restore();
			} );
		} );

		describe( '#finish', () => {
			beforeEach( () => {
				stubs.isInteractive.returns( true );
			} );

			it( 'does nothing if spinner should be disabled', () => {
				const spinner = createSpinner( 'Foo.', { isDisabled: true } );
				const consoleStub = sinon.stub( console, 'log' );

				spinner.finish();

				consoleStub.restore();

				expect( consoleStub.calledOnce ).to.equal( false );
			} );

			it( 'does nothing if spinner cannot be created if CLI is not interactive', () => {
				stubs.isInteractive.returns( false );

				const spinner = createSpinner( 'Foo.' );
				const consoleStub = sinon.stub( console, 'log' );

				spinner.finish();

				consoleStub.restore();

				expect( consoleStub.calledOnce ).to.equal( false );
			} );

			it( 'clears the interval when finished', () => {
				const spinner = createSpinner( 'Foo.' );
				const consoleStub = sinon.stub( console, 'log' );

				spinner.start();

				const timer = Object.values( clock.timers ).shift();
				expect( timer ).to.be.an( 'object' );

				spinner.finish();

				const newTimer = Object.values( clock.timers ).shift();

				expect( timer ).to.be.an( 'object' );
				expect( newTimer ).to.be.undefined;

				consoleStub.restore();
			} );

			it( 'prints the specified title with a pin when finished', () => {
				const spinner = createSpinner( 'Foo.' );
				const consoleStub = sinon.stub( console, 'log' );

				spinner.start();
				spinner.finish();

				consoleStub.restore();

				expect( consoleStub.calledOnce ).to.equal( true );
				expect( consoleStub.firstCall.args[ 0 ] ).to.equal( '📍 Foo.' );
			} );

			it( 'shows a cursor when finished spinning', () => {
				const spinner = createSpinner( 'Foo.' );
				const consoleStub = sinon.stub( console, 'log' );

				spinner.start();
				spinner.finish();

				consoleStub.restore();
				expect( stubs.cliCursor.show.calledOnce ).to.equal( true );
			} );

			it( 'allows indenting messages by specifying the "options.indentLevel" option', () => {
				const spinner = createSpinner( 'Foo.', { indentLevel: 1 } );
				const consoleStub = sinon.stub( console, 'log' );

				spinner.start();
				spinner.finish();

				consoleStub.restore();

				expect( consoleStub.calledOnce ).to.equal( true );
				expect( consoleStub.firstCall.args[ 0 ] ).to.equal( '   📍 Foo.' );
			} );

			it( 'prints the specified emoji when created a spinner if it finished', () => {
				const spinner = createSpinner( 'Foo.', { emoji: '👉' } );
				const consoleStub = sinon.stub( console, 'log' );

				spinner.start();
				spinner.finish();

				consoleStub.restore();

				expect( consoleStub.calledOnce ).to.equal( true );
				expect( consoleStub.firstCall.args[ 0 ] ).to.equal( '👉 Foo.' );
			} );

			it( 'prints the specified title if spinner cannot be created if CLI is not interactive', () => {
				stubs.isInteractive.returns( false );

				const spinner = createSpinner( 'Foo.', { emoji: '👉' } );
				const consoleStub = sinon.stub( console, 'log' );

				spinner.start();

				consoleStub.restore();

				expect( consoleStub.calledOnce ).to.equal( true );
				expect( consoleStub.firstCall.args[ 0 ] ).to.equal( '👉 Foo.' );
			} );

			it( 'allows overriding the emoji (use default emoji when creating a spinner)', () => {
				const spinner = createSpinner( 'Foo.' );
				const consoleStub = sinon.stub( console, 'log' );

				spinner.start();
				spinner.finish( { emoji: '❌' } );

				consoleStub.restore();

				expect( consoleStub.calledOnce ).to.equal( true );
				expect( consoleStub.firstCall.args[ 0 ] ).to.equal( '❌ Foo.' );
			} );

			it( 'allows overriding the emoji (passed an emoji when creating a spinner)', () => {
				const spinner = createSpinner( 'Foo.', { emoji: '👉' } );
				const consoleStub = sinon.stub( console, 'log' );

				spinner.start();
				spinner.finish( { emoji: '❌' } );

				consoleStub.restore();

				expect( consoleStub.calledOnce ).to.equal( true );
				expect( consoleStub.firstCall.args[ 0 ] ).to.equal( '❌ Foo.' );
			} );
		} );

		describe( '#increase', () => {
			it( 'throws an error when increasing a counter when defined the spinner type', () => {
				const spinner = createSpinner( 'Foo.' );

				expect( () => {
					spinner.increase();
				} ).to.throw( Error, 'The \'#increase()\' method is available only when using the counter spinner.' );
			} );
		} );
	} );
	describe( 'type: counter', () => {
		beforeEach( () => {
			stubs.isInteractive.returns( true );
		} );

		describe( '#start', () => {
			it( 'prints the specified title if spinner cannot be created if CLI is not interactive', () => {
				stubs.isInteractive.returns( false );

				const spinner = createSpinner( 'Foo.', { total: 10 } );
				const consoleStub = sinon.stub( console, 'log' );

				spinner.start();

				consoleStub.restore();

				expect( consoleStub.calledOnce ).to.equal( true );
				expect( consoleStub.firstCall.args[ 0 ] ).to.equal( '📍 Foo.' );
			} );

			it( 'uses "setInterval" for creating a loop', () => {
				const spinner = createSpinner( 'Foo.', { total: 10 } );

				spinner.start();

				const timer = Object.values( clock.timers ).shift();

				expect( timer ).to.be.an( 'object' );
				expect( timer.type ).to.equal( 'Interval' );
			} );

			it( 'prints always spinner in the last line', () => {
				const spinner = createSpinner( 'Foo.', { total: 10 } );

				spinner.start();

				const writeStub = sinon.stub( process.stdout, 'write' );

				clock.tick( 5 );
				expect( writeStub.callCount ).to.equal( 1 );
				expect( writeStub.getCall( 0 ).args[ 0 ] ).to.equal( '| Foo. Status: 0/10.' );

				clock.tick( 5 );
				expect( writeStub.callCount ).to.equal( 2 );
				expect( writeStub.getCall( 1 ).args[ 0 ] ).to.equal( '/ Foo. Status: 0/10.' );

				clock.tick( 5 );
				expect( writeStub.callCount ).to.equal( 3 );
				expect( writeStub.getCall( 2 ).args[ 0 ] ).to.equal( '- Foo. Status: 0/10.' );

				clock.tick( 5 );
				expect( writeStub.callCount ).to.equal( 4 );
				expect( writeStub.getCall( 3 ).args[ 0 ] ).to.equal( '\\ Foo. Status: 0/10.' );

				clock.tick( 5 );
				expect( writeStub.callCount ).to.equal( 5 );
				expect( writeStub.getCall( 4 ).args[ 0 ] ).to.equal( '| Foo. Status: 0/10.' );

				// It does not clear the last line for an initial spin.
				expect( stubs.readline.clearLine.callCount ).to.equal( 4 );
				expect( stubs.readline.cursorTo.callCount ).to.equal( 4 );

				expect( stubs.readline.clearLine.firstCall.args[ 0 ] ).to.equal( process.stdout );
				expect( stubs.readline.clearLine.firstCall.args[ 1 ] ).to.equal( 1 );

				expect( stubs.readline.cursorTo.firstCall.args[ 0 ] ).to.equal( process.stdout );
				expect( stubs.readline.cursorTo.firstCall.args[ 1 ] ).to.equal( 0 );

				writeStub.restore();
			} );

			it( 'allows defining a custom progress status (as a string)', () => {
				const spinner = createSpinner( 'Foo.', { total: 10, status: '[current] ([total]) - [title]' } );

				spinner.start();

				const writeStub = sinon.stub( process.stdout, 'write' );

				clock.tick( 5 );
				expect( writeStub.callCount ).to.equal( 1 );
				expect( writeStub.getCall( 0 ).args[ 0 ] ).to.equal( '| 0 (10) - Foo.' );

				clock.tick( 5 );
				expect( writeStub.callCount ).to.equal( 2 );
				expect( writeStub.getCall( 1 ).args[ 0 ] ).to.equal( '/ 0 (10) - Foo.' );

				clock.tick( 5 );
				expect( writeStub.callCount ).to.equal( 3 );
				expect( writeStub.getCall( 2 ).args[ 0 ] ).to.equal( '- 0 (10) - Foo.' );

				clock.tick( 5 );
				expect( writeStub.callCount ).to.equal( 4 );
				expect( writeStub.getCall( 3 ).args[ 0 ] ).to.equal( '\\ 0 (10) - Foo.' );

				clock.tick( 5 );
				expect( writeStub.callCount ).to.equal( 5 );
				expect( writeStub.getCall( 4 ).args[ 0 ] ).to.equal( '| 0 (10) - Foo.' );

				// It does not clear the last line for an initial spin.
				expect( stubs.readline.clearLine.callCount ).to.equal( 4 );
				expect( stubs.readline.cursorTo.callCount ).to.equal( 4 );

				expect( stubs.readline.clearLine.firstCall.args[ 0 ] ).to.equal( process.stdout );
				expect( stubs.readline.clearLine.firstCall.args[ 1 ] ).to.equal( 1 );

				expect( stubs.readline.cursorTo.firstCall.args[ 0 ] ).to.equal( process.stdout );
				expect( stubs.readline.cursorTo.firstCall.args[ 1 ] ).to.equal( 0 );

				writeStub.restore();
			} );

			it( 'allows defining a custom progress status (as a callback)', () => {
				const spinner = createSpinner( 'Foo.', {
					total: 10,
					status( title, current, total ) {
						return `${ current } (${ total }) - ${ title }`;
					}
				} );

				spinner.start();

				const writeStub = sinon.stub( process.stdout, 'write' );

				clock.tick( 5 );
				expect( writeStub.callCount ).to.equal( 1 );
				expect( writeStub.getCall( 0 ).args[ 0 ] ).to.equal( '| 0 (10) - Foo.' );

				clock.tick( 5 );
				expect( writeStub.callCount ).to.equal( 2 );
				expect( writeStub.getCall( 1 ).args[ 0 ] ).to.equal( '/ 0 (10) - Foo.' );

				clock.tick( 5 );
				expect( writeStub.callCount ).to.equal( 3 );
				expect( writeStub.getCall( 2 ).args[ 0 ] ).to.equal( '- 0 (10) - Foo.' );

				clock.tick( 5 );
				expect( writeStub.callCount ).to.equal( 4 );
				expect( writeStub.getCall( 3 ).args[ 0 ] ).to.equal( '\\ 0 (10) - Foo.' );

				clock.tick( 5 );
				expect( writeStub.callCount ).to.equal( 5 );
				expect( writeStub.getCall( 4 ).args[ 0 ] ).to.equal( '| 0 (10) - Foo.' );

				// It does not clear the last line for an initial spin.
				expect( stubs.readline.clearLine.callCount ).to.equal( 4 );
				expect( stubs.readline.cursorTo.callCount ).to.equal( 4 );

				expect( stubs.readline.clearLine.firstCall.args[ 0 ] ).to.equal( process.stdout );
				expect( stubs.readline.clearLine.firstCall.args[ 1 ] ).to.equal( 1 );

				expect( stubs.readline.cursorTo.firstCall.args[ 0 ] ).to.equal( process.stdout );
				expect( stubs.readline.cursorTo.firstCall.args[ 1 ] ).to.equal( 0 );

				writeStub.restore();
			} );
		} );

		describe( '#finish', () => {
			it( 'prints the specified title with a pin when finished', () => {
				const spinner = createSpinner( 'Foo.', { total: 10 } );
				const consoleStub = sinon.stub( console, 'log' );

				spinner.start();
				spinner.finish();

				consoleStub.restore();

				expect( consoleStub.calledOnce ).to.equal( true );
				expect( consoleStub.firstCall.args[ 0 ] ).to.equal( '📍 Foo.' );
			} );
		} );

		describe( '#increase', () => {
			it( 'increases the counter', () => {
				const spinner = createSpinner( 'Foo.', { total: 10 } );

				spinner.start();

				const writeStub = sinon.stub( process.stdout, 'write' );

				clock.tick( 5 );
				expect( writeStub.callCount ).to.equal( 1 );
				expect( writeStub.getCall( 0 ).args[ 0 ] ).to.equal( '| Foo. Status: 0/10.' );

				spinner.increase();

				clock.tick( 5 );
				expect( writeStub.callCount ).to.equal( 2 );
				expect( writeStub.getCall( 1 ).args[ 0 ] ).to.equal( '/ Foo. Status: 1/10.' );

				spinner.increase();

				clock.tick( 5 );
				expect( writeStub.callCount ).to.equal( 3 );
				expect( writeStub.getCall( 2 ).args[ 0 ] ).to.equal( '- Foo. Status: 2/10.' );

				spinner.increase();

				clock.tick( 5 );
				expect( writeStub.callCount ).to.equal( 4 );
				expect( writeStub.getCall( 3 ).args[ 0 ] ).to.equal( '\\ Foo. Status: 3/10.' );

				spinner.increase();

				clock.tick( 5 );
				expect( writeStub.callCount ).to.equal( 5 );
				expect( writeStub.getCall( 4 ).args[ 0 ] ).to.equal( '| Foo. Status: 4/10.' );

				// It does not clear the last line for an initial spin.
				expect( stubs.readline.clearLine.callCount ).to.equal( 4 );
				expect( stubs.readline.cursorTo.callCount ).to.equal( 4 );

				expect( stubs.readline.clearLine.firstCall.args[ 0 ] ).to.equal( process.stdout );
				expect( stubs.readline.clearLine.firstCall.args[ 1 ] ).to.equal( 1 );

				expect( stubs.readline.cursorTo.firstCall.args[ 0 ] ).to.equal( process.stdout );
				expect( stubs.readline.cursorTo.firstCall.args[ 1 ] ).to.equal( 0 );

				writeStub.restore();
			} );
		} );
	} );
} );
