/**
 * @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { spawn } from 'node:child_process';
import { glob, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import upath from 'upath';
import { isOutside } from '../utils/files.js';
import { hash, normalise } from '../utils/text.js';
import type { Agent, TaskContext, TaskPhase, WritableTaskContext } from '../types.js';

type ContextOptions = {
	root: string;
	phase: TaskPhase;
	options: Record<string, unknown>;
	agent: Agent;
	log: ( message: string ) => void;
};

const MAX_OUTPUT_LENGTH = 4000;

/**
 * Creates the `ctx` of the judging phase. It can read the target, but not change it.
 */
export function createTaskContext( { root, phase, options, agent, log }: ContextOptions ): TaskContext {
	return {
		phase,
		options,
		agent,
		log,
		normalise,
		hash,
		repo: {
			root,

			async list( patterns, { ignore = [] } = {} ) {
				const entries = glob( patterns, {
					cwd: root,
					withFileTypes: true,
					exclude: [ '**/node_modules/**', ...ignore ]
				} );
				const files = [];

				for await ( const entry of entries ) {
					if ( !entry.isDirectory() ) {
						files.push( upath.relative( root, upath.join( entry.parentPath, entry.name ) ) );
					}
				}

				return files.sort();
			},

			async read( path ) {
				return readFile( resolveInside( root, path ), 'utf8' );
			}
		}
	};
}

/**
 * Creates the `ctx` of `fix()` and `verify()`. It can also change files and run commands in the target root.
 */
export function createWritableTaskContext( options: ContextOptions ): WritableTaskContext {
	const context = createTaskContext( options );

	return {
		...context,
		repo: {
			...context.repo,

			async write( path, content ) {
				const absolutePath = resolveInside( options.root, path );

				await mkdir( upath.dirname( absolutePath ), { recursive: true } );
				await writeFile( absolutePath, content );
			},

			async remove( path ) {
				await rm( resolveInside( options.root, path ), { force: true } );
			}
		},

		exec( command, args = [], { timeout } = {} ) {
			return execute( { command, args, cwd: options.root, timeout } );
		}
	};
}

export function resolveInside( root: string, path: string ): string {
	const absolutePath = upath.resolve( root, path );
	const relativePath = upath.relative( root, absolutePath );

	if ( isOutside( relativePath ) ) {
		throw new Error( `The "${ path }" path is outside of the target root.` );
	}

	return absolutePath;
}

function execute( { command, args, cwd, timeout }: {
	command: string;
	args: Array<string>;
	cwd: string;
	timeout?: number;
} ): Promise<{ output: string }> {
	return new Promise( ( resolve, reject ) => {
		const child = spawn( command, args, { cwd, timeout, stdio: [ 'ignore', 'pipe', 'pipe' ] } );

		let output = '';

		const append = ( data: Buffer ) => {
			output = ( output + data.toString() ).slice( -MAX_OUTPUT_LENGTH );
		};

		child.stdout.on( 'data', append );
		child.stderr.on( 'data', append );
		child.on( 'error', reject );
		child.on( 'close', ( code, signal ) => {
			if ( code === 0 ) {
				resolve( { output } );

				return;
			}

			// A command that times out is killed, so it has a signal instead of an exit code.
			let reason = `exited with code ${ code }`;

			if ( timeout && child.killed ) {
				reason = `did not finish within ${ timeout } ms`;
			} else if ( signal ) {
				reason = `was stopped by ${ signal }`;
			}

			reject( new Error( `"${ [ command, ...args ].join( ' ' ) }" ${ reason }:\n${ output }` ) );
		} );
	} );
}
