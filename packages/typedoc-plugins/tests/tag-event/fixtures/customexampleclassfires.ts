/**
 * @license Copyright (c) 2003-2022, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

/**
 * @module fixtures/customexampleclassfires
 */

import ExampleClass from './exampleclass';

/**
 * @fires event-foo-in-class-with-fires
 */
export class CustomExampleClass extends ExampleClass {}

/**
 * @eventName event-foo-in-class-with-fires
 */
export type FooEventNoText = {
	name: string;
};
