/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';
import fs from 'fs-extra';
import { tools, logger } from '@ckeditor/ckeditor5-dev-utils';
import parseArguments from '../../../lib/utils/automated-tests/parsearguments.js';

vi.mock( 'path', () => ( {
	default: {
		join: vi.fn( ( ...chunks ) => chunks.join( '/' ) ),
		dirname: vi.fn()
	}
} ) );
vi.mock( 'fs-extra' );
vi.mock( '@ckeditor/ckeditor5-dev-utils' );

describe( 'parseArguments()', () => {
	let logWarningStub;

	beforeEach( () => {
		logWarningStub = vi.fn();

		vi.spyOn( process, 'cwd' ).mockReturnValue( '/home/project' );
		vi.mocked( logger ).mockReturnValue( {
			warning: logWarningStub
		} );
	} );

	it( 'replaces kebab-case strings with camelCase values', () => {
		vi.mocked( fs ).readJsonSync.mockReturnValue( {} );

		const options = parseArguments( [
			'--source-map',
			'true',
			'--identity-file',
			'/home/.secret/file.key',
			'--theme-path',
			'/path/to/theme/package',
			'--additional-languages',
			'de,fr',
			'--resolve-js-first'
		] );

		expect( options[ 'source-map' ] ).to.be.undefined;
		expect( options[ 'identity-file' ] ).to.be.undefined;
		expect( options[ 'theme-path' ] ).to.be.undefined;
		expect( options[ 'additional-languages' ] ).to.be.undefined;
		expect( options[ 'resolve-js-first' ] ).to.be.undefined;

		expect( options.sourceMap ).to.equal( true );
		expect( options.identityFile ).to.equal( '/home/.secret/file.key' );
		expect( options.themePath ).to.equal( '/path/to/theme/package' );
		expect( options.additionalLanguages ).to.deep.equal( [ 'de', 'fr' ] );
		expect( options.resolveJsFirst ).to.equal( true );
	} );

	it( 'deletes all aliases keys from returned object', () => {
		vi.mocked( fs ).readJsonSync.mockReturnValue( {} );

		const options = parseArguments( [
			'-b',
			'Chrome,Firefox',
			'-c',
			'true',
			'-d',
			'engine',
			'-f',
			'core',
			'-i',
			'/home/.secret/file.key',
			'-r',
			'custom-monorepo',
			'-s',
			'true',
			'-v',
			'false',
			'-w',
			true
		] );

		for ( const key of [ 'b', 'c', 'd', 'f', 'i', 'r', 's', 'v', 'w' ] ) {
			expect( options[ key ], `Checked "${ key }"` ).to.be.undefined;
		}

		expect( options.coverage ).to.equal( true );
		expect( options.verbose ).to.equal( false );
		expect( options.browsers ).to.deep.equal( [ 'Chrome', 'Firefox' ] );
		expect( options.debug ).to.deep.equal( [ 'CK_DEBUG', 'CK_DEBUG_ENGINE' ] );
		expect( options.files ).to.deep.equal( [ 'core' ] );
		expect( options.repositories ).to.deep.equal( [ 'custom-monorepo' ] );
		expect( options.sourceMap ).to.equal( true );
		expect( options.identityFile ).to.equal( '/home/.secret/file.key' );
	} );

	describe( 'files', () => {
		it( 'returns an empty array when the --files option was not specified', () => {
			const options = parseArguments( [] );

			expect( options.files ).to.deep.equal( [] );
		} );

		it( 'returns an array values specified as --files', () => {
			const options = parseArguments( [
				'--files',
				'core,engine'
			] );

			expect( options.files ).to.deep.equal( [ 'core', 'engine' ] );
		} );
	} );

	describe( 'debug', () => {
		it( 'should enable debug options by default', () => {
			const options = parseArguments( [] );

			expect( options.debug ).to.deep.equal( [ 'CK_DEBUG' ] );
		} );

		it( 'allows specifying additional debug flags', () => {
			const options = parseArguments( [
				'--debug',
				'engine,ui'
			] );

			expect( options.debug ).to.deep.equal( [ 'CK_DEBUG', 'CK_DEBUG_ENGINE', 'CK_DEBUG_UI' ] );
		} );

		it( 'allows disabling debug option (--debug false)', () => {
			const options = parseArguments( [
				'--debug',
				'false'
			] );

			expect( options.debug ).to.deep.equal( [] );
		} );

		it( 'allows disabling debug option (--no-debug)', () => {
			const options = parseArguments( [
				'--no-debug'
			] );

			expect( options.debug ).to.deep.equal( [] );
		} );
	} );

	describe( 'repositories', () => {
		it( 'returns an empty array when the --repositories option was not specified', () => {
			const options = parseArguments( [] );

			expect( options.repositories ).to.deep.equal( [] );
		} );

		it( 'returns an array of packages to tests when `--repositories` is specified (root directory check)', () => {
			vi.mocked( fs ).readJsonSync.mockReturnValue( { name: 'ckeditor5' } );
			vi.mocked( fs ).statSync.mockImplementation( input => {
				if ( input === '/home/project/external' ) {
					throw new Error( 'ENOENT: no such file or directory' );
				}
			} );
			vi.mocked( tools ).getDirectories.mockImplementation( input => {
				if ( input === '/home/project/packages' ) {
					return [
						'ckeditor5-core',
						'ckeditor5-engine'
					];
				}
			} );

			const options = parseArguments( [
				'--repositories',
				'ckeditor5'
			] );

			expect( options.files ).to.deep.equal( [ 'core', 'engine' ] );

			expect( logWarningStub ).toHaveBeenCalledExactlyOnceWith(
				'The `external/` directory does not exist. Only the root repository will be checked.'
			);
		} );

		it( 'returns an array of packages to tests when `--repositories` is specified (external directory check)', () => {
			vi.mocked( fs ).readJsonSync.mockReturnValue( { name: 'foo' } );
			vi.mocked( fs ).statSync.mockReturnValue( { isDirectory: () => true } );
			vi.mocked( tools ).getDirectories.mockImplementation( input => {
				if ( input === '/home/project/external/ckeditor5/packages' ) {
					return [
						'ckeditor5-core',
						'ckeditor5-engine'
					];
				}
			} );

			const options = parseArguments( [
				'--repositories',
				'ckeditor5'
			] );

			expect( options.files ).to.deep.equal( [ 'core', 'engine' ] );
			expect( logWarningStub ).not.toHaveBeenCalled();
		} );

		it(
			'returns an array of packages to tests when `--repositories` is specified ' +
			'(external directory check, specified repository does not exist)',
			() => {
				vi.mocked( fs ).readJsonSync.mockReturnValue( { name: 'foo' } );
				vi.mocked( fs ).statSync.mockImplementation( input => {
					if ( input === '/home/project/external' ) {
						return { isDirectory: () => true };
					}

					throw new Error( 'ENOENT: no such file or directory' );
				} );

				const options = parseArguments( [
					'--repositories',
					'ckeditor5'
				] );

				expect( options.files ).to.deep.equal( [] );
				expect( logWarningStub ).toHaveBeenCalledExactlyOnceWith(
					'Did not find the repository "ckeditor5" in the root repository or the "external/" directory.'
				);
			}
		);

		it(
			'returns an array of packages (unique list) to tests when `--repositories` is specified ' +
			'(root directory check + `--files` specified)',
			() => {
				vi.mocked( fs ).readJsonSync.mockReturnValue( { name: 'ckeditor5' } );
				vi.mocked( fs ).statSync.mockImplementation( input => {
					if ( input === '/home/project/external' ) {
						return { isDirectory: () => true };
					}

					throw new Error( 'ENOENT: no such file or directory' );
				} );
				vi.mocked( tools ).getDirectories.mockImplementation( input => {
					if ( input === '/home/project/packages' ) {
						return [
							'ckeditor5-core',
							'ckeditor5-engine',
							'ckeditor5-utils'
						];
					}
				} );

				const options = parseArguments( [
					'--repositories',
					'ckeditor5',
					'--files',
					'core'
				] );

				expect( options.files ).to.deep.equal( [ 'core', 'engine', 'utils' ] );
			}
		);

		it(
			'returns an array of packages to tests when `--repositories` is specified ' +
			'(root and external directories check)',
			() => {
				vi.mocked( fs ).readJsonSync.mockReturnValue( { name: 'ckeditor5' } );
				vi.mocked( fs ).statSync.mockReturnValue( { isDirectory: () => true } );
				vi.mocked( tools ).getDirectories.mockImplementation( input => {
					if ( input === '/home/project/packages' ) {
						return [
							'ckeditor5-core',
							'ckeditor5-engine'
						];
					}
					if ( input === '/home/project/external/foo/packages' ) {
						return [
							'ckeditor5-foo-1',
							'ckeditor5-foo-2'
						];
					}
					if ( input === '/home/project/external/bar/packages' ) {
						return [
							'ckeditor5-bar-1',
							'ckeditor5-bar-2'
						];
					}
				} );

				const options = parseArguments( [
					'--repositories',
					'ckeditor5,foo,bar'
				] );

				expect( options.files ).to.deep.equal( [ 'core', 'engine', 'foo-1', 'foo-2', 'bar-1', 'bar-2' ] );
			}
		);
	} );

	describe( 'DLLs', () => {
		it( 'should set default value if no `--dll` flag is set', () => {
			const options = parseArguments( [] );

			expect( options.dll ).to.equal( null );
		} );

		it( 'should detect if `--dll` is set', () => {
			const options = parseArguments( [ '--dll' ] );

			expect( options.dll ).to.be.true;
		} );

		it( 'should detect if negation of the `--dll` is set (`--no-dll`)', () => {
			const options = parseArguments( [ '--no-dll' ] );

			expect( options.dll ).to.be.false;
		} );
	} );

	describe( 'tsconfig', () => {
		it( 'should be null by default, if `tsconfig.test.json` does not exist', () => {
			vi.mocked( fs ).existsSync.mockReturnValue( false );

			const options = parseArguments( [] );

			expect( options.tsconfig ).to.equal( null );
		} );

		it( 'should use `tsconfig.test.json` from `cwd` if it is available by default', () => {
			vi.mocked( fs ).existsSync.mockReturnValue( true );

			const options = parseArguments( [] );

			expect( options.tsconfig ).to.equal( '/home/project/tsconfig.test.json' );
		} );

		it( 'should parse `--tsconfig` to absolute path if it is set and it exists', () => {
			vi.mocked( fs ).existsSync.mockReturnValue( true );

			const options = parseArguments( [ '--tsconfig', 'configs/tsconfig.json' ] );

			expect( options.tsconfig ).to.be.equal( '/home/project/configs/tsconfig.json' );
		} );

		it( 'should be null if `--tsconfig` points to non-existing file', () => {
			vi.mocked( fs ).existsSync.mockReturnValue( false );

			const options = parseArguments( [ '--tsconfig', './configs/tsconfig.json' ] );

			expect( options.tsconfig ).to.equal( null );
		} );
	} );
} );
