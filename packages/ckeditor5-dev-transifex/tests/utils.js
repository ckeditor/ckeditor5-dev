/**
 * @license Copyright (c) 2003-2022, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const sinon = require( 'sinon' );
const chai = require( 'chai' );
const expect = chai.expect;
const mockery = require( 'mockery' );

describe( 'dev-transifex/utils', () => {
	let stubs, utils;

	beforeEach( () => {
		mockery.enable( {
			useCleanCache: true,
			warnOnReplace: false,
			warnOnUnregistered: false
		} );

		stubs = {
			chalk: {
				cyan: sinon.stub().callsFake( msg => msg )
			},
			logger: sinon.stub().returns( {
				info: sinon.stub(),
				warning: sinon.stub(),
				error: sinon.stub(),
				_log: sinon.stub()
			} )
		};

		mockery.registerMock( 'chalk', stubs.chalk );
		mockery.registerMock( '@ckeditor/ckeditor5-dev-utils', {
			logger: stubs.logger
		} );

		utils = require( '../lib/utils' );
	} );

	afterEach( () => {
		sinon.restore();
		mockery.deregisterAll();
		mockery.disable();
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
			expect( utils.createLogger ).to.be.a( 'function' );
		} );

		it( 'should return an object with methods', () => {
			const logger = utils.createLogger();

			expect( logger ).to.be.an( 'object' );
			expect( logger.progress ).to.be.a( 'function' );
			expect( logger.info ).to.be.a( 'function' );
			expect( logger.warning ).to.be.a( 'function' );
			expect( logger.error ).to.be.a( 'function' );
			expect( logger._log ).to.be.a( 'function' );
		} );

		it( 'should call the info method for a non-empty progress message', () => {
			const logger = utils.createLogger();

			logger.progress( 'Example step.' );

			expect( logger.info.callCount ).to.equal( 1 );
			expect( logger.info.firstCall.args[ 0 ] ).to.equal( '\n📍 Example step.' );
			expect( stubs.chalk.cyan.callCount ).to.equal( 1 );
			expect( stubs.chalk.cyan.firstCall.args[ 0 ] ).to.equal( 'Example step.' );
		} );

		it( 'should call the info method with an empty message for an empty progress message', () => {
			const logger = utils.createLogger();

			logger.progress();

			expect( logger.info.callCount ).to.equal( 1 );
			expect( logger.info.firstCall.args[ 0 ] ).to.equal( '' );
			expect( stubs.chalk.cyan.called ).to.equal( false );
		} );
	} );
} );
