/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import fs from 'fs';
import { tools, logger, workspaces } from '@ckeditor/ckeditor5-dev-utils';
import chalk from 'chalk';
import semver from 'semver';
import displayCommits from '../utils/displaycommits.js';
import generateChangelog from '../utils/generatechangelog.js';
import getNewVersionType from '../utils/getnewversiontype.js';
import getCommits from '../utils/getcommits.js';
import getWriterOptions from '../utils/getwriteroptions.js';
import transformCommitFactory from '../utils/transformcommitfactory.js';
import getFormattedDate from '../utils/getformatteddate.js';
import saveChangelog from '../utils/savechangelog.js';
import getChangelog from '../utils/getchangelog.js';
import provideVersion from '../utils/provideversion.js';
import { CHANGELOG_FILE, CHANGELOG_HEADER, CLI_INDENT_SIZE } from '../utils/constants.js';

const SKIP_GENERATE_CHANGELOG = 'Typed "skip" as a new version. Aborting.';

/**
 * Generates the changelog based on commit messages in a package that is located under current work directory (cwd).
 *
 * If the package does not have any commit, the user has to confirm whether the changelog should be generated.
 *
 * @param {object} [options={}] Additional options.
 *
 * @param {boolean} [options.skipLinks=false] If set on true, links to release or commits will be omitted.
 *
 * @param {string} [options.from] A commit or tag name that will be the first param of the range of commits to collect.
 *
 * @param {string} [options.releaseBranch='master'] A name of the branch that should be used for releasing packages.
 *
 * @param {string} [options.mainBranch='master'] A name of the main branch in the repository.
 *
 * @param {FormatDateCallback} [options.formatDate] A callback allowing defining a custom format of the date inserted into the changelog.
 * If not specified, the default date matches the `YYYY-MM-DD` pattern.
 *
 * @returns {Promise}
 */
export default async function generateChangelogForSinglePackage( options = {} ) {
	const log = logger();
	const pkgJson = workspaces.getPackageJson();

	logProcess( chalk.bold( `Generating changelog for "${ chalk.underline( pkgJson.name ) }"...` ) );

	const transformCommit = transformCommitFactory();

	logProcess( 'Collecting all commits since the last release...' );

	const commitOptions = {
		from: options.from ? options.from : 'v' + pkgJson.version,
		releaseBranch: options.releaseBranch || 'master',
		mainBranch: options.mainBranch || 'master'
	};

	// Initial release.
	if ( semver.eq( pkgJson.version, '0.0.1' ) ) {
		commitOptions.from = null;
	}

	// Collection of all entries (real commits + additional "fake" commits extracted from descriptions).
	let allCommits;

	// A new version inserted into the changelog.
	let newVersion;

	return getCommits( transformCommit, commitOptions )
		.then( commits => {
			allCommits = commits;

			logInfo( `Found ${ commits.length } entries to parse.`, { indentLevel: 1 } );
		} )
		.then( () => {
			logProcess( 'Preparing new version for the package...' );

			displayCommits( allCommits, { indentLevel: 1 } );

			return provideVersion( {
				packageName: pkgJson.name,
				version: pkgJson.version,
				indentLevel: 1,
				releaseTypeOrNewVersion: getNewVersionType( allCommits )
			} );
		} )
		.then( version => {
			if ( version === 'skip' ) {
				throw new Error( SKIP_GENERATE_CHANGELOG );
			}

			const isInternalRelease = version === 'internal';

			if ( version === 'internal' ) {
				version = semver.inc( pkgJson.version, 'patch' );
			}

			newVersion = version;

			logProcess( 'Generating the changelog...' );

			const writerContext = {
				version,
				commit: 'commit',
				repoUrl: workspaces.getRepositoryUrl(),
				currentTag: 'v' + version,
				previousTag: options.from ? options.from : 'v' + pkgJson.version,
				isPatch: semver.diff( version, pkgJson.version ) === 'patch',
				isInternalRelease,
				skipCommitsLink: Boolean( options.skipLinks ),
				skipCompareLink: Boolean( options.skipLinks ),
				date: options.formatDate ? options.formatDate( new Date() ) : getFormattedDate()
			};

			const writerOptions = getWriterOptions( commit => {
				// We do not allow modifying the commit hash value by the generator itself.
				return commit;
			} );

			const publicCommits = [ ...allCommits ]
				.filter( commit => commit.isPublicCommit )
				.map( commit => {
					commit.scope = null;
					commit.notes = commit.notes.map( note => {
						note.scope = null;

						return note;
					} );

					return commit;
				} );

			return generateChangelog( publicCommits, writerContext, writerOptions )
				.then( changes => {
					logInfo( 'Changes based on commits have been generated.', { indentLevel: 1 } );

					return Promise.resolve( changes );
				} );
		} )
		.then( changesFromCommits => {
			logProcess( 'Saving changelog...' );

			if ( !fs.existsSync( CHANGELOG_FILE ) ) {
				logInfo( 'Changelog file does not exist. Creating...', { isWarning: true, indentLevel: 1 } );

				saveChangelog( CHANGELOG_HEADER );
			}

			let currentChangelog = getChangelog();

			// Remove header from current changelog.
			currentChangelog = currentChangelog.replace( CHANGELOG_HEADER, '' );

			// Concat header, new and current changelog.
			let newChangelog = CHANGELOG_HEADER + changesFromCommits + currentChangelog.trim();
			newChangelog = newChangelog.trim() + '\n';

			// Save the changelog.
			saveChangelog( newChangelog );

			tools.shExec( `git add ${ CHANGELOG_FILE }`, { verbosity: 'error' } );
			tools.shExec( 'git commit -m "Docs: Changelog. [skip ci]"', { verbosity: 'error' } );

			logInfo( 'Saved.', { indentLevel: 1 } );
		} )
		.then( () => {
			logInfo( `Changelog for "${ chalk.underline( pkgJson.name ) }" (v${ newVersion }) has been generated.`, { indentLevel: 1 } );
		} )
		.catch( err => {
			if ( err.message === SKIP_GENERATE_CHANGELOG ) {
				logInfo( `Skipping generating the changelog for "${ chalk.underline( pkgJson.name ) }".`, {
					indentLevel: 1,
					isWarning: true,
					startWithNewLine: true
				} );

				return;
			}

			throw err;
		} );

	function logProcess( message ) {
		log.info( '\n📍 ' + chalk.cyan( message ) );
	}

	/**
	 * @param {string} message
	 * @param {object} [options={}]
	 * @param {number} [options.indentLevel=0]
	 * @param {boolean} [options.startWithNewLine=false] Whether to append a new line before the message.
	 * @param {boolean} [options.isWarning=false] Whether to use `warning` method instead of `log`.
	 */
	function logInfo( message, options = {} ) {
		const indentLevel = options.indentLevel || 0;
		const startWithNewLine = options.startWithNewLine || false;
		const method = options.isWarning ? 'warning' : 'info';

		log[ method ]( `${ startWithNewLine ? '\n' : '' }${ ' '.repeat( indentLevel * CLI_INDENT_SIZE ) }` + message );
	}
}

/**
 * @callback FormatDateCallback
 *
 * @param {Date} now The current date.
 *
 * @returns {string} The formatted date inserted into the changelog.
 */
