/**
 * @license Copyright (c) 2016-2017, CKSource - Frederico Knabben. All rights reserved.
 * Licensed under the terms of the MIT License (see LICENSE.md).
 */

'use strict';

/**
 * Collection of <String, Object[]> pairs.
 */
class Collection {
	/**
	 * Creates collection of <String, Object[]> pairs
	 */
	constructor() {
		this._data = {};
		this._allData = [];
		this._allLongnames = [];
	}

	/**
	 * Adds record to collection
	 *
	 * @param {String} name
	 * @param {Object} record
	*/
	add( name, record ) {
		if ( !this._data[ name ] ) {
			this._data[ name ] = [];
		}

		this._data[ name ].push( record );
		this._allData.push( record );

		if ( record.longname ) {
			this._allLongnames.push( record.longname );
		}
	}

	/**
	 * Returns records filtered by name.
	 *
	 * @param {String} name
	 * @returns {Object[]}
	 */
	get( name ) {
		return this._data[ name ] || [];
	}

	/**
	 * Returns all records.
	 *
	 * @returns {Object[]}
	*/
	getAll() {
		return this._allData;
	}

	/**
	 * Returns all longnames.
	 *
	 * @returns {String[]}
	 */
	getAllLongnames() {
		return this._allLongnames;
	}
}

module.exports = Collection;
