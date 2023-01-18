/**
 * @license Copyright (c) 2003-2023, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
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
 * @param {Array.<Doclet>} doclets
 */
function precleanInheritance( doclets ) {
	// Group doclet by longnames
	/** @type {Map.<String,Array.<Doclet>>} */
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

		if ( doclets.some( d => !!d.comment ) ) {
			for ( const doclet of doclets ) {
				if ( !doclet.comment ) {
					doclet.ignore = true;
				}
			}
		}
	}

	// Filter out member doclets that miss their comments.
	for ( const doclet of doclets ) {
		if ( ( doclet.kind === 'member' || doclet.kind === 'function' ) && ( doclet.inheritdoc === '' || !doclet.comment ) ) {
			if ( doclet.name !== 'constructor' ) {
				doclet.ignore = true;
			}
		}
	}

	doclets = doclets.filter( d => !d.ignore );

	return doclets;
}
