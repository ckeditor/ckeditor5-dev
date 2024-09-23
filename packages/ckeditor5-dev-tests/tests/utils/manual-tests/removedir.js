/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { deleteAsync } from 'del';
import { logger } from '@ckeditor/ckeditor5-dev-utils';
import chalk from 'chalk';
import removeDir from '../../../lib/utils/manual-tests/removedir.js';

vi.mock( '@ckeditor/ckeditor5-dev-utils' );
vi.mock( 'del' );
vi.mock( 'chalk', () => ( {
	default: {
		cyan: vi.fn()
	}
} ) );

describe( 'removeDir()', () => {
	let logInfo;
	beforeEach( () => {
		logInfo = vi.fn();

		vi.mocked( deleteAsync ).mockResolvedValue();
		vi.mocked( chalk ).cyan.mockImplementation( input => input );
		vi.mocked( logger ).mockReturnValue( {
			info: logInfo
		} );
	} );

	it( 'should remove directory and log it', async () => {
		await removeDir( 'workspace/directory' );

		expect( vi.mocked( chalk ).cyan ).toHaveBeenCalledOnce();
		expect( vi.mocked( deleteAsync ) ).toHaveBeenCalledExactlyOnceWith( 'workspace/directory' );
		expect( logInfo ).toHaveBeenCalledExactlyOnceWith( 'Removed directory \'workspace/directory\'' );
	} );

	it( 'should remove directory and does not inform about it', async () => {
		await removeDir( 'workspace/directory', { silent: true } );

		expect( vi.mocked( deleteAsync ) ).toHaveBeenCalledExactlyOnceWith( 'workspace/directory' );

		expect( vi.mocked( chalk ).cyan ).not.toHaveBeenCalled();
		expect( logInfo ).not.toHaveBeenCalled();
	} );
} );
