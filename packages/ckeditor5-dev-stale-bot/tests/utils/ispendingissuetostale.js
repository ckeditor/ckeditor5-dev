/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

const expect = require( 'chai' ).expect;
const sinon = require( 'sinon' );
const proxyquire = require( 'proxyquire' );

describe( 'dev-stale-bot/lib/utils', () => {
	describe( 'isPendingIssueToStale', () => {
		let isPendingIssueToStale, issueBase, optionsBase, stubs;
		let staleDatePendingIssue, afterStaleDatePendingIssue, beforeStaleDatePendingIssue;

		beforeEach( () => {
			staleDatePendingIssue = '2022-12-01T00:00:00Z';
			afterStaleDatePendingIssue = '2022-12-01T00:00:01Z';
			beforeStaleDatePendingIssue = '2022-11-30T23:59:59Z';

			issueBase = {
				lastComment: null
			};

			optionsBase = {
				staleDatePendingIssue
			};

			stubs = {
				isPendingIssueStale: sinon.stub()
			};

			isPendingIssueToStale = proxyquire( '../../lib/utils/ispendingissuetostale', {
				'./ispendingissuestale': stubs.isPendingIssueStale
			} );
		} );

		it( 'should be a function', () => {
			expect( isPendingIssueToStale ).to.be.a( 'function' );
		} );

		it( 'should check if issue is stale', () => {
			isPendingIssueToStale( issueBase, optionsBase );

			expect( stubs.isPendingIssueStale.calledOnce ).to.equal( true );
			expect( stubs.isPendingIssueStale.getCall( 0 ).args[ 0 ] ).to.equal( issueBase );
			expect( stubs.isPendingIssueStale.getCall( 0 ).args[ 1 ] ).to.equal( optionsBase );
		} );

		it( 'should return false if issue is already stale', () => {
			stubs.isPendingIssueStale.returns( true );

			expect( isPendingIssueToStale( issueBase, optionsBase ) ).to.be.false;
		} );

		it( 'should return false if issue does not have any comment', () => {
			stubs.isPendingIssueStale.returns( false );

			expect( isPendingIssueToStale( issueBase, optionsBase ) ).to.be.false;
		} );

		it( 'should return false if last comment was created by a community member', () => {
			stubs.isPendingIssueStale.returns( false );
			issueBase.lastComment = {
				isExternal: true
			};

			expect( isPendingIssueToStale( issueBase, optionsBase ) ).to.be.false;
		} );

		it( 'should return false if last comment was created by a team member and time to stale has not passed', () => {
			stubs.isPendingIssueStale.returns( false );
			issueBase.lastComment = {
				isExternal: false,
				createdAt: afterStaleDatePendingIssue
			};

			expect( isPendingIssueToStale( issueBase, optionsBase ) ).to.be.false;
		} );

		it( 'should return true if last comment was created by a team member and time to stale has passed', () => {
			stubs.isPendingIssueStale.returns( false );
			issueBase.lastComment = {
				isExternal: false,
				createdAt: beforeStaleDatePendingIssue
			};

			expect( isPendingIssueToStale( issueBase, optionsBase ) ).to.be.true;
		} );
	} );
} );
