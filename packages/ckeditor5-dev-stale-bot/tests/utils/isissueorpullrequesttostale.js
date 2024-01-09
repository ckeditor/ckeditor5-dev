/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

const expect = require( 'chai' ).expect;
const sinon = require( 'sinon' );
const proxyquire = require( 'proxyquire' );

describe( 'dev-stale-bot/lib/utils', () => {
	describe( 'isIssueOrPullRequestToStale', () => {
		let isIssueOrPullRequestToStale, staleDate, issueBase, optionsBase, stubs;

		beforeEach( () => {
			staleDate = '2022-12-01T00:00:00Z';

			issueBase = {};

			optionsBase = {
				staleDate
			};

			stubs = {
				isIssueOrPullRequestActive: sinon.stub()
			};

			isIssueOrPullRequestToStale = proxyquire( '../../lib/utils/isissueorpullrequesttostale', {
				'./isissueorpullrequestactive': stubs.isIssueOrPullRequestActive
			} );
		} );

		it( 'should be a function', () => {
			expect( isIssueOrPullRequestToStale ).to.be.a( 'function' );
		} );

		it( 'should check issue activity', () => {
			isIssueOrPullRequestToStale( issueBase, optionsBase );

			expect( stubs.isIssueOrPullRequestActive.calledOnce ).to.equal( true );
			expect( stubs.isIssueOrPullRequestActive.getCall( 0 ).args[ 0 ] ).to.equal( issueBase );
			expect( stubs.isIssueOrPullRequestActive.getCall( 0 ).args[ 1 ] ).to.equal( staleDate );
			expect( stubs.isIssueOrPullRequestActive.getCall( 0 ).args[ 2 ] ).to.equal( optionsBase );
		} );

		it( 'should return true if issue is not active after stale date', () => {
			stubs.isIssueOrPullRequestActive.returns( false );

			expect( isIssueOrPullRequestToStale( issueBase, optionsBase ) ).to.be.true;
		} );

		it( 'should return false if issue is active after stale date', () => {
			stubs.isIssueOrPullRequestActive.returns( true );

			expect( isIssueOrPullRequestToStale( issueBase, optionsBase ) ).to.be.false;
		} );
	} );
} );
