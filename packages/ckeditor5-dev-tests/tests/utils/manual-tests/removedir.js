/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { styleText } from 'node:util';
import { deleteAsync } from 'del';
import { logger } from '@ckeditor/ckeditor5-dev-utils';
import removeDir from '../../../lib/utils/manual-tests/removedir.js';

vi.mock( '@ckeditor/ckeditor5-dev-utils' );
vi.mock( 'del' );
vi.mock( 'util', () => ( {
	styleText: vi.fn( ( _style, text ) => text )
} ) );

describe( 'removeDir()', () => {
	let logInfo;
	beforeEach( () => {
		logInfo = vi.fn();

		vi.mocked( deleteAsync ).mockResolvedValue();
		vi.mocked( logger ).mockReturnValue( {
			info: logInfo
		} );
	} );

	it( 'should remove directory and log it', async () => {
		await removeDir( 'workspace/directory' );

		expect( vi.mocked( styleText ) ).toHaveBeenCalledOnce();
		expect( vi.mocked( deleteAsync ) ).toHaveBeenCalledExactlyOnceWith( 'workspace/directory' );
		expect( logInfo ).toHaveBeenCalledExactlyOnceWith( 'Removed directory \'workspace/directory\'' );
	} );

	it( 'should remove directory and does not inform about it', async () => {
		await removeDir( 'workspace/directory', { silent: true } );

		expect( vi.mocked( deleteAsync ) ).toHaveBeenCalledExactlyOnceWith( 'workspace/directory' );

		expect( vi.mocked( styleText ) ).not.toHaveBeenCalled();
		expect( logInfo ).not.toHaveBeenCalled();
	} );
} );
