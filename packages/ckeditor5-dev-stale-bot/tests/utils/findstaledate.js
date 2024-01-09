/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

const expect = require( 'chai' ).expect;
const findStaleDate = require( '../../lib/utils/findstaledate' );

describe( 'dev-stale-bot/lib/utils', () => {
	describe( 'findStaleDate', () => {
		let optionsBase;

		beforeEach( () => {
			optionsBase = {
				staleLabels: [ 'status:stale' ]
			};
		} );

		it( 'should be a function', () => {
			expect( findStaleDate ).to.be.a( 'function' );
		} );

		it( 'should return date when stale label was set', () => {
			const issue = {
				timelineItems: [
					{ eventDate: '2022-12-01T00:00:00Z', label: 'status:stale' }
				]
			};

			expect( findStaleDate( issue, optionsBase ) ).to.equal( '2022-12-01T00:00:00Z' );
		} );

		it( 'should return date when stale label was set if issue has multiple different events', () => {
			const issue = {
				timelineItems: [
					{ eventDate: '2022-11-01T00:00:00Z' },
					{ eventDate: '2022-11-02T00:00:00Z', label: 'label:foo' },
					{ eventDate: '2022-11-03T00:00:00Z' },
					{ eventDate: '2022-12-01T00:00:00Z', label: 'status:stale' },
					{ eventDate: '2022-12-02T00:00:00Z' },
					{ eventDate: '2022-12-03T00:00:00Z', label: 'label:bar' }
				]
			};

			expect( findStaleDate( issue, optionsBase ) ).to.equal( '2022-12-01T00:00:00Z' );
		} );

		it( 'should return most recent date when stale label was set if issue has multiple stale label events', () => {
			const issue = {
				timelineItems: [
					{ eventDate: '2022-12-02T00:00:00Z', label: 'status:stale' },
					{ eventDate: '2022-12-03T00:00:00Z', label: 'status:stale' },
					{ eventDate: '2022-12-04T00:00:00Z', label: 'status:stale' },
					{ eventDate: '2022-12-01T00:00:00Z', label: 'status:stale' },
					{ eventDate: '2022-12-06T00:00:00Z', label: 'status:stale' },
					{ eventDate: '2022-12-05T00:00:00Z', label: 'status:stale' }
				]
			};

			expect( findStaleDate( issue, optionsBase ) ).to.equal( '2022-12-06T00:00:00Z' );
		} );
	} );
} );
