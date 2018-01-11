/**
 * @license Copyright (c) 2003-2018, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const expect = require( 'chai' ).expect;
const getLicenseBanner = require( '../../lib/bundler/getlicensebanner' );

describe( 'bundler', () => {
	describe( 'getLicenseBanner()', () => {
		expect( getLicenseBanner() ).to.match( /\/\*\*[\S\s]+\*\//g );
	} );
} );
