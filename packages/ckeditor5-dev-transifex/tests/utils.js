/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { describe, expect, it, vi, beforeEach } from 'vitest';
import { verifyProperties, createLogger } from '../lib/utils.js';

import { logger } from '@ckeditor/ckeditor5-dev-utils';
import chalk from 'chalk';

vi.mock( '@ckeditor/ckeditor5-dev-utils' );
vi.mock( 'chalk', () => ( {
	default: {
		cyan: vi.fn( string => string )
	}
} ) );

describe( 'dev-transifex/utils', () => {
	let loggerInfoMock, loggerWarningMock, loggerErrorMock, loggerLogMock;

	beforeEach( async () => {
		loggerInfoMock = vi.fn();
		loggerWarningMock = vi.fn();
		loggerErrorMock = vi.fn();
		loggerLogMock = vi.fn();

		vi.mocked( logger ).mockImplementation( () => {
			return {
				info: loggerInfoMock,
				warning: loggerWarningMock,
				error: loggerErrorMock,
				_log: loggerLogMock
			};
		} );
	} );

	describe( 'verifyProperties()', () => {
		it( 'should throw an error if the specified property is not specified in an object', () => {
			expect( () => {
				verifyProperties( {}, [ 'foo' ] );
			} ).to.throw( Error, 'The specified object misses the following properties: foo.' );
		} );

		it( 'should throw an error if the value of the property is `undefined`', () => {
			expect( () => {
				verifyProperties( { foo: undefined }, [ 'foo' ] );
			} ).to.throw( Error, 'The specified object misses the following properties: foo.' );
		} );

		it( 'should throw an error containing all The specified object misses the following properties', () => {
			expect( () => {
				verifyProperties( { foo: true, bar: 0 }, [ 'foo', 'bar', 'baz', 'xxx' ] );
			} ).to.throw( Error, 'The specified object misses the following properties: baz, xxx.' );
		} );

		it( 'should not throw an error if the value of the property is `null`', () => {
			expect( () => {
				verifyProperties( { foo: null }, [ 'foo' ] );
			} ).to.not.throw( Error );
		} );

		it( 'should not throw an error if the value of the property is a boolean (`false`)', () => {
			expect( () => {
				verifyProperties( { foo: false }, [ 'foo' ] );
			} ).to.not.throw( Error );
		} );

		it( 'should not throw an error if the value of the property is a boolean (`true`)', () => {
			expect( () => {
				verifyProperties( { foo: true }, [ 'foo' ] );
			} ).to.not.throw( Error );
		} );

		it( 'should not throw an error if the value of the property is a number', () => {
			expect( () => {
				verifyProperties( { foo: 1 }, [ 'foo' ] );
			} ).to.not.throw( Error );
		} );

		it( 'should not throw an error if the value of the property is a number (falsy value)', () => {
			expect( () => {
				verifyProperties( { foo: 0 }, [ 'foo' ] );
			} ).to.not.throw( Error );
		} );

		it( 'should not throw an error if the value of the property is a NaN', () => {
			expect( () => {
				verifyProperties( { foo: NaN }, [ 'foo' ] );
			} ).to.not.throw( Error );
		} );

		it( 'should not throw an error if the value of the property is a non-empty string', () => {
			expect( () => {
				verifyProperties( { foo: 'foo' }, [ 'foo' ] );
			} ).to.not.throw( Error );
		} );

		it( 'should not throw an error if the value of the property is an empty string', () => {
			expect( () => {
				verifyProperties( { foo: '' }, [ 'foo' ] );
			} ).to.not.throw( Error );
		} );

		it( 'should not throw an error if the value of the property is an array', () => {
			expect( () => {
				verifyProperties( { foo: [] }, [ 'foo' ] );
			} ).to.not.throw( Error );
		} );

		it( 'should not throw an error if the value of the property is an object', () => {
			expect( () => {
				verifyProperties( { foo: {} }, [ 'foo' ] );
			} ).to.not.throw( Error );
		} );

		it( 'should not throw an error if the value of the property is a function', () => {
			expect( () => {
				verifyProperties( {
					foo: () => {}
				}, [ 'foo' ] );
			} ).to.not.throw( Error );
		} );
	} );

	describe( 'createLogger()', () => {
		it( 'should be a function', () => {
			expect( createLogger ).toBeInstanceOf( Function );
		} );

		it( 'should return an object with methods', () => {
			const logger = createLogger();

			expect( logger ).toBeInstanceOf( Object );
			expect( logger.progress ).toBeInstanceOf( Function );
			expect( logger.info ).toBeInstanceOf( Function );
			expect( logger.warning ).toBeInstanceOf( Function );
			expect( logger.error ).toBeInstanceOf( Function );
			expect( logger._log ).toBeInstanceOf( Function );
		} );

		it( 'should call the info method for a non-empty progress message', () => {
			const logger = createLogger();

			logger.progress( 'Example step.' );

			expect( loggerInfoMock ).toHaveBeenCalledTimes( 1 );
			expect( loggerInfoMock ).toHaveBeenCalledWith( '\n📍 Example step.' );
			expect( chalk.cyan ).toHaveBeenCalledTimes( 1 );
			expect( chalk.cyan ).toHaveBeenCalledWith( 'Example step.' );
		} );

		it( 'should call the info method with an empty message for an empty progress message', () => {
			const logger = createLogger();

			logger.progress();

			expect( loggerInfoMock ).toHaveBeenCalledTimes( 1 );
			expect( loggerInfoMock ).toHaveBeenCalledWith( '' );
			expect( chalk.cyan ).toHaveBeenCalledTimes( 0 );
		} );
	} );
} );
