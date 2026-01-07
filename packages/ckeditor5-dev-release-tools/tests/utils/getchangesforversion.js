/**
 * @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';
import getChangelog from '../../lib/utils/getchangelog.js';
import getChangesForVersion from '../../lib/utils/getchangesforversion.js';
import { CHANGELOG_HEADER } from '../../lib/utils/constants.js';

vi.mock( '../../lib/utils/getchangelog.js' );

describe( 'getChangesForVersion()', () => {
	beforeEach( () => {
		vi.spyOn( process, 'cwd' ).mockReturnValue( '/home/ckeditor' );
	} );

	it( 'returns changes for the first tag which is a link to the release (default cwd)', () => {
		const expectedChangelog = [
			'### Features',
			'',
			'* Cloned the main module. ([abcd123](https://github.com))'
		].join( '\n' );

		const changelog = [
			'## [0.1.0](https://github.com) (2017-01-13)',
			'',
			expectedChangelog
		].join( '\n' );

		vi.mocked( getChangelog ).mockReturnValue( CHANGELOG_HEADER + changelog );

		expect( getChangesForVersion( '0.1.0' ) ).to.equal( expectedChangelog );
		expect( getChangelog ).toHaveBeenCalledExactlyOnceWith( '/home/ckeditor' );
	} );

	it( 'returns changes for the first tag which is a link to the release (a custom cwd)', () => {
		const expectedChangelog = [
			'### Features',
			'',
			'* Cloned the main module. ([abcd123](https://github.com))'
		].join( '\n' );

		const changelog = [
			'## [0.1.0](https://github.com) (2017-01-13)',
			'',
			expectedChangelog
		].join( '\n' );

		vi.mocked( getChangelog ).mockReturnValue( CHANGELOG_HEADER + changelog );

		expect( getChangesForVersion( '0.1.0', '/custom/cwd' ) ).to.equal( expectedChangelog );
		expect( getChangelog ).toHaveBeenCalledExactlyOnceWith( '/custom/cwd' );
	} );

	it( 'returns changes if a specified version starts with the "v" letter', () => {
		const expectedChangelog = [
			'### Features',
			'',
			'* Cloned the main module. ([abcd123](https://github.com))'
		].join( '\n' );

		const changelog = [
			'## 0.1.0 (2017-01-13)',
			'',
			expectedChangelog
		].join( '\n' );

		vi.mocked( getChangelog ).mockReturnValue( CHANGELOG_HEADER + changelog );

		expect( getChangesForVersion( 'v0.1.0' ) ).to.equal( expectedChangelog );
	} );

	it( 'returns changes for the first tag which is not a link', () => {
		const expectedChangelog = [
			'### Features',
			'',
			'* Cloned the main module. ([abcd123](https://github.com))'
		].join( '\n' );

		const changelog = [
			'## 0.1.0 (2017-01-13)',
			'',
			expectedChangelog
		].join( '\n' );

		vi.mocked( getChangelog ).mockReturnValue( CHANGELOG_HEADER + changelog );

		expect( getChangesForVersion( '0.1.0' ) ).to.equal( expectedChangelog );
	} );

	it( 'returns changes between tags', () => {
		const expectedChangelog = [
			'### Features',
			'',
			'* Cloned the main module. ([abcd123](https://github.com))',
			'',
			'### BREAKING CHANGE',
			'',
			'* Bump the major!'
		].join( '\n' );

		const changelog = [
			'## [1.0.0](https://github.com/) (2017-01-13)',
			'',
			expectedChangelog,
			'',
			'## [0.1.0](https://github.com) (2017-01-13)',
			'',
			'### Features',
			'',
			'* Cloned the main module. ([abcd123](https://github.com))'
		].join( '\n' );

		vi.mocked( getChangelog ).mockReturnValue( CHANGELOG_HEADER + changelog );

		expect( getChangesForVersion( '1.0.0' ) ).to.equal( expectedChangelog );
	} );

	it( 'returns null if cannot find changes for the specified version', () => {
		const changelog = [
			'## [0.1.0](https://github.com) (2017-01-13)',
			'',
			'### Features',
			'',
			'* Cloned the main module. ([abcd123](https://github.com))'
		].join( '\n' );

		vi.mocked( getChangelog ).mockReturnValue( CHANGELOG_HEADER + changelog );
		expect( getChangesForVersion( '1.0.0' ) ).to.equal( null );
	} );

	it( 'works when date is not specified', () => {
		const changelog = [
			'## 0.3.0',
			'',
			'Foo'
		].join( '\n' );

		vi.mocked( getChangelog ).mockReturnValue( CHANGELOG_HEADER + changelog );

		expect( getChangesForVersion( '0.3.0' ) ).to.equal( 'Foo' );
	} );

	it( 'captures correct range of changes (headers are URLs)', () => {
		const changelog = [
			'## [0.3.0](https://github.com) (2017-01-13)',
			'',
			'3',
			'',
			'Some text ## [like a release header]',
			'',
			'## [0.2.0](https://github.com) (2017-01-13)',
			'',
			'2',
			'',
			'## [0.1.0](https://github.com) (2017-01-13)',
			'',
			'1'
		].join( '\n' );

		vi.mocked( getChangelog ).mockReturnValue( CHANGELOG_HEADER + changelog );

		expect( getChangesForVersion( '0.3.0' ) ).to.equal( '3\n\nSome text ## [like a release header]' );
		expect( getChangesForVersion( '0.2.0' ) ).to.equal( '2' );
	} );

	it( 'captures correct range of changes (headers are plain text, "the initial" release check)', () => {
		const changelog = [
			'Changelog',
			'=========',
			'',
			'## 1.0.2 (2022-02-22)',
			'',
			'### Other changes',
			'',
			'* Other change for `1.0.2`.',
			'',
			'',
			'## 1.0.1 (2022-02-22)',
			'',
			'### Other changes',
			'',
			'* Other change for `1.0.1`.',
			'',
			'',
			'## 1.0.0 (2022-02-22)',
			'',
			'This is the initial release.'
		].join( '\n' );

		vi.mocked( getChangelog ).mockReturnValue( CHANGELOG_HEADER + changelog );

		expect( getChangesForVersion( '1.0.0' ) ).to.equal( 'This is the initial release.' );
	} );

	it( 'captures correct range of changes (headers are plain text, "middle" version check)', () => {
		const changelog = [
			'Changelog',
			'=========',
			'',
			'## 1.0.2 (2022-02-22)',
			'',
			'### Other changes',
			'',
			'* Other change for `1.0.2`.',
			'',
			'',
			'## 1.0.1 (2022-02-22)',
			'',
			'### Other changes',
			'',
			'* Other change for `1.0.1`.',
			'',
			'',
			'## 1.0.0 (2022-02-22)',
			'',
			'This is the initial release.'
		].join( '\n' );

		vi.mocked( getChangelog ).mockReturnValue( CHANGELOG_HEADER + changelog );

		expect( getChangesForVersion( '1.0.1' ) ).to.equal( [
			'### Other changes',
			'',
			'* Other change for `1.0.1`.'
		].join( '\n' ) );
	} );

	it( 'captures correct range of changes (headers are plain text, "the latest" check)', () => {
		const changelog = [
			'Changelog',
			'=========',
			'',
			'## 1.0.2 (2022-02-22)',
			'',
			'### Other changes',
			'',
			'* Other change for `1.0.2`.',
			'',
			'',
			'## 1.0.1 (2022-02-22)',
			'',
			'### Other changes',
			'',
			'* Other change for `1.0.1`.',
			'',
			'',
			'## 1.0.0 (2022-02-22)',
			'',
			'This is the initial release.'
		].join( '\n' );

		vi.mocked( getChangelog ).mockReturnValue( CHANGELOG_HEADER + changelog );

		expect( getChangesForVersion( '1.0.2' ) ).to.equal( [
			'### Other changes',
			'',
			'* Other change for `1.0.2`.'
		].join( '\n' ) );
	} );
} );

