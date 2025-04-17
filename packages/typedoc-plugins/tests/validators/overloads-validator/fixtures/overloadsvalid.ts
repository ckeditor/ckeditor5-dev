/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

/**
 * @module fixtures/overloadsvalid
 */

export class ClassWithOverloads {
	public property: number;

	/**
	 * @label LABEL1
	 */
	constructor( property: number );

	/**
	 * @label LABEL2
	 */
	constructor( property: number );

	constructor( property: number ) {
		this.property = property;
	}

	/**
	 * @label LABEL1
	 */
	public method(): void;

	/**
	 * @label LABEL2
	 */
	public method(): void;

	public method(): void {}
}

/**
 * @label LABEL1
 */
export function foo( input: string ): void;

/**
 * @label LABEL2
 */
export function foo( input: boolean, step: number ): void;

export function foo( input: string | boolean, step?: number ): void {
	input;
	step;
}
