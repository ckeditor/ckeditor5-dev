/**
 * @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

/* eslint-disable @stylistic/max-len */

import { afterEach, describe, it, expect } from 'vitest';
import upath from 'upath';
import { loadTasks, validateTask } from '../../src/config/loadtasks.js';
import { createTempDirectory, removeTempDirectories, writeFiles } from '../_utils/files.js';
import type { Task } from '../../src/types.js';

const HOOKS = 'scope() { return []; }, contentHash() { return "x"; }, payload() {}, judge() { return []; }';

function taskModule( id: string, extra = '' ): string {
	return `export default { id: '${ id }', title: 'Task ${ id }', ruleIds: [ 'R1' ], ${ HOOKS }${ extra ? `, ${ extra }` : '' } };\n`;
}

describe( 'loadTasks()', () => {
	afterEach( removeTempDirectories );

	it( 'loads `.js`, `.mjs`, `.ts` and `.mts` tasks with their directories', async () => {
		const root = await createTempDirectory();

		await writeFiles( root, {
			'a/index.js': taskModule( 'a' ),
			'b/index.mjs': taskModule( 'b', 'concurrency: 3' ),
			'c/index.ts': taskModule( 'c' ).replace( 'export default {', 'const task: Record<string, unknown> = {' ) + 'export default task;\n',
			'd/other.js': taskModule( 'd' ),
			'e/index.mts': taskModule( 'e' )
		} );

		const tasks = await loadTasks( root );

		expect( [ ...tasks.keys() ] ).toEqual( [ 'a', 'b', 'c', 'e' ] );
		expect( tasks.get( 'a' )!.directory ).toBe( upath.join( root, 'a' ) );
		expect( tasks.get( 'b' )!.task.concurrency ).toBe( 3 );
		expect( tasks.get( 'c' )!.task.title ).toBe( 'Task c' );
	} );

	it( 'returns nothing when the directory does not exist', async () => {
		expect( ( await loadTasks( upath.join( await createTempDirectory(), 'missing' ) ) ).size ).toBe( 0 );
	} );

	it( 'throws when a task has more than one index file', async () => {
		const root = await createTempDirectory();

		await writeFiles( root, { 'a/index.js': taskModule( 'a' ), 'a/index.mjs': taskModule( 'a' ) } );

		await expect( loadTasks( root ) ).rejects.toThrow( 'The "a" task has more than one `index` file.' );
	} );

	it( 'validates every task', async () => {
		const root = await createTempDirectory();

		await writeFiles( root, { 'a/index.js': taskModule( 'b' ) } );

		await expect( loadTasks( root ) ).rejects.toThrow(
			'The "a" task is invalid: the module must export by default a task whose `id` matches the directory name ("a").'
		);
	} );
} );

describe( 'validateTask()', () => {
	const noop = () => {};
	const valid: Task = {
		id: 't',
		title: 'Task',
		ruleIds: [ 'R1', 'R2' ],
		scope: noop as never,
		contentHash: () => 'x',
		payload: noop,
		judge: () => []
	};
	const agent = { model: { provider: 'a', id: 'b' } };

	it( 'accepts a valid task', () => {
		expect( () => validateTask( valid, 't' ) ).not.toThrow();
		expect( () => validateTask( {
			...valid,
			fix: noop,
			verify: noop,
			writes: [ 'docs/**' ],
			agent: { ...agent, judgeTools: [ 'read', 'grep' ], fixTools: [ 'bash' ] }
		}, 't' ) ).not.toThrow();
	} );

	it( 'accepts a task with `include` instead of `scope()`', () => {
		expect( () => validateTask( { ...valid, scope: undefined, include: [ 'docs/**/*.md' ] }, 't' ) ).not.toThrow();
	} );

	it.each( [
		[ 'no default export', undefined, 'the module must export by default a task whose `id` matches the directory name ("t").' ],
		[ 'a wrong id', { ...valid, id: 'x' }, 'the module must export by default a task whose `id` matches the directory name ("t").' ],
		[ 'an empty rule', { ...valid, ruleIds: [ '' ] }, 'every rule ID must be a non-empty string without "|".' ],
		[ 'a rule with a pipe', { ...valid, ruleIds: [ 'a|b' ] }, 'every rule ID must be a non-empty string without "|".' ],
		[ 'duplicated rules', { ...valid, ruleIds: [ 'R1', 'R1' ] }, '`ruleIds` must be unique.' ],
		[ 'no scope() and no include', { ...valid, scope: undefined }, 'it needs `scope()`, or `include` to work on the matching files.' ],
		[ 'no scope() and an empty include', { ...valid, scope: undefined, include: [] },
			'it needs `scope()`, or `include` to work on the matching files.' ],
		[ 'writes without fix()', { ...valid, writes: [ 'docs/**' ] }, 'a task with `writes` must define `fix()`.' ],
		[ 'fix() without writes', { ...valid, fix: noop }, 'a task with `fix()` must define `writes`: the files the fix may change.' ],
		[ 'fix() with empty writes', { ...valid, fix: noop, writes: [] }, 'a task with `fix()` must define `writes`: the files the fix may change.' ],
		[ 'verify() without fix()', { ...valid, verify: noop }, '`verify()` checks a fix, so it requires `fix()`.' ],
		[ 'writing tools while judging', { ...valid, agent: { ...agent, judgeTools: [ 'read', 'bash', 'edit' ] } },
			'`agent.judgeTools` may contain only read-only tools (read, grep, find, ls). Remove: bash, edit.' ]
	] )( 'rejects a task with %s', ( _name, task, message ) => {
		expect( () => validateTask( task, 't' ) ).toThrow( `The "t" task is invalid: ${ message }` );
	} );
} );
