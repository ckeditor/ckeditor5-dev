/**
 * @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

/* eslint-disable @stylistic/max-len */

import { afterEach, describe, it, expect } from 'vitest';
import upath from 'upath';
import { loadTargets, normalizeTarget } from '../../src/config/loadtargets.js';
import { createTempDirectory, removeTempDirectories, writeFiles } from '../_utils/files.js';
import type { LoadedTask } from '../../src/config/loadtasks.js';
import type { TargetConfig, Task } from '../../src/types.js';

describe( 'targets', () => {
	afterEach( removeTempDirectories );

	const task: Task = {
		id: 'meta',
		title: 'Task',
		ruleIds: [ 'R1' ],
		scope: () => [],
		contentHash: () => 'x',
		payload: () => undefined,
		judge: () => []
	};

	// A task with its own settings, which a target may override.
	const configured: Task = {
		...task,
		id: 'bluf',
		include: [ 'docs/**/*.md' ],
		exclude: [ 'docs/api/**' ],
		maxUnits: 20,
		defaultOptions: { limit: 60, strict: true }
	};

	// A task whose units are the files matching `include`.
	const files: Task = {
		...task,
		id: 'files',
		scope: undefined,
		include: [ 'docs/**/*.md' ]
	};

	const tasks = new Map<string, LoadedTask>( [
		[ 'meta', { task, directory: '/tasks/meta' } ],
		[ 'bluf', { task: configured, directory: '/tasks/bluf' } ],
		[ 'files', { task: files, directory: '/tasks/files' } ]
	] );

	const valid: TargetConfig = {
		slug: 'owner/repo',
		tasks: { meta: {} }
	};

	// The task as an instance with the default settings runs it.
	const metaInstance = {
		task: { ...task, include: [], exclude: [], maxUnits: 100, options: {} },
		directory: '/tasks/meta',
		enabled: true
	};

	describe( 'loadTargets()', () => {
		it( 'loads `.js`, `.mjs`, `.ts` and `.mts` targets', async () => {
			const configPath = await createTempDirectory();
			const module = ( root: string ) => `export default ${ JSON.stringify( { ...valid, root } ) };\n`;

			await writeFiles( configPath, {
				'targets/a.js': module( '.' ),
				'targets/b.mjs': module( 'b' ),
				'targets/c.ts': module( 'c' ),
				'targets/d.mts': module( 'd' ),
				'targets/notes.md': 'ignored'
			} );

			const targets = await loadTargets( upath.join( configPath, 'targets' ), tasks );

			expect( [ ...targets.keys() ] ).toEqual( [ 'a', 'b', 'c', 'd' ] );
			expect( targets.get( 'a' ) ).toEqual( {
				name: 'a',
				slug: 'owner/repo',
				root: '.',
				tasks: new Map( [ [ 'meta', metaInstance ] ] )
			} );
		} );

		it( 'throws when a target is defined in more than one file', async () => {
			const configPath = await createTempDirectory();
			const module = `export default ${ JSON.stringify( valid ) };\n`;

			await writeFiles( configPath, { 'targets/a.js': module, 'targets/a.mjs': module } );

			await expect( loadTargets( upath.join( configPath, 'targets' ), tasks ) )
				.rejects.toThrow( 'The "a" target is defined in more than one file.' );
		} );

		it( 'throws when two targets keep the state of a task in the same directory of a repository', async () => {
			const configPath = await createTempDirectory();

			await writeFiles( configPath, {
				'targets/a.js': `export default ${ JSON.stringify( { ...valid, root: 'docs' } ) };\n`,
				'targets/b.js': `export default ${ JSON.stringify( { ...valid, root: './docs/', tasks: { other: { task: 'meta' }, meta: {} } } ) };\n`
			} );

			await expect( loadTargets( upath.join( configPath, 'targets' ), tasks ) ).rejects.toThrow(
				'The "a" and "b" targets keep the state of the "meta" task in the same directory of owner/repo: "docs/.ai-tasks/meta". ' +
				'Give them different roots, or name the task differently in one of them.'
			);
		} );

		it( 'accepts targets that share a root in different repositories, or run differently named tasks in it', async () => {
			const configPath = await createTempDirectory();

			await writeFiles( configPath, {
				'targets/a.js': `export default ${ JSON.stringify( valid ) };\n`,
				'targets/b.js': `export default ${ JSON.stringify( { ...valid, slug: 'owner/other' } ) };\n`,
				'targets/c.js': `export default ${ JSON.stringify( { ...valid, tasks: { other: { task: 'meta' } } } ) };\n`
			} );

			expect( [ ...( await loadTargets( upath.join( configPath, 'targets' ), tasks ) ).keys() ] ).toEqual( [ 'a', 'b', 'c' ] );
		} );
	} );

	describe( 'normalizeTarget()', () => {
		const options = { name: 'x', tasks };

		it( 'normalizes the root and resolves the task entries to instances with the defaults of the framework', () => {
			const target = normalizeTarget( {
				...valid,
				root: './projects//cs',
				tasks: {
					meta: { enabled: false, maxUnits: 5, include: [ 'docs/**' ], exclude: [ 'docs/x.md' ], options: { limit: 1 } }
				}
			}, options );

			expect( target.root ).toBe( 'projects/cs' );
			expect( target.tasks.get( 'meta' ) ).toEqual( {
				...metaInstance,
				task: { ...metaInstance.task, include: [ 'docs/**' ], exclude: [ 'docs/x.md' ], maxUnits: 5, options: { limit: 1 } },
				enabled: false
			} );
		} );

		it( 'uses the settings of the task when an entry does not override them', () => {
			const target = normalizeTarget( { ...valid, tasks: { bluf: {} } }, options );

			expect( target.tasks.get( 'bluf' ) ).toEqual( {
				task: { ...configured, options: { limit: 60, strict: true } },
				directory: '/tasks/bluf',
				enabled: true
			} );
		} );

		it( 'lets an entry override every setting of the task, and single options', () => {
			const target = normalizeTarget( {
				...valid,
				tasks: { bluf: { include: [ 'guides/**' ], exclude: [], maxUnits: 3, options: { limit: 40 } } }
			}, options );

			expect( target.tasks.get( 'bluf' )!.task ).toMatchObject( {
				include: [ 'guides/**' ],
				exclude: [],
				maxUnits: 3,
				options: { limit: 40, strict: true }
			} );
		} );

		it( 'runs one task as several named instances', () => {
			const target = normalizeTarget( {
				...valid,
				tasks: {
					bluf: {},
					'api-bluf': { task: 'bluf', include: [ 'api/**' ] }
				}
			}, options );

			expect( [ ...target.tasks.keys() ] ).toEqual( [ 'bluf', 'api-bluf' ] );
			expect( target.tasks.get( 'bluf' )!.task ).toMatchObject( { id: 'bluf', title: 'Task' } );
			expect( target.tasks.get( 'api-bluf' ) ).toMatchObject( {
				task: { id: 'api-bluf', title: 'Task (api-bluf)', include: [ 'api/**' ], maxUnits: 20, judge: configured.judge },
				directory: '/tasks/bluf'
			} );
			expect( configured.id ).toBe( 'bluf' );
		} );

		it.each( [
			[ 'no default export', undefined, 'the module must export by default a target with a `slug` like "owner/repository".' ],
			[ 'a wrong slug', { ...valid, slug: 'repo' }, 'the module must export by default a target with a `slug` like "owner/repository".' ],
			[ 'an absolute root', { ...valid, root: '/abs' }, '`root` must be a path inside the repository.' ],
			[ 'a root outside the repository', { ...valid, root: '../x' }, '`root` must be a path inside the repository.' ],
			[ 'an unknown task', { ...valid, tasks: { other: {} } }, 'the "other" task does not exist.' ],
			[ 'an instance of an unknown task', { ...valid, tasks: { mine: { task: 'other' } } }, 'the "other" task does not exist.' ],
			[ 'an empty instance name', { ...valid, tasks: { '': { task: 'meta' } } }, 'the "" task name may not be empty or contain "|", "/" or "\\".' ],
			[ 'an instance name with a pipe', { ...valid, tasks: { 'a|b': { task: 'meta' } } }, 'the "a|b" task name may not be empty or contain "|", "/" or "\\".' ],
			[ 'an instance name with a slash', { ...valid, tasks: { 'a/b': { task: 'meta' } } }, 'the "a/b" task name may not be empty or contain "|", "/" or "\\".' ],
			[ 'an instance name with a backslash', { ...valid, tasks: { 'a\\b': { task: 'meta' } } }, 'the "a\\b" task name may not be empty or contain "|", "/" or "\\".' ],
			[ 'an empty `include` of a task without `scope()`', { ...valid, tasks: { files: { include: [] } } },
				'The "files" task is invalid: it needs `scope()`, or `include` to work on the matching files.' ],
			[ 'an invalid `maxUnits`', { ...valid, tasks: { mine: { task: 'meta', maxUnits: 0 } } }, 'The "mine" task is invalid: `maxUnits` must be an integer of 1 or more.' ]
		] )( 'rejects a target with %s', ( _name, config, message ) => {
			expect( () => normalizeTarget( config, options ) ).toThrow( `The "x" target is invalid: ${ message }` );
		} );
	} );
} );
