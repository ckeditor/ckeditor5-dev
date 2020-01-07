/**
 * @license Copyright (c) 2003-2020, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const transformCommitForSubRepositoryFactory = require( './transformcommitforsubrepositoryfactory' );
const getChangedFilesForCommit = require( './getchangedfilesforcommit' );

/**
 * Factory function.
 *
 * It returns a function that parses a single commit for a package which is located in multi-package repository.
 *
 * The commit will be parsed only if its at least one file is located in the current processing package.
 *
 * If the commit match to specified criteria, it will be passed to a function produced by `transformCommitForSubRepositoryFactory()`.
 *
 * Returns `undefined` if given commit should not be added to the changelog. This behavior can be changed
 * using the `options.returnInvalidCommit` option.
 *
 * NOTE: An invalid commit will be returned only if it match to a parsed package. It means the commit must
 * change at least one file which belongs to current processing package.
 *
 * @param {Object} [options={}]
 * @param {Boolean} [options.returnInvalidCommit=false] Whether an invalid commit should be returned.
 * @returns {Function}
 */
module.exports = function transformCommitForSubPackageFactory( options = {} ) {
	/**
	 * @param {Commit} rawCommit
	 * @param {Object} context
	 * @param {Object} context.packageData Content from the `package.json` file for a parsing package.
	 * @returns {Commit|undefined} `undefined` means that the commit does not belong to the parsing package.
	 */
	return function transformCommitForSubPackage( rawCommit, context ) {
		// Let's clone the commit. We don't want to modify the reference.
		const commit = Object.assign( {}, rawCommit, {
			notes: rawCommit.notes.map( note => Object.assign( {}, note ) )
		} );

		// Skip the Lerna "Publish" commit.
		if ( !commit.type && commit.header === 'Publish' && commit.body ) {
			return;
		}

		// Our merge commit always contains two lines:
		// Merge ...
		// Prefix: Subject of the changes.
		// Unfortunately, merge commit made by Git does not contain the second line.
		// Because of that hash of the commit is parsed as a body and the changelog will crash.
		// See: https://github.com/ckeditor/ckeditor5-dev/issues/276.
		if ( commit.merge && !commit.hash ) {
			commit.hash = commit.body;
			commit.header = commit.merge;
			commit.body = null;
		}

		const files = getChangedFilesForCommit( commit.hash );

		if ( !files.length ) {
			return;
		}

		const packageName = context.packageData.name;
		const packageDirectory = packageName.startsWith( '@' ) ? packageName.split( '/' )[ 1 ] : packageName;

		if ( !isValidCommit( files, packageDirectory ) ) {
			return;
		}

		const transformCommitForSubRepository = transformCommitForSubRepositoryFactory( {
			returnInvalidCommit: options.returnInvalidCommit
		} );

		return transformCommitForSubRepository( commit );
	};

	function isValidCommit( files, packageName ) {
		// Commit is valid for the package if at least one file in the package was changed.
		return files.some( filePath => filePath.startsWith( `packages/${ packageName }` ) );
	}
};
