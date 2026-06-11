/**
 * @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { mkdir, mkdtemp, realpath, rm, writeFile } from 'node:fs/promises';

export async function createTemporaryDirectory( prefix: string ): Promise<string> {
	return realpath( await mkdtemp( join( tmpdir(), prefix ) ) );
}

export async function removeDirectory( directoryPath: string ): Promise<void> {
	await rm( directoryPath, { recursive: true, force: true } );
}

export async function createFile( root: string, relativeFilePath: string, content = '' ): Promise<string> {
	const filePath = join( root, relativeFilePath );

	await mkdir( dirname( filePath ), { recursive: true } );
	await writeFile( filePath, content );

	return filePath;
}
