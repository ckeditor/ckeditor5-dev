/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { tools } from '@ckeditor/ckeditor5-dev-utils';
import pacote from 'pacote';
import getChangelog from '../../lib/utils/getchangelog.js';
import getPackageJson from '../../lib/utils/getpackagejson.js';

import {
	getLastFromChangelog,
	getLastPreRelease,
	getLastNightly,
	getNextPreRelease,
	getNextNightly,
	getLastTagFromGit,
	getCurrent
} from '../../lib/utils/versions.js';

vi.mock( '@ckeditor/ckeditor5-dev-utils' );
vi.mock( 'pacote' );
vi.mock( '../../lib/utils/getchangelog.js' );
vi.mock( '../../lib/utils/getpackagejson.js' );

describe( 'versions', () => {
	describe( 'getLastFromChangelog()', () => {
		it( 'returns null if the changelog is invalid', () => {
			vi.mocked( getChangelog ).mockReturnValue( 'Example changelog.' );

			expect( getLastFromChangelog() ).to.equal( null );
		} );

		it( 'returns version from changelog #1', () => {
			vi.mocked( getChangelog ).mockReturnValue( '\n## [1.0.0](...) (2017-04-05)\nSome changelog entry.\n\n## 0.0.1' );

			expect( getLastFromChangelog() ).to.equal( '1.0.0' );
		} );

		it( 'returns version from changelog #2', () => {
			vi.mocked( getChangelog ).mockReturnValue( '\n## 1.0.0 (2017-04-05)\nSome changelog entry.' );

			expect( getLastFromChangelog() ).to.equal( '1.0.0' );
		} );

		it( 'returns version from changelog #3', () => {
			vi.mocked( getChangelog ).mockReturnValue( '\n## [1.0.0-alpha](...) (2017-04-05)\nSome changelog entry.\n\n## 0.0.1' );

			expect( getLastFromChangelog() ).to.equal( '1.0.0-alpha' );
		} );

		it( 'returns version from changelog #4', () => {
			vi.mocked( getChangelog ).mockReturnValue( '\n## 1.0.0-alpha (2017-04-05)\nSome changelog entry.' );

			expect( getLastFromChangelog() ).to.equal( '1.0.0-alpha' );
		} );

		it( 'returns version from changelog #5', () => {
			vi.mocked( getChangelog ).mockReturnValue( '\n## [1.0.0-alpha+001](...) (2017-04-05)\nSome changelog entry.\n\n## 0.0.1' );

			expect( getLastFromChangelog() ).to.equal( '1.0.0-alpha+001' );
		} );

		it( 'returns version from changelog #6', () => {
			vi.mocked( getChangelog ).mockReturnValue( '\n## 1.0.0-alpha+001 (2017-04-05)\nSome changelog entry.' );

			expect( getLastFromChangelog() ).to.equal( '1.0.0-alpha+001' );
		} );

		it( 'returns version from changelog #7', () => {
			vi.mocked( getChangelog ).mockReturnValue( '\n## [1.0.0-beta.2](...) (2017-04-05)\nSome changelog entry.\n\n## 0.0.1' );

			expect( getLastFromChangelog() ).to.equal( '1.0.0-beta.2' );
		} );

		it( 'returns version from changelog #8', () => {
			vi.mocked( getChangelog ).mockReturnValue( '\n## 1.0.0-beta.2 (2017-04-05)\nSome changelog entry.' );

			expect( getLastFromChangelog() ).to.equal( '1.0.0-beta.2' );
		} );

		it( 'returns version from changelog #9', () => {
			vi.mocked( getChangelog ).mockReturnValue( '\n## 1.0.0\nSome changelog entry.' );

			expect( getLastFromChangelog() ).to.equal( '1.0.0' );
		} );

		it( 'returns null for empty changelog', () => {
			vi.mocked( getChangelog ).mockReturnValue( '' );

			expect( getLastFromChangelog() ).to.equal( null );
		} );

		it( 'returns null if changelog does not exist', () => {
			vi.mocked( getChangelog ).mockReturnValue( null );

			expect( getLastFromChangelog() ).to.equal( null );
		} );
	} );

	describe( 'getLastPreRelease()', () => {
		beforeEach( () => {
			vi.mocked( getPackageJson ).mockReturnValue( { name: 'ckeditor5' } );
		} );

		it( 'asks npm for all versions of a package', () => {
			vi.mocked( pacote ).packument.mockResolvedValue( {
				name: 'ckeditor5',
				versions: {}
			} );

			return getLastPreRelease( '42.0.0-alpha' )
				.then( () => {
					expect( vi.mocked( pacote ).packument ).toHaveBeenCalledTimes( 1 );
					expect( vi.mocked( pacote ).packument ).toHaveBeenCalledWith( 'ckeditor5' );
				} );
		} );

		it( 'returns null if there is no version for a package', () => {
			vi.mocked( pacote ).packument.mockRejectedValue();

			return getLastPreRelease( '42.0.0-alpha' )
				.then( result => {
					expect( result ).to.equal( null );
				} );
		} );

		it( 'returns null if there is no pre-release version matching the release identifier', () => {
			vi.mocked( pacote ).packument.mockResolvedValue( {
				name: 'ckeditor5',
				versions: {
					'0.0.0-nightly-20230615.0': {},
					'37.0.0-alpha.0': {},
					'37.0.0-alpha.1': {},
					'41.0.0': {},
					'42.0.0': {}
				}
			} );

			return getLastPreRelease( '42.0.0-alpha' )
				.then( result => {
					expect( result ).to.equal( null );
				} );
		} );

		it( 'returns last pre-release version matching the release identifier', () => {
			vi.mocked( pacote ).packument.mockResolvedValue( {
				name: 'ckeditor5',
				versions: {
					'0.0.0-nightly-20230615.0': {},
					'37.0.0-alpha.0': {},
					'37.0.0-alpha.1': {},
					'41.0.0': {},
					'42.0.0': {}
				}
			} );

			return getLastPreRelease( '37.0.0-alpha' )
				.then( result => {
					expect( result ).to.equal( '37.0.0-alpha.1' );
				} );
		} );

		it( 'returns last pre-release version matching the release identifier (non-chronological versions order)', () => {
			vi.mocked( pacote ).packument.mockResolvedValue( {
				name: 'ckeditor5',
				versions: {
					'0.0.0-nightly-20230615.0': {},
					'37.0.0-alpha.0': {},
					'37.0.0-alpha.2': {},
					'41.0.0': {},
					'42.0.0': {},
					'37.0.0-alpha.1': {}
				}
			} );

			return getLastPreRelease( '37.0.0-alpha' )
				.then( result => {
					expect( result ).to.equal( '37.0.0-alpha.2' );
				} );
		} );

		it( 'returns last pre-release version matching the release identifier (sequence numbers greater than 10)', () => {
			vi.mocked( pacote ).packument.mockResolvedValue( {
				name: 'ckeditor5',
				versions: {
					'0.0.0-nightly-20230615.0': {},
					'37.0.0-alpha.1': {},
					'37.0.0-alpha.2': {},
					'37.0.0-alpha.3': {},
					'41.0.0': {},
					'37.0.0-alpha.10': {},
					'37.0.0-alpha.11': {}
				}
			} );

			return getLastPreRelease( '37.0.0-alpha' )
				.then( result => {
					expect( result ).to.equal( '37.0.0-alpha.11' );
				} );
		} );

		it( 'returns last nightly version', () => {
			vi.mocked( pacote ).packument.mockResolvedValue( {
				name: 'ckeditor5',
				versions: {
					'0.0.0-nightly-20230614.0': {},
					'0.0.0-nightly-20230615.0': {},
					'0.0.0-nightly-20230615.1': {},
					'0.0.0-nightly-20230615.2': {},
					'0.0.0-nightly-20230616.0': {},
					'37.0.0-alpha.0': {},
					'37.0.0-alpha.2': {},
					'41.0.0': {},
					'42.0.0': {}
				}
			} );

			return getLastPreRelease( '0.0.0-nightly' )
				.then( result => {
					expect( result ).to.equal( '0.0.0-nightly-20230616.0' );
				} );
		} );

		it( 'returns last nightly version from a specified day', () => {
			vi.mocked( pacote ).packument.mockResolvedValue( {
				name: 'ckeditor5',
				versions: {
					'0.0.0-nightly-20230614.0': {},
					'0.0.0-nightly-20230615.0': {},
					'0.0.0-nightly-20230615.1': {},
					'0.0.0-nightly-20230615.2': {},
					'0.0.0-nightly-20230616.0': {},
					'37.0.0-alpha.0': {},
					'37.0.0-alpha.2': {},
					'41.0.0': {},
					'42.0.0': {}
				}
			} );

			return getLastPreRelease( '0.0.0-nightly-20230615' )
				.then( result => {
					expect( result ).to.equal( '0.0.0-nightly-20230615.2' );
				} );
		} );
	} );

	describe( 'getLastNightly()', () => {
		beforeEach( async () => {
			vi.mocked( getPackageJson ).mockReturnValue( { name: 'ckeditor5' } );
		} );

		it( 'returns last nightly pre-release version', () => {
			vi.mocked( pacote ).packument.mockResolvedValue( {
				name: 'ckeditor5',
				versions: {
					'0.0.0-nightly-20230613.0': {},
					'0.0.0-nightly-20230614.0': {},
					'0.0.0-nightly-20230614.1': {},
					'0.0.0-nightly-20230614.2': {},
					'0.0.0-nightly-20230615.0': {},
					'37.0.0-alpha.0': {},
					'42.0.0': {}
				}
			} );

			return getLastNightly()
				.then( result => {
					expect( result ).to.equal( '0.0.0-nightly-20230615.0' );
				} );
		} );
	} );

	describe( 'getNextPreRelease()', () => {
		beforeEach( async () => {
			vi.mocked( getPackageJson ).mockReturnValue( { name: 'ckeditor5' } );
		} );

		it( 'returns pre-release version with id = 0 if pre-release version was never published for the package yet', () => {
			vi.mocked( pacote ).packument.mockResolvedValue( {
				name: 'ckeditor5',
				versions: {
					'0.0.0-nightly-20230615.0': {},
					'37.0.0-alpha.0': {},
					'42.0.0': {}
				}
			} );

			return getNextPreRelease( '42.0.0-alpha' )
				.then( result => {
					expect( result ).to.equal( '42.0.0-alpha.0' );
				} );
		} );

		it( 'returns pre-release version with incremented id if older pre-release version was already published', () => {
			vi.mocked( pacote ).packument.mockResolvedValue( {
				name: 'ckeditor5',
				versions: {
					'0.0.0-nightly-20230615.0': {},
					'37.0.0-alpha.0': {},
					'42.0.0-alpha.5': {}
				}
			} );

			return getNextPreRelease( '42.0.0-alpha' )
				.then( result => {
					expect( result ).to.equal( '42.0.0-alpha.6' );
				} );
		} );

		it( 'returns nightly version with incremented id if older nightly version was already published', () => {
			vi.mocked( pacote ).packument.mockResolvedValue( {
				name: 'ckeditor5',
				versions: {
					'0.0.0-nightly-20230615.5': {},
					'37.0.0-alpha.0': {},
					'42.0.0': {}
				}
			} );

			return getNextPreRelease( '0.0.0-nightly' )
				.then( result => {
					expect( result ).to.equal( '0.0.0-nightly-20230615.6' );
				} );
		} );
	} );

	describe( 'getNextNightly()', () => {
		beforeEach( () => {
			vi.mocked( getPackageJson ).mockReturnValue( { name: 'ckeditor5' } );

			vi.useFakeTimers();
			vi.setSystemTime( new Date( '2023-06-15 12:00:00' ) );
		} );

		afterEach( () => {
			vi.useRealTimers();
		} );

		it( 'asks for a last nightly pre-release version', () => {
			vi.mocked( pacote ).packument.mockResolvedValue( {
				name: 'ckeditor5',
				versions: {
					'0.0.0-nightly-20230615.0': {},
					'37.0.0-alpha.0': {},
					'42.0.0': {}
				}
			} );

			return getNextNightly()
				.then( result => {
					expect( result ).to.equal( '0.0.0-nightly-20230615.1' );
				} );
		} );
	} );

	describe( 'getLastTagFromGit()', () => {
		it( 'returns last tag if exists', () => {
			vi.mocked( tools.shExec ).mockReturnValue( 'v1.0.0' );

			expect( getLastTagFromGit() ).to.equal( '1.0.0' );
		} );

		it( 'returns null if tags do not exist', () => {
			vi.mocked( tools.shExec ).mockReturnValue( '' );

			expect( getLastTagFromGit() ).to.equal( null );
		} );
	} );

	describe( 'getCurrent()', () => {
		it( 'returns current version from "package.json"', () => {
			vi.mocked( getPackageJson ).mockReturnValue( { version: '0.1.2' } );

			expect( getCurrent() ).to.equal( '0.1.2' );
		} );
	} );
} );
