/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';
import shellEscape from 'shell-escape';
import { tools } from '@ckeditor/ckeditor5-dev-utils';
import { glob } from 'glob';
import commitAndTag from '../../lib/tasks/commitandtag.js';

vi.mock( 'glob' );
vi.mock( 'shell-escape' );
vi.mock( '@ckeditor/ckeditor5-dev-utils' );

describe( 'commitAndTag()', () => {
	beforeEach( () => {
		vi.mocked( glob ).mockResolvedValue( [] );
		vi.mocked( shellEscape ).mockImplementation( v => v[ 0 ] );
	} );

	it( 'should not create a commit and tag if there are no files modified', async () => {
		await commitAndTag( {} );

		expect( vi.mocked( tools.shExec ) ).not.toHaveBeenCalled();
	} );

	it( 'should allow to specify custom cwd', async () => {
		vi.mocked( glob ).mockResolvedValue( [ 'package.json' ] );

		await commitAndTag( { version: '1.0.0', cwd: 'my-cwd' } );

		expect( vi.mocked( tools.shExec ).mock.calls[ 0 ][ 1 ].cwd ).to.deep.equal( 'my-cwd' );
		expect( vi.mocked( tools.shExec ).mock.calls[ 1 ][ 1 ].cwd ).to.deep.equal( 'my-cwd' );
		expect( vi.mocked( tools.shExec ).mock.calls[ 2 ][ 1 ].cwd ).to.deep.equal( 'my-cwd' );
	} );

	it( 'should add provided files to git one by one', async () => {
		vi.mocked( glob ).mockResolvedValue( [
			'package.json',
			'README.md',
			'packages/custom-package/package.json',
			'packages/custom-package/README.md'
		] );

		await commitAndTag( {
			version: '1.0.0',
			files: [ 'package.json', 'README.md', 'packages/*/package.json', 'packages/*/README.md' ]
		} );

		expect( vi.mocked( tools.shExec ) ).toHaveBeenCalledTimes( 6 );
		expect( vi.mocked( tools.shExec ).mock.calls[ 0 ][ 0 ] ).to.equal( 'git add package.json' );
		expect( vi.mocked( tools.shExec ).mock.calls[ 1 ][ 0 ] ).to.equal( 'git add README.md' );
		expect( vi.mocked( tools.shExec ).mock.calls[ 2 ][ 0 ] ).to.equal( 'git add packages/custom-package/package.json' );
		expect( vi.mocked( tools.shExec ).mock.calls[ 3 ][ 0 ] ).to.equal( 'git add packages/custom-package/README.md' );
	} );

	it( 'should set correct commit message', async () => {
		vi.mocked( glob ).mockResolvedValue( [ 'package.json' ] );

		await commitAndTag( { version: '1.0.0', packagesDirectory: 'packages' } );

		expect( vi.mocked( tools.shExec ).mock.calls[ 1 ][ 0 ] ).to.equal( 'git commit --message "Release: v1.0.0." --no-verify' );
	} );

	it( 'should set correct tag', async () => {
		vi.mocked( glob ).mockResolvedValue( [ 'package.json' ] );

		await commitAndTag( { version: '1.0.0', packagesDirectory: 'packages' } );

		expect( vi.mocked( tools.shExec ).mock.calls[ 2 ][ 0 ] ).to.equal( 'git tag v1.0.0' );
	} );

	it( 'should escape arguments passed to a shell command', async () => {
		vi.mocked( glob ).mockResolvedValue( [
			'package.json',
			'README.md',
			'packages/custom-package/package.json',
			'packages/custom-package/README.md'
		] );

		await commitAndTag( {
			version: '1.0.0',
			files: [ 'package.json', 'README.md', 'packages/*/package.json', 'packages/*/README.md' ]
		} );

		expect( vi.mocked( shellEscape ) ).toHaveBeenCalledTimes( 5 );
		expect( vi.mocked( shellEscape ).mock.calls[ 0 ][ 0 ] ).to.deep.equal( [ 'package.json' ] );
		expect( vi.mocked( shellEscape ).mock.calls[ 1 ][ 0 ] ).to.deep.equal( [ 'README.md' ] );
		expect( vi.mocked( shellEscape ).mock.calls[ 2 ][ 0 ] ).to.deep.equal( [ 'packages/custom-package/package.json' ] );
		expect( vi.mocked( shellEscape ).mock.calls[ 3 ][ 0 ] ).to.deep.equal( [ 'packages/custom-package/README.md' ] );
		expect( vi.mocked( shellEscape ).mock.calls[ 4 ][ 0 ] ).to.deep.equal( [ '1.0.0' ] );
	} );
} );
