/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { glob, readFile, writeFile } from 'fs/promises';
import { resolve } from 'import-meta-resolve';
import { pathToFileURL } from 'url';
import upath from 'upath';

type CopyrightOverride = {
	packageName: string;
	dependencies: Array<{
		license: string;
		name: string;
		copyright: string;
	}>;
};

type DependencyMapItem = {
	packageName: string;
	packagePath: string;
	dependencies: Array<{
		name: string;
		license?: string;
		copyright?: string;
	}>;
};

type ValidationItem = {
	licensePath: string;
	licenseMissing?: boolean;
	sectionMissing?: boolean;
	updateNeeded?: boolean;
	updated?: boolean;
};

const conjunctionFormatter = new Intl.ListFormat( 'en', { style: 'long', type: 'conjunction' } );

/**
 * @param options
 * @param options.fix Whether to fix license files instead of printing errors.
 * @param options.shouldProcessRoot Whether validation should process the root.
 * @param options.shouldProcessPackages Whether validation should process `packages/*`.
 * @param options.isPublic Whether license should use disclaimer meant for open source repositories.
 * @param options.rootDir Base directory.
 * @param options.projectName Project name referred to in the licenses.
 * @param options.mainPackageName Designated package that contains collected licenses from all other packages.
 * @param options.copyrightOverrides Map of of copyright that can both add new ones, as well as override existing ones.
 *
 * @returns Exit code of the script that indicates whether it passed or errored.
 */
export async function validateLicenseFiles( {
	fix = false,
	shouldProcessRoot = false,
	shouldProcessPackages = false,
	isPublic = false,
	rootDir,
	projectName,
	mainPackageName,
	copyrightOverrides = []
}: {
	fix?: boolean;
	shouldProcessRoot?: boolean;
	shouldProcessPackages?: boolean;
	isPublic?: boolean;
	rootDir: string;
	projectName: string;
	mainPackageName?: string;
	copyrightOverrides?: Array<CopyrightOverride>;
} ): Promise<number> {
	const packagePaths: Array<string> = [];

	if ( shouldProcessRoot ) {
		packagePaths.push( rootDir );
	}

	if ( shouldProcessPackages ) {
		packagePaths.push( ...await fromAsync( glob( upath.join( rootDir, 'packages', '*' ) ) ) );
	}

	if ( !packagePaths.length ) {
		console.error( [
			'No packages to parse detected. Make sure that you provided proper paths,',
			'as well as set at least one of: `shouldProcessRoot` or `shouldProcessPackages`.'
		].join( '\n' ) );

		return 1;
	}

	// Collect versioning and licensing data of all dependencies.
	const dependencyMap = await Promise.all( packagePaths.map( async packagePath => {
		const pkgJsonPath = upath.join( packagePath, 'package.json' );
		const pkgJsonContent = JSON.parse( await readFile( pkgJsonPath, 'utf-8' ) );
		const dependencyNames = Object.keys( pkgJsonContent.dependencies || {} )
			.filter( dependency => !dependency.match( /(ckeditor)|(cksource)/i ) );

		const packageName = pkgJsonContent.name;

		const dependencyMapItem: DependencyMapItem = {
			packageName,
			packagePath,
			dependencies: []
		};

		const copyrightOverridesPackage = copyrightOverrides
			.find( ( { packageName: overridePackageName } ) => packageName === overridePackageName );

		if ( copyrightOverridesPackage ) {
			dependencyMapItem.dependencies.push( ...copyrightOverridesPackage.dependencies );
		}

		for ( const dependencyName of dependencyNames ) {
			if ( dependencyName === '@babel/parser' ) {
				console.log( { dependencyName } );
			}

			// If override already exists, skip parsing the dependency.
			if ( dependencyMapItem.dependencies.some( ( { name } ) => name === dependencyName ) ) {
				continue;
			}

			const dependencyData: DependencyMapItem['dependencies'][number] = { name: dependencyName };
			dependencyMapItem.dependencies.push( dependencyData );

			let dependencyPath: string;

			try {
				// `import.meta.resolve()` (which `resolve()` implements) will resolve built-in modules over conflicting npm package names,
				// eg. `node:process` will be resolved over `process` npm package, see: https://github.com/nodejs/node/issues/56652.
				// To work around this, we append '/foo'.
				const dependencyEntryPoint = resolve( dependencyName + '/foo', pathToFileURL( packagePath ).href );

				if ( dependencyName === '@babel/parser' ) {
					console.log( { dependencyEntryPoint } );
				}

				// If such import happens to exist, we attempt to look for the last instance of `.../node_modules/dependencyName`.
				const pathUpToLastNodeModules = dependencyEntryPoint.match(
					new RegExp( `(?<=file:).+(?:\\bnode_modules\\b)(?!bnode_modules)\\/${ dependencyName }+` )
				);

				if ( dependencyName === '@babel/parser' ) {
					console.log( { pathUpToLastNodeModules } );
				}

				if ( !pathUpToLastNodeModules ) {
					continue;
				}

				dependencyPath = pathUpToLastNodeModules[ 0 ];
			} catch ( err: any ) {
				if ( dependencyName === '@babel/parser' ) {
					console.log( { err } );
				}

				// In most cases, `dependencyName/foo` is not a valid import and throws an error. In such case, the error prints the path to
				// the `package.json` that we need, and we can read it. This error catching mechanism is also needed to find paths to
				// packages which do not have a base export, eg. package `empathic` only has exports such as `empathic/find`.
				const dependencyPkgJsonPath = err?.message.match( /(?<=not defined by "exports" in ).+(?= imported from)/ )?.[ 0 ];

				if ( !dependencyPkgJsonPath ) {
					continue;
				}

				dependencyPath = upath.dirname( dependencyPkgJsonPath );
			}

			if ( dependencyName === '@babel/parser' ) {
				console.log( { dependencyPath } );
			}

			const dependencyPkgJsonPath = upath.join( dependencyPath, 'package.json' );
			const dependencyPkgJsonContent = JSON.parse( await readFile( dependencyPkgJsonPath, 'utf-8' ) );

			dependencyData.license = dependencyPkgJsonContent.license;
			dependencyData.copyright = await getCopyright( dependencyPath );
		}

		return dependencyMapItem;
	} ) );

	console.info( 'Validating licenses in following packages:' );
	console.info( dependencyMap.map( ( { packageName } ) => ` - ${ packageName }` ).join( '\n' ) );

	// Looking for missing copyright messages.
	const missingCopyrightLists = dependencyMap
		.map( ( { packageName, dependencies } ) => {
			const missingCopyrights = dependencies
				.filter( ( { license, copyright } ) => !license || !copyright )
				.map( ( { name } ) => ` - ${ name }` );

			if ( missingCopyrights.length ) {
				return [
					`${ packageName }:`,
					...missingCopyrights,
					''
				].join( '\n' );
			}
		} )
		.filter( Boolean );

	if ( missingCopyrightLists.length ) {
		console.error( '\n❌ Following packages include dependencies where finding copyright message failed. Please add an override:\n' );
		console.error( missingCopyrightLists.join( '\n' ) );

		return 1;
	}

	// Copying all dependencies to the main package.
	if ( mainPackageName ) {
		const mainPackage = dependencyMap.find( ( { packageName } ) => packageName === mainPackageName )!;
		mainPackage.dependencies = dependencyMap.reduce<DependencyMapItem['dependencies']>( ( output, item ) => {
			item.dependencies.forEach( dependency => {
				const itemAlreadyPresent = output.some( ( { name } ) => name === dependency.name );

				if ( !itemAlreadyPresent ) {
					output.push( dependency );
				}
			} );

			return output;
		}, [] );
	}

	// Validate ckeditor license files.
	const validationPromises: Array<Promise<ValidationItem | undefined>> = dependencyMap.map( async ( { packagePath, dependencies } ) => {
		const licenseSectionPattern = /(?<=\n)Sources of Intellectual Property Included in .*?\n[\S\s]*?(?=(\nTrademarks\n)|$)/;
		const header = `Sources of Intellectual Property Included in ${ projectName }`;
		const licensePath = upath.join( packagePath, 'LICENSE.md' );
		let currentLicense;

		try {
			currentLicense = await readFile( licensePath, 'utf-8' );
		} catch {
			return { licensePath, licenseMissing: true };
		}

		if ( !currentLicense.match( licenseSectionPattern ) ) {
			return { licensePath, sectionMissing: true };
		}

		const newLicense = currentLicense.replace( licenseSectionPattern, [
			header,
			'-'.repeat( header.length ),
			'',
			getAuthorDisclaimer( projectName, isPublic ),
			'',
			...getLicenseList( projectName, dependencies )
		].filter( item => typeof item === 'string' ).join( '\n' ) );

		if ( currentLicense === newLicense ) {
			return;
		}

		if ( fix ) {
			await writeFile( licensePath, newLicense, 'utf-8' );

			return { licensePath, updated: true };
		}

		return { licensePath, updateNeeded: true };
	} );

	const validationReturnValues: Array<ValidationItem> = ( await Promise.all( validationPromises ) )
		.filter( ( validationValue ): validationValue is ValidationItem => Boolean( validationValue ) );

	const updatedLicenses = validationReturnValues.filter( ( { updated } ) => updated );
	const licensesToFix = validationReturnValues.filter( ( { updated } ) => !updated );

	if ( updatedLicenses.length ) {
		console.info( '\nUpdated the following license files:' );
		console.info( makeLicenseFileList( updatedLicenses ) );
	}

	if ( !licensesToFix.length ) {
		console.info( '\nValidation complete.' );

		return 0;
	}

	const licensesMissing = licensesToFix.filter( ( { licenseMissing } ) => licenseMissing );
	const sectionsMissing = licensesToFix.filter( ( { sectionMissing } ) => sectionMissing );
	const updatesNeeded = licensesToFix.filter( ( { updateNeeded } ) => updateNeeded );

	if ( licensesMissing.length ) {
		console.error( '\nFollowing license files are missing. Please create them:' );
		console.error( makeLicenseFileList( licensesMissing ) );
	}

	if ( sectionsMissing.length ) {
		console.error( [
			'\nFailed to detect license section in following files.',
			'Please add an `Sources of Intellectual Property Included in ...` section to them:'
		].join( ' ' ) );
		console.error( makeLicenseFileList( sectionsMissing ) );
	}

	if ( updatesNeeded.length ) {
		console.error( '\nFollowing license files are not up to date. Please run this script with `--fix` option and review the changes.' );
		console.error( makeLicenseFileList( updatesNeeded ) );
	}

	return 1;
}

function getAuthorDisclaimer( projectName: string, isPublic: boolean ): string {
	const authorDisclaimer = [
		`Where not otherwise indicated, all ${ projectName } content is authored`,
		'by CKSource engineers and consists of CKSource-owned intellectual property.'
	];

	if ( isPublic ) {
		authorDisclaimer.push(
			`In some specific instances, ${ projectName } will incorporate work done by`,
			'developers outside of CKSource with their express permission.'
		);
	}

	return authorDisclaimer.join( ' ' );
}

function getLicenseTypeHeader( projectName: string, licenseType: string ): string {
	return [
		'The following libraries are included in',
		projectName,
		`under the [${ licenseType } license](https://opensource.org/licenses/${ licenseType }):`
	].join( ' ' );
}

function getLicenseList( projectName: string, dependencies: DependencyMapItem['dependencies'] ): Array<string> {
	const licenseTypes = removeDuplicates( dependencies.flatMap( dependency => dependency.license ) );

	return licenseTypes.sort().flatMap( licenseType => [
		getLicenseTypeHeader( projectName, licenseType! ),
		'',
		...dependencies
			.filter( ( { license } ) => license === licenseType )
			.sort( ( a, b ) => a.name.localeCompare( b.name ) )
			.map( ( { name, copyright } ) => `* ${ name } - ${ copyright }` ),
		''
	] );
}

async function getCopyright( dependencyPath: string ): Promise<string | undefined> {
	const dependencyRootFilePaths = await fromAsync( glob( upath.join( dependencyPath, '*' ) ) );
	const dependencyLicensePath = dependencyRootFilePaths.find( path => upath.basename( path ).match( /license/i ) );

	if ( !dependencyLicensePath ) {
		return;
	}

	const dependencyLicenseContent = await readFile( dependencyLicensePath, 'utf-8' );
	const matches = dependencyLicenseContent.match( /(?<=^|\n[ \t]*?)Copyright.+/g );

	if ( !matches ) {
		return;
	}

	return conjunctionFormatter.format(
		matches.map( match => match.replace( /\.$/, '' ) ) // Strip preexisting trailing dot.
	) + '.'; // Add the trailing dot back.
}

function removeDuplicates<T>( array: Array<T> ): Array<T> {
	return Array.from( new Set( array ) );
}

function makeLicenseFileList( array: Array<ValidationItem> ): string {
	return array.map( ( { licensePath } ) => ` - ${ licensePath }` ).join( '\n' );
}

// TODO: Replace with `Array.fromAsync()` once we upgrade to TS 5.5
async function fromAsync<T>( iterable: AsyncIterable<T> ): Promise<Array<T>> {
	const result: Array<T> = [];

	for await ( const item of iterable ) {
		result.push( item );
	}

	return result;
}
