/**
 * @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

/**
 * @module fixtures/firesabsolute
 */

/**
 * @fires module:fixtures/fires~ClassWithFires#event:example
 * @fires module:fixtures/fires~ClassWithFires#event:set:example
 * @fires module:fixtures/fires~ClassWithFires#event:change:example
 * @fires module:fixtures/fires~ClassWithFires#event:non-existing
 * @fires module:fixtures/fires~ClassWithFires#event:property
 */
export class ClassWithFiresAbsolute {
	/**
	 * @fires module:fixtures/fires~ClassWithFires#event:example
	 * @fires module:fixtures/fires~ClassWithFires#event:set:example
	 * @fires module:fixtures/fires~ClassWithFires#event:change:example
	 * @fires module:fixtures/fires~ClassWithFires#event:non-existing
	 * @fires module:fixtures/fires~ClassWithFires#event:property
	 */
	public method(): void {}
}
