/**
 * @license Copyright (c) 2003-2020, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const expect = require( 'chai' ).expect;
const sinon = require( 'sinon' );
const mockery = require( 'mockery' );

describe( 'dev-env/release-tools/utils', () => {
	describe( 'transformCommitFactory()', () => {
		let transformCommitFactory, sandbox, stubs;

		beforeEach( () => {
			sandbox = sinon.createSandbox();

			mockery.enable( {
				useCleanCache: true,
				warnOnReplace: false,
				warnOnUnregistered: false
			} );

			stubs = {
				getPackageJson: () => {
					return {
						repository: 'https://github.com/ckeditor/ckeditor5-dev'
					};
				},
				getChangedFilesForCommit: sandbox.stub()
			};

			mockery.registerMock( './getpackagejson', stubs.getPackageJson );
			mockery.registerMock( './getchangedfilesforcommit', stubs.getChangedFilesForCommit );

			transformCommitFactory = require( '../../../lib/release-tools/utils/transformcommitfactory' );
		} );

		afterEach( () => {
			sandbox.restore();
			mockery.disable();
		} );

		it( 'returns a function', () => {
			expect( transformCommitFactory() ).to.be.a( 'function' );
		} );

		describe( 'options.treatMajorAsMinorBreakingChange = true', () => {
			it( 'treats "MAJOR BREAKING CHANGES" as "MINOR BREAKING CHANGES"', () => {
				const transformCommit = transformCommitFactory( {
					treatMajorAsMinorBreakingChange: true,
					useExplicitBreakingChangeGroups: true
				} );

				const rawCommit = {
					hash: '684997d0eb2eca76b9e058fb1c3fa00b50059cdc',
					header: 'Fix: Simple fix.',
					type: 'Fix',
					subject: 'Simple fix.',
					body: null,
					footer: null,
					notes: [
						{ title: 'BREAKING CHANGE', text: 'Note 1.' },
						{ title: 'MAJOR BREAKING CHANGES', text: 'Note 2.' }
					]
				};

				const commit = transformCommit( rawCommit );

				expect( commit.notes[ 0 ].title ).to.equal( 'MINOR BREAKING CHANGES' );
				expect( commit.notes[ 1 ].title ).to.equal( 'MINOR BREAKING CHANGES' );
			} );
		} );

		describe( 'transformCommit()', () => {
			let transformCommit;

			beforeEach( () => {
				transformCommit = transformCommitFactory();
			} );

			it( 'returns a new instance of object instead od modifying passed one', () => {
				const notes = [
					{ title: 'BREAKING CHANGES', text: 'Foo-Text', scope: null },
					{ title: 'BREAKING CHANGES', text: 'Bar-Text', scope: null }
				];

				const rawCommit = {
					hash: '684997d0eb2eca76b9e058fb1c3fa00b50059cdc',
					header: 'Fix: Simple fix.',
					type: 'Fix',
					subject: 'Simple fix.',
					body: null,
					footer: null,
					notes
				};

				const commit = transformCommit( rawCommit );

				// Notes cannot be the same but they should be equal.
				expect( commit.notes ).to.not.equal( rawCommit.notes );
				expect( commit.notes ).to.deep.equal( rawCommit.notes );
			} );

			it( 'returns files that were changed with the commit', () => {
				const rawCommit = {
					hash: '684997d0eb2eca76b9e058fb1c3fa00b50059cdc',
					header: 'Fix: Simple fix.',
					type: 'Fix',
					subject: 'Simple fix.',
					body: null,
					footer: null,
					notes: []
				};

				const files = [
					'a/b/y.txt',
					'c/d/z.md'
				];

				stubs.getChangedFilesForCommit.returns( files );

				const commit = transformCommit( rawCommit );

				expect( stubs.getChangedFilesForCommit.calledOnce ).to.equal( true );
				expect( commit.files ).to.deep.equal( files );
			} );

			it( 'returns non-public commit', () => {
				const rawCommit = {
					hash: '684997d',
					header: 'Docs: README.',
					type: 'Docs',
					subject: 'README.',
					body: null,
					footer: null,
					notes: []
				};

				const newCommit = transformCommit( rawCommit );

				expect( newCommit ).to.not.equal( undefined );
			} );

			it( 'groups "BREAKING CHANGES" and "BREAKING CHANGE" as "MAJOR BREAKING CHANGES"', () => {
				const rawCommit = {
					hash: '684997d0eb2eca76b9e058fb1c3fa00b50059cdc',
					header: 'Fix: Simple fix.',
					type: 'Fix',
					subject: 'Simple fix.',
					body: null,
					footer: null,
					notes: [
						{ title: 'BREAKING CHANGE', text: 'Note 1.' },
						{ title: 'BREAKING CHANGES', text: 'Note 2.' }
					]
				};

				const transformCommit = transformCommitFactory( {
					useExplicitBreakingChangeGroups: true
				} );
				const commit = transformCommit( rawCommit );

				expect( commit.notes[ 0 ].title ).to.equal( 'MAJOR BREAKING CHANGES' );
				expect( commit.notes[ 1 ].title ).to.equal( 'MAJOR BREAKING CHANGES' );
			} );

			it( 'makes proper links in the commit subject', () => {
				const rawCommit = {
					hash: '76b9e058fb1c3fa00b50059cdc684997d0eb2eca',
					header: 'Fix: Simple fix. See ckeditor/ckeditor5#1. Thanks to @CKEditor. Closes #2.',
					type: 'Fix',
					subject: 'Simple fix. See ckeditor/ckeditor5#1. Thanks to @CKEditor. Closes #2.',
					body: null,
					footer: null,
					notes: []
				};

				const commit = transformCommit( rawCommit );

				const expectedSubject = 'Simple fix. ' +
					'See [ckeditor/ckeditor5#1](https://github.com/ckeditor/ckeditor5/issues/1). ' +
					'Thanks to [@CKEditor](https://github.com/CKEditor). ' +
					'Closes [#2](https://github.com/ckeditor/ckeditor5-dev/issues/2).';

				expect( commit.subject ).to.equal( expectedSubject );
			} );

			it( 'makes proper links in the commit body', () => {
				const rawCommit = {
					hash: '76b9e058fb1c3fa00b50059cdc684997d0eb2eca',
					header: 'Fix: Simple fix. Closes #2.',
					type: 'Fix',
					subject: 'Simple fix. Closes #2',
					body: 'See ckeditor/ckeditor5#1. Thanks to @CKEditor. Read more #2.',
					footer: null,
					notes: []
				};

				const commit = transformCommit( rawCommit );

				// Remember about the indent in commit body.
				const expectedBody = '  See [ckeditor/ckeditor5#1](https://github.com/ckeditor/ckeditor5/issues/1). ' +
					'Thanks to [@CKEditor](https://github.com/CKEditor). ' +
					'Read more [#2](https://github.com/ckeditor/ckeditor5-dev/issues/2).';

				expect( commit.body ).to.equal( expectedBody );
			} );

			it( 'makes proper links in the commit notes', () => {
				const rawCommit = {
					hash: '76b9e058fb1c3fa00b50059cdc684997d0eb2eca',
					header: 'Fix: Simple fix. Closes #2.',
					type: 'Fix',
					subject: 'Simple fix. Closes #2',
					body: null,
					footer: null,
					notes: [
						{
							title: 'BREAKING CHANGES',
							text: 'See ckeditor/ckeditor5#1. Thanks to @CKEditor.'
						},
						{
							title: 'BREAKING CHANGES',
							text: 'Read more #2.'
						}
					]
				};

				const commit = transformCommit( rawCommit );

				const expectedFirstNoteText = 'See [ckeditor/ckeditor5#1](https://github.com/ckeditor/ckeditor5/issues/1). ' +
					'Thanks to [@CKEditor](https://github.com/CKEditor).';

				// eslint-disable-next-line max-len
				const expectedSecondNodeText = 'Read more [#2](https://github.com/ckeditor/ckeditor5-dev/issues/2).';

				expect( commit.notes[ 0 ].text ).to.equal( expectedFirstNoteText );
				expect( commit.notes[ 1 ].text ).to.equal( expectedSecondNodeText );
			} );

			it( 'attaches additional commit description with correct indent', () => {
				const commitDescription = [
					'* Release task - rebuilt module for collecting dependencies to release.',
					'* Used `semver` package for bumping the version (instead of a custom module).'
				];

				const commitDescriptionWithIndents = [
					'  * Release task - rebuilt module for collecting dependencies to release.',
					'  * Used `semver` package for bumping the version (instead of a custom module).'
				].join( '\n' );

				const rawCommit = {
					header: 'Feature: Introduced a brand new release tools with a new set of requirements. See #64.',
					hash: 'dea35014ab610be0c2150343c6a8a68620cfe5ad',
					body: commitDescription.join( '\n' ),
					footer: null,
					mentions: [],
					type: 'Feature',
					subject: 'Introduced a brand new release tools with a new set of requirements. See #64.',
					notes: []
				};

				const commit = transformCommit( rawCommit );

				expect( commit.type ).to.equal( 'Features' );
				expect( commit.subject ).to.equal( 'Introduced a brand new release tools with a new set of requirements. ' +
					'See [#64](https://github.com/ckeditor/ckeditor5-dev/issues/64).' );
				expect( commit.body ).to.equal( commitDescriptionWithIndents );
			} );

			it( 'removes references to issues', () => {
				const rawCommit = {
					hash: '684997d0eb2eca76b9e058fb1c3fa00b50059cdc',
					header: 'Fix: Simple fix.',
					type: 'Fix',
					subject: 'Simple fix.',
					body: null,
					footer: null,
					notes: [],
					references: [
						{ issue: '11' },
						{ issue: '12' }
					]
				};

				const commit = transformCommit( rawCommit );

				expect( commit.references ).to.equal( undefined );
			} );

			it( 'uses commit\'s footer as a commit\'s body when commit does not have additional notes', () => {
				const rawCommit = {
					hash: 'dea35014ab610be0c2150343c6a8a68620cfe5ad',
					header: 'Feature: Introduced a brand new release tools with a new set of requirements.',
					type: 'Feature',
					subject: 'Introduced a brand new release tools with a new set of requirements.',
					body: null,
					footer: 'Additional description has been parsed as a footer but it should be a body.',
					notes: []
				};

				const commit = transformCommit( rawCommit );

				expect( commit.body ).to.equal(
					'  Additional description has been parsed as a footer but it should be a body.'
				);
				expect( commit.footer ).to.equal( null );
			} );

			it( 'fixes the commit which does not contain the second line', () => {
				const rawCommit = {
					type: null,
					subject: null,
					merge: 'Merge branch \'master\' of github.com:ckeditor/ckeditor5-dev',
					header: '-hash-',
					body: '575e00bc8ece48826adefe226c4fb1fe071c73a7',
					footer: null,
					notes: [],
					references: [],
					mentions: [],
					revert: null
				};

				const transformCommit = transformCommitFactory( {
					returnInvalidCommit: true
				} );

				const commit = transformCommit( rawCommit );

				expect( commit.hash ).to.equal( '575e00bc8ece48826adefe226c4fb1fe071c73a7' );
				expect( commit.header ).to.equal( 'Merge branch \'master\' of github.com:ckeditor/ckeditor5-dev' );
				expect( commit.body ).to.equal( null );
			} );

			it( 'removes [skip ci] from the commit message', () => {
				const rawCommit = {
					hash: '684997d0eb2eca76b9e058fb1c3fa00b50059cdc',
					header: 'Fix: README. [skip ci]',
					type: 'Fix',
					subject: 'README. [skip ci]',
					body: null,
					footer: null,
					notes: []
				};

				const commit = transformCommit( rawCommit );

				expect( commit.subject ).to.equal( 'README.' );
			} );

			it( 'ignores merge "stable" commit', () => {
				const rawCommit = {
					type: null,
					subject: null,
					merge: 'Merge branch \'stable\'',
					header: '-hash-',
					body: '575e00bc8ece48826adefe226c4fb1fe071c73a7',
					footer: null,
					notes: [],
					references: [],
					mentions: [],
					revert: null
				};

				expect( transformCommit( rawCommit ) ).to.equal( undefined );
				expect( transformCommit( rawCommit ) ).to.equal( undefined );
			} );

			it( 'includes "repositoryUrl" where the commit has been done', () => {
				const notes = [
					{ title: 'Foo', text: 'Foo-Text' },
					{ title: 'Bar', text: 'Bar-Text' }
				];

				const rawCommit = {
					hash: '684997d0eb2eca76b9e058fb1c3fa00b50059cdc',
					header: 'Fix: Simple fix.',
					type: 'Fix',
					subject: 'Simple fix.',
					body: null,
					footer: null,
					notes
				};

				const commit = transformCommit( rawCommit );

				expect( commit.repositoryUrl ).to.equal( 'https://github.com/ckeditor/ckeditor5-dev' );
			} );

			it( 'treats all "* BREAKING CHANGES" notes as "BREAKING CHANGE"', () => {
				const rawCommit = {
					hash: '684997d0eb2eca76b9e058fb1c3fa00b50059cdc',
					header: 'Fix: Simple fix.',
					type: 'Fix',
					subject: 'Simple fix.',
					body: null,
					footer: null,
					notes: [
						{ title: 'BREAKING CHANGE', text: 'Note 1.' },
						{ title: 'BREAKING CHANGES', text: 'Note 2.' },
						{ title: 'MAJOR BREAKING CHANGE', text: 'Note 3.' },
						{ title: 'MAJOR BREAKING CHANGES', text: 'Note 4.' },
						{ title: 'MINOR BREAKING CHANGE', text: 'Note 5.' },
						{ title: 'MINOR BREAKING CHANGES', text: 'Note 6.' }
					]
				};

				const commit = transformCommit( rawCommit );

				expect( commit.notes[ 0 ].title ).to.equal( 'BREAKING CHANGES' );
				expect( commit.notes[ 1 ].title ).to.equal( 'BREAKING CHANGES' );
				expect( commit.notes[ 2 ].title ).to.equal( 'BREAKING CHANGES' );
				expect( commit.notes[ 3 ].title ).to.equal( 'BREAKING CHANGES' );
				expect( commit.notes[ 4 ].title ).to.equal( 'BREAKING CHANGES' );
				expect( commit.notes[ 5 ].title ).to.equal( 'BREAKING CHANGES' );
			} );

			it( 'removes duplicated notes from the footer', () => {
				const notes = [
					{ title: 'BREAKING CHANGES', text: 'Foo.', scope: null },
					{ title: 'BREAKING CHANGES', text: 'Bar-Text.', scope: null }
				];

				const rawCommit = {
					hash: '684997d0eb2eca76b9e058fb1c3fa00b50059cdc',
					header: 'Fix: Simple fix.',
					type: 'Fix',
					subject: 'Simple fix.',
					body: null,
					footer: [
						'BREAKING CHANGES: Foo.',
						'NOTE: Do not remove me.',
						'BREAKING CHANGES: Bar-Text.'
					].join( '\n' ),
					notes
				};

				const commit = transformCommit( rawCommit );

				expect( commit.body ).to.equal( '  NOTE: Do not remove me.' );
				expect( commit.notes ).to.deep.equal( notes );
			} );

			it( 'merges multiple "Closes #" references into single entry', () => {
				const rawCommit = {
					hash: '684997d0eb2eca76b9e058fb1c3fa00b50059cdc',
					header: 'Fix: Simple fix. Closes #1. Closes #2. Closes #3.',
					type: 'Fix',
					subject: 'Simple fix. Closes #1. Closes #2. Closes #3.',
					body: null,
					footer: null,
					notes: []
				};

				const commit = transformCommit( rawCommit );

				const expectedSubject = 'Simple fix. Closes ' +
					'[#1](https://github.com/ckeditor/ckeditor5-dev/issues/1), ' +
					'[#2](https://github.com/ckeditor/ckeditor5-dev/issues/2), ' +
					'[#3](https://github.com/ckeditor/ckeditor5-dev/issues/3).';

				expect( commit.subject ).to.equal( expectedSubject );
			} );

			it( 'merges multiple "Closes #" references into single entry and does not touch "See #" references.', () => {
				const rawCommit = {
					hash: '684997d0eb2eca76b9e058fb1c3fa00b50059cdc',
					header: 'Fix: Simple fix. Closes #1. Closes #2. See #3, #.',
					type: 'Fix',
					subject: 'Simple fix. Closes #1. Closes #2. See #3, #4.',
					body: null,
					footer: null,
					notes: []
				};

				const commit = transformCommit( rawCommit );

				const expectedSubject = 'Simple fix. Closes ' +
					'[#1](https://github.com/ckeditor/ckeditor5-dev/issues/1), ' +
					'[#2](https://github.com/ckeditor/ckeditor5-dev/issues/2). ' +
					'See [#3](https://github.com/ckeditor/ckeditor5-dev/issues/3), ' +
					'[#4](https://github.com/ckeditor/ckeditor5-dev/issues/4).';

				expect( commit.subject ).to.equal( expectedSubject );
			} );

			describe( 'scopes', () => {
				it( 'returns null if the scope is being missed', () => {
					const rawCommit = {
						hash: '76b9e058fb1c3fa00b50059cdc684997d0eb2eca',
						header: 'Fix: Simple fix.',
						type: 'Fix',
						subject: 'Simple fix.',
						body: null,
						footer: null,
						notes: []
					};

					const commit = transformCommit( rawCommit );

					expect( commit.scope ).to.be.equal( null );
				} );

				it( 'extracts the scope from the commit type', () => {
					const rawCommit = {
						hash: '76b9e058fb1c3fa00b50059cdc684997d0eb2eca',
						header: 'Fix (package): Simple fix.',
						type: 'Fix (package)',
						subject: 'Simple fix.',
						body: null,
						footer: null,
						notes: []
					};

					const commit = transformCommit( rawCommit );

					expect( commit.scope ).to.be.an( 'Array' );
					expect( commit.scope.length ).to.equal( 1 );
					expect( commit.scope[ 0 ] ).to.equal( 'package' );
					expect( commit.rawType ).to.equal( 'Fix' );
				} );

				it( 'works with multi-scoped changes (commit type)', () => {
					const rawCommit = {
						hash: '76b9e058fb1c3fa00b50059cdc684997d0eb2eca',
						header: 'Feature (foo, bar): Simple fix.',
						type: 'Feature (foo, bar)',
						subject: 'Simple fix.',
						body: null,
						footer: null,
						notes: []
					};

					const commit = transformCommit( rawCommit );

					expect( commit.scope ).to.be.an( 'Array' );
					expect( commit.scope.length ).to.equal( 2 );
					expect( commit.scope[ 0 ] ).to.equal( 'bar' );
					expect( commit.scope[ 1 ] ).to.equal( 'foo' );
					expect( commit.rawType ).to.equal( 'Feature' );
				} );

				it( 'extracts the scope from notes', () => {
					const rawCommit = {
						hash: '76b9e058fb1c3fa00b50059cdc684997d0eb2eca',
						header: 'Fix: Simple fix.',
						type: 'Fix',
						subject: 'Simple fix.',
						body: null,
						footer: null,
						notes: [
							{
								title: 'BREAKING CHANGES',
								text: '(package): Foo.'
							}
						]
					};

					const commit = transformCommit( rawCommit );

					expect( commit.notes ).to.be.an( 'Array' );
					expect( commit.notes.length ).to.equal( 1 );
					expect( commit.notes[ 0 ] ).to.be.an( 'Object' );
					expect( commit.notes[ 0 ].text ).to.equal( 'Foo.' );
					expect( commit.notes[ 0 ].title ).to.equal( 'BREAKING CHANGES' );
					expect( commit.notes[ 0 ].scope ).to.be.an( 'Array' );
					expect( commit.notes[ 0 ].scope.length ).to.equal( 1 );
					expect( commit.notes[ 0 ].scope[ 0 ] ).to.equal( 'package' );
				} );

				it( 'works with multi-scoped notes', () => {
					const rawCommit = {
						hash: '76b9e058fb1c3fa00b50059cdc684997d0eb2eca',
						header: 'Fix: Simple fix.',
						type: 'Fix',
						subject: 'Simple fix.',
						body: null,
						footer: null,
						notes: [
							{
								title: 'BREAKING CHANGES',
								text: '(foo, bar): Package.'
							}
						]
					};

					const commit = transformCommit( rawCommit );

					expect( commit.notes ).to.be.an( 'Array' );
					expect( commit.notes.length ).to.equal( 1 );
					expect( commit.notes[ 0 ] ).to.be.an( 'Object' );
					expect( commit.notes[ 0 ].text ).to.equal( 'Package.' );
					expect( commit.notes[ 0 ].title ).to.equal( 'BREAKING CHANGES' );
					expect( commit.notes[ 0 ].scope ).to.be.an( 'Array' );
					expect( commit.notes[ 0 ].scope.length ).to.equal( 2 );
					expect( commit.notes[ 0 ].scope[ 0 ] ).to.equal( 'bar' );
					expect( commit.notes[ 0 ].scope[ 1 ] ).to.equal( 'foo' );
				} );
			} );

			describe( 'multi-entries commit', () => {
				it( 'returns an array with all entries', () => {
					const rawCommit = {
						hash: '76b9e058fb1c3fa00b50059cdc684997d0eb2eca',
						header: 'Feature: Simple feature (1).',
						type: 'Feature',
						subject: 'Simple feature (1).',
						body: [
							'Fix: Simple fix (2).',
							'',
							'Other: Simple other change (3).'
						].join( '\n' ),
						footer: null,
						notes: []
					};

					const commits = transformCommit( rawCommit );

					expect( commits ).to.be.an( 'Array' );
					expect( commits.length ).to.equal( 3 );

					expect( commits[ 0 ] ).to.deep.equal( {
						hash: '76b9e058fb1c3fa00b50059cdc684997d0eb2eca',
						header: 'Feature: Simple feature (1).',
						type: 'Features',
						subject: 'Simple feature (1).',
						body: '',
						footer: null,
						notes: [],
						rawType: 'Feature',
						files: [],
						scope: null,
						isPublicCommit: true,
						repositoryUrl: 'https://github.com/ckeditor/ckeditor5-dev'
					} );

					expect( commits[ 1 ] ).to.deep.equal( {
						hash: '76b9e058fb1c3fa00b50059cdc684997d0eb2eca',
						header: 'Fix: Simple fix (2).',
						type: 'Bug fixes',
						subject: 'Simple fix (2).',
						body: '',
						revert: null,
						merge: null,
						footer: null,
						notes: [],
						rawType: 'Fix',
						files: [],
						mentions: [],
						scope: null,
						isPublicCommit: true,
						repositoryUrl: 'https://github.com/ckeditor/ckeditor5-dev'
					} );

					expect( commits[ 2 ] ).to.deep.equal( {
						hash: '76b9e058fb1c3fa00b50059cdc684997d0eb2eca',
						header: 'Other: Simple other change (3).',
						type: 'Other changes',
						subject: 'Simple other change (3).',
						body: '',
						revert: null,
						merge: null,
						footer: null,
						notes: [],
						rawType: 'Other',
						files: [],
						mentions: [],
						scope: null,
						isPublicCommit: true,
						repositoryUrl: 'https://github.com/ckeditor/ckeditor5-dev'
					} );
				} );

				it( 'preserves the description of the first commit', () => {
					const rawCommit = {
						hash: '76b9e058fb1c3fa00b50059cdc684997d0eb2eca',
						header: 'Feature: Simple feature (1).',
						type: 'Feature',
						subject: 'Simple feature (1).',
						body: [
							'Lorem ipsum.',
							'',
							'Fix: Simple fix (2).',
							'',
							'Second lorem ipsum.',
							'',
							'Other: Other simple change (3).'
						].join( '\n' ),
						footer: null,
						notes: []
					};

					const commits = transformCommit( rawCommit );

					expect( commits ).to.be.an( 'Array' );
					expect( commits.length ).to.equal( 3 );

					expect( commits[ 0 ] ).to.deep.equal( {
						hash: '76b9e058fb1c3fa00b50059cdc684997d0eb2eca',
						header: 'Feature: Simple feature (1).',
						type: 'Features',
						subject: 'Simple feature (1).',
						body: '  Lorem ipsum.',
						footer: null,
						notes: [],
						rawType: 'Feature',
						files: [],
						scope: null,
						isPublicCommit: true,
						repositoryUrl: 'https://github.com/ckeditor/ckeditor5-dev'
					} );

					expect( commits[ 1 ] ).to.deep.equal( {
						hash: '76b9e058fb1c3fa00b50059cdc684997d0eb2eca',
						header: 'Fix: Simple fix (2).',
						type: 'Bug fixes',
						subject: 'Simple fix (2).',
						body: '  Second lorem ipsum.',
						revert: null,
						merge: null,
						footer: null,
						notes: [],
						rawType: 'Fix',
						files: [],
						mentions: [],
						scope: null,
						isPublicCommit: true,
						repositoryUrl: 'https://github.com/ckeditor/ckeditor5-dev'
					} );

					expect( commits[ 2 ] ).to.deep.equal( {
						hash: '76b9e058fb1c3fa00b50059cdc684997d0eb2eca',
						header: 'Other: Other simple change (3).',
						type: 'Other changes',
						subject: 'Other simple change (3).',
						body: '',
						revert: null,
						merge: null,
						footer: null,
						notes: [],
						rawType: 'Other',
						files: [],
						mentions: [],
						scope: null,
						isPublicCommit: true,
						repositoryUrl: 'https://github.com/ckeditor/ckeditor5-dev'
					} );
				} );

				it( 'adds a dot at the subject if missing in new commit', () => {
					const rawCommit = {
						hash: '76b9e058fb1c3fa00b50059cdc684997d0eb2eca',
						header: 'Feature: Simple feature (1).',
						type: 'Feature',
						subject: 'Simple feature (1).',
						body: [
							'Fix: Simple fix (2)'
						].join( '\n' ),
						footer: null,
						notes: []
					};

					const commits = transformCommit( rawCommit );

					expect( commits ).to.be.an( 'Array' );
					expect( commits.length ).to.equal( 2 );

					expect( commits[ 1 ].subject ).to.equal( 'Simple fix (2).' );
				} );

				it( 'copies an array with changed files across all commits', () => {
					const files = [ 'a', 'b', 'c' ];

					stubs.getChangedFilesForCommit.returns( files );

					const rawCommit = {
						hash: '76b9e058fb1c3fa00b50059cdc684997d0eb2eca',
						header: 'Feature: Simple feature (1).',
						type: 'Feature',
						subject: 'Simple feature (1).',
						body: [
							'Fix: Simple fix (2)',
							'',
							'Other: Simple other change (3).'
						].join( '\n' ),
						footer: null,
						notes: []
					};

					const commits = transformCommit( rawCommit );

					expect( commits[ 0 ].files ).to.equal( files );
					expect( commits[ 1 ].files ).to.equal( files );
					expect( commits[ 2 ].files ).to.equal( files );
				} );

				it( 'works with non-public commits', () => {
					const rawCommit = {
						hash: '76b9e058fb1c3fa00b50059cdc684997d0eb2eca',
						header: 'Feature: Simple feature (1).',
						type: 'Feature',
						subject: 'Simple feature (1).',
						body: [
							'Docs: Simple docs change (2)',
							'',
							'Internal: Simple internal change (3).'
						].join( '\n' ),
						footer: null,
						notes: []
					};

					const commits = transformCommit( rawCommit );

					expect( commits ).to.be.an( 'Array' );
					expect( commits.length ).to.equal( 3 );

					expect( commits[ 0 ].isPublicCommit ).to.equal( true );
					expect( commits[ 1 ].isPublicCommit ).to.equal( false );
					expect( commits[ 2 ].isPublicCommit ).to.equal( false );
				} );

				it( 'handles scoped and non-scoped changes', () => {
					const rawCommit = {
						hash: '76b9e058fb1c3fa00b50059cdc684997d0eb2eca',
						header: 'Feature: Simple feature (1).',
						type: 'Feature',
						subject: 'Simple feature (1).',
						body: [
							'Fix (foo): Simple fix (2).',
							'',
							'Other: Simple other change (3).',
							'',
							'Feature (foo, bar): Simple other change (4).'
						].join( '\n' ),
						footer: null,
						notes: []
					};

					const commits = transformCommit( rawCommit );

					expect( commits ).to.be.an( 'Array' );
					expect( commits.length ).to.equal( 4 );

					expect( commits[ 0 ].scope ).to.equal( null );
					expect( commits[ 1 ].scope ).to.deep.equal( [ 'foo' ] );
					expect( commits[ 2 ].scope ).to.equal( null );
					expect( commits[ 3 ].scope ).to.deep.equal( [ 'bar', 'foo' ] );
				} );
			} );
		} );
	} );
} );
