/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

/**
 * @module fixtures/customexampleclass
 */

import { ExampleClass } from './exampleclass.js';

export class CustomExampleClass extends ExampleClass {
	// In the generated TypeDoc output this class will also contain all inherited observable properties from ExampleClass.

	/**
	 * Observable public property.
	 *
	 * @observable
	 */
	public property: number;

	/**
	 * Observable public property defined in another way, with other JSDoc tags.
	 *
	 * @readonly
	 * @observable
	 * @member {boolean}
	 */
	declare public anotherProperty: boolean;

	/**
	 * Observable static property.
	 *
	 * @observable
	 */
	public static staticProperty: number;

	constructor() {
		super();
		this.property = 1;
	}
}

/**
 * Observable tag associated to a non-property statement.
 *
 * @observable
 */
export type ExampleType = {
	name: string;
};

/**
 * Observable tag not associated to anything in the source code.
 *
 * @observable
 */
