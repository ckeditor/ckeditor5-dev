/**
 * @license Copyright (c) 2003-2019, CKSource - Frederico Knabben. All rights reserved.
 * Licensed under the terms of the MIT License (see LICENSE.md).
 */

'use strict';

const buildRelations = require( './buildrelations' );
const addMissingDoclets = require( './addmissingdoclets' );
const compose = require( '../utils/compose-functions' );
const filterOutInternalDoclets = require( './filteroutintenraldoclets' );

exports.handlers = {
	processingComplete( e ) {
		e.doclets = compose(
			buildRelations,
			addMissingDoclets,
			filterOutInternalDoclets
		)( e.doclets );
	}
};
