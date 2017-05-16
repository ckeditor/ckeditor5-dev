/**
 * @license Copyright (c) 2003-2017, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const expect = require( 'chai' ).expect;
const sinon = require( 'sinon' );
const { tools } = require( '@ckeditor/ckeditor5-dev-utils' );

describe( 'dev-env/release-tools/utils', () => {
	let validator, shExecStub;

	describe( 'validator', () => {
		beforeEach( () => {
			shExecStub = sinon.stub( tools, 'shExec' );

			validator = require( '../../../lib/release-tools/utils/releasevalidator' );
		} );

		afterEach( () => {
			shExecStub.restore();
		} );

		describe( 'checkBranch()', () => {
			it( 'does not throw if on master and master is clean', () => {
				shExecStub.returns( '## master...origin/master' );

				expect( () => {
					validator.checkBranch();
				} ).to.not.throw();
			} );

			it( 'throws an error when current branch is not master', () => {
				shExecStub.returns( '## t/2...origin/t/2' );

				expect( () => {
					validator.checkBranch();
				} ).to.throw( Error, 'Not on master or master is not clean.' );
			} );

			it( 'throws an error when master is behind origin', () => {
				shExecStub.returns( '## master...origin/master [behind 1]' );

				expect( () => {
					validator.checkBranch();
				} ).to.throw( Error, 'Not on master or master is not clean.' );
			} );

			it( 'throws an error when master is ahead of origin', () => {
				shExecStub.returns( '## master...origin/master [ahead 1]' );

				expect( () => {
					validator.checkBranch();
				} ).to.throw( Error, 'Not on master or master is not clean.' );
			} );

			it( 'throws an error when master contains uncommitted changes', () => {
				shExecStub.returns( '## master...origin/master\n?? x' );

				expect( () => {
					validator.checkBranch();
				} ).to.throw( Error, 'Not on master or master is not clean.' );
			} );
		} );
	} );
} );
