/**
 * @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { simpleGit } from 'simple-git';
import push from '../../lib/tasks/push.js';

vi.mock( 'simple-git' );

describe( 'push()', () => {
	let options, simpleGitMockInstance;

	beforeEach( () => {
		simpleGitMockInstance = {
			push: vi.fn(),
			raw: vi.fn()
		};

		vi.spyOn( process, 'cwd' ).mockReturnValue( 'current/working/dir' );
		vi.mocked( simpleGit ).mockReturnValue( simpleGitMockInstance );

		options = {
			releaseBranch: 'release',
			version: '1.3.5',
			cwd: 'custom-modified/working/dir'
		};
	} );

	it( 'should be a function', () => {
		expect( push ).to.be.a( 'function' );
	} );

	it( 'should use passed "cwd"', async () => {
		await push( options );

		expect( vi.mocked( simpleGit ) ).toHaveBeenCalledExactlyOnceWith( { baseDir: 'custom-modified/working/dir' } );
	} );

	it( 'should use "process.cwd()" if the "cwd" option was not used', async () => {
		delete options.cwd;

		await push( options );

		expect( vi.mocked( simpleGit ) ).toHaveBeenCalledExactlyOnceWith( { baseDir: 'current/working/dir' } );
	} );

	it( 'should push branch', async () => {
		await push( options );

		expect( vi.mocked( simpleGitMockInstance.push ) ).toHaveBeenCalledExactlyOnceWith( 'origin', 'release' );
	} );

	it( 'should push tag', async () => {
		await push( options );

		expect( vi.mocked( simpleGitMockInstance.raw ) ).toHaveBeenCalledExactlyOnceWith( 'push', 'origin', 'v1.3.5' );
	} );
} );
