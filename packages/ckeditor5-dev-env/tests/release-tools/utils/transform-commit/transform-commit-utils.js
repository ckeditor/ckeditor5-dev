/**
 * @license Copyright (c) 2003-2017, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

/* jshint mocha:true */

'use strict';

const expect = require( 'chai' ).expect;
const sinon = require( 'sinon' );
const proxyquire = require( 'proxyquire' );

describe( 'dev-env/release-tools/utils/transform-commit', () => {
	let transformCommit, sandbox, stubs;

	describe( 'transformCommitUtils', () => {
		beforeEach( () => {
			sandbox = sinon.sandbox.create();

			stubs = {
				getPackageJson: sandbox.stub()
			};

			transformCommit = proxyquire( '../../../../lib/release-tools/utils/transform-commit/transform-commit-utils', {
				'../getpackagejson': stubs.getPackageJson
			} );
		} );

		afterEach( () => {
			sandbox.restore();
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

		describe( 'truncate()', () => {
			it( 'does not modify too short sentence', () => {
				const sentence = 'This is a short sentence.';

				expect( transformCommit.truncate( sentence, 25 ) ).to.equal( sentence );
			} );

			it( 'truncates too long sentence', () => {
				const sentence = 'This is a short sentence.';

				expect( transformCommit.truncate( sentence, 13 ) ).to.equal( 'This is a...' );
			} );
		} );
	} );
} );
