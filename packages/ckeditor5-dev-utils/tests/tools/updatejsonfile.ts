/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import fs from 'node:fs';
import { describe, expect, it, vi } from 'vitest';
import updateJSONFile from '../../src/tools/updatejsonfile.js';

vi.mock( 'fs' );

describe( 'updateJSONFile()', () => {
	it( 'should read, update and save JSON file', () => {
		vi.mocked( fs ).readFileSync.mockReturnValue( '{}' );

		const path = 'path/to/file.json';
		const modifiedJSON = { modified: true };

		updateJSONFile( path, () => {
			return modifiedJSON;
		} );

		expect( vi.mocked( fs ).readFileSync ).toHaveBeenCalledExactlyOnceWith( path, 'utf-8' );
		expect( vi.mocked( fs ).writeFileSync ).toHaveBeenCalledExactlyOnceWith(
			path,
			JSON.stringify( modifiedJSON, null, 2 ) + '\n',
			'utf-8'
		);
	} );
} );
