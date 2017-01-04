/* jshint mocha:true */

'use strict';

const mockery = require( 'mockery' );
const { expect } = require( 'chai' );
const sinon = require( 'sinon' );

describe( 'getkarmaconfig', () => {
	let getKarmaConfig;
	let sandbox;

	beforeEach( () => {
		sandbox = sinon.sandbox.create();
		sandbox.stub( process, 'cwd', () => 'workspace' );

		mockery.enable( {
			warnOnReplace: false,
			warnOnUnregistered: false
		} );
		mockery.registerMock( 'getWebpackConfigForAutomatedTests', ( options ) => options );

		getKarmaConfig = require( '../../lib/utils/getkarmaconfig' );
	} );

	afterEach( () => {
		sandbox.restore();
		mockery.disable();
	} );

	it( 'should return basic karma config', () => {
		const karmaConfig = getKarmaConfig( {
			files: [ '*' ],
			reporter: 'mocha'
		} );

		expect( karmaConfig.reporters ).to.deep.equal( [ 'mocha' ] );
		expect( karmaConfig.files ).to.deep.eq( [ 'workspace/node_modules/ckeditor5-!(dev)*/tests/**/*.js' ] );
	} );
} );