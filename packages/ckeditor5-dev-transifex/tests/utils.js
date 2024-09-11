/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { describe, expect, it, vi, beforeEach } from 'vitest';
// import utils from '../lib/utils.js';

const {
	chalkCyanMock,
	loggerMock
} = vi.hoisted( () => {
	return {
		chalkCyanMock: vi.fn(),
		loggerMock: vi.fn()
	};
} );

vi.mock( 'chalk', () => {
	return {
		default: {
			cyan: chalkCyanMock
		}
	};
} );

vi.mock( '@ckeditor/ckeditor5-dev-utils', () => {
	return {
		logger: loggerMock
	};
} );

describe( 'dev-transifex/utils', () => {
	let utils;
	let loggerInfoMock, loggerWarningMock, loggerErrorMock, loggerLogMock;

	beforeEach( async () => {
		loggerInfoMock = vi.fn();
		loggerWarningMock = vi.fn();
		loggerErrorMock = vi.fn();
		loggerLogMock = vi.fn();

		vi.mocked( chalkCyanMock ).mockImplementation( str => str );
		vi.mocked( loggerMock ).mockImplementation( () => {
			return {
				info: loggerInfoMock,
				warning: loggerWarningMock,
				error: loggerErrorMock,
				_log: loggerLogMock
			};
		} );

		utils = ( await import( '../lib/utils.js' ) ).default;
	} );

	describe( 'verifyProperties()', () => {
		it( 'should throw an error if the specified property is not specified in an object', () => {
			expect( () => {
				utils.verifyProperties( {}, [ 'foo' ] );
			} ).to.throw( Error, 'The specified object misses the following properties: foo.' );
		} );

		it( 'should throw an error if the value of the property is `undefined`', () => {
			expect( () => {
				utils.verifyProperties( { foo: undefined }, [ 'foo' ] );
			} ).to.throw( Error, 'The specified object misses the following properties: foo.' );
		} );

		it( 'should throw an error containing all The specified object misses the following properties', () => {
			expect( () => {
				utils.verifyProperties( { foo: true, bar: 0 }, [ 'foo', 'bar', 'baz', 'xxx' ] );
			} ).to.throw( Error, 'The specified object misses the following properties: baz, xxx.' );
		} );

		it( 'should not throw an error if the value of the property is `null`', () => {
			expect( () => {
				utils.verifyProperties( { foo: null }, [ 'foo' ] );
			} ).to.not.throw( Error );
		} );

		it( 'should not throw an error if the value of the property is a boolean (`false`)', () => {
			expect( () => {
				utils.verifyProperties( { foo: false }, [ 'foo' ] );
			} ).to.not.throw( Error );
		} );

		it( 'should not throw an error if the value of the property is a boolean (`true`)', () => {
			expect( () => {
				utils.verifyProperties( { foo: true }, [ 'foo' ] );
			} ).to.not.throw( Error );
		} );

		it( 'should not throw an error if the value of the property is a number', () => {
			expect( () => {
				utils.verifyProperties( { foo: 1 }, [ 'foo' ] );
			} ).to.not.throw( Error );
		} );

		it( 'should not throw an error if the value of the property is a number (falsy value)', () => {
			expect( () => {
				utils.verifyProperties( { foo: 0 }, [ 'foo' ] );
			} ).to.not.throw( Error );
		} );

		it( 'should not throw an error if the value of the property is a NaN', () => {
			expect( () => {
				utils.verifyProperties( { foo: NaN }, [ 'foo' ] );
			} ).to.not.throw( Error );
		} );

		it( 'should not throw an error if the value of the property is a non-empty string', () => {
			expect( () => {
				utils.verifyProperties( { foo: 'foo' }, [ 'foo' ] );
			} ).to.not.throw( Error );
		} );

		it( 'should not throw an error if the value of the property is an empty string', () => {
			expect( () => {
				utils.verifyProperties( { foo: '' }, [ 'foo' ] );
			} ).to.not.throw( Error );
		} );

		it( 'should not throw an error if the value of the property is an array', () => {
			expect( () => {
				utils.verifyProperties( { foo: [] }, [ 'foo' ] );
			} ).to.not.throw( Error );
		} );

		it( 'should not throw an error if the value of the property is an object', () => {
			expect( () => {
				utils.verifyProperties( { foo: {} }, [ 'foo' ] );
			} ).to.not.throw( Error );
		} );

		it( 'should not throw an error if the value of the property is a function', () => {
			expect( () => {
				utils.verifyProperties( {
					foo: () => {}
				}, [ 'foo' ] );
			} ).to.not.throw( Error );
		} );
	} );

	describe( 'createLogger()', () => {
		it( 'should be a function', () => {
			expect( utils.createLogger ).toBeInstanceOf( Function );
		} );

		it( 'should return an object with methods', () => {
			const logger = utils.createLogger();

			expect( logger ).toBeInstanceOf( Object );
			expect( logger.progress ).toBeInstanceOf( Function );
			expect( logger.info ).toBeInstanceOf( Function );
			expect( logger.warning ).toBeInstanceOf( Function );
			expect( logger.error ).toBeInstanceOf( Function );
			expect( logger._log ).toBeInstanceOf( Function );
		} );

		it( 'should call the info method for a non-empty progress message', () => {
			const logger = utils.createLogger();

			logger.progress( 'Example step.' );

			expect( loggerInfoMock ).toHaveBeenCalledTimes( 1 );
			expect( loggerInfoMock ).toHaveBeenCalledWith( '\n📍 Example step.' );
			expect( chalkCyanMock ).toHaveBeenCalledTimes( 1 );
			expect( chalkCyanMock ).toHaveBeenCalledWith( 'Example step.' );
		} );

		it( 'should call the info method with an empty message for an empty progress message', () => {
			const logger = utils.createLogger();

			logger.progress();

			expect( loggerInfoMock ).toHaveBeenCalledTimes( 1 );
			expect( loggerInfoMock ).toHaveBeenCalledWith( '' );
			expect( chalkCyanMock ).toHaveBeenCalledTimes( 0 );
		} );
	} );
} );
