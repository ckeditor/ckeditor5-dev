/**
 * @license Copyright (c) 2003-2023, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

/**
 * Factory function that registers the `attribute` assertion.
 *
 * @param {Chai} chai
 */
module.exports = chai => {
	/**
	 * Asserts that the target has an attribute with the given key name.
	 *
	 *		expect( selection ).to.have.attribute( 'linkHref' );
	 *
	 * When `value` is provided, `.attribute` also asserts that the attribute's value is equal to the given `value`.
	 *
	 *		expect( selection ).to.have.attribute( 'linkHref', 'example.com' );
	 *
	 * Negations works as well.
	 *
	 * @param {String} key Key of attribute to assert.
	 * @param {String} [value] Attribute value to assert.
	 */
	chai.Assertion.addMethod( 'attribute', function attributeAssertion( key, value ) {
		const obj = this._obj;

		if ( arguments.length === 1 ) {
		// Check if it has the method at all.
			new chai.Assertion( obj ).to.respondTo( 'hasAttribute' );

			// Check if it has the attribute.
			const hasAttribute = obj.hasAttribute( key );
			this.assert(
				hasAttribute === true,
				`expected #{this} to have attribute '${ key }'`,
				`expected #{this} to not have attribute '${ key }'`,
				!chai.util.flag( this, 'negate' ),
				hasAttribute
			);
		}

		// If a value was given.
		if ( arguments.length >= 2 ) {
		// Check if it has the method at all.
			new chai.Assertion( obj ).to.respondTo( 'getAttribute' );

			const attributeValue = obj.getAttribute( key );
			this.assert(
				attributeValue === value,
				`expected #{this} to have attribute '${ key }' of #{exp}, but got #{act}`,
				`expected #{this} to not have attribute '${ key }' of #{exp}`,
				value,
				attributeValue
			);
		}
	} );
};
