/**
 * @license Copyright (c) 2017, CKSource - Frederico Knabben. All rights reserved.
 * Licensed under the terms of the MIT License (see LICENSE.md).
 */

'use strict';

/**
 * @see http://usejsdoc.org/about-plugins.html
 */

const augmentStatics = require( './augmentstatics' );

exports.handlers = {
	processingComplete( e ) {
		augmentStatics( e.doclets );
	}
};
