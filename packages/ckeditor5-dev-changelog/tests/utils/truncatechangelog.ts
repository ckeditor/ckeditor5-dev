/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { workspaces } from '@ckeditor/ckeditor5-dev-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { truncateChangelog } from '../../src/utils/truncatechangelog.js';
import { CHANGELOG_HEADER } from '../../src/utils/constants.js';
import fs from 'fs';

vi.mock( 'fs' );
vi.mock( '@ckeditor/ckeditor5-dev-utils' );

describe( 'truncateChangelog()', () => {
	beforeEach( () => {
		vi.spyOn( process, 'cwd' ).mockReturnValue( '/home/ckeditor' );
		vi.mocked( workspaces.getRepositoryUrl ).mockReturnValue( 'https://github.com/ckeditor/ckeditor5-dev' );
		vi.mocked( fs.existsSync ).mockReturnValue( true );
	} );

	it( 'does nothing if there is no changelog', () => {
		vi.mocked( fs.existsSync ).mockReturnValue( false );

		truncateChangelog( 5, 'cwd' );

		expect( fs.writeFileSync ).not.toHaveBeenCalled();
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

		vi.mocked( fs.readFileSync ).mockReturnValue( CHANGELOG_HEADER + '\n\n' + changelogEntries );

		truncateChangelog( 2, '/custom/cwd' );

		expect( fs.readFileSync ).toHaveBeenNthCalledWith( 1, '/custom/cwd/CHANGELOG.md', 'utf-8' );
		expect( fs.writeFileSync ).toHaveBeenNthCalledWith(
			1,
			'/custom/cwd/CHANGELOG.md',
			CHANGELOG_HEADER + '\n\n' + expectedChangelogEntries + expectedChangelogFooter,
			'utf-8'
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

		vi.mocked( fs.readFileSync ).mockReturnValue( CHANGELOG_HEADER + '\n\n' + expectedChangelogEntries );

		truncateChangelog( 2, 'cwd' );

		expect( fs.writeFileSync ).toHaveBeenNthCalledWith(
			1,
			expect.any( String ),
			CHANGELOG_HEADER + '\n\n' + expectedChangelogEntries + expectedChangelogFooter,
			'utf-8'
		);
	} );

	it( 'handles empty entries array', () => {
		vi.mocked( fs.readFileSync ).mockReturnValue( CHANGELOG_HEADER );

		truncateChangelog( 5, '/home/ckeditor' );

		expect( fs.writeFileSync ).not.toHaveBeenCalled();
	} );
} );
