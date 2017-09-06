/**
 * @license Copyright (c) 2003-2017, CKSource - Frederico Knabben. All rights reserved.
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

		describe( 'linkToGithubUser()', () => {
			it( 'makes a link to GitHub profile if a user was mentioned in a comment', () => {
				expect( transformCommit.linkToGithubUser( '@CKSource' ) )
					.to.equal( '[@CKSource](https://github.com/CKSource)' );
			} );

			it( 'does nothing if a comment contains scoped package name', () => {
				expect( transformCommit.linkToGithubUser( '@ckeditor/ckeditor5-foo' ) )
					.to.equal( '@ckeditor/ckeditor5-foo' );
			} );
		} );

		describe( 'linkToGithubIssue()', () => {
			it( 'throws an error if package.json does not contain the "bugs" property', () => {
				stubs.getPackageJson.returns( {
					name: 'test-package'
				} );

				expect( () => transformCommit.linkToGithubIssue( '' ) )
					.to.throw( Error, 'The package.json for "test-package" must contain the "bugs" property.' );
			} );

			it( 'replaces "#ID" with a link to GitHub issue (packageJson.bugs as a string)', () => {
				stubs.getPackageJson.returns( {
					name: 'test-package',
					bugs: '/issues'
				} );

				expect( transformCommit.linkToGithubIssue( 'Some issue #1.' ) )
					.to.equal( 'Some issue [#1](/issues/1).' );
			} );

			it( 'replaces "#ID" with a link to GitHub issue (packageJson.bugs as an object)', () => {
				stubs.getPackageJson.returns( {
					name: 'test-package',
					bugs: {
						url: 'https://github.com/ckeditor/ckeditor5-dev/issues'
					}
				} );

				expect( transformCommit.linkToGithubIssue( 'Some issue #1.' ) )
					.to.equal( 'Some issue [#1](https://github.com/ckeditor/ckeditor5-dev/issues/1).' );
			} );

			it( 'does not replace if the hash belongs to other repository', () => {
				stubs.getPackageJson.returns( {
					name: 'test-package',
					bugs: {
						url: 'https://github.com/ckeditor/ckeditor5-dev/issues'
					}
				} );

				expect( transformCommit.linkToGithubIssue( 'organization/repository#1' ) )
					.to.equal( 'organization/repository#1' );
			} );
		} );

		describe( 'linkToGithubRepository()', () => {
			it( 'makes a link to GitHub if a comment matches to "organization/repository"', () => {
				expect( transformCommit.linkToGithubRepository( 'ckeditor/ckeditor5-dev' ) )
					.to.equal( '[ckeditor/ckeditor5-dev](https://github.com/ckeditor/ckeditor5-dev)' );
			} );

			it( 'makes a link to GitHub issue if a comment matches to "organization/repository#ID"', () => {
				expect( transformCommit.linkToGithubRepository( 'ckeditor/ckeditor5-dev#2' ) )
					.to.equal( '[ckeditor/ckeditor5-dev#2](https://github.com/ckeditor/ckeditor5-dev/issues/2)' );
			} );

			it( 'does not make a link from a comment which is a scoped package', () => {
				expect( transformCommit.linkToGithubRepository( '@ckeditor/ckeditor5-dev' ) )
					.to.equal( '@ckeditor/ckeditor5-dev' );
			} );

			it( 'does not make a link from a comment which is a path', () => {
				expect( transformCommit.linkToGithubRepository( 'i/am/a/path' ) )
					.to.equal( 'i/am/a/path' );
			} );

			it( 'does not make a link if a comment does not match to "organization/repository"', () => {
				expect( transformCommit.linkToGithubRepository( 'ckeditor/ckeditor5-dev/' ) )
					.to.equal( 'ckeditor/ckeditor5-dev/' );
			} );

			it( 'does not make a link from a comment which does not contain the issue id', () => {
				expect( transformCommit.linkToGithubRepository( 'ckeditor/ckeditor5-dev#' ) )
					.to.equal( 'ckeditor/ckeditor5-dev#' );
			} );

			it( 'does not make a link from a comment which is a link to GitHub\'s profile', () => {
				// "com/CKSource" matches to "organization/repository" pattern but it should not be changed.
				expect( transformCommit.linkToGithubRepository( '[@CKSource](https://github.com/CKSource)' ) )
					.to.equal( '[@CKSource](https://github.com/CKSource)' );
			} );
		} );

		describe( 'linkToNpmScopedPackage()', () => {
			it( 'makes a link to NPM if a comment matches to "@organization/repository"', () => {
				expect( transformCommit.linkToNpmScopedPackage( '@ckeditor/ckeditor5-dev' ) )
					.to.equal( '[@ckeditor/ckeditor5-dev](https://npmjs.com/package/@ckeditor/ckeditor5-dev)' );
			} );

			it( 'does not make a link if a comment does not match to "@organization/repository"', () => {
				expect( transformCommit.linkToNpmScopedPackage( 'ckeditor/ckeditor5-dev' ) )
					.to.equal( 'ckeditor/ckeditor5-dev' );
			} );

			it( 'does not make a link from a comment which is a path', () => {
				expect( transformCommit.linkToNpmScopedPackage( '@ckeditor/ckeditor5-dev/README.md' ) )
					.to.equal( '@ckeditor/ckeditor5-dev/README.md' );
			} );

			it( 'does not make a link if a scoped package ends with hash (organization/repository#issue)', () => {
				expect( transformCommit.linkToNpmScopedPackage( '@ckeditor/ckeditor5-dev#1' ) )
					.to.equal( '@ckeditor/ckeditor5-dev#1' );
			} );
		} );

		describe( 'linkTo* - integration', () => {
			it( 'all linkTo* functions should work together with one another', () => {
				stubs.getPackageJson.returns( {
					name: 'ckeditor5-dev',
					bugs: 'https://github.com/ckeditor/ckeditor5-dev/issues'
				} );

				const input = [
					'I am checking how our functions will render the things below:',
					' * organization and repository - ckeditor/ckeditor5-dev',
					' * link to organization - @ckeditor',
					' * a full name of the engine package – @ckeditor/ckeditor5-engine',
					' * a link to an issue in this repository (#269)',
					' * a link to PR in this repository (#273)',
					' * a link to PR in other repository cksource/mgit2#59',
					' * a link to an issue in other repository cksource/mgit2#58'
				].join( '\n' );

				/* eslint-disable max-len */
				const output = [
					'I am checking how our functions will render the things below:',
					' * organization and repository - [ckeditor/ckeditor5-dev](https://github.com/ckeditor/ckeditor5-dev)',
					' * link to organization - [@ckeditor](https://github.com/ckeditor)',
					' * a full name of the engine package – [@ckeditor/ckeditor5-engine](https://npmjs.com/package/@ckeditor/ckeditor5-engine)',
					' * a link to an issue in this repository ([#269](https://github.com/ckeditor/ckeditor5-dev/issues/269))',
					' * a link to PR in this repository ([#273](https://github.com/ckeditor/ckeditor5-dev/issues/273))',
					' * a link to PR in other repository [cksource/mgit2#59](https://github.com/cksource/mgit2/issues/59)',
					' * a link to an issue in other repository [cksource/mgit2#58](https://github.com/cksource/mgit2/issues/58)'
				];
				/* eslint-enable max-len */

				makeLinks( input ).split( '\n' ).forEach( ( row, index ) => {
					expect( row ).to.equal( output[ index ], `Index: ${ index }` );
				} );
			} );

			function makeLinks( comment ) {
				// Order of these functions doesn't matter.
				comment = transformCommit.linkToGithubRepository( comment );
				comment = transformCommit.linkToNpmScopedPackage( comment );
				comment = transformCommit.linkToGithubIssue( comment );
				comment = transformCommit.linkToGithubUser( comment );

				return comment;
			}
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
	} );
} );
