/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const sinon = require( 'sinon' );
const expect = require( 'chai' ).expect;
const proxyquire = require( 'proxyquire' );
const mockery = require( 'mockery' );

describe( 'dev-release-tools/index', () => {
	let index, sandbox, stubs;

	beforeEach( () => {
		sandbox = sinon.createSandbox();

		mockery.enable( {
			useCleanCache: true,
			warnOnReplace: false,
			warnOnUnregistered: false
		} );

		stubs = {
			logger: {
				info: sandbox.spy(),
				warning: sandbox.spy(),
				error: sandbox.spy()
			},
			release: {
				generateChangelogForSinglePackage: sandbox.stub(),
				generateChangelogForMonoRepository: sandbox.stub(),
				updateDependencies: sandbox.stub(),
				commitAndTag: sandbox.stub(),
				createGithubRelease: sandbox.stub(),
				reassignNpmTags: sandbox.stub(),
				prepareRepository: sandbox.stub(),
				push: sandbox.stub(),
				publishPackages: sandbox.stub(),
				updateVersions: sandbox.stub(),
				cleanUpPackages: sandbox.stub(),
				version: {
					getLastFromChangelog: sandbox.stub(),
					getLastPreRelease: sandbox.stub(),
					getNextPreRelease: sandbox.stub(),
					getLastNightly: sandbox.stub(),
					getNextNightly: sandbox.stub(),
					getCurrent: sandbox.stub(),
					getLastTagFromGit: sandbox.stub()
				},
				changelog: {
					getChangesForVersion: sandbox.stub(),
					getChangelog: sandbox.stub(),
					saveChangelog: sandbox.stub()
				},
				executeInParallel: sandbox.stub(),
				validateRepositoryToRelease: sandbox.stub()
			}
		};

		mockery.registerMock( './tasks/generatechangelogforsinglepackage', stubs.release.generateChangelogForSinglePackage );
		mockery.registerMock( './tasks/generatechangelogformonorepository', stubs.release.generateChangelogForMonoRepository );
		mockery.registerMock( './tasks/updatedependencies', stubs.release.updateDependencies );
		mockery.registerMock( './tasks/commitandtag', stubs.release.commitAndTag );
		mockery.registerMock( './tasks/creategithubrelease', stubs.release.createGithubRelease );
		mockery.registerMock( './tasks/reassignnpmtags', stubs.release.reassignNpmTags );
		mockery.registerMock( './tasks/preparerepository', stubs.release.prepareRepository );
		mockery.registerMock( './tasks/push', stubs.release.push );
		mockery.registerMock( './tasks/publishpackages', stubs.release.publishPackages );
		mockery.registerMock( './tasks/updateversions', stubs.release.updateVersions );
		mockery.registerMock( './tasks/cleanuppackages', stubs.release.cleanUpPackages );
		mockery.registerMock( './utils/versions', stubs.release.version );
		mockery.registerMock( './utils/changelog', stubs.release.changelog );
		mockery.registerMock( './utils/executeinparallel', stubs.release.executeInParallel );
		mockery.registerMock( './utils/validaterepositorytorelease', stubs.release.validateRepositoryToRelease );

		index = proxyquire( '../lib/index', {
			'@ckeditor/ckeditor5-dev-utils': {
				logger() {
					return stubs.logger;
				}
			}
		} );
	} );

	afterEach( () => {
		sandbox.restore();
		mockery.disable();
	} );

	describe( 'generateChangelogForSinglePackage()', () => {
		it( 'should be a function', () => {
			expect( index.generateChangelogForSinglePackage ).to.be.a( 'function' );
		} );
	} );

	describe( 'generateChangelogForMonoRepository()', () => {
		it( 'should be a function', () => {
			expect( index.generateChangelogForMonoRepository ).to.be.a( 'function' );
		} );
	} );

	describe( 'updateDependencies()', () => {
		it( 'should be a function', () => {
			expect( index.updateDependencies ).to.be.a( 'function' );
		} );
	} );

	describe( 'commitAndTag()', () => {
		it( 'should be a function', () => {
			expect( index.commitAndTag ).to.be.a( 'function' );
		} );
	} );

	describe( 'createGithubRelease()', () => {
		it( 'should be a function', () => {
			expect( index.createGithubRelease ).to.be.a( 'function' );
		} );
	} );

	describe( 'reassignNpmTags()', () => {
		it( 'should be a function', () => {
			expect( index.reassignNpmTags ).to.be.a( 'function' );
		} );
	} );

	describe( 'prepareRepository()', () => {
		it( 'should be a function', () => {
			expect( index.prepareRepository ).to.be.a( 'function' );
		} );
	} );

	describe( 'push()', () => {
		it( 'should be a function', () => {
			expect( index.push ).to.be.a( 'function' );
		} );
	} );

	describe( 'publishPackages()', () => {
		it( 'should be a function', () => {
			expect( index.publishPackages ).to.be.a( 'function' );
		} );
	} );

	describe( 'updateVersions()', () => {
		it( 'should be a function', () => {
			expect( index.updateVersions ).to.be.a( 'function' );
		} );
	} );

	describe( 'cleanUpPackages()', () => {
		it( 'should be a function', () => {
			expect( index.cleanUpPackages ).to.be.a( 'function' );
		} );
	} );

	describe( 'getLastFromChangelog()', () => {
		it( 'should be a function', () => {
			expect( index.getLastFromChangelog ).to.be.a( 'function' );
		} );
	} );

	describe( 'getCurrent()', () => {
		it( 'should be a function', () => {
			expect( index.getCurrent ).to.be.a( 'function' );
		} );
	} );

	describe( 'getLastPreRelease()', () => {
		it( 'should be a function', () => {
			expect( index.getLastPreRelease ).to.be.a( 'function' );
		} );
	} );

	describe( 'getNextPreRelease()', () => {
		it( 'should be a function', () => {
			expect( index.getNextPreRelease ).to.be.a( 'function' );
		} );
	} );

	describe( 'getLastNightly()', () => {
		it( 'should be a function', () => {
			expect( index.getLastNightly ).to.be.a( 'function' );
		} );
	} );

	describe( 'getNextNightly()', () => {
		it( 'should be a function', () => {
			expect( index.getNextNightly ).to.be.a( 'function' );
		} );
	} );

	describe( 'getLastTagFromGit()', () => {
		it( 'should be a function', () => {
			expect( index.getLastTagFromGit ).to.be.a( 'function' );
		} );
	} );

	describe( 'getChangesForVersion()', () => {
		it( 'should be a function', () => {
			expect( index.getChangesForVersion ).to.be.a( 'function' );
		} );
	} );

	describe( 'getChangelog()', () => {
		it( 'should be a function', () => {
			expect( index.getChangelog ).to.be.a( 'function' );
		} );
	} );

	describe( 'saveChangelog()', () => {
		it( 'should be a function', () => {
			expect( index.saveChangelog ).to.be.a( 'function' );
		} );
	} );

	describe( 'executeInParallel()', () => {
		it( 'should be a function', () => {
			expect( index.executeInParallel ).to.be.a( 'function' );
		} );
	} );

	describe( 'validateRepositoryToRelease()', () => {
		it( 'should be a function', () => {
			expect( index.validateRepositoryToRelease ).to.be.a( 'function' );
		} );
	} );

	describe( 'checkVersionAvailability()', () => {
		it( 'should be a function', () => {
			expect( index.checkVersionAvailability ).to.be.a( 'function' );
		} );
	} );
} );
