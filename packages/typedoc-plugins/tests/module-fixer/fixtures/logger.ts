/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import type Error from './error';

/**
 * @module fixtures/logger
 */

export default class Logger {
	public static error( error: Error ): void {
		console.log( error.name );
	}
}
