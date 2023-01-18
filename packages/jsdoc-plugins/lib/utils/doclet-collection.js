/**
 * @license Copyright (c) 2003-2023, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

/**
 * Collection of doclets as <String, Array.<Doclet>> pairs. Also stores all doclets and their longnames as arrays.
 */
module.exports = class DocletCollection {
	/**
	 * Creates collection of doclets.
	 */
	constructor() {
		this._data = {};
		this._allData = [];
		this._allLongnames = [];
	}

	/**
	 * Adds doclet to collection.
	 *
	 * @param {String} category
	 * @param {Doclet} doclet
	*/
	add( category, doclet ) {
		if ( !this._data[ category ] ) {
			this._data[ category ] = [];
		}

		this._data[ category ].push( doclet );
		this._allData.push( doclet );

		if ( doclet.longname ) {
			this._allLongnames.push( doclet.longname );
		}
	}

	/**
	 * Returns doclets filtered by category.
	 *
	 * @param {String} category
	 * @returns {Array.<Doclet>}
	 */
	get( category ) {
		return this._data[ category ] || [];
	}

	/**
	 * Returns all doclets.
	 *
	 * @returns {Array.<Doclet>}
	*/
	getAll() {
		return this._allData;
	}

	/**
	 * Returns all longnames.
	 *
	 * @returns {Array.<String>}
	 */
	getAllLongnames() {
		return this._allLongnames;
	}
};
