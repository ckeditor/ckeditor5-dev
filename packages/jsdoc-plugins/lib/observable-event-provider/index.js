/**
 * @license Copyright (c) 2003-2023, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const addMissingEventDocletsForObservables = require( './addmissingeventdocletsforobservables' );

module.exports = {
	handlers: {
		processingComplete( e ) {
			e.doclets = addMissingEventDocletsForObservables( e.doclets );
		}
	}
};
