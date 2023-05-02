/**
 * @license Copyright (c) 2003-2023, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const expect = require( 'chai' ).expect;
const sinon = require( 'sinon' );
const mockery = require( 'mockery' );

describe( 'dev-release-tools/tasks', () => {
	describe( 'updateDependencies()', () => {
		let updateDependencies, sandbox, stubs;

		beforeEach( () => {
			sandbox = sinon.createSandbox();

			stubs = {
				fs: {
					readJsonSync: sandbox.stub(),
					writeJsonSync: sandbox.stub()
				},
				glob: {
					globSync: sandbox.stub()
				},
				process: {
					cwd: sandbox.stub( process, 'cwd' ).returns( '/work/project' )
				},
				devUtils: {
					logger: sandbox.stub().returns( {
						error: sandbox.stub(),
						warning: sandbox.stub(),
						info: sandbox.stub()
					} )
				}
			};

			mockery.enable( {
				useCleanCache: true,
				warnOnReplace: false,
				warnOnUnregistered: false
			} );

			mockery.registerMock( 'fs-extra', stubs.fs );
			mockery.registerMock( 'glob', stubs.glob );
			mockery.registerMock( '@ckeditor/ckeditor5-dev-utils', stubs.devUtils );

			updateDependencies = require( '../../lib/tasks-new/updatedependencies' );
		} );

		afterEach( () => {
			sandbox.restore();
			mockery.disable();
		} );

		describe( 'preparing options', () => {
			beforeEach( () => {
				stubs.glob.globSync.returns( [] );
			} );

			it( 'should use provided `cwd` to search for packages', () => {
				const options = {
					cwd: '/work/another/project'
				};

				updateDependencies( options );

				expect( stubs.glob.globSync.calledOnce ).to.equal( true );
				expect( stubs.glob.globSync.getCall( 0 ).args[ 1 ] ).to.have.property( 'cwd', '/work/another/project' );
			} );

			it( 'should use `process.cwd()` to search for packages if `cwd` option is not provided', () => {
				updateDependencies( {} );

				expect( stubs.glob.globSync.calledOnce ).to.equal( true );
				expect( stubs.glob.globSync.getCall( 0 ).args[ 1 ] ).to.have.property( 'cwd', '/work/project' );
			} );

			it( 'should match only files', () => {
				updateDependencies( {} );

				expect( stubs.glob.globSync.calledOnce ).to.equal( true );
				expect( stubs.glob.globSync.getCall( 0 ).args[ 1 ] ).to.have.property( 'nodir', true );
			} );

			it( 'should always receive absolute paths for matched files', () => {
				updateDependencies( {} );

				expect( stubs.glob.globSync.calledOnce ).to.equal( true );
				expect( stubs.glob.globSync.getCall( 0 ).args[ 1 ] ).to.have.property( 'absolute', true );
			} );

			it( 'should search for packages in `cwd` and `packagesDirectory`', () => {
				updateDependencies( {
					packagesDirectory: 'packages'
				} );

				expect( stubs.glob.globSync.calledOnce ).to.equal( true );
				expect( stubs.glob.globSync.getCall( 0 ).args[ 0 ] ).to.deep.equal( [
					'package.json',
					'packages/*/package.json'
				] );
			} );

			it( 'should search for packages only in `cwd` if `packagesDirectory` option is not provided', () => {
				updateDependencies( {} );

				expect( stubs.glob.globSync.calledOnce ).to.equal( true );
				expect( stubs.glob.globSync.getCall( 0 ).args[ 0 ] ).to.deep.equal( [
					'package.json'
				] );
			} );

			it( 'should remove leading and trailing path separators from the `packagesDirectory`', () => {
				updateDependencies( {
					packagesDirectory: '/path/to/packages/'
				} );

				expect( stubs.glob.globSync.calledOnce ).to.equal( true );
				expect( stubs.glob.globSync.getCall( 0 ).args[ 0 ] ).to.deep.equal( [
					'package.json',
					'path/to/packages/*/package.json'
				] );
			} );

			it( 'should convert backslashes to slashes from the `packagesDirectory`', () => {
				updateDependencies( {
					packagesDirectory: '\\path\\to\\packages\\'
				} );

				expect( stubs.glob.globSync.calledOnce ).to.equal( true );
				expect( stubs.glob.globSync.getCall( 0 ).args[ 0 ] ).to.deep.equal( [
					'package.json',
					'path/to/packages/*/package.json'
				] );
			} );
		} );

		describe( 'updating dependencies', () => {
			let shouldUpdateVersionCallback;

			beforeEach( () => {
				shouldUpdateVersionCallback = sandbox.stub().callsFake( packageName => packageName.startsWith( '@ckeditor' ) );
			} );

			it( 'should read and write `package.json` for each found package', () => {
				stubs.glob.globSync.callsFake( patterns => {
					const paths = {
						'package.json': [
							'/work/project/package.json'
						],
						'packages/*/package.json': [
							'/work/project/packages/ckeditor5-foo/package.json',
							'/work/project/packages/ckeditor5-bar/package.json'
						]
					};

					return patterns.flatMap( pattern => paths[ pattern ] || [] );
				} );

				stubs.fs.readJsonSync.returns( {} );

				updateDependencies( {
					packagesDirectory: 'packages'
				} );

				expect( stubs.fs.readJsonSync.callCount ).to.equal( 3 );
				expect( stubs.fs.readJsonSync.getCall( 0 ).args[ 0 ] ).to.equal( '/work/project/package.json' );
				expect( stubs.fs.readJsonSync.getCall( 1 ).args[ 0 ] ).to.equal( '/work/project/packages/ckeditor5-foo/package.json' );
				expect( stubs.fs.readJsonSync.getCall( 2 ).args[ 0 ] ).to.equal( '/work/project/packages/ckeditor5-bar/package.json' );

				expect( stubs.fs.writeJsonSync.callCount ).to.equal( 3 );
				expect( stubs.fs.writeJsonSync.getCall( 0 ).args[ 0 ] ).to.equal( '/work/project/package.json' );
				expect( stubs.fs.writeJsonSync.getCall( 1 ).args[ 0 ] ).to.equal( '/work/project/packages/ckeditor5-foo/package.json' );
				expect( stubs.fs.writeJsonSync.getCall( 2 ).args[ 0 ] ).to.equal( '/work/project/packages/ckeditor5-bar/package.json' );
			} );

			it( 'should update eligible dependencies from the `dependencies` key', () => {
				stubs.glob.globSync.returns( [ '/work/project/package.json' ] );

				stubs.fs.readJsonSync.returns( {
					dependencies: {
						'@ckeditor/ckeditor5-engine': '^37.0.0',
						'@ckeditor/ckeditor5-enter': '^37.0.0',
						'@ckeditor/ckeditor5-essentials': '^37.0.0',
						'lodash-es': '^4.17.15'
					}
				} );

				updateDependencies( {
					version: '^38.0.0',
					shouldUpdateVersionCallback
				} );

				expect( shouldUpdateVersionCallback.callCount ).to.equal( 4 );
				expect( shouldUpdateVersionCallback.getCall( 0 ).args[ 0 ] ).to.equal( '@ckeditor/ckeditor5-engine' );
				expect( shouldUpdateVersionCallback.getCall( 1 ).args[ 0 ] ).to.equal( '@ckeditor/ckeditor5-enter' );
				expect( shouldUpdateVersionCallback.getCall( 2 ).args[ 0 ] ).to.equal( '@ckeditor/ckeditor5-essentials' );
				expect( shouldUpdateVersionCallback.getCall( 3 ).args[ 0 ] ).to.equal( 'lodash-es' );

				expect( stubs.fs.writeJsonSync.callCount ).to.equal( 1 );
				expect( stubs.fs.writeJsonSync.getCall( 0 ).args[ 0 ] ).to.equal( '/work/project/package.json' );
				expect( stubs.fs.writeJsonSync.getCall( 0 ).args[ 1 ] ).to.deep.equal( {
					dependencies: {
						'@ckeditor/ckeditor5-engine': '^38.0.0',
						'@ckeditor/ckeditor5-enter': '^38.0.0',
						'@ckeditor/ckeditor5-essentials': '^38.0.0',
						'lodash-es': '^4.17.15'
					}
				} );
			} );

			it( 'should update eligible dependencies from the `devDependencies` key', () => {
				stubs.glob.globSync.returns( [ '/work/project/package.json' ] );

				stubs.fs.readJsonSync.returns( {
					devDependencies: {
						'@ckeditor/ckeditor5-engine': '^37.0.0',
						'@ckeditor/ckeditor5-enter': '^37.0.0',
						'@ckeditor/ckeditor5-essentials': '^37.0.0',
						'lodash-es': '^4.17.15'
					}
				} );

				updateDependencies( {
					version: '^38.0.0',
					shouldUpdateVersionCallback
				} );

				expect( shouldUpdateVersionCallback.callCount ).to.equal( 4 );
				expect( shouldUpdateVersionCallback.getCall( 0 ).args[ 0 ] ).to.equal( '@ckeditor/ckeditor5-engine' );
				expect( shouldUpdateVersionCallback.getCall( 1 ).args[ 0 ] ).to.equal( '@ckeditor/ckeditor5-enter' );
				expect( shouldUpdateVersionCallback.getCall( 2 ).args[ 0 ] ).to.equal( '@ckeditor/ckeditor5-essentials' );
				expect( shouldUpdateVersionCallback.getCall( 3 ).args[ 0 ] ).to.equal( 'lodash-es' );

				expect( stubs.fs.writeJsonSync.callCount ).to.equal( 1 );
				expect( stubs.fs.writeJsonSync.getCall( 0 ).args[ 0 ] ).to.equal( '/work/project/package.json' );
				expect( stubs.fs.writeJsonSync.getCall( 0 ).args[ 1 ] ).to.deep.equal( {
					devDependencies: {
						'@ckeditor/ckeditor5-engine': '^38.0.0',
						'@ckeditor/ckeditor5-enter': '^38.0.0',
						'@ckeditor/ckeditor5-essentials': '^38.0.0',
						'lodash-es': '^4.17.15'
					}
				} );
			} );

			it( 'should update eligible dependencies from the `peerDependencies` key', () => {
				stubs.glob.globSync.returns( [ '/work/project/package.json' ] );

				stubs.fs.readJsonSync.returns( {
					peerDependencies: {
						'@ckeditor/ckeditor5-engine': '^37.0.0',
						'@ckeditor/ckeditor5-enter': '^37.0.0',
						'@ckeditor/ckeditor5-essentials': '^37.0.0',
						'lodash-es': '^4.17.15'
					}
				} );

				updateDependencies( {
					version: '^38.0.0',
					shouldUpdateVersionCallback
				} );

				expect( shouldUpdateVersionCallback.callCount ).to.equal( 4 );
				expect( shouldUpdateVersionCallback.getCall( 0 ).args[ 0 ] ).to.equal( '@ckeditor/ckeditor5-engine' );
				expect( shouldUpdateVersionCallback.getCall( 1 ).args[ 0 ] ).to.equal( '@ckeditor/ckeditor5-enter' );
				expect( shouldUpdateVersionCallback.getCall( 2 ).args[ 0 ] ).to.equal( '@ckeditor/ckeditor5-essentials' );
				expect( shouldUpdateVersionCallback.getCall( 3 ).args[ 0 ] ).to.equal( 'lodash-es' );

				expect( stubs.fs.writeJsonSync.callCount ).to.equal( 1 );
				expect( stubs.fs.writeJsonSync.getCall( 0 ).args[ 0 ] ).to.equal( '/work/project/package.json' );
				expect( stubs.fs.writeJsonSync.getCall( 0 ).args[ 1 ] ).to.deep.equal( {
					peerDependencies: {
						'@ckeditor/ckeditor5-engine': '^38.0.0',
						'@ckeditor/ckeditor5-enter': '^38.0.0',
						'@ckeditor/ckeditor5-essentials': '^38.0.0',
						'lodash-es': '^4.17.15'
					}
				} );
			} );

			it( 'should not update any package if `shouldUpdateVersionCallback` callback returns falsy value', () => {
				stubs.glob.globSync.returns( [ '/work/project/package.json' ] );

				stubs.fs.readJsonSync.returns( {
					dependencies: {
						'@ckeditor/ckeditor5-engine': '^37.0.0',
						'@ckeditor/ckeditor5-enter': '^37.0.0',
						'@ckeditor/ckeditor5-essentials': '^37.0.0',
						'lodash-es': '^4.17.15'
					}
				} );

				updateDependencies( {
					version: '^38.0.0',
					shouldUpdateVersionCallback: () => false
				} );

				expect( stubs.fs.writeJsonSync.callCount ).to.equal( 1 );
				expect( stubs.fs.writeJsonSync.getCall( 0 ).args[ 0 ] ).to.equal( '/work/project/package.json' );
				expect( stubs.fs.writeJsonSync.getCall( 0 ).args[ 1 ] ).to.deep.equal( {
					dependencies: {
						'@ckeditor/ckeditor5-engine': '^37.0.0',
						'@ckeditor/ckeditor5-enter': '^37.0.0',
						'@ckeditor/ckeditor5-essentials': '^37.0.0',
						'lodash-es': '^4.17.15'
					}
				} );
			} );
		} );
	} );
} );
