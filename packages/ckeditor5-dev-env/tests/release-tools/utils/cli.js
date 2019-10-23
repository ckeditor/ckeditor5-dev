/**
 * @license Copyright (c) 2003-2019, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const expect = require( 'chai' ).expect;
const sinon = require( 'sinon' );
const mockery = require( 'mockery' );

describe( 'dev-env/release-tools/utils', () => {
	let cli, sandbox, questionItems, userAnswer;

	describe( 'cli', () => {
		beforeEach( () => {
			userAnswer = undefined;
			sandbox = sinon.createSandbox();
			questionItems = [];

			mockery.enable( {
				useCleanCache: true,
				warnOnReplace: false,
				warnOnUnregistered: false
			} );

			mockery.registerMock( 'inquirer', {
				prompt( questions ) {
					questionItems.push( ...questions );
					const questionItem = questions[ 0 ];

					// If `userAnswer` is undefined, return a suggested value as a user input.
					return Promise.resolve( {
						[ questionItem.name ]: typeof userAnswer != 'undefined' ? userAnswer : questionItem.default
					} );
				}
			} );

			cli = require( '../../../lib/release-tools/utils/cli' );
		} );

		afterEach( () => {
			sandbox.restore();
			mockery.disable();
		} );

		describe( 'INDENT_SIZE', () => {
			it( 'is defined', () => {
				expect( cli.INDENT_SIZE ).to.be.a( 'Number' );
			} );
		} );

		describe( 'COMMIT_INDENT_SIZE', () => {
			it( 'is defined', () => {
				expect( cli.COMMIT_INDENT_SIZE ).to.be.a( 'Number' );
			} );
		} );

		describe( 'confirmUpdatingVersions()', () => {
			it( 'displays packages and their versions (current and proposed) to release', () => {
				const packagesMap = new Map();

				packagesMap.set( '@ckeditor/ckeditor5-engine', {
					previousVersion: '1.0.0',
					version: '1.1.0'
				} );
				packagesMap.set( '@ckeditor/ckeditor5-core', {
					previousVersion: '0.7.0',
					version: '0.7.1'
				} );

				return cli.confirmUpdatingVersions( packagesMap )
					.then( () => {
						const question = questionItems[ 0 ];

						expect( question.message ).to.match( /^Packages and their old and new versions:/ );
						expect( question.message ).to.match( /"@ckeditor\/ckeditor5-engine": v1\.0\.0 => v1\.1\.0/ );
						expect( question.message ).to.match( /"@ckeditor\/ckeditor5-core": v0\.7\.0 => v0\.7\.1/ );
						expect( question.message ).to.match( /Continue\?$/ );
					} );
			} );

			it( 'sorts the packages alphabetically', () => {
				const packagesMap = new Map();

				packagesMap.set( '@ckeditor/ckeditor5-list', {} );
				packagesMap.set( '@ckeditor/ckeditor5-autoformat', {} );
				packagesMap.set( '@ckeditor/ckeditor5-basic-styles', {} );
				packagesMap.set( '@ckeditor/ckeditor5-core', {} );
				packagesMap.set( '@ckeditor/ckeditor5-link', {} );
				packagesMap.set( '@ckeditor/ckeditor5-build-classic', {} );

				return cli.confirmUpdatingVersions( packagesMap )
					.then( () => {
						const packagesAsArray = questionItems[ 0 ].message
							.split( '\n' )
							// Remove header and footer from the message.
							.slice( 1, -1 )
							// Extract package name from the whole line.
							.map( line => line.replace( /.*"([^"]+)".*/, '$1' ) );

						expect( packagesAsArray.length ).to.equal( 6 );
						expect( packagesAsArray[ 0 ] ).to.equal( '@ckeditor/ckeditor5-autoformat' );
						expect( packagesAsArray[ 1 ] ).to.equal( '@ckeditor/ckeditor5-basic-styles' );
						expect( packagesAsArray[ 2 ] ).to.equal( '@ckeditor/ckeditor5-build-classic' );
						expect( packagesAsArray[ 3 ] ).to.equal( '@ckeditor/ckeditor5-core' );
						expect( packagesAsArray[ 4 ] ).to.equal( '@ckeditor/ckeditor5-link' );
						expect( packagesAsArray[ 5 ] ).to.equal( '@ckeditor/ckeditor5-list' );
					} );
			} );
		} );

		describe( 'confirmPublishing()', () => {
			it( 'displays packages and services where they should be released', () => {
				const packagesMap = new Map();

				packagesMap.set( '@ckeditor/ckeditor5-engine', {
					version: '1.1.0',
					shouldReleaseOnNpm: true,
					shouldReleaseOnGithub: true
				} );
				packagesMap.set( '@ckeditor/ckeditor5-core', {
					version: '0.7.0',
					shouldReleaseOnNpm: false,
					shouldReleaseOnGithub: true
				} );
				packagesMap.set( '@ckeditor/ckeditor5-utils', {
					version: '1.7.0',
					shouldReleaseOnNpm: true,
					shouldReleaseOnGithub: false
				} );
				packagesMap.set( '@ckeditor/ckeditor5-widget', {
					version: '2.0.0',
					shouldReleaseOnNpm: false,
					shouldReleaseOnGithub: false
				} );

				return cli.confirmPublishing( packagesMap )
					.then( () => {
						const question = questionItems[ 0 ];

						expect( question.message ).to.match( /^Services where the release will be created:/ );
						expect( question.message ).to.match( /"@ckeditor\/ckeditor5-core" - version: 0\.7\.0 - services: GitHub/ );
						expect( question.message ).to.match( /"@ckeditor\/ckeditor5-engine" - version: 1\.1\.0 - services: NPM, GitHub/ );
						expect( question.message ).to.match( /"@ckeditor\/ckeditor5-utils" - version: 1\.7\.0 - services: NPM/ );
						expect( question.message ).to.match( /"@ckeditor\/ckeditor5-widget" - version: 2\.0\.0 - nothing to release/ );
						expect( question.message ).to.match( /Continue\?$/ );
					} );
			} );
		} );

		describe( 'confirmRemovingFiles()', () => {
			it( 'user can disagree with the proposed value', () => {
				return cli.confirmRemovingFiles()
					.then( () => {
						const question = questionItems[ 0 ];

						expect( question.message ).to.match( /^Remove created archives\?/ );
						expect( question.type ).to.equal( 'confirm' );
					} );
			} );
		} );

		describe( 'provideVersion()', () => {
			it( 'suggests specified version', () => {
				return cli.provideVersion( '1.0.0', '1.1.0' )
					.then( newVersion => {
						expect( newVersion ).to.equal( '1.1.0' );
					} );
			} );

			it( 'should suggest proper "major" version for public package', () => {
				return cli.provideVersion( '1.0.0', 'major' )
					.then( newVersion => {
						expect( newVersion ).to.equal( '2.0.0' );
					} );
			} );

			it( 'should suggest proper "minor" version for public package', () => {
				return cli.provideVersion( '1.0.0', 'minor' )
					.then( newVersion => {
						expect( questionItems[ 0 ].message ).to.equal(
							'Type the new version, "skip" or "internal" (suggested: "1.1.0", current: "1.0.0"):'
						);

						expect( newVersion ).to.equal( '1.1.0' );
					} );
			} );

			it( 'should suggest proper "patch" version for public package', () => {
				return cli.provideVersion( '1.0.0', 'patch' )
					.then( newVersion => {
						expect( newVersion ).to.equal( '1.0.1' );
					} );
			} );

			it( 'should suggest "skip" version for package which does not contain changes', () => {
				return cli.provideVersion( '1.0.0', null )
					.then( newVersion => {
						expect( newVersion ).to.equal( 'skip' );
					} );
			} );

			it( 'should suggest "minor" instead of "major" version for non-public package', () => {
				return cli.provideVersion( '0.7.0', 'major' )
					.then( newVersion => {
						expect( newVersion ).to.equal( '0.8.0' );
					} );
			} );

			it( 'should suggest proper "patch" version for non-public package', () => {
				return cli.provideVersion( '0.7.0', 'patch' )
					.then( newVersion => {
						expect( newVersion ).to.equal( '0.7.1' );
					} );
			} );

			it( 'returns "internal" if suggested version was "internal"', () => {
				return cli.provideVersion( '0.1.0', 'internal' )
					.then( newVersion => {
						expect( newVersion ).to.equal( 'internal' );
					} );
			} );

			it( 'allows disabling "internal" version', () => {
				return cli.provideVersion( '0.1.0', 'major', { disableInternalVersion: true } )
					.then( () => {
						expect( questionItems[ 0 ].message ).to.equal(
							'Type the new version or "skip" (suggested: "0.2.0", current: "0.1.0"):'
						);
					} );
			} );

			it( 'returns "skip" if suggested version was "internal" but it is disabled', () => {
				return cli.provideVersion( '0.1.0', 'internal', { disableInternalVersion: true } )
					.then( newVersion => {
						expect( newVersion ).to.equal( 'skip' );
					} );
			} );

			it( 'should suggest proper pre-release version for pre-release package (major bump)', () => {
				return cli.provideVersion( '1.0.0-alpha.1', 'major' )
					.then( newVersion => {
						expect( newVersion ).to.equal( '1.0.0-alpha.2' );
					} );
			} );

			it( 'should suggest proper pre-release version for pre-release package (minor bump)', () => {
				return cli.provideVersion( '1.0.0-alpha.1', 'minor' )
					.then( newVersion => {
						expect( newVersion ).to.equal( '1.0.0-alpha.2' );
					} );
			} );

			it( 'should suggest proper pre-release version for pre-release package (patch bump)', () => {
				return cli.provideVersion( '1.0.0-alpha.1', 'patch' )
					.then( newVersion => {
						expect( newVersion ).to.equal( '1.0.0-alpha.2' );
					} );
			} );

			it( 'removes spaces from provided version', () => {
				return cli.provideVersion( '1.0.0', 'major' )
					.then( () => {
						const { filter } = questionItems[ 0 ];

						expect( filter( '   0.0.1' ) ).to.equal( '0.0.1' );
						expect( filter( '0.0.1   ' ) ).to.equal( '0.0.1' );
						expect( filter( '    0.0.1   ' ) ).to.equal( '0.0.1' );
					} );
			} );

			it( 'validates the provided version (disableInternalVersion=false)', () => {
				return cli.provideVersion( '1.0.0', 'major' )
					.then( () => {
						const { validate } = questionItems[ 0 ];

						expect( validate( 'skip' ) ).to.equal( true );
						expect( validate( 'internal' ) ).to.equal( true );
						expect( validate( '2.0.0' ) ).to.equal( true );
						expect( validate( '0.1' ) ).to.equal( 'Please provide a valid version.' );
					} );
			} );

			it( 'validates the provided version (disableInternalVersion=true)', () => {
				return cli.provideVersion( '1.0.0', 'major', { disableInternalVersion: true } )
					.then( () => {
						const { validate } = questionItems[ 0 ];

						expect( validate( 'skip' ) ).to.equal( true );
						expect( validate( 'internal' ) ).to.equal( 'Please provide a valid version.' );
						expect( validate( '2.0.0' ) ).to.equal( true );
						expect( validate( '0.1' ) ).to.equal( 'Please provide a valid version.' );
					} );
			} );
		} );

		describe( 'provideToken()', () => {
			it( 'user is able to provide the token', () => {
				return cli.provideToken()
					.then( () => {
						const question = questionItems[ 0 ];

						expect( question.message ).to.match( /^Provide the GitHub token/ );
						expect( question.type ).to.equal( 'password' );
					} );
			} );

			it( 'token must contain 40 characters', () => {
				return cli.provideToken()
					.then( () => {
						const { validate } = questionItems[ 0 ];

						expect( validate( 'abc' ) ).to.equal( 'Please provide a valid token.' );
						expect( validate( 'a'.repeat( 40 ) ) ).to.equal( true );
					} );
			} );
		} );

		describe( 'configureReleaseOptions()', () => {
			it( 'by default returns both services and requires Github token', () => {
				sandbox.stub( cli, 'provideToken' ).resolves( 'a'.repeat( 40 ) );

				return cli.configureReleaseOptions()
					.then( options => {
						const question = questionItems[ 0 ];

						expect( question.message ).to.match( /^Select services where packages will be released:/ );
						expect( question.type ).to.equal( 'checkbox' );

						expect( cli.provideToken.calledOnce ).to.equal( true );

						expect( options ).to.deep.equal( {
							npm: true,
							github: true,
							token: 'a'.repeat( 40 )
						} );
					} );
			} );

			it( 'does not ask about the GitHub token if ignores GitHub release', () => {
				sandbox.stub( cli, 'provideToken' );
				userAnswer = [ 'npm' ];

				return cli.configureReleaseOptions()
					.then( options => {
						expect( cli.provideToken.called ).to.equal( false );

						expect( options ).to.deep.equal( {
							npm: true,
							github: false
						} );
					} );
			} );
		} );

		describe( 'confirmMajorBreakingChangeRelease()', () => {
			it( 'user can disagree with the proposed value', () => {
				return cli.confirmMajorBreakingChangeRelease( true )
					.then( () => {
						const question = questionItems[ 0 ];

						expect( question.message ).to.match( /^Should the next versions be treated as a major bump\?/ );
						expect( question.type ).to.equal( 'confirm' );
					} );
			} );
		} );
	} );
} );
