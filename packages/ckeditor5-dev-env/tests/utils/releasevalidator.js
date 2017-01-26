/**
 * @license Copyright (c) 2003-2017, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

/* jshint mocha:true */

'use strict';

const expect = require( 'chai' ).expect;
const sinon = require( 'sinon' );
const { tools } = require( '@ckeditor/ckeditor5-dev-utils' );
const utils = require( '../../lib/utils/changelog' );

describe( 'utils', () => {
	let validator, shExecStub;

	describe( 'validator', () => {
		beforeEach( () => {
			shExecStub = sinon.stub( tools, 'shExec' );

			validator = require( '../../lib/utils/releasevalidator' );
		} );

		afterEach( () => {
			shExecStub.restore();
		} );

		describe( 'checkOptions', () => {
			it( 'throws an error when given options are invalid', () => {
				expect( () => {
					validator.checkOptions( {} );
				} ).to.throw( Error, 'GitHub CLI token not found. Use --token=<token>.' );
			} );

			it( 'does not throw when options are valid', () => {
				expect( () => {
					validator.checkOptions( { token: 'abc' } );
				} ).to.not.throw();
			} );
		} );

		describe( 'checkCurrentBranch', () => {
			it( 'throws an error when current branch is not the main branch', () => {
				shExecStub.returns( 'develop' );

				expect( () => {
					validator.checkCurrentBranch();
				} ).to.throw( Error, 'Release can be create only from the main branch.' );
			} );

			it( 'does not throw when current branch is "master"', () => {
				shExecStub.returns( 'master' );

				expect( () => {
					validator.checkCurrentBranch();
				} ).to.not.throw();
			} );
		} );

		describe( 'checkIsUpToDate', () => {
			it( 'throws an error when master is not up to date', () => {
				shExecStub.returns( '## master...origin/master [behind 3]' );

				expect( () => {
					validator.checkIsUpToDate();
				} ).to.throw( Error, 'Branch "master" is not up to date...' );
			} );

			it( 'does not throw when master is up to date', () => {
				shExecStub.returns( '## master...origin/master' );

				expect( () => {
					validator.checkIsUpToDate();
				} ).to.not.throw();
			} );
		} );

		describe( 'checkUncommittedChanges', () => {
			it( 'throws an error when working directory contains uncommitted changes', () => {
				shExecStub.returns( [
					'M packages/ckeditor5-dev-env/tests/utils/getnextversion.js',
					'M packages/ckeditor5-dev-env/tests/utils/parsearguments.js'
				].join( '\n' ) );

				expect( () => {
					validator.checkUncommittedChanges();
				} ).to.throw( Error, 'Working directory contains uncommitted changes...' );
			} );

			it( 'does not throw when working directory does not contain changes', () => {
				shExecStub.returns( '' );

				expect( () => {
					validator.checkUncommittedChanges();
				} ).to.not.throw();
			} );

			it( 'does not throw when working directory has changed package.json or changelog file', () => {
				shExecStub.onFirstCall().returns( 'M package.json' );

				expect( () => {
					validator.checkUncommittedChanges();
				} ).to.not.throw();

				shExecStub.onSecondCall().returns( `M ${ utils.changelogFile }` );

				expect( () => {
					validator.checkUncommittedChanges();
				} ).to.not.throw();
			} );
		} );
	} );
} );
