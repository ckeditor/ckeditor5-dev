/**
 * @license Copyright (c) 2003-2023, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

const expect = require( 'chai' ).expect;
const sinon = require( 'sinon' );
const proxyquire = require( 'proxyquire' );

describe( 'dev-stale-bot/lib/utils', () => {
	describe( 'isIssueOrPullRequestToUnstale', () => {
		let isIssueOrPullRequestToUnstale, staleDate, issueBase, optionsBase, stubs;

		beforeEach( () => {
			staleDate = '2022-12-01T00:00:00Z';

			issueBase = {};

			optionsBase = {};

			stubs = {
				findStaleDate: sinon.stub().returns( staleDate ),
				isIssueOrPullRequestActive: sinon.stub()
			};

			isIssueOrPullRequestToUnstale = proxyquire( '../../lib/utils/isissueorpullrequesttounstale', {
				'./findstaledate': stubs.findStaleDate,
				'./isissueorpullrequestactive': stubs.isIssueOrPullRequestActive
			} );
		} );

		it( 'should be a function', () => {
			expect( isIssueOrPullRequestToUnstale ).to.be.a( 'function' );
		} );

		it( 'should get the stale date from issue activity', () => {
			isIssueOrPullRequestToUnstale( issueBase, optionsBase );

			expect( stubs.findStaleDate.calledOnce ).to.equal( true );
			expect( stubs.findStaleDate.getCall( 0 ).args[ 0 ] ).to.equal( issueBase );
			expect( stubs.findStaleDate.getCall( 0 ).args[ 1 ] ).to.equal( optionsBase );
		} );

		it( 'should check issue activity', () => {
			isIssueOrPullRequestToUnstale( issueBase, optionsBase );

			expect( stubs.isIssueOrPullRequestActive.calledOnce ).to.equal( true );
			expect( stubs.isIssueOrPullRequestActive.getCall( 0 ).args[ 0 ] ).to.equal( issueBase );
			expect( stubs.isIssueOrPullRequestActive.getCall( 0 ).args[ 1 ] ).to.equal( staleDate );
			expect( stubs.isIssueOrPullRequestActive.getCall( 0 ).args[ 2 ] ).to.equal( optionsBase );
		} );

		it( 'should return true if issue is active after stale date', () => {
			stubs.isIssueOrPullRequestActive.returns( true );

			expect( isIssueOrPullRequestToUnstale( issueBase, optionsBase ) ).to.be.true;
		} );

		it( 'should return false if issue is active after stale date', () => {
			stubs.isIssueOrPullRequestActive.returns( false );

			expect( isIssueOrPullRequestToUnstale( issueBase, optionsBase ) ).to.be.false;
		} );
	} );
} );
