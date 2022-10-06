/**
 * @license Copyright (c) 2003-2022, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

/**
 * @module fixtures/customexampleclass
 */

import { ExampleClass } from './exampleclass';

export class CustomExampleClass extends ExampleClass {
	// This class has also all inherited observable properties from ExampleClass.

	/**
	 * Observable tag associated to a static property in a class.
	 *
	 * @observable
	 */
	public property: number;

	/**
	 * Observable tag associated to a static property in a class.
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
