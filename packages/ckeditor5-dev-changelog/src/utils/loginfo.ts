/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

interface LogOptions {
	indent?: number;
}

class Logger {
	private readonly defaultIndent = 0;

	constructor(private readonly options: LogOptions = {}) {
		this.options.indent = options.indent ?? this.defaultIndent;
	}

	/**
	 * Logs a message to the console with optional indentation.
	 * 
	 * @param text - The message to log
	 * @param options - Optional logging options
	 */
	log(text: string, options: LogOptions = {}): void {
		const indent = (options.indent ?? this.options.indent ?? this.defaultIndent)!;
		const indentedText = ' '.repeat(indent) + text;
		console.log(indentedText);
	}
}

/**
 * Logs a message to the console with optional indentation.
 * 
 * @param text - The message to log
 * @param options - Optional logging options
 * @example
 * logInfo("Hello") // "Hello"
 * logInfo("Hello", { indent: 2 }) // "  Hello"
 */
export function logInfo(text: string, options: LogOptions = {}): void {
	const logger = new Logger(options);
	logger.log(text);
}
