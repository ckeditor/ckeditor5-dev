/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

/**
 * @module fixtures/firesabsolute
 */

/**
 * @fires module:fixtures/fires~ClassWithFires#event:event-example
 * @fires module:fixtures/fires~ClassWithFires#event:event-non-existing
 * @fires module:fixtures/fires~ClassWithFires#event:property
 */
export class ClassWithFiresAbsolute {
	/**
	 * @fires module:fixtures/fires~ClassWithFires#event:event-example
	 * @fires module:fixtures/fires~ClassWithFires#event:event-non-existing
	 * @fires module:fixtures/fires~ClassWithFires#event:property
	 */
	public method(): void {}
}
