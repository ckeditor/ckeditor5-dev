/**
 * @license Copyright (c) 2003-2020, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const expect = require( 'chai' ).expect;
const sinon = require( 'sinon' );
const proxyquire = require( 'proxyquire' );

describe( 'dev-env/release-tools/utils/transform-commit', () => {
	let transformCommit, sandbox, stubs;

	describe( 'transformCommitUtils', () => {
		beforeEach( () => {
			sandbox = sinon.createSandbox();

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

		describe( 'additionalCommitNotes', () => {
			it( 'should be defined', () => {
				expect( transformCommit.additionalCommitNotes ).to.be.a( 'Object' );
			} );
		} );

		describe( 'linkToGithubUser()', () => {
			it( 'makes a link to GitHub profile if a user was mentioned in a comment', () => {
				expect( transformCommit.linkToGithubUser( 'Foo @CKSource Bar' ) )
					.to.equal( 'Foo [@CKSource](https://github.com/CKSource) Bar' );
			} );

			it( 'makes a link to GitHub profile if a user was mentioned in a comment at the beginning', () => {
				expect( transformCommit.linkToGithubUser( '@CKSource Bar' ) )
					.to.equal( '[@CKSource](https://github.com/CKSource) Bar' );
			} );

			it( 'makes a link to GitHub profile if a user was mentioned at the beginning of a line', () => {
				expect( transformCommit.linkToGithubUser( 'Foo\n@CKSource Bar' ) )
					.to.equal( 'Foo\n[@CKSource](https://github.com/CKSource) Bar' );
			} );

			it( 'makes a link to GitHub profile if a user was mentioned in a comment at the ending', () => {
				expect( transformCommit.linkToGithubUser( 'Bar @CKSource' ) )
					.to.equal( 'Bar [@CKSource](https://github.com/CKSource)' );
			} );

			it( 'makes a link to GitHub profile if a user was mentioned in a bracket', () => {
				expect( transformCommit.linkToGithubUser( 'Bar (@CKSource)' ) )
					.to.equal( 'Bar ([@CKSource](https://github.com/CKSource))' );
			} );

			it( 'does nothing if a comment contains scoped package name', () => {
				expect( transformCommit.linkToGithubUser( 'Foo @ckeditor/ckeditor5-foo Bar' ) )
					.to.equal( 'Foo @ckeditor/ckeditor5-foo Bar' );
			} );

			it( 'does nothing if an email is inside the comment', () => {
				expect( transformCommit.linkToGithubUser( 'Foo foo@bar.com Bar' ) )
					.to.equal( 'Foo foo@bar.com Bar' );
			} );

			it( 'does nothing if a user is already linked', () => {
				expect( transformCommit.linkToGithubUser( 'Foo [@bar](https://github.com/bar) Bar' ) )
					.to.equal( 'Foo [@bar](https://github.com/bar) Bar' );
			} );
		} );

		describe( 'linkToGithubIssue()', () => {
			it( 'replaces "#ID" with a link to GitHub issue (packageJson.repository as a string)', () => {
				stubs.getPackageJson.returns( {
					name: 'test-package',
					repository: 'https://github.com/ckeditor/ckeditor5-dev'
				} );

				expect( transformCommit.linkToGithubIssue( 'Some issue #1.' ) )
					.to.equal( 'Some issue [#1](https://github.com/ckeditor/ckeditor5-dev/issues/1).' );
			} );

			it( 'replaces "organization/repository#id" with a link to the issue in specified repository', () => {
				expect( transformCommit.linkToGithubIssue( 'ckeditor/ckeditor5-dev#1' ) )
					.to.equal( '[ckeditor/ckeditor5-dev#1](https://github.com/ckeditor/ckeditor5-dev/issues/1)' );
			} );

			it( 'does not make a link from a comment which is a path', () => {
				expect( transformCommit.linkToGithubIssue( 'i/am/a/path#1' ) )
					.to.equal( 'i/am/a/path#1' );
			} );

			it( 'does not make a link if a comment does not match to "organization/repository"', () => {
				expect( transformCommit.linkToGithubIssue( 'ckeditor/ckeditor5-dev/' ) )
					.to.equal( 'ckeditor/ckeditor5-dev/' );
			} );

			it( 'does not make a link from a comment which does not contain the issue id', () => {
				expect( transformCommit.linkToGithubIssue( 'ckeditor/ckeditor5-dev#' ) )
					.to.equal( 'ckeditor/ckeditor5-dev#' );
			} );
		} );

		describe( 'getCommitType()', () => {
			it( 'throws an error when passed unsupported commit type', () => {
				expect( () => transformCommit.getCommitType( 'invalid' ) )
					.to.throw( Error, 'Given invalid type of commit ("invalid").' );
			} );

			it( 'changes a singular type of commit to plural', () => {
				expect( transformCommit.getCommitType( 'Feature' ) ).to.equal( 'Features' );
				expect( transformCommit.getCommitType( 'Fix' ) ).to.equal( 'Bug fixes' );
				expect( transformCommit.getCommitType( 'Other' ) ).to.equal( 'Other changes' );
			} );

			it( 'should support aliases for the "Fix" type', () => {
				expect( transformCommit.getCommitType( 'Fixes' ), 'Fixes' ).to.equal( 'Bug fixes' );
				expect( transformCommit.getCommitType( 'Fixed' ), 'Fixed' ).to.equal( 'Bug fixes' );
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

		describe( 'getRepositoryUrl()', () => {
			it( 'throws an error if package.json does not contain the "repository" property', () => {
				stubs.getPackageJson.returns( {
					name: 'test-package'
				} );

				expect( () => transformCommit.getRepositoryUrl() )
					.to.throw( Error, 'The package.json for "test-package" must contain the "repository" property.' );
			} );

			it( 'passes specified `cwd` to `getPackageJson()` util', () => {
				stubs.getPackageJson.returns( {
					name: 'test-package',
					repository: 'https://github.com/ckeditor/ckeditor5-dev/issues'
				} );

				transformCommit.getRepositoryUrl( 'foo' );

				expect( stubs.getPackageJson.calledOnce ).to.equal( true );
				expect( stubs.getPackageJson.firstCall.args[ 0 ] ).to.equal( 'foo' );
			} );

			it( 'returns the repository URL (packageJson.repository as a string, contains "/issues")', () => {
				stubs.getPackageJson.returns( {
					name: 'test-package',
					repository: 'https://github.com/ckeditor/ckeditor5-dev/issues'
				} );

				expect( transformCommit.getRepositoryUrl() ).to.equal( 'https://github.com/ckeditor/ckeditor5-dev' );
			} );

			it( 'returns the repository URL (packageJson.repository as a string, ends with ".git")', () => {
				stubs.getPackageJson.returns( {
					name: 'test-package',
					repository: 'https://github.com/ckeditor/ckeditor5-dev.git'
				} );

				expect( transformCommit.getRepositoryUrl() ).to.equal( 'https://github.com/ckeditor/ckeditor5-dev' );
			} );

			it( 'returns the repository URL (packageJson.repository as an object)', () => {
				stubs.getPackageJson.returns( {
					name: 'test-package',
					repository: {
						url: 'https://github.com/ckeditor/ckeditor5-dev'
					}
				} );

				expect( transformCommit.getRepositoryUrl() ).to.equal( 'https://github.com/ckeditor/ckeditor5-dev' );
			} );

			it( 'returns the repository URL (packageJson.repository as an object, contains "/issues")', () => {
				stubs.getPackageJson.returns( {
					name: 'test-package',
					repository: {
						url: 'https://github.com/ckeditor/ckeditor5-dev/issues',
						type: 'git'
					}
				} );

				expect( transformCommit.getRepositoryUrl() ).to.equal( 'https://github.com/ckeditor/ckeditor5-dev' );
			} );

			it( 'returns the repository URL (packageJson.repository as an object, ends with ".git")', () => {
				stubs.getPackageJson.returns( {
					name: 'test-package',
					repository: {
						url: 'https://github.com/ckeditor/ckeditor5-dev.git',
						type: 'git'
					}
				} );

				expect( transformCommit.getRepositoryUrl() ).to.equal( 'https://github.com/ckeditor/ckeditor5-dev' );
			} );
		} );
	} );
} );
