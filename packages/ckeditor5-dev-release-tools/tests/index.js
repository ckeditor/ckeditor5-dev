/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

import { describe, expect, it, vi } from 'vitest';
import generateChangelogForSinglePackage from '../lib/tasks/generatechangelogforsinglepackage';
import generateChangelogForMonoRepository from '../lib/tasks/generatechangelogformonorepository';
import updateDependencies from '../lib/tasks/updatedependencies';
import commitAndTag from '../lib/tasks/commitandtag';
import createGithubRelease from '../lib/tasks/creategithubrelease';
import reassignNpmTags from '../lib/tasks/reassignnpmtags';
import prepareRepository from '../lib/tasks/preparerepository';
import push from '../lib/tasks/push';
import publishPackages from '../lib/tasks/publishpackages';
import updateVersions from '../lib/tasks/updateversions';
import cleanUpPackages from '../lib/tasks/cleanuppackages';
import {
	getLastFromChangelog,
	getLastPreRelease,
	getNextPreRelease,
	getLastNightly,
	getNextNightly,
	getCurrent,
	getLastTagFromGit
} from '../lib/utils/versions';
import {
	getChangesForVersion,
	getChangelog,
	saveChangelog
} from '../lib/utils/changelog';
import executeInParallel from '../lib/utils/executeinparallel';
import validateRepositoryToRelease from '../lib/utils/validaterepositorytorelease';
import checkVersionAvailability from '../lib/utils/checkversionavailability';
import verifyPackagesPublishedCorrectly from '../lib/tasks/verifypackagespublishedcorrectly';
import getNpmTagFromVersion from '../lib/utils/getnpmtagfromversion';
import isVersionPublishableForTag from '../lib/utils/isversionpublishablefortag';

import * as index from '../lib/index';

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

	describe( 'verifyPackagesPublishedCorrectly()', () => {
		it( 'should be a function', () => {
			expect( verifyPackagesPublishedCorrectly ).to.be.a( 'function' );
			expect( index.verifyPackagesPublishedCorrectly ).to.equal( verifyPackagesPublishedCorrectly );
		} );
	} );
} );
