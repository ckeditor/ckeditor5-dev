/**
 * @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import type { UserConfig } from 'vite';

/**
 * A workaround for an upstream issue reported in https://github.com/rolldown/rolldown/issues/11625.
 *
 * The bundled dev server watches some directories with everything below them, for example the base
 * directory of an `import.meta.glob()` call in a manual test. On Linux such a directory is walked to
 * register every subdirectory, and the walk follows symbolic links. Packages of a pnpm workspace link
 * to each other through `node_modules`, so the walk does not finish in a reasonable time and the server
 * never becomes ready. Unlike the unbundled dev server, the bundled one does not skip `node_modules`
 * and `.git` by default.
 *
 * The watcher stays disabled when the project disabled it with `server.watch: null`.
 *
 * To remove the workaround once the issue is fixed upstream, delete this file and its usage in the
 * `config()` hook of the manual tests plugin.
 */
export function getWatchWorkaroundConfig( config: UserConfig ): Pick<UserConfig, 'server'> {
	if ( config.server?.watch === null ) {
		return {};
	}

	return {
		server: {
			watch: {
				exclude: [ '**/node_modules/**', '**/.git/**' ]
			}
		}
	};
}
