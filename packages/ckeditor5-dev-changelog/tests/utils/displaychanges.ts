/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { describe, it, expect, vi } from 'vitest';
import chalk from 'chalk';
import { displayChanges } from '../../src/utils/displaychanges.js';
import { logInfo } from '../../src/utils/loginfo.js';
import type { SectionsWithEntries } from '../../src/types.js';

vi.mock( 'chalk', () => ( {
	default: {
		cyan: vi.fn( ( text: string ) => text ),
		green: vi.fn( ( text: string ) => text ),
		yellow: vi.fn( ( text: string ) => text ),
		blue: vi.fn( ( text: string ) => text ),
		red: vi.fn( ( text: string ) => text ),
		underline: vi.fn( ( text: string ) => text ),
		bold: vi.fn( ( text: string ) => text ),
		grey: vi.fn( ( text: string ) => text ),
		italic: vi.fn( ( text: string ) => text )
	}
} ) );

vi.mock( '../../src/utils/loginfo.js' );

describe( 'displayChanges()', () => {
	it( 'logs changes correctly for valid sections', () => {
		const sections: SectionsWithEntries = {
			Feature: {
				title: 'Features',
				entries: [
					{
						message: 'Added new feature',
						data: { mainContent: 'Added new feature', restContent: [], type: 'Feature', scope: [] },
						changesetPath: '/repo/changelog/changeset-1.md'
					}
				]
			}
		} as any;

		displayChanges( {
			sections,
			isSinglePackage: false
		} );

		expect( chalk.cyan ).toHaveBeenCalledTimes( 1 );
		expect( chalk.cyan ).toHaveBeenCalledWith( 'Listing the changes...' );
		expect( chalk.blue ).toHaveBeenCalledTimes( 1 );
		expect( chalk.blue ).toHaveBeenCalledWith( 'Features:' );

		expect( logInfo ).toHaveBeenNthCalledWith( 1, '○ Listing the changes...' );
		expect( logInfo ).toHaveBeenNthCalledWith( 2, '◌ Features:', expect.any( Object ) );
		expect( logInfo ).toHaveBeenNthCalledWith( 3, '+ (no scope): Added new feature', expect.any( Object ) );
		expect( logInfo ).toHaveBeenNthCalledWith( 4, '' );
		expect( logInfo ).toHaveBeenCalledWith( expect.stringContaining( 'Legend:' ), expect.anything() );
	} );

	it( 'marks entries including valid values with the green "+" character', () => {
		const sections: SectionsWithEntries = {
			Feature: {
				title: 'Features',
				entries: [
					{
						message: 'Added new feature',
						data: { mainContent: 'Added new feature', restContent: [], type: 'Feature', scope: [] },
						changesetPath: '/repo/changelog/changeset-1.md'
					}
				]
			}
		} as any;

		displayChanges( {
			sections,
			isSinglePackage: false
		} );

		expect( chalk.green ).toHaveBeenCalledTimes( 2 );
		expect( chalk.green ).toHaveBeenCalledWith( '+' );

		expect( logInfo ).toHaveBeenNthCalledWith( 3, '+ (no scope): Added new feature', expect.any( Object ) );
	} );

	it( 'uses the specified `transformScope` callback to define a displayed name', () => {
		const sections: SectionsWithEntries = {
			Feature: {
				title: 'Features',
				entries: [
					{
						message: 'Added new feature',
						data: { mainContent: 'Added new feature', restContent: [], type: 'Feature', scope: [ 'foo' ] },
						changesetPath: '/repo/changelog/changeset-1.md'
					}
				]
			}
		} as any;

		displayChanges( {
			sections,
			isSinglePackage: false,
			transformScope: () => {
				return {
					displayName: 'bar',
					npmUrl: 'npm'
				};
			}
		} );

		expect( chalk.green ).toHaveBeenCalledTimes( 2 );
		expect( chalk.green ).toHaveBeenCalledWith( '+' );

		expect( logInfo ).toHaveBeenNthCalledWith( 3, '+ bar: Added new feature', expect.any( Object ) );
	} );

	it( 'truncates the long entry (a mono-repository mode)', () => {
		const sections: SectionsWithEntries = {
			Feature: {
				title: 'Features',
				entries: [
					{
						message: 'Added new feature',
						data: {
							mainContent: 'Added new feature. This is a very long description that should be truncated.'.repeat( 3 ),
							restContent: [],
							type: 'Feature',
							scope: []
						},
						changesetPath: '/repo/changelog/changeset-1.md'
					}
				]
			}
		} as any;

		displayChanges( {
			sections,
			isSinglePackage: false
		} );

		expect( chalk.green ).toHaveBeenCalledTimes( 2 );
		expect( chalk.green ).toHaveBeenCalledWith( '+' );

		expect( logInfo ).toHaveBeenNthCalledWith(
			3,
			'+ (no scope): Added new feature. This is a very long description that should be truncated.Added new feature. This ...',
			expect.any( Object )
		);
	} );

	it( 'truncates the long entry (a single package mode)', () => {
		const sections: SectionsWithEntries = {
			Feature: {
				title: 'Features',
				entries: [
					{
						message: 'Added new feature',
						data: {
							mainContent: 'Added new feature. This is a very long description that should be truncated.'.repeat( 3 ),
							restContent: [],
							type: 'Feature',
							scope: []
						},
						changesetPath: '/repo/changelog/changeset-1.md'
					}
				]
			}
		} as any;

		displayChanges( {
			sections,
			isSinglePackage: true
		} );

		expect( chalk.green ).toHaveBeenCalledTimes( 2 );
		expect( chalk.green ).toHaveBeenCalledWith( '+' );

		expect( logInfo ).toHaveBeenNthCalledWith(
			3,
			'+ Added new feature. This is a very long description that should be truncated.Added new feature. This ...',
			expect.any( Object )
		);
	} );

	it( 'logs invalid section in red', () => {
		const sections: SectionsWithEntries = {
			invalid: {
				title: 'Invalid changes',
				entries: [
					{
						message: 'Invalid entry',
						data: {
							restContent: [],
							validations: [ 'Missing type', 'Incorrect format' ]
						},
						changesetPath: '/repo/changelog/changeset-1.md'
					}
				]
			}
		} as any;

		displayChanges( {
			sections,
			isSinglePackage: false
		} );

		expect( chalk.red ).toHaveBeenCalledTimes( 1 );
		expect( chalk.red ).toHaveBeenCalledWith( 'Invalid changes:' );
		expect( logInfo ).toHaveBeenNthCalledWith( 2, '◌ Invalid changes:', expect.any( Object ) );
		expect( logInfo ).toHaveBeenNthCalledWith( 3, '» file:///repo/changelog/changeset-1.md', expect.any( Object ) );
		expect( logInfo ).toHaveBeenNthCalledWith( 4, '- Missing type', expect.any( Object ) );
		expect( logInfo ).toHaveBeenNthCalledWith( 5, '- Incorrect format', expect.any( Object ) );
	} );

	it.each( [
		[ 'major', 'Major breaking changes' ],
		[ 'minor', 'Minor breaking changes' ],
		[ 'breaking', 'Breaking changes' ]
	] )( 'should use different style for heading when displaying the "%s breaking changes" section', ( sectionKey, title ) => {
		const sections = {
			[ sectionKey ]: {
				title,
				entries: [
					{
						message: 'Added feature',
						data: {
							type: 'Feature',
							mainContent: 'Added feature',
							restContent: [],
							scope: [],
							see: [],
							closes: []
						},
						changesetPath: '/repo/changelog/feature.md'
					}
				]
			}
		};

		displayChanges( {
			sections: sections as any,
			isSinglePackage: false
		} );

		expect( chalk.blue ).toHaveBeenCalledTimes( 1 );
		expect( chalk.bold ).toHaveBeenCalledTimes( 1 );
		expect( chalk.blue ).toHaveBeenCalledWith( `${ title }:` );

		expect( logInfo ).toHaveBeenNthCalledWith( 2, `◌ ${ title }:`, expect.any( Object ) );
	} );

	it.each( [
		{
			sectionKey: 'major',
			title: 'Major breaking changes',
			referenceType: 'closes',
			closes: [ { link: 'url1' }, { link: 'url2' } ],
			see: []
		},
		{
			sectionKey: 'minor',
			title: 'Minor breaking changes',
			referenceType: 'closes',
			closes: [ { link: 'url1' }, { link: 'url2' } ],
			see: []
		},
		{
			sectionKey: 'breaking',
			title: 'Breaking changes',
			referenceType: 'closes',
			closes: [ { link: 'url1' }, { link: 'url2' } ],
			see: []
		},
		{
			sectionKey: 'major',
			title: 'Major breaking changes',
			referenceType: 'see',
			closes: [],
			see: [ { link: 'url1' }, { link: 'url2' } ]
		},
		{
			sectionKey: 'minor',
			title: 'Minor breaking changes',
			referenceType: 'see',
			closes: [],
			see: [ { link: 'url1' }, { link: 'url2' } ]
		},
		{
			sectionKey: 'breaking',
			title: 'Breaking changes',
			referenceType: 'see',
			closes: [],
			see: [ { link: 'url1' }, { link: 'url2' } ]
		}
	] )(
		'should display the reference issues when processing $title ($referenceType)',
		( { sectionKey, title, see, closes, referenceType } ) => {
			const sections = {
				[ sectionKey ]: {
					title,
					entries: [
						{
							message: 'Added feature',
							data: {
								type: 'Feature',
								mainContent: 'Added feature',
								restContent: [],
								scope: [],
								see,
								closes
							},
							changesetPath: '/repo/changelog/feature.md'
						}
					]
				}
			};

			displayChanges( {
				sections: sections as any,
				isSinglePackage: false
			} );

			const referenceWord = referenceType === 'closes' ? 'Closes' : 'See';

			expect( logInfo ).toHaveBeenCalledWith( `- ${ referenceWord }: url1`, expect.any( Object ) );
			expect( logInfo ).toHaveBeenCalledWith( `- ${ referenceWord }: url2`, expect.any( Object ) );
		} );

	it( 'should use the `titleInLogs` property instead of `title` if a section defines it', () => {
		const sections: SectionsWithEntries = {
			feature: {
				title: 'Feature',
				titleInLogs: 'Foo. Bar. Bom.',
				entries: [
					{
						message: 'Added feature',
						data: {
							type: 'Feature',
							mainContent: 'Added feature',
							restContent: [],
							scope: []
						},
						changesetPath: '/repo/changelog/feature.md'
					}
				]
			}
		} as any;

		displayChanges( {
			sections,
			isSinglePackage: false
		} );

		expect( chalk.blue ).toHaveBeenCalledTimes( 1 );
		expect( chalk.blue ).toHaveBeenCalledWith( 'Foo. Bar. Bom.:' );

		expect( logInfo ).toHaveBeenNthCalledWith( 2, '◌ Foo. Bar. Bom.:', expect.any( Object ) );
	} );

	it( 'handles empty sections gracefully', () => {
		const sections: SectionsWithEntries = {
			Feature: { title: 'Features', entries: [] } as any
		} as any;

		displayChanges( {
			sections,
			isSinglePackage: false
		} );

		expect( logInfo ).toHaveBeenNthCalledWith( 1, '○ Listing the changes...' );
		expect( logInfo ).toHaveBeenCalledWith( expect.stringContaining( 'Legend:' ), expect.anything() );
	} );

	it( 'logs entries with type and scope correctly', () => {
		const sections: SectionsWithEntries = {
			Feature: {
				title: 'Features',
				entries: [
					{
						message: 'Added new button',
						data: {
							type: 'Feature',
							scope: [ 'ckeditor5-ui', 'ckeditor5-core' ],
							mainContent: 'Added new button component',
							restContent: []
						},
						changesetPath: '/repo/changelog/changeset-2.md'
					}
				]
			}
		} as any;

		displayChanges( {
			sections,
			isSinglePackage: false
		} );

		expect( logInfo ).toHaveBeenNthCalledWith(
			3,
			'+ ckeditor5-ui, ckeditor5-core: Added new button component',
			expect.any( Object )
		);
	} );

	it( 'handles multiple valid sections correctly', () => {
		const sections: SectionsWithEntries = {
			feature: {
				title: 'Features',
				entries: [
					{
						message: 'Added feature',
						data: {
							type: 'Feature',
							mainContent: 'Added feature',
							restContent: [],
							scope: []
						},
						changesetPath: '/repo/changelog/feature.md'
					}
				]
			},
			fix: {
				title: 'Bug fixes',
				entries: [
					{
						message: 'Fixed bug',
						data: {
							type: 'Fix',
							mainContent: 'Fixed bug',
							restContent: [],
							scope: []
						},
						changesetPath: '/repo/changelog/fix.md'
					}
				]
			}
		} as any;

		displayChanges( {
			sections,
			isSinglePackage: false
		} );

		expect( chalk.blue ).toHaveBeenCalledTimes( 2 );
		expect( chalk.blue ).toHaveBeenCalledWith( 'Features:' );
		expect( chalk.blue ).toHaveBeenCalledWith( 'Bug fixes:' );

		expect( logInfo ).toHaveBeenNthCalledWith( 2, '◌ Features:', expect.any( Object ) );
		expect( logInfo ).toHaveBeenNthCalledWith( 5, '◌ Bug fixes:', expect.any( Object ) );
	} );

	it( 'logs multiple entries in the same section correctly', () => {
		const sections: SectionsWithEntries = {
			Feature: {
				title: 'Features',
				entries: [
					{
						message: 'First feature',
						data: {
							type: 'Feature',
							mainContent: 'First feature',
							restContent: [],
							scope: []
						},
						changesetPath: '/repo/changelog/feature1.md'
					},
					{
						message: 'Second feature',
						data: {
							type: 'Feature',
							mainContent: 'Second feature',
							restContent: [],
							scope: []
						},
						changesetPath: '/repo/changelog/feature2.md'
					}
				]
			}
		} as any;

		displayChanges( {
			sections,
			isSinglePackage: false
		} );

		expect( logInfo ).toHaveBeenNthCalledWith( 3, '+ (no scope): First feature', expect.any( Object ) );
		expect( logInfo ).toHaveBeenNthCalledWith( 4, '+ (no scope): Second feature', expect.any( Object ) );
	} );

	it( 'handles mixed valid and invalid sections correctly', () => {
		const sections: SectionsWithEntries = {
			Feature: {
				title: 'Features',
				entries: [
					{
						message: 'Valid feature',
						data: {
							type: 'Feature',
							restContent: [],
							scope: []
						},
						changesetPath: '/repo/changelog/valid.md'
					}
				]
			},
			invalid: {
				title: 'Invalid changes',
				entries: [
					{
						message: 'Invalid entry',
						data: {
							restContent: [],
							validations: [ 'Invalid type' ],
							scope: []
						},
						changesetPath: '/repo/changelog/invalid.md'
					}
				]
			}
		} as any;

		displayChanges( {
			sections,
			isSinglePackage: false
		} );

		expect( logInfo ).toHaveBeenNthCalledWith( 2, '◌ Features:', expect.any( Object ) );
		expect( logInfo ).toHaveBeenNthCalledWith( 5, '◌ Invalid changes:', expect.any( Object ) );
		expect( logInfo ).toHaveBeenNthCalledWith( 7, '- Invalid type', expect.any( Object ) );
	} );

	it( 'handles invalid sections with no validation details correctly', () => {
		const sections: SectionsWithEntries = {
			invalid: {
				title: 'Invalid changes',
				entries: [
					{
						message: 'Invalid entry with no details',
						data: {
							mainContent: 'Invalid entry',
							restContent: []
						},
						changesetPath: '/repo/changelog/invalid-no-details.md'
					}
				]
			}
		} as any;

		displayChanges( {
			sections,
			isSinglePackage: false
		} );

		expect( logInfo ).toHaveBeenNthCalledWith( 2, '◌ Invalid changes:', expect.any( Object ) );
		expect( logInfo ).not.toHaveBeenCalledWith( ( 'Validation details:' ), expect.any( Object ) );
	} );

	it( 'marks entries including invalid values with the yellow "x" character', () => {
		const sections: SectionsWithEntries = {
			Feature: {
				title: 'Features',
				entries: [
					{
						message: 'Feature with warnings',
						data: {
							type: 'Feature',
							mainContent: 'Feature with warnings',
							restContent: [],
							scope: [],
							validations: [ 'Invalid scope reference' ]
						},
						changesetPath: '/repo/changelog/warning-feature.md'
					}
				]
			}
		} as any;

		displayChanges( {
			sections,
			isSinglePackage: false
		} );

		expect( logInfo ).toHaveBeenNthCalledWith( 3, 'x (no scope): Feature with warnings', expect.any( Object ) );
	} );

	it( 'displays the warning section above the error one (both sections are available)', () => {
		const sections: SectionsWithEntries = {
			feature: {
				title: 'Features',
				entries: [
					{
						message: 'Added new feature',
						data: {
							mainContent:
								'Added new feature',
							restContent: [],
							type: 'Feature',
							scope: [],
							validations: [ 'Invalid scope reference' ]
						},
						changesetPath: '/repo/changelog/changeset-1.md'
					}
				]
			},

			warning: {
				title: 'Warning',
				entries: [
					{
						message: 'Added new feature',
						data: {
							mainContent:
								'Added new feature',
							restContent: [],
							type: 'Feature',
							scope: [],
							validations: [ 'Invalid scope reference' ]
						},
						changesetPath: '/repo/changelog/changeset-1.md'
					}
				]
			},

			invalid: {
				title: 'Invalid changes',
				entries: [
					{
						message: 'Invalid entry with no details',
						data: {
							mainContent: 'Invalid entry',
							restContent: [],
							scope: [],
							validations: []
						},
						changesetPath: '/repo/changelog/invalid-no-details.md'
					}
				]
			}
		} as any;

		displayChanges( {
			sections,
			isSinglePackage: false
		} );

		expect( logInfo ).toHaveBeenNthCalledWith( 2, '◌ Features:', expect.any( Object ) );
		expect( logInfo ).toHaveBeenNthCalledWith( 5, '◌ Warning:', expect.any( Object ) );
		expect( logInfo ).toHaveBeenNthCalledWith( 9, '◌ Invalid changes:', expect.any( Object ) );
	} );

	it( 'displays the warning section even is the error one is missing', () => {
		const sections: SectionsWithEntries = {
			feature: {
				title: 'Features',
				entries: [
					{
						message: 'Added new feature',
						data: {
							mainContent:
								'Added new feature',
							restContent: [],
							type: 'Feature',
							scope: [],
							validations: [ 'Invalid scope reference' ]
						},
						changesetPath: '/repo/changelog/changeset-1.md'
					}
				]
			},

			warning: {
				title: 'Warning',
				entries: [
					{
						message: 'Added new feature',
						data: {
							mainContent:
								'Added new feature',
							restContent: [],
							type: 'Feature',
							scope: [],
							validations: [ 'Invalid scope reference' ]
						},
						changesetPath: '/repo/changelog/changeset-1.md'
					}
				]
			}
		} as any;

		displayChanges( {
			sections,
			isSinglePackage: false
		} );

		expect( logInfo ).toHaveBeenNthCalledWith( 2, '◌ Features:', expect.any( Object ) );
		expect( logInfo ).toHaveBeenNthCalledWith( 5, '◌ Warning:', expect.any( Object ) );
		expect( logInfo ).not.toHaveBeenCalledWith( '◌ Invalid changes:', expect.any( Object ) );
	} );

	it( 'formats incorrect values entries like the error one', () => {
		const sections: SectionsWithEntries = {
			warning: {
				title: 'Warning',
				entries: [
					{
						message: 'Added new feature',
						data: {
							mainContent:
								'Added new feature',
							restContent: [],
							type: 'Feature',
							scope: [],
							validations: [ 'Invalid scope reference' ]
						},
						changesetPath: '/repo/changelog/changeset-1.md'
					}
				]
			}
		} as any;

		displayChanges( {
			sections,
			isSinglePackage: false
		} );

		expect( chalk.yellow ).toHaveBeenCalledTimes( 2 );
		expect( chalk.yellow ).toHaveBeenCalledWith( 'Warning:' );
		expect( logInfo ).toHaveBeenNthCalledWith( 2, '◌ Warning:', expect.any( Object ) );
		expect( logInfo ).toHaveBeenNthCalledWith( 3, '» file:///repo/changelog/changeset-1.md', expect.any( Object ) );
		expect( logInfo ).toHaveBeenNthCalledWith( 4, '- Invalid scope reference', expect.any( Object ) );
	} );
} );
