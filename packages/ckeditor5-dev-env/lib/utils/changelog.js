/**
 * @license Copyright (c) 2003-2016, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const fs = require( 'fs' );
const path = require( 'path' );

const utils = {
	/**
	 * Changelog file name.
	 */
	changelogFile: 'CHANGES.md',

	/**
	 * Changelog header.
	 */
	changelogHeader: `Changelog\n=========\n\n`,

	/**
	 * Returns a type (major, minor, patch) of the next release based on commits.
	 *
	 * @returns {Promise}
	 */
	getNewReleaseType() {
		const conventionalRecommendedBump = require( 'conventional-recommended-bump' );
		const parserOpts = require( '../changelog/parser-opts' );

		return new Promise( ( resolve, reject ) => {
			const options = {
				whatBump: utils.getNewVersionType
			};

			conventionalRecommendedBump( options, parserOpts, ( err, response ) => {
				if ( err ) {
					return reject( err );
				}

				return resolve( response );
			} );
		} );
	},

	/**
	 * Returns version of current package.
	 *
	 * @param {String} [cwd=process.cwd()] Current work directory.
	 * @returns {String}
	 */
	getCurrentVersion( cwd = process.cwd() ) {
		const packageJSON = require( path.resolve( cwd, 'package.json' ) );

		return `v${ packageJSON.version }`;
	},

	/**
	 * Returns number of the next version.
	 *
	 * @param {String} currentVersion Current version in format "X.Y.Z".
	 * @param {String} releaseType Type of the next release.
	 * @returns {String}
	 */
	getNextVersion( currentVersion, releaseType ) {
		if ( currentVersion.startsWith( 'v' ) ) {
			currentVersion = currentVersion.slice( 1 );
		}

		const version = currentVersion.split( '.' ).map( ( n ) => parseInt( n ) );

		if ( releaseType === 'major' ) {
			return `${ version[ 0 ] + 1 }.0.0`;
		} else if ( releaseType === 'minor' ) {
			return `${ version[ 0 ] }.${ version[ 1 ] + 1 }.0`;
		}

		return `${ version[ 0 ] }.${ version[ 1 ] }.${ version[ 2 ] + 1 }`;
	},

	/**
	 * Returns a level which represents a type of release based on the commits.
	 *   - 0: major,
	 *   - 1: minor,
	 *   - 2: patch.
	 *
	 * An input array is a result of module {@link https://github.com/conventional-changelog/conventional-commits-parser}.
	 *
	 * @param {Array} commits
	 * @returns {Number}
	 */
	getNewVersionType( commits ) {
		let hasNewFeatures = false;

		for ( const item of commits ) {
			for ( const note of item.notes ) {
				if ( note.title === 'BREAKING CHANGE' ) {
					return 0;
				}
			}

			if ( !hasNewFeatures && item.type === 'Feature' ) {
				hasNewFeatures = true;
			}
		}

		return hasNewFeatures ? 1 : 2;
	},

	/**
	 * Parses command line arguments and returns them as a user-friendly hash.
	 *
	 * @returns {Object} options
	 * @returns {String} options.token GitHub token used to authenticate.
	 * @returns {Boolean} options.init Whether to create first release using this package.
	 * @returns {Boolean} options.debug Whether to show additional logs.
	 */
	parseArguments( args = process.argv.slice( 2 ) ) {
		const options = require( 'minimist' )( args, {
			string: [
				'token'
			],

			boolean: [
				'init',
				'debug'
			],

			default: {
				init: false,
				debug: false
			}
		} );

		delete options._;

		return options;
	},

	/**
	 * Returns all changes between `currentTag` and `previousTag`.
	 *
	 * If `previousTag` is null, returns the whole file (first release).
	 *
	 * @param {String} currentTag
	 * @param {String|null} previousTag
	 * @returns {Promise}
	 */
	getLatestChangesFromChangelog( currentTag, previousTag ) {
		currentTag = currentTag.replace( /^v/, '' );

		return utils.getCurrentChangelog()
			.then( ( changelog ) => {
				changelog = changelog.replace( utils.changelogHeader, '' );

				if ( previousTag ) {
					previousTag = previousTag.replace( /^v/, '' );

					changelog = changelog.match( new RegExp( `(## \\[${ currentTag }\\][\\w\\W]+)## \\[?${ previousTag }\\]?` ) )[ 1 ];
				}

				changelog = changelog.replace( new RegExp( `^## \\[?${ currentTag }\\]?.*` ), '' ).trim();

				return Promise.resolve( changelog );
			} );
	},

	/**
	 * @returns {Promise}
	 */
	getCurrentChangelog() {
		const changelogFile = path.resolve( utils.changelogFile );

		return new Promise( ( resolve, reject ) => {
			fs.readFile( changelogFile, 'utf-8', ( err, content ) => {
				if ( err ) {
					return reject( err );
				}

				resolve( content );
			} );
		} );
	},

	/**
	 * @param {String} content
	 * @returns {Promise}
	 */
	saveChangelog( content ) {
		const changelogFile = path.resolve( utils.changelogFile );

		return new Promise( ( resolve, reject ) => {
			fs.writeFile( changelogFile, content, ( err ) => {
				if ( err ) {
					return reject( err );
				}

				resolve();
			} );
		} );
	},

	/**
	 * Create a Github release.
	 *
	 * @param {String} token Token used to authenticate with GitHub.
	 * @param {Object} options
	 * @param {String} options.repositoryOwner Owner of the repository.
	 * @param {String} options.repositoryName Repository name.
	 * @param {String} options.version Name of tag connected with the release.
	 * @param {String} options.description Description of the release.
	 * @param {String} options.debug Whether to display additional logs.
	 * @returns {Promise}
	 */
	createGithubRelease( token, options ) {
		const GitHubApi = require( 'github' );

		const github = new GitHubApi( {
			version: '3.0.0',
			debug: options.debug
		} );

		github.authenticate( {
			token,
			type: 'oauth',
		} );

		// jscs:disable requireCamelCaseOrUpperCaseIdentifiers
		const releaseParams = {
			owner: options.repositoryOwner,
			repo: options.repositoryName,
			tag_name: options.version,
			body: options.description
		};
		// jscs:eanble requireCamelCaseOrUpperCaseIdentifiers

		return new Promise( ( resolve, reject ) => {
			github.repos.createRelease( releaseParams, ( err, responses ) => {
				if ( err ) {
					return reject( err );
				}

				resolve( responses );
			} );
		} );
	}
};

module.exports = utils;
