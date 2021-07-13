#!/usr/bin/env node

/**
 * @license Copyright (c) 2003-2021, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const fs = require( 'fs' );
const path = require( 'path' );
const glob = require( 'glob' );
const depCheck = require( 'depcheck' );
const chalk = require( 'chalk' );
const minimist = require( 'minimist' );
const { tools } = require( '@ckeditor/ckeditor5-dev-utils' );

const { packagePaths, options } = parseArguments( process.argv.slice( 2 ) );

const QUIET_MODE = options.quiet;

checkDependencies( packagePaths );

/**
 * Checks dependencies sequentially in all provided packages.
 *
 * @param {Set.<String>} packagePaths Relative paths to packages.
 */
async function checkDependencies( packagePaths ) {
	for ( const packagePath of packagePaths ) {
		const isSuccess = await checkDependenciesInPackage( packagePath );

		// Mark result of this script execution as invalid.
		if ( !isSuccess ) {
			process.exitCode = 1;
		}
	}
}

/**
 * Checks dependencies in provided package. If the folder does not contain a package.json file the function quits with success.
 *
 * @param {String} packagePath Relative path to package.
 * @returns {Boolean} The result of checking the dependencies in the package: true = no errors found.
 */
async function checkDependenciesInPackage( packagePath ) {
	const packageAbsolutePath = path.resolve( packagePath );
	const packageJsonPath = path.join( packageAbsolutePath, 'package.json' );

	if ( !fs.existsSync( packageJsonPath ) ) {
		console.log( `⚠️  Missing package.json file in ${ chalk.bold( packagePath ) }, skipping...\n` );

		return true;
	}

	const packageJson = require( packageJsonPath );

	const missingCSSFiles = [];
	const onMissingCSSFile = file => missingCSSFiles.push( file );

	const depCheckOptions = {
		// We need to add all values manually because if we modify it, the rest is being lost.
		parsers: {
			'**/*.css': filePath => parsePostCSS( filePath, onMissingCSSFile ),
			'**/*.js': depCheck.parser.es6,
			'**/*.jsx': depCheck.parser.jsx,
			'**/*.ts': depCheck.parser.typescript,
			'**/*.vue': depCheck.parser.vue
		},
		ignorePatterns: [ 'docs', 'build' ],
		ignoreMatches: [ 'eslint*', 'webpack*', 'husky', 'lint-staged' ]
	};

	if ( Array.isArray( packageJson.depcheckIgnore ) ) {
		depCheckOptions.ignoreMatches.push( ...packageJson.depcheckIgnore );
	}

	if ( !QUIET_MODE ) {
		console.log( `🔎 Checking dependencies in ${ chalk.bold( packageJson.name ) }...` );
	}

	const result = await depCheck( packageAbsolutePath, depCheckOptions );

	const missingPackages = groupMissingPackages( result.missing, packageJson.name );

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
		findMisplacedDependencies( packageJson.dependencies, packageJson.devDependencies, result.using )
			.reduce( ( result, group ) => {
				return result + '\n' +
					group.description + '\n' +
					group.packageNames.map( entry => '- ' + entry ).join( '\n' ) + '\n';
			}, '' )
	];

	const hasErrors = errors.some( error => !!error );

	if ( !hasErrors ) {
		if ( !QUIET_MODE ) {
			console.log( chalk.green.bold( '✨ All dependencies are defined correctly.\n' ) );
		}

		return true;
	}

	console.log( chalk.red.bold( `🔥 Found some issue with dependencies in ${ chalk.bold( packageJson.name ) }.\n` ) );

	showErrors( errors );

	return false;
}

/**
 * Parses CLI arguments and options.
 *
 * @param {Array.<String>} args CLI arguments containing package paths and options.
 * @returns {Object} result
 * @returns {Set.<String>} result.packagePaths Relative package paths.
 * @returns {Object.<String, Boolean} result.options Configuration options.
 */
function parseArguments( args ) {
	const config = {
		boolean: [
			'quiet'
		],

		default: {
			quiet: false
		}
	};

	const parsedArgs = minimist( args, config );

	const options = Object.assign( {}, parsedArgs );

	// Delete arguments that didn't have an explicit option associated with them.
	// In our case this is all package paths.
	delete options._;

	return {
		packagePaths: getPackagePaths( parsedArgs._ ),
		options
	};
}

/**
 * Returns relative (to the current work directory) paths to packages. If the provided `args` array is empty,
 * the packages will be read from the `packages/` directory.
 *
 * @param {Array.<String>} args CLI arguments with relative or absolute package paths.
 * @returns {Set.<String>} Relative package paths.
 */
function getPackagePaths( args ) {
	if ( !args.length ) {
		return tools.getDirectories( path.join( process.cwd(), 'packages' ) )
			.map( packageName => `packages/${ packageName }` );
	}

	const PACKAGE_RELATIVE_PATH_REGEXP = /packages\/ckeditor5?-[^/]+/;

	const getPackageRelativePathFromAbsolutePath = path => {
		const found = path.match( PACKAGE_RELATIVE_PATH_REGEXP );

		return found ? found[ 0 ] : '';
	};

	const isPackageRelativePath = path => !!path && PACKAGE_RELATIVE_PATH_REGEXP.test( path );

	return args.reduce( ( paths, arg ) => {
		const relativePath = path.isAbsolute( arg ) ? getPackageRelativePathFromAbsolutePath( arg ) : arg;

		if ( isPackageRelativePath( relativePath ) ) {
			paths.add( relativePath );
		}

		return paths;
	}, new Set() );
}

/**
 * Returns an array that contains list of files that import modules using full package name instead of relative path.
 *
 * @param repositoryPath An absolute path to the directory which should be checked.
 * @returns {Array.<String>}
 */
function getInvalidItselfImports( repositoryPath ) {
	const packageJson = require( path.join( repositoryPath, 'package.json' ) );
	const globPattern = path.join( repositoryPath, '@(src|tests)/**/*.js' );
	const invalidImportsItself = new Set();

	for ( const filePath of glob.sync( globPattern ) ) {
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
 * @param {Object} missingPackages The `missing` value from object returned by `depcheck`.
 * @param {String} currentPackage Name of current package.
 * @returns {Object.<String, Array.<String>>}
 */
function groupMissingPackages( missingPackages, currentPackage ) {
	delete missingPackages[ currentPackage ];

	const dependencies = [];
	const devDependencies = [];

	for ( const packageName of Object.keys( missingPackages ) ) {
		const absolutePaths = missingPackages[ packageName ];

		if ( isDevDependency( absolutePaths ) ) {
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
 * @param {String} filePath An absolute path to the checking file.
 * @param {Function} onMissingCSSFile Error handler called when a CSS file is not found.
 * @returns {Array.<String>|undefined}
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
				const fileToImport = path.resolve( filePath, '..', importDetails.path );

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
 * @param {Object|undefined} dependencies
 * @param {Object|undefined} devDependencies
 * @returns {Array.<String>}
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
 * @param {Object|undefined} dependencies Defined dependencies from package.json.
 * @param {Object|undefined} devDependencies Defined development dependencies from package.json.
 * @param {Object} dependenciesToCheck All dependencies that have been found and files where they are used.
 * @returns {Array.<Object>} Misplaced packages. Each array item is an object containing
 * the `description` string and `packageNames` array of strings.
 */
function findMisplacedDependencies( dependencies, devDependencies, dependenciesToCheck ) {
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
		const isDevDep = isDevDependency( absolutePaths );
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
 * Checks if a package is a development dependency: a package not used in the source and theme.
 *
 * @param {Array.<String>} absolutePaths Files where a given package has been imported.
 * @returns {Boolean}
 */
function isDevDependency( absolutePaths ) {
	return !absolutePaths.some( absolutePath => absolutePath.match( /[/\\](src|theme)[/\\]/ ) );
}

/**
 * Displays all found errors.
 *
 * @param {Array.<String>} data Collection of errors.
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
