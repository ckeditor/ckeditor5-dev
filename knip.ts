/**
 * @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import type { KnipConfig } from 'knip';

/**
 * Configuration for the dependency checks (`pnpm run check-dependencies`), executed as:
 *
 *   knip --dependencies                        (unused and unlisted packages)
 *   knip --dependencies --production --strict  (misplaced `dependencies` vs `devDependencies`)
 *
 * Patterns marked with the `!` suffix describe production code. They must match the folders
 * that end up in the published packages (`lib`, `src`, `bin`, `theme`).
 */
const config: KnipConfig = {
	compilers: {
		// Extracts `@import` statements from plain CSS files, so packages imported in `theme/`
		// participate in the dependency checks. See https://knip.dev/features/compilers.
		css: ( text: string ) => [ ...text.matchAll( /(?<=@)import[^;]+/g ) ].join( '\n' )
	},

	workspaces: {
		'.': {
			entry: [ 'scripts/**/*.{js,mjs,cjs}', 'scripts-tests/**/*.{js,mjs}', '*.{js,mjs,ts}' ],
			project: [ 'scripts/**/*.{js,mjs,cjs}', 'scripts-tests/**/*.{js,mjs}', '*.{js,mjs,ts}' ],
			ignoreDependencies: [
				// Spawned via an explicit `node_modules/.bin` path in
				// `scripts/ci/check-dependencies-versions-match.mjs`, invisible to static analysis.
				'syncpack'
			]
		},
		// Note: a specific workspace entry replaces the `packages/*` one, so it repeats the patterns.
		'packages/ckeditor5-dev-manual-server': {
			ignore: [ 'tests/**/fixtures/**' ],
			entry: [
				'src/**/*.{js,mjs,cjs,ts}!',
				'theme/**/*.{js,mjs,cjs,ts}!',
				'theme/**/*.css!',
				'tests/**/*.{js,mjs,cjs,ts}'
			],
			project: [
				'src/**/*.{js,mjs,cjs,ts}!',
				'theme/**/*.{js,mjs,cjs,ts}!',
				'theme/**/*.css!',
				'tests/**/*.{js,mjs,cjs,ts}'
			],
			ignoreDependencies: [
				// The package exports Vite plugins and imports `vite` only in type positions,
				// but it deliberately ships `vite` as a runtime dependency for its consumers,
				// which run the manual test server.
				'vite'
			]
		},
		'packages/*': {
			// Test fixtures reference intentionally non-existent packages.
			ignore: [ 'tests/**/fixtures/**' ],
			entry: [
				'lib/**/*.{js,mjs,cjs}!',
				'src/**/*.{js,mjs,cjs,ts}!',
				'bin/**/*.{js,mjs,cjs}!',
				'theme/**/*.{js,mjs,cjs,ts}!',
				'theme/**/*.css!',
				'tests/**/*.{js,mjs,cjs,ts}',
				'scripts/**/*.{js,mjs,cjs,ts}'
			],
			project: [
				'lib/**/*.{js,mjs,cjs}!',
				'src/**/*.{js,mjs,cjs,ts}!',
				'bin/**/*.{js,mjs,cjs}!',
				'theme/**/*.{js,mjs,cjs,ts}!',
				'theme/**/*.css!',
				'tests/**/*.{js,mjs,cjs,ts}',
				'scripts/**/*.{js,mjs,cjs,ts}'
			]
		}
	}
};

export default config;
