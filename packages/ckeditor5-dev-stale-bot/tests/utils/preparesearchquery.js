/**
 * @license Copyright (c) 2003-2023, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

const expect = require( 'chai' ).expect;
const prepareSearchQuery = require( '../../lib/utils/preparesearchquery' );

describe( 'dev-stale-bot/lib/utils', () => {
	describe( 'prepareSearchQuery', () => {
		it( 'should be a function', () => {
			expect( prepareSearchQuery ).to.be.a( 'function' );
		} );

		it( 'should prepare a query with repository slug', () => {
			expect( prepareSearchQuery( { repositorySlug: 'ckeditor/ckeditor5' } ) ).to.include( 'repo:ckeditor/ckeditor5' );
		} );

		it( 'should prepare a query for issue', () => {
			expect( prepareSearchQuery( { type: 'issue' } ) ).to.include( 'type:issue' );
		} );

		it( 'should prepare a query for pull request', () => {
			expect( prepareSearchQuery( { type: 'pr' } ) ).to.include( 'type:pr' );
		} );

		it( 'should prepare a query from specified date', () => {
			expect( prepareSearchQuery( { searchDate: '2022-12-01' } ) ).to.include( 'created:<2022-12-01' );
		} );

		it( 'should prepare a query for open items', () => {
			expect( prepareSearchQuery( {} ) ).to.include( 'state:open' );
		} );

		it( 'should prepare a query sorted in descending order by creation date', () => {
			expect( prepareSearchQuery( {} ) ).to.include( 'sort:created-desc' );
		} );

		it( 'should prepare a query with ignored labels', () => {
			const ignoredLabels = [
				'status:stale',
				'support:1',
				'support:2',
				'support:3',
				'domain:accessibility'
			];

			expect( prepareSearchQuery( { ignoredLabels } ) ).to.include(
				'-label:status:stale -label:support:1 -label:support:2 -label:support:3 -label:domain:accessibility'
			);
		} );

		it( 'should prepare a query with all fields separated by space', () => {
			const options = {
				type: 'issue',
				repositorySlug: 'ckeditor/ckeditor5',
				searchDate: '2022-12-01',
				ignoredLabels: [ 'status:stale' ]
			};

			expect( prepareSearchQuery( options ) ).to.include(
				'repo:ckeditor/ckeditor5 created:<2022-12-01 type:issue state:open sort:created-desc -label:status:stale'
			);
		} );
	} );
} );
