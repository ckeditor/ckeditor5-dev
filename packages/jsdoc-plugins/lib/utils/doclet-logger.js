/**
 * @license Copyright (c) 2003-2020, CKSource - Frederico Knabben. All rights reserved.
 * Licensed under the terms of the MIT License (see LICENSE.md).
 */

'use strict';

const fsExtra = require( 'fs-extra' );

/**
 * Created for testing purpose.
 * You can add / remove this plugin in src/tasks/build-api-docs.js
 */
exports.handlers = {
	processingComplete( e ) {
		const doclets = e.doclets
			.filter( d => !d.undocumented );

		fsExtra.outputFileSync( process.cwd() + '/docs/api/output.json', JSON.stringify( { doclets }, null, 4 ) );
	}
};
