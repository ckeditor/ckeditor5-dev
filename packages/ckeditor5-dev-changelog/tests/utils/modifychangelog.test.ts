/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { modifyChangelog } from '../../src/utils/modifychangelog.js';
import { truncateChangelog } from '../../src/utils/truncatechangelog.js';
import { CHANGELOG_HEADER } from '../../src/constants.js';
import { logInfo } from '../../src/utils/loginfo.js';
import fs from 'fs/promises';

vi.mock( 'fs/promises' );
vi.mock( '../../src/utils/truncatechangelog.js' );
vi.mock( '../../src/utils/loginfo.js' );
vi.mock( 'chalk', () => ( {
	default: {
		cyan: ( text: string ) => text,
		yellow: ( text: string ) => text
	}
} ) );
vi.mock( '../../src/constants.js', () => ( {
	CHANGELOG_HEADER: '# Changelog\n\n',
	CHANGELOG_FILE: 'CHANGELOG.md'
} ) );

describe( 'modifyChangelog()', () => {
	const cwd = '/home/ckeditor';
	const newChangelog = '## [1.0.0](https://github.com) (2024-03-26)\n\n- New feature 1\n- New feature 2';

	beforeEach( () => {
		vi.clearAllMocks();
	} );

	it( 'creates a new changelog file if it does not exist', async () => {
		vi.mocked( fs.readFile ).mockRejectedValue( new Error( 'File not found' ) );

		await modifyChangelog( newChangelog, cwd );

		expect( fs.readFile ).toHaveBeenCalledWith( '/home/ckeditor/CHANGELOG.md', 'utf-8' );
		expect( fs.writeFile ).toHaveBeenCalledWith(
			'/home/ckeditor/CHANGELOG.md',
			`${ CHANGELOG_HEADER }\n\n${ newChangelog }`,
			'utf-8'
		);
		expect( truncateChangelog ).toHaveBeenCalledWith( 5, cwd );
		expect( logInfo ).toHaveBeenCalledWith( '📍 Appending changes to the existing changelog...\n' );
		expect( logInfo ).toHaveBeenCalledWith( '📍 CHANGELOG.md not found. Creating a new one.\n' );
	} );

	it( 'appends new changelog after the header if it exists', async () => {
		const existingChangelog = `${ CHANGELOG_HEADER }\n\n## [0.1.0](https://github.com) (2024-03-25)\n\n- Old feature`;
		vi.mocked( fs.readFile ).mockResolvedValue( existingChangelog );

		await modifyChangelog( newChangelog, cwd );

		expect( fs.readFile ).toHaveBeenCalledWith( '/home/ckeditor/CHANGELOG.md', 'utf-8' );
		expect( fs.writeFile ).toHaveBeenCalledWith(
			'/home/ckeditor/CHANGELOG.md',
			`${ CHANGELOG_HEADER }\n\n${ newChangelog }\n\n## [0.1.0](https://github.com) (2024-03-25)\n\n- Old feature`,
			'utf-8'
		);
		expect( truncateChangelog ).toHaveBeenCalledWith( 5, cwd );
		expect( logInfo ).toHaveBeenCalledWith( '📍 Appending changes to the existing changelog...\n' );
	} );

	it( 'prepends new changelog if header is missing', async () => {
		const existingChangelog = '## [0.1.0](https://github.com) (2024-03-25)\n\n- Old feature';
		vi.mocked( fs.readFile ).mockResolvedValue( existingChangelog );

		await modifyChangelog( newChangelog, cwd );

		expect( fs.readFile ).toHaveBeenCalledWith( '/home/ckeditor/CHANGELOG.md', 'utf-8' );
		expect( fs.writeFile ).toHaveBeenCalledWith(
			'/home/ckeditor/CHANGELOG.md',
			`${ CHANGELOG_HEADER }\n\n${ newChangelog }${ existingChangelog }`,
			'utf-8'
		);
		expect( truncateChangelog ).toHaveBeenCalledWith( 5, cwd );
		expect( logInfo ).toHaveBeenCalledWith( '📍 Appending changes to the existing changelog...\n' );
	} );

	it( 'handles empty existing changelog', async () => {
		vi.mocked( fs.readFile ).mockResolvedValue( '' );

		await modifyChangelog( newChangelog, cwd );

		expect( fs.readFile ).toHaveBeenCalledWith( '/home/ckeditor/CHANGELOG.md', 'utf-8' );
		expect( fs.writeFile ).toHaveBeenCalledWith(
			'/home/ckeditor/CHANGELOG.md',
			`${ CHANGELOG_HEADER }\n\n${ newChangelog }`,
			'utf-8'
		);
		expect( truncateChangelog ).toHaveBeenCalledWith( 5, cwd );
		expect( logInfo ).toHaveBeenCalledWith( '📍 Appending changes to the existing changelog...\n' );
	} );
} );
