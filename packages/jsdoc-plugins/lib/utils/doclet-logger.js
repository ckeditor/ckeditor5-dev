/**
 * @license Copyright (c) 2016-2017, CKSource - Frederico Knabben. All rights reserved.
 * Licensed under the terms of the MIT License (see LICENSE.md).
 */

'use strict';

/**
 * Created for testing purpose.
 * You can add / remove this plugin in src/tasks/build-api-docs.js
 */
exports.handlers = {
	parseComplete( e ) {
		console.log( JSON.stringify( e.doclets, null, 4 ) );
	}
};
