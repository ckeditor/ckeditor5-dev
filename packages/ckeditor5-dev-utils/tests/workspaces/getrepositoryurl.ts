/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { describe, it, expect, vi } from 'vitest';
import getRepositoryUrl from '../../src/workspaces/getrepositoryurl.js';
import getPackageJson from '../../src/workspaces/getpackagejson.js';

vi.mock( '../../src/workspaces/getpackagejson' );

describe( 'getRepositoryUrl()', () => {
	const mockCwd = '/test/cwd';
	const mockPackageName = 'test-package';

	const testCases: Array<[ description: string, inputValue: string, expected: string ]> = [
		[ 'string with .git', 'https://github.com/ckeditor/ckeditor5.git', 'https://github.com/ckeditor/ckeditor5' ],
		[ 'string without .git', 'https://github.com/ckeditor/ckeditor5', 'https://github.com/ckeditor/ckeditor5' ],
		[ 'string with /issues', 'https://github.com/ckeditor/ckeditor5/issues', 'https://github.com/ckeditor/ckeditor5' ],
		[ 'string with git+ prefix', 'git+https://github.com/ckeditor/ckeditor5', 'https://github.com/ckeditor/ckeditor5' ],
		[ 'ssh format', 'git@github.com:ckeditor/ckeditor5.git', 'https://github.com/ckeditor/ckeditor5' ],
		[ 'short notation', 'ckeditor/ckeditor5', 'https://github.com/ckeditor/ckeditor5' ]
	];

	describe.each( [ 'object', 'string' ] )( '`repository` value as `%s`', typeofRepository => {
		describe.each( [ true, false ] )( 'async=%s', isAsync => {
			it.each( testCases )( 'should return GitHub URL from %s', async ( _, inputValue, expected ) => {
				const mockPackageJson = {
					name: mockPackageName,
					version: '1.0.0',
					repository: typeofRepository === 'object' ? { type: 'git', url: inputValue } : inputValue
				};

				if ( isAsync ) {
					vi.mocked( getPackageJson ).mockResolvedValue( mockPackageJson );

					await expect( getRepositoryUrl( mockCwd, { async: true } ) ).resolves.toBe( expected );

					expect( vi.mocked( getPackageJson ) ).toHaveBeenCalledWith(
						mockCwd,
						expect.objectContaining( { async: true } )
					);
				} else {
					vi.mocked( getPackageJson ).mockReturnValue( mockPackageJson );

					expect( getRepositoryUrl( mockCwd ) ).toBe( expected );
					expect( vi.mocked( getPackageJson ) ).toHaveBeenCalledWith( mockCwd );
				}
			} );
		} );
	} );
} );
