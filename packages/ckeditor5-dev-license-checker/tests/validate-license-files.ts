/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { vi, describe, it, beforeEach, afterEach, expect, type MockInstance } from 'vitest';
import { validateLicenseFiles } from '../src/validate-license-files.js';
import { glob, readFile, writeFile } from 'fs/promises';

vi.mock( 'fs/promises' );

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

		vi.mocked( readFile ).mockImplementation( async path => fileContentMap[ path as string ]! );
		vi.mocked( writeFile ).mockImplementation( async () => {} );
		vi.mocked( glob ).mockImplementation( async function* ( path ): AsyncGenerator<string> {
			const pathPrefix = ( path as string ).replace( /\/\*$/, '' );
			const matchingFilePaths = Object
				.keys( fileContentMap )
				.filter( filePath => filePath.startsWith( pathPrefix ) );

			for ( const matchingFilePath of matchingFilePaths ) {
				yield matchingFilePath;
			}
		} );

		fileContentMap = {
			'root/dir/package.json': JSON.stringify( { name: 'project-root-package' } ),
			'root/dir/LICENSE.md': getLicense( 'short' ),
			'root/dir/node_modules/helperUtilTool/package.json': JSON.stringify( { license: 'MIT' } ),
			'root/dir/node_modules/helperUtilTool/LICENSE.md': 'Copyright (C) 1970-2070 the Best Dev',

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

	it( 'should fail if no files for processing were specified', async () => {
		const exitCode = await validateLicenseFiles( options );

		expect( consoleInfoMock ).toHaveBeenCalledTimes( 0 );
		expect( consoleErrorMock ).toHaveBeenCalledTimes( 1 );
		expect( consoleErrorMock ).toHaveBeenCalledWith( 'You have to set at least one of: `processRoot` or `processPackages`.' );

		expect( exitCode ).toEqual( 1 );
	} );

	it( 'should fail if license file is missing', async () => {
		options.processRoot = true;
		delete fileContentMap[ 'root/dir/LICENSE.md' ];

		const exitCode = await validateLicenseFiles( options );

		expect( consoleInfoMock ).toHaveBeenCalledTimes( 2 );
		expect( consoleInfoMock ).toHaveBeenNthCalledWith( 1, 'Validating licenses in following packages:' );
		expect( consoleInfoMock ).toHaveBeenNthCalledWith( 2, ' - project-root-package' );
		expect( consoleErrorMock ).toHaveBeenCalledTimes( 2 );
		expect( consoleErrorMock ).toHaveBeenNthCalledWith( 1, '\nFollowing license files are missing. Please create them:' );
		expect( consoleErrorMock ).toHaveBeenNthCalledWith( 2, ' - root/dir/LICENSE.md' );

		expect( exitCode ).toEqual( 1 );
	} );

	it( 'should fail if license file is empty', async () => {
		options.processRoot = true;
		fileContentMap[ 'root/dir/LICENSE.md' ] = '';

		const exitCode = await validateLicenseFiles( options );

		expect( consoleInfoMock ).toHaveBeenCalledTimes( 2 );
		expect( consoleInfoMock ).toHaveBeenNthCalledWith( 1, 'Validating licenses in following packages:' );
		expect( consoleInfoMock ).toHaveBeenNthCalledWith( 2, ' - project-root-package' );
		expect( consoleErrorMock ).toHaveBeenCalledTimes( 2 );
		expect( consoleErrorMock ).toHaveBeenNthCalledWith( 1, [
			'\nFailed to detect license section in following files.',
			'Please add an `Sources of Intellectual Property Included in ...` section to them:'
		].join( ' ' ) );
		expect( consoleErrorMock ).toHaveBeenNthCalledWith( 2, ' - root/dir/LICENSE.md' );

		expect( exitCode ).toEqual( 1 );
	} );

	it( 'should fail if license file has wrong author disclaimer', async () => {
		options.processRoot = true;
		fileContentMap[ 'root/dir/LICENSE.md' ] = getLicense( 'long' );

		const exitCode = await validateLicenseFiles( options );

		expect( consoleInfoMock ).toHaveBeenCalledTimes( 2 );
		expect( consoleInfoMock ).toHaveBeenNthCalledWith( 1, 'Validating licenses in following packages:' );
		expect( consoleInfoMock ).toHaveBeenNthCalledWith( 2, ' - project-root-package' );
		expect( consoleErrorMock ).toHaveBeenCalledTimes( 2 );
		expect( consoleErrorMock ).toHaveBeenNthCalledWith( 1,
			'\nFollowing license files are not up to date. Please run this script with `--fix` option and review the changes.'
		);
		expect( consoleErrorMock ).toHaveBeenNthCalledWith( 2, ' - root/dir/LICENSE.md' );

		expect( exitCode ).toEqual( 1 );
	} );

	it( 'should fail if license is missing copyright information', async () => {
		options.processRoot = true;
		fileContentMap[ 'root/dir/package.json' ] = JSON.stringify( {
			name: 'project-root-package',
			dependencies: {
				helperUtilTool: '^12.34.56'
			}
		} );

		const exitCode = await validateLicenseFiles( options );

		expect( consoleInfoMock ).toHaveBeenCalledTimes( 2 );
		expect( consoleInfoMock ).toHaveBeenNthCalledWith( 1, 'Validating licenses in following packages:' );
		expect( consoleInfoMock ).toHaveBeenNthCalledWith( 2, ' - project-root-package' );
		expect( consoleErrorMock ).toHaveBeenCalledTimes( 2 );
		expect( consoleErrorMock ).toHaveBeenNthCalledWith( 1,
			'\nFollowing license files are not up to date. Please run this script with `--fix` option and review the changes.'
		);
		expect( consoleErrorMock ).toHaveBeenNthCalledWith( 2, ' - root/dir/LICENSE.md' );

		expect( exitCode ).toEqual( 1 );
	} );

	it( 'should pass if license structured properly', async () => {
		options.processRoot = true;
		fileContentMap[ 'root/dir/package.json' ] = JSON.stringify( {
			name: 'project-root-package',
			dependencies: {
				helperUtilTool: '^12.34.56'
			}
		} );
		fileContentMap[ 'root/dir/LICENSE.md' ] = getLicense( 'short', [
			'',
			'The following libraries are included in TestProject™ under the [MIT license](https://opensource.org/licenses/MIT):', '',
			'* helperUtilTool - Copyright (C) 1970-2070 the Best Dev.'
		] );

		const exitCode = await validateLicenseFiles( options );

		expect( consoleInfoMock ).toHaveBeenCalledTimes( 3 );
		expect( consoleInfoMock ).toHaveBeenNthCalledWith( 1, 'Validating licenses in following packages:' );
		expect( consoleInfoMock ).toHaveBeenNthCalledWith( 2, ' - project-root-package' );
		expect( consoleInfoMock ).toHaveBeenNthCalledWith( 3, '\nValidation complete.' );
		expect( consoleErrorMock ).toHaveBeenCalledTimes( 0 );

		expect( exitCode ).toEqual( 0 );
	} );

	describe( 'fix', () => {
		beforeEach( () => {
			options.fix = true;
		} );

		it( 'foo', async () => {

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
