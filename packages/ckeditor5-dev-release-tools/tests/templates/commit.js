/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { beforeEach, describe, expect, it } from 'vitest';
import { fileURLToPath } from 'url';
import fs from 'fs';
import path from 'upath';
import handlebars from 'handlebars';

const __filename = fileURLToPath( import.meta.url );
const __dirname = path.dirname( __filename );

const templatePath = path.resolve( __dirname, '..', '..', 'lib', 'templates', 'commit.hbs' );
const templateContent = fs.readFileSync( templatePath, 'utf-8' );

describe( 'dev-release-tools/changelog/templates', () => {
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

			const expectedEntry = '* Test ([commit](https://github.com/organization/repository/commit/1234qwe))';
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

			const expectedEntry = '* Test ([commit](https://github.com/organization/repository/commit/1234qwe))';
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

			const expectedEntry = '* Test ([commit](https://github.com/organization/repository/commit/1234qwe))' +
				'\n\n  Some paragraph.\n\n  * List Item 1.\n  * List Item 2.';
			expect( template( data, templateOptions ) ).to.equal( expectedEntry + '\n' );
		} );

		it( 'hides the commit hash', () => {
			rootOptions.skipCommitsLink = true;

			const data = { subject: 'Test', hash: '1234qwe' };

			const expectedEntry = '* Test';
			expect( template( data, templateOptions ) ).to.equal( expectedEntry + '\n' );
		} );

		it( 'adds a scope if specified', () => {
			rootOptions.linkReferences = false;

			const data = {
				subject: 'Test',
				hash: '1234qwe',
				scope: [
					'ckeditor5-dev'
				]
			};

			const expectedEntry = '* **ckeditor5-dev**: Test 1234qwe';
			expect( template( data, templateOptions ) ).to.equal( expectedEntry + '\n' );
		} );
	} );
} );
