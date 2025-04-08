/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { tools } from '@ckeditor/ckeditor5-dev-utils';
import shellEscape from 'shell-escape';
import push from '../../lib/tasks/push.js';

vi.mock( '@ckeditor/ckeditor5-dev-utils' );
vi.mock( 'shell-escape' );

describe( 'push()', () => {
	let options;
	beforeEach( () => {
		vi.spyOn( process, 'cwd' ).mockReturnValue( 'current/working/dir' );
		vi.mocked( shellEscape ).mockImplementation( v => v[ 0 ] );
		vi.mocked( tools.shExec ).mockResolvedValue();

		options = {
			releaseBranch: 'release',
			version: '1.3.5',
			cwd: 'custom-modified/working/dir'
		};
	} );

	it( 'should be a function', () => {
		expect( push ).to.be.a( 'function' );
	} );

	it( 'should execute command with correct arguments', async () => {
		await push( options );

		expect( vi.mocked( tools.shExec ) ).toHaveBeenCalledOnce();
		expect( vi.mocked( tools.shExec ) ).toHaveBeenCalledWith(
			'git push origin release v1.3.5',
			{
				cwd: 'custom-modified/working/dir',
				verbosity: 'error',
				async: true
			}
		);
	} );

	it( 'should use "process.cwd()" if the "cwd" option was not used', async () => {
		delete options.cwd;

		await push( options );

		expect( vi.mocked( tools.shExec ) ).toHaveBeenCalledExactlyOnceWith(
			'git push origin release v1.3.5',
			{
				cwd: 'current/working/dir',
				verbosity: 'error',
				async: true
			}
		);
	} );

	it( 'should escape arguments passed to a shell command', async () => {
		await push( options );

		expect( vi.mocked( shellEscape ) ).toHaveBeenCalledTimes( 2 );
		expect( vi.mocked( shellEscape ) ).toHaveBeenCalledWith( [ 'release' ] );
		expect( vi.mocked( shellEscape ) ).toHaveBeenCalledWith( [ 'v1.3.5' ] );
	} );
} );
