/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const fs = require( 'fs' );
const path = require( 'path' );
const { expect } = require( 'chai' );
const sinon = require( 'sinon' );
const proxyquire = require( 'proxyquire' );

const originalPosixJoin = path.posix.join;

describe( 'parseArguments()', () => {
	let parseArguments, sandbox, stubs;

	beforeEach( () => {
		sandbox = sinon.createSandbox();

		stubs = {
			cwd: sandbox.stub( process, 'cwd' ).callsFake( () => '/' ),
			existsSync: sandbox.stub( fs, 'existsSync' ),
			tools: {
				isDirectory: sandbox.stub(),
				readPackageName: sandbox.stub(),
				getDirectories: sandbox.stub()
			},
			logger: {
				warning: sandbox.stub()
			},
			// To force unix paths in tests.
			pathJoin: sandbox.stub( path, 'join' ).callsFake( ( ...chunks ) => originalPosixJoin( ...chunks ) )
		};

		parseArguments = proxyquire( '../../../lib/utils/automated-tests/parsearguments', {
			'@ckeditor/ckeditor5-dev-utils': {
				logger() {
					return stubs.logger;
				},
				tools: stubs.tools
			}
		} );
	} );

	afterEach( () => {
		sandbox.restore();
	} );

	it( 'replaces kebab-case strings with camelCase values', () => {
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

		it(
			'returns an array of packages to tests when `--repositories` is specified ' +
			'(root directory check)',
			() => {
				stubs.cwd.returns( '/home/project' );

				stubs.tools.isDirectory.withArgs( '/home/project/external' ).returns( false );
				stubs.tools.readPackageName.withArgs( '/home/project' ).returns( 'ckeditor5' );
				stubs.tools.getDirectories.withArgs( '/home/project/packages' ).returns( [
					'ckeditor5-core',
					'ckeditor5-engine'
				] );

				const options = parseArguments( [
					'--repositories',
					'ckeditor5'
				] );

				expect( options.files ).to.deep.equal( [ 'core', 'engine' ] );

				expect( stubs.logger.warning.callCount ).to.equal( 1 );
				expect( stubs.logger.warning.firstCall.args[ 0 ] ).to.equal(
					'The `external/` directory does not exist. Only the root repository will be checked.'
				);
			}
		);

		it(
			'returns an array of packages to tests when `--repositories` is specified ' +
			'(external directory check)',
			() => {
				stubs.cwd.returns( '/home/project' );

				stubs.tools.isDirectory.withArgs( '/home/project/external' ).returns( true );
				stubs.tools.isDirectory.withArgs( '/home/project/external/ckeditor5' ).returns( true );

				stubs.tools.readPackageName.withArgs( '/home/project' ).returns( 'foo' );
				stubs.tools.getDirectories.withArgs( '/home/project/external/ckeditor5/packages' ).returns( [
					'ckeditor5-core',
					'ckeditor5-engine'
				] );

				const options = parseArguments( [
					'--repositories',
					'ckeditor5'
				] );

				expect( options.files ).to.deep.equal( [ 'core', 'engine' ] );

				expect( stubs.logger.warning.callCount ).to.equal( 0 );
			}
		);

		it(
			'returns an array of packages to tests when `--repositories` is specified ' +
			'(external directory check, specified repository does not exist)',
			() => {
				stubs.cwd.returns( '/home/project' );

				stubs.tools.isDirectory.withArgs( '/home/project/external' ).returns( true );
				stubs.tools.isDirectory.withArgs( '/home/project/external/ckeditor5' ).returns( false );

				stubs.tools.readPackageName.withArgs( '/home/project' ).returns( 'foo' );

				const options = parseArguments( [
					'--repositories',
					'ckeditor5'
				] );

				expect( options.files ).to.deep.equal( [] );

				expect( stubs.logger.warning.callCount ).to.equal( 1 );
				expect( stubs.logger.warning.firstCall.args[ 0 ] ).to.equal(
					'Did not find the repository "ckeditor5" in the root repository or the "external/" directory.'
				);
			}
		);

		it(
			'returns an array of packages (unique list) to tests when `--repositories` is specified ' +
			'(root directory check + `--files` specified)',
			() => {
				stubs.cwd.returns( '/home/project' );

				stubs.tools.isDirectory.withArgs( '/home/project/external' ).returns( true );

				stubs.tools.readPackageName.withArgs( '/home/project' ).returns( 'ckeditor5' );
				stubs.tools.getDirectories.withArgs( '/home/project/packages' ).returns( [
					'ckeditor5-core',
					'ckeditor5-engine',
					'ckeditor5-utils'
				] );

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
				stubs.cwd.returns( '/home/project' );

				stubs.tools.isDirectory.withArgs( '/home/project/external' ).returns( true );
				stubs.tools.isDirectory.withArgs( '/home/project/external/foo' ).returns( true );
				stubs.tools.isDirectory.withArgs( '/home/project/external/bar' ).returns( true );
				stubs.tools.readPackageName.withArgs( '/home/project' ).returns( 'ckeditor5' );
				stubs.tools.getDirectories.withArgs( '/home/project/packages' ).returns( [
					'ckeditor5-core',
					'ckeditor5-engine'
				] );
				stubs.tools.getDirectories.withArgs( '/home/project/external/foo/packages' ).returns( [
					'ckeditor5-foo-1',
					'ckeditor5-foo-2'
				] );
				stubs.tools.getDirectories.withArgs( '/home/project/external/bar/packages' ).returns( [
					'ckeditor5-bar-1',
					'ckeditor5-bar-2'
				] );

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
			stubs.existsSync.returns( false );

			const options = parseArguments( [] );

			expect( options.tsconfig ).to.equal( null );
		} );

		it( 'should use `tsconfig.test.json` from `cwd` if it is available by default', () => {
			stubs.cwd.returns( '/home/project' );
			stubs.existsSync.returns( true );

			const options = parseArguments( [] );

			expect( options.tsconfig ).to.equal( '/home/project/tsconfig.test.json' );
		} );

		it( 'should parse `--tsconfig` to absolute path if it is set and it exists', () => {
			stubs.cwd.returns( '/home/project' );
			stubs.existsSync.returns( true );
			const options = parseArguments( [ '--tsconfig', './configs/tsconfig.json' ] );

			expect( options.tsconfig ).to.be.equal( '/home/project/configs/tsconfig.json' );
		} );

		it( 'should be null if `--tsconfig` points to non-existing file', () => {
			stubs.cwd.returns( '/home/project' );
			stubs.existsSync.returns( false );
			const options = parseArguments( [ '--tsconfig', './configs/tsconfig.json' ] );

			expect( options.tsconfig ).to.equal( null );
		} );
	} );
} );
