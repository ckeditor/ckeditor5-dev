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

	it( 'should set the verbosity level to "error" during publishing packages', () => {
		const packagePath = '/workspace/ckeditor5/packages/ckeditor5-foo';

		return publishPackageOnNpmCallback( packagePath, { npmTag: 'nightly' } )
			.then( () => {
				expect( tools.shExec ).toHaveBeenCalledTimes( 1 );
				expect( tools.shExec ).toHaveBeenCalledWith(
					expect.anything(),
					expect.objectContaining( {
						verbosity: 'error'
					} )
				);
			} );
	} );

	it( 'should remove package directory after publishing on npm', () => {
		const packagePath = '/workspace/ckeditor5/packages/ckeditor5-foo';

		return publishPackageOnNpmCallback( packagePath, { npmTag: 'nightly' } )
			.then( () => {
				expect( fs.remove ).toHaveBeenCalledTimes( 1 );
				expect( fs.remove ).toHaveBeenCalledWith( packagePath );
			} );
	} );

	it( 'should throw when publishing on npm failed', () => {
		vi.mocked( tools.shExec ).mockRejectedValue( new Error( 'Unexpected error.' ) );

		const packagePath = '/workspace/ckeditor5/packages/ckeditor5-foo';

		return publishPackageOnNpmCallback( packagePath, { npmTag: 'nightly' } )
			.then(
				() => {
					throw new Error( 'Expected to be rejected.' );
				},
				error => {
					expect( error ).toBeInstanceOf( Error );
					expect( error.message ).toEqual( 'Unable to publish "ckeditor5-foo" package.' );
				}
			);
	} );

	it( 'should not remove a package directory when publishing on npm failed', () => {
		vi.mocked( tools.shExec ).mockRejectedValue( new Error( 'Unexpected error.' ) );

		const packagePath = '/workspace/ckeditor5/packages/ckeditor5-foo';

		return publishPackageOnNpmCallback( packagePath, { npmTag: 'nightly' } )
			.then(
				() => {
					throw new Error( 'Expected to be rejected.' );
				},
				() => {
					expect( fs.remove ).not.toHaveBeenCalled();
				}
			);
	} );

	it( 'should not remove a package directory and not throw error when publishing on npm failed with code 409', async () => {
		vi.mocked( tools.shExec ).mockRejectedValue( new Error( 'code E409' ) );

		const packagePath = '/workspace/ckeditor5/packages/ckeditor5-foo';

		await publishPackageOnNpmCallback( packagePath, { npmTag: 'nightly' } );

		expect( fs.remove ).not.toHaveBeenCalled();
	} );
} );
