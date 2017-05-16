/**
 * @license Copyright (c) 2003-2017, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const expect = require( 'chai' ).expect;
const sinon = require( 'sinon' );
const { tools } = require( '@ckeditor/ckeditor5-dev-utils' );

describe( 'dev-env/release-tools/utils', () => {
	describe( 'updateDependenciesVersions()', () => {
		let updateDependenciesVersions, sandbox;

		beforeEach( () => {
			sandbox = sinon.sandbox.create();

			updateDependenciesVersions = require( '../../../lib/release-tools/utils/updatedependenciesversions' );
		} );

		afterEach( () => {
			sandbox.restore();
		} );

		it( 'does not update when package list is empty', () => {
			let json = {};

			sandbox.stub( tools, 'updateJSONFile', ( pathToJson, editJsonFunction ) => {
				json = editJsonFunction( json );
			} );

			updateDependenciesVersions( new Map(), 'path/to/json/file' );

			expect( json ).to.deep.equal( {} );
		} );

		it( 'does not update when dependencies or devDependencies are not defined', () => {
			let json = {};

			const dependencies = new Map( [
				[ 'package-a', { version: '1.1.0' } ]
			] );

			sandbox.stub( tools, 'updateJSONFile', ( pathToJson, editJsonFunction ) => {
				expect( pathToJson ).to.equal( 'path/to/json/file' );

				json = editJsonFunction( json );
			} );

			updateDependenciesVersions( dependencies, 'path/to/json/file' );

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

			const dependencies = new Map( [
				[ 'package-a', { version: '1.1.0' } ],
				[ 'package-b', { version: '2.1.0' } ],
				[ 'package-dev-a', { version: '1.0.0' } ],
				[ 'package-dev-b', { version: '0.1.0' } ]
			] );

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

		it( 'updates only dependencies if devDependencies not defined', () => {
			let json = {
				dependencies: {
					'package-a': '^1.0.0',
					'package-b': '^2.0.0',
					'package-c': '^3.0.0'
				}
			};

			const dependencies = new Map( [
				[ 'package-a', { version: '1.1.0' } ],
				[ 'package-b', { version: '2.1.0' } ],
				[ 'package-d', { version: '1.2.3' } ]
			] );

			sandbox.stub( tools, 'updateJSONFile', ( pathToJson, editJsonFunction ) => {
				json = editJsonFunction( json );
			} );

			updateDependenciesVersions( dependencies, 'path/to/json/file' );

			expect( json.dependencies[ 'package-a' ] ).to.equal( '^1.1.0' );
			expect( json.dependencies[ 'package-b' ] ).to.equal( '^2.1.0' );
			expect( json.dependencies[ 'package-c' ] ).to.equal( '^3.0.0' );
		} );

		it( 'updates only devDependencies if dependencies not defined', () => {
			let json = {
				devDependencies: {
					'package-a': '^1.0.0',
					'package-b': '^2.0.0',
					'package-c': '^3.0.0'
				}
			};

			const dependencies = new Map( [
				[ 'package-a', { version: '1.1.0' } ],
				[ 'package-b', { version: '2.1.0' } ],
				[ 'package-d', { version: '1.2.3' } ]
			] );

			sandbox.stub( tools, 'updateJSONFile', ( pathToJson, editJsonFunction ) => {
				json = editJsonFunction( json );
			} );

			updateDependenciesVersions( dependencies, 'path/to/json/file' );

			expect( json.devDependencies[ 'package-a' ] ).to.equal( '^1.1.0' );
			expect( json.devDependencies[ 'package-b' ] ).to.equal( '^2.1.0' );
			expect( json.devDependencies[ 'package-c' ] ).to.equal( '^3.0.0' );
		} );
	} );
} );
