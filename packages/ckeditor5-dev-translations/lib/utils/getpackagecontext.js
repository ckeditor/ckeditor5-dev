/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import upath from 'upath';
import fs from 'fs-extra';
import { CONTEXT_FILE_PATH } from './constants.js';

/**
 * @param {object} options
 * @param {string} options.packagePath Path to the package containing the context.
 * @returns {TranslationsContext}
 */
export default function getPackageContext( { packagePath } ) {
	const contextFilePath = upath.join( packagePath, CONTEXT_FILE_PATH );
	const contextContent = fs.readJsonSync( contextFilePath, { throws: false } ) || {};

	return {
		contextContent,
		contextFilePath,
		packagePath
	};
}

/**
 * @typedef {object} TranslationsContext
 *
 * @property {string} contextFilePath
 * @property {object} contextContent
 * @property {string} packagePath
 */
