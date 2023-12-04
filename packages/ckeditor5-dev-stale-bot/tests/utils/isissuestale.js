/**
 * @license Copyright (c) 2003-2023, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

const expect = require( 'chai' ).expect;
const isIssueStale = require( '../../lib/utils/isissuestale' );

describe( 'lib/utils/isissuestale', () => {
	let issueBase, optionsBase;

	beforeEach( () => {
		issueBase = {
			id: 'IssueId',
			number: 1,
			createdAt: '2022-11-30T09:00:00Z',
			lastEditedAt: null,
			lastReactedAt: null,
			timelineItems: []
		};

		optionsBase = {
			staleDate: '2022-12-01',
			ignoredActivityLogins: [],
			ignoredActivityLabels: []
		};
	} );

	it( 'should be a function', () => {
		expect( isIssueStale ).to.be.a( 'function' );
	} );

	it( 'should return true for issue created before stale date', () => {
		expect( isIssueStale( issueBase, optionsBase ) ).to.be.true;
	} );

	it( 'should return false for issue created after stale date', () => {
		const issue = {
			...issueBase,
			createdAt: '2022-12-01'
		};

		expect( isIssueStale( issue, optionsBase ) ).to.be.false;
	} );

	it( 'should return true for issue edited before stale date', () => {
		const issue = {
			...issueBase,
			lastEditedAt: '2022-11-30T19:00:00Z'
		};

		expect( isIssueStale( issue, optionsBase ) ).to.be.true;
	} );

	it( 'should return false for issue edited after stale date', () => {
		const issue = {
			...issueBase,
			lastEditedAt: '2022-12-01T19:00:00Z'
		};

		expect( isIssueStale( issue, optionsBase ) ).to.be.false;
	} );

	it( 'should return true for issue with reaction before stale date', () => {
		const issue = {
			...issueBase,
			lastReactedAt: '2022-11-30T19:00:00Z'
		};

		expect( isIssueStale( issue, optionsBase ) ).to.be.true;
	} );

	it( 'should return false for issue with reaction after stale date', () => {
		const issue = {
			...issueBase,
			lastReactedAt: '2022-12-01T19:00:00Z'
		};

		expect( isIssueStale( issue, optionsBase ) ).to.be.false;
	} );

	it( 'should return true for issue with all timeline events before stale date', () => {
		const issue = {
			...issueBase,
			timelineItems: [
				{ eventDate: '2022-11-29T19:00:00Z' },
				{ eventDate: '2022-11-30T19:00:00Z' }
			]
		};

		expect( isIssueStale( issue, optionsBase ) ).to.be.true;
	} );

	it( 'should return false for issue with some timeline events after stale date', () => {
		const issue = {
			...issueBase,
			timelineItems: [
				{ eventDate: '2022-11-30T19:00:00Z' },
				{ eventDate: '2022-12-01T19:00:00Z' }
			]
		};

		expect( isIssueStale( issue, optionsBase ) ).to.be.false;
	} );

	it( 'should return true for issue if timeline event is after the stale date but its author is ignored', () => {
		const issue = {
			...issueBase,
			timelineItems: [
				{ eventDate: '2022-11-30T19:00:00Z' },
				{ eventDate: '2022-12-01T19:00:00Z', author: 'CKEditorBot' }
			]
		};

		const options = {
			...optionsBase,
			ignoredActivityLogins: [ 'CKEditorBot' ]
		};

		expect( isIssueStale( issue, options ) ).to.be.true;
	} );

	it( 'should return false for issue if timeline event is after the stale date and its author is not ignored', () => {
		const issue = {
			...issueBase,
			timelineItems: [
				{ eventDate: '2022-11-30T19:00:00Z' },
				{ eventDate: '2022-12-01T19:00:00Z', author: 'RandomUser' }
			]
		};

		const options = {
			...optionsBase,
			ignoredActivityLogins: [ 'CKEditorBot' ]
		};

		expect( isIssueStale( issue, options ) ).to.be.false;
	} );

	it( 'should return true for issue if timeline event is after the stale date but label is ignored', () => {
		const issue = {
			...issueBase,
			timelineItems: [
				{ eventDate: '2022-11-30T19:00:00Z' },
				{ eventDate: '2022-12-01T19:00:00Z', label: 'status:stale' }
			]
		};

		const options = {
			...optionsBase,
			ignoredActivityLabels: [ 'status:stale' ]
		};

		expect( isIssueStale( issue, options ) ).to.be.true;
	} );

	it( 'should return false for issue if timeline event is after the stale date and label is not ignored', () => {
		const issue = {
			...issueBase,
			timelineItems: [
				{ eventDate: '2022-11-30T19:00:00Z' },
				{ eventDate: '2022-12-01T19:00:00Z', label: 'status:in-progress' }
			]
		};

		const options = {
			...optionsBase,
			ignoredActivityLabels: [ 'status:stale' ]
		};

		expect( isIssueStale( issue, options ) ).to.be.false;
	} );
} );
