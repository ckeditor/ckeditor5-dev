/**
 * @license Copyright (c) 2003-2023, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

exports.handlers = {
	processingComplete( e ) {
		console.log( JSON.stringify( e, null, 4 ) );
	}
};
