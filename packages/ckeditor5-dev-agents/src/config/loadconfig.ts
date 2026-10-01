/**
 * @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import upath from 'upath';
import { loadTasks } from './loadtasks.js';
import { loadTargets } from './loadtargets.js';
import type { Target } from '../types.js';

/**
 * Loads the targets of the config directory, with their tasks. A directory without tasks or targets is almost always
 * the wrong one, so it throws instead of running nothing.
 */
export async function loadConfig( configPath: string ): Promise<Map<string, Target>> {
	const tasks = await loadTasks( upath.join( configPath, 'tasks' ) );
	const targets = await loadTargets( upath.join( configPath, 'targets' ), tasks );

	for ( const [ name, items ] of [ [ 'tasks', tasks ], [ 'targets', targets ] ] as const ) {
		if ( !items.size ) {
			throw new Error(
				`No ${ name } found in "${ upath.join( configPath, name ) }". ` +
				'Check that "--config" points to the directory with "tasks/" and "targets/".'
			);
		}
	}

	return targets;
}
