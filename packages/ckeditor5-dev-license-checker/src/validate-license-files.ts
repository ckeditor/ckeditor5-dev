/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { glob, readFile, writeFile } from 'node:fs/promises';
import { findPackageJSON } from 'node:module';
import { createPatch } from 'diff';
import upath from 'upath';

type CopyrightOverride = {
	packageName: string;
	dependencies: Array<{
		license: string;
		name: string;
		copyright: string;
	}>;
};

type DependencyMap = {
	packageName: string;
	packagePath: string;
	dependencies: Array<{
		name: string;
		license?: string;
		copyright?: string;
	}>;
};

type ProcessingResult =
	{ licensePath: string } |
	{ licensePath: string; updated: true } |
	{ licensePath: string; licenseMissing: true } |
	{ licensePath: string; sectionMissing: true } |
	{ licensePath: string; updateNeeded: true; patch: string };

type UpdateNeeded = Extract<ProcessingResult, { updateNeeded: true }>;

const conjunctionFormatter = new Intl.ListFormat( 'en', { style: 'long', type: 'conjunction' } );

/**
 * @param options
 * @param options.fix Whether to fix license files instead of printing errors.
 * @param options.verbose Whether to print diff instead of just path to file on failed validation.
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
	verbose = false,
	shouldProcessRoot = false,
	shouldProcessPackages = false,
	isPublic = false,
	rootDir,
	projectName,
	mainPackageName,
	copyrightOverrides = []
}: {
	fix?: boolean;
	verbose?: boolean;
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

	const dependencyMaps = await Promise.all( packagePaths.map(
		async packagePath => getPackageDependencyMap( packagePath, copyrightOverrides )
	) );

	console.info( 'Validating licenses in following packages:' );
	console.info( dependencyMaps.map( ( { packageName } ) => ` - ${ packageName }` ).join( '\n' ) );

	const missingCopyrightLists = getMissingCopyrightLists( dependencyMaps );

	if ( missingCopyrightLists.length ) {
		console.error( '\n❌ Following packages include dependencies where finding copyright message failed. Please add an override:\n' );
		console.error( missingCopyrightLists.join( '\n' ) );

		return 1;
	}

	if ( mainPackageName ) {
		copyDependenciesToTheMainPackage( dependencyMaps, mainPackageName );
	}

	const processingResults = await Promise.all( dependencyMaps.map(
		dependencyMap => processDependencyMap( { dependencyMap, projectName, isPublic, fix } )
	) );

	const updatedLicenses = processingResults.filter( processingResult => 'updated' in processingResult );
	const licensesMissing = processingResults.filter( processingResult => 'licenseMissing' in processingResult );
	const sectionsMissing = processingResults.filter( processingResult => 'sectionMissing' in processingResult );
	const updatesNeeded = processingResults.filter(
		( processingResult ): processingResult is UpdateNeeded => 'updateNeeded' in processingResult
	);

	if ( updatedLicenses.length ) {
		console.info( '\nUpdated the following license files:' );
		console.info( makeLicenseFileList( updatedLicenses ) );
	}

	if ( !licensesMissing.length && !sectionsMissing.length && !updatesNeeded.length ) {
		console.info( '\nValidation complete.' );

		return 0;
	}

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

		if ( !verbose ) {
			console.error( makeLicenseFileList( updatesNeeded ) );
		} else {
			console.error( '\n' + updatesNeeded.map( ( { patch } ) => patch ).join( '\n' ) );
		}
	}

	return 1;
}

async function getPackageDependencyMap( packagePath: string, copyrightOverrides: Array<CopyrightOverride> ): Promise<DependencyMap> {
	const pkgJsonPath = upath.join( packagePath, 'package.json' );
	const pkgJsonContent = JSON.parse( await readFile( pkgJsonPath, 'utf-8' ) );
	const dependencyNames = Object.keys( pkgJsonContent.dependencies || {} )
		.filter( dependency => !dependency.match( /(ckeditor)|(cksource)/i ) );

	const packageName = pkgJsonContent.name;

	const dependencyMap: DependencyMap = {
		packageName,
		packagePath,
		dependencies: []
	};

	const copyrightOverridesPackage = copyrightOverrides
		.find( ( { packageName: overridePackageName } ) => packageName === overridePackageName );

	if ( copyrightOverridesPackage ) {
		dependencyMap.dependencies.push( ...copyrightOverridesPackage.dependencies );
	}

	for ( const dependencyName of dependencyNames ) {
		// If override already exists, skip parsing the dependency.
		if ( dependencyMap.dependencies.some( ( { name } ) => name === dependencyName ) ) {
			continue;
		}

		const dependencyData: DependencyMap['dependencies'][number] = { name: dependencyName };
		dependencyMap.dependencies.push( dependencyData );

		try {
			const dependencyPkgJsonPath = findPackageJSON( dependencyName, packagePath )!;
			const dependencyPkgJsonContent = JSON.parse( await readFile( dependencyPkgJsonPath, 'utf-8' ) );

			dependencyData.license = dependencyPkgJsonContent.license;
			dependencyData.copyright = await getCopyright( dependencyPkgJsonPath );
		} catch {
			// For packages such as `empathic` there is no export under that namespace, only `empathic/*`.
			// This causes `findPackageJSON()` to error. We silently fail and later ask the integrator to add an override.
		}
	}

	return dependencyMap;
}

function getMissingCopyrightLists( dependencyMaps: Array<DependencyMap> ): Array<string> {
	return dependencyMaps
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
		.filter( ( item ): item is string => typeof item === 'string' );
}

function copyDependenciesToTheMainPackage( dependencyMaps: Array<DependencyMap>, mainPackageName: string ) {
	const mainPackage = dependencyMaps.find( ( { packageName } ) => packageName === mainPackageName )!;

	mainPackage.dependencies = dependencyMaps.reduce<DependencyMap['dependencies']>( ( output, item ) => {
		item.dependencies.forEach( dependency => {
			const itemAlreadyPresent = output.some( ( { name } ) => name === dependency.name );

			if ( !itemAlreadyPresent ) {
				output.push( dependency );
			}
		} );

		return output;
	}, [] );
}

async function processDependencyMap( {
	dependencyMap,
	projectName,
	isPublic,
	fix
}: {
	dependencyMap: DependencyMap;
	projectName: string;
	isPublic: boolean;
	fix: boolean;
} ): Promise<ProcessingResult> {
	const licenseSectionPattern = /(?<=\n)Sources of Intellectual Property Included in .*?\n[\S\s]*?(?=(\nTrademarks\n)|$)/;
	const header = `Sources of Intellectual Property Included in ${ projectName }`;
	const licensePath = upath.join( dependencyMap.packagePath, 'LICENSE.md' );
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
		...getLicenseList( projectName, dependencyMap.dependencies )
	].filter( item => typeof item === 'string' ).join( '\n' ) );

	if ( currentLicense === newLicense ) {
		return { licensePath };
	}

	if ( fix ) {
		await writeFile( licensePath, newLicense, 'utf-8' );

		return { licensePath, updated: true };
	}

	const patch = createPatch( licensePath, currentLicense, newLicense );

	return { licensePath, updateNeeded: true, patch };
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

function getLicenseList( projectName: string, dependencies: DependencyMap['dependencies'] ): Array<string> {
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

async function getCopyright( dependencyPkgJsonPath: string ): Promise<string | undefined> {
	const dependencyPath = upath.dirname( dependencyPkgJsonPath );
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

function makeLicenseFileList( array: Array<ProcessingResult> ): string {
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
