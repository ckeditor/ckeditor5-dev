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
			trackTime( buildRelations, 'buildRelations' ),
			trackTime( addTypedefProperties, 'addTypedefProperties' ),
			trackTime( addMissingDoclets, 'addMissingDoclets' ),
			trackTime( filterOutInternalDoclets, 'filterOutInternalDoclets' )
		)( e.doclets );
	}
};

function trackTime( fn, name ) {
	return function( ...args ) {
		const d = Date.now();

		const result = fn( ...args );

		console.log( name, Date.now() - d );

		return result;
	};
}
