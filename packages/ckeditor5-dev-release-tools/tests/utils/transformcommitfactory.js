/**
 * @license Copyright (c) 2003-2023, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const expect = require( 'chai' ).expect;
const sinon = require( 'sinon' );
const mockery = require( 'mockery' );

describe( 'dev-release-tools/utils', () => {
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

			transformCommitFactory = require( '../../lib/utils/transformcommitfactory' );
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

			// See: https://github.com/ckeditor/ckeditor5/issues/7495.
			it( 'removes duplicated scoped notes from the footer', () => {
				const rawCommit = {
					type: 'Other (table)',
					subject: 'Extracted `TableMouse` plugin from `TableSelection` plugin. Closes #6757.',
					merge: 'Merge pull request #7355 from ckeditor/i/6757',
					header: 'Other (table): Extracted `TableMouse` plugin from `TableSelection` plugin. Closes #6757.',
					body: null,
					footer: 'MINOR BREAKING CHANGE (table): The `TableNavigation` plugin renamed to `TableKeyboard`.',
					notes: [
						{
							title: 'MINOR BREAKING CHANGE',
							text: '(table): The `TableNavigation` plugin renamed to `TableKeyboard`.'
						}
					],
					references: [],
					mentions: [],
					revert: null,
					hash: '4d2f5f9b9f298601b332f304da66333c52673cb8'
				};

				const commit = transformCommit( rawCommit );

				expect( commit.footer ).to.equal( null );
			} );

			// See: https://github.com/ckeditor/ckeditor5/issues/7489.
			describe( 'internal merge commits', () => {
				const mergeCommitsToIgnore = [
					'Merge branch \'stable\'',
					'Merge branch \'master\'',
					'Merge branch \'release\'',
					'Merge \'stable\' into \'master\'',
					'Merge \'master\' into \'release\'',
					'Merge \'release\' into \'stable\'',
					'Merge branch \'stable\' into \'master\'',
					'Merge branch \'master\' into \'release\'',
					'Merge branch \'release\' into \'stable\'',
					'Merge branch \'stable\' into master',
					'Merge branch \'master\' into release',
					'Merge branch \'release\' into stable',
					'Merge branch stable into \'master\'',
					'Merge branch master into \'release\'',
					'Merge branch release into \'stable\'',
					'Merge branch stable into master',
					'Merge branch master into release',
					'Merge branch release into stable',
					'Merge remote-tracking branch \'origin/master\' into i/6788-feature-branch',
					'Merge branch \'master\' into i/6788-feature-branch',
					'Merge branch master into i/6788-feature-branch'
				];

				const validMergeCommits = [
					'Merge pull request #7485 from ckeditor/i/6788-feature-branch',
					'Merge branch \'i/6788-feature-branch\'',
					'Merge branch i/6788-feature-branch'
				];

				for ( const commitTitle of mergeCommitsToIgnore ) {
					it( `ignores a commit: "${ commitTitle }"`, () => {
						const rawCommit = {
							merge: commitTitle,
							header: '-hash-',
							body: '575e00bc8ece48826adefe226c4fb1fe071c73a7',
							notes: []
						};

						expect( transformCommit( rawCommit ) ).to.equal( undefined );
					} );
				}

				for ( const commitTitle of validMergeCommits ) {
					it( `does not ignore a commit: "${ commitTitle }"`, () => {
						const rawCommit = {
							merge: commitTitle,
							header: '-hash-',
							body: '575e00bc8ece48826adefe226c4fb1fe071c73a7',
							notes: []
						};

						expect( transformCommit( rawCommit ) ).to.not.equal( undefined );
					} );
				}
			} );

			describe( '"Closes" references - merging into single entry', () => {
				it( 'works for #id pattern', () => {
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

				it( 'works for org/repo#id pattern', () => {
					const rawCommit = {
						hash: '684997d0eb2eca76b9e058fb1c3fa00b50059cdc',
						header: 'Fix: Simple fix. Closes ckeditor/ckeditor5#1. Closes ckeditor/ckeditor5#2. Closes ckeditor/ckeditor5#3.',
						type: 'Fix',
						subject: 'Simple fix. Closes ckeditor/ckeditor5#1. Closes ckeditor/ckeditor5#2. Closes ckeditor/ckeditor5#3.',
						body: null,
						footer: null,
						notes: []
					};

					const commit = transformCommit( rawCommit );

					const expectedSubject = 'Simple fix. Closes ' +
						'[ckeditor/ckeditor5#1](https://github.com/ckeditor/ckeditor5/issues/1), ' +
						'[ckeditor/ckeditor5#2](https://github.com/ckeditor/ckeditor5/issues/2), ' +
						'[ckeditor/ckeditor5#3](https://github.com/ckeditor/ckeditor5/issues/3).';

					expect( commit.subject ).to.equal( expectedSubject );
				} );

				it( 'works for mixed #id and org/repo#id patterns, starting with #id', () => {
					const rawCommit = {
						hash: '684997d0eb2eca76b9e058fb1c3fa00b50059cdc',
						header: 'Fix: Simple fix. Closes #1. Closes #2. Closes ckeditor/ckeditor5#3.',
						type: 'Fix',
						subject: 'Simple fix. Closes #1. Closes #2. Closes ckeditor/ckeditor5#3.',
						body: null,
						footer: null,
						notes: []
					};

					const commit = transformCommit( rawCommit );

					const expectedSubject = 'Simple fix. Closes ' +
						'[#1](https://github.com/ckeditor/ckeditor5-dev/issues/1), ' +
						'[#2](https://github.com/ckeditor/ckeditor5-dev/issues/2), ' +
						'[ckeditor/ckeditor5#3](https://github.com/ckeditor/ckeditor5/issues/3).';

					expect( commit.subject ).to.equal( expectedSubject );
				} );

				it( 'works for mixed #id and org/repo#id patterns, starting with org/repo#id', () => {
					const rawCommit = {
						hash: '684997d0eb2eca76b9e058fb1c3fa00b50059cdc',
						header: 'Fix: Simple fix. Closes ckeditor/ckeditor5#1. Closes ckeditor/ckeditor5#2. Closes #3.',
						type: 'Fix',
						subject: 'Simple fix. Closes ckeditor/ckeditor5#1. Closes ckeditor/ckeditor5#2. Closes #3.',
						body: null,
						footer: null,
						notes: []
					};

					const commit = transformCommit( rawCommit );

					const expectedSubject = 'Simple fix. Closes ' +
						'[ckeditor/ckeditor5#1](https://github.com/ckeditor/ckeditor5/issues/1), ' +
						'[ckeditor/ckeditor5#2](https://github.com/ckeditor/ckeditor5/issues/2), ' +
						'[#3](https://github.com/ckeditor/ckeditor5-dev/issues/3).';

					expect( commit.subject ).to.equal( expectedSubject );
				} );

				it( 'does no touch the "See #" references.', () => {
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

				it( 'does not replace paths with hash as github issue', () => {
					const rawCommit = {
						hash: '684997d0eb2eca76b9e058fb1c3fa00b50059cdc',
						header: 'Fix: Simple fix. Closes i/am/path5#1.',
						type: 'Fix',
						subject: 'Fix: Simple fix. Closes i/am/path5#1.',
						body: null,
						footer: null,
						notes: []
					};

					const commit = transformCommit( rawCommit );

					expect( commit.subject ).to.equal( 'Fix: Simple fix. Closes i/am/path5#1.' );
				} );
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

					expect( commit ).to.be.an( 'Array' );
					expect( commit.length ).to.equal( 2 );

					expect( commit[ 0 ].scope ).to.be.an( 'Array' );
					expect( commit[ 0 ].scope.length ).to.equal( 1 );
					expect( commit[ 0 ].scope[ 0 ] ).to.equal( 'bar' );
					expect( commit[ 0 ].rawType ).to.equal( 'Feature' );

					expect( commit[ 1 ].scope ).to.be.an( 'Array' );
					expect( commit[ 1 ].scope.length ).to.equal( 1 );
					expect( commit[ 1 ].scope[ 0 ] ).to.equal( 'foo' );
					expect( commit[ 1 ].rawType ).to.equal( 'Feature' );
				} );

				it( 'works with multi-scoped merge commit', () => {
					const rawCommit = {
						hash: '76b9e058fb1c3fa00b50059cdc684997d0eb2eca',
						header: 'Feature (foo, bar): Simple fix.',
						type: 'Feature (foo, bar)',
						subject: 'Simple fix.',
						merge: 'Merge pull request #7355 from ckeditor/i/6757',
						body: null,
						footer: null,
						notes: []
					};

					const commit = transformCommit( rawCommit );

					expect( commit ).to.be.an( 'Array' );
					expect( commit.length ).to.equal( 2 );

					expect( commit[ 0 ].scope ).to.be.an( 'Array' );
					expect( commit[ 0 ].scope.length ).to.equal( 1 );
					expect( commit[ 0 ].scope[ 0 ] ).to.equal( 'bar' );
					expect( commit[ 0 ].rawType ).to.equal( 'Feature' );

					expect( commit[ 1 ].scope ).to.be.an( 'Array' );
					expect( commit[ 1 ].scope.length ).to.equal( 1 );
					expect( commit[ 1 ].scope[ 0 ] ).to.equal( 'foo' );
					expect( commit[ 1 ].rawType ).to.equal( 'Feature' );
				} );

				it( 'clones the commit properties for multi-scoped changes', () => {
					const rawCommit = {
						hash: '76b9e058fb1c3fa00b50059cdc684997d0eb2eca',
						header: 'Feature (foo, bar): Simple fix.',
						type: 'Feature (foo, bar)',
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

					expect( commit ).to.be.an( 'Array' );
					expect( commit.length ).to.equal( 2 );

					expect( commit[ 0 ].scope ).to.be.an( 'Array' );
					expect( commit[ 1 ].scope ).to.be.an( 'Array' );
					expect( commit[ 0 ].scope ).to.not.equal( commit[ 1 ].scope );

					expect( commit[ 0 ].files ).to.be.an( 'Array' );
					expect( commit[ 1 ].files ).to.be.an( 'Array' );
					expect( commit[ 0 ].files ).to.not.equal( commit[ 1 ].files );

					expect( commit[ 0 ].notes ).to.be.an( 'Array' );
					expect( commit[ 1 ].notes ).to.be.an( 'Array' );
					expect( commit[ 0 ].notes ).to.not.equal( commit[ 1 ].notes );

					expect( commit[ 0 ].notes[ 0 ].scope ).to.be.an( 'Array' );
					expect( commit[ 0 ].notes[ 0 ].scope[ 0 ] ).to.equal( 'package' );
					expect( commit[ 1 ].notes ).to.be.an( 'Array' );
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

				it( 'does not copy notes when processing multi-scoped commit (single entry)', () => {
					const rawCommit = {
						hash: '76b9e058fb1c3fa00b50059cdc684997d0eb2eca',
						header: 'Fix (scope1, scope2): Simple feature Closes #1.',
						type: 'Fix (scope1, scope2)',
						subject: 'Simple feature Closes #1.',
						body: '',
						footer: null,
						notes: [
							{ title: 'BREAKING CHANGE', text: 'Note 1.' },
							{ title: 'MAJOR BREAKING CHANGES', text: 'Note 2.' }
						]
					};

					const commit = transformCommit( rawCommit );

					expect( commit.length ).to.equal( 2 );

					expect( commit[ 0 ].scope ).to.be.an( 'Array' );
					expect( commit[ 0 ].scope.length ).to.equal( 1 );
					expect( commit[ 0 ].scope[ 0 ] ).to.equal( 'scope1' );
					expect( commit[ 0 ].rawType ).to.equal( 'Fix' );
					expect( commit[ 0 ].notes ).to.be.an( 'Array' );
					expect( commit[ 0 ].notes.length ).to.equal( 2 );
					expect( commit[ 0 ].notes[ 0 ].scope ).to.equal( null );
					expect( commit[ 0 ].notes[ 1 ].scope ).to.equal( null );

					expect( commit[ 1 ].scope ).to.be.an( 'Array' );
					expect( commit[ 1 ].scope.length ).to.equal( 1 );
					expect( commit[ 1 ].scope[ 0 ] ).to.equal( 'scope2' );
					expect( commit[ 1 ].rawType ).to.equal( 'Fix' );
					expect( commit[ 1 ].notes ).to.be.an( 'Array' );
					expect( commit[ 1 ].notes.length ).to.equal( 0 );
				} );

				it( 'does not copy notes when processing multi-scoped commit (multi entries)', () => {
					const rawCommit = {
						hash: '76b9e058fb1c3fa00b50059cdc684997d0eb2eca',
						header: 'Fix (scope1, scope2): Simple feature Closes #1.',
						type: 'Fix (scope1, scope2)',
						subject: 'Simple feature Closes #1.',
						body: [
							'Other (scope3, scope4): Simple other change. Closes ckeditor/ckeditor5#3. Closes #3.'
						].join( '\n' ),
						footer: null,
						notes: [
							{ title: 'BREAKING CHANGE', text: 'Note 1.' },
							{ title: 'MAJOR BREAKING CHANGES', text: 'Note 2.' }
						]
					};

					const commit = transformCommit( rawCommit );

					expect( commit.length ).to.equal( 4 );

					expect( commit[ 0 ].scope ).to.be.an( 'Array' );
					expect( commit[ 0 ].scope.length ).to.equal( 1 );
					expect( commit[ 0 ].scope[ 0 ] ).to.equal( 'scope1' );
					expect( commit[ 0 ].rawType ).to.equal( 'Fix' );
					expect( commit[ 0 ].notes ).to.be.an( 'Array' );
					expect( commit[ 0 ].notes.length ).to.equal( 2 );

					expect( commit[ 1 ].scope ).to.be.an( 'Array' );
					expect( commit[ 1 ].scope.length ).to.equal( 1 );
					expect( commit[ 1 ].scope[ 0 ] ).to.equal( 'scope2' );
					expect( commit[ 1 ].rawType ).to.equal( 'Fix' );
					expect( commit[ 1 ].notes ).to.be.an( 'Array' );
					expect( commit[ 1 ].notes.length ).to.equal( 0 );

					expect( commit[ 2 ].scope ).to.be.an( 'Array' );
					expect( commit[ 2 ].scope.length ).to.equal( 1 );
					expect( commit[ 2 ].scope[ 0 ] ).to.equal( 'scope3' );
					expect( commit[ 2 ].rawType ).to.equal( 'Other' );
					expect( commit[ 2 ].notes ).to.be.an( 'Array' );
					expect( commit[ 2 ].notes.length ).to.equal( 0 );

					expect( commit[ 3 ].scope ).to.be.an( 'Array' );
					expect( commit[ 3 ].scope.length ).to.equal( 1 );
					expect( commit[ 3 ].scope[ 0 ] ).to.equal( 'scope4' );
					expect( commit[ 3 ].rawType ).to.equal( 'Other' );
					expect( commit[ 3 ].notes ).to.be.an( 'Array' );
					expect( commit[ 3 ].notes.length ).to.equal( 0 );
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
							'Lorem ipsum. #1',
							'',
							'Fix: Simple fix (2).',
							'',
							'Second lorem ipsum. #2',
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
						body: '  Lorem ipsum. [#1](https://github.com/ckeditor/ckeditor5-dev/issues/1)',
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
						body: '  Second lorem ipsum. [#2](https://github.com/ckeditor/ckeditor5-dev/issues/2)',
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
					expect( commits.length ).to.equal( 5 );

					expect( commits[ 0 ].scope ).to.equal( null );
					expect( commits[ 1 ].scope ).to.deep.equal( [ 'foo' ] );
					expect( commits[ 2 ].scope ).to.equal( null );
					expect( commits[ 3 ].scope ).to.deep.equal( [ 'bar' ] );
					expect( commits[ 4 ].scope ).to.deep.equal( [ 'foo' ] );
				} );

				it( 'merges "Closes" references in multi-entries commit', () => {
					const rawCommit = {
						hash: '76b9e058fb1c3fa00b50059cdc684997d0eb2eca',
						header: 'Feature: Simple feature Closes #1.',
						type: 'Feature',
						subject: 'Simple feature Closes #1.',
						body: [
							'Fix: Simple fix. Closes #2. Closes ckeditor/ckeditor5#2. See ckeditor/ckeditor5#1000.',
							'',
							'Other: Simple other change. Closes ckeditor/ckeditor5#3. Closes #3.'
						].join( '\n' ),
						footer: null,
						notes: []
					};

					const commits = transformCommit( rawCommit );

					expect( commits ).to.be.an( 'Array' );
					expect( commits.length ).to.equal( 3 );

					expect( commits[ 0 ] ).to.deep.equal( {
						hash: '76b9e058fb1c3fa00b50059cdc684997d0eb2eca',
						header: 'Feature: Simple feature Closes #1.',
						type: 'Features',
						subject: 'Simple feature Closes [#1](https://github.com/ckeditor/ckeditor5-dev/issues/1).',
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
						header: 'Fix: Simple fix. Closes #2. Closes ckeditor/ckeditor5#2. See ckeditor/ckeditor5#1000.',
						type: 'Bug fixes',
						subject: 'Simple fix. Closes [#2](https://github.com/ckeditor/ckeditor5-dev/issues/2), ' +
							'[ckeditor/ckeditor5#2](https://github.com/ckeditor/ckeditor5/issues/2). ' +
							'See [ckeditor/ckeditor5#1000](https://github.com/ckeditor/ckeditor5/issues/1000).',
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
						header: 'Other: Simple other change. Closes ckeditor/ckeditor5#3. Closes #3.',
						type: 'Other changes',
						subject: 'Simple other change. Closes [ckeditor/ckeditor5#3](https://github.com/ckeditor/ckeditor5/issues/3), ' +
							'[#3](https://github.com/ckeditor/ckeditor5-dev/issues/3).',
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
			} );

			describe( 'squash merge commit', () => {
				it( 'removes the squash commit part from results', () => {
					const rawCommit = {
						type: null,
						subject: null,
						merge: null,
						header: 'A squash pull request change (#111)',
						body: 'Fix (scope-1): Description 1.\n' +
							'\n' +
							'Other (scope-2): Description 2.\n' +
							'\n' +
							'Internal (scope-3): Description 3.',
						footer: '',
						notes: [],
						references: [],
						mentions: [],
						revert: null,
						hash: 'bb24d87e46a9f4675eabfa97e247ee7f58debeee'
					};

					const commits = transformCommit( rawCommit );

					expect( commits ).to.be.an( 'Array' );
					expect( commits ).to.lengthOf( 3 );

					expect( commits[ 0 ] ).to.deep.equal( {
						revert: null,
						merge: 'A squash pull request change (#111)',
						footer: null,
						hash: 'bb24d87e46a9f4675eabfa97e247ee7f58debeee',
						files: [],
						repositoryUrl: 'https://github.com/ckeditor/ckeditor5-dev',
						notes: [],
						mentions: [],
						rawType: 'Fix',
						scope: [ 'scope-1' ],
						isPublicCommit: true,
						type: 'Bug fixes',
						header: 'Fix (scope-1): Description 1.',
						subject: 'Description 1.',
						body: ''
					} );

					expect( commits[ 1 ] ).to.deep.equal( {
						revert: null,
						merge: null,
						footer: null,
						hash: 'bb24d87e46a9f4675eabfa97e247ee7f58debeee',
						files: [],
						repositoryUrl: 'https://github.com/ckeditor/ckeditor5-dev',
						notes: [],
						mentions: [],
						rawType: 'Other',
						scope: [ 'scope-2' ],
						isPublicCommit: true,
						type: 'Other changes',
						header: 'Other (scope-2): Description 2.',
						subject: 'Description 2.',
						body: ''
					} );

					expect( commits[ 2 ] ).to.deep.equal( {
						revert: null,
						merge: null,
						footer: null,
						hash: 'bb24d87e46a9f4675eabfa97e247ee7f58debeee',
						files: [],
						repositoryUrl: 'https://github.com/ckeditor/ckeditor5-dev',
						notes: [],
						mentions: [],
						rawType: 'Internal',
						scope: [ 'scope-3' ],
						isPublicCommit: false,
						header: 'Internal (scope-3): Description 3.',
						subject: 'Description 3.',
						body: ''
					} );
				} );

				it( 'processes breaking change notes from the removed squash commit', () => {
					const rawCommit = {
						type: null,
						subject: null,
						merge: null,
						header: 'A squash pull request change (#111)',
						body: 'Fix (scope-1): Description 1.\n' +
							'\n' +
							'Other (scope-2): Description 2.\n' +
							'\n' +
							'Internal (scope-3): Description 3.',
						footer: 'MINOR BREAKING CHANGE (scope-1): BC 1.\n' +
							'\n' +
							'MINOR BREAKING CHANGE (scope-2): BC 2.',
						notes: [
							{
								title: 'MINOR BREAKING CHANGE',
								text: '(scope-1): BC 1.'
							},
							{
								title: 'MINOR BREAKING CHANGE',
								text: '(scope-2): BC 2.'
							}
						],
						references: [],
						mentions: [],
						revert: null,
						hash: 'bb24d87e46a9f4675eabfa97e247ee7f58debeee'
					};

					const commits = transformCommit( rawCommit );

					expect( commits ).to.be.an( 'Array' );
					expect( commits ).to.lengthOf( 3 );

					expect( commits[ 0 ] ).to.deep.equal( {
						revert: null,
						merge: 'A squash pull request change (#111)',
						footer: null,
						hash: 'bb24d87e46a9f4675eabfa97e247ee7f58debeee',
						files: [],
						repositoryUrl: 'https://github.com/ckeditor/ckeditor5-dev',
						notes: [
							{
								scope: [
									'scope-1'
								],
								text: 'BC 1.',
								title: 'BREAKING CHANGES'
							},
							{
								scope: [
									'scope-2'
								],
								text: 'BC 2.',
								title: 'BREAKING CHANGES'
							}
						],
						mentions: [],
						rawType: 'Fix',
						scope: [ 'scope-1' ],
						isPublicCommit: true,
						type: 'Bug fixes',
						header: 'Fix (scope-1): Description 1.',
						subject: 'Description 1.',
						body: ''
					} );
					expect( commits[ 1 ].notes ).to.deep.equal( [] );
					expect( commits[ 2 ].notes ).to.deep.equal( [] );
				} );

				it( 'does not remove the squash commit if all changes are marked as internal', () => {
					const rawCommit = {
						type: null,
						subject: null,
						merge: null,
						header: 'A squash pull request change (#111)',
						body: 'Internal (scope-1): Description 1.\n' +
							'\n' +
							'Internal (scope-2): Description 2.\n' +
							'\n' +
							'Internal (scope-3): Description 3.',
						footer: 'MINOR BREAKING CHANGE (scope-1): BC 1.\n' +
							'\n' +
							'MINOR BREAKING CHANGE (scope-2): BC 2.',
						notes: [
							{
								title: 'MINOR BREAKING CHANGE',
								text: '(scope-1): BC 1.'
							},
							{
								title: 'MINOR BREAKING CHANGE',
								text: '(scope-2): BC 2.'
							}
						],
						references: [],
						mentions: [],
						revert: null,
						hash: 'bb24d87e46a9f4675eabfa97e247ee7f58debeee'
					};

					const commits = transformCommit( rawCommit );

					expect( commits ).to.be.an( 'Array' );
					expect( commits ).to.lengthOf( 4 );

					expect( commits[ 0 ] ).to.deep.equal( {
						type: null,
						subject: null,
						merge: null,
						header: 'A squash pull request change (#111)',
						body: '',
						footer: 'MINOR BREAKING CHANGE (scope-1): BC 1.\n' +
							'\n' +
							'MINOR BREAKING CHANGE (scope-2): BC 2.',
						notes: [
							{
								text: '(scope-1): BC 1.',
								title: 'MINOR BREAKING CHANGE'
							},
							{
								text: '(scope-2): BC 2.',
								title: 'MINOR BREAKING CHANGE'
							}
						],
						references: [],
						mentions: [],
						revert: null,
						hash: 'bb24d87e46a9f4675eabfa97e247ee7f58debeee',
						rawType: undefined,
						files: [],
						scope: undefined,
						isPublicCommit: false,
						repositoryUrl: 'https://github.com/ckeditor/ckeditor5-dev'
					} );
					expect( commits[ 1 ] ).to.deep.equal( {
						revert: null,
						merge: null,
						footer: null,
						hash: 'bb24d87e46a9f4675eabfa97e247ee7f58debeee',
						files: [],
						repositoryUrl: 'https://github.com/ckeditor/ckeditor5-dev',
						notes: [],
						mentions: [],
						rawType: 'Internal',
						scope: [ 'scope-1' ],
						isPublicCommit: false,
						header: 'Internal (scope-1): Description 1.',
						subject: 'Description 1.',
						body: ''
					} );
					expect( commits[ 2 ] ).to.deep.equal( {
						revert: null,
						merge: null,
						footer: null,
						hash: 'bb24d87e46a9f4675eabfa97e247ee7f58debeee',
						files: [],
						repositoryUrl: 'https://github.com/ckeditor/ckeditor5-dev',
						notes: [],
						mentions: [],
						rawType: 'Internal',
						scope: [ 'scope-2' ],
						isPublicCommit: false,
						header: 'Internal (scope-2): Description 2.',
						subject: 'Description 2.',
						body: ''
					} );
					expect( commits[ 3 ] ).to.deep.equal( {
						revert: null,
						merge: null,
						footer: null,
						hash: 'bb24d87e46a9f4675eabfa97e247ee7f58debeee',
						files: [],
						repositoryUrl: 'https://github.com/ckeditor/ckeditor5-dev',
						notes: [],
						mentions: [],
						rawType: 'Internal',
						scope: [ 'scope-3' ],
						isPublicCommit: false,
						header: 'Internal (scope-3): Description 3.',
						subject: 'Description 3.',
						body: ''
					} );
				} );

				it( 'processes a title including various non-letter symbols', () => {
					const rawCommit = {
						type: null,
						subject: null,
						merge: null,
						header: 'A squash pull (#12) request change! (#111)',
						body: 'Just details.',
						footer: '',
						notes: [],
						references: [],
						mentions: [],
						revert: null,
						hash: 'bb24d87e46a9f4675eabfa97e247ee7f58debeee'
					};

					const commits = transformCommit( rawCommit );

					expect( commits ).to.be.an( 'Array' );
					expect( commits ).to.lengthOf( 4 );

					expect( commits[ 0 ] ).to.deep.equal( {
						type: null,
						subject: null,
						merge: null,
						header: 'A squash pull (#12) request change! (#111)',
						body: '',
						footer: '',
						notes: [],
						references: [],
						mentions: [],
						revert: null,
						hash: 'bb24d87e46a9f4675eabfa97e247ee7f58debeee',
						rawType: undefined,
						files: [],
						scope: undefined,
						isPublicCommit: false,
						repositoryUrl: 'https://github.com/ckeditor/ckeditor5-dev'
					} );
				} );
			} );
		} );
	} );
} );
