/**
 * @license Copyright (c) 2003-2023, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const expect = require( 'chai' ).expect;
const fs = require( 'fs' );
const path = require( 'path' );
const sinon = require( 'sinon' );
const glob = require( 'glob' );
const proxyquire = require( 'proxyquire' );

const REPOSITORY_ROOT = path.join( __dirname, '..', '..', '..', '..' );

// This file covers the "parallelworker.js" file.

describe( 'dev-release-tools/utils', () => {
	let executeInParallel, stubs, abortController;

	beforeEach( () => {
		stubs = {
			devUtils: {
				tools: {
					createSpinner: sinon.stub().callsFake( () => stubs.spinnerStub )
				}
			},
			spinnerStub: {
				start: sinon.stub(),
				finish: sinon.stub(),
				increase: sinon.stub()
			}
		};

		abortController = new AbortController();
		executeInParallel = proxyquire( '../../lib/utils/executeinparallel', {
			// To hide the spinner/counter in tests.
			'@ckeditor/ckeditor5-dev-utils': stubs.devUtils
		} );
	} );

	afterEach( () => {
		sinon.restore();
	} );

	describe( 'executeInParallel() - integration', () => {
		it( 'should store current time in all found packages (callback returns a promise)', async () => {
			const timeBefore = new Date().getTime();

			await executeInParallel( {
				cwd: REPOSITORY_ROOT,
				concurrency: 2,
				packagesDirectory: 'packages',
				processDescription: 'Checking ckeditor5-dev paths.',
				signal: abortController.signal,
				taskToExecute: async packagePath => {
					const fs = require( 'fs/promises' );
					const path = require( 'path' );
					const filePath = path.join( packagePath, 'executeinparallel-integration.log' );

					await fs.writeFile( filePath, new Date().getTime().toString() );
				}
			} );

			const timeAfter = new Date().getTime();

			const data = glob.sync( 'packages/*/executeinparallel-integration.log', { cwd: REPOSITORY_ROOT, absolute: true } )
				.map( logFile => {
					return {
						source: logFile,
						value: parseInt( fs.readFileSync( logFile, 'utf-8' ) ),
						packageName: logFile.split( '/' ).reverse().slice( 1, 2 ).pop()
					};
				} );

			for ( const { value, packageName, source } of data ) {
				expect( value > timeBefore, `comparing timeBefore (${ packageName })` ).to.equal( true );
				expect( value < timeAfter, `comparing timeAfter (${ packageName })` ).to.equal( true );

				fs.unlinkSync( source );
			}
		} );

		it( 'should store current time in all found packages (callback returns a promise)', async () => {
			const timeBefore = new Date().getTime();

			await executeInParallel( {
				cwd: REPOSITORY_ROOT,
				concurrency: 2,
				packagesDirectory: 'packages',
				processDescription: 'Checking ckeditor5-dev paths.',
				signal: abortController.signal,
				taskToExecute: packagePath => {
					const fs = require( 'fs' );
					const path = require( 'path' );
					const filePath = path.join( packagePath, 'executeinparallel-integration.log' );

					fs.writeFileSync( filePath, new Date().getTime().toString() );
				}
			} );

			const timeAfter = new Date().getTime();

			const data = glob.sync( 'packages/*/executeinparallel-integration.log', { cwd: REPOSITORY_ROOT, absolute: true } )
				.map( logFile => {
					return {
						source: logFile,
						value: parseInt( fs.readFileSync( logFile, 'utf-8' ) ),
						packageName: logFile.split( '/' ).reverse().slice( 1, 2 ).pop()
					};
				} );

			for ( const { value, packageName, source } of data ) {
				expect( value > timeBefore, `comparing timeBefore (${ packageName })` ).to.equal( true );
				expect( value < timeAfter, `comparing timeAfter (${ packageName })` ).to.equal( true );

				fs.unlinkSync( source );
			}
		} );
	} );
} );

