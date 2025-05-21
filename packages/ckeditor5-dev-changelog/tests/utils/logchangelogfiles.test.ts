/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { describe, it, expect, vi } from 'vitest';
import chalk from 'chalk';
import { logChangelogFiles } from '../../src/utils/logchangelogfiles.js';
import { logInfo } from '../../src/utils/loginfo.js';
import type { SectionsWithEntries } from '../../src/types.js';

vi.mock( '../../src/utils/loginfo' );

describe( 'logChangelogFiles()', () => {
	it( 'logs changes correctly for valid sections', () => {
		const sections: SectionsWithEntries = {
			Feature: {
				title: 'Features',
				entries: [
					{
						message: 'Added new feature',
						data: { mainContent: 'Added new feature', restContent: [], typeNormalized: 'Feature' },
						changesetPath: '/repo/changelog/changeset-1.md'
					}
				]
			}
		} as any;

		logChangelogFiles( sections );

		expect( logInfo ).toHaveBeenNthCalledWith( 1, `○ ${ chalk.cyan( 'Listing the changes...' ) }` );
		expect( logInfo ).toHaveBeenNthCalledWith( 2, '◌ ' + chalk.blue( 'Found Features:' ), { indent: 2 } );
		expect( logInfo ).toHaveBeenNthCalledWith( 3, '- "Feature: Added new feature"', { indent: 4 } );
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

		logChangelogFiles( sections );

		expect( logInfo ).toHaveBeenNthCalledWith( 2, '◌ ' + chalk.red( 'Found Invalid changes:' ), { indent: 2 } );
		expect( logInfo ).toHaveBeenNthCalledWith( 3, '- File: file:///repo/changelog/changeset-1.md', { indent: 4 } );
		expect( logInfo ).toHaveBeenNthCalledWith( 4, chalk.yellow( chalk.underline( 'Validation details:' ) ), { indent: 6 } );
		expect( logInfo ).toHaveBeenNthCalledWith( 5, '- Missing type', { indent: 8 } );
		expect( logInfo ).toHaveBeenNthCalledWith( 6, '- Incorrect format', { indent: 8 } );
	} );

	it( 'handles empty sections gracefully', () => {
		const sections: SectionsWithEntries = {
			Feature: { title: 'Features', entries: [] } as any
		} as any;

		logChangelogFiles( sections );

		expect( logInfo ).toHaveBeenCalledTimes( 1 );
		expect( logInfo ).toHaveBeenNthCalledWith( 1, `○ ${ chalk.cyan( 'Listing the changes...' ) }` );
	} );

	it( 'logs entries with type and scope correctly', () => {
		const sections: SectionsWithEntries = {
			Feature: {
				title: 'Features',
				entries: [
					{
						message: 'Added new button',
						data: {
							typeNormalized: 'Feature',
							scopeNormalized: [ 'ckeditor5-ui', 'ckeditor5-core' ],
							mainContent: 'Added new button component',
							restContent: []
						},
						changesetPath: '/repo/changelog/changeset-2.md'
					}
				]
			}
		} as any;

		logChangelogFiles( sections );

		expect( logInfo ).toHaveBeenNthCalledWith(
			3,
			'- "Feature (ckeditor5-ui, ckeditor5-core): Added new button component"',
			{ indent: 4 }
		);
	} );

	it( 'logs entries with additional content correctly', () => {
		const sections: SectionsWithEntries = {
			fix: {
				title: 'Bug fixes',
				entries: [
					{
						message: 'Fixed button issue',
						data: {
							typeNormalized: 'Fix',
							mainContent: 'Fixed button click behavior',
							restContent: [
								'Closes #123',
								'See also: #456'
							]
						},
						changesetPath: '/repo/changelog/changeset-3.md'
					}
				]
			}
		} as any;

		logChangelogFiles( sections );

		expect( logInfo ).toHaveBeenNthCalledWith( 3, '- "Fix: Fixed button click behavior"', { indent: 4 } );
		expect( logInfo ).toHaveBeenNthCalledWith( 4, chalk.italic( '"Closes #123"' ), { indent: 6 } );
		expect( logInfo ).toHaveBeenNthCalledWith( 5, chalk.italic( '"See also: #456"' ), { indent: 6 } );
	} );

	it( 'handles multiple valid sections correctly', () => {
		const sections: SectionsWithEntries = {
			feature: {
				title: 'Features',
				entries: [
					{
						message: 'Added feature',
						data: {
							typeNormalized: 'Feature',
							mainContent: 'Added feature',
							restContent: []
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
							typeNormalized: 'Fix',
							mainContent: 'Fixed bug',
							restContent: []
						},
						changesetPath: '/repo/changelog/fix.md'
					}
				]
			}
		} as any;

		logChangelogFiles( sections );

		expect( logInfo ).toHaveBeenCalledTimes( 7 ); // Initial + 2 sections with 2 entries + 2 empty lines
		expect( logInfo ).toHaveBeenNthCalledWith( 2, '◌ ' + chalk.blue( 'Found Features:' ), { indent: 2 } );
		expect( logInfo ).toHaveBeenNthCalledWith( 5, '◌ ' + chalk.blue( 'Found Bug fixes:' ), { indent: 2 } );
	} );

	it( 'logs multiple entries in the same section correctly', () => {
		const sections: SectionsWithEntries = {
			Feature: {
				title: 'Features',
				entries: [
					{
						message: 'First feature',
						data: {
							typeNormalized: 'Feature',
							mainContent: 'First feature',
							restContent: []
						},
						changesetPath: '/repo/changelog/feature1.md'
					},
					{
						message: 'Second feature',
						data: {
							typeNormalized: 'Feature',
							mainContent: 'Second feature',
							restContent: []
						},
						changesetPath: '/repo/changelog/feature2.md'
					}
				]
			}
		} as any;

		logChangelogFiles( sections );

		expect( logInfo ).toHaveBeenNthCalledWith( 3, '- "Feature: First feature"', { indent: 4 } );
		expect( logInfo ).toHaveBeenNthCalledWith( 4, '- "Feature: Second feature"', { indent: 4 } );
	} );

	it( 'handles mixed valid and invalid sections correctly', () => {
		const sections: SectionsWithEntries = {
			Feature: {
				title: 'Features',
				entries: [
					{
						message: 'Valid feature',
						data: {
							typeNormalized: 'Feature',
							restContent: []
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
							validations: [ 'Invalid type' ]
						},
						changesetPath: '/repo/changelog/invalid.md'
					}
				]
			}
		} as any;

		logChangelogFiles( sections );

		expect( logInfo ).toHaveBeenNthCalledWith( 2, '◌ ' + chalk.blue( 'Found Features:' ), { indent: 2 } );
		expect( logInfo ).toHaveBeenNthCalledWith( 5, '◌ ' + chalk.red( 'Found Invalid changes:' ), { indent: 2 } );
		expect( logInfo ).toHaveBeenNthCalledWith( 6, '- File: file:///repo/changelog/invalid.md', { indent: 4 } );
		expect( logInfo ).toHaveBeenNthCalledWith( 7, chalk.yellow( chalk.underline( 'Validation details:' ) ), { indent: 6 } );
		expect( logInfo ).toHaveBeenNthCalledWith( 8, '- Invalid type', { indent: 8 } );
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

		logChangelogFiles( sections );

		expect( logInfo ).toHaveBeenNthCalledWith( 2, '◌ ' + chalk.red( 'Found Invalid changes:' ), { indent: 2 } );
		expect( logInfo ).toHaveBeenNthCalledWith( 3, '- File: file:///repo/changelog/invalid-no-details.md', { indent: 4 } );
		expect( logInfo ).not.toHaveBeenNthCalledWith( 4, chalk.yellow( chalk.underline( 'Validation details:' ) ), { indent: 6 } );
	} );
} );
