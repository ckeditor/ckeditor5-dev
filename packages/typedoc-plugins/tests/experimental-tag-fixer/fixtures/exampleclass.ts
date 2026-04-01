/**
 * @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

/**
 * Partial experimental class.
 *
 * @experimental **Experimental:** Some methods of this class are production-ready but experimental and may change
 * in minor releases without the standard deprecation policy. Check the changelog for migration guidance.
 */
export class ExampleClass {
	// eslint-disable-next-line @typescript-eslint/no-useless-constructor
	constructor() {}

	public static get pluginName() {
		return 'ExampleClass' as const;
	}

	/**
	 * Regular observable property.
	 *
	 * @observable
	 */
	public regularProperty = '';

	/**
	 * Experimental observable property.
	 *
	 * @experimental **Experimental:** This is a production-ready API but may change in minor releases
	 * without the standard deprecation policy. Check the changelog for migration guidance.
	 * @observable
	 */
	public experimentalProperty = '';

	/**
	 * Regular method.
	 */
	public regularMethod(): void {}

	/**
	 * Experimental method.
	 *
	 * @experimental **Experimental:** This is a production-ready API but may change in minor releases
	 * without the standard deprecation policy. Check the changelog for migration guidance.
	 */
	public experimentalMethod(): void {}
}
