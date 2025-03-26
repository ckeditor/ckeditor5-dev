/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { format, parse } from 'date-fns';

class DateFormatter {
	private readonly inputFormat = 'yyyy-MM-dd';
	private readonly outputFormat = 'LLLL d, yyyy';

	/**
	 * Formats a date string from 'yyyy-MM-dd' format to a more readable format.
	 * 
	 * @param date - Date string in 'yyyy-MM-dd' format
	 * @returns Formatted date string (e.g., "January 1, 2024")
	 * @throws {Error} If the date string is invalid or cannot be parsed
	 * 
	 * @example
	 * getDateFormatted("2024-01-01") // "January 1, 2024"
	 */
	format(date: string): string {
		try {
			const parsedDate = parse(date, this.inputFormat, new Date());
			return format(parsedDate, this.outputFormat);
		} catch (error) {
			throw new Error(
				`Failed to format date "${date}": ${error instanceof Error ? error.message : String(error)}`
			);
		}
	}
}

/**
 * Formats a date string from 'yyyy-MM-dd' format to a more readable format.
 * 
 * @param date - Date string in 'yyyy-MM-dd' format
 * @returns Formatted date string (e.g., "January 1, 2024")
 * @throws {Error} If the date string is invalid or cannot be parsed
 * 
 * @example
 * getDateFormatted("2024-01-01") // "January 1, 2024"
 */
export function getDateFormatted(date: string): string {
	const formatter = new DateFormatter();
	return formatter.format(date);
}
