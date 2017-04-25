/**
 * @license Copyright (c) 2003-2017, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

/* jshint mocha:true */

'use strict';

const expect = require( 'chai' ).expect;
const sinon = require( 'sinon' );
const mockery = require( 'mockery' );

describe( 'dev-env/release-tools/utils', () => {
	let transformCommit, sandbox, stubs;

	describe( 'transformCommitUtils', () => {
		beforeEach( () => {
			sandbox = sinon.sandbox.create();

			mockery.enable( {
				useCleanCache: true,
				warnOnReplace: false,
				warnOnUnregistered: false
			} );

			stubs = {
				getPackageJson: sandbox.stub()
			};

			mockery.registerMock( './getpackagejson', stubs.getPackageJson );

			transformCommit = require( '../../../lib/release-tools/utils/transform-commit-utils' );
		} );

		afterEach( () => {
			sandbox.restore();
			mockery.disable();
		} );

		describe( 'availableTypes', () => {
			it( 'should be defined', () => {
				expect( transformCommit.availableCommitTypes ).to.be.a( 'Map' );
			} );
		} );

		describe( 'typesOrder', () => {
			it( 'should be defined', () => {
				expect( transformCommit.typesOrder ).to.be.a( 'Object' );
			} );
		} );

		describe( 'linkGithubUsers()', () => {
			it( 'marks profile as a link to GitHub profile', () => {
				expect( transformCommit.linkGithubUsers( '@CKSource' ) )
					.to.equal( '[@CKSource](https://github.com/CKSource)' );
			} );
		} );

		describe( 'linkGithubIssues()', () => {
			it( 'throws an error if package.json does not contain the "bugs" property', () => {
				stubs.getPackageJson.returns( {
					name: 'test-package'
				} );

				expect( () => transformCommit.linkGithubIssues( '' ) )
					.to.throw( Error, `The package.json for "test-package" must contain the "bugs" property.` );
			} );

			it( 'marks references to issues as links to GitHub issues #1', () => {
				stubs.getPackageJson.returns( {
					name: 'test-package',
					bugs: '/issues'
				} );

				expect( transformCommit.linkGithubIssues( 'Some issue #1.' ) )
					.to.equal( 'Some issue [#1](/issues/1).' );
			} );

			it( 'marks references to issues as links to GitHub issues #2', () => {
				stubs.getPackageJson.returns( {
					name: 'test-package',
					bugs: {
						url: '/issues'
					}
				} );

				expect( transformCommit.linkGithubIssues( 'Some issue #1.' ) )
					.to.equal( 'Some issue [#1](/issues/1).' );
			} );

			it( 'adds created links to collection', () => {
				stubs.getPackageJson.returns( {
					name: 'test-package',
					bugs: '/issues'
				} );

				const issues = [];

				transformCommit.linkGithubIssues( '#1 #2 #3.', issues );

				expect( issues ).to.deep.equal( [ '1', '2', '3' ] );
			} );
		} );

		describe( 'getCommitType()', () => {
			it( 'throws an error when passed unsupported commit type', () => {
				expect( () => transformCommit.getCommitType( 'invalid' ) )
					.to.throw( Error, `Given invalid type of commit ("invalid").` );
			} );

			it( 'changes a singular type of commit to plural', () => {
				expect( transformCommit.getCommitType( 'Feature' ) ).to.equal( 'Features' );
				expect( transformCommit.getCommitType( 'Fix' ) ).to.equal( 'Bug fixes' );
				expect( transformCommit.getCommitType( 'Other' ) ).to.equal( 'Other changes' );
			} );
		} );
	} );
} );
