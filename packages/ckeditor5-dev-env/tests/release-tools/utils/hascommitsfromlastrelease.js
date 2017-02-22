/**
 * @license Copyright (c) 2003-2017, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

/* jshint mocha:true */

'use strict';

const expect = require( 'chai' ).expect;
const sinon = require( 'sinon' );
const { tools } = require( '@ckeditor/ckeditor5-dev-utils' );

describe( 'dev-env/release-tools/utils', () => {
	let hasCommitsFromLastRelease, sandbox;

	beforeEach( () => {
		sandbox = sinon.sandbox.create();
	} );

	afterEach( () => {
		sandbox.restore();
	} );

	describe( 'hasCommitsFromLastRelease()', () => {
		beforeEach( () => {
			hasCommitsFromLastRelease = require( '../../../lib/release-tools/utils/hascommitsfromlastrelease' );
		} );

		it( 'returns true if a commit was made until the last tag', () => {
			const shExec = sandbox.stub( tools, 'shExec' );

			shExec.onFirstCall().returns( [
				'v0.0.2',
				'v0.0.3',
				'v0.0.4'
			].join( '\n' ) );

			shExec.onSecondCall().returns( '    2 ' );

			expect( hasCommitsFromLastRelease() ).to.equal( true );
		} );

		it( 'returns false if a commit was not made until the last tag', () => {
			const shExec = sandbox.stub( tools, 'shExec' );

			shExec.onFirstCall().returns( [
				'v0.0.2',
				'v0.0.3',
				'v0.0.4'
			].join( '\n' ) );

			shExec.onSecondCall().returns( '    0 ' );

			expect( hasCommitsFromLastRelease() ).to.equal( false );
		} );

		it( 'returns true if any commit was made when no tag exists', () => {
			const shExec = sandbox.stub( tools, 'shExec' );

			shExec.onFirstCall().returns( ' ' );
			shExec.onSecondCall().returns( '    1 ' );

			expect( hasCommitsFromLastRelease() ).to.equal( true );
		} );

		it( 'returns false if any commit was not made when no tag exists', () => {
			const shExec = sandbox.stub( tools, 'shExec' );

			shExec.onFirstCall().returns( ' ' );
			shExec.onSecondCall().returns( '    0 ' );

			expect( hasCommitsFromLastRelease() ).to.equal( false );
		} );
	} );
} );
