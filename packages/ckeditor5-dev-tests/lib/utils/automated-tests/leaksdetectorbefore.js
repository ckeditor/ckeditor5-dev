/**
 * @license Copyright (c) 2003-2020, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

/* global document */

// eslint-disable-next-line mocha/no-top-level-hooks
beforeEach( function() {
	this._lastDomElementsCount = document.body.childElementCount;
} );
