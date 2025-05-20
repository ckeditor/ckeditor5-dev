/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';
import logger, { type Logger } from '../../src/logger/index.js';

vi.stubGlobal( 'console', {
	log: vi.fn(),
	warn: vi.fn(),
	error: vi.fn(),
	dir: vi.fn()
} );

describe( 'logger()', () => {
	const logMessage = 'An example.';
	let log: Logger;

	it( 'provides an API for set verbosity level', () => {
		expect( logger ).to.be.a( 'function' );
	} );

	describe( 'verbosity = info', () => {
		beforeEach( () => {
			log = logger( 'info' );
		} );

		describe( 'logger.info()', () => {
			it( 'should log a message', () => {
				log.info( logMessage );

				expect( vi.mocked( console ).log ).toHaveBeenCalledExactlyOnceWith(
					expect.stringMatching( logMessage )
				);
			} );
		} );

		describe( 'logger.warning()', () => {
			it( 'should log a message', () => {
				log.warning( logMessage );

				expect( vi.mocked( console ).log ).toHaveBeenCalledExactlyOnceWith(
					expect.stringMatching( logMessage )
				);
			} );
		} );

		describe( 'logger.error()', () => {
			it( 'should log a message', () => {
				log.error( logMessage );

				expect( vi.mocked( console ).log ).toHaveBeenCalledExactlyOnceWith(
					expect.stringMatching( logMessage )
				);
			} );
		} );
	} );

	describe( 'verbosity = warning', () => {
		beforeEach( () => {
			log = logger( 'warning' );
		} );

		describe( 'logger.info()', () => {
			it( 'should not log any message', () => {
				log.info( logMessage );

				expect( vi.mocked( console ).log ).not.toHaveBeenCalled();
			} );
		} );

		describe( 'logger.warning()', () => {
			it( 'should log a message', () => {
				log.warning( logMessage );

				expect( vi.mocked( console ).log ).toHaveBeenCalledExactlyOnceWith(
					expect.stringMatching( logMessage )
				);
			} );
		} );

		describe( 'logger.error()', () => {
			it( 'should log a message', () => {
				log.error( logMessage );

				expect( vi.mocked( console ).log ).toHaveBeenCalledExactlyOnceWith(
					expect.stringMatching( logMessage )
				);
			} );
		} );
	} );

	describe( 'verbosity = error', () => {
		beforeEach( () => {
			log = logger( 'error' );
		} );

		describe( 'logger.info()', () => {
			it( 'should not log any message', () => {
				log.info( logMessage );

				expect( vi.mocked( console ).log ).not.toHaveBeenCalled();
			} );
		} );

		describe( 'logger.warning()', () => {
			it( 'should not log any message', () => {
				log.warning( logMessage );

				expect( vi.mocked( console ).log ).not.toHaveBeenCalled();
			} );
		} );

		describe( 'logger.error()', () => {
			it( 'should log a message', () => {
				log.error( logMessage );

				expect( vi.mocked( console ).log ).toHaveBeenCalledExactlyOnceWith(
					expect.stringMatching( logMessage )
				);
			} );
		} );
	} );

	describe( 'verbosity = silent', () => {
		beforeEach( () => {
			log = logger( 'silent' );
		} );

		describe( 'logger.info()', () => {
			it( 'should not log any message', () => {
				log.info( logMessage );

				expect( vi.mocked( console ).log ).not.toHaveBeenCalled();
			} );
		} );

		describe( 'logger.warning()', () => {
			it( 'should not log any message', () => {
				log.warning( logMessage );

				expect( vi.mocked( console ).log ).not.toHaveBeenCalled();
			} );
		} );

		describe( 'logger.error()', () => {
			it( 'should not log any message', () => {
				log.error( logMessage );

				expect( vi.mocked( console ).log ).not.toHaveBeenCalled();
			} );
		} );
	} );

	describe( 'uses default verbosity', () => {
		beforeEach( () => {
			log = logger();
		} );

		describe( 'logger.info()', () => {
			it( 'should log a message', () => {
				log.info( logMessage );

				expect( vi.mocked( console ).log ).toHaveBeenCalledExactlyOnceWith(
					expect.stringMatching( logMessage )
				);
			} );
		} );
	} );

	describe( 'printing error', () => {
		beforeEach( () => {
			log = logger();
		} );

		it( 'should log a message', () => {
			const error = new Error();

			log.error( logMessage, error );

			expect( vi.mocked( console ).dir ).toHaveBeenCalledExactlyOnceWith( error, { depth: null } );
		} );
	} );
} );
