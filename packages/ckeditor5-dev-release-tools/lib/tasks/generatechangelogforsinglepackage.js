/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import fs from 'fs';
import { tools, logger } from '@ckeditor/ckeditor5-dev-utils';
import chalk from 'chalk';
import semver from 'semver';
import cli from '../utils/cli';
import changelogUtils from '../utils/changelog';
import displayCommits from '../utils/displaycommits';
import generateChangelog from '../utils/generatechangelog';
import getPackageJson from '../utils/getpackagejson';
import getNewVersionType from '../utils/getnewversiontype';
import getCommits from '../utils/getcommits';
import getWriterOptions from '../utils/getwriteroptions';
import { getRepositoryUrl } from '../utils/transformcommitutils';
import transformCommitFactory from '../utils/transformcommitfactory';

const SKIP_GENERATE_CHANGELOG = 'Typed "skip" as a new version. Aborting.';

/**
 * Generates the changelog based on commit messages in a package that is located under current work directory (cwd).
 *
 * If the package does not have any commit, the user has to confirm whether the changelog should be generated.
 *
 * @param {Object} [options={}] Additional options.
 *
 * @param {Boolean} [options.skipLinks=false] If set on true, links to release or commits will be omitted.
 *
 * @param {String} [options.from] A commit or tag name that will be the first param of the range of commits to collect.
 *
 * @param {String} [options.releaseBranch='master'] A name of the branch that should be used for releasing packages.
 *
 * @param {FormatDateCallback} [options.formatDate] A callback allowing defining a custom format of the date inserted into the changelog.
 * If not specified, the default date matches the `YYYY-MM-DD` pattern.
 *
 * @returns {Promise}
 */
export async function generateChangelogForSinglePackage( options = {} ) {
	const log = logger();
	const pkgJson = getPackageJson();

	logProcess( chalk.bold( `Generating changelog for "${ chalk.underline( pkgJson.name ) }"...` ) );

	const transformCommit = transformCommitFactory();

	logProcess( 'Collecting all commits since the last release...' );

	const commitOptions = {
		from: options.from ? options.from : 'v' + pkgJson.version,
		releaseBranch: options.releaseBranch
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

			const releaseType = getNewVersionType( allCommits );

			displayCommits( allCommits, { indentLevel: 1 } );

			return cli.provideVersion( pkgJson.version, releaseType, { indentLevel: 1 } );
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
				repoUrl: getRepositoryUrl(),
				currentTag: 'v' + version,
				previousTag: options.from ? options.from : 'v' + pkgJson.version,
				isPatch: semver.diff( version, pkgJson.version ) === 'patch',
				isInternalRelease,
				skipCommitsLink: Boolean( options.skipLinks ),
				skipCompareLink: Boolean( options.skipLinks ),
				date: options.formatDate ? options.formatDate( new Date() ) : changelogUtils.getFormattedDate()
			};

			const writerOptions = getWriterOptions( {
				// We do not allow modifying the commit hash value by the generator itself.
				hash: hash => hash
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

			if ( !fs.existsSync( changelogUtils.changelogFile ) ) {
				logInfo( 'Changelog file does not exist. Creating...', { isWarning: true, indentLevel: 1 } );

				changelogUtils.saveChangelog( changelogUtils.changelogHeader );
			}

			let currentChangelog = changelogUtils.getChangelog();

			// Remove header from current changelog.
			currentChangelog = currentChangelog.replace( changelogUtils.changelogHeader, '' );

			// Concat header, new and current changelog.
			let newChangelog = changelogUtils.changelogHeader + changesFromCommits + currentChangelog.trim();
			newChangelog = newChangelog.trim() + '\n';

			// Save the changelog.
			changelogUtils.saveChangelog( newChangelog );

			tools.shExec( `git add ${ changelogUtils.changelogFile }`, { verbosity: 'error' } );
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
	 * @param {String} message
	 * @param {Object} [options={}]
	 * @param {Number} [options.indentLevel=0]
	 * @param {Boolean} [options.startWithNewLine=false] Whether to append a new line before the message.
	 * @param {Boolean} [options.isWarning=false] Whether to use `warning` method instead of `log`.
	 */
	function logInfo( message, options = {} ) {
		const indentLevel = options.indentLevel || 0;
		const startWithNewLine = options.startWithNewLine || false;
		const method = options.isWarning ? 'warning' : 'info';

		log[ method ]( `${ startWithNewLine ? '\n' : '' }${ ' '.repeat( indentLevel * cli.INDENT_SIZE ) }` + message );
	}
}

/**
 * @callback FormatDateCallback
 *
 * @param {Date} now The current date.
 *
 * @returns {String} The formatted date inserted into the changelog.
 */
