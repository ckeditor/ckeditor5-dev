/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

/**
 * Custom error class for handling validation errors in the changelog generation process.
 */
export class InternalError extends Error {
	constructor() {
		const message =
			'No valid entries were found. Please ensure that:\n' +
			'1) Input files exist in the `.changelog/` directory.\n' +
			'2) The `cwd` parameter points to the root of your project.\n' +
			'3) The `packagesDirectory` parameter correctly specifies the packages folder.\n' +
			'If no errors appear in the console but inputs are present, your project configuration may be incorrect.\n' +
			'If validation errors are shown, please resolve them according to the details provided.\n';

		super( message );
	}
}
