/**
 * @license Copyright (c) 2003-2020, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const fs = require( 'fs' );
const path = require( 'path' );
const handlebars = require( 'handlebars' );
const expect = require( 'chai' ).expect;

const templatePath = path.resolve( __dirname, '..', '..', '..', 'lib', 'release-tools', 'templates', 'commit.hbs' );
const templateContent = fs.readFileSync( templatePath, 'utf-8' );

describe( 'dev-env/release-tools/changelog/templates', () => {
	let template, templateOptions, rootOptions;

	beforeEach( () => {
		template = handlebars.compile( templateContent );

		rootOptions = {
			host: 'https://github.com',
			owner: 'organization',
			repoUrl: 'https://github.com/organization/repository',
			repository: 'repository',
			commit: 'commit',
			issue: 'issues',
			linkReferences: true,
			skipCommitsLink: false
		};
		templateOptions = {
			data: {
				root: rootOptions
			}
		};
	} );

	describe( 'commit', () => {
		it( 'displays commit subject and hash as a plain text', () => {
			rootOptions.linkReferences = false;

			const data = { subject: 'Test', hash: '1234qwe' };

			const expectedEntry = '* Test 1234qwe';
			expect( template( data, templateOptions ) ).to.equal( expectedEntry + '\n' );
		} );

		it( 'displays commit subject and hash as an URL to Github', () => {
			const data = { subject: 'Test', hash: '1234qwe' };

			const expectedEntry = '* Test ([1234qwe](https://github.com/organization/repository/commit/1234qwe))';
			expect( template( data, templateOptions ) ).to.equal( expectedEntry + '\n' );
		} );

		it( 'do not display references to itself repository', () => {
			const data = {
				subject: 'Test',
				hash: '1234qwe',
				references: [
					{
						issue: 2
					},
					{
						issue: 3
					}
				]
			};

			const expectedEntry = '* Test ([1234qwe](https://github.com/organization/repository/commit/1234qwe))';
			expect( template( data, templateOptions ) ).to.equal( expectedEntry + '\n' );
		} );

		it( 'displays additional description for the commit', () => {
			const data = {
				subject: 'Test',
				hash: '1234qwe',
				body: [
					'  Some paragraph.',
					'',
					'  * List Item 1.',
					'  * List Item 2.'
				].join( '\n' )
			};

			const expectedEntry = '* Test ([1234qwe](https://github.com/organization/repository/commit/1234qwe))' +
				'\n\n  Some paragraph.\n\n  * List Item 1.\n  * List Item 2.';
			expect( template( data, templateOptions ) ).to.equal( expectedEntry + '\n' );
		} );

		it( 'hides the commit hash', () => {
			rootOptions.skipCommitsLink = true;

			const data = { subject: 'Test', hash: '1234qwe' };

			const expectedEntry = '* Test';
			expect( template( data, templateOptions ) ).to.equal( expectedEntry + '\n' );
		} );
	} );
} );
