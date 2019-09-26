/**
 * @license Copyright (c) 2003-2019, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const mockery = require( 'mockery' );
const { expect } = require( 'chai' );
const sinon = require( 'sinon' );

describe( 'parseArguments()', () => {
	let parseArguments, sandbox;

	beforeEach( () => {
		sandbox = sinon.createSandbox();

		mockery.enable( {
			warnOnReplace: false,
			warnOnUnregistered: false
		} );

		parseArguments = require( '../../../lib/utils/automated-tests/parsearguments' );
	} );

	afterEach( () => {
		sandbox.restore();
		mockery.disable();
	} );

	it( 'returns an empty files list if --files was not specified', () => {
		const options = parseArguments( [] );

		expect( options.files ).to.deep.equal( [] );
	} );

	it( 'returns as array values specified in --files', () => {
		const options = parseArguments( [
			'--files',
			'core,engine'
		] );

		expect( options.files ).to.deep.equal( [ 'core', 'engine' ] );
	} );

	it( 'should enable debug options by default', () => {
		const options = parseArguments( [] );

		expect( options.debug ).to.deep.equal( [ 'CK_DEBUG' ] );
	} );

	it( 'allows specifying additional debug flags', () => {
		const options = parseArguments( [
			'--debug',
			'engine,ui'
		] );

		expect( options.debug ).to.deep.equal( [ 'CK_DEBUG', 'CK_DEBUG_ENGINE', 'CK_DEBUG_UI' ] );
	} );

	it( 'allows disabling debug option (--debug false)', () => {
		const options = parseArguments( [
			'--debug',
			'false'
		] );

		expect( options.debug ).to.deep.equal( [] );
	} );

	it( 'allows disabling debug option (--no-debug)', () => {
		const options = parseArguments( [
			'--no-debug'
		] );

		expect( options.debug ).to.deep.equal( [] );
	} );

	describe( 'workaround for "/" in Git Bash (Windows)', () => {
		it( 'adds the main repository when --include-root was used', () => {
			const options = parseArguments( [
				'--include-root'
			] );

			expect( options.files ).to.deep.equal( [ '/' ] );
		} );

		it( 'removes "include-root" from "options" object', () => {
			const options = parseArguments( [
				'--include-root'
			] );

			expect( options[ 'include-root' ] ).to.be.undefined;
		} );

		it( 'does not duplicate the main repository when --include-root was used', () => {
			const options = parseArguments( [
				'--files',
				'/',
				'--include-root'
			] );

			expect( options.files ).to.deep.equal( [ '/' ] );
		} );

		it( 'merges --include-root and values specified in --files', () => {
			const options = parseArguments( [
				'--files',
				'core,engine',
				'--include-root'
			] );

			expect( options.files ).to.deep.equal( [ 'core', 'engine', '/' ] );
		} );

		it( 'ignores values specified in --files when --only-root was used', () => {
			const options = parseArguments( [
				'--files',
				'core,engine',
				'--only-root'
			] );

			expect( options.files ).to.deep.equal( [ '/' ] );
		} );

		it( 'removes "only-root" from "options" object', () => {
			const options = parseArguments( [
				'--only-root'
			] );

			expect( options[ 'only-root' ] ).to.be.undefined;
		} );
	} );
} );
