/**
 * @license Copyright (c) 2003-2017, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

/* jshint mocha:true */

'use strict';

const expect = require( 'chai' ).expect;
const sinon = require( 'sinon' );
const { tools } = require( '@ckeditor/ckeditor5-dev-utils' );

describe( 'utils', () => {
	describe( 'updateDependenciesVersions', () => {
		let updateDependenciesVersions, sandbox;

		beforeEach( () => {
			sandbox = sinon.sandbox.create();

			updateDependenciesVersions = require( '../../lib/utils/updatedependenciesversions' );
		} );

		afterEach( () => {
			sandbox.restore();
		} );

		it( 'does not update when package list is empty', () => {
			const updateJsonFileStub = sandbox.stub( tools, 'updateJSONFile' );

			updateDependenciesVersions( {}, 'path/to/json/file' );

			expect( updateJsonFileStub.called ).to.equal( false );
		} );

		it( 'does not update when dependencies or devDependencies are not defined', () => {
			let json = {};

			const dependencies = {
				'package-a': '1.1.0'
			};

			const updateJsonFileStub = sandbox.stub( tools, 'updateJSONFile', ( pathToJson, editJsonFunction ) => {
				expect( pathToJson ).to.equal( 'path/to/json/file' );

				json = editJsonFunction( json );
			} );

			updateDependenciesVersions( dependencies, 'path/to/json/file' );

			expect( updateJsonFileStub.calledOnce ).to.equal( true );
			expect( json ).to.deep.equal( {} );
		} );

		it( 'updates only existing dependencies and devDependencies', () => {
			let json = {
				dependencies: {
					'package-a': '^1.0.0',
					'package-b': '^2.0.0',
					'package-c': '^3.0.0'
				},
				devDependencies: {
					'package-dev-a': '^0.2.0'
				}
			};

			const dependencies = {
				'package-a': '1.1.0',
				'package-b': '2.1.0',
				'package-dev-a': '1.0.0',
				'package-dev-b': '0.1.0'
			};

			const updateJsonFileStub = sandbox.stub( tools, 'updateJSONFile', ( pathToJson, editJsonFunction ) => {
				expect( pathToJson ).to.equal( 'path/to/json/file' );

				json = editJsonFunction( json );
			} );

			updateDependenciesVersions( dependencies, 'path/to/json/file' );

			expect( updateJsonFileStub.calledOnce ).to.equal( true );

			expect( json.dependencies[ 'package-a' ] ).to.equal( '^1.1.0' );
			expect( json.dependencies[ 'package-b' ] ).to.equal( '^2.1.0' );
			expect( json.dependencies[ 'package-c' ] ).to.equal( '^3.0.0' );
			expect( json.devDependencies[ 'package-dev-a' ] ).to.equal( '^1.0.0' );
		} );
	} );
} );
