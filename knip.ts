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

/**
 * Common configuration for the `packages/*` workspaces. Knip supports workspace configuration
 * only in the root config and a specific workspace entry does not merge with the `packages/*`
 * one, so single-package overrides go through this helper instead of repeating the patterns.
 */
// The `entry` and `project` options receive the same patterns: for dependency checks every
// analyzed file acts as an entry point, and restricting `project` prevents Knip from pulling
// unrelated files into the analysis.
const packageFiles = [
	'lib/**/*.{js,mjs,cjs}!',
	'src/**/*.{js,mjs,cjs,ts}!',
	'bin/**/*.{js,mjs,cjs}!',
	'theme/**/*.{js,mjs,cjs,ts}!',
	'theme/**/*.css!',
	'tests/**/*.{js,mjs,cjs,ts}',
	'scripts/**/*.{js,mjs,cjs,ts}'
];

const rootFiles = [ 'scripts/**/*.{js,mjs,cjs}', 'scripts-tests/**/*.{js,mjs}', '*.{js,mjs,ts}' ];

const packageWorkspace = ( ignoreDependencies: Array<string> = [] ) => ( {
	// Test fixtures reference intentionally non-existent packages.
	ignore: [ 'tests/**/fixtures/**' ],
	entry: packageFiles,
	project: packageFiles,
	ignoreDependencies
} );

/**
 * Type packages imported by production code live in `dependencies`, because type-only imports
 * that are part of a package's public API must resolve in consumer projects, for example under
 * Yarn PnP. See https://github.com/ckeditor/ckeditor5/issues/17213.
 *
 * Knip expects the opposite (type-only imports in `devDependencies`) and its strict production
 * mode would report such packages as unused, so they are ignored there (the `!` suffix scopes
 * the ignore to production mode). See https://github.com/webpro-nl/knip/issues/248.
 */
const typeDependencyWorkspace = ( ignoreDependencies: Array<string> ) =>
	packageWorkspace( ignoreDependencies.map( dependency => `${ dependency }!` ) );

const config: KnipConfig = {
	compilers: {
		// Extracts `@import` statements from plain CSS files, so packages imported in `theme/`
		// participate in the dependency checks. See https://knip.dev/features/compilers.
		css: ( text: string ) => [ ...text.matchAll( /(?<=@)import[^;]+/g ) ].join( '\n' )
	},

	workspaces: {
		'.': {
			entry: rootFiles,
			project: rootFiles,
			ignoreDependencies: [
				// Spawned via an explicit `node_modules/.bin` path in
				// `scripts/ci/check-dependencies-versions-match.mjs`, invisible to static analysis.
				'syncpack'
			]
		},
		'packages/ckeditor5-dev-manual-server': packageWorkspace( [
			// The package exports Vite plugins and imports `vite` only in type positions,
			// but it deliberately ships `vite` as a runtime dependency for its consumers,
			// which run the manual test server.
			'vite'
		] ),
		'packages/ckeditor5-dev-build-tools': typeDependencyWorkspace( [ 'type-fest' ] ),
		'packages/ckeditor5-dev-changelog': typeDependencyWorkspace( [ '@types/semver' ] ),
		'packages/ckeditor5-dev-utils': typeDependencyWorkspace( [ '@types/pacote' ] ),
		'packages/*': packageWorkspace()
	}
};

export default config;
