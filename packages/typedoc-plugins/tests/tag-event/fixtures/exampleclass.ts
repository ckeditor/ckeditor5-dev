/**
 * @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

/**
 * @module fixtures/exampleclass
 */

export default class ExampleClass {
	protected _value: string;

	constructor( value: string ) {
		this._value = value;
	}

	public get value(): string {
		return this.value;
	}

	public set value( value: string ) {
		this._value = value;
	}
}
