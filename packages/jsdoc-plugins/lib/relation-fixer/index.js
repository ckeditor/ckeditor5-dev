/**
 * @license Copyright (c) 2017, CKSource - Frederico Knabben. All rights reserved.
 * Licensed under the terms of the MIT License (see LICENSE.md).
 */

'use strict';

const relationBuilder = require( './relationbuilder' );
const addMissingDoclets = require( './addmissingdoclets' );

exports.handlers = {
	processingComplete( e ) {
		e.doclets = addMissingDoclets( relationBuilder( e.doclets ) );
	}
};
