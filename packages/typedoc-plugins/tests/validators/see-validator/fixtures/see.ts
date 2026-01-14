/**
 * @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

/**
 * @module fixtures/see
 */

/**
 * @fires event-example
 */
export class ClassWithSeeTags {
	/**
	 * Cross link from instance property to static property.
	 *
	 * @see .staticProperty
	 */
	public property: number;

	/**
	 * Cross link from static property to instance property.
	 *
	 * @see #property
	 */
	public static staticProperty: number;

	/**
	 * Valid links:
	 *
	 * @see #property
	 * @see .staticProperty
	 * @see #method
	 * @see #method:LABEL1
	 * @see #method:LABEL2
	 * @see #event:example
	 * @see #event:set:example
	 * @see #event:change:example
	 * @see ~ClassWithSeeTags#property
	 * @see module:fixtures/see~ClassWithSeeTags#property
	 * @see http://github.com/ckeditor/ckeditor5
	 * @see https://github.com/ckeditor/ckeditor5
	 * @label LABEL1
	 */
	constructor( property: number );

	/**
	 * Invalid links:
	 * @see .property
	 * @see #staticProperty
	 * @see #property-non-existing
	 * @see #property:LABEL-NON-EXISTING
	 * @see #method:LABEL-NON-EXISTING
	 * @see #methodWithoutComment:LABEL-NON-EXISTING
	 * @see #methodWithoutLabel:LABEL-NON-EXISTING
	 * @see #event-example
	 * @see #event:example:invalid
	 * @see #event:property
	 * @see ~ClassNonExisting#property
	 * @see module:non-existing/module~ClassWithSeeTags#property
	 * @label LABEL2
	 */
	constructor( property: number );

	constructor( property: number ) {
		this.property = property;
	}

	/**
	 * First signature.
	 *
	 * @label LABEL1
	 */
	public method(): void;

	/**
	 * Second signature.
	 *
	 * @label LABEL2
	 */
	public method(): void;

	public method(): void {}

	public methodWithoutComment(): void {}

	/**
	 * This method does not have a "@label" tag.
	 */
	public methodWithoutLabel(): void {}
}

/**
 * An example event with valid and invalid "@see" tags.
 *
 * @eventName ~ClassWithSeeTags#example
 * @see module:fixtures/see~ClassWithSeeTags#property
 * @see module:non-existing/module~Foo#bar
 */
export type EventExample = {
	name: string;
};

/**
 * @eventName ~ClassWithSeeTags#set:example
 * @eventName ~ClassWithSeeTags#change:example
 */
export type EventObservableExample = {
	name: string;
};
