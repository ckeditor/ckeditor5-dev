/**
 * @license Copyright (c) 2003-2021, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const expect = require( 'chai' ).expect;
const compareFunc = require( 'compare-func' );
const getWriterOptions = require( '../../../lib/release-tools/utils/getwriteroptions' );
const generateChangelog = require( '../../../lib/release-tools/utils/generatechangelog' );

describe( 'dev-env/release-tools/utils', () => {
	const url = 'https://github.com/ckeditor/ckeditor5-package';

	/**
	 * Type of commits must be equal to values returned by `transformcommitutils.getCommitType()` function.
	 * Since we're creating all commits manually, we need to "transform" those to proper structures.
	 */
	describe( 'generateChangelog()', () => {
		describe( 'initial changelog (without "previousTag")', () => {
			it( 'generates "Features" correctly', () => {
				const commits = [
					{
						type: 'Features',
						header: 'Feature: The first an amazing feature.',
						subject: 'The first an amazing feature.',
						hash: 'x'.repeat( 40 ),
						notes: []
					},
					{
						type: 'Features',
						header: 'Feature: The second an amazing feature.',
						subject: 'The second an amazing feature.',
						hash: 'z'.repeat( 40 ),
						notes: []
					}
				];

				const context = {
					version: '1.0.0',
					repoUrl: url,
					currentTag: 'v1.0.0',
					commit: 'commit'
				};

				const options = getWriterOptions( {
					hash: hash => hash.slice( 0, 7 )
				} );

				return generateChangelog( commits, context, options )
					.then( changes => {
						changes = replaceDates( changes );

						const changesAsArray = changes.split( '\n' )
							.map( line => line.trim() )
							.filter( line => line.length );

						expect( changesAsArray[ 0 ] ).to.equal(
							'## [1.0.0](https://github.com/ckeditor/ckeditor5-package/tree/v1.0.0) (0000-00-00)'
						);
						expect( changesAsArray[ 1 ] ).to.equal(
							'### Features'
						);
						expect( changesAsArray[ 2 ] ).to.equal(
							'* The first an amazing feature. ([commit](https://github.com/ckeditor/ckeditor5-package/commit/xxxxxxx))'
						);
						expect( changesAsArray[ 3 ] ).to.equal(
							'* The second an amazing feature. ([commit](https://github.com/ckeditor/ckeditor5-package/commit/zzzzzzz))'
						);
					} );
			} );

			it( 'generates "Bug fixes" correctly', () => {
				const commits = [
					{
						type: 'Bug fixes',
						header: 'Fix: The first an amazing bug fix.',
						subject: 'The first an amazing bug fix.',
						hash: 'x'.repeat( 40 ),
						notes: []
					},
					{
						type: 'Bug fixes',
						header: 'Fix: The second an amazing bug fix.',
						subject: 'The second an amazing bug fix.',
						hash: 'z'.repeat( 40 ),
						notes: []
					}
				];

				const context = {
					version: '1.0.0',
					repoUrl: url,
					currentTag: 'v1.0.0',
					commit: 'commit'
				};

				const options = getWriterOptions( {
					hash: hash => hash.slice( 0, 7 )
				} );

				return generateChangelog( commits, context, options )
					.then( changes => {
						changes = replaceDates( changes );

						const changesAsArray = changes.split( '\n' )
							.map( line => line.trim() )
							.filter( line => line.length );

						expect( changesAsArray[ 0 ] ).to.equal(
							'## [1.0.0](https://github.com/ckeditor/ckeditor5-package/tree/v1.0.0) (0000-00-00)'
						);
						expect( changesAsArray[ 1 ] ).to.equal(
							'### Bug fixes'
						);
						expect( changesAsArray[ 2 ] ).to.equal(
							'* The first an amazing bug fix. ([commit](https://github.com/ckeditor/ckeditor5-package/commit/xxxxxxx))'
						);
						expect( changesAsArray[ 3 ] ).to.equal(
							'* The second an amazing bug fix. ([commit](https://github.com/ckeditor/ckeditor5-package/commit/zzzzzzz))'
						);
					} );
			} );

			it( 'generates "Other changes" correctly', () => {
				const commits = [
					{
						type: 'Other changes',
						header: 'Other: The first an amazing commit.',
						subject: 'The first an amazing commit.',
						hash: 'x'.repeat( 40 ),
						notes: []
					},
					{
						type: 'Other changes',
						header: 'Other: The second an amazing commit.',
						subject: 'The second an amazing commit.',
						hash: 'z'.repeat( 40 ),
						notes: []
					}
				];

				const context = {
					version: '1.0.0',
					repoUrl: url,
					currentTag: 'v1.0.0',
					commit: 'commit'
				};

				const options = getWriterOptions( {
					hash: hash => hash.slice( 0, 7 )
				} );

				return generateChangelog( commits, context, options )
					.then( changes => {
						changes = replaceDates( changes );

						const changesAsArray = changes.split( '\n' )
							.map( line => line.trim() )
							.filter( line => line.length );

						expect( changesAsArray[ 0 ] ).to.equal(
							'## [1.0.0](https://github.com/ckeditor/ckeditor5-package/tree/v1.0.0) (0000-00-00)'
						);
						expect( changesAsArray[ 1 ] ).to.equal(
							'### Other changes'
						);
						expect( changesAsArray[ 2 ] ).to.equal(
							'* The first an amazing commit. ([commit](https://github.com/ckeditor/ckeditor5-package/commit/xxxxxxx))'
						);
						expect( changesAsArray[ 3 ] ).to.equal(
							'* The second an amazing commit. ([commit](https://github.com/ckeditor/ckeditor5-package/commit/zzzzzzz))'
						);
					} );
			} );

			it( 'generates all groups correctly', () => {
				const commits = [
					{
						type: 'Features',
						header: 'Feature: An amazing feature.',
						subject: 'An amazing feature.',
						hash: 'x'.repeat( 40 ),
						notes: []
					},
					{
						type: 'Bug fixes',
						header: 'Fix: An amazing bug fix.',
						subject: 'An amazing bug fix.',
						hash: 'z'.repeat( 40 ),
						notes: []
					},
					{
						type: 'Other changes',
						header: 'Other: An amazing commit.',
						subject: 'An amazing commit.',
						hash: 'y'.repeat( 40 ),
						notes: []
					}
				];

				const context = {
					version: '1.0.0',
					repoUrl: url,
					currentTag: 'v1.0.0',
					commit: 'commit'
				};

				const options = getWriterOptions( {
					hash: hash => hash.slice( 0, 7 )
				} );

				return generateChangelog( commits, context, options )
					.then( changes => {
						changes = replaceDates( changes );

						const changesAsArray = changes.split( '\n' )
							.map( line => line.trim() )
							.filter( line => line.length );

						expect( changesAsArray[ 0 ] ).to.equal(
							'## [1.0.0](https://github.com/ckeditor/ckeditor5-package/tree/v1.0.0) (0000-00-00)'
						);
						expect( changesAsArray[ 1 ] ).to.equal(
							'### Features'
						);
						expect( changesAsArray[ 2 ] ).to.equal(
							'* An amazing feature. ([commit](https://github.com/ckeditor/ckeditor5-package/commit/xxxxxxx))'
						);
						expect( changesAsArray[ 3 ] ).to.equal(
							'### Bug fixes'
						);
						expect( changesAsArray[ 4 ] ).to.equal(
							'* An amazing bug fix. ([commit](https://github.com/ckeditor/ckeditor5-package/commit/zzzzzzz))'
						);
						expect( changesAsArray[ 5 ] ).to.equal(
							'### Other changes'
						);
						expect( changesAsArray[ 6 ] ).to.equal(
							'* An amazing commit. ([commit](https://github.com/ckeditor/ckeditor5-package/commit/yyyyyyy))'
						);
					} );
			} );

			it( 'removes URLs to commits (context.skipCommitsLink=true)', () => {
				const commits = [
					{
						type: 'Features',
						header: 'Feature: The first an amazing feature.',
						subject: 'The first an amazing feature.',
						hash: 'x'.repeat( 40 ),
						notes: []
					},
					{
						type: 'Features',
						header: 'Feature: The second an amazing feature.',
						subject: 'The second an amazing feature.',
						hash: 'z'.repeat( 40 ),
						notes: []
					}
				];

				const context = {
					version: '1.0.0',
					repoUrl: url,
					currentTag: 'v1.0.0',
					skipCommitsLink: true
				};

				const options = getWriterOptions( {
					hash: hash => hash.slice( 0, 7 )
				} );

				return generateChangelog( commits, context, options )
					.then( changes => {
						changes = replaceDates( changes );

						const changesAsArray = changes.split( '\n' )
							.map( line => line.trim() )
							.filter( line => line.length );

						expect( changesAsArray[ 0 ] ).to.equal(
							'## [1.0.0](https://github.com/ckeditor/ckeditor5-package/tree/v1.0.0) (0000-00-00)'
						);
						expect( changesAsArray[ 1 ] ).to.equal(
							'### Features'
						);
						expect( changesAsArray[ 2 ] ).to.equal(
							'* The first an amazing feature.'
						);
						expect( changesAsArray[ 3 ] ).to.equal(
							'* The second an amazing feature.'
						);
					} );
			} );

			it( 'removes compare link from the header (context.skipCompareLink=true)', () => {
				const context = {
					version: '1.0.0',
					repoUrl: url,
					currentTag: 'v1.0.0',
					commit: 'commit',
					skipCompareLink: true
				};

				const options = getWriterOptions( {
					hash: hash => hash.slice( 0, 7 )
				} );

				return generateChangelog( [], context, options )
					.then( changes => {
						changes = replaceDates( changes );

						const changesAsArray = changes.split( '\n' )
							.map( line => line.trim() )
							.filter( line => line.length );

						expect( changesAsArray[ 0 ] ).to.equal(
							'## 1.0.0 (0000-00-00)'
						);
					} );
			} );

			it( 'generates additional commit message below the subject', () => {
				const commits = [
					{
						type: 'Other changes',
						header: 'Other: The first an amazing commit.',
						subject: 'The first an amazing commit.',
						body: [
							'  First line: Lorem Ipsum (1).',
							'  Second line: Lorem Ipsum (2).'
						].join( '\n' ),
						hash: 'x'.repeat( 40 ),
						notes: []
					},
					{
						type: 'Other changes',
						header: 'Other: The second an amazing commit.',
						subject: 'The second an amazing commit.',
						body: [
							'  First line: Lorem Ipsum (1).',
							'  Second line: Lorem Ipsum (2).',
							'  Third line: Lorem Ipsum (3).'
						].join( '\n' ),
						hash: 'z'.repeat( 40 ),
						notes: []
					},
					{
						type: 'Other changes',
						header: 'Other: The third an amazing commit.',
						subject: 'The third an amazing commit.',
						hash: 'y'.repeat( 40 ),
						notes: []
					}
				];

				const context = {
					version: '1.0.0',
					repoUrl: url,
					currentTag: 'v1.0.0',
					commit: 'commit'
				};

				const options = getWriterOptions( {
					hash: hash => hash.slice( 0, 7 )
				} );

				return generateChangelog( commits, context, options )
					.then( changes => {
						changes = replaceDates( changes );

						const changelog = [
							'## [1.0.0](https://github.com/ckeditor/ckeditor5-package/tree/v1.0.0) (0000-00-00)',
							'',
							'### Other changes',
							'',
							'* The first an amazing commit. ([commit](https://github.com/ckeditor/ckeditor5-package/commit/xxxxxxx))',
							'',
							'  First line: Lorem Ipsum (1).',
							'  Second line: Lorem Ipsum (2).',
							'* The second an amazing commit. ([commit](https://github.com/ckeditor/ckeditor5-package/commit/zzzzzzz))',
							'',
							'  First line: Lorem Ipsum (1).',
							'  Second line: Lorem Ipsum (2).',
							'  Third line: Lorem Ipsum (3).',
							'* The third an amazing commit. ([commit](https://github.com/ckeditor/ckeditor5-package/commit/yyyyyyy))'
						].join( '\n' );

						expect( changes.trim() ).to.equal( changelog );
					} );
			} );

			it( 'groups "Updated translations." commits as the single entry (merged links)', () => {
				const commits = [
					{
						type: 'Other changes',
						header: 'Other: Updated translations.',
						subject: 'Updated translations.',
						hash: 'a'.repeat( 40 ),
						notes: []
					},
					{
						type: 'Other changes',
						header: 'Other: Updated translations.',
						subject: 'Updated translations.',
						hash: 'b'.repeat( 40 ),
						notes: []
					},
					{
						type: 'Other changes',
						header: 'Other: Updated translations.',
						subject: 'Updated translations.',
						hash: 'c'.repeat( 40 ),
						notes: []
					},
					{
						type: 'Other changes',
						header: 'Other: Updated translations.',
						subject: 'Updated translations.',
						hash: 'd'.repeat( 40 ),
						notes: []
					}
				];

				const context = {
					version: '1.0.0',
					repoUrl: url,
					currentTag: 'v1.0.0',
					commit: 'c'
				};

				const options = getWriterOptions( {
					hash: hash => hash.slice( 0, 2 )
				} );

				return generateChangelog( commits, context, options )
					.then( changes => {
						changes = replaceDates( changes );

						const changesAsArray = changes.split( '\n' )
							.map( line => line.trim() )
							.filter( line => line.length );

						expect( changesAsArray[ 0 ] ).to.equal(
							'## [1.0.0](https://github.com/ckeditor/ckeditor5-package/tree/v1.0.0) (0000-00-00)'
						);
						expect( changesAsArray[ 1 ] ).to.equal(
							'### Other changes'
						);
						/* eslint-disable max-len */
						expect( changesAsArray[ 2 ] ).to.equal(
							'* Updated translations. ([commit](https://github.com/ckeditor/ckeditor5-package/c/aa), [commit](https://github.com/ckeditor/ckeditor5-package/c/bb), [commit](https://github.com/ckeditor/ckeditor5-package/c/cc), [commit](https://github.com/ckeditor/ckeditor5-package/c/dd))'
						);
						/* eslint-enable max-len */
					} );
			} );

			it( 'groups "Updated translations." commits as the single entry (removed links, context.skipCommitsLink=true)', () => {
				const commits = [
					{
						type: 'Other changes',
						header: 'Other: Updated translations.',
						subject: 'Updated translations.',
						hash: 'a'.repeat( 40 ),
						notes: []
					},
					{
						type: 'Other changes',
						header: 'Other: Updated translations.',
						subject: 'Updated translations.',
						hash: 'b'.repeat( 40 ),
						notes: []
					},
					{
						type: 'Other changes',
						header: 'Other: Updated translations.',
						subject: 'Updated translations.',
						hash: 'c'.repeat( 40 ),
						notes: []
					},
					{
						type: 'Other changes',
						header: 'Other: Updated translations.',
						subject: 'Updated translations.',
						hash: 'd'.repeat( 40 ),
						notes: []
					}
				];

				const context = {
					version: '1.0.0',
					repoUrl: url,
					currentTag: 'v1.0.0',
					skipCommitsLink: true
				};

				const options = getWriterOptions( {
					hash: hash => hash.slice( 0, 2 )
				} );

				return generateChangelog( commits, context, options )
					.then( changes => {
						changes = replaceDates( changes );

						const changesAsArray = changes.split( '\n' )
							.map( line => line.trim() )
							.filter( line => line.length );

						expect( changesAsArray[ 0 ] ).to.equal(
							'## [1.0.0](https://github.com/ckeditor/ckeditor5-package/tree/v1.0.0) (0000-00-00)'
						);
						expect( changesAsArray[ 1 ] ).to.equal(
							'### Other changes'
						);
						expect( changesAsArray[ 2 ] ).to.equal(
							'* Updated translations.'
						);
					} );
			} );

			// See: https://github.com/ckeditor/ckeditor5/issues/10445.
			it(
				'groups "Updated translations." commits as the single entry (merged links) even if a commit specified "skipLinks=true ' +
				'(a private commit is in the middle of the collection)',
				() => {
					const commits = [
						{
							type: 'Other changes',
							header: 'Other: Updated translations.',
							subject: 'Updated translations.',
							hash: 'a'.repeat( 40 ),
							notes: []
						},
						{
							type: 'Other changes',
							header: 'Other: Updated translations.',
							subject: 'Updated translations.',
							hash: 'x'.repeat( 40 ),
							notes: [],
							skipCommitsLink: true
						},
						{
							type: 'Other changes',
							header: 'Other: Updated translations.',
							subject: 'Updated translations.',
							hash: 'b'.repeat( 40 ),
							notes: []
						},
						{
							type: 'Other changes',
							header: 'Other: Updated translations.',
							subject: 'Updated translations.',
							hash: 'c'.repeat( 40 ),
							notes: []
						},
						{
							type: 'Other changes',
							header: 'Other: Updated translations.',
							subject: 'Updated translations.',
							hash: 'd'.repeat( 40 ),
							notes: []
						},
						{
							type: 'Other changes',
							header: 'Other: Updated translations.',
							subject: 'Updated translations.',
							hash: 'z'.repeat( 40 ),
							notes: [],
							skipCommitsLink: true
						}
					];

					const context = {
						version: '1.0.0',
						repoUrl: url,
						currentTag: 'v1.0.0',
						commit: 'c'
					};

					const options = getWriterOptions( {
						hash: hash => hash.slice( 0, 2 )
					} );

					return generateChangelog( commits, context, options )
						.then( changes => {
							changes = replaceDates( changes );

							const changesAsArray = changes.split( '\n' )
								.map( line => line.trim() )
								.filter( line => line.length );

							expect( changesAsArray[ 0 ] ).to.equal(
								'## [1.0.0](https://github.com/ckeditor/ckeditor5-package/tree/v1.0.0) (0000-00-00)'
							);
							expect( changesAsArray[ 1 ] ).to.equal(
								'### Other changes'
							);
							/* eslint-disable max-len */
							expect( changesAsArray[ 2 ] ).to.equal(
								'* Updated translations. ([commit](https://github.com/ckeditor/ckeditor5-package/c/aa), [commit](https://github.com/ckeditor/ckeditor5-package/c/bb), [commit](https://github.com/ckeditor/ckeditor5-package/c/cc), [commit](https://github.com/ckeditor/ckeditor5-package/c/dd))'
							);
							/* eslint-enable max-len */
						} );
				} );

			// See: https://github.com/ckeditor/ckeditor5/issues/10445.
			it(
				'groups "Updated translations." commits as the single entry (merged links) even if a commit specified "skipLinks=true ' +
				'(a private commit is at the beginning of the collection)',
				() => {
					const commits = [
						{
							type: 'Other changes',
							header: 'Other: Updated translations.',
							subject: 'Updated translations.',
							hash: 'x'.repeat( 40 ),
							notes: [],
							skipCommitsLink: true
						},
						{
							type: 'Other changes',
							header: 'Other: Updated translations.',
							subject: 'Updated translations.',
							hash: 'a'.repeat( 40 ),
							notes: []
						},
						{
							type: 'Other changes',
							header: 'Other: Updated translations.',
							subject: 'Updated translations.',
							hash: 'b'.repeat( 40 ),
							notes: []
						},
						{
							type: 'Other changes',
							header: 'Other: Updated translations.',
							subject: 'Updated translations.',
							hash: 'c'.repeat( 40 ),
							notes: []
						},
						{
							type: 'Other changes',
							header: 'Other: Updated translations.',
							subject: 'Updated translations.',
							hash: 'd'.repeat( 40 ),
							notes: []
						},
						{
							type: 'Other changes',
							header: 'Other: Updated translations.',
							subject: 'Updated translations.',
							hash: 'z'.repeat( 40 ),
							notes: [],
							skipCommitsLink: true
						}
					];

					const context = {
						version: '1.0.0',
						repoUrl: url,
						currentTag: 'v1.0.0',
						commit: 'c'
					};

					const options = getWriterOptions( {
						hash: hash => hash.slice( 0, 2 )
					} );

					return generateChangelog( commits, context, options )
						.then( changes => {
							changes = replaceDates( changes );

							const changesAsArray = changes.split( '\n' )
								.map( line => line.trim() )
								.filter( line => line.length );

							expect( changesAsArray[ 0 ] ).to.equal(
								'## [1.0.0](https://github.com/ckeditor/ckeditor5-package/tree/v1.0.0) (0000-00-00)'
							);
							expect( changesAsArray[ 1 ] ).to.equal(
								'### Other changes'
							);
							/* eslint-disable max-len */
							expect( changesAsArray[ 2 ] ).to.equal(
								'* Updated translations. ([commit](https://github.com/ckeditor/ckeditor5-package/c/aa), [commit](https://github.com/ckeditor/ckeditor5-package/c/bb), [commit](https://github.com/ckeditor/ckeditor5-package/c/cc), [commit](https://github.com/ckeditor/ckeditor5-package/c/dd))'
							);
							/* eslint-enable max-len */
						} );
				} );

			// See: https://github.com/ckeditor/ckeditor5/issues/10445.
			it(
				'groups "Updated translations." commits as the single entry (merged links) even if a commit specified "skipLinks=true ' +
				'(all commits come from the private repository)',
				() => {
					const commits = [
						{
							type: 'Other changes',
							header: 'Other: Updated translations.',
							subject: 'Updated translations.',
							hash: 'a'.repeat( 40 ),
							notes: [],
							skipCommitsLink: true
						},
						{
							type: 'Other changes',
							header: 'Other: Updated translations.',
							subject: 'Updated translations.',
							hash: 'b'.repeat( 40 ),
							notes: [],
							skipCommitsLink: true
						},
						{
							type: 'Other changes',
							header: 'Other: Updated translations.',
							subject: 'Updated translations.',
							hash: 'c'.repeat( 40 ),
							notes: [],
							skipCommitsLink: true
						},
						{
							type: 'Other changes',
							header: 'Other: Updated translations.',
							subject: 'Updated translations.',
							hash: 'd'.repeat( 40 ),
							notes: [],
							skipCommitsLink: true
						}
					];

					const context = {
						version: '1.0.0',
						repoUrl: url,
						currentTag: 'v1.0.0',
						commit: 'c'
					};

					const options = getWriterOptions( {
						hash: hash => hash.slice( 0, 2 )
					} );

					return generateChangelog( commits, context, options )
						.then( changes => {
							changes = replaceDates( changes );

							const changesAsArray = changes.split( '\n' )
								.map( line => line.trim() )
								.filter( line => line.length );

							expect( changesAsArray[ 0 ] ).to.equal(
								'## [1.0.0](https://github.com/ckeditor/ckeditor5-package/tree/v1.0.0) (0000-00-00)'
							);
							expect( changesAsArray[ 1 ] ).to.equal(
								'### Other changes'
							);
							/* eslint-disable max-len */
							expect( changesAsArray[ 2 ] ).to.equal(
								'* Updated translations.'
							);
							/* eslint-enable max-len */
						} );
				} );

			it( 'allows removing a URL to commit per commit', () => {
				const commits = [
					{
						type: 'Features',
						header: 'Feature: (a) The first an amazing feature.',
						subject: '(a) The first an amazing feature.',
						hash: 'x'.repeat( 40 ),
						notes: [],
						skipCommitsLink: true
					},
					{
						type: 'Features',
						header: 'Feature: (b) The second an amazing feature.',
						subject: '(b) The second an amazing feature.',
						hash: 'z'.repeat( 40 ),
						notes: []
					},
					{
						type: 'Features',
						header: 'Feature: (c) The last one an amazing feature.',
						subject: '(c) The last one an amazing feature.',
						hash: 'y'.repeat( 40 ),
						notes: [],
						skipCommitsLink: true
					}
				];

				const context = {
					version: '1.0.0',
					repoUrl: url,
					currentTag: 'v1.0.0',
					commit: 'commit'
				};

				const options = getWriterOptions( {
					hash: hash => hash.slice( 0, 7 )
				} );

				return generateChangelog( commits, context, options )
					.then( changes => {
						changes = replaceDates( changes );

						const changesAsArray = changes.split( '\n' )
							.map( line => line.trim() )
							.filter( line => line.length );

						expect( changesAsArray[ 0 ] ).to.equal(
							'## [1.0.0](https://github.com/ckeditor/ckeditor5-package/tree/v1.0.0) (0000-00-00)'
						);
						expect( changesAsArray[ 1 ] ).to.equal(
							'### Features'
						);
						expect( changesAsArray[ 2 ] ).to.equal(
							'* (a) The first an amazing feature.'
						);
						expect( changesAsArray[ 3 ] ).to.equal(
							'* (b) The second an amazing feature. ([commit](https://github.com/ckeditor/ckeditor5-package/commit/zzzzzzz))'
						);
						expect( changesAsArray[ 4 ] ).to.equal(
							'* (c) The last one an amazing feature.'
						);
					} );
			} );
		} );

		describe( 'non-initial changelog (with "previousTag")', () => {
			it( 'allows generating "internal release" (set by option, ignored all commits)', () => {
				const commits = [
					{
						type: 'Other changes',
						header: 'Other: The first an amazing commit.',
						subject: 'The first an amazing commit.',
						hash: 'x'.repeat( 40 ),
						notes: []
					}
				];

				const context = {
					version: '1.1.0',
					repoUrl: url,
					currentTag: 'v1.1.0',
					previousTag: 'v1.0.0',
					commit: 'commit',
					isInternalRelease: true
				};

				const options = getWriterOptions( {
					hash: hash => hash.slice( 0, 7 )
				} );

				return generateChangelog( commits, context, options )
					.then( changes => {
						changes = replaceDates( changes );

						const changesAsArray = changes.split( '\n' )
							.map( line => line.trim() )
							.filter( line => line.length );

						expect( changesAsArray[ 0 ] ).to.equal(
							'## [1.1.0](https://github.com/ckeditor/ckeditor5-package/compare/v1.0.0...v1.1.0) (0000-00-00)'
						);
						expect( changesAsArray[ 1 ] ).to.equal(
							'Internal changes only (updated dependencies, documentation, etc.).'
						);
					} );
			} );

			it( 'allows generating "internal release" (passed an empty array of commits)', () => {
				const context = {
					version: '1.1.0',
					repoUrl: url,
					currentTag: 'v1.1.0',
					previousTag: 'v1.0.0',
					commit: 'commit'
				};

				const options = getWriterOptions( {
					hash: hash => hash.slice( 0, 7 )
				} );

				return generateChangelog( [], context, options )
					.then( changes => {
						changes = replaceDates( changes );

						const changesAsArray = changes.split( '\n' )
							.map( line => line.trim() )
							.filter( line => line.length );

						expect( changesAsArray[ 0 ] ).to.equal(
							'## [1.1.0](https://github.com/ckeditor/ckeditor5-package/compare/v1.0.0...v1.1.0) (0000-00-00)'
						);
						expect( changesAsArray[ 1 ] ).to.equal(
							'Internal changes only (updated dependencies, documentation, etc.).'
						);
					} );
			} );

			it( 'attaches the release highlights placeholder', () => {
				const commits = [
					{
						type: 'Features',
						header: 'Feature: The first an amazing feature.',
						subject: 'The first an amazing feature.',
						hash: 'x'.repeat( 40 ),
						notes: []
					},
					{
						type: 'Features',
						header: 'Feature: The second an amazing feature.',
						subject: 'The second an amazing feature.',
						hash: 'z'.repeat( 40 ),
						notes: []
					}
				];

				const context = {
					version: '1.1.0',
					repoUrl: url,
					currentTag: 'v1.1.0',
					previousTag: 'v1.0.0',
					commit: 'commit',
					highlightsPlaceholder: true
				};

				const options = getWriterOptions( {
					hash: hash => hash.slice( 0, 7 )
				} );

				return generateChangelog( commits, context, options )
					.then( changes => {
						changes = replaceDates( changes );

						const changesAsArray = changes.split( '\n' )
							.map( line => line.trim() )
							.filter( line => line.length );

						expect( changesAsArray[ 0 ] ).to.equal(
							'## [1.1.0](https://github.com/ckeditor/ckeditor5-package/compare/v1.0.0...v1.1.0) (0000-00-00)'
						);
						expect( changesAsArray[ 1 ] ).to.equal(
							'### Release highlights'
						);
						expect( changesAsArray[ 2 ] ).to.equal(
							'<!-- TODO: Add a link to the blog post. -->'
						);
						expect( changesAsArray[ 3 ] ).to.equal(
							'### Features'
						);
						expect( changesAsArray[ 4 ] ).to.equal(
							'* The first an amazing feature. ([commit](https://github.com/ckeditor/ckeditor5-package/commit/xxxxxxx))'
						);
						expect( changesAsArray[ 5 ] ).to.equal(
							'* The second an amazing feature. ([commit](https://github.com/ckeditor/ckeditor5-package/commit/zzzzzzz))'
						);
					} );
			} );

			it( 'attaches the collaboration features changelog', () => {
				const commits = [
					{
						type: 'Features',
						header: 'Feature: The first an amazing feature.',
						subject: 'The first an amazing feature.',
						hash: 'x'.repeat( 40 ),
						notes: []
					},
					{
						type: 'Features',
						header: 'Feature: The second an amazing feature.',
						subject: 'The second an amazing feature.',
						hash: 'z'.repeat( 40 ),
						notes: []
					}
				];

				const context = {
					version: '1.1.0',
					repoUrl: url,
					currentTag: 'v1.1.0',
					previousTag: 'v1.0.0',
					commit: 'commit',
					collaborationFeatures: true
				};

				const options = getWriterOptions( {
					hash: hash => hash.slice( 0, 7 )
				} );

				return generateChangelog( commits, context, options )
					.then( changes => {
						changes = replaceDates( changes );
						const changelog = 'https://ckeditor.com/collaboration/changelog';

						const changesAsArray = changes.split( '\n' )
							.map( line => line.trim() )
							.filter( line => line.length );

						expect( changesAsArray[ 0 ] ).to.equal(
							'## [1.1.0](https://github.com/ckeditor/ckeditor5-package/compare/v1.0.0...v1.1.0) (0000-00-00)'
						);
						expect( changesAsArray[ 1 ] ).to.equal(
							'### Collaboration features'
						);
						expect( changesAsArray[ 2 ] ).to.equal(
							`The CKEditor 5 Collaboration features changelog can be found here: ${ changelog }.`
						);
						expect( changesAsArray[ 3 ] ).to.equal(
							'### Features'
						);
						expect( changesAsArray[ 4 ] ).to.equal(
							'* The first an amazing feature. ([commit](https://github.com/ckeditor/ckeditor5-package/commit/xxxxxxx))'
						);
						expect( changesAsArray[ 5 ] ).to.equal(
							'* The second an amazing feature. ([commit](https://github.com/ckeditor/ckeditor5-package/commit/zzzzzzz))'
						);
					} );
			} );

			it( 'generates complex changelog', () => {
				const commits = [
					{
						type: 'Features',
						header: 'Feature (engine): The first an amazing feature.',
						subject: 'The first an amazing feature.',
						scope: [ 'engine' ],
						hash: 'x'.repeat( 40 ),
						notes: [
							{
								title: 'MINOR BREAKING CHANGES',
								text: 'Nothing but I would like to use the note - engine.',
								scope: [ 'engine' ]
							}
						]
					},
					{
						type: 'Features',
						header: 'Feature: The second an amazing feature.',
						subject: 'The second an amazing feature.',
						hash: 'z'.repeat( 40 ),
						notes: []
					},
					{
						type: 'Bug fixes',
						header: 'Fix (ui): The first amazing bug fix.',
						subject: 'The first amazing bug fix.',
						scope: [ 'ui' ],
						hash: 'y'.repeat( 40 ),
						notes: [
							{
								title: 'MINOR BREAKING CHANGES',
								text: 'Nothing but I would like to use the note - ui.',
								scope: [ 'ui' ]
							}
						]
					},
					{
						type: 'Other changes',
						header: 'Other: Use the newest version of Node.js on CI.',
						subject: 'Use the newest version of Node.js on CI.',
						hash: 'a'.repeat( 40 ),
						notes: [
							{
								title: 'MAJOR BREAKING CHANGES',
								text: 'This change should be scoped too but the script should work if the scope is being missed.',
								scope: []
							}
						]
					},
					{
						type: 'Features',
						header: 'Feature (autoformat): It just works.',
						subject: 'It just works.',
						scope: [
							'autoformat',
							// The tool supports multi-scoped changes but only the first one will be printed in the changelog.
							'engine'
						],
						hash: 'b'.repeat( 40 ),
						notes: []
					}
				];

				const context = {
					version: '1.1.0',
					repoUrl: url,
					currentTag: 'v1.1.0',
					previousTag: 'v1.0.0',
					commit: 'c',
					highlightsPlaceholder: true,
					collaborationFeatures: true
				};

				const options = getWriterOptions( {
					hash: hash => hash.slice( 0, 2 )
				} );

				const sortFunction = compareFunc( item => {
					if ( Array.isArray( item.scope ) ) {
						return item.scope[ 0 ];
					}

					// A hack that allows moving all non-scoped commits or breaking changes notes at the end of the list.
					return 'z'.repeat( 15 );
				} );

				options.commitsSort = sortFunction;
				options.notesSort = sortFunction;

				return generateChangelog( commits, context, options )
					.then( changes => {
						changes = replaceDates( changes );
						const changelog = 'https://ckeditor.com/collaboration/changelog';

						const changesAsArray = changes.split( '\n' )
							.map( line => line.trim() )
							.filter( line => line.length );

						expect( changesAsArray[ 0 ] ).to.equal(
							'## [1.1.0](https://github.com/ckeditor/ckeditor5-package/compare/v1.0.0...v1.1.0) (0000-00-00)'
						);
						expect( changesAsArray[ 1 ] ).to.equal(
							'### Release highlights'
						);
						expect( changesAsArray[ 2 ] ).to.equal(
							'<!-- TODO: Add a link to the blog post. -->'
						);
						expect( changesAsArray[ 3 ] ).to.equal(
							'### Collaboration features'
						);
						expect( changesAsArray[ 4 ] ).to.equal(
							`The CKEditor 5 Collaboration features changelog can be found here: ${ changelog }.`
						);
						expect( changesAsArray[ 5 ] ).to.equal(
							'### MAJOR BREAKING CHANGES'
						);
						expect( changesAsArray[ 6 ] ).to.equal(
							'* This change should be scoped too but the script should work if the scope is being missed.'
						);
						expect( changesAsArray[ 7 ] ).to.equal(
							'### MINOR BREAKING CHANGES'
						);
						expect( changesAsArray[ 8 ] ).to.equal(
							'* **engine**: Nothing but I would like to use the note - engine.'
						);
						expect( changesAsArray[ 9 ] ).to.equal(
							'* **ui**: Nothing but I would like to use the note - ui.'
						);
						expect( changesAsArray[ 10 ] ).to.equal(
							'### Features'
						);
						expect( changesAsArray[ 11 ] ).to.equal(
							'* **autoformat**: It just works. ([commit](https://github.com/ckeditor/ckeditor5-package/c/bb))'
						);
						expect( changesAsArray[ 12 ] ).to.equal(
							'* **engine**: The first an amazing feature. ([commit](https://github.com/ckeditor/ckeditor5-package/c/xx))'
						);
						expect( changesAsArray[ 13 ] ).to.equal(
							'* The second an amazing feature. ([commit](https://github.com/ckeditor/ckeditor5-package/c/zz))'
						);
						expect( changesAsArray[ 14 ] ).to.equal(
							'### Bug fixes'
						);
						expect( changesAsArray[ 15 ] ).to.equal(
							'* **ui**: The first amazing bug fix. ([commit](https://github.com/ckeditor/ckeditor5-package/c/yy))'
						);
						expect( changesAsArray[ 16 ] ).to.equal(
							'### Other changes'
						);
						expect( changesAsArray[ 17 ] ).to.equal(
							'* Use the newest version of Node.js on CI. ([commit](https://github.com/ckeditor/ckeditor5-package/c/aa))'
						);
					} );
			} );

			it( 'removes compare link from the header (context.skipCompareLink=true)', () => {
				const context = {
					version: '1.1.0',
					repoUrl: url,
					currentTag: 'v1.1.0',
					previousTag: 'v1.0.0',
					skipCompareLink: true
				};

				const options = getWriterOptions( {
					hash: hash => hash.slice( 0, 7 )
				} );

				return generateChangelog( [], context, options )
					.then( changes => {
						changes = replaceDates( changes );

						const changesAsArray = changes.split( '\n' )
							.map( line => line.trim() )
							.filter( line => line.length );

						expect( changesAsArray[ 0 ] ).to.equal(
							'## 1.1.0 (0000-00-00)'
						);
					} );
			} );
		} );
	} );

	// Replaces dates to known string. It allows comparing changelog entries to strings
	// which don't depend on the date.
	function replaceDates( changelog ) {
		return changelog.replace( /\d{4}-\d{2}-\d{2}/g, '0000-00-00' );
	}
} );
