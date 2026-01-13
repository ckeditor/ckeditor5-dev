/**
 * @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { describe, it, expect } from 'vitest';
import prepareSearchQuery from '../../lib/utils/preparesearchquery.js';

describe( 'dev-stale-bot/lib/utils', () => {
	describe( 'prepareSearchQuery', () => {
		it( 'should be a function', () => {
			expect( prepareSearchQuery ).toBeInstanceOf( Function );
		} );

		it( 'should prepare a query with repository slug', () => {
			expect( prepareSearchQuery( { repositorySlug: 'ckeditor/ckeditor5' } ) ).toContain( 'repo:ckeditor/ckeditor5' );
		} );

		it( 'should prepare a query for issue', () => {
			expect( prepareSearchQuery( { type: 'Issue' } ) ).toContain( 'type:issue' );
		} );

		it( 'should prepare a query for pull request', () => {
			expect( prepareSearchQuery( { type: 'PullRequest' } ) ).toContain( 'type:pr' );
		} );

		it( 'should prepare a query for issue or pull request', () => {
			expect( prepareSearchQuery( {} ) ).not.toContain( 'type:' );
		} );

		it( 'should prepare a query from specified date', () => {
			expect( prepareSearchQuery( { searchDate: '2022-12-01' } ) ).toContain( 'created:<2022-12-01' );
		} );

		it( 'should prepare a query without specifying a start date', () => {
			expect( prepareSearchQuery( {} ) ).not.toContain( 'created:' );
		} );

		it( 'should prepare a query for open items', () => {
			expect( prepareSearchQuery( {} ) ).toContain( 'state:open' );
		} );

		it( 'should prepare a query sorted in descending order by creation date', () => {
			expect( prepareSearchQuery( {} ) ).toContain( 'sort:created-desc' );
		} );

		it( 'should prepare a query with ignored labels', () => {
			const ignoredLabels = [
				'status:stale',
				'support:1',
				'support:2',
				'support:3',
				'domain:accessibility'
			];

			expect( prepareSearchQuery( { ignoredLabels } ) ).toContain(
				'-label:status:stale -label:support:1 -label:support:2 -label:support:3 -label:domain:accessibility'
			);
		} );

		it( 'should prepare a query with searched labels', () => {
			const labels = [
				'status:stale',
				'type:bug'
			];

			expect( prepareSearchQuery( { labels } ) ).toContain( 'label:status:stale label:type:bug' );
		} );

		it( 'should prepare a query with all fields separated by space', () => {
			const options = {
				type: 'Issue',
				repositorySlug: 'ckeditor/ckeditor5',
				searchDate: '2022-12-01',
				labels: [ 'type:bug' ],
				ignoredLabels: [ 'status:stale' ]
			};

			expect( prepareSearchQuery( options ) ).toContain(
				'repo:ckeditor/ckeditor5 created:<2022-12-01 type:issue state:open sort:created-desc label:type:bug -label:status:stale'
			);
		} );
	} );
} );
