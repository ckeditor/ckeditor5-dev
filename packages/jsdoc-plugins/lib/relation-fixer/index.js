/**
 * @license Copyright (c) 2003-2020, CKSource - Frederico Knabben. All rights reserved.
 * Licensed under the terms of the MIT License (see LICENSE.md).
 */

'use strict';

const buildRelations = require( './buildrelations' );
const addMissingDoclets = require( './addmissingdoclets' );
const filterOutInternalDoclets = require( './filteroutintenraldoclets' );
const addTypedefProperties = require( './addtypedefproperties' );

exports.handlers = {
	processingComplete( e ) {
		e.doclets = precleanInheritance( e.doclets );
		e.doclets = buildRelations( e.doclets );
		e.doclets = addTypedefProperties( e.doclets );
		e.doclets = addMissingDoclets( e.doclets );
		e.doclets = filterOutInternalDoclets( e.doclets );
	}
};

/**
 * Revert missing doclets that were marked as ignored.
 * Remove ignored doclets.
 *
 * @param {Doclet[]} doclets
 */
function precleanInheritance( doclets ) {
	// Group doclet by longnames
	/** @type {Map.<String,Doclet[]>} */
	const docletMap = new Map();

	for ( const doclet of doclets ) {
		const docletsWithTheSameName = docletMap.get( doclet.longname ) || [];

		docletMap.set( doclet.longname, [ ...docletsWithTheSameName, doclet ] );
	}

	for ( const doclets of docletMap.values() ) {
		if ( doclets.length === 1 ) {
			continue;
		}

		const ignoredOriginalDoclet = doclets.find( d => d.ignore && !d.mixed && !d.inherited );
		const restDoclets = doclets.filter( d => d !== ignoredOriginalDoclet );

		if ( ignoredOriginalDoclet && restDoclets.every( d => d.inherited || d.mixed ) ) {
			for ( const doclet of restDoclets ) {
				doclet.ignore = true;
			}

			delete ignoredOriginalDoclet.ignore;
		}
	}

	return doclets.filter( d => !d.ignore );
}
