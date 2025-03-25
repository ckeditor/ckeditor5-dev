import upath from 'upath';
import { glob, GlobOptionsWithFileTypesFalse } from 'glob';

type Options = {
	includePackageJson?: boolean;
	includeCwd?: boolean;
	packagesDirectoryFilter?: ( ( packageJsonPath: string ) => boolean ) | null;
};

export async function findPathsToPackages( cwd: string, packagesDirectory: string | null, options: Options = {} ) {
	const {
		includePackageJson = false,
		includeCwd = false,
		packagesDirectoryFilter = null
	} = options;

	const packagePaths = await getPackages( cwd, packagesDirectory, includePackageJson );

	if ( includeCwd ) {
		if ( includePackageJson ) {
			packagePaths.push( upath.join( cwd, 'package.json' ) );
		} else {
			packagePaths.push( cwd );
		}
	}

	const normalizedPaths = packagePaths.map( item => upath.normalize( item ) );

	if ( packagesDirectoryFilter ) {
		return normalizedPaths.filter( item => packagesDirectoryFilter( item ) );
	}

	return normalizedPaths;
}

async function getPackages( cwd: string, packagesDirectory: string | null, includePackageJson: boolean ): Promise<string[]> {
	if ( !packagesDirectory ) {
		return Promise.resolve( [] );
	}

	const globOptions: GlobOptionsWithFileTypesFalse = {
		cwd: upath.join( cwd, packagesDirectory ),
		absolute: true
	};

	let pattern = '*/';

	if ( includePackageJson ) {
		pattern += 'package.json';
		globOptions.nodir = true;
	}

	return glob( pattern, globOptions );
}
