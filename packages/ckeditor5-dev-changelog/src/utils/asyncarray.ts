/**
 * @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

/**
 * A utility class that wraps a Promise of an array and provides async array-like operations.
 */
export class AsyncArray<T> {
	private readonly promise: Promise<Array<T>>;

	/**
	 * Creates a new `AsyncArray` instance.
	 */
	constructor( promise: Promise<Array<T>> ) {
		this.promise = promise;
	}

	/**
	 * Creates an `AsyncArray` from a given promise.
	 */
	public static from<U>( promise: Promise<Array<U>> ): AsyncArray<U> {
		return new AsyncArray( promise );
	}

	/**
	 * Asynchronously maps each item in the array using the provided callback.
	 */
	public map<U>(
		fn: ( item: T, index: number, array: Array<T> ) => U | Promise<U>
	): AsyncArray<U> {
		const newPromise = this.promise.then( arr => Promise.all( arr.map( fn ) ) );

		return new AsyncArray( newPromise );
	}

	/**
	 * Flattens one level of nesting in an array of arrays.
	 */
	public flat<U>( this: AsyncArray<Array<U>> ): AsyncArray<U> {
		const newPromise = this.promise.then( arr => arr.flat() );

		return new AsyncArray( newPromise );
	}

	/**
	 * Maps each item using a callback that returns an array (or promise of an array),
	 * then flattens the result by one level.
	 */
	public flatMap<U>(
		fn: ( item: T, index: number, array: Array<T> ) => Array<U> | Promise<Array<U>>
	): AsyncArray<U> {
		const newPromise = this.promise.then( async arr => {
			const mapped = await Promise.all( arr.map( fn ) );
			return mapped.flat();
		} );

		return new AsyncArray<U>( newPromise );
	}

	/**
	 * Allows chaining or awaiting the result of the internal promise.
	 */
	public then<U>( onfulfilled: ( value: Array<T> ) => U | Promise<U> ): Promise<U> {
		return this.promise.then( onfulfilled );
	}
}
