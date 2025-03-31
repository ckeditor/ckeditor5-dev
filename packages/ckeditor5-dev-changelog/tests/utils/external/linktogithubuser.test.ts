/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { describe, it, expect } from 'vitest';
import { linkToGitHubUser } from '../../../src/utils/external/linktogithubuser.js';

describe( 'linkToGitHubUser()', () => {
	it( 'makes a link to GitHub profile if a user was mentioned in a comment', () => {
		expect( linkToGitHubUser( 'Foo @CKSource Bar' ) )
			.to.equal( 'Foo [@CKSource](https://github.com/CKSource) Bar' );
	} );

	it( 'makes a link to GitHub profile if a user was mentioned in a comment at the beginning', () => {
		expect( linkToGitHubUser( '@CKSource Bar' ) )
			.to.equal( '[@CKSource](https://github.com/CKSource) Bar' );
	} );

	it( 'makes a link to GitHub profile if a user was mentioned at the beginning of a line', () => {
		expect( linkToGitHubUser( 'Foo\n@CKSource Bar' ) )
			.to.equal( 'Foo\n[@CKSource](https://github.com/CKSource) Bar' );
	} );

	it( 'makes a link to GitHub profile if a user was mentioned in a comment at the ending', () => {
		expect( linkToGitHubUser( 'Bar @CKSource' ) )
			.to.equal( 'Bar [@CKSource](https://github.com/CKSource)' );
	} );

	it( 'makes a link to GitHub profile if a user was mentioned in a bracket', () => {
		expect( linkToGitHubUser( 'Bar (@CKSource)' ) )
			.to.equal( 'Bar ([@CKSource](https://github.com/CKSource))' );
	} );

	it( 'does nothing if a comment contains scoped package name', () => {
		expect( linkToGitHubUser( 'Foo @ckeditor/ckeditor5-foo Bar' ) )
			.to.equal( 'Foo @ckeditor/ckeditor5-foo Bar' );
	} );

	it( 'does nothing if an email is inside the comment', () => {
		expect( linkToGitHubUser( 'Foo foo@bar.com Bar' ) )
			.to.equal( 'Foo foo@bar.com Bar' );
	} );

	it( 'does nothing if a user is already linked', () => {
		expect( linkToGitHubUser( 'Foo [@bar](https://github.com/bar) Bar' ) )
			.to.equal( 'Foo [@bar](https://github.com/bar) Bar' );
	} );
} );
