/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { workspaces } from '@ckeditor/ckeditor5-dev-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import saveChangelog from '../../lib/utils/savechangelog.js';
import getChangelog from '../../lib/utils/getchangelog.js';
import truncateChangelog from '../../lib/utils/truncatechangelog.js';
import { CHANGELOG_HEADER } from '../../lib/utils/constants.js';

vi.mock( '@ckeditor/ckeditor5-dev-utils' );
vi.mock( '../../lib/utils/savechangelog.js' );
vi.mock( '../../lib/utils/getchangelog.js' );
vi.mock( '../../lib/utils/constants.js', () => ( {
	CHANGELOG_HEADER: '# Changelog\n\n'
} ) );

describe( 'truncateChangelog()', () => {
	beforeEach( () => {
		vi.spyOn( process, 'cwd' ).mockReturnValue( '/home/ckeditor' );
		vi.mocked( workspaces.getRepositoryUrl ).mockReturnValue( 'https://github.com/ckeditor/ckeditor5-dev' );
	} );

	it( 'does nothing if there is no changelog', () => {
		vi.mocked( getChangelog ).mockReturnValue( null );
		truncateChangelog( 5 );
		expect( vi.mocked( saveChangelog ) ).not.toHaveBeenCalled();
	} );

	it( 'truncates the changelog and adds the link to the release page (using default cwd)', () => {
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

		vi.mocked( getChangelog ).mockReturnValue( CHANGELOG_HEADER + changelogEntries );

		truncateChangelog( 2 );

		expect( vi.mocked( getChangelog ) ).toHaveBeenCalledExactlyOnceWith( '/home/ckeditor' );
		expect( vi.mocked( saveChangelog ) ).toHaveBeenCalledExactlyOnceWith(
			CHANGELOG_HEADER + expectedChangelogEntries + expectedChangelogFooter,
			'/home/ckeditor'
		);
	} );

	it( 'truncates the changelog and adds the link to the release page (using a custom cwd)', () => {
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

		vi.mocked( getChangelog ).mockReturnValue( CHANGELOG_HEADER + changelogEntries );

		truncateChangelog( 2, '/custom/cwd' );

		expect( vi.mocked( getChangelog ) ).toHaveBeenCalledExactlyOnceWith( '/custom/cwd' );
		expect( vi.mocked( saveChangelog ) ).toHaveBeenCalledExactlyOnceWith(
			CHANGELOG_HEADER + expectedChangelogEntries + expectedChangelogFooter,
			'/custom/cwd'
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

		vi.mocked( getChangelog ).mockReturnValue( CHANGELOG_HEADER + changelogEntries );

		truncateChangelog( 2 );

		expect( vi.mocked( saveChangelog ) ).toHaveBeenCalledExactlyOnceWith(
			CHANGELOG_HEADER + expectedChangelogEntries + expectedChangelogFooter,
			expect.any( String )
		);
	} );
} );
