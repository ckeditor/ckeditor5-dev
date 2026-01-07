/**
 * @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
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
	 * Observable public property.
	 *
	 * @observable
	 */
	public key: number;

	/**
	 * Observable protected property.
	 *
	 * @observable
	 */
	protected value: string;

	/**
	 * Observable private property.
	 *
	 * @observable
	 */
	private secret: string | undefined;

	/**
	 * Observable getter.
	 *
	 * @readonly
	 * @observable
	 */
	public get hasSecret(): boolean {
		return Boolean( this.secret );
	}

	/**
	 * Observable setter.
	 *
	 * @readonly
	 * @observable
	 */
	public set setSecret( string: string | undefined ) {
		this.secret = string;
	}

	constructor() {
		this.name = 'Example';
		this.key = 1;
		this.value = 'Foo';
		this.secret = 'Secret';
	}
}
