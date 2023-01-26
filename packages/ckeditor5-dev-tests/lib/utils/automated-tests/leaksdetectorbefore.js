/**
 * @license Copyright (c) 2003-2023, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

/* global document */

// eslint-disable-next-line mocha/no-top-level-hooks
beforeEach( function() {
	this._lastDomElements = new WeakSet( document.body.children );
} );
