/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';

const ROOT_DIRECTORY = path.join( import.meta.dirname, '..' );

// When installing a repository as a dependency, the `.git` directory does not exist.
// In such a case, husky should not attach its hooks as npm treats it as a package, not a git repository.
if ( fs.existsSync( path.join( ROOT_DIRECTORY, '.git' ) ) ) {
	const { default: husky } = await import( 'husky' );

	husky();

	execSync( 'pnpm run -r postinstall', {
		cwd: ROOT_DIRECTORY,
		stdio: 'inherit'
	} );

	execSync( 'pnpm run -r build', {
		cwd: ROOT_DIRECTORY,
		stdio: 'inherit'
	} );
}
