/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

/* eslint-disable @stylistic/max-len */

import { vi, describe, it, beforeEach, afterEach, expect, type MockInstance } from 'vitest';
import { validateLicenseFiles } from '../src/validate-license-files.js';
import { glob, readFile, writeFile } from 'fs/promises';
import { resolve } from 'import-meta-resolve';

vi.mock( 'fs/promises' );
vi.mock( 'import-meta-resolve' );

describe( 'validateLicenseFiles', () => {
	let options: Parameters<typeof validateLicenseFiles>[0];
	let consoleInfoMock: MockInstance<typeof console.error>;
	let consoleErrorMock: MockInstance<typeof process.exit>;
	let fileContentMap: Record<string, string>;

	beforeEach( () => {
		options = {
			rootDir: 'root/dir',
			projectName: 'TestProject™'
		};

		consoleInfoMock = vi.spyOn( console, 'info' ).mockImplementation( () => {} );
		consoleErrorMock = vi.spyOn( console, 'error' ).mockImplementation( () => {} );

		vi.mocked( readFile ).mockImplementation( async path => {
			const key = path as string;

			if ( key in fileContentMap ) {
				return fileContentMap[ key ]!;
			}

			throw new Error( `ENOENT: no such file or directory, open '${ key }'` );
		} );
		vi.mocked( writeFile ).mockImplementation( async () => {} );
		vi.mocked( glob ).mockImplementation( async function* ( path ): AsyncGenerator<string> {
			const pathPattern = new RegExp( ( path as string ).replace( '*', '[^/]+' ) );
			const matchingFilePaths = Object.keys( fileContentMap )
				.reduce<Array<string>>( ( output, filePath ) => {
					const match = filePath.match( pathPattern );

					if ( !match ) {
						return output;
					}

					const matchedPath = match[ 0 ];

					if ( !output.includes( matchedPath ) ) {
						output.push( matchedPath );
					}

					return output;
				}, [] );

			for ( const matchingFilePath of matchingFilePaths ) {
				yield matchingFilePath;
			}
		} );
		vi.mocked( resolve ).mockImplementation( specifier => `file:root/dir/node_modules/${ specifier }` );

		fileContentMap = {
			'root/dir/node_modules/helperUtilTool/package.json': JSON.stringify( { license: 'MIT' } ),
			'root/dir/node_modules/helperUtilTool/LICENSE.md': 'Copyright (C) 1970-2070 the Best Dev',
			'root/dir/node_modules/helperManagerFactory/package.json': JSON.stringify( { license: 'BSD-3-Clause' } ),
			'root/dir/node_modules/helperManagerFactory/license': 'Copyright (c) 2019 Joe Shmo.',

			'root/dir/package.json': JSON.stringify( { name: 'project-root-package' } ),
			'root/dir/LICENSE.md': getLicense( 'short' ),

			'root/dir/packages/package-a/package.json': JSON.stringify( { name: 'package-a' } ),
			'root/dir/packages/package-a/LICENSE.md': getLicense( 'short' ),

			'root/dir/packages/package-b/package.json': JSON.stringify( { name: 'package-b' } ),
			'root/dir/packages/package-b/LICENSE.md': getLicense( 'short' )

		};
	} );

	afterEach( () => {
		consoleInfoMock.mockRestore();
		consoleErrorMock.mockRestore();
	} );

	describe( 'valid licenses', () => {
		describe( 'validation mode', () => {
			it( 'license in private repo', async () => {
				options.shouldProcessRoot = true;
				fileContentMap[ 'root/dir/LICENSE.md' ] = getLicense( 'short' );

				const exitCode = await validateLicenseFiles( options );

				expect( exitCode ).toEqual( 0 );

				expect( consoleInfoMock ).toHaveBeenCalledTimes( 3 );
				expect( consoleInfoMock ).toHaveBeenNthCalledWith( 1, 'Validating licenses in following packages:' );
				expect( consoleInfoMock ).toHaveBeenNthCalledWith( 2, ' - project-root-package' );
				expect( consoleInfoMock ).toHaveBeenNthCalledWith( 3, '\nValidation complete.' );
				expect( consoleErrorMock ).toHaveBeenCalledTimes( 0 );
			} );

			it( 'license in public repo', async () => {
				options.isPublic = true;
				options.shouldProcessRoot = true;
				fileContentMap[ 'root/dir/LICENSE.md' ] = getLicense( 'long' );

				const exitCode = await validateLicenseFiles( options );

				expect( exitCode ).toEqual( 0 );

				expect( consoleInfoMock ).toHaveBeenCalledTimes( 3 );
				expect( consoleInfoMock ).toHaveBeenNthCalledWith( 1, 'Validating licenses in following packages:' );
				expect( consoleInfoMock ).toHaveBeenNthCalledWith( 2, ' - project-root-package' );
				expect( consoleInfoMock ).toHaveBeenNthCalledWith( 3, '\nValidation complete.' );
				expect( consoleErrorMock ).toHaveBeenCalledTimes( 0 );
			} );

			it( 'license with a dependency', async () => {
				options.shouldProcessRoot = true;
				fileContentMap[ 'root/dir/package.json' ] = JSON.stringify( {
					name: 'project-root-package',
					dependencies: {
						helperUtilTool: '^12.34.56'
					}
				} );
				fileContentMap[ 'root/dir/LICENSE.md' ] = getLicense( 'short', [
					'',
					'The following libraries are included in TestProject™ under the [MIT license](https://opensource.org/licenses/MIT):',
					'',
					'* helperUtilTool - Copyright (C) 1970-2070 the Best Dev.'
				] );

				const exitCode = await validateLicenseFiles( options );

				expect( exitCode ).toEqual( 0 );

				expect( consoleInfoMock ).toHaveBeenCalledTimes( 3 );
				expect( consoleInfoMock ).toHaveBeenNthCalledWith( 1, 'Validating licenses in following packages:' );
				expect( consoleInfoMock ).toHaveBeenNthCalledWith( 2, ' - project-root-package' );
				expect( consoleInfoMock ).toHaveBeenNthCalledWith( 3, '\nValidation complete.' );
				expect( consoleErrorMock ).toHaveBeenCalledTimes( 0 );
			} );

			it( 'license with a dependency that does not have a `./` export', async () => {
				vi.mocked( resolve ).mockImplementation( () => {
					throw new Error( 'Package subpath \'./\' is not defined by "exports" in root/dir/node_modules/helperUtilTool/package.json imported from root/dir/project-root-package' );
				} );

				options.shouldProcessRoot = true;
				fileContentMap[ 'root/dir/package.json' ] = JSON.stringify( {
					name: 'project-root-package',
					dependencies: {
						helperUtilTool: '^12.34.56'
					}
				} );
				fileContentMap[ 'root/dir/LICENSE.md' ] = getLicense( 'short', [
					'',
					'The following libraries are included in TestProject™ under the [MIT license](https://opensource.org/licenses/MIT):',
					'',
					'* helperUtilTool - Copyright (C) 1970-2070 the Best Dev.'
				] );

				const exitCode = await validateLicenseFiles( options );

				expect( exitCode ).toEqual( 0 );

				expect( consoleInfoMock ).toHaveBeenCalledTimes( 3 );
				expect( consoleInfoMock ).toHaveBeenNthCalledWith( 1, 'Validating licenses in following packages:' );
				expect( consoleInfoMock ).toHaveBeenNthCalledWith( 2, ' - project-root-package' );
				expect( consoleInfoMock ).toHaveBeenNthCalledWith( 3, '\nValidation complete.' );
				expect( consoleErrorMock ).toHaveBeenCalledTimes( 0 );
			} );

			it( 'license with an additional dependency from an override', async () => {
				options.shouldProcessRoot = true;
				options.copyrightOverrides = [ {
					packageName: 'project-root-package',
					dependencies: [ {
						license: 'MIT',
						name: 'hidden-helper',
						copyright: 'Copyright (c) 2025 the Sneaky Dev.'
					} ]
				} ];
				fileContentMap[ 'root/dir/package.json' ] = JSON.stringify( {
					name: 'project-root-package',
					dependencies: {
						helperUtilTool: '^12.34.56'
					}
				} );
				fileContentMap[ 'root/dir/LICENSE.md' ] = getLicense( 'short', [
					'',
					'The following libraries are included in TestProject™ under the [MIT license](https://opensource.org/licenses/MIT):',
					'',
					'* helperUtilTool - Copyright (C) 1970-2070 the Best Dev.',
					'* hidden-helper - Copyright (c) 2025 the Sneaky Dev.'
				] );

				const exitCode = await validateLicenseFiles( options );

				expect( exitCode ).toEqual( 0 );

				expect( consoleInfoMock ).toHaveBeenCalledTimes( 3 );
				expect( consoleInfoMock ).toHaveBeenNthCalledWith( 1, 'Validating licenses in following packages:' );
				expect( consoleInfoMock ).toHaveBeenNthCalledWith( 2, ' - project-root-package' );
				expect( consoleInfoMock ).toHaveBeenNthCalledWith( 3, '\nValidation complete.' );
				expect( consoleErrorMock ).toHaveBeenCalledTimes( 0 );
			} );

			it( 'license with an overridden dependency', async () => {
				options.shouldProcessRoot = true;
				options.copyrightOverrides = [ {
					packageName: 'project-root-package',
					dependencies: [ {
						license: 'MIT',
						name: 'helperUtilTool',
						copyright: 'Copyright (c) the Actual Dev.'
					} ]
				} ];
				fileContentMap[ 'root/dir/package.json' ] = JSON.stringify( {
					name: 'project-root-package',
					dependencies: {
						helperUtilTool: '^12.34.56'
					}
				} );
				fileContentMap[ 'root/dir/LICENSE.md' ] = getLicense( 'short', [
					'',
					'The following libraries are included in TestProject™ under the [MIT license](https://opensource.org/licenses/MIT):',
					'',
					'* helperUtilTool - Copyright (c) the Actual Dev.'
				] );

				const exitCode = await validateLicenseFiles( options );

				expect( exitCode ).toEqual( 0 );

				expect( consoleInfoMock ).toHaveBeenCalledTimes( 3 );
				expect( consoleInfoMock ).toHaveBeenNthCalledWith( 1, 'Validating licenses in following packages:' );
				expect( consoleInfoMock ).toHaveBeenNthCalledWith( 2, ' - project-root-package' );
				expect( consoleInfoMock ).toHaveBeenNthCalledWith( 3, '\nValidation complete.' );
				expect( consoleErrorMock ).toHaveBeenCalledTimes( 0 );
			} );

			it( 'license with an overridden dependency which is missing in the source package', async () => {
				options.shouldProcessRoot = true;
				options.copyrightOverrides = [ {
					packageName: 'project-root-package',
					dependencies: [ {
						license: 'MIT',
						name: 'helperUtilTool',
						copyright: 'Copyright (c) the Actual Dev.'
					} ]
				} ];
				fileContentMap[ 'root/dir/package.json' ] = JSON.stringify( {
					name: 'project-root-package',
					dependencies: {
						helperUtilTool: '^12.34.56'
					}
				} );
				fileContentMap[ 'root/dir/LICENSE.md' ] = getLicense( 'short', [
					'',
					'The following libraries are included in TestProject™ under the [MIT license](https://opensource.org/licenses/MIT):',
					'',
					'* helperUtilTool - Copyright (c) the Actual Dev.'
				] );
				delete fileContentMap[ 'root/dir/node_modules/helperUtilTool/LICENSE.md' ];

				const exitCode = await validateLicenseFiles( options );

				expect( exitCode ).toEqual( 0 );

				expect( consoleInfoMock ).toHaveBeenCalledTimes( 3 );
				expect( consoleInfoMock ).toHaveBeenNthCalledWith( 1, 'Validating licenses in following packages:' );
				expect( consoleInfoMock ).toHaveBeenNthCalledWith( 2, ' - project-root-package' );
				expect( consoleInfoMock ).toHaveBeenNthCalledWith( 3, '\nValidation complete.' );
				expect( consoleErrorMock ).toHaveBeenCalledTimes( 0 );
			} );

			it( 'license with a dependency with multiple copyright messages', async () => {
				options.shouldProcessRoot = true;
				fileContentMap[ 'root/dir/package.json' ] = JSON.stringify( {
					name: 'project-root-package',
					dependencies: {
						helperUtilTool: '^12.34.56'
					}
				} );
				fileContentMap[ 'root/dir/LICENSE.md' ] = getLicense( 'short', [
					'',
					'The following libraries are included in TestProject™ under the [MIT license](https://opensource.org/licenses/MIT):',
					'',
					'* helperUtilTool - Copyright (C) 1970-2070 the Elder Dev, Copyright (C) 1985-1990 the Part Time Dev, and Copyright (C) 2070 the Intern Dev.'
				] );
				fileContentMap[ 'root/dir/node_modules/helperUtilTool/LICENSE.md' ] = [
					'Copyright (C) 1970-2070 the Elder Dev.',
					'Copyright (C) 1985-1990 the Part Time Dev.',
					'Copyright (C) 2070 the Intern Dev.'
				].join( '\n' );

				const exitCode = await validateLicenseFiles( options );

				expect( exitCode ).toEqual( 0 );

				expect( consoleInfoMock ).toHaveBeenCalledTimes( 3 );
				expect( consoleInfoMock ).toHaveBeenNthCalledWith( 1, 'Validating licenses in following packages:' );
				expect( consoleInfoMock ).toHaveBeenNthCalledWith( 2, ' - project-root-package' );
				expect( consoleInfoMock ).toHaveBeenNthCalledWith( 3, '\nValidation complete.' );
				expect( consoleErrorMock ).toHaveBeenCalledTimes( 0 );
			} );

			it( 'licenses in the packages directory', async () => {
				options.shouldProcessPackages = true;

				const exitCode = await validateLicenseFiles( options );

				expect( exitCode ).toEqual( 0 );

				expect( consoleInfoMock ).toHaveBeenCalledTimes( 3 );
				expect( consoleInfoMock ).toHaveBeenNthCalledWith( 1, 'Validating licenses in following packages:' );
				expect( consoleInfoMock ).toHaveBeenNthCalledWith( 2, [
					' - package-a',
					' - package-b'
				].join( '\n' ) );
				expect( consoleInfoMock ).toHaveBeenNthCalledWith( 3, '\nValidation complete.' );
				expect( consoleErrorMock ).toHaveBeenCalledTimes( 0 );
			} );

			it( 'licenses in the packages directory with dependencies', async () => {
				options.shouldProcessPackages = true;

				fileContentMap[ 'root/dir/packages/package-a/package.json' ] = JSON.stringify( {
					name: 'package-a',
					dependencies: {
						helperUtilTool: '^12.34.56'
					}
				} );
				fileContentMap[ 'root/dir/packages/package-b/package.json' ] = JSON.stringify( {
					name: 'package-b',
					dependencies: {
						helperManagerFactory: '^7.8.9'
					}
				} );
				fileContentMap[ 'root/dir/packages/package-a/LICENSE.md' ] = getLicense( 'short', [
					'',
					'The following libraries are included in TestProject™ under the [MIT license](https://opensource.org/licenses/MIT):',
					'',
					'* helperUtilTool - Copyright (C) 1970-2070 the Best Dev.'
				] );
				fileContentMap[ 'root/dir/packages/package-b/LICENSE.md' ] = getLicense( 'short', [
					'',
					'The following libraries are included in TestProject™ under the [BSD-3-Clause license](https://opensource.org/licenses/BSD-3-Clause):',
					'',
					'* helperManagerFactory - Copyright (c) 2019 Joe Shmo.'
				] );

				const exitCode = await validateLicenseFiles( options );

				expect( exitCode ).toEqual( 0 );

				expect( consoleInfoMock ).toHaveBeenCalledTimes( 3 );
				expect( consoleInfoMock ).toHaveBeenNthCalledWith( 1, 'Validating licenses in following packages:' );
				expect( consoleInfoMock ).toHaveBeenNthCalledWith( 2, [
					' - package-a',
					' - package-b'
				].join( '\n' ) );
				expect( consoleInfoMock ).toHaveBeenNthCalledWith( 3, '\nValidation complete.' );
				expect( consoleErrorMock ).toHaveBeenCalledTimes( 0 );
			} );

			it( 'licenses in the root package and packages directory with dependencies', async () => {
				options.shouldProcessRoot = true;
				options.shouldProcessPackages = true;

				fileContentMap[ 'root/dir/package.json' ] = JSON.stringify( {
					name: 'project-root-package',
					dependencies: {
						helperUtilTool: '^12.34.56'
					}
				} );
				fileContentMap[ 'root/dir/packages/package-a/package.json' ] = JSON.stringify( {
					name: 'package-a',
					dependencies: {
						helperUtilTool: '^12.34.56'
					}
				} );
				fileContentMap[ 'root/dir/packages/package-b/package.json' ] = JSON.stringify( {
					name: 'package-b',
					dependencies: {
						helperManagerFactory: '^7.8.9'
					}
				} );
				fileContentMap[ 'root/dir/LICENSE.md' ] = getLicense( 'short', [
					'',
					'The following libraries are included in TestProject™ under the [MIT license](https://opensource.org/licenses/MIT):',
					'',
					'* helperUtilTool - Copyright (C) 1970-2070 the Best Dev.'
				] );
				fileContentMap[ 'root/dir/packages/package-a/LICENSE.md' ] = getLicense( 'short', [
					'',
					'The following libraries are included in TestProject™ under the [MIT license](https://opensource.org/licenses/MIT):',
					'',
					'* helperUtilTool - Copyright (C) 1970-2070 the Best Dev.'
				] );
				fileContentMap[ 'root/dir/packages/package-b/LICENSE.md' ] = getLicense( 'short', [
					'',
					'The following libraries are included in TestProject™ under the [BSD-3-Clause license](https://opensource.org/licenses/BSD-3-Clause):',
					'',
					'* helperManagerFactory - Copyright (c) 2019 Joe Shmo.'
				] );

				const exitCode = await validateLicenseFiles( options );

				expect( exitCode ).toEqual( 0 );

				expect( consoleInfoMock ).toHaveBeenCalledTimes( 3 );
				expect( consoleInfoMock ).toHaveBeenNthCalledWith( 1, 'Validating licenses in following packages:' );
				expect( consoleInfoMock ).toHaveBeenNthCalledWith( 2, [
					' - project-root-package',
					' - package-a',
					' - package-b'
				].join( '\n' ) );
				expect( consoleInfoMock ).toHaveBeenNthCalledWith( 3, '\nValidation complete.' );
				expect( consoleErrorMock ).toHaveBeenCalledTimes( 0 );
			} );

			it( 'main package with aggregated licenses in the root package', async () => {
				options.mainPackageName = 'project-root-package';
				options.shouldProcessRoot = true;
				options.shouldProcessPackages = true;

				fileContentMap[ 'root/dir/package.json' ] = JSON.stringify( {
					name: 'project-root-package',
					dependencies: {
						helperUtilTool: '^12.34.56'
					}
				} );
				fileContentMap[ 'root/dir/packages/package-a/package.json' ] = JSON.stringify( {
					name: 'package-a',
					dependencies: {
						helperUtilTool: '^12.34.56'
					}
				} );
				fileContentMap[ 'root/dir/packages/package-b/package.json' ] = JSON.stringify( {
					name: 'package-b',
					dependencies: {
						helperManagerFactory: '^7.8.9'
					}
				} );
				fileContentMap[ 'root/dir/LICENSE.md' ] = getLicense( 'short', [
					'',
					'The following libraries are included in TestProject™ under the [BSD-3-Clause license](https://opensource.org/licenses/BSD-3-Clause):',
					'',
					'* helperManagerFactory - Copyright (c) 2019 Joe Shmo.',
					'',
					'The following libraries are included in TestProject™ under the [MIT license](https://opensource.org/licenses/MIT):',
					'',
					'* helperUtilTool - Copyright (C) 1970-2070 the Best Dev.'
				] );
				fileContentMap[ 'root/dir/packages/package-a/LICENSE.md' ] = getLicense( 'short', [
					'',
					'The following libraries are included in TestProject™ under the [MIT license](https://opensource.org/licenses/MIT):',
					'',
					'* helperUtilTool - Copyright (C) 1970-2070 the Best Dev.'
				] );
				fileContentMap[ 'root/dir/packages/package-b/LICENSE.md' ] = getLicense( 'short', [
					'',
					'The following libraries are included in TestProject™ under the [BSD-3-Clause license](https://opensource.org/licenses/BSD-3-Clause):',
					'',
					'* helperManagerFactory - Copyright (c) 2019 Joe Shmo.'
				] );

				const exitCode = await validateLicenseFiles( options );

				expect( exitCode ).toEqual( 0 );

				expect( consoleInfoMock ).toHaveBeenCalledTimes( 3 );
				expect( consoleInfoMock ).toHaveBeenNthCalledWith( 1, 'Validating licenses in following packages:' );
				expect( consoleInfoMock ).toHaveBeenNthCalledWith( 2, [
					' - project-root-package',
					' - package-a',
					' - package-b'
				].join( '\n' ) );
				expect( consoleInfoMock ).toHaveBeenNthCalledWith( 3, '\nValidation complete.' );
				expect( consoleErrorMock ).toHaveBeenCalledTimes( 0 );
			} );

			it( 'main package with aggregated licenses in the packages directory', async () => {
				options.mainPackageName = 'package-a';
				options.shouldProcessRoot = true;
				options.shouldProcessPackages = true;

				fileContentMap[ 'root/dir/package.json' ] = JSON.stringify( {
					name: 'project-root-package',
					dependencies: {
						helperUtilTool: '^12.34.56'
					}
				} );
				fileContentMap[ 'root/dir/packages/package-a/package.json' ] = JSON.stringify( {
					name: 'package-a',
					dependencies: {
						helperUtilTool: '^12.34.56'
					}
				} );
				fileContentMap[ 'root/dir/packages/package-b/package.json' ] = JSON.stringify( {
					name: 'package-b',
					dependencies: {
						helperManagerFactory: '^7.8.9'
					}
				} );
				fileContentMap[ 'root/dir/LICENSE.md' ] = getLicense( 'short', [
					'',
					'The following libraries are included in TestProject™ under the [MIT license](https://opensource.org/licenses/MIT):',
					'',
					'* helperUtilTool - Copyright (C) 1970-2070 the Best Dev.'
				] );
				fileContentMap[ 'root/dir/packages/package-a/LICENSE.md' ] = getLicense( 'short', [
					'',
					'The following libraries are included in TestProject™ under the [BSD-3-Clause license](https://opensource.org/licenses/BSD-3-Clause):',
					'',
					'* helperManagerFactory - Copyright (c) 2019 Joe Shmo.',
					'',
					'The following libraries are included in TestProject™ under the [MIT license](https://opensource.org/licenses/MIT):',
					'',
					'* helperUtilTool - Copyright (C) 1970-2070 the Best Dev.'
				] );
				fileContentMap[ 'root/dir/packages/package-b/LICENSE.md' ] = getLicense( 'short', [
					'',
					'The following libraries are included in TestProject™ under the [BSD-3-Clause license](https://opensource.org/licenses/BSD-3-Clause):',
					'',
					'* helperManagerFactory - Copyright (c) 2019 Joe Shmo.'
				] );

				const exitCode = await validateLicenseFiles( options );

				expect( exitCode ).toEqual( 0 );

				expect( consoleInfoMock ).toHaveBeenCalledTimes( 3 );
				expect( consoleInfoMock ).toHaveBeenNthCalledWith( 1, 'Validating licenses in following packages:' );
				expect( consoleInfoMock ).toHaveBeenNthCalledWith( 2, [
					' - project-root-package',
					' - package-a',
					' - package-b'
				].join( '\n' ) );
				expect( consoleInfoMock ).toHaveBeenNthCalledWith( 3, '\nValidation complete.' );
				expect( consoleErrorMock ).toHaveBeenCalledTimes( 0 );
			} );
		} );

		describe( 'fixing mode', () => {
			beforeEach( () => {
				options.fix = true;
			} );

			it( 'license in private repo', async () => {
				options.shouldProcessRoot = true;
				fileContentMap[ 'root/dir/LICENSE.md' ] = getLicense( 'short' );

				const exitCode = await validateLicenseFiles( options );

				expect( exitCode ).toEqual( 0 );

				expect( consoleInfoMock ).toHaveBeenCalledTimes( 3 );
				expect( consoleInfoMock ).toHaveBeenNthCalledWith( 1, 'Validating licenses in following packages:' );
				expect( consoleInfoMock ).toHaveBeenNthCalledWith( 2, ' - project-root-package' );
				expect( consoleInfoMock ).toHaveBeenNthCalledWith( 3, '\nValidation complete.' );
				expect( consoleErrorMock ).toHaveBeenCalledTimes( 0 );

				expect( writeFile ).toHaveBeenCalledTimes( 0 );
			} );

			it( 'license in public repo', async () => {
				options.isPublic = true;
				options.shouldProcessRoot = true;
				fileContentMap[ 'root/dir/LICENSE.md' ] = getLicense( 'long' );

				const exitCode = await validateLicenseFiles( options );

				expect( exitCode ).toEqual( 0 );

				expect( consoleInfoMock ).toHaveBeenCalledTimes( 3 );
				expect( consoleInfoMock ).toHaveBeenNthCalledWith( 1, 'Validating licenses in following packages:' );
				expect( consoleInfoMock ).toHaveBeenNthCalledWith( 2, ' - project-root-package' );
				expect( consoleInfoMock ).toHaveBeenNthCalledWith( 3, '\nValidation complete.' );
				expect( consoleErrorMock ).toHaveBeenCalledTimes( 0 );

				expect( writeFile ).toHaveBeenCalledTimes( 0 );
			} );

			it( 'license with a dependency', async () => {
				options.shouldProcessRoot = true;
				fileContentMap[ 'root/dir/package.json' ] = JSON.stringify( {
					name: 'project-root-package',
					dependencies: {
						helperUtilTool: '^12.34.56'
					}
				} );
				fileContentMap[ 'root/dir/LICENSE.md' ] = getLicense( 'short', [
					'',
					'The following libraries are included in TestProject™ under the [MIT license](https://opensource.org/licenses/MIT):',
					'',
					'* helperUtilTool - Copyright (C) 1970-2070 the Best Dev.'
				] );

				const exitCode = await validateLicenseFiles( options );

				expect( exitCode ).toEqual( 0 );

				expect( consoleInfoMock ).toHaveBeenCalledTimes( 3 );
				expect( consoleInfoMock ).toHaveBeenNthCalledWith( 1, 'Validating licenses in following packages:' );
				expect( consoleInfoMock ).toHaveBeenNthCalledWith( 2, ' - project-root-package' );
				expect( consoleInfoMock ).toHaveBeenNthCalledWith( 3, '\nValidation complete.' );
				expect( consoleErrorMock ).toHaveBeenCalledTimes( 0 );

				expect( writeFile ).toHaveBeenCalledTimes( 0 );
			} );

			it( 'license with a dependency that does not have a `./` export', async () => {
				vi.mocked( resolve ).mockImplementation( () => {
					throw new Error( 'Package subpath \'./\' is not defined by "exports" in root/dir/node_modules/helperUtilTool/package.json imported from root/dir/project-root-package' );
				} );

				options.shouldProcessRoot = true;
				fileContentMap[ 'root/dir/package.json' ] = JSON.stringify( {
					name: 'project-root-package',
					dependencies: {
						helperUtilTool: '^12.34.56'
					}
				} );
				fileContentMap[ 'root/dir/LICENSE.md' ] = getLicense( 'short', [
					'',
					'The following libraries are included in TestProject™ under the [MIT license](https://opensource.org/licenses/MIT):',
					'',
					'* helperUtilTool - Copyright (C) 1970-2070 the Best Dev.'
				] );

				const exitCode = await validateLicenseFiles( options );

				expect( exitCode ).toEqual( 0 );

				expect( consoleInfoMock ).toHaveBeenCalledTimes( 3 );
				expect( consoleInfoMock ).toHaveBeenNthCalledWith( 1, 'Validating licenses in following packages:' );
				expect( consoleInfoMock ).toHaveBeenNthCalledWith( 2, ' - project-root-package' );
				expect( consoleInfoMock ).toHaveBeenNthCalledWith( 3, '\nValidation complete.' );
				expect( consoleErrorMock ).toHaveBeenCalledTimes( 0 );

				expect( writeFile ).toHaveBeenCalledTimes( 0 );
			} );

			it( 'license with an additional dependency from an override', async () => {
				options.shouldProcessRoot = true;
				options.copyrightOverrides = [ {
					packageName: 'project-root-package',
					dependencies: [ {
						license: 'MIT',
						name: 'hidden-helper',
						copyright: 'Copyright (c) 2025 the Sneaky Dev.'
					} ]
				} ];
				fileContentMap[ 'root/dir/package.json' ] = JSON.stringify( {
					name: 'project-root-package',
					dependencies: {
						helperUtilTool: '^12.34.56'
					}
				} );
				fileContentMap[ 'root/dir/LICENSE.md' ] = getLicense( 'short', [
					'',
					'The following libraries are included in TestProject™ under the [MIT license](https://opensource.org/licenses/MIT):',
					'',
					'* helperUtilTool - Copyright (C) 1970-2070 the Best Dev.',
					'* hidden-helper - Copyright (c) 2025 the Sneaky Dev.'
				] );

				const exitCode = await validateLicenseFiles( options );

				expect( exitCode ).toEqual( 0 );

				expect( consoleInfoMock ).toHaveBeenCalledTimes( 3 );
				expect( consoleInfoMock ).toHaveBeenNthCalledWith( 1, 'Validating licenses in following packages:' );
				expect( consoleInfoMock ).toHaveBeenNthCalledWith( 2, ' - project-root-package' );
				expect( consoleInfoMock ).toHaveBeenNthCalledWith( 3, '\nValidation complete.' );
				expect( consoleErrorMock ).toHaveBeenCalledTimes( 0 );

				expect( writeFile ).toHaveBeenCalledTimes( 0 );
			} );

			it( 'license with an overridden dependency', async () => {
				options.shouldProcessRoot = true;
				options.copyrightOverrides = [ {
					packageName: 'project-root-package',
					dependencies: [ {
						license: 'MIT',
						name: 'helperUtilTool',
						copyright: 'Copyright (c) the Actual Dev.'
					} ]
				} ];
				fileContentMap[ 'root/dir/package.json' ] = JSON.stringify( {
					name: 'project-root-package',
					dependencies: {
						helperUtilTool: '^12.34.56'
					}
				} );
				fileContentMap[ 'root/dir/LICENSE.md' ] = getLicense( 'short', [
					'',
					'The following libraries are included in TestProject™ under the [MIT license](https://opensource.org/licenses/MIT):',
					'',
					'* helperUtilTool - Copyright (c) the Actual Dev.'
				] );

				const exitCode = await validateLicenseFiles( options );

				expect( exitCode ).toEqual( 0 );

				expect( consoleInfoMock ).toHaveBeenCalledTimes( 3 );
				expect( consoleInfoMock ).toHaveBeenNthCalledWith( 1, 'Validating licenses in following packages:' );
				expect( consoleInfoMock ).toHaveBeenNthCalledWith( 2, ' - project-root-package' );
				expect( consoleInfoMock ).toHaveBeenNthCalledWith( 3, '\nValidation complete.' );
				expect( consoleErrorMock ).toHaveBeenCalledTimes( 0 );

				expect( writeFile ).toHaveBeenCalledTimes( 0 );
			} );

			it( 'license with an overridden dependency which is missing in the source package', async () => {
				options.shouldProcessRoot = true;
				options.copyrightOverrides = [ {
					packageName: 'project-root-package',
					dependencies: [ {
						license: 'MIT',
						name: 'helperUtilTool',
						copyright: 'Copyright (c) the Actual Dev.'
					} ]
				} ];
				fileContentMap[ 'root/dir/package.json' ] = JSON.stringify( {
					name: 'project-root-package',
					dependencies: {
						helperUtilTool: '^12.34.56'
					}
				} );
				fileContentMap[ 'root/dir/LICENSE.md' ] = getLicense( 'short', [
					'',
					'The following libraries are included in TestProject™ under the [MIT license](https://opensource.org/licenses/MIT):',
					'',
					'* helperUtilTool - Copyright (c) the Actual Dev.'
				] );
				delete fileContentMap[ 'root/dir/node_modules/helperUtilTool/LICENSE.md' ];

				const exitCode = await validateLicenseFiles( options );

				expect( exitCode ).toEqual( 0 );

				expect( consoleInfoMock ).toHaveBeenCalledTimes( 3 );
				expect( consoleInfoMock ).toHaveBeenNthCalledWith( 1, 'Validating licenses in following packages:' );
				expect( consoleInfoMock ).toHaveBeenNthCalledWith( 2, ' - project-root-package' );
				expect( consoleInfoMock ).toHaveBeenNthCalledWith( 3, '\nValidation complete.' );
				expect( consoleErrorMock ).toHaveBeenCalledTimes( 0 );

				expect( writeFile ).toHaveBeenCalledTimes( 0 );
			} );

			it( 'license with a dependency with multiple copyright messages', async () => {
				options.shouldProcessRoot = true;
				fileContentMap[ 'root/dir/package.json' ] = JSON.stringify( {
					name: 'project-root-package',
					dependencies: {
						helperUtilTool: '^12.34.56'
					}
				} );
				fileContentMap[ 'root/dir/LICENSE.md' ] = getLicense( 'short', [
					'',
					'The following libraries are included in TestProject™ under the [MIT license](https://opensource.org/licenses/MIT):',
					'',
					'* helperUtilTool - Copyright (C) 1970-2070 the Elder Dev, Copyright (C) 1985-1990 the Part Time Dev, and Copyright (C) 2070 the Intern Dev.'
				] );
				fileContentMap[ 'root/dir/node_modules/helperUtilTool/LICENSE.md' ] = [
					'Copyright (C) 1970-2070 the Elder Dev.',
					'Copyright (C) 1985-1990 the Part Time Dev.',
					'Copyright (C) 2070 the Intern Dev.'
				].join( '\n' );

				const exitCode = await validateLicenseFiles( options );

				expect( exitCode ).toEqual( 0 );

				expect( consoleInfoMock ).toHaveBeenCalledTimes( 3 );
				expect( consoleInfoMock ).toHaveBeenNthCalledWith( 1, 'Validating licenses in following packages:' );
				expect( consoleInfoMock ).toHaveBeenNthCalledWith( 2, ' - project-root-package' );
				expect( consoleInfoMock ).toHaveBeenNthCalledWith( 3, '\nValidation complete.' );
				expect( consoleErrorMock ).toHaveBeenCalledTimes( 0 );

				expect( writeFile ).toHaveBeenCalledTimes( 0 );
			} );

			it( 'licenses in the packages directory', async () => {
				options.shouldProcessPackages = true;

				const exitCode = await validateLicenseFiles( options );

				expect( exitCode ).toEqual( 0 );

				expect( consoleInfoMock ).toHaveBeenCalledTimes( 3 );
				expect( consoleInfoMock ).toHaveBeenNthCalledWith( 1, 'Validating licenses in following packages:' );
				expect( consoleInfoMock ).toHaveBeenNthCalledWith( 2, [
					' - package-a',
					' - package-b'
				].join( '\n' ) );
				expect( consoleInfoMock ).toHaveBeenNthCalledWith( 3, '\nValidation complete.' );
				expect( consoleErrorMock ).toHaveBeenCalledTimes( 0 );

				expect( writeFile ).toHaveBeenCalledTimes( 0 );
			} );

			it( 'licenses in the packages directory with dependencies', async () => {
				options.shouldProcessPackages = true;

				fileContentMap[ 'root/dir/packages/package-a/package.json' ] = JSON.stringify( {
					name: 'package-a',
					dependencies: {
						helperUtilTool: '^12.34.56'
					}
				} );
				fileContentMap[ 'root/dir/packages/package-b/package.json' ] = JSON.stringify( {
					name: 'package-b',
					dependencies: {
						helperManagerFactory: '^7.8.9'
					}
				} );
				fileContentMap[ 'root/dir/packages/package-a/LICENSE.md' ] = getLicense( 'short', [
					'',
					'The following libraries are included in TestProject™ under the [MIT license](https://opensource.org/licenses/MIT):',
					'',
					'* helperUtilTool - Copyright (C) 1970-2070 the Best Dev.'
				] );
				fileContentMap[ 'root/dir/packages/package-b/LICENSE.md' ] = getLicense( 'short', [
					'',
					'The following libraries are included in TestProject™ under the [BSD-3-Clause license](https://opensource.org/licenses/BSD-3-Clause):',
					'',
					'* helperManagerFactory - Copyright (c) 2019 Joe Shmo.'
				] );

				const exitCode = await validateLicenseFiles( options );

				expect( exitCode ).toEqual( 0 );

				expect( consoleInfoMock ).toHaveBeenCalledTimes( 3 );
				expect( consoleInfoMock ).toHaveBeenNthCalledWith( 1, 'Validating licenses in following packages:' );
				expect( consoleInfoMock ).toHaveBeenNthCalledWith( 2, [
					' - package-a',
					' - package-b'
				].join( '\n' ) );
				expect( consoleInfoMock ).toHaveBeenNthCalledWith( 3, '\nValidation complete.' );
				expect( consoleErrorMock ).toHaveBeenCalledTimes( 0 );

				expect( writeFile ).toHaveBeenCalledTimes( 0 );
			} );

			it( 'licenses in the root package and packages directory with dependencies', async () => {
				options.shouldProcessRoot = true;
				options.shouldProcessPackages = true;

				fileContentMap[ 'root/dir/package.json' ] = JSON.stringify( {
					name: 'project-root-package',
					dependencies: {
						helperUtilTool: '^12.34.56'
					}
				} );
				fileContentMap[ 'root/dir/packages/package-a/package.json' ] = JSON.stringify( {
					name: 'package-a',
					dependencies: {
						helperUtilTool: '^12.34.56'
					}
				} );
				fileContentMap[ 'root/dir/packages/package-b/package.json' ] = JSON.stringify( {
					name: 'package-b',
					dependencies: {
						helperManagerFactory: '^7.8.9'
					}
				} );
				fileContentMap[ 'root/dir/LICENSE.md' ] = getLicense( 'short', [
					'',
					'The following libraries are included in TestProject™ under the [MIT license](https://opensource.org/licenses/MIT):',
					'',
					'* helperUtilTool - Copyright (C) 1970-2070 the Best Dev.'
				] );
				fileContentMap[ 'root/dir/packages/package-a/LICENSE.md' ] = getLicense( 'short', [
					'',
					'The following libraries are included in TestProject™ under the [MIT license](https://opensource.org/licenses/MIT):',
					'',
					'* helperUtilTool - Copyright (C) 1970-2070 the Best Dev.'
				] );
				fileContentMap[ 'root/dir/packages/package-b/LICENSE.md' ] = getLicense( 'short', [
					'',
					'The following libraries are included in TestProject™ under the [BSD-3-Clause license](https://opensource.org/licenses/BSD-3-Clause):',
					'',
					'* helperManagerFactory - Copyright (c) 2019 Joe Shmo.'
				] );

				const exitCode = await validateLicenseFiles( options );

				expect( exitCode ).toEqual( 0 );

				expect( consoleInfoMock ).toHaveBeenCalledTimes( 3 );
				expect( consoleInfoMock ).toHaveBeenNthCalledWith( 1, 'Validating licenses in following packages:' );
				expect( consoleInfoMock ).toHaveBeenNthCalledWith( 2, [
					' - project-root-package',
					' - package-a',
					' - package-b'
				].join( '\n' ) );
				expect( consoleInfoMock ).toHaveBeenNthCalledWith( 3, '\nValidation complete.' );
				expect( consoleErrorMock ).toHaveBeenCalledTimes( 0 );

				expect( writeFile ).toHaveBeenCalledTimes( 0 );
			} );

			it( 'main package with aggregated licenses in the root package', async () => {
				options.mainPackageName = 'project-root-package';
				options.shouldProcessRoot = true;
				options.shouldProcessPackages = true;

				fileContentMap[ 'root/dir/package.json' ] = JSON.stringify( {
					name: 'project-root-package',
					dependencies: {
						helperUtilTool: '^12.34.56'
					}
				} );
				fileContentMap[ 'root/dir/packages/package-a/package.json' ] = JSON.stringify( {
					name: 'package-a',
					dependencies: {
						helperUtilTool: '^12.34.56'
					}
				} );
				fileContentMap[ 'root/dir/packages/package-b/package.json' ] = JSON.stringify( {
					name: 'package-b',
					dependencies: {
						helperManagerFactory: '^7.8.9'
					}
				} );
				fileContentMap[ 'root/dir/LICENSE.md' ] = getLicense( 'short', [
					'',
					'The following libraries are included in TestProject™ under the [BSD-3-Clause license](https://opensource.org/licenses/BSD-3-Clause):',
					'',
					'* helperManagerFactory - Copyright (c) 2019 Joe Shmo.',
					'',
					'The following libraries are included in TestProject™ under the [MIT license](https://opensource.org/licenses/MIT):',
					'',
					'* helperUtilTool - Copyright (C) 1970-2070 the Best Dev.'
				] );
				fileContentMap[ 'root/dir/packages/package-a/LICENSE.md' ] = getLicense( 'short', [
					'',
					'The following libraries are included in TestProject™ under the [MIT license](https://opensource.org/licenses/MIT):',
					'',
					'* helperUtilTool - Copyright (C) 1970-2070 the Best Dev.'
				] );
				fileContentMap[ 'root/dir/packages/package-b/LICENSE.md' ] = getLicense( 'short', [
					'',
					'The following libraries are included in TestProject™ under the [BSD-3-Clause license](https://opensource.org/licenses/BSD-3-Clause):',
					'',
					'* helperManagerFactory - Copyright (c) 2019 Joe Shmo.'
				] );

				const exitCode = await validateLicenseFiles( options );

				expect( exitCode ).toEqual( 0 );

				expect( consoleInfoMock ).toHaveBeenCalledTimes( 3 );
				expect( consoleInfoMock ).toHaveBeenNthCalledWith( 1, 'Validating licenses in following packages:' );
				expect( consoleInfoMock ).toHaveBeenNthCalledWith( 2, [
					' - project-root-package',
					' - package-a',
					' - package-b'
				].join( '\n' ) );
				expect( consoleInfoMock ).toHaveBeenNthCalledWith( 3, '\nValidation complete.' );
				expect( consoleErrorMock ).toHaveBeenCalledTimes( 0 );

				expect( writeFile ).toHaveBeenCalledTimes( 0 );
			} );

			it( 'main package with aggregated licenses in the packages directory', async () => {
				options.mainPackageName = 'package-a';
				options.shouldProcessRoot = true;
				options.shouldProcessPackages = true;

				fileContentMap[ 'root/dir/package.json' ] = JSON.stringify( {
					name: 'project-root-package',
					dependencies: {
						helperUtilTool: '^12.34.56'
					}
				} );
				fileContentMap[ 'root/dir/packages/package-a/package.json' ] = JSON.stringify( {
					name: 'package-a',
					dependencies: {
						helperUtilTool: '^12.34.56'
					}
				} );
				fileContentMap[ 'root/dir/packages/package-b/package.json' ] = JSON.stringify( {
					name: 'package-b',
					dependencies: {
						helperManagerFactory: '^7.8.9'
					}
				} );
				fileContentMap[ 'root/dir/LICENSE.md' ] = getLicense( 'short', [
					'',
					'The following libraries are included in TestProject™ under the [MIT license](https://opensource.org/licenses/MIT):',
					'',
					'* helperUtilTool - Copyright (C) 1970-2070 the Best Dev.'
				] );
				fileContentMap[ 'root/dir/packages/package-a/LICENSE.md' ] = getLicense( 'short', [
					'',
					'The following libraries are included in TestProject™ under the [BSD-3-Clause license](https://opensource.org/licenses/BSD-3-Clause):',
					'',
					'* helperManagerFactory - Copyright (c) 2019 Joe Shmo.',
					'',
					'The following libraries are included in TestProject™ under the [MIT license](https://opensource.org/licenses/MIT):',
					'',
					'* helperUtilTool - Copyright (C) 1970-2070 the Best Dev.'
				] );
				fileContentMap[ 'root/dir/packages/package-b/LICENSE.md' ] = getLicense( 'short', [
					'',
					'The following libraries are included in TestProject™ under the [BSD-3-Clause license](https://opensource.org/licenses/BSD-3-Clause):',
					'',
					'* helperManagerFactory - Copyright (c) 2019 Joe Shmo.'
				] );

				const exitCode = await validateLicenseFiles( options );

				expect( exitCode ).toEqual( 0 );

				expect( consoleInfoMock ).toHaveBeenCalledTimes( 3 );
				expect( consoleInfoMock ).toHaveBeenNthCalledWith( 1, 'Validating licenses in following packages:' );
				expect( consoleInfoMock ).toHaveBeenNthCalledWith( 2, [
					' - project-root-package',
					' - package-a',
					' - package-b'
				].join( '\n' ) );
				expect( consoleInfoMock ).toHaveBeenNthCalledWith( 3, '\nValidation complete.' );
				expect( consoleErrorMock ).toHaveBeenCalledTimes( 0 );

				expect( writeFile ).toHaveBeenCalledTimes( 0 );
			} );
		} );
	} );

	describe( 'invalid licenses', () => {
		describe( 'validation mode', () => {
			it( 'no files for processing were specified', async () => {
				const exitCode = await validateLicenseFiles( options );

				expect( exitCode ).toEqual( 1 );

				expect( consoleInfoMock ).toHaveBeenCalledTimes( 0 );
				expect( consoleErrorMock ).toHaveBeenCalledTimes( 1 );
				expect( consoleErrorMock ).toHaveBeenCalledWith( [
					'No packages to parse detected. Make sure that you provided proper paths,',
					'as well as set at least one of: `shouldProcessRoot` or `shouldProcessPackages`.'
				].join( '\n' ) );
			} );

			it( 'license file is missing', async () => {
				options.shouldProcessRoot = true;
				delete fileContentMap[ 'root/dir/LICENSE.md' ];

				const exitCode = await validateLicenseFiles( options );

				expect( exitCode ).toEqual( 1 );

				expect( consoleInfoMock ).toHaveBeenCalledTimes( 2 );
				expect( consoleInfoMock ).toHaveBeenNthCalledWith( 1, 'Validating licenses in following packages:' );
				expect( consoleInfoMock ).toHaveBeenNthCalledWith( 2, ' - project-root-package' );
				expect( consoleErrorMock ).toHaveBeenCalledTimes( 2 );
				expect( consoleErrorMock ).toHaveBeenNthCalledWith( 1, '\nFollowing license files are missing. Please create them:' );
				expect( consoleErrorMock ).toHaveBeenNthCalledWith( 2, ' - root/dir/LICENSE.md' );
			} );

			it( 'dependency has a `./` export but no valid path could be matched', async () => {
				vi.mocked( resolve ).mockImplementation( () => 'random/entry/point' );

				options.shouldProcessRoot = true;
				fileContentMap[ 'root/dir/package.json' ] = JSON.stringify( {
					name: 'project-root-package',
					dependencies: {
						helperUtilTool: '^12.34.56'
					}
				} );

				const exitCode = await validateLicenseFiles( options );

				expect( exitCode ).toEqual( 1 );

				expect( consoleInfoMock ).toHaveBeenCalledTimes( 2 );
				expect( consoleInfoMock ).toHaveBeenNthCalledWith( 1, 'Validating licenses in following packages:' );
				expect( consoleInfoMock ).toHaveBeenNthCalledWith( 2, ' - project-root-package' );
				expect( consoleErrorMock ).toHaveBeenCalledTimes( 2 );
				expect( consoleErrorMock ).toHaveBeenNthCalledWith( 1,
					'\n❌ Following packages include dependencies where finding copyright message failed. Please add an override:\n'
				);
				expect( consoleErrorMock ).toHaveBeenNthCalledWith( 2, [
					'project-root-package:',
					' - helperUtilTool',
					''
				].join( '\n' ) );
			} );

			it( 'dependency could not be resolved due to an unexpected resolution error', async () => {
				vi.mocked( resolve ).mockImplementation( () => {
					throw new Error( 'Resolution failed catastrophically.' );
				} );

				options.shouldProcessRoot = true;
				fileContentMap[ 'root/dir/package.json' ] = JSON.stringify( {
					name: 'project-root-package',
					dependencies: {
						helperUtilTool: '^12.34.56'
					}
				} );

				const exitCode = await validateLicenseFiles( options );

				expect( exitCode ).toEqual( 1 );

				expect( consoleInfoMock ).toHaveBeenCalledTimes( 2 );
				expect( consoleInfoMock ).toHaveBeenNthCalledWith( 1, 'Validating licenses in following packages:' );
				expect( consoleInfoMock ).toHaveBeenNthCalledWith( 2, ' - project-root-package' );
				expect( consoleErrorMock ).toHaveBeenCalledTimes( 2 );
				expect( consoleErrorMock ).toHaveBeenNthCalledWith( 1,
					'\n❌ Following packages include dependencies where finding copyright message failed. Please add an override:\n'
				);
				expect( consoleErrorMock ).toHaveBeenNthCalledWith( 2, [
					'project-root-package:',
					' - helperUtilTool',
					''
				].join( '\n' ) );
			} );

			it( 'dependency is missing license and no override is provided', async () => {
				options.shouldProcessRoot = true;
				fileContentMap[ 'root/dir/package.json' ] = JSON.stringify( {
					name: 'project-root-package',
					dependencies: {
						helperUtilTool: '^12.34.56'
					}
				} );
				delete fileContentMap[ 'root/dir/node_modules/helperUtilTool/LICENSE.md' ];

				const exitCode = await validateLicenseFiles( options );

				expect( exitCode ).toEqual( 1 );

				expect( consoleInfoMock ).toHaveBeenCalledTimes( 2 );
				expect( consoleInfoMock ).toHaveBeenNthCalledWith( 1, 'Validating licenses in following packages:' );
				expect( consoleInfoMock ).toHaveBeenNthCalledWith( 2, ' - project-root-package' );
				expect( consoleErrorMock ).toHaveBeenCalledTimes( 2 );
				expect( consoleErrorMock ).toHaveBeenNthCalledWith( 1,
					'\n❌ Following packages include dependencies where finding copyright message failed. Please add an override:\n'
				);
				expect( consoleErrorMock ).toHaveBeenNthCalledWith( 2, [
					'project-root-package:',
					' - helperUtilTool',
					''
				].join( '\n' ) );
			} );

			it( 'dependency\'s license is missing copyright line and no override is provided', async () => {
				options.shouldProcessRoot = true;
				fileContentMap[ 'root/dir/package.json' ] = JSON.stringify( {
					name: 'project-root-package',
					dependencies: {
						helperUtilTool: '^12.34.56'
					}
				} );
				fileContentMap[ 'root/dir/node_modules/helperUtilTool/LICENSE.md' ] = [
					'foo',
					'blah blah',
					'',
					'no actual copyright to be found in this file',
					'',
					'more blah blah',
					''
				].join( '\n' );

				const exitCode = await validateLicenseFiles( options );

				expect( exitCode ).toEqual( 1 );

				expect( consoleInfoMock ).toHaveBeenCalledTimes( 2 );
				expect( consoleInfoMock ).toHaveBeenNthCalledWith( 1, 'Validating licenses in following packages:' );
				expect( consoleInfoMock ).toHaveBeenNthCalledWith( 2, ' - project-root-package' );
				expect( consoleErrorMock ).toHaveBeenCalledTimes( 2 );
				expect( consoleErrorMock ).toHaveBeenNthCalledWith( 1,
					'\n❌ Following packages include dependencies where finding copyright message failed. Please add an override:\n'
				);
				expect( consoleErrorMock ).toHaveBeenNthCalledWith( 2, [
					'project-root-package:',
					' - helperUtilTool',
					''
				].join( '\n' ) );
			} );

			it( 'license file is empty', async () => {
				options.shouldProcessRoot = true;
				fileContentMap[ 'root/dir/LICENSE.md' ] = '';

				const exitCode = await validateLicenseFiles( options );

				expect( exitCode ).toEqual( 1 );

				expect( consoleInfoMock ).toHaveBeenCalledTimes( 2 );
				expect( consoleInfoMock ).toHaveBeenNthCalledWith( 1, 'Validating licenses in following packages:' );
				expect( consoleInfoMock ).toHaveBeenNthCalledWith( 2, ' - project-root-package' );
				expect( consoleErrorMock ).toHaveBeenCalledTimes( 2 );
				expect( consoleErrorMock ).toHaveBeenNthCalledWith( 1, [
					'\nFailed to detect license section in following files.',
					'Please add an `Sources of Intellectual Property Included in ...` section to them:'
				].join( ' ' ) );
				expect( consoleErrorMock ).toHaveBeenNthCalledWith( 2, ' - root/dir/LICENSE.md' );
			} );

			it( 'license file in private repo has the public repo author disclaimer', async () => {
				options.shouldProcessRoot = true;
				fileContentMap[ 'root/dir/LICENSE.md' ] = getLicense( 'long' );

				const exitCode = await validateLicenseFiles( options );

				expect( exitCode ).toEqual( 1 );

				expect( consoleInfoMock ).toHaveBeenCalledTimes( 2 );
				expect( consoleInfoMock ).toHaveBeenNthCalledWith( 1, 'Validating licenses in following packages:' );
				expect( consoleInfoMock ).toHaveBeenNthCalledWith( 2, ' - project-root-package' );
				expect( consoleErrorMock ).toHaveBeenCalledTimes( 2 );
				expect( consoleErrorMock ).toHaveBeenNthCalledWith( 1,
					'\nFollowing license files are not up to date. Please run this script with `--fix` option and review the changes.'
				);
				expect( consoleErrorMock ).toHaveBeenNthCalledWith( 2, ' - root/dir/LICENSE.md' );
			} );

			it( 'license file in public repo has the private repo author disclaimer', async () => {
				options.isPublic = true;
				options.shouldProcessRoot = true;
				fileContentMap[ 'root/dir/LICENSE.md' ] = getLicense( 'short' );

				const exitCode = await validateLicenseFiles( options );

				expect( exitCode ).toEqual( 1 );

				expect( consoleInfoMock ).toHaveBeenCalledTimes( 2 );
				expect( consoleInfoMock ).toHaveBeenNthCalledWith( 1, 'Validating licenses in following packages:' );
				expect( consoleInfoMock ).toHaveBeenNthCalledWith( 2, ' - project-root-package' );
				expect( consoleErrorMock ).toHaveBeenCalledTimes( 2 );
				expect( consoleErrorMock ).toHaveBeenNthCalledWith( 1,
					'\nFollowing license files are not up to date. Please run this script with `--fix` option and review the changes.'
				);
				expect( consoleErrorMock ).toHaveBeenNthCalledWith( 2, ' - root/dir/LICENSE.md' );
			} );

			it( 'license file is missing copyright information', async () => {
				options.shouldProcessRoot = true;
				fileContentMap[ 'root/dir/package.json' ] = JSON.stringify( {
					name: 'project-root-package',
					dependencies: {
						helperUtilTool: '^12.34.56'
					}
				} );

				const exitCode = await validateLicenseFiles( options );

				expect( exitCode ).toEqual( 1 );

				expect( consoleInfoMock ).toHaveBeenCalledTimes( 2 );
				expect( consoleInfoMock ).toHaveBeenNthCalledWith( 1, 'Validating licenses in following packages:' );
				expect( consoleInfoMock ).toHaveBeenNthCalledWith( 2, ' - project-root-package' );
				expect( consoleErrorMock ).toHaveBeenCalledTimes( 2 );
				expect( consoleErrorMock ).toHaveBeenNthCalledWith( 1,
					'\nFollowing license files are not up to date. Please run this script with `--fix` option and review the changes.'
				);
				expect( consoleErrorMock ).toHaveBeenNthCalledWith( 2, ' - root/dir/LICENSE.md' );
			} );

			it( 'license is missing additional dependency added via overrides', async () => {
				options.shouldProcessRoot = true;
				options.copyrightOverrides = [ {
					packageName: 'project-root-package',
					dependencies: [ {
						license: 'MIT',
						name: 'hidden-helper',
						copyright: 'Copyright (c) 2025 the Sneaky Dev.'
					} ]
				} ];
				fileContentMap[ 'root/dir/package.json' ] = JSON.stringify( {
					name: 'project-root-package',
					dependencies: {
						helperUtilTool: '^12.34.56'
					}
				} );
				fileContentMap[ 'root/dir/LICENSE.md' ] = getLicense( 'short', [
					'',
					'The following libraries are included in TestProject™ under the [MIT license](https://opensource.org/licenses/MIT):',
					'',
					'* helperUtilTool - Copyright (C) 1970-2070 the Best Dev.'
				] );

				const exitCode = await validateLicenseFiles( options );

				expect( exitCode ).toEqual( 1 );

				expect( consoleInfoMock ).toHaveBeenCalledTimes( 2 );
				expect( consoleInfoMock ).toHaveBeenNthCalledWith( 1, 'Validating licenses in following packages:' );
				expect( consoleInfoMock ).toHaveBeenNthCalledWith( 2, ' - project-root-package' );
				expect( consoleErrorMock ).toHaveBeenCalledTimes( 2 );
				expect( consoleErrorMock ).toHaveBeenNthCalledWith( 1,
					'\nFollowing license files are not up to date. Please run this script with `--fix` option and review the changes.'
				);
				expect( consoleErrorMock ).toHaveBeenNthCalledWith( 2, ' - root/dir/LICENSE.md' );
			} );

			it( 'invalid license in one of the packages directory', async () => {
				options.shouldProcessPackages = true;

				fileContentMap[ 'root/dir/packages/package-a/package.json' ] = JSON.stringify( {
					name: 'package-a',
					dependencies: {
						helperUtilTool: '^12.34.56'
					}
				} );
				fileContentMap[ 'root/dir/packages/package-b/package.json' ] = JSON.stringify( {
					name: 'package-b',
					dependencies: {
						helperManagerFactory: '^7.8.9'
					}
				} );
				fileContentMap[ 'root/dir/packages/package-a/LICENSE.md' ] = getLicense( 'short', [
					'',
					'The following libraries are included in TestProject™ under the [MIT license](https://opensource.org/licenses/MIT):',
					'',
					'* helperUtilTool - Copyright (C) 1970-2070 the Best Dev.'
				] );

				const exitCode = await validateLicenseFiles( options );

				expect( exitCode ).toEqual( 1 );

				expect( consoleInfoMock ).toHaveBeenCalledTimes( 2 );
				expect( consoleInfoMock ).toHaveBeenNthCalledWith( 1, 'Validating licenses in following packages:' );
				expect( consoleInfoMock ).toHaveBeenNthCalledWith( 2, [
					' - package-a',
					' - package-b'
				].join( '\n' ) );
				expect( consoleErrorMock ).toHaveBeenCalledTimes( 2 );
				expect( consoleErrorMock ).toHaveBeenNthCalledWith( 1,
					'\nFollowing license files are not up to date. Please run this script with `--fix` option and review the changes.'
				);
				expect( consoleErrorMock ).toHaveBeenNthCalledWith( 2, ' - root/dir/packages/package-b/LICENSE.md' );
			} );

			it( 'multiple invalid licenses in repository with root main package and packages directory', async () => {
				options.mainPackageName = 'project-root-package';
				options.shouldProcessRoot = true;
				options.shouldProcessPackages = true;
				options.copyrightOverrides = [ {
					packageName: 'project-root-package',
					dependencies: [ {
						license: 'MIT',
						name: 'hidden-helper',
						copyright: 'Copyright (c) 2025 the Sneaky Dev.'
					} ]
				} ];

				fileContentMap[ 'root/dir/package.json' ] = JSON.stringify( {
					name: 'project-root-package',
					dependencies: {
						helperUtilTool: '^12.34.56'
					}
				} );
				fileContentMap[ 'root/dir/packages/package-a/package.json' ] = JSON.stringify( {
					name: 'package-a',
					dependencies: {
						helperUtilTool: '^12.34.56'
					}
				} );
				fileContentMap[ 'root/dir/packages/package-b/package.json' ] = JSON.stringify( {
					name: 'package-b',
					dependencies: {
						helperManagerFactory: '^7.8.9'
					}
				} );

				const exitCode = await validateLicenseFiles( options );

				expect( exitCode ).toEqual( 1 );

				expect( consoleInfoMock ).toHaveBeenCalledTimes( 2 );
				expect( consoleInfoMock ).toHaveBeenNthCalledWith( 1, 'Validating licenses in following packages:' );
				expect( consoleInfoMock ).toHaveBeenNthCalledWith( 2, [
					' - project-root-package',
					' - package-a',
					' - package-b'
				].join( '\n' ) );
				expect( consoleErrorMock ).toHaveBeenCalledTimes( 2 );
				expect( consoleErrorMock ).toHaveBeenNthCalledWith( 1,
					'\nFollowing license files are not up to date. Please run this script with `--fix` option and review the changes.'
				);
				expect( consoleErrorMock ).toHaveBeenNthCalledWith( 2, [
					' - root/dir/LICENSE.md',
					' - root/dir/packages/package-a/LICENSE.md',
					' - root/dir/packages/package-b/LICENSE.md'
				].join( '\n' ) );
			} );
		} );

		describe( 'fixing mode', () => {
			beforeEach( () => {
				options.fix = true;
			} );

			it( 'license file in private repo has the public repo author disclaimer', async () => {
				options.shouldProcessRoot = true;
				fileContentMap[ 'root/dir/LICENSE.md' ] = getLicense( 'long' );

				const exitCode = await validateLicenseFiles( options );

				expect( exitCode ).toEqual( 0 );

				expect( consoleInfoMock ).toHaveBeenCalledTimes( 5 );
				expect( consoleInfoMock ).toHaveBeenNthCalledWith( 1, 'Validating licenses in following packages:' );
				expect( consoleInfoMock ).toHaveBeenNthCalledWith( 2, ' - project-root-package' );
				expect( consoleInfoMock ).toHaveBeenNthCalledWith( 3, '\nUpdated the following license files:' );
				expect( consoleInfoMock ).toHaveBeenNthCalledWith( 4, ' - root/dir/LICENSE.md' );
				expect( consoleInfoMock ).toHaveBeenNthCalledWith( 5, '\nValidation complete.' );
				expect( consoleErrorMock ).toHaveBeenCalledTimes( 0 );

				const expectedLicense = getLicense( 'short' );

				expect( writeFile ).toHaveBeenCalledTimes( 1 );
				expect( writeFile ).toHaveBeenNthCalledWith( 1, 'root/dir/LICENSE.md', expectedLicense, 'utf-8' );
			} );

			it( 'license file in public repo has the private repo author disclaimer', async () => {
				options.isPublic = true;
				options.shouldProcessRoot = true;
				fileContentMap[ 'root/dir/LICENSE.md' ] = getLicense( 'short' );

				const exitCode = await validateLicenseFiles( options );

				expect( exitCode ).toEqual( 0 );

				expect( consoleInfoMock ).toHaveBeenCalledTimes( 5 );
				expect( consoleInfoMock ).toHaveBeenNthCalledWith( 1, 'Validating licenses in following packages:' );
				expect( consoleInfoMock ).toHaveBeenNthCalledWith( 2, ' - project-root-package' );
				expect( consoleInfoMock ).toHaveBeenNthCalledWith( 3, '\nUpdated the following license files:' );
				expect( consoleInfoMock ).toHaveBeenNthCalledWith( 4, ' - root/dir/LICENSE.md' );
				expect( consoleInfoMock ).toHaveBeenNthCalledWith( 5, '\nValidation complete.' );
				expect( consoleErrorMock ).toHaveBeenCalledTimes( 0 );

				const expectedLicense = getLicense( 'long' );

				expect( writeFile ).toHaveBeenCalledTimes( 1 );
				expect( writeFile ).toHaveBeenNthCalledWith( 1, 'root/dir/LICENSE.md', expectedLicense, 'utf-8' );
			} );

			it( 'license file is missing copyright information', async () => {
				options.shouldProcessRoot = true;
				fileContentMap[ 'root/dir/package.json' ] = JSON.stringify( {
					name: 'project-root-package',
					dependencies: {
						helperUtilTool: '^12.34.56'
					}
				} );

				const exitCode = await validateLicenseFiles( options );

				expect( exitCode ).toEqual( 0 );

				expect( consoleInfoMock ).toHaveBeenCalledTimes( 5 );
				expect( consoleInfoMock ).toHaveBeenNthCalledWith( 1, 'Validating licenses in following packages:' );
				expect( consoleInfoMock ).toHaveBeenNthCalledWith( 2, ' - project-root-package' );
				expect( consoleInfoMock ).toHaveBeenNthCalledWith( 3, '\nUpdated the following license files:' );
				expect( consoleInfoMock ).toHaveBeenNthCalledWith( 4, ' - root/dir/LICENSE.md' );
				expect( consoleInfoMock ).toHaveBeenNthCalledWith( 5, '\nValidation complete.' );
				expect( consoleErrorMock ).toHaveBeenCalledTimes( 0 );

				const expectedLicense = getLicense( 'short', [
					'',
					'The following libraries are included in TestProject™ under the [MIT license](https://opensource.org/licenses/MIT):',
					'',
					'* helperUtilTool - Copyright (C) 1970-2070 the Best Dev.'
				] );

				expect( writeFile ).toHaveBeenCalledTimes( 1 );
				expect( writeFile ).toHaveBeenNthCalledWith( 1, 'root/dir/LICENSE.md', expectedLicense, 'utf-8' );
			} );

			it( 'license is missing additional dependency added via overrides', async () => {
				options.shouldProcessRoot = true;
				options.copyrightOverrides = [ {
					packageName: 'project-root-package',
					dependencies: [ {
						license: 'MIT',
						name: 'hidden-helper',
						copyright: 'Copyright (c) 2025 the Sneaky Dev.'
					} ]
				} ];
				fileContentMap[ 'root/dir/package.json' ] = JSON.stringify( {
					name: 'project-root-package',
					dependencies: {
						helperUtilTool: '^12.34.56'
					}
				} );
				fileContentMap[ 'root/dir/LICENSE.md' ] = getLicense( 'short', [
					'',
					'The following libraries are included in TestProject™ under the [MIT license](https://opensource.org/licenses/MIT):',
					'',
					'* helperUtilTool - Copyright (C) 1970-2070 the Best Dev.'
				] );

				const exitCode = await validateLicenseFiles( options );

				expect( exitCode ).toEqual( 0 );

				expect( consoleInfoMock ).toHaveBeenCalledTimes( 5 );
				expect( consoleInfoMock ).toHaveBeenNthCalledWith( 1, 'Validating licenses in following packages:' );
				expect( consoleInfoMock ).toHaveBeenNthCalledWith( 2, ' - project-root-package' );
				expect( consoleInfoMock ).toHaveBeenNthCalledWith( 3, '\nUpdated the following license files:' );
				expect( consoleInfoMock ).toHaveBeenNthCalledWith( 4, ' - root/dir/LICENSE.md' );
				expect( consoleInfoMock ).toHaveBeenNthCalledWith( 5, '\nValidation complete.' );
				expect( consoleErrorMock ).toHaveBeenCalledTimes( 0 );

				const expectedLicense = getLicense( 'short', [
					'',
					'The following libraries are included in TestProject™ under the [MIT license](https://opensource.org/licenses/MIT):',
					'',
					'* helperUtilTool - Copyright (C) 1970-2070 the Best Dev.',
					'* hidden-helper - Copyright (c) 2025 the Sneaky Dev.'
				] );

				expect( writeFile ).toHaveBeenCalledTimes( 1 );
				expect( writeFile ).toHaveBeenNthCalledWith( 1, 'root/dir/LICENSE.md', expectedLicense, 'utf-8' );
			} );

			it( 'invalid license in one of the packages directory', async () => {
				options.shouldProcessPackages = true;

				fileContentMap[ 'root/dir/packages/package-a/package.json' ] = JSON.stringify( {
					name: 'package-a',
					dependencies: {
						helperUtilTool: '^12.34.56'
					}
				} );
				fileContentMap[ 'root/dir/packages/package-b/package.json' ] = JSON.stringify( {
					name: 'package-b',
					dependencies: {
						helperManagerFactory: '^7.8.9'
					}
				} );
				fileContentMap[ 'root/dir/packages/package-a/LICENSE.md' ] = getLicense( 'short', [
					'',
					'The following libraries are included in TestProject™ under the [MIT license](https://opensource.org/licenses/MIT):',
					'',
					'* helperUtilTool - Copyright (C) 1970-2070 the Best Dev.'
				] );

				const exitCode = await validateLicenseFiles( options );

				expect( exitCode ).toEqual( 0 );

				expect( consoleInfoMock ).toHaveBeenCalledTimes( 5 );
				expect( consoleInfoMock ).toHaveBeenNthCalledWith( 1, 'Validating licenses in following packages:' );
				expect( consoleInfoMock ).toHaveBeenNthCalledWith( 2, [
					' - package-a',
					' - package-b'
				].join( '\n' ) );
				expect( consoleInfoMock ).toHaveBeenNthCalledWith( 3, '\nUpdated the following license files:' );
				expect( consoleInfoMock ).toHaveBeenNthCalledWith( 4, ' - root/dir/packages/package-b/LICENSE.md' );
				expect( consoleInfoMock ).toHaveBeenNthCalledWith( 5, '\nValidation complete.' );
				expect( consoleErrorMock ).toHaveBeenCalledTimes( 0 );

				const expectedLicense = getLicense( 'short', [
					'',
					'The following libraries are included in TestProject™ under the [BSD-3-Clause license](https://opensource.org/licenses/BSD-3-Clause):',
					'',
					'* helperManagerFactory - Copyright (c) 2019 Joe Shmo.'
				] );

				expect( writeFile ).toHaveBeenCalledTimes( 1 );
				expect( writeFile ).toHaveBeenNthCalledWith( 1, 'root/dir/packages/package-b/LICENSE.md', expectedLicense, 'utf-8' );
			} );

			it( 'multiple invalid licenses in repository with root main package and packages directory', async () => {
				options.mainPackageName = 'project-root-package';
				options.shouldProcessRoot = true;
				options.shouldProcessPackages = true;
				options.copyrightOverrides = [ {
					packageName: 'project-root-package',
					dependencies: [ {
						license: 'MIT',
						name: 'hidden-helper',
						copyright: 'Copyright (c) 2025 the Sneaky Dev.'
					} ]
				} ];

				fileContentMap[ 'root/dir/package.json' ] = JSON.stringify( {
					name: 'project-root-package',
					dependencies: {
						helperUtilTool: '^12.34.56'
					}
				} );
				fileContentMap[ 'root/dir/packages/package-a/package.json' ] = JSON.stringify( {
					name: 'package-a',
					dependencies: {
						helperUtilTool: '^12.34.56'
					}
				} );
				fileContentMap[ 'root/dir/packages/package-b/package.json' ] = JSON.stringify( {
					name: 'package-b',
					dependencies: {
						helperManagerFactory: '^7.8.9'
					}
				} );

				const exitCode = await validateLicenseFiles( options );

				expect( exitCode ).toEqual( 0 );

				expect( consoleInfoMock ).toHaveBeenCalledTimes( 5 );
				expect( consoleInfoMock ).toHaveBeenNthCalledWith( 1, 'Validating licenses in following packages:' );
				expect( consoleInfoMock ).toHaveBeenNthCalledWith( 2, [
					' - project-root-package',
					' - package-a',
					' - package-b'
				].join( '\n' ) );
				expect( consoleInfoMock ).toHaveBeenNthCalledWith( 3, '\nUpdated the following license files:' );
				expect( consoleInfoMock ).toHaveBeenNthCalledWith( 4, [
					' - root/dir/LICENSE.md',
					' - root/dir/packages/package-a/LICENSE.md',
					' - root/dir/packages/package-b/LICENSE.md'
				].join( '\n' ) );
				expect( consoleInfoMock ).toHaveBeenNthCalledWith( 5, '\nValidation complete.' );
				expect( consoleErrorMock ).toHaveBeenCalledTimes( 0 );

				const expectedLicense1 = getLicense( 'short', [
					'',
					'The following libraries are included in TestProject™ under the [BSD-3-Clause license](https://opensource.org/licenses/BSD-3-Clause):',
					'',
					'* helperManagerFactory - Copyright (c) 2019 Joe Shmo.',
					'',
					'The following libraries are included in TestProject™ under the [MIT license](https://opensource.org/licenses/MIT):',
					'',
					'* helperUtilTool - Copyright (C) 1970-2070 the Best Dev.',
					'* hidden-helper - Copyright (c) 2025 the Sneaky Dev.'
				] );
				const expectedLicense2 = getLicense( 'short', [
					'',
					'The following libraries are included in TestProject™ under the [MIT license](https://opensource.org/licenses/MIT):',
					'',
					'* helperUtilTool - Copyright (C) 1970-2070 the Best Dev.'
				] );
				const expectedLicense3 = getLicense( 'short', [
					'',
					'The following libraries are included in TestProject™ under the [BSD-3-Clause license](https://opensource.org/licenses/BSD-3-Clause):',
					'',
					'* helperManagerFactory - Copyright (c) 2019 Joe Shmo.'
				] );

				expect( writeFile ).toHaveBeenCalledTimes( 3 );
				expect( writeFile ).toHaveBeenNthCalledWith( 1, 'root/dir/LICENSE.md', expectedLicense1, 'utf-8' );
				expect( writeFile ).toHaveBeenNthCalledWith( 2, 'root/dir/packages/package-a/LICENSE.md', expectedLicense2, 'utf-8' );
				expect( writeFile ).toHaveBeenNthCalledWith( 3, 'root/dir/packages/package-b/LICENSE.md', expectedLicense3, 'utf-8' );
			} );
		} );
	} );
} );

function getLicense( type: 'short' | 'long', licenseLines?: Array<string> ) {
	const shortAuthorDisclaimer = [
		'Where not otherwise indicated, all TestProject™ content is authored',
		'by CKSource engineers and consists of CKSource-owned intellectual property.'
	].join( ' ' );

	const longAuthorDisclaimer = [
		'Where not otherwise indicated, all TestProject™ content is authored',
		'by CKSource engineers and consists of CKSource-owned intellectual property.',
		'In some specific instances, TestProject™ will incorporate work done by',
		'developers outside of CKSource with their express permission.'
	].join( ' ' );

	return [
		'Software License Agreement',
		'==========================',
		'',
		'Copyright (c) 2003-2025, [CKSource](http://cksource.com) Holding sp. z o.o. All rights reserved.',
		'',
		'Sources of Intellectual Property Included in TestProject™',
		'---------------------------------------------------------',
		'',
		type === 'short' ? shortAuthorDisclaimer : longAuthorDisclaimer,
		...licenseLines || [],
		'',
		'Trademarks',
		'----------',
		'',
		'**TestProject** is a trademark of [CKSource](http://cksource.com) Holding sp. z o.o.',
		''
	].filter( item => typeof item === 'string' ).join( '\n' );
}
