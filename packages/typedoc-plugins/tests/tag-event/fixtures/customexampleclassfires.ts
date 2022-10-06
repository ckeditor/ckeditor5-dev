/**
 * @license Copyright (c) 2003-2022, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

/**
 * @module fixtures/customexampleclassfires
 */

import ExampleClass from './exampleclass';

/**
 * Default class not related to an event.
 */
export default class CustomDefaultExampleClass extends ExampleClass {}

/**
 * Non-default class that fires an event.
 *
 * @fires event-foo-in-class-with-fires
 */
export class CustomExampleClassFires extends ExampleClass {}

/**
 * @eventName event-foo-in-class-with-fires
 */
export type EventFooNoText = {
	name: string;
};
