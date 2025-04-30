/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

/**
 * @module fixtures/links
 */

/**
 * @fires example
 */
export class ClassWithLinks {
	/**
	 * Cross link from instance property to {@link .staticProperty static property}.
	 */
	public property: number;

	/**
	 * Cross link from static property to {@link #property instance property}.
	 */
	public static staticProperty: number;

	/**
	 * Valid links:
	 * - {@link #property}.
	 * - {@link .staticProperty}.
	 * - {@link #method}.
	 * - {@link #method:LABEL1}.
	 * - {@link #method:LABEL2}.
	 * - {@link #event:example}.
	 * - {@link #event:set:example}.
	 * - {@link #event:change:example}.
	 * - {@link ~ClassWithLinks#property}.
	 * - {@link module:fixtures/links~ClassWithLinks#property}.
	 * - {@link module:fixtures/links~ClassWithLinks#property custom label}.
	 *
	 * Invalid links:
	 * - {@link .property}.
	 * - {@link #staticProperty}.
	 * - {@link #property-non-existing}.
	 * - {@link #property:LABEL-NON-EXISTING}.
	 * - {@link #method:LABEL-NON-EXISTING}.
	 * - {@link #methodWithoutComment:LABEL-NON-EXISTING}.
	 * - {@link #methodWithoutLabel:LABEL-NON-EXISTING}.
	 * - {@link #example}.
	 * - {@link #event:property}.
	 * - {@link ~ClassNonExisting#property}.
	 * - {@link module:non-existing/module~ClassWithLinks#property}.
	 */
	constructor( property: number ) {
		this.property = property;
	}

	/**
	 * First signature.
	 *
	 * @label LABEL1
	 *
	 * @returns Contains links in the block tag:
	 * - valid one: {@link module:fixtures/links~ClassWithLinks#property link to a doclet},
	 * - invalid one: {@link module:non-existing/module~Foo#bar link to a doclet}.
	 */
	public method(): void;

	/**
	 * Second signature.
	 *
	 * @label LABEL2
	 *
	 * @returns Contains link in the block tag: {@link module:fixtures/links~ClassWithLinks#property}
	 */
	public method(): void;

	public method(): void {
		/**
		 * An example error with links:
		 * - valid one: {@link module:fixtures/links~ClassWithLinks#property link to a doclet},
		 * - invalid one: {@link module:non-existing/module~Foo#bar link to a doclet}.
		 *
		 * @error example-error
		 */
		throw new Error();
	}

	public methodWithoutComment(): void {}

	/**
	 * This method does not have a "@label" tag.
	 */
	public methodWithoutLabel(): void {}
}

/**
 * An example event with links:
 * - valid one: {@link module:fixtures/links~ClassWithLinks#property link to a doclet},
 * - invalid one: {@link module:non-existing/module~Foo#bar link to a doclet}.
 *
 * Valid link added at the end fo avoid modifying indexes.
 * - {@link module:fixtures/types~MentionFeedObjectItem#id}
 *
 * @eventName ~ClassWithLinks#example
 */
export type EventExample = {
	name: string;
};

/**
 * @eventName ~ClassWithLinks#set:example
 * @eventName ~ClassWithLinks#change:example
 */
export type EventObservableExample = {
	name: string;
};
