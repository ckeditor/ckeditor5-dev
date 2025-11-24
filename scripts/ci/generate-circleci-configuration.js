#!/usr/bin/env node

/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

// The script assumes that it is executed from the CKEditor 5 Commercial directory and aims to load
// the template file (`.circleci/template.yml`) and store it under the `.circleci/config-tests.yml` path,
// a source for a new workflow triggered from the main thread when a new build starts.
//
// See: https://circleci.com/docs/using-dynamic-configuration/.

import fs from 'fs-extra';
import upath from 'upath';
import { glob } from 'tinyglobby';
import yaml from 'js-yaml';

const ROOT_DIRECTORY = upath.join( import.meta.dirname, '..', '..' );
const CIRCLECI_CONFIGURATION_DIRECTORY = upath.join( ROOT_DIRECTORY, '.circleci' );

( async () => {
	const packages = await glob( '*/', { cwd: upath.join( ROOT_DIRECTORY, 'packages' ) } );
	const packagesScriptsMap = await Promise.all(
		packages.map( async packageName => {
			const pkgJsonPath = upath.join( ROOT_DIRECTORY, 'packages', packageName, 'package.json' );
			const pkgJson = await fs.readJson( pkgJsonPath );

			return {
				packageName,
				scripts: pkgJson.scripts ? Object.keys( pkgJson.scripts ) : []
			};
		} )
	);

	const packagesWithTypes = packagesScriptsMap
		.filter( ( { scripts } ) => scripts.includes( 'types' ) )
		.map( ( { packageName } ) => packageName )
		.sort();
	const packagesWithTests = packagesScriptsMap
		.filter( ( { scripts } ) => scripts.includes( 'coverage' ) )
		.map( ( { packageName } ) => packageName )
		.sort();

	/**
	 * @type CircleCIConfiguration
	 */
	const config = yaml.load(
		await fs.readFile( upath.join( CIRCLECI_CONFIGURATION_DIRECTORY, 'template.yml' ) )
	);

	const stepsToAdd = [
		...generateSteps( packagesWithTypes, 'pnpm run types', 'Check types for "$1"' ),
		...generateSteps( packagesWithTests, 'pnpm run coverage', 'Execute tests for "$1"' ),
		{
			run: {
				name: 'Combine coverage reports into a single file',
				command: 'node scripts/ci/combine-coverage-lcov.js'
			}
		}
	];

	config.jobs.validate_and_tests.steps.splice( -1, 0, ...stepsToAdd );

	await fs.writeFile(
		upath.join( CIRCLECI_CONFIGURATION_DIRECTORY, 'config-tests.yml' ),
		yaml.dump( config, { lineWidth: -1 } )
	);
} )();

function generateSteps( packages, command, name ) {
	return packages.map( packageName => {
		return {
			run: {
				environment: {
					TZ: 'Europe/Warsaw'
				},
				// When a previous package failed, we still want to check the entire repository.
				when: 'always',
				name: name.replace( '$1', packageName ),
				working_directory: upath.join( 'packages', packageName ),
				command
			}
		};
	} );
}

/**
 * This type partially covers supported options on CircleCI.
 * To see the complete guide, follow: https://circleci.com/docs/configuration-reference.
 *
 * @typedef {Object} CircleCIConfiguration
 *
 * @property {string} version
 *
 * @property {Object.<String, CircleCIParameter>} parameters
 *
 * @property {Object.<String, CircleCIJob>} jobs
 *
 * @property {Object.<String, CircleCICommand>} command
 *
 * @property {Object} workflows
 *
 * @property {boolean} [setup]
 */

/**
 * @typedef {Object} CircleCIParameter
 *
 * @property {'string'|'boolean'|'integer'|'enum'} type
 *
 * @property {string|Number|Boolean} default
 */

/**
 * @typedef {Object} CircleCIJob
 *
 * @property {boolean} machine
 *
 * @property {Array.<string|CircleCITask>} steps
 *
 * @property {Object.<String, CircleCIParameter>} [parameters]
 */

/**
 * @typedef {Object} CircleCICommand
 *
 * @property {string} description
 *
 * @property {Array.<string|CircleCITask>} steps
 *
 * @property {Object.<String, CircleCIParameter>} [parameters]
 */

/**
 * @typedef {Object} CircleCITask
 *
 * @property {Object} [persist_to_workspace]
 *
 * @property {string} [persist_to_workspace.root]
 *
 * @property {Array.<string>} [persist_to_workspace.paths]
 *
 * @property {Object} [run]
 *
 * @property {string} [run.name]
 *
 * @property {string} [run.command]
 *
 * @property {string} [run.when]
 *
 * @property {string} [run.working_directory]
 */
