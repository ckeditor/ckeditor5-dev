/**
 * @license Copyright (c) 2003-2023, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

/**
 * @module utils/collection
 */

/**
 * Collections are ordered sets of objects.
 */
export default class Collection {
	private _items: { [ Symbol.iterator ]: any };

	/**
	 * Constructor.
	 */
	constructor() {
		/**
		 * The internal list of items in the collection.
		 *
		 * @private
		 * @member {Object[]}
		 */
		this._items = [];
	}

	/**
	 * Fake value to test warning.
	 *
	 * @returns {Iterable.<*>}
	 */
	public [ Symbol.fake ](): Iterable<any> {
		return this._items[ Symbol.iterator ]();
	}
}
