/**
 * @license Copyright (c) 2003-2023, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

const expect = require( 'chai' ).expect;
const sinon = require( 'sinon' );
const proxyquire = require( 'proxyquire' );

describe( 'dev-stale-bot/lib/utils', () => {
	describe( 'isIssueOrPullRequestToClose', () => {
		let isIssueOrPullRequestToClose, staleDate, afterStaleDate, beforeStaleDate, issueBase, optionsBase, stubs;

		beforeEach( () => {
			staleDate = '2022-12-01T00:00:00Z';
			afterStaleDate = '2022-12-01T00:00:01Z';
			beforeStaleDate = '2022-11-30T23:59:59Z';

			issueBase = {};

			optionsBase = {
				closeDate: staleDate
			};

			stubs = {
				findStaleDate: sinon.stub().returns( staleDate ),
				isIssueOrPullRequestActive: sinon.stub()
			};

			isIssueOrPullRequestToClose = proxyquire( '../../lib/utils/isissueorpullrequesttoclose', {
				'./findstaledate': stubs.findStaleDate,
				'./isissueorpullrequestactive': stubs.isIssueOrPullRequestActive
			} );
		} );

		it( 'should be a function', () => {
			expect( isIssueOrPullRequestToClose ).to.be.a( 'function' );
		} );

		it( 'should get the stale date from issue activity', () => {
			isIssueOrPullRequestToClose( issueBase, optionsBase );

			expect( stubs.findStaleDate.calledOnce ).to.equal( true );
			expect( stubs.findStaleDate.getCall( 0 ).args[ 0 ] ).to.equal( issueBase );
			expect( stubs.findStaleDate.getCall( 0 ).args[ 1 ] ).to.equal( optionsBase );
		} );

		it( 'should not check issue activity if time to close has not passed', () => {
			optionsBase.closeDate = beforeStaleDate;

			isIssueOrPullRequestToClose( issueBase, optionsBase );

			expect( stubs.isIssueOrPullRequestActive.called ).to.equal( false );
		} );

		it( 'should check issue activity if time to close has passed', () => {
			optionsBase.closeDate = afterStaleDate;

			isIssueOrPullRequestToClose( issueBase, optionsBase );

			expect( stubs.isIssueOrPullRequestActive.calledOnce ).to.equal( true );
			expect( stubs.isIssueOrPullRequestActive.getCall( 0 ).args[ 0 ] ).to.equal( issueBase );
			expect( stubs.isIssueOrPullRequestActive.getCall( 0 ).args[ 1 ] ).to.equal( staleDate );
			expect( stubs.isIssueOrPullRequestActive.getCall( 0 ).args[ 2 ] ).to.equal( optionsBase );
		} );

		it( 'should return true if issue is not active after stale date and time to close has passed', () => {
			optionsBase.closeDate = afterStaleDate;
			stubs.isIssueOrPullRequestActive.returns( false );

			expect( isIssueOrPullRequestToClose( issueBase, optionsBase ) ).to.be.true;
		} );

		it( 'should return false if issue is not active after stale date and time to close has not passed', () => {
			optionsBase.closeDate = beforeStaleDate;
			stubs.isIssueOrPullRequestActive.returns( false );

			expect( isIssueOrPullRequestToClose( issueBase, optionsBase ) ).to.be.false;
		} );

		it( 'should return false if issue is active after stale date and time to close has passed', () => {
			optionsBase.closeDate = afterStaleDate;
			stubs.isIssueOrPullRequestActive.returns( true );

			expect( isIssueOrPullRequestToClose( issueBase, optionsBase ) ).to.be.false;
		} );

		it( 'should return false if issue is active after stale date and time to close has not passed', () => {
			optionsBase.closeDate = beforeStaleDate;
			stubs.isIssueOrPullRequestActive.returns( true );

			expect( isIssueOrPullRequestToClose( issueBase, optionsBase ) ).to.be.false;
		} );
	} );
} );
