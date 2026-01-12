/**
 * @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import fs from 'node:fs/promises';

/**
 * Applies publish-time overrides to a `package.json` file.
 *
 * Fields defined in `publishConfig` replace their top-level counterparts in the manifest.
 *
 * @param {string} packageJsonPath Absolute path to a `package.json` file.
 * @returns {Promise<void>}
 */
export default async function resolvePublishOverrides( packageJsonPath ) {
	const raw = await fs.readFile( packageJsonPath, 'utf8' );
	const pkg = JSON.parse( raw );

	const { publishConfig } = pkg;
	const isNullOrUndefined = publishConfig === null || typeof publishConfig === 'undefined';

	if ( isNullOrUndefined ) {
		return;
	}

	if ( !isPlainObject( publishConfig ) ) {
		throw new Error( `"publishConfig" in "${ packageJsonPath }" must be a plain object.` );
	}

	for ( const [ key, value ] of Object.entries( publishConfig ) ) {
		pkg[ key ] = value;
	}

	delete pkg.publishConfig;
	await fs.writeFile( packageJsonPath, JSON.stringify( pkg, null, 2 ) + '\n' );
}

function isPlainObject( value ) {
	return Object.prototype.toString.call( value ) === '[object Object]';
}
