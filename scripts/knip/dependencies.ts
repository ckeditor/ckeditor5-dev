/**
 * @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import type { KnipConfig } from 'knip';

/**
 * Configuration for the dependency checks (`pnpm run check-dependencies`), which runs Knip
 * with this configuration twice:
 *
 *   --dependencies                        (unused and unlisted packages)
 *   --dependencies --production           (production dependency issues)
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

const rootFiles = [ 'scripts/**/*.{js,mjs,cjs,ts}', 'scripts-tests/**/*.{js,mjs}', '*.{js,mjs,ts}' ];

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
				// Resolved and spawned dynamically by
				// `scripts/ci/check-dependencies-versions-match.mjs`, invisible to static analysis.
				'syncpack'
			]
		},
		'packages/*': {
			// Test fixtures reference intentionally non-existent packages.
			ignore: [ 'tests/**/fixtures/**' ],
			entry: packageFiles,
			project: packageFiles
		}
	}
};

export default config;
