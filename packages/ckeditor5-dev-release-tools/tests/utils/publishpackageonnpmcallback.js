/**
 * @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import fs from 'node:fs/promises';
import { tools } from '@ckeditor/ckeditor5-dev-utils';
import publishPackageOnNpmCallback from '../../lib/utils/publishpackageonnpmcallback.js';

vi.mock( 'fs/promises' );
vi.mock( '@ckeditor/ckeditor5-dev-utils' );

describe( 'publishPackageOnNpmCallback()', () => {
	beforeEach( () => {
		vi.mocked( tools.shExec ).mockResolvedValue();
		vi.mocked( fs.rm ).mockResolvedValue();
	} );

	it( 'should publish package on npm with provided npm tag', () => {
		const packagePath = '/workspace/ckeditor5/packages/ckeditor5-foo';

		return publishPackageOnNpmCallback( packagePath, { npmTag: 'nightly' } )
			.then( () => {
				expect( tools.shExec ).toHaveBeenCalledTimes( 1 );
				expect( tools.shExec ).toHaveBeenCalledWith(
					'npm publish --access=public --tag nightly',
					expect.objectContaining( {
						cwd: packagePath
					} )
				);
			} );
	} );

	it( 'should publish packages on npm asynchronously', () => {
		const packagePath = '/workspace/ckeditor5/packages/ckeditor5-foo';

		return publishPackageOnNpmCallback( packagePath, { npmTag: 'nightly' } )
			.then( () => {
				expect( tools.shExec ).toHaveBeenCalledTimes( 1 );
				expect( tools.shExec ).toHaveBeenCalledWith(
					expect.anything(),
					expect.objectContaining( {
						async: true
					} )
				);
			} );
	} );

	it( 'should set the verbosity level to "silent" during publishing packages', () => {
		const packagePath = '/workspace/ckeditor5/packages/ckeditor5-foo';

		return publishPackageOnNpmCallback( packagePath, { npmTag: 'nightly' } )
			.then( () => {
				expect( tools.shExec ).toHaveBeenCalledTimes( 1 );
				expect( tools.shExec ).toHaveBeenCalledWith(
					expect.anything(),
					expect.objectContaining( {
						verbosity: 'silent'
					} )
				);
			} );
	} );

	it( 'should remove package directory after publishing on npm', () => {
		const packagePath = '/workspace/ckeditor5/packages/ckeditor5-foo';

		return publishPackageOnNpmCallback( packagePath, { npmTag: 'nightly' } )
			.then( () => {
				expect( fs.rm ).toHaveBeenCalledTimes( 1 );
				expect( fs.rm ).toHaveBeenCalledWith( packagePath, expect.anything() );
			} );
	} );

	it( 'should not remove a package directory and not throw error when publishing on npm failed with code 409', async () => {
		vi.mocked( tools.shExec ).mockRejectedValue( new Error( 'code E409' ) );

		const packagePath = '/workspace/ckeditor5/packages/ckeditor5-foo';

		await publishPackageOnNpmCallback( packagePath, { npmTag: 'nightly' } );

		expect( fs.rm ).not.toHaveBeenCalled();
	} );
} );
