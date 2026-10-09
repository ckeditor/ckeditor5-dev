/**
 * @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import upath from 'upath';
import { STATE_DIRECTORY } from '../constants.js';
import { isOutside } from '../utils/files.js';
import { getErrorMessage } from '../utils/strings.js';
import { importDefaultExports } from './importmodules.js';
import { validateTask, type LoadedTask } from './loadtasks.js';
import type { Target, TargetConfig, TargetTaskConfig, TaskInstance } from '../types.js';

// How many changed units one run judges at most, when neither the task nor the target sets `maxUnits`.
const DEFAULT_MAX_UNITS = 100;

/**
 * Loads every target from `<targetsPath>/<name>.{js,mjs,ts,mts}`. Adding a repository means adding a file.
 */
export async function loadTargets( targetsPath: string, tasks: Map<string, LoadedTask> ): Promise<Map<string, Target>> {
	const targets = new Map<string, Target>();

	for ( const { file, value } of await importDefaultExports( targetsPath, '*.{js,mjs,ts,mts}' ) ) {
		const name = file.replace( /\.(js|mjs|ts|mts)$/, '' );

		if ( targets.has( name ) ) {
			throw new Error( `The "${ name }" target is defined in more than one file.` );
		}

		targets.set( name, normalizeTarget( value as TargetConfig | undefined, { name, tasks } ) );
	}

	assertSeparateStates( [ ...targets.values() ] );

	return targets;
}

export function normalizeTarget(
	config: TargetConfig | undefined,
	{ name, tasks }: { name: string; tasks: Map<string, LoadedTask> }
): Target {
	const invalid = ( message: string ) => new Error( `The "${ name }" target is invalid: ${ message }` );

	if ( !config || !/^[\w.-]+\/[\w.-]+$/.test( config.slug ) ) {
		throw invalid( 'the module must export by default a target with a `slug` like "owner/repository".' );
	}

	const root = upath.normalize( config.root ?? '.' );

	if ( isOutside( root ) ) {
		throw invalid( '`root` must be a path inside the repository.' );
	}

	const instances = new Map<string, TaskInstance>();

	for ( const [ instanceId, entry ] of Object.entries( config.tasks ) ) {
		if ( instanceId === '' || /[|/\\]/.test( instanceId ) ) {
			throw invalid( `the "${ instanceId }" task name may not be empty or contain "|", "/" or "\\".` );
		}

		const loaded = tasks.get( entry.task ?? instanceId );

		if ( !loaded ) {
			throw invalid( `the "${ entry.task ?? instanceId }" task does not exist.` );
		}

		const instance = resolveInstance( instanceId, entry, loaded );

		// The overrides of the target may break the rules of the task, for example with an empty `include`.
		try {
			validateTask( instance.task, instanceId );
		} catch ( error ) {
			throw invalid( getErrorMessage( error ) );
		}

		instances.set( instanceId, instance );
	}

	return { name, slug: config.slug, root, tasks: instances };
}

/**
 * Throws when two targets would keep the state of a task in the same directory of the same repository. Each run would
 * then drop the baseline and the findings of the other target.
 */
function assertSeparateStates( targets: Array<Target> ): void {
	const owners = new Map<string, string>();

	for ( const target of targets ) {
		for ( const instanceId of target.tasks.keys() ) {
			const statePath = upath.join( target.root, STATE_DIRECTORY, instanceId );
			const key = `${ target.slug }:${ statePath }`;
			const owner = owners.get( key );

			if ( owner ) {
				throw new Error(
					`The "${ owner }" and "${ target.name }" targets keep the state of the "${ instanceId }" task in the same ` +
					`directory of ${ target.slug }: "${ statePath }". ` +
					'Give them different roots, or name the task differently in one of them.'
				);
			}

			owners.set( key, target.name );
		}
	}
}

/**
 * Puts the task under the name of the instance and applies the overrides of the target. An instance that runs a task
 * under another name says so in its title, so its report pull request can be told apart from the one of the task.
 */
function resolveInstance( instanceId: string, entry: TargetTaskConfig, { task, directory }: LoadedTask ): TaskInstance {
	return {
		task: {
			...task,
			id: instanceId,
			title: instanceId === task.id ? task.title : `${ task.title } (${ instanceId })`,
			include: entry.include ?? task.include ?? [],
			exclude: entry.exclude ?? task.exclude ?? [],
			maxUnits: entry.maxUnits ?? task.maxUnits ?? DEFAULT_MAX_UNITS,
			options: { ...task.defaultOptions, ...entry.options }
		},
		directory,
		enabled: entry.enabled !== false
	};
}
