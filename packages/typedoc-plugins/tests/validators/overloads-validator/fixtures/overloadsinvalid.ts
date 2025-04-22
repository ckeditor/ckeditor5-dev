/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

/**
 * @module fixtures/overloadsinvalid
 */

export class ClassWithOverloads {
	public property: number;

	/**
	 * @label LABEL-FOR-FIRST-SIGNATURE-ONLY
	 */
	constructor( property: number );

	constructor( property: number );

	constructor( property: number ) {
		this.property = property;
	}

	public method(): void;

	/**
	 * @label LABEL-FOR-SECOND-SIGNATURE-ONLY
	 */
	public method(): void;

	public method(): void {}
}

export function foo( input: string ): void;

export function foo( input: boolean, step: number ): void;

export function foo( input: string | boolean, step?: number ): void {
	input;
	step;
}

/**
 * @label NOT_SO_UNIQUE
 */
export function bar( input: string ): void;

/**
 * @label NOT_SO_UNIQUE
 */
export function bar( input: boolean, step: number ): void;

export function bar( input: string | boolean, step?: number ): void {
	input;
	step;
}
