/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { glob } from 'glob';
import fs from 'fs-extra';
import upath from 'upath';

const conjunctionFormatter = new Intl.ListFormat( 'en', { style: 'long', type: 'conjunction' } );

/**
 * @param {object} options
 * @param {string} baseDir Base directory from which `packages` are resolved.
 * @param {string} [commonFeatureName] Common name to use in all licenses instead of individual feature names.
 * @param {string} [mainPackageName] Designated package that contains collected licenses from all other packages.
 * @param {boolean} [fix=false] Whether to fix license files instead of printing errors.
 * @param {array} [additionalCopyrights] Map of additional copyrights to add to the ones parsed from dependencies.
 * @param {function} authorDisclaimerCallback Function with access to feature name that should return author disclaimer.
 *
 * @returns {number} Exit code of the script indicated whether it passed or errored.
 */
export async function validateLicenseFiles( {
	baseDir,
	commonFeatureName,
	mainPackageName,
	fix,
	additionalCopyrights = [],
	authorDisclaimerCallback
} ) {
	const packagePaths = ( await glob( upath.join( baseDir, 'packages', '*' ) ) ).sort();

	// Collect versioning and licensing data of all dependencies.
	const dependencyMap = await Promise.all( packagePaths.map( async packagePath => {
		const pkgJson = await fs.readJson( upath.join( packagePath, 'package.json' ) );
		const externalDependencies = Object.keys( pkgJson.dependencies || {} )
			.filter( dependency => !dependency.match( /(ckeditor)|(cksource)/ ) );

		const dependencyMapItem = {
			packagePath,
			dependencies: []
		};

		for ( const externalDependency of externalDependencies ) {
			const dependencyData = {};

			const externalDependencyPath = upath.join( packagePath, 'node_modules', externalDependency );
			const externalDependencyPkgJsonPath = upath.join( externalDependencyPath, 'package.json' );
			const externalDependencyLicensePath = ( await glob( upath.join( externalDependencyPath, '*' ) ) )
				.find( path => upath.basename( path ).match( /license/i ) );

			// TODO: Cross reference with `additionalCopyrights` to check whether it was provided there before printing a warning.
			if ( !externalDependencyLicensePath ) {
				console.warn( `⚠️  \`${ externalDependency }\` does not include any license file, skipping.` );

				continue;
			}

			const externalDependencyPkgJson = await fs.readJson( externalDependencyPkgJsonPath );
			const externalDependencyLicense = await fs.readFile( externalDependencyLicensePath, 'utf-8' );

			dependencyData.name = externalDependency;
			// TODO: Range & version are unused for now.
			// We need to consider a case where same dependency is used in two different versions in two different packages.
			// dependencyData.range = pkgJson.dependencies[ externalDependency ];
			// dependencyData.version = externalDependencyPkgJson.version;
			// TODO: author field is unused. Do we need it?
			// dependencyData.author = typeof externalDependencyPkgJson.author === 'object' ?
			// 	externalDependencyPkgJson.author.name :
			// 	externalDependencyPkgJson.author;
			dependencyData.license = externalDependencyPkgJson.license;
			dependencyData.copyright = getCopyright( externalDependencyLicense );

			dependencyMapItem.dependencies.push( dependencyData );
		}

		const additionalCopyrightsPackage = additionalCopyrights
			.find( ( { packageName } ) => upath.basename( packagePath ) === packageName );

		if ( additionalCopyrightsPackage ) {
			dependencyMapItem.dependencies.push( ...additionalCopyrightsPackage.dependencies );
		}

		return dependencyMapItem;
	} ) );

	if ( mainPackageName ) {
		// Copying all dependencies to the main package.
		const mainPackage = dependencyMap.find( ( { packagePath } ) => upath.basename( packagePath ) === mainPackageName );
		mainPackage.dependencies = dependencyMap.reduce( ( output, item ) => {
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
	const validationReturnValues = await Promise.all( dependencyMap.map( async ( { packagePath, dependencies } ) => {
		const licensePath = upath.join( packagePath, 'LICENSE.md' );
		const license = await fs.readFile( licensePath, 'utf-8' );
		const featureName = commonFeatureName || license.match( /(?<=\*\*)[^*]*?CKEditor&nbsp;5[^*]*?(?=\*\*)/ )[ 0 ];

		const header = `Sources of Intellectual Property Included in ${ featureName }`;

		const newLicense = license.replace(
			/(?<=\n)Sources of Intellectual Property Included in .*?\n[\S\s]*?(?=\nTrademarks\n)/,
			[
				header,
				'-'.repeat( header.length ),
				'',
				authorDisclaimerCallback( featureName ),
				'',
				...getLicenseList( featureName, dependencies )
			].filter( item => typeof item === 'string' ).join( '\n' )
		);

		if ( fix ) {
			await fs.writeFile( licensePath, newLicense, 'utf-8' );

			return;
		}

		if ( license !== newLicense ) {
			return licensePath;
		}
	} ) );

	const licensesToFix = validationReturnValues.filter( Boolean );

	if ( licensesToFix.length ) {
		console.error( 'Following license files are not up to date. Please run this script with `--fix` option and review the changes.' );
		console.error( licensesToFix.map( licensePath => ` - ${ licensePath }` ).join( '\n' ) );

		return 1;
	}

	return 0;
}

function getLicenseTypeHeader( featureName, licenseType ) {
	return [
		'The following libraries are included in',
		featureName,
		`under the [${ licenseType } license](https://opensource.org/licenses/${ licenseType }):`
	].join( ' ' );
}

function getLicenseList( featureName, dependencies ) {
	const licenseTypes = Array.from( new Set( dependencies.flatMap( dependency => dependency.license ) ) ).sort();

	return licenseTypes.flatMap( licenseType => [
		getLicenseTypeHeader( featureName, licenseType ),
		'',
		...dependencies
			.filter( ( { license } ) => license === licenseType )
			.sort( ( a, b ) => a.name.localeCompare( b.name ) )
			.map( ( { name, copyright } ) => `* ${ name } - ${ copyright }` ),
		''
	] );
}

function getCopyright( externalDependencyLicense ) {
	const matches = externalDependencyLicense.match( /(?<=^|\n[ \t]*?)Copyright.+/g );

	if ( !matches ) {
		return null;
	}

	return conjunctionFormatter.format(
		matches.map( match => match.replace( /\.$/, '' ) ) // Strip preexisting trailing dot.
	) + '.'; // Add the trailing dot back.
}
