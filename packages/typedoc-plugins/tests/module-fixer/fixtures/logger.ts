/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import type Error from './error.js';

/**
 * @module fixtures/logger
 */

export default class Logger {
	public static error( error: Error ): void {
		console.log( error.name );
	}
}
export interface DeleteChange {
	type: 'delete';
	index: number;
	howMany: number;
}
