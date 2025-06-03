/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

/**
 * This util should not be mocked in unit tests, as we do not mock the native `Promise` API and `Array` methods.
 */
export class AsyncArray<T> {
	private readonly promise: Promise<Array<T>>;

	constructor( promise: Promise<Array<T>> ) {
		this.promise = promise;
	}

	public static from<U>( promise: Promise<Array<U>> ): AsyncArray<U> {
		return new AsyncArray( promise );
	}

	public map<U>( fn: ( item: T, index: number, array: Array<T> ) => U | Promise<U> ): AsyncArray<U> {
		const newPromise = this.promise.then( arr => Promise.all( arr.map( fn ) ) );

		return new AsyncArray( newPromise );
	}

	public flat<U>( this: AsyncArray<Array<U>> ): AsyncArray<U> {
		const newPromise = this.promise.then( arr => arr.flat() );

		return new AsyncArray( newPromise );
	}

	public flatMap<U>( fn: ( item: T, index: number, array: Array<T> ) => Array<U> | Promise<Array<U>> ): AsyncArray<U> {
		const newPromise = this.promise.then( async arr => {
			const mapped = await Promise.all( arr.map( fn ) );

			return mapped.flat();
		} );

		return new AsyncArray<U>( newPromise );
	}

	public then<U>( onfulfilled: ( value: Array<T> ) => U | Promise<U> ): Promise<U> {
		return this.promise.then( onfulfilled );
	}
}
