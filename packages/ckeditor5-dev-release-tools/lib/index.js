/**
 * @license Copyright (c) 2003-2022, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const releaseSubRepositories = require( './tasks/releasesubrepositories' );
const bumpVersions = require( './tasks/bumpversions' );
const generateChangelogForSinglePackage = require( './tasks/generatechangelogforsinglepackage' );
const generateChangelogForMonoRepository = require( './tasks/generatechangelogformonorepository' );
const updateCKEditor5Dependencies = require( './tasks/update-ckeditor5-dependencies' );

module.exports = {
	releaseSubRepositories,
	bumpVersions,
	generateChangelogForSinglePackage,
	generateChangelogForMonoRepository,
	updateCKEditor5Dependencies
};
