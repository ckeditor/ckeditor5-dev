/**
 * @license Copyright (c) 2003-2020, CKSource - Frederico Knabben. All rights reserved.
 * Licensed under the terms of the MIT License (see LICENSE.md).
 */

'use strict';

const buildRelations = require( './buildrelations' );
const addMissingDoclets = require( './addmissingdoclets' );
const compose = require( '../utils/compose-functions' );
const filterOutInternalDoclets = require( './filteroutintenraldoclets' );
const addTypedefProperties = require( './addtypedefproperties' );

exports.handlers = {
	processingComplete( e ) {
		e.doclets = compose(
			buildRelations,
			addTypedefProperties,
			addMissingDoclets,
			filterOutInternalDoclets
		)( e.doclets );
	}
};
