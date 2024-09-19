#!/usr/bin/env node

/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

/* eslint-env node */

// The script assumes that it is executed from the CKEditor 5 Commercial directory and aims to load
// the template file (`.circleci/template.yml`) and store it under the `.circleci/config-tests.yml` path,
// a source for a new workflow triggered from the main thread when a new build starts.
//
// See: https://circleci.com/docs/using-dynamic-configuration/.

import fs from 'fs-extra';
import { fileURLToPath } from 'url';
import upath from 'upath';
import { glob } from 'glob';
import yaml from 'js-yaml';

const __filename = fileURLToPath( import.meta.url );
const __dirname = upath.dirname( __filename );

const ROOT_DIRECTORY = upath.join( __dirname, '..', '..' );
const CIRCLECI_CONFIGURATION_DIRECTORY = upath.join( ROOT_DIRECTORY, '.circleci' );

( async () => {
	const packages = await glob( '*/', { cwd: upath.join( ROOT_DIRECTORY, 'packages' ) } );
	const packagesWithTests = await asyncFilter( packages, async packageName => {
		const pkgJson = await fs.readJson(
			upath.join( ROOT_DIRECTORY, 'packages', packageName, 'package.json' )
		);

		return pkgJson?.scripts?.coverage;
	} );

	packagesWithTests.sort();

	/**
	 * @type CircleCIConfiguration
	 */
	const config = yaml.load(
		await fs.readFile( upath.join( CIRCLECI_CONFIGURATION_DIRECTORY, 'template.yml' ) )
	);

	config.jobs.validate_and_tests.steps.splice( 3, 0, ...generateTestSteps( packagesWithTests ) );
	config.jobs.validate_and_tests.steps.splice( -1, 0, {
		run: {
			name: 'Combine coverage reports into a single file',
			command: 'node scripts/ci/combine-coverage-lcov.js'
		}
	} );

	await fs.writeFile(
		upath.join( CIRCLECI_CONFIGURATION_DIRECTORY, 'config-tests.yml' ),
		yaml.dump( config, { lineWidth: -1 } )
	);
} )();

async function asyncFilter( items, predicate ) {
	return items.reduce( async ( results, item ) => {
		return [
			...await results,
			...await predicate( item ) ? [ item ] : []
		];
	}, [] );
}

function generateTestSteps( packages ) {
	return packages.map( packageName => {
		return {
			run: {
				environment: {
					TZ: 'Europe/Warsaw'
				},
				// When a previous package failed, we still want to check the entire repository.
				when: 'always',
				name: `Execute tests for "${ packageName }"`,
				working_directory: upath.join( 'packages', packageName ),
				command: 'yarn run coverage'
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
 * @property {String} version
 *
 * @property {Object.<String, CircleCIParameter>} parameters
 *
 * @property {Object.<String, CircleCIJob>} jobs
 *
 * @property {Object.<String, CircleCICommand>} command
 *
 * @property {Object} workflows
 *
 * @property {Boolean} [setup]
 */

/**
 * @typedef {Object} CircleCIParameter
 *
 * @property {'string'|'boolean'|'integer'|'enum'} type
 *
 * @property {String|Number|Boolean} default
 */

/**
 * @typedef {Object} CircleCIJob
 *
 * @property {Boolean} machine
 *
 * @property {Array.<String|CircleCITask>} steps
 *
 * @property {Object.<String, CircleCIParameter>} [parameters]
 */

/**
 * @typedef {Object} CircleCICommand
 *
 * @property {String} description
 *
 * @property {Array.<String|CircleCITask>} steps
 *
 * @property {Object.<String, CircleCIParameter>} [parameters]
 */

/**
 * @typedef {Object} CircleCITask
 *
 * @property {Object} [persist_to_workspace]
 *
 * @property {String} [persist_to_workspace.root]
 *
 * @property {Array.<String>} [persist_to_workspace.paths]
 *
 * @property {Object} [run]
 *
 * @property {String} [run.name]
 *
 * @property {String} [run.command]
 *
 * @property {String} [run.when]
 *
 * @property {String} [run.working_directory]
 */
