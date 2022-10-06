/**
 * @license Copyright (c) 2003-2022, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

/**
 * @module fixtures/exampleclass
 */

export class ExampleClass {
	/**
	 * Non-observable class property.
	 */
	public name: string;

	/**
	 * Observable tag associated to a class property.
	 *
	 * @observable
	 */
	public key: number;

	/**
	 * Observable tag associated to a class property.
	 *
	 * @observable
	 */
	protected value: string;

	/**
	 * Observable tag associated to a class property.
	 *
	 * @observable
	 */
	private secret: string;

	constructor() {
		this.name = 'Example';
		this.key = 1;
		this.value = 'Foo';
		this.secret = 'Secret';
	}
}
