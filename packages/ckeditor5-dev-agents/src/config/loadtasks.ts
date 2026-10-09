/**
 * @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import upath from 'upath';
import { AGENT_TOOLS, READ_ONLY_TOOLS } from '../constants.js';
import { importDefaultExports } from './importmodules.js';
import type { Task } from '../types.js';

export type LoadedTask = {
	task: Task;

	/**
	 * An absolute path to the directory of the task.
	 */
	directory: string;
};

/**
 * Loads every task from `<tasksPath>/<id>/index.{js,mjs,ts,mts}`. Adding a task means adding a directory.
 */
export async function loadTasks( tasksPath: string ): Promise<Map<string, LoadedTask>> {
	const tasks = new Map<string, LoadedTask>();

	for ( const { file, value } of await importDefaultExports( tasksPath, '*/index.{js,mjs,ts,mts}' ) ) {
		const id = upath.dirname( file );

		if ( tasks.has( id ) ) {
			throw new Error( `The "${ id }" task has more than one \`index\` file.` );
		}

		validateTask( value as Task | undefined, id );
		tasks.set( id, { task: value as Task, directory: upath.join( tasksPath, id ) } );
	}

	return tasks;
}

/**
 * Checks the rules of a task that its type cannot express.
 */
export function validateTask( task: Task | undefined, id: string ): void {
	const invalid = ( message: string ) => new Error( `The "${ id }" task is invalid: ${ message }` );

	if ( task?.id !== id ) {
		throw invalid( `the module must export by default a task whose \`id\` matches the directory name ("${ id }").` );
	}

	if ( task.ruleIds.some( ruleId => ruleId === '' || ruleId.includes( '|' ) ) ) {
		throw invalid( 'every rule ID must be a non-empty string without "|".' );
	}

	if ( new Set( task.ruleIds ).size !== task.ruleIds.length ) {
		throw invalid( '`ruleIds` must be unique.' );
	}

	if ( !task.scope && !task.include?.length ) {
		throw invalid( 'it needs `scope()`, or `include` to work on the matching files.' );
	}

	if ( task.writes?.length && !task.fix ) {
		throw invalid( 'a task with `writes` must define `fix()`.' );
	}

	if ( task.fix && !task.writes?.length ) {
		throw invalid( 'a task with `fix()` must define `writes`: the files the fix may change.' );
	}

	if ( task.verify && !task.fix ) {
		throw invalid( '`verify()` checks a fix, so it requires `fix()`.' );
	}

	// The changed files are matched as paths relative to the target root, which never start with "./", "../" or "/".
	const unmatchablePatterns = ( task.writes ?? [] ).filter( pattern => /^\.{0,2}\//.test( pattern ) );

	if ( unmatchablePatterns.length ) {
		throw invalid( '`writes` must be globs relative to the target root, without a leading "./", "../" or "/". ' +
			`Fix: ${ unmatchablePatterns.join( ', ' ) }.` );
	}

	for ( const field of [ 'maxUnits', 'concurrency' ] as const ) {
		const value = task[ field ];

		if ( value !== undefined && !( Number.isInteger( value ) && value >= 1 ) ) {
			throw invalid( `\`${ field }\` must be an integer of 1 or more.` );
		}
	}

	const unknownTools = [ ...task.agent?.judgeTools ?? [], ...task.agent?.fixTools ?? [] ].filter( tool => !AGENT_TOOLS.includes( tool ) );

	if ( unknownTools.length ) {
		throw invalid( `the agent has no such tools: ${ [ ...new Set( unknownTools ) ].join( ', ' ) }. ` +
			`The available tools are: ${ AGENT_TOOLS.join( ', ' ) }.` );
	}

	const writingTools = ( task.agent?.judgeTools ?? [] ).filter( tool => !READ_ONLY_TOOLS.includes( tool ) );

	if ( writingTools.length ) {
		throw invalid( `\`agent.judgeTools\` may contain only read-only tools (${ READ_ONLY_TOOLS.join( ', ' ) }). ` +
			`Remove: ${ writingTools.join( ', ' ) }.` );
	}
}
