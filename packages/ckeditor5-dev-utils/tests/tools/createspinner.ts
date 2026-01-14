/**
 * @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import cliCursor from 'cli-cursor';
import isInteractive from 'is-interactive';
import createSpinner from '../../src/tools/createspinner.js';
import readline from 'node:readline';

vi.mock( 'is-interactive' );
vi.mock( 'cli-spinners', () => ( {
	default: {
		dots12: {
			frames: [ '|', '/', '-', '\\' ],
			interval: 5
		}
	}
} ) );
vi.mock( 'cli-cursor' );
vi.mock( 'readline' );

vi.stubGlobal( 'console', {
	log: vi.fn(),
	warn: vi.fn(),
	error: vi.fn()
} );

describe( 'createSpinner()', () => {
	beforeEach( () => {
		vi.useFakeTimers();
		vi.setSystemTime( new Date( '2023-06-15 12:00:00' ) );
	} );

	afterEach( () => {
		vi.useRealTimers();
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
				vi.mocked( isInteractive ).mockReturnValue( true );
			} );

			it( 'prints the specified title if spinner should be disabled', () => {
				const spinner = createSpinner( 'Foo.', { isDisabled: true } );

				spinner.start();

				expect( vi.mocked( console ).log ).toHaveBeenCalledExactlyOnceWith( '📍 Foo.' );
			} );

			it( 'prints the specified title if spinner cannot be created if CLI is not interactive', () => {
				vi.mocked( isInteractive ).mockReturnValue( false );

				const spinner = createSpinner( 'Foo.' );

				spinner.start();

				expect( vi.mocked( console ).log ).toHaveBeenCalledExactlyOnceWith( '📍 Foo.' );
			} );

			it( 'prints always spinner in the last line', () => {
				const spinner = createSpinner( 'Foo.' );

				spinner.start();

				const writeStub = vi.spyOn( process.stdout, 'write' )
					.mockImplementation( ( () => {} ) as any );

				vi.advanceTimersByTime( 5 );
				expect( writeStub ).toHaveBeenCalledTimes( 1 );
				expect( writeStub ).toHaveBeenLastCalledWith( '| Foo.' );

				vi.advanceTimersByTime( 5 );
				expect( writeStub ).toHaveBeenCalledTimes( 2 );
				expect( writeStub ).toHaveBeenLastCalledWith( '/ Foo.' );

				vi.advanceTimersByTime( 5 );
				expect( writeStub ).toHaveBeenCalledTimes( 3 );
				expect( writeStub ).toHaveBeenLastCalledWith( '- Foo.' );

				vi.advanceTimersByTime( 5 );
				expect( writeStub ).toHaveBeenCalledTimes( 4 );
				expect( writeStub ).toHaveBeenLastCalledWith( '\\ Foo.' );

				vi.advanceTimersByTime( 5 );
				expect( writeStub ).toHaveBeenCalledTimes( 5 );
				expect( writeStub ).toHaveBeenLastCalledWith( '| Foo.' );

				// It does not clear the last line for an initial spin.
				expect( vi.mocked( readline ).clearLine ).toHaveBeenCalledTimes( 4 );
				expect( vi.mocked( readline ).cursorTo ).toHaveBeenCalledTimes( 4 );

				expect( vi.mocked( readline ).clearLine ).toHaveBeenCalledWith( process.stdout, 1 );
				expect( vi.mocked( readline ).cursorTo ).toHaveBeenCalledWith( process.stdout, 0 );
			} );

			it( 'uses "setInterval" for creating a loop', () => {
				const spinner = createSpinner( 'Foo.', { total: 10 } );

				spinner.start();

				expect( vi.getTimerCount() ).toEqual( 1 );
			} );

			it( 'hides a cursor when starting spinning', () => {
				const spinner = createSpinner( 'Foo.' );

				spinner.start();

				expect( vi.mocked( cliCursor ).hide ).toHaveBeenCalledOnce();
			} );

			it( 'allows indenting messages by specifying the "options.indentLevel" option', () => {
				const spinner = createSpinner( 'Foo.', { indentLevel: 1 } );

				spinner.start();

				const writeStub = vi.spyOn( process.stdout, 'write' )
					.mockImplementation( ( () => {} ) as any );

				vi.advanceTimersByTime( 5 );
				expect( writeStub ).toHaveBeenCalledTimes( 1 );
				expect( writeStub ).toHaveBeenLastCalledWith( '   | Foo.' );

				vi.advanceTimersByTime( 5 );
				expect( writeStub ).toHaveBeenCalledTimes( 2 );
				expect( writeStub ).toHaveBeenLastCalledWith( '   / Foo.' );

				vi.advanceTimersByTime( 5 );
				expect( writeStub ).toHaveBeenCalledTimes( 3 );
				expect( writeStub ).toHaveBeenLastCalledWith( '   - Foo.' );

				vi.advanceTimersByTime( 5 );
				expect( writeStub ).toHaveBeenCalledTimes( 4 );
				expect( writeStub ).toHaveBeenLastCalledWith( '   \\ Foo.' );

				vi.advanceTimersByTime( 5 );
				expect( writeStub ).toHaveBeenCalledTimes( 5 );
				expect( writeStub ).toHaveBeenLastCalledWith( '   | Foo.' );
			} );
		} );

		describe( '#finish', () => {
			beforeEach( () => {
				vi.mocked( isInteractive ).mockReturnValue( true );
			} );

			it( 'does nothing if spinner should be disabled', () => {
				const spinner = createSpinner( 'Foo.', { isDisabled: true } );

				spinner.finish();

				expect( vi.mocked( console ).log ).not.toHaveBeenCalled();
			} );

			it( 'does nothing if spinner cannot be created if CLI is not interactive', () => {
				vi.mocked( isInteractive ).mockReturnValue( false );

				const spinner = createSpinner( 'Foo.' );

				spinner.finish();

				expect( vi.mocked( console ).log ).not.toHaveBeenCalled();
			} );

			it( 'clears the interval when finished', () => {
				const spinner = createSpinner( 'Foo.' );

				expect( vi.getTimerCount() ).toEqual( 0 );

				spinner.start();

				expect( vi.getTimerCount() ).toEqual( 1 );

				spinner.finish();

				expect( vi.getTimerCount() ).toEqual( 0 );
			} );

			it( 'prints the specified title with a pin when finished', () => {
				const spinner = createSpinner( 'Foo.' );

				spinner.start();
				spinner.finish();

				expect( vi.mocked( console ).log ).toHaveBeenCalledExactlyOnceWith( '📍 Foo.' );
			} );

			it( 'shows a cursor when finished spinning', () => {
				const spinner = createSpinner( 'Foo.' );

				spinner.start();
				spinner.finish();

				expect( vi.mocked( cliCursor ).show ).toHaveBeenCalledOnce();
			} );

			it( 'allows indenting messages by specifying the "options.indentLevel" option', () => {
				const spinner = createSpinner( 'Foo.', { indentLevel: 1 } );

				spinner.start();
				spinner.finish();

				expect( vi.mocked( console ).log ).toHaveBeenCalledExactlyOnceWith( '   📍 Foo.' );
			} );

			it( 'prints the specified emoji when created a spinner if it finished', () => {
				const spinner = createSpinner( 'Foo.', { emoji: '👉' } );

				spinner.start();
				spinner.finish();

				expect( vi.mocked( console ).log ).toHaveBeenCalledExactlyOnceWith( '👉 Foo.' );
			} );

			it( 'prints the specified title if spinner cannot be created if CLI is not interactive', () => {
				vi.mocked( isInteractive ).mockReturnValue( true );

				const spinner = createSpinner( 'Foo.', { emoji: '👉' } );

				spinner.start();
				spinner.finish();

				expect( vi.mocked( console ).log ).toHaveBeenCalledExactlyOnceWith( '👉 Foo.' );
			} );

			it( 'allows overriding the emoji (use default emoji when creating a spinner)', () => {
				const spinner = createSpinner( 'Foo.' );

				spinner.start();
				spinner.finish( { emoji: '❌' } );

				expect( vi.mocked( console ).log ).toHaveBeenCalledExactlyOnceWith( '❌ Foo.' );
			} );

			it( 'allows overriding the emoji (passed an emoji when creating a spinner)', () => {
				const spinner = createSpinner( 'Foo.', { emoji: '👉' } );

				spinner.start();
				spinner.finish( { emoji: '❌' } );

				expect( vi.mocked( console ).log ).toHaveBeenCalledExactlyOnceWith( '❌ Foo.' );
			} );
		} );

		describe( '#increase', () => {
			it( 'throws an error when increasing a counter when defined the spinner type', () => {
				const spinner = createSpinner( 'Foo.' );

				expect( () => {
					spinner.increase();
				} ).toThrow( 'The \'#increase()\' method is available only when using the counter spinner.' );
			} );
		} );
	} );

	describe( 'type: counter', () => {
		beforeEach( () => {
			vi.mocked( isInteractive ).mockReturnValue( true );
		} );

		describe( '#start', () => {
			it( 'prints the specified title if spinner cannot be created if CLI is not interactive', () => {
				vi.mocked( isInteractive ).mockReturnValue( false );

				const spinner = createSpinner( 'Foo.', { total: 10 } );

				spinner.start();

				expect( vi.mocked( console ).log ).toHaveBeenCalledExactlyOnceWith( '📍 Foo.' );
			} );

			it( 'uses "setInterval" for creating a loop', () => {
				const spinner = createSpinner( 'Foo.', { total: 10 } );

				spinner.start();

				expect( vi.getTimerCount() ).toEqual( 1 );
			} );

			it( 'prints always spinner in the last line', () => {
				const spinner = createSpinner( 'Foo.', { total: 10 } );

				spinner.start();

				const writeStub = vi.spyOn( process.stdout, 'write' )
					.mockImplementation( ( () => {} ) as any );

				vi.advanceTimersByTime( 5 );
				expect( writeStub ).toHaveBeenCalledTimes( 1 );
				expect( writeStub ).toHaveBeenLastCalledWith( '| Foo. Status: 0/10.' );

				vi.advanceTimersByTime( 5 );
				expect( writeStub ).toHaveBeenCalledTimes( 2 );
				expect( writeStub ).toHaveBeenLastCalledWith( '/ Foo. Status: 0/10.' );

				vi.advanceTimersByTime( 5 );
				expect( writeStub ).toHaveBeenCalledTimes( 3 );
				expect( writeStub ).toHaveBeenLastCalledWith( '- Foo. Status: 0/10.' );

				vi.advanceTimersByTime( 5 );
				expect( writeStub ).toHaveBeenCalledTimes( 4 );
				expect( writeStub ).toHaveBeenLastCalledWith( '\\ Foo. Status: 0/10.' );

				vi.advanceTimersByTime( 5 );
				expect( writeStub ).toHaveBeenCalledTimes( 5 );
				expect( writeStub ).toHaveBeenLastCalledWith( '| Foo. Status: 0/10.' );

				// It does not clear the last line for an initial spin.
				expect( vi.mocked( readline ).clearLine ).toHaveBeenCalledTimes( 4 );
				expect( vi.mocked( readline ).cursorTo ).toHaveBeenCalledTimes( 4 );

				expect( vi.mocked( readline ).clearLine ).toHaveBeenCalledWith( process.stdout, 1 );
				expect( vi.mocked( readline ).cursorTo ).toHaveBeenCalledWith( process.stdout, 0 );
			} );

			it( 'allows defining a custom progress status (as a string)', () => {
				const spinner = createSpinner( 'Foo.', { total: 10, status: '[current] ([total]) - [title]' } );

				spinner.start();

				const writeStub = vi.spyOn( process.stdout, 'write' )
					.mockImplementation( ( () => {} ) as any );

				vi.advanceTimersByTime( 5 );
				expect( writeStub ).toHaveBeenCalledTimes( 1 );
				expect( writeStub ).toHaveBeenLastCalledWith( '| 0 (10) - Foo.' );

				vi.advanceTimersByTime( 5 );
				expect( writeStub ).toHaveBeenCalledTimes( 2 );
				expect( writeStub ).toHaveBeenLastCalledWith( '/ 0 (10) - Foo.' );

				vi.advanceTimersByTime( 5 );
				expect( writeStub ).toHaveBeenCalledTimes( 3 );
				expect( writeStub ).toHaveBeenLastCalledWith( '- 0 (10) - Foo.' );

				vi.advanceTimersByTime( 5 );
				expect( writeStub ).toHaveBeenCalledTimes( 4 );
				expect( writeStub ).toHaveBeenLastCalledWith( '\\ 0 (10) - Foo.' );

				vi.advanceTimersByTime( 5 );
				expect( writeStub ).toHaveBeenCalledTimes( 5 );
				expect( writeStub ).toHaveBeenLastCalledWith( '| 0 (10) - Foo.' );
			} );

			it( 'allows defining a custom progress status (as a callback)', () => {
				const spinner = createSpinner( 'Foo.', {
					total: 10,
					status( title, current, total ) {
						return `${ current } (${ total }) - ${ title }`;
					}
				} );

				spinner.start();

				const writeStub = vi.spyOn( process.stdout, 'write' )
					.mockImplementation( ( () => {} ) as any );

				vi.advanceTimersByTime( 5 );
				expect( writeStub ).toHaveBeenCalledTimes( 1 );
				expect( writeStub ).toHaveBeenLastCalledWith( '| 0 (10) - Foo.' );

				vi.advanceTimersByTime( 5 );
				expect( writeStub ).toHaveBeenCalledTimes( 2 );
				expect( writeStub ).toHaveBeenLastCalledWith( '/ 0 (10) - Foo.' );

				vi.advanceTimersByTime( 5 );
				expect( writeStub ).toHaveBeenCalledTimes( 3 );
				expect( writeStub ).toHaveBeenLastCalledWith( '- 0 (10) - Foo.' );

				vi.advanceTimersByTime( 5 );
				expect( writeStub ).toHaveBeenCalledTimes( 4 );
				expect( writeStub ).toHaveBeenLastCalledWith( '\\ 0 (10) - Foo.' );

				vi.advanceTimersByTime( 5 );
				expect( writeStub ).toHaveBeenCalledTimes( 5 );
				expect( writeStub ).toHaveBeenLastCalledWith( '| 0 (10) - Foo.' );
			} );
		} );

		describe( '#finish', () => {
			it( 'prints the specified title with a pin when finished', () => {
				const spinner = createSpinner( 'Foo.', { total: 10 } );

				spinner.start();
				spinner.finish();

				expect( vi.mocked( console ).log ).toHaveBeenCalledExactlyOnceWith( '📍 Foo.' );
			} );
		} );

		describe( '#increase', () => {
			it( 'increases the counter', () => {
				const spinner = createSpinner( 'Foo.', { total: 10 } );

				spinner.start();

				const writeStub = vi.spyOn( process.stdout, 'write' )
					.mockImplementation( ( () => {} ) as any );

				vi.advanceTimersByTime( 5 );
				expect( writeStub ).toHaveBeenCalledTimes( 1 );
				expect( writeStub ).toHaveBeenLastCalledWith( '| Foo. Status: 0/10.' );

				spinner.increase();

				vi.advanceTimersByTime( 5 );
				expect( writeStub ).toHaveBeenCalledTimes( 2 );
				expect( writeStub ).toHaveBeenLastCalledWith( '/ Foo. Status: 1/10.' );

				spinner.increase();

				vi.advanceTimersByTime( 5 );
				expect( writeStub ).toHaveBeenCalledTimes( 3 );
				expect( writeStub ).toHaveBeenLastCalledWith( '- Foo. Status: 2/10.' );

				spinner.increase();

				vi.advanceTimersByTime( 5 );
				expect( writeStub ).toHaveBeenCalledTimes( 4 );
				expect( writeStub ).toHaveBeenLastCalledWith( '\\ Foo. Status: 3/10.' );

				spinner.increase();

				vi.advanceTimersByTime( 5 );
				expect( writeStub ).toHaveBeenCalledTimes( 5 );
				expect( writeStub ).toHaveBeenLastCalledWith( '| Foo. Status: 4/10.' );

				// It does not clear the last line for an initial spin.
				expect( vi.mocked( readline ).clearLine ).toHaveBeenCalledTimes( 4 );
				expect( vi.mocked( readline ).cursorTo ).toHaveBeenCalledTimes( 4 );

				expect( vi.mocked( readline ).clearLine ).toHaveBeenCalledWith( process.stdout, 1 );
				expect( vi.mocked( readline ).cursorTo ).toHaveBeenCalledWith( process.stdout, 0 );
			} );
		} );
	} );
} );
