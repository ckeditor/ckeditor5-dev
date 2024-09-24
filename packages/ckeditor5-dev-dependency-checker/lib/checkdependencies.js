/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import fs from 'fs-extra';
import upath from 'upath';
import { globSync } from 'glob';
import depCheck from 'depcheck';
import chalk from 'chalk';

/**
 * Checks dependencies sequentially in all provided packages.
 *
 * @param {Set.<string>} packagePaths Relative paths to packages.
 * @param {object} options Options.
 * @param {boolean} [options.quiet=false] Whether to inform about the progress.
 * @returns {Promise.<boolean>} Resolves a promise with a flag informing whether detected an error.
 */
export default async function checkDependencies( packagePaths, options ) {
	let foundError = false;

	for ( const packagePath of packagePaths ) {
		const isSuccess = await checkDependenciesInPackage( packagePath, {
			quiet: options.quiet
		} );

		// Mark result of this script execution as invalid.
		if ( !isSuccess ) {
			foundError = true;
		}
	}

	return Promise.resolve( foundError );
}

/**
 * Checks dependencies in provided package. If the folder does not contain a package.json file the function quits with success.
 *
 * @param {string} packagePath Relative path to package.
 * @param {object} options Options.
 * @param {boolean} [options.quiet=false] Whether to inform about the progress.
 * @returns {Promise.<boolean>} The result of checking the dependencies in the package: true = no errors found.
 */
async function checkDependenciesInPackage( packagePath, options ) {
	const packageAbsolutePath = upath.resolve( packagePath );
	const packageJsonPath = upath.join( packageAbsolutePath, 'package.json' );

	if ( !fs.existsSync( packageJsonPath ) ) {
		console.log( `⚠️  Missing package.json file in ${ chalk.bold( packagePath ) }, skipping...\n` );

		return true;
	}

	const packageJson = await fs.readJson( packageJsonPath );

	const missingCSSFiles = [];
	const onMissingCSSFile = file => missingCSSFiles.push( file );

	const depCheckOptions = {
		// We need to add all values manually because if we modify it, the rest is being lost.
		parsers: {
			'**/*.css': filePath => parsePostCSS( filePath, onMissingCSSFile ),
			'**/*.cjs': depCheck.parser.es6,
			'**/*.mjs': depCheck.parser.es6,
			'**/*.js': depCheck.parser.es6,
			'**/*.jsx': depCheck.parser.jsx,
			'**/*.ts': depCheck.parser.typescript,
			'**/*.vue': depCheck.parser.vue
		},
		ignorePatterns: [ 'docs', 'build', 'dist/browser' ],
		ignoreMatches: [ 'eslint*', 'webpack*', 'husky', 'lint-staged' ]
	};

	const depcheckIgnore = Array.isArray( packageJson.depcheckIgnore ) ? packageJson.depcheckIgnore : [];

	depCheckOptions.ignoreMatches.push( ...depcheckIgnore );

	if ( !options.quiet ) {
		console.log( `🔎 Checking dependencies in ${ chalk.bold( packageJson.name ) }...` );
	}

	const result = await depCheck( packageAbsolutePath, depCheckOptions );

	const missingPackages = await groupMissingPackages( result.missing, packageJson.name );

	const misplacedOptions = {
		dependencies: packageJson.dependencies,
		devDependencies: packageJson.devDependencies,
		dependenciesToCheck: result.using,
		dependenciesToIgnore: depcheckIgnore
	};

	const errors = [
		// Invalid itself imports.
		getInvalidItselfImports( packageAbsolutePath )
			.map( entry => '- ' + entry )
			.join( '\n' ),

		// Missing dependencies.
		missingPackages.dependencies
			.map( entry => '- ' + entry )
			.join( '\n' ),

		// Missing devDependencies.
		missingPackages.devDependencies
			.map( entry => '- ' + entry )
			.join( '\n' ),

		// Unused dependencies.
		result.dependencies
			.map( entry => '- ' + entry )
			.join( '\n' ),

		// Unused devDependencies.
		result.devDependencies
			.map( entry => '- ' + entry )
			.join( '\n' ),

		// Relative CSS imports (files do not exist).
		missingCSSFiles
			.map( entry => {
				return `- "${ entry.file }" imports "${ entry.import }"`;
			} )
			.join( '\n' ),

		// Duplicated `dependencies` and `devDependencies`.
		findDuplicatedDependencies( packageJson.dependencies, packageJson.devDependencies )
			.map( entry => '- ' + entry )
			.join( '\n' ),

		// Misplaced `dependencies` or `devDependencies`.
		// Checks whether any package, which is already listed in the `dependencies` or `devDependencies`,
		// should belong to that list.
		( await findMisplacedDependencies( misplacedOptions ) )
			.reduce( ( result, group ) => {
				return result + '\n' +
					group.description + '\n' +
					group.packageNames.map( entry => '- ' + entry ).join( '\n' ) + '\n';
			}, '' )
	];

	const hasErrors = errors.some( error => !!error );

	if ( !hasErrors ) {
		if ( !options.quiet ) {
			console.log( chalk.green.bold( '✨ All dependencies are defined correctly.\n' ) );
		}

		return true;
	}

	console.log( chalk.red.bold( `🔥 Found some issue with dependencies in ${ chalk.bold( packageJson.name ) }.\n` ) );

	showErrors( errors );

	return false;
}

/**
 * Returns an array that contains list of files that import modules using full package name instead of relative path.
 *
 * @param repositoryPath An absolute path to the directory which should be checked.
 * @returns {Array.<string>}
 */
function getInvalidItselfImports( repositoryPath ) {
	const packageJson = fs.readJsonSync( upath.join( repositoryPath, 'package.json' ) );
	const globPattern = upath.join( repositoryPath, '@(src|tests)/**/*.js' );
	const invalidImportsItself = new Set();

	for ( const filePath of globSync( globPattern ) ) {
		const fileContent = fs.readFileSync( filePath, 'utf-8' );
		const matchedImports = fileContent.match( /^import[^;]+from '(@ckeditor\/[^/]+)[^']+';/mg );

		if ( !matchedImports ) {
			continue;
		}

		matchedImports
			.map( importLine => importLine.match( /(@ckeditor\/[^/]+)/ ) )
			.filter( matchedImport => !!matchedImport )
			.forEach( matchedImport => {
				// Current package should use relative links to itself.
				if ( packageJson.name === matchedImport[ 1 ] ) {
					invalidImportsItself.add( filePath.replace( repositoryPath + '/', '' ) );
				}
			} );
	}

	return [ ...invalidImportsItself ].sort();
}

/**
 * Groups missing dependencies returned by `depcheck` as `dependencies` or `devDependencies`.
 *
 * @param {object} missingPackages The `missing` value from object returned by `depcheck`.
 * @param {string} currentPackage Name of current package.
 * @returns {Promise.<Object.<string, Array.<string>>>}
 */
async function groupMissingPackages( missingPackages, currentPackage ) {
	delete missingPackages[ currentPackage ];

	const dependencies = [];
	const devDependencies = [];

	for ( const packageName of Object.keys( missingPackages ) ) {
		const absolutePaths = missingPackages[ packageName ];

		if ( await isDevDependency( packageName, absolutePaths ) ) {
			devDependencies.push( packageName );
		} else {
			dependencies.push( packageName );
		}
	}

	return { dependencies, devDependencies };
}

/**
 * Checks whether all packages that have been imported by the CSS file are defined in `package.json` as `dependencies`.
 * Returned array contains list of used packages.
 *
 * @param {string} filePath An absolute path to the checking file.
 * @param {function} onMissingCSSFile Error handler called when a CSS file is not found.
 * @returns {Array.<string>|undefined}
 */
function parsePostCSS( filePath, onMissingCSSFile ) {
	const fileContent = fs.readFileSync( filePath, 'utf-8' );
	const matchedImports = fileContent.match( /^@import "[^"]+";/mg );

	if ( !matchedImports ) {
		return;
	}

	const usedPackages = new Set();

	matchedImports
		.map( importLine => {
			const importedFile = importLine.match( /"([^"]+)"/ )[ 1 ];

			// Scoped package.
			// @import "@foo/bar/...";
			// @import "@foo/bar"; and its package.json: { "main": "foo-bar.css" }
			if ( importedFile.startsWith( '@' ) ) {
				return {
					type: 'package',
					name: importedFile.split( '/' ).slice( 0, 2 ).join( '/' )
				};
			}

			// Relative import.
			// @import "./file.css"; or @import "../file.css";
			if ( importedFile.startsWith( './' ) || importedFile.startsWith( '../' ) ) {
				return {
					type: 'file',
					path: importedFile
				};
			}

			// Non-scoped package.
			return {
				type: 'package',
				name: importedFile.split( '/' )[ 0 ]
			};
		} )
		.forEach( importDetails => {
			// If checked file imports another file, checks whether imported file exists.
			if ( importDetails.type == 'file' ) {
				const fileToImport = upath.resolve( filePath, '..', importDetails.path );

				if ( !fs.existsSync( fileToImport ) ) {
					onMissingCSSFile( {
						file: filePath,
						import: importDetails.path
					} );
				}

				return;
			}

			usedPackages.add( importDetails.name );
		} );

	return [ ...usedPackages ].sort();
}

/**
 * Checks whether packages specified as `devDependencies` are not duplicated with items defined as `dependencies`.
 *
 * @see https://github.com/ckeditor/ckeditor5/issues/7706#issuecomment-665569410
 * @param {object|undefined} dependencies
 * @param {object|undefined} devDependencies
 * @returns {Array.<string>}
 */
function findDuplicatedDependencies( dependencies, devDependencies ) {
	const deps = Object.keys( dependencies || {} );
	const devDeps = Object.keys( devDependencies || {} );

	if ( !deps.length || !devDeps.length ) {
		return [];
	}

	const duplicatedPackages = new Set();

	for ( const packageName of deps ) {
		if ( devDeps.includes( packageName ) ) {
			duplicatedPackages.add( packageName );
		}
	}

	return [ ...duplicatedPackages ].sort();
}

/**
 * Checks whether all packages, which are already listed in the `dependencies` or `devDependencies`, should belong to that list.
 * The `devDependencies` list should contain packages, which are not used in the source. Otherwise, a given package should be
 * added to the `dependencies` list. This function does not check missing dependencies, which is covered elsewhere, but it only
 * verifies wrongly placed ones.
 *
 * @see https://github.com/ckeditor/ckeditor5/issues/8817#issuecomment-759353134
 * @param {object|undefined} options.dependencies Defined dependencies from package.json.
 * @param {object|undefined} options.devDependencies Defined development dependencies from package.json.
 * @param {object} options.dependenciesToCheck All dependencies that have been found and files where they are used.
 * @param {Array.<string>} options.dependenciesToIgnore An array of package names that should not be checked.
 * @returns {Promise.<Array.<object>>} Misplaced packages. Each array item is an object containing
 * the `description` string and `packageNames` array of strings.
 */
async function findMisplacedDependencies( options ) {
	const { dependencies, devDependencies, dependenciesToCheck, dependenciesToIgnore } = options;
	const deps = Object.keys( dependencies || {} );
	const devDeps = Object.keys( devDependencies || {} );

	const misplacedPackages = {
		missingInDependencies: {
			description: 'The following packages are used in the source and should be moved to `dependencies`',
			packageNames: new Set()
		},
		missingInDevDependencies: {
			description: 'The following packages are not used in the source and should be moved to `devDependencies`',
			packageNames: new Set()
		}
	};

	for ( const [ packageName, absolutePaths ] of Object.entries( dependenciesToCheck ) ) {
		if ( dependenciesToIgnore.includes( packageName ) ) {
			continue;
		}

		const isDevDep = await isDevDependency( packageName, absolutePaths );
		const isMissingInDependencies = !isDevDep && !deps.includes( packageName ) && devDeps.includes( packageName );
		const isMissingInDevDependencies = isDevDep && deps.includes( packageName ) && !devDeps.includes( packageName );

		if ( isMissingInDependencies ) {
			misplacedPackages.missingInDependencies.packageNames.add( packageName );
		}

		if ( isMissingInDevDependencies ) {
			misplacedPackages.missingInDevDependencies.packageNames.add( packageName );
		}
	}

	return Object
		.values( misplacedPackages )
		.filter( item => item.packageNames.size > 0 )
		.map( item => ( {
			description: chalk.gray( item.description ),
			packageNames: [ ...item.packageNames ].sort()
		} ) );
}

/**
 * Checks if a given package is a development-only dependency. Package is considered a dev dependency
 * if it is used only in files that are not used in the final build, such as tests, demos or typings.
 *
 * @param {string} packageName
 * @param {Array.<string>} absolutePaths Files where a given package has been imported.
 * @returns {Promise.<boolean>}
 */
async function isDevDependency( packageName, absolutePaths ) {
	if ( packageName.startsWith( '@types/' ) ) {
		return true;
	}

	/**
	 * These folders contain code that will be shipped to npm and run in the final projects.
	 * This means that all dependencies used in these folders are production dependencies.
	 */
	const foldersContainingProductionCode = [
		/**
		 * These folders contain the source code of the packages.
		 */
		/[/\\]bin[/\\]/,
		/[/\\]src[/\\]/,
		/[/\\]lib[/\\]/,
		/[/\\]theme[/\\]/,

		/**
		 * This folder contains the compiled code of the packages. Most of this code is the same
		 * as the source, but during the build process some of the imports are replaced with those
		 * compatible with the "new installation methods", which may use different dependencies.
		 *
		 * For example, the `ckeditor5/src/core.js` import is replaced with `@ckeditor/ckeditor5-core/dist/index.js`.
		 *                   ^^^^^^^^^                                       ^^^^^^^^^^^^^^^^^^^^^^^^
		 */
		/[/\\]dist[/\\]/
	];

	for ( const absolutePath of absolutePaths ) {
		if ( !foldersContainingProductionCode.some( folder => absolutePath.match( folder ) ) ) {
			continue;
		}

		if ( absolutePath.endsWith( '.ts' ) ) {
			// Verify kind of imports in TypeScript file.
			const importKinds = await getImportAndExportKinds( packageName, absolutePath );

			// There is any non type kind of import from that package so not a dev dependency.
			if ( importKinds.some( importKind => importKind != 'type' ) ) {
				return false;
			}
		} else {
			// Import from some other file from src/ or theme/ - package is not dev dependency.
			return false;
		}
	}

	// There were no value imports, so it is a dev dependency.
	return true;
}

/**
 * Parses TS file from `absolutePath` and returns a list of import and export types from `packageName`.
 *
 * @param {string} packageName
 * @param {string} absolutePath File where a given package has been imported.
 * @returns {Promise.<Array.<string>>} Array of import kinds.
 */
async function getImportAndExportKinds( packageName, absolutePath ) {
	const astContent = await depCheck.parser.typescript( absolutePath );

	if ( !astContent || !astContent.program || !astContent.program.body ) {
		return [];
	}

	const types = [
		'ImportDeclaration',
		'ExportAllDeclaration',
		'ExportNamedDeclaration'
	];

	return astContent.program.body
		.filter( node => types.includes( node.type ) )
		.filter( node => node.source?.value?.startsWith( packageName ) )
		.map( node => node.importKind || node.exportKind );
}

/**
 * Displays all found errors.
 *
 * @param {Array.<string>} data Collection of errors.
 */
function showErrors( data ) {
	if ( data[ 0 ] ) {
		console.log( chalk.red( '❌ Invalid itself imports found in:' ) );
		console.log( data[ 0 ] + '\n' );
		console.log( chalk.gray( 'Imports from local package must always use relative path.\n' ) );
	}

	if ( data[ 1 ] ) {
		console.log( chalk.red( '❌ Missing dependencies:' ) );
		console.log( data[ 1 ] + '\n' );
	}

	if ( data[ 2 ] ) {
		console.log( chalk.red( '❌ Missing devDependencies:' ) );
		console.log( data[ 2 ] + '\n' );
	}

	if ( data[ 3 ] ) {
		console.log( chalk.red( '❌ Unused dependencies:' ) );
		console.log( data[ 3 ] + '\n' );
	}

	if ( data[ 4 ] ) {
		console.log( chalk.red( '❌ Unused devDependencies:' ) );
		console.log( data[ 4 ] + '\n' );
	}

	if ( data[ 5 ] ) {
		console.log( chalk.red( '❌ Importing CSS files that do not exist:' ) );
		console.log( data[ 5 ] + '\n' );
	}

	if ( data[ 6 ] ) {
		console.log( chalk.red( '❌ Duplicated `dependencies` and `devDependencies`:' ) );
		console.log( data[ 6 ] + '\n' );
	}

	if ( data[ 7 ] ) {
		console.log( chalk.red( '❌ Misplaced dependencies (`dependencies` or `devDependencies`):' ) );
		console.log( data[ 7 ] + '\n' );
	}
}
