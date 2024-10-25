/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import fs from 'fs-extra';
import { tools } from '@ckeditor/ckeditor5-dev-utils';
import publishPackageOnNpmCallback from '../../lib/utils/publishpackageonnpmcallback.js';

vi.mock( 'fs-extra' );
vi.mock( '@ckeditor/ckeditor5-dev-utils' );

describe( 'publishPackageOnNpmCallback()', () => {
	beforeEach( () => {
		vi.mocked( tools.shExec ).mockResolvedValue();
		vi.mocked( fs.remove ).mockResolvedValue();
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

	// See: https://github.com/ckeditor/ckeditor5/issues/17322.
	it( 'should not remove package directory after publishing on npm', async () => {
		const packagePath = '/workspace/ckeditor5/packages/ckeditor5-foo';

		await publishPackageOnNpmCallback( packagePath, { npmTag: 'nightly' } );

		expect( fs.remove ).not.toHaveBeenCalled();
	} );

	// See: https://github.com/ckeditor/ckeditor5/issues/17120
	it( 'should not remove a package directory and not throw error when publishing on npm failed', async () => {
		vi.mocked( tools.shExec ).mockRejectedValue( new Error( 'I failed because I can' ) );

		const packagePath = '/workspace/ckeditor5/packages/ckeditor5-foo';

		await publishPackageOnNpmCallback( packagePath, { npmTag: 'nightly' } );

		expect( fs.remove ).not.toHaveBeenCalled();
	} );
} );
