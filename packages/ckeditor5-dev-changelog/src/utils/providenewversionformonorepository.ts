import semver, { type ReleaseType } from 'semver';
import chalk from 'chalk';
import inquirer from 'inquirer';
import { randomUUID } from 'crypto';
import upath from 'upath';
import os from 'os';
import fs from 'fs-extra';
import pacote from 'pacote';

const CLI_INDENT_SIZE = 3;

type Options = {
	packageName: string;
	version: string;
	bumpType: ReleaseType;
	indentLevel?: number;
};

export async function provideNewVersionForMonoRepository( options: Options ) {
	const {
		version,
		packageName,
		bumpType,
		indentLevel = 0
	} = options;

	const suggestedVersion = semver.inc( version, bumpType );
	const message = 'Type the new version ' +
		`(current highest: "${ version }" for "${ chalk.underline( packageName ) }", suggested: "${ suggestedVersion }"):`;

	const versionQuestion: any = {
		type: 'input',
		name: 'version',
		default: suggestedVersion,
		message,

		filter( input: string ) {
			return input.trim();
		},

		async validate( input: string ) {
			if ( !semver.valid( input ) ) {
				return 'Please provide a valid version.';
			}

			if ( !semver.gt( input, version ) ) {
				return `Provided version must be higher than "${ version }".`;
			}

			const isAvailable = await checkVersionAvailability( input, packageName );

			if ( !isAvailable ) {
				return 'Given version is already taken.';
			}

			return true;
		},
		prefix: ' '.repeat( indentLevel * CLI_INDENT_SIZE ) + chalk.cyan( '?' )
	};

	const answers = await inquirer.prompt( [ versionQuestion ] );

	return answers.version;
}

export async function checkVersionAvailability( version: string, packageName: string ) {
	return manifest( `${ packageName }@${ version }` )
		.then( () => {
			// If `manifest` resolves, a package with the given version exists.
			return false;
		} )
		.catch( () => {
			// When throws, the package does not exist.
			return true;
		} );
}

const manifest = cacheLessPacoteFactory( pacote.manifest );

function cacheLessPacoteFactory( callback: any ) {
	return async ( description: string, options = {} ) => {
		const uuid = randomUUID();
		const cacheDir = upath.join( os.tmpdir(), `pacote--${ uuid }` );

		await fs.ensureDir( cacheDir );

		try {
			return await callback( description, {
				...options,
				cache: cacheDir,
				memoize: false,
				preferOnline: true
			} );
		} finally {
			await fs.remove( cacheDir );
		}
	};
}


