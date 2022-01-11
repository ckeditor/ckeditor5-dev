/**
 * @license Copyright (c) 2003-2022, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const expect = require( 'chai' ).expect;
const sinon = require( 'sinon' );
const proxyquire = require( 'proxyquire' );

describe( 'dev-env/release-tools/utils', () => {
	let transformCommitUtils, sandbox, stubs;

	describe( 'transformCommitUtils', () => {
		beforeEach( () => {
			sandbox = sinon.createSandbox();

			stubs = {
				getPackageJson: sandbox.stub()
			};

			transformCommitUtils = proxyquire( '../../../lib/release-tools/utils/transformcommitutils', {
				'./getpackagejson': stubs.getPackageJson
			} );
		} );

		afterEach( () => {
			sandbox.restore();
		} );

		describe( 'availableTypes', () => {
			it( 'should be defined', () => {
				expect( transformCommitUtils.availableCommitTypes ).to.be.a( 'Map' );
			} );
		} );

		describe( 'typesOrder', () => {
			it( 'should be defined', () => {
				expect( transformCommitUtils.typesOrder ).to.be.a( 'Object' );
			} );
		} );

		describe( 'MULTI_ENTRIES_COMMIT_REGEXP', () => {
			it( 'should be defined', () => {
				expect( transformCommitUtils.MULTI_ENTRIES_COMMIT_REGEXP ).to.be.a( 'RegExp' );
			} );
		} );

		describe( 'getTypeOrder()', () => {
			it( 'returns proper values for commit groups', () => {
				expect( transformCommitUtils.getTypeOrder( 'Features' ) ).to.equal( 1 );
				expect( transformCommitUtils.getTypeOrder( 'Bug fixes' ) ).to.equal( 2 );
				expect( transformCommitUtils.getTypeOrder( 'Other changes' ) ).to.equal( 3 );
			} );

			it( 'returns proper values for commit groups when they ends with additional link', () => {
				expect( transformCommitUtils.getTypeOrder( 'Features [ℹ](url)' ) ).to.equal( 1 );
				expect( transformCommitUtils.getTypeOrder( 'Bug fixes [ℹ](url)' ) ).to.equal( 2 );
				expect( transformCommitUtils.getTypeOrder( 'Other changes [ℹ](url)' ) ).to.equal( 3 );
			} );

			it( 'returns proper values for note groups', () => {
				expect( transformCommitUtils.getTypeOrder( 'MAJOR BREAKING CHANGES' ) ).to.equal( 1 );
				expect( transformCommitUtils.getTypeOrder( 'MINOR BREAKING CHANGES' ) ).to.equal( 2 );
				expect( transformCommitUtils.getTypeOrder( 'BREAKING CHANGES' ) ).to.equal( 3 );
			} );

			it( 'returns proper values for note groups when they ends with additional link', () => {
				expect( transformCommitUtils.getTypeOrder( 'MAJOR BREAKING CHANGES [ℹ](url)' ) ).to.equal( 1 );
				expect( transformCommitUtils.getTypeOrder( 'MINOR BREAKING CHANGES [ℹ](url)' ) ).to.equal( 2 );
				expect( transformCommitUtils.getTypeOrder( 'BREAKING CHANGES [ℹ](url)' ) ).to.equal( 3 );
			} );

			it( 'returns default value for unknown type', () => {
				expect( transformCommitUtils.getTypeOrder( 'Foo' ) ).to.equal( 10 );
				expect( transformCommitUtils.getTypeOrder( 'Bar' ) ).to.equal( 10 );

				expect( transformCommitUtils.getTypeOrder( 'Foo ℹ' ) ).to.equal( 10 );
				expect( transformCommitUtils.getTypeOrder( 'Bar ℹ' ) ).to.equal( 10 );
			} );
		} );

		describe( 'linkToGithubUser()', () => {
			it( 'makes a link to GitHub profile if a user was mentioned in a comment', () => {
				expect( transformCommitUtils.linkToGithubUser( 'Foo @CKSource Bar' ) )
					.to.equal( 'Foo [@CKSource](https://github.com/CKSource) Bar' );
			} );

			it( 'makes a link to GitHub profile if a user was mentioned in a comment at the beginning', () => {
				expect( transformCommitUtils.linkToGithubUser( '@CKSource Bar' ) )
					.to.equal( '[@CKSource](https://github.com/CKSource) Bar' );
			} );

			it( 'makes a link to GitHub profile if a user was mentioned at the beginning of a line', () => {
				expect( transformCommitUtils.linkToGithubUser( 'Foo\n@CKSource Bar' ) )
					.to.equal( 'Foo\n[@CKSource](https://github.com/CKSource) Bar' );
			} );

			it( 'makes a link to GitHub profile if a user was mentioned in a comment at the ending', () => {
				expect( transformCommitUtils.linkToGithubUser( 'Bar @CKSource' ) )
					.to.equal( 'Bar [@CKSource](https://github.com/CKSource)' );
			} );

			it( 'makes a link to GitHub profile if a user was mentioned in a bracket', () => {
				expect( transformCommitUtils.linkToGithubUser( 'Bar (@CKSource)' ) )
					.to.equal( 'Bar ([@CKSource](https://github.com/CKSource))' );
			} );

			it( 'does nothing if a comment contains scoped package name', () => {
				expect( transformCommitUtils.linkToGithubUser( 'Foo @ckeditor/ckeditor5-foo Bar' ) )
					.to.equal( 'Foo @ckeditor/ckeditor5-foo Bar' );
			} );

			it( 'does nothing if an email is inside the comment', () => {
				expect( transformCommitUtils.linkToGithubUser( 'Foo foo@bar.com Bar' ) )
					.to.equal( 'Foo foo@bar.com Bar' );
			} );

			it( 'does nothing if a user is already linked', () => {
				expect( transformCommitUtils.linkToGithubUser( 'Foo [@bar](https://github.com/bar) Bar' ) )
					.to.equal( 'Foo [@bar](https://github.com/bar) Bar' );
			} );
		} );

		describe( 'linkToGithubIssue()', () => {
			it( 'replaces "#ID" with a link to GitHub issue (packageJson.repository as a string)', () => {
				stubs.getPackageJson.returns( {
					name: 'test-package',
					repository: 'https://github.com/ckeditor/ckeditor5-dev'
				} );

				expect( transformCommitUtils.linkToGithubIssue( 'Some issue #1.' ) )
					.to.equal( 'Some issue [#1](https://github.com/ckeditor/ckeditor5-dev/issues/1).' );
			} );

			it( 'replaces "organization/repository#id" with a link to the issue in specified repository', () => {
				expect( transformCommitUtils.linkToGithubIssue( 'ckeditor/ckeditor5-dev#1' ) )
					.to.equal( '[ckeditor/ckeditor5-dev#1](https://github.com/ckeditor/ckeditor5-dev/issues/1)' );
			} );

			it( 'does not make a link from a comment which is a path', () => {
				expect( transformCommitUtils.linkToGithubIssue( 'i/am/a/path#1' ) )
					.to.equal( 'i/am/a/path#1' );
			} );

			it( 'does not make a link if a comment does not match to "organization/repository"', () => {
				expect( transformCommitUtils.linkToGithubIssue( 'ckeditor/ckeditor5-dev/' ) )
					.to.equal( 'ckeditor/ckeditor5-dev/' );
			} );

			it( 'does not make a link from a comment which does not contain the issue id', () => {
				expect( transformCommitUtils.linkToGithubIssue( 'ckeditor/ckeditor5-dev#' ) )
					.to.equal( 'ckeditor/ckeditor5-dev#' );
			} );
		} );

		describe( 'getCommitType()', () => {
			it( 'throws an error when passed unsupported commit type', () => {
				expect( () => transformCommitUtils.getCommitType( 'invalid' ) )
					.to.throw( Error, 'Given invalid type of commit ("invalid").' );
			} );

			it( 'changes a singular type of commit to plural', () => {
				expect( transformCommitUtils.getCommitType( 'Feature' ) ).to.equal( 'Features' );
				expect( transformCommitUtils.getCommitType( 'Fix' ) ).to.equal( 'Bug fixes' );
				expect( transformCommitUtils.getCommitType( 'Other' ) ).to.equal( 'Other changes' );
			} );
		} );

		describe( 'truncate()', () => {
			it( 'does not modify too short sentence', () => {
				const sentence = 'This is a short sentence.';

				expect( transformCommitUtils.truncate( sentence, 25 ) ).to.equal( sentence );
			} );

			it( 'truncates too long sentence', () => {
				const sentence = 'This is a short sentence.';

				expect( transformCommitUtils.truncate( sentence, 13 ) ).to.equal( 'This is a...' );
			} );
		} );

		describe( 'getRepositoryUrl()', () => {
			it( 'throws an error if package.json does not contain the "repository" property', () => {
				stubs.getPackageJson.returns( {
					name: 'test-package'
				} );

				expect( () => transformCommitUtils.getRepositoryUrl() )
					.to.throw( Error, 'The package.json for "test-package" must contain the "repository" property.' );
			} );

			it( 'passes specified `cwd` to `getPackageJson()` util', () => {
				stubs.getPackageJson.returns( {
					name: 'test-package',
					repository: 'https://github.com/ckeditor/ckeditor5-dev/issues'
				} );

				transformCommitUtils.getRepositoryUrl( 'foo' );

				expect( stubs.getPackageJson.calledOnce ).to.equal( true );
				expect( stubs.getPackageJson.firstCall.args[ 0 ] ).to.equal( 'foo' );
			} );

			it( 'returns the repository URL (packageJson.repository as a string, contains "/issues")', () => {
				stubs.getPackageJson.returns( {
					name: 'test-package',
					repository: 'https://github.com/ckeditor/ckeditor5-dev/issues'
				} );

				expect( transformCommitUtils.getRepositoryUrl() ).to.equal( 'https://github.com/ckeditor/ckeditor5-dev' );
			} );

			it( 'returns the repository URL (packageJson.repository as a string, ends with ".git")', () => {
				stubs.getPackageJson.returns( {
					name: 'test-package',
					repository: 'https://github.com/ckeditor/ckeditor5-dev.git'
				} );

				expect( transformCommitUtils.getRepositoryUrl() ).to.equal( 'https://github.com/ckeditor/ckeditor5-dev' );
			} );

			it( 'returns the repository URL (packageJson.repository as an object)', () => {
				stubs.getPackageJson.returns( {
					name: 'test-package',
					repository: {
						url: 'https://github.com/ckeditor/ckeditor5-dev'
					}
				} );

				expect( transformCommitUtils.getRepositoryUrl() ).to.equal( 'https://github.com/ckeditor/ckeditor5-dev' );
			} );

			it( 'returns the repository URL (packageJson.repository as an object, contains "/issues")', () => {
				stubs.getPackageJson.returns( {
					name: 'test-package',
					repository: {
						url: 'https://github.com/ckeditor/ckeditor5-dev/issues',
						type: 'git'
					}
				} );

				expect( transformCommitUtils.getRepositoryUrl() ).to.equal( 'https://github.com/ckeditor/ckeditor5-dev' );
			} );

			it( 'returns the repository URL (packageJson.repository as an object, ends with ".git")', () => {
				stubs.getPackageJson.returns( {
					name: 'test-package',
					repository: {
						url: 'https://github.com/ckeditor/ckeditor5-dev.git',
						type: 'git'
					}
				} );

				expect( transformCommitUtils.getRepositoryUrl() ).to.equal( 'https://github.com/ckeditor/ckeditor5-dev' );
			} );
		} );
	} );
} );
