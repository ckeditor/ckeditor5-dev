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
		const result = [];

		Object.keys( this._data ).forEach( key => {
			result.push( ...this._data[ key ] );
		} );

		return result;
	}
}

module.exports = Collection;
