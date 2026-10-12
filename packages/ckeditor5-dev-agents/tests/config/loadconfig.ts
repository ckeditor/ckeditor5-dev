/**
 * @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { afterEach, describe, it, expect } from 'vitest';
import upath from 'upath';
import { loadConfig } from '../../src/config/loadconfig.js';
import { createTempDirectory, removeTempDirectories, writeFiles } from '../_utils/files.js';

const TASK = 'export default { id: \'t\', title: \'T\', ruleIds: [ \'R1\' ], include: [ \'*.md\' ], ' +
	'contentHash: () => \'x\', payload: () => null, judge: () => [] };\n';
const TARGET = 'export default { slug: \'owner/repo\', tasks: { t: {} } };\n';

describe( 'loadConfig()', () => {
	afterEach( removeTempDirectories );

	it( 'loads the targets of the config directory with their tasks', async () => {
		const configPath = await createTempDirectory();

		await writeFiles( configPath, { 'tasks/t/index.mjs': TASK, 'targets/repo.mjs': TARGET } );

		const targets = await loadConfig( configPath );

		expect( [ ...targets.keys() ] ).toEqual( [ 'repo' ] );
		expect( [ ...targets.get( 'repo' )!.tasks.keys() ] ).toEqual( [ 't' ] );
	} );

	it( 'throws when the directory has no tasks', async () => {
		const configPath = await createTempDirectory();

		await expect( loadConfig( configPath ) ).rejects.toThrow(
			`No tasks found in "${ upath.join( configPath, 'tasks' ) }". ` +
			'Check that "--config" points to the directory with "tasks/" and "targets/".'
		);
	} );

	it( 'throws when the directory has no targets', async () => {
		const configPath = await createTempDirectory();

		await writeFiles( configPath, { 'tasks/t/index.mjs': TASK } );

		await expect( loadConfig( configPath ) ).rejects.toThrow( `No targets found in "${ upath.join( configPath, 'targets' ) }".` );
	} );
} );
