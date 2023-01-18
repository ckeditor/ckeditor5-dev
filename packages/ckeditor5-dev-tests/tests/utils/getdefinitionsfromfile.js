/**
 * @license Copyright (c) 2003-2023, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const mockery = require( 'mockery' );
const sinon = require( 'sinon' );
const { expect } = require( 'chai' );

describe( 'getDefinitionsFromFile()', () => {
	let getDefinitionsFromFile, consoleStub;

	beforeEach( () => {
		consoleStub = sinon.stub( console, 'error' );
		sinon.stub( process, 'cwd' ).returns( '/workspace' );

		mockery.enable( {
			useCleanCache: true,
			warnOnReplace: false,
			warnOnUnregistered: false
		} );

		mockery.registerMock( 'path', {
			join: sinon.stub().callsFake( ( ...chunks ) => chunks.join( '/' ).replace( '/./', '/' ) ),
			isAbsolute: sinon.stub().callsFake( path => path.startsWith( '/' ) )
		} );

		mockery.registerMock( '/workspace/path/to/secret.js', {
			SECRET: 'secret',
			ANOTHER_SECRET: 'another-secret',
			NON_PRIMITIVE_SECRET: {
				foo: [ 'bar', 'baz' ]
			}
		} );

		getDefinitionsFromFile = require( '../../lib/utils/getdefinitionsfromfile' );
	} );

	afterEach( () => {
		sinon.restore();
		mockery.disable();
		mockery.deregisterAll();
	} );

	it( 'should return definition object if path to identity file is relative', () => {
		const definitions = getDefinitionsFromFile( './path/to/secret.js' );

		expect( definitions ).to.deep.equal( {
			SECRET: '"secret"',
			ANOTHER_SECRET: '"another-secret"',
			NON_PRIMITIVE_SECRET: '{"foo":["bar","baz"]}'
		} );
	} );

	it( 'should return definition object if path to identity file is absolute', () => {
		const definitions = getDefinitionsFromFile( '/workspace/path/to/secret.js' );

		expect( definitions ).to.deep.equal( {
			SECRET: '"secret"',
			ANOTHER_SECRET: '"another-secret"',
			NON_PRIMITIVE_SECRET: '{"foo":["bar","baz"]}'
		} );
	} );

	it( 'should return empty object if path to identity file is not provided', () => {
		const definitions = getDefinitionsFromFile();

		expect( definitions ).to.deep.equal( {} );
	} );

	it( 'should not throw an error and return empty object if path to identity file is not valid', () => {
		let definitions;

		expect( () => {
			definitions = getDefinitionsFromFile( 'foo.js' );
		} ).to.not.throw();

		expect( consoleStub.callCount ).to.equal( 1 );
		expect( consoleStub.firstCall.args[ 0 ] ).to.satisfy( msg => msg.startsWith( 'Cannot find module \'/workspace/foo.js\'' ) );
		expect( definitions ).to.deep.equal( {} );
	} );

	it( 'should not throw an error and return empty object if stringifying the identity file has failed', () => {
		sinon.stub( JSON, 'stringify' ).throws( new Error( 'Example error.' ) );

		let definitions;

		expect( () => {
			definitions = getDefinitionsFromFile( '/workspace/path/to/secret.js' );
		} ).to.not.throw();

		expect( consoleStub.callCount ).to.equal( 1 );
		expect( consoleStub.firstCall.args[ 0 ] ).to.equal( 'Example error.' );
		expect( definitions ).to.deep.equal( {} );
	} );
} );
