/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { workspaces } from '@ckeditor/ckeditor5-dev-utils';
import upath from 'upath';
import fs from 'fs-extra';
import semver from 'semver';

const { normalizeTrim } = upath;

/**
 * The purpose of the script is to update the version of a root package found in the current working
 * directory and packages if the `options.packagesDirectory` path is provided.
 *
 * Before updating phase, the specified version must meet the following conditions:
 *
 * * It must not be in use in the npm registry.
 * * It must be higher than the version specified in the root package (found in the `cwd` directory).
 *   Exception: passing a version starting with the `0.0.0-nightly` string. It is used for publishing
 *   a nightly release.
 *
 * @param {object} options
 * @param {string} options.version Version to store in a `package.json` file under the `version` key.
 * @param {UpdateVersionsPackagesDirectoryFilter|null} [options.packagesDirectoryFilter=null] An optional callback allowing filtering out
 * directories/packages that should not be touched by the task.
 * @param {string} [options.packagesDirectory] Relative path to a location of packages to update. If not specified,
 * only the root package is checked.
 * @param {string} [options.cwd=process.cwd()] Current working directory from which all paths will be resolved.
 * @returns {Promise}
 */
export default async function updateVersions( options ) {
	const {
		packagesDirectory,
		version,
		packagesDirectoryFilter = null,
		cwd = process.cwd()
	} = options;

	const pkgJsonPaths = await workspaces.findPathsToPackages(
		cwd,
		packagesDirectory ? normalizeTrim( packagesDirectory ) : null,
		{
			includePackageJson: true,
			includeCwd: true,
			packagesDirectoryFilter
		}
	);

	checkIfVersionIsValid( version );

	for ( const pkgJsonPath of pkgJsonPaths ) {
		const pkgJson = await fs.readJson( pkgJsonPath );

		pkgJson.version = version;
		await fs.writeJson( pkgJsonPath, pkgJson, { spaces: 2 } );
	}
}

/**
 * @param {string} version
 */
function checkIfVersionIsValid( version ) {
	if ( !semver.valid( version ) ) {
		throw new Error( `Provided version ${ version } must follow the "Semantic Versioning" standard.` );
	}
}

/**
 * @callback UpdateVersionsPackagesDirectoryFilter
 *
 * @param {string} packageJsonPath An absolute path to a `package.json` file.
 *
 * @returns {boolean} Whether to include (`true`) or skip (`false`) processing the given directory/package.
 */
