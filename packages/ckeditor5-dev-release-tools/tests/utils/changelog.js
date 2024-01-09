/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const fs = require( 'fs' );
const path = require( 'path' );
const expect = require( 'chai' ).expect;
const sinon = require( 'sinon' );

describe( 'dev-release-tools/utils', () => {
	let utils, sandbox;

	describe( 'changelog', () => {
		beforeEach( () => {
			sandbox = sinon.createSandbox();

			sandbox.stub(
				require( '../../lib/utils/transformcommitutils' ),
				'getRepositoryUrl'
			).returns( 'https://github.com/ckeditor/ckeditor5-dev' );

			utils = require( '../../lib/utils/changelog' );
		} );

		afterEach( () => {
			sandbox.restore();
		} );

		it( 'should define constants', () => {
			expect( utils.changelogFile ).to.be.a( 'string' );
			expect( utils.changelogHeader ).to.be.a( 'string' );
		} );

		describe( 'getChangesForVersion()', () => {
			it( 'returns changes for the first tag which is a link to the release', () => {
				const expectedChangelog = [
					'### Features',
					'',
					'* Cloned the main module. ([abcd123](https://github.com))'
				].join( '\n' );

				const changelog = [
					'## [0.1.0](https://github.com) (2017-01-13)',
					'',
					expectedChangelog
				].join( '\n' );

				const currentChangelogStub = sandbox.stub( utils, 'getChangelog' )
					.returns( utils.changelogHeader + changelog );

				const parsedChangelog = utils.getChangesForVersion( 'v0.1.0' );

				expect( currentChangelogStub.calledOnce ).to.equal( true );
				expect( parsedChangelog ).to.equal( expectedChangelog );
			} );

			it( 'returns changes for the first tag which is not a link', () => {
				const expectedChangelog = [
					'### Features',
					'',
					'* Cloned the main module. ([abcd123](https://github.com))'
				].join( '\n' );

				const changelog = [
					'## 0.1.0 (2017-01-13)',
					'',
					expectedChangelog
				].join( '\n' );

				const currentChangelogStub = sandbox.stub( utils, 'getChangelog' )
					.returns( utils.changelogHeader + changelog );

				const parsedChangelog = utils.getChangesForVersion( 'v0.1.0' );

				expect( currentChangelogStub.calledOnce ).to.equal( true );
				expect( parsedChangelog ).to.equal( expectedChangelog );
			} );

			it( 'returns changes between tags', () => {
				const expectedChangelog = [
					'### Features',
					'',
					'* Cloned the main module. ([abcd123](https://github.com))',
					'',
					'### BREAKING CHANGE',
					'',
					'* Bump the major!'
				].join( '\n' );

				const changelog = [
					'## [1.0.0](https://github.com/) (2017-01-13)',
					'',
					expectedChangelog,
					'',
					'## [0.1.0](https://github.com) (2017-01-13)',
					'',
					'### Features',
					'',
					'* Cloned the main module. ([abcd123](https://github.com))'
				].join( '\n' );

				const currentChangelogStub = sandbox.stub( utils, 'getChangelog' )
					.returns( utils.changelogHeader + changelog );

				const parsedChangelog = utils.getChangesForVersion( 'v1.0.0' );

				expect( currentChangelogStub.calledOnce ).to.equal( true );
				expect( parsedChangelog ).to.equal( expectedChangelog );
			} );

			it( 'returns null if cannot find changes for the specified version', () => {
				const changelog = [
					'## [0.1.0](https://github.com) (2017-01-13)',
					'',
					'### Features',
					'',
					'* Cloned the main module. ([abcd123](https://github.com))'
				].join( '\n' );

				sandbox.stub( utils, 'getChangelog' )
					.returns( utils.changelogHeader + changelog );

				expect( utils.getChangesForVersion( 'v1.0.0' ) ).to.equal( null );
			} );

			it( 'works when date is not specified', () => {
				const changelog = [
					'## 0.3.0',
					'',
					'Foo'
				].join( '\n' );

				sandbox.stub( utils, 'getChangelog' )
					.returns( utils.changelogHeader + changelog );

				expect( utils.getChangesForVersion( 'v0.3.0' ) )
					.to.equal( 'Foo' );
			} );

			it( 'captures correct range of changes (headers are URLs)', () => {
				const changelog = [
					'## [0.3.0](https://github.com) (2017-01-13)',
					'',
					'3',
					'',
					'Some text ## [like a release header]',
					'',
					'## [0.2.0](https://github.com) (2017-01-13)',
					'',
					'2',
					'',
					'## [0.1.0](https://github.com) (2017-01-13)',
					'',
					'1'
				].join( '\n' );

				sandbox.stub( utils, 'getChangelog' )
					.returns( utils.changelogHeader + changelog );

				expect( utils.getChangesForVersion( 'v0.3.0' ) )
					.to.equal( '3\n\nSome text ## [like a release header]' );

				expect( utils.getChangesForVersion( 'v0.2.0' ) )
					.to.equal( '2' );
			} );

			it( 'captures correct range of changes (headers are plain text, "the initial" release check)', () => {
				const changelog = [
					'Changelog',
					'=========',
					'',
					'## 1.0.2 (2022-02-22)',
					'',
					'### Other changes',
					'',
					'* Other change for `1.0.2`.',
					'',
					'',
					'## 1.0.1 (2022-02-22)',
					'',
					'### Other changes',
					'',
					'* Other change for `1.0.1`.',
					'',
					'',
					'## 1.0.0 (2022-02-22)',
					'',
					'This is the initial release.'
				].join( '\n' );

				sandbox.stub( utils, 'getChangelog' ).returns( utils.changelogHeader + changelog );

				expect( utils.getChangesForVersion( '1.0.0' ) ).to.equal( 'This is the initial release.' );
			} );

			it( 'captures correct range of changes (headers are plain text, "middle" version check)', () => {
				const changelog = [
					'Changelog',
					'=========',
					'',
					'## 1.0.2 (2022-02-22)',
					'',
					'### Other changes',
					'',
					'* Other change for `1.0.2`.',
					'',
					'',
					'## 1.0.1 (2022-02-22)',
					'',
					'### Other changes',
					'',
					'* Other change for `1.0.1`.',
					'',
					'',
					'## 1.0.0 (2022-02-22)',
					'',
					'This is the initial release.'
				].join( '\n' );

				sandbox.stub( utils, 'getChangelog' ).returns( utils.changelogHeader + changelog );

				expect( utils.getChangesForVersion( '1.0.1' ) ).to.equal( [
					'### Other changes',
					'',
					'* Other change for `1.0.1`.'
				].join( '\n' ) );
			} );

			it( 'captures correct range of changes (headers are plain text, "the latest" check)', () => {
				const changelog = [
					'Changelog',
					'=========',
					'',
					'## 1.0.2 (2022-02-22)',
					'',
					'### Other changes',
					'',
					'* Other change for `1.0.2`.',
					'',
					'',
					'## 1.0.1 (2022-02-22)',
					'',
					'### Other changes',
					'',
					'* Other change for `1.0.1`.',
					'',
					'',
					'## 1.0.0 (2022-02-22)',
					'',
					'This is the initial release.'
				].join( '\n' );

				sandbox.stub( utils, 'getChangelog' ).returns( utils.changelogHeader + changelog );

				expect( utils.getChangesForVersion( '1.0.2' ) ).to.equal( [
					'### Other changes',
					'',
					'* Other change for `1.0.2`.'
				].join( '\n' ) );
			} );
		} );

		describe( 'getChangelog()', () => {
			it( 'resolves the changelog', () => {
				const joinStub = sandbox.stub( path, 'join' ).returns( 'path-to-changelog' );
				const existsSyncStub = sandbox.stub( fs, 'existsSync' ).returns( true );
				const readFileStub = sandbox.stub( fs, 'readFileSync' ).returns( 'Content.' );
				const changelog = utils.getChangelog();

				expect( joinStub.calledOnce ).to.equal( true );
				expect( existsSyncStub.calledOnce ).to.equal( true );
				expect( readFileStub.calledOnce ).to.equal( true );
				expect( readFileStub.firstCall.args[ 0 ] ).to.equal( 'path-to-changelog' );
				expect( readFileStub.firstCall.args[ 1 ] ).to.equal( 'utf-8' );
				expect( changelog ).to.equal( 'Content.' );
			} );

			it( 'returns null if the changelog does not exist', () => {
				const joinStub = sandbox.stub( path, 'join' ).returns( 'path-to-changelog' );
				const existsSyncStub = sandbox.stub( fs, 'existsSync' ).returns( false );
				const readFileStub = sandbox.stub( fs, 'readFileSync' );
				const changelog = utils.getChangelog();

				expect( joinStub.calledOnce ).to.equal( true );
				expect( existsSyncStub.calledOnce ).to.equal( true );
				expect( readFileStub.called ).to.equal( false );
				expect( changelog ).to.equal( null );
			} );
		} );

		describe( 'saveChangelog()', () => {
			it( 'saves the changelog', () => {
				const processCwdStub = sandbox.stub( process, 'cwd' ).returns( '/tmp' );
				const joinStub = sandbox.stub( path, 'join' ).callsFake( ( ...chunks ) => chunks.join( '/' ) );
				const writeFileStub = sandbox.stub( fs, 'writeFileSync' );

				utils.saveChangelog( 'New content.' );

				expect( joinStub.calledOnce ).to.equal( true );
				expect( processCwdStub.calledOnce ).to.equal( true );
				expect( writeFileStub.calledOnce ).to.equal( true );
				expect( writeFileStub.firstCall.args[ 0 ] ).to.equal( '/tmp/CHANGELOG.md' );
				expect( writeFileStub.firstCall.args[ 1 ] ).to.equal( 'New content.' );
			} );

			it( 'allows changing cwd', () => {
				const joinStub = sandbox.stub( path, 'join' ).callsFake( ( ...chunks ) => chunks.join( '/' ) );
				const writeFileStub = sandbox.stub( fs, 'writeFileSync' );

				utils.saveChangelog( 'New content.', '/new-cwd' );

				expect( joinStub.calledOnce ).to.equal( true );
				expect( writeFileStub.calledOnce ).to.equal( true );
				expect( writeFileStub.firstCall.args[ 0 ] ).to.equal( '/new-cwd/CHANGELOG.md' );
				expect( writeFileStub.firstCall.args[ 1 ] ).to.equal( 'New content.' );
			} );
		} );

		describe( 'truncateChangelog()', () => {
			it( 'does nothing if there is no changelog', () => {
				const saveChangelogStub = sandbox.stub( utils, 'saveChangelog' );

				sandbox.stub( utils, 'getChangelog' ).returns( null );

				utils.truncateChangelog( 5 );

				expect( saveChangelogStub.called ).to.equal( false );
			} );

			it( 'does nothing if changelog does not contain entries', () => {
				const saveChangelogStub = sandbox.stub( utils, 'saveChangelog' );

				sandbox.stub( utils, 'getChangelog' ).returns( utils.changelogHeader + '\n\n' );

				utils.truncateChangelog( 5 );

				expect( saveChangelogStub.called ).to.equal( false );
			} );

			it( 'truncates the changelog and adds the link to the release page', () => {
				const expectedChangelogEntries = [
					'## [0.3.0](https://github.com) (2017-01-13)',
					'',
					'3',
					'',
					'Some text ## [like a release header]',
					'',
					'## [0.2.0](https://github.com) (2017-01-13)',
					'',
					'2'
				].join( '\n' );

				const expectedChangelogFooter = [
					'',
					'',
					'---',
					'',
					'To see all releases, visit the [release page](https://github.com/ckeditor/ckeditor5-dev/releases).',
					''
				].join( '\n' );

				const changelogEntries = [
					expectedChangelogEntries,
					'',
					'## [0.1.0](https://github.com) (2017-01-13)',
					'',
					'1'
				].join( '\n' );

				const saveChangelogStub = sandbox.stub( utils, 'saveChangelog' );

				sandbox.stub( utils, 'getChangelog' ).returns( utils.changelogHeader + changelogEntries );

				utils.truncateChangelog( 2 );

				expect( saveChangelogStub.calledOnce ).to.equal( true );
				expect( saveChangelogStub.firstCall.args[ 0 ] ).to.equal(
					utils.changelogHeader +
					expectedChangelogEntries +
					expectedChangelogFooter
				);
			} );

			it( 'does not add the link to the release page if changelog is not truncated', () => {
				const expectedChangelogEntries = [
					'## [0.3.0](https://github.com) (2017-01-13)',
					'',
					'3',
					'',
					'Some text ## [like a release header]',
					'',
					'## [0.2.0](https://github.com) (2017-01-13)',
					'',
					'2'
				].join( '\n' );

				const expectedChangelogFooter = '\n';

				const changelogEntries = expectedChangelogEntries;

				const saveChangelogStub = sandbox.stub( utils, 'saveChangelog' );

				sandbox.stub( utils, 'getChangelog' ).returns( utils.changelogHeader + changelogEntries );

				utils.truncateChangelog( 2 );

				expect( saveChangelogStub.calledOnce ).to.equal( true );
				expect( saveChangelogStub.firstCall.args[ 0 ] ).to.equal(
					utils.changelogHeader +
					expectedChangelogEntries +
					expectedChangelogFooter
				);
			} );
		} );

		describe( 'getFormattedDate()', () => {
			let clock;

			beforeEach( () => {
				clock = sinon.useFakeTimers( {
					now: new Date( '2023-06-15 12:00:00' )
				} );
			} );

			afterEach( () => {
				clock.restore();
			} );

			it( 'returns a date following the format "year-month-day" with the leading zeros', () => {
				expect( utils.getFormattedDate() ).to.equal( '2023-06-15' );
			} );
		} );
	} );
} );
