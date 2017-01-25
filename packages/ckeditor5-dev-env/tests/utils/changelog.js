/**
 * @license Copyright (c) 2003-2017, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

/* jshint mocha:true */

'use strict';

const fs = require( 'fs' );
const path = require( 'path' );
const expect = require( 'chai' ).expect;
const sinon = require( 'sinon' );

describe( 'utils', () => {
	let utils, sandbox;

	describe( 'changelog', () => {
		beforeEach( () => {
			utils = require( '../../lib/utils/changelog' );

			sandbox = sinon.sandbox.create();
		} );

		afterEach( () => {
			sandbox.restore();
		} );

		it( 'should define constants', () => {
			expect( utils.changelogFile ).to.be.a( 'string' );
			expect( utils.changelogHeader ).to.be.a( 'string' );
		} );

		describe( 'getLatestChangesFromChangelog', () => {
			it( 'returns changes for initial tag', () => {
				const expectedChangelog = [
					'### Features',
					'',
					'* Cloned the main module. ([abcd123](https://github.com))'
				].join( '\n' );

				const changelog = [
					'## 0.1.0 (2017-01-13)\n',
					expectedChangelog
				].join( '\n' );

				const currentChangelogStub = sandbox.stub( utils, 'getCurrentChangelog' )
					.returns( utils.changelogHeader + changelog );

				const parsedChangelog = utils.getLatestChangesFromChangelog( 'v0.1.0' );

				expect( currentChangelogStub.calledOnce ).to.equal( true );
				expect( parsedChangelog ).to.equal( expectedChangelog );
			} );

			it( 'returns changes between tags', () => {
				const expectedChangelog = [
					'### Features',
					'',
					'* Cloned the main module. ([abcd123](https://github.com))\n',
					'### BREAKING CHANGE',
					'* Bump the major!',
				].join( '\n' );

				const changelog = [
					'## [1.0.0](https://github.com/) (2017-01-13)',
					'',
					expectedChangelog,
					'\n',
					'## 0.1.0 (2017-01-13)',
					'',
					'### Features',
					'',
					'* Cloned the main module. ([abcd123](https://github.com))'
				].join( '\n' );

				const currentChangelogStub = sandbox.stub( utils, 'getCurrentChangelog' )
					.returns( utils.changelogHeader + changelog );

				const parsedChangelog = utils.getLatestChangesFromChangelog( 'v1.0.0', 'v0.1.0' );

				expect( currentChangelogStub.calledOnce ).to.equal( true );
				expect( parsedChangelog ).to.equal( expectedChangelog );
			} );
		} );

		describe( 'getCurrentChangelog', () => {
			it( 'resolves the changelog', () => {
				const resolveStub = sandbox.stub( path, 'resolve' ).returns( 'path-to-changelog' );
				const readFileStub = sandbox.stub( fs, 'readFileSync' ).returns( 'Content.' );
				const changelog = utils.getCurrentChangelog();

				expect( resolveStub.calledOnce ).to.equal( true );
				expect( readFileStub.calledOnce ).to.equal( true );
				expect( readFileStub.firstCall.args[ 0 ] ).to.equal( 'path-to-changelog' );
				expect( readFileStub.firstCall.args[ 1 ] ).to.equal( 'utf-8' );
				expect( changelog ).to.equal( 'Content.' );
			} );
		} );

		describe( 'saveChangelog', () => {
			it( 'resolves the promise', () => {
				const resolveStub = sandbox.stub( path, 'resolve' ).returns( 'path-to-changelog' );
				const writeFileStub = sandbox.stub( fs, 'writeFileSync' );

				utils.saveChangelog( 'New content.' );

				expect( resolveStub.calledOnce ).to.equal( true );
				expect( writeFileStub.calledOnce ).to.equal( true );
				expect( writeFileStub.firstCall.args[ 0 ] ).to.equal( 'path-to-changelog' );
				expect( writeFileStub.firstCall.args[ 1 ] ).to.equal( 'New content.' );
			} );
		} );
	} );
} );
