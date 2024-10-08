/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { describe, expect, it, vi } from 'vitest';
import generateChangelogForSinglePackage from '../lib/tasks/generatechangelogforsinglepackage.js';
import generateChangelogForMonoRepository from '../lib/tasks/generatechangelogformonorepository.js';
import updateDependencies from '../lib/tasks/updatedependencies.js';
import commitAndTag from '../lib/tasks/commitandtag.js';
import createGithubRelease from '../lib/tasks/creategithubrelease.js';
import reassignNpmTags from '../lib/tasks/reassignnpmtags.js';
import prepareRepository from '../lib/tasks/preparerepository.js';
import push from '../lib/tasks/push.js';
import publishPackages from '../lib/tasks/publishpackages.js';
import updateVersions from '../lib/tasks/updateversions.js';
import cleanUpPackages from '../lib/tasks/cleanuppackages.js';
import getChangesForVersion from '../lib/utils/getchangesforversion.js';
import getChangelog from '../lib/utils/getchangelog.js';
import saveChangelog from '../lib/utils/savechangelog.js';
import {
	getLastFromChangelog,
	getLastPreRelease,
	getNextPreRelease,
	getLastNightly,
	getNextNightly,
	getCurrent,
	getLastTagFromGit
} from '../lib/utils/versions.js';
import executeInParallel from '../lib/utils/executeinparallel.js';
import validateRepositoryToRelease from '../lib/utils/validaterepositorytorelease.js';
import checkVersionAvailability from '../lib/utils/checkversionavailability.js';
import getNpmTagFromVersion from '../lib/utils/getnpmtagfromversion.js';
import isVersionPublishableForTag from '../lib/utils/isversionpublishablefortag.js';
import provideToken from '../lib/utils/providetoken.js';

import * as index from '../lib/index.js';

vi.mock( '../lib/tasks/generatechangelogforsinglepackage' );
vi.mock( '../lib/tasks/generatechangelogformonorepository' );
vi.mock( '../lib/tasks/updatedependencies' );
vi.mock( '../lib/tasks/commitandtag' );
vi.mock( '../lib/tasks/creategithubrelease' );
vi.mock( '../lib/tasks/reassignnpmtags' );
vi.mock( '../lib/tasks/preparerepository' );
vi.mock( '../lib/tasks/push' );
vi.mock( '../lib/tasks/publishpackages' );
vi.mock( '../lib/tasks/updateversions' );
vi.mock( '../lib/tasks/cleanuppackages' );
vi.mock( '../lib/utils/versions' );
vi.mock( '../lib/utils/getnpmtagfromversion' );
vi.mock( '../lib/utils/changelog' );
vi.mock( '../lib/utils/executeinparallel' );
vi.mock( '../lib/utils/validaterepositorytorelease' );
vi.mock( '../lib/utils/isversionpublishablefortag' );
vi.mock( '../lib/utils/provideToken' );

describe( 'dev-release-tools/index', () => {
	describe( 'generateChangelogForSinglePackage()', () => {
		it( 'should be a function', () => {
			expect( index.generateChangelogForSinglePackage ).to.be.a( 'function' );
			expect( index.generateChangelogForSinglePackage ).to.equal( generateChangelogForSinglePackage );
		} );
	} );

	describe( 'generateChangelogForMonoRepository()', () => {
		it( 'should be a function', () => {
			expect( generateChangelogForMonoRepository ).to.be.a( 'function' );
			expect( index.generateChangelogForMonoRepository ).to.equal( generateChangelogForMonoRepository );
		} );
	} );

	describe( 'updateDependencies()', () => {
		it( 'should be a function', () => {
			expect( updateDependencies ).to.be.a( 'function' );
			expect( index.updateDependencies ).to.equal( updateDependencies );
		} );
	} );

	describe( 'commitAndTag()', () => {
		it( 'should be a function', () => {
			expect( commitAndTag ).to.be.a( 'function' );
			expect( index.commitAndTag ).to.equal( commitAndTag );
		} );
	} );

	describe( 'createGithubRelease()', () => {
		it( 'should be a function', () => {
			expect( createGithubRelease ).to.be.a( 'function' );
			expect( index.createGithubRelease ).to.equal( createGithubRelease );
		} );
	} );

	describe( 'reassignNpmTags()', () => {
		it( 'should be a function', () => {
			expect( reassignNpmTags ).to.be.a( 'function' );
			expect( index.reassignNpmTags ).to.equal( reassignNpmTags );
		} );
	} );

	describe( 'prepareRepository()', () => {
		it( 'should be a function', () => {
			expect( prepareRepository ).to.be.a( 'function' );
			expect( index.prepareRepository ).to.equal( prepareRepository );
		} );
	} );

	describe( 'push()', () => {
		it( 'should be a function', () => {
			expect( push ).to.be.a( 'function' );
			expect( index.push ).to.equal( push );
		} );
	} );

	describe( 'publishPackages()', () => {
		it( 'should be a function', () => {
			expect( publishPackages ).to.be.a( 'function' );
			expect( index.publishPackages ).to.equal( publishPackages );
		} );
	} );

	describe( 'updateVersions()', () => {
		it( 'should be a function', () => {
			expect( updateVersions ).to.be.a( 'function' );
			expect( index.updateVersions ).to.equal( updateVersions );
		} );
	} );

	describe( 'cleanUpPackages()', () => {
		it( 'should be a function', () => {
			expect( cleanUpPackages ).to.be.a( 'function' );
			expect( index.cleanUpPackages ).to.equal( cleanUpPackages );
		} );
	} );

	describe( 'getLastFromChangelog()', () => {
		it( 'should be a function', () => {
			expect( getLastFromChangelog ).to.be.a( 'function' );
			expect( index.getLastFromChangelog ).to.equal( getLastFromChangelog );
		} );
	} );

	describe( 'getCurrent()', () => {
		it( 'should be a function', () => {
			expect( getCurrent ).to.be.a( 'function' );
			expect( index.getCurrent ).to.equal( getCurrent );
		} );
	} );

	describe( 'getLastPreRelease()', () => {
		it( 'should be a function', () => {
			expect( getLastPreRelease ).to.be.a( 'function' );
			expect( index.getLastPreRelease ).to.equal( getLastPreRelease );
		} );
	} );

	describe( 'getNextPreRelease()', () => {
		it( 'should be a function', () => {
			expect( getNextPreRelease ).to.be.a( 'function' );
			expect( index.getNextPreRelease ).to.equal( getNextPreRelease );
		} );
	} );

	describe( 'getLastNightly()', () => {
		it( 'should be a function', () => {
			expect( getLastNightly ).to.be.a( 'function' );
			expect( index.getLastNightly ).to.equal( getLastNightly );
		} );
	} );

	describe( 'getNextNightly()', () => {
		it( 'should be a function', () => {
			expect( getNextNightly ).to.be.a( 'function' );
			expect( index.getNextNightly ).to.equal( getNextNightly );
		} );
	} );

	describe( 'getLastTagFromGit()', () => {
		it( 'should be a function', () => {
			expect( getLastTagFromGit ).to.be.a( 'function' );
			expect( index.getLastTagFromGit ).to.equal( getLastTagFromGit );
		} );
	} );

	describe( 'getNpmTagFromVersion()', () => {
		it( 'should be a function', () => {
			expect( getNpmTagFromVersion ).to.be.a( 'function' );
			expect( index.getNpmTagFromVersion ).to.equal( getNpmTagFromVersion );
		} );
	} );

	describe( 'getChangesForVersion()', () => {
		it( 'should be a function', () => {
			expect( getChangesForVersion ).to.be.a( 'function' );
			expect( index.getChangesForVersion ).to.equal( getChangesForVersion );
		} );
	} );

	describe( 'getChangelog()', () => {
		it( 'should be a function', () => {
			expect( getChangelog ).to.be.a( 'function' );
			expect( index.getChangelog ).to.equal( getChangelog );
		} );
	} );

	describe( 'saveChangelog()', () => {
		it( 'should be a function', () => {
			expect( saveChangelog ).to.be.a( 'function' );
			expect( index.saveChangelog ).to.equal( saveChangelog );
		} );
	} );

	describe( 'executeInParallel()', () => {
		it( 'should be a function', () => {
			expect( executeInParallel ).to.be.a( 'function' );
			expect( index.executeInParallel ).to.equal( executeInParallel );
		} );
	} );

	describe( 'validateRepositoryToRelease()', () => {
		it( 'should be a function', () => {
			expect( validateRepositoryToRelease ).to.be.a( 'function' );
			expect( index.validateRepositoryToRelease ).to.equal( validateRepositoryToRelease );
		} );
	} );

	describe( 'checkVersionAvailability()', () => {
		it( 'should be a function', () => {
			expect( checkVersionAvailability ).to.be.a( 'function' );
			expect( index.checkVersionAvailability ).to.equal( checkVersionAvailability );
		} );
	} );

	describe( 'isVersionPublishableForTag()', () => {
		it( 'should be a function', () => {
			expect( isVersionPublishableForTag ).to.be.a( 'function' );
			expect( index.isVersionPublishableForTag ).to.equal( isVersionPublishableForTag );
		} );
	} );

	describe( 'provideToken()', () => {
		it( 'should be a function', () => {
			expect( provideToken ).to.be.a( 'function' );
			expect( index.provideToken ).to.equal( provideToken );
		} );
	} );
} );
