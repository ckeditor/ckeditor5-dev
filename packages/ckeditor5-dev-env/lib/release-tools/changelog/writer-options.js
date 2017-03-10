/**
 * @license Copyright (c) 2003-2017, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const fs = require( 'fs' );
const path = require( 'path' );
const chalk = require( 'chalk' );
const { logger } = require( '@ckeditor/ckeditor5-dev-utils' );
const parserOptions = require( './parser-options' );

const packageJsonMap = new Map();

// Map of available types of the commits.
// Types marked as `false` will be ignored during generating the changelog.
const availableTypes = new Map( [
	[ 'Feature', true ],
	[ 'Fix', true ],
	[ 'Other', true ],
	[ 'Code style', false ],
	[ 'Docs', false ],
	[ 'Internal', false ],
	[ 'Tests', false ],
	[ 'Revert', false ],
	[ 'Release', false ]
] );

const typesOrder = {
	'Bug fixes': 1,
	'Features': 2,
	'Other changes': 3,

	'BREAKING CHANGES': 1,
	'NOTE': 2
};

const templatePath = path.join( __dirname, 'templates' );

module.exports = {
	transform: transformCommit,
	groupBy: 'type',
	commitGroupsSort( a, b ) {
		return typesOrder[ a.title ] - typesOrder[ b.title ];
	},
	commitsSort: [ 'subject' ],
	noteGroupsSort( a, b ) {
		return typesOrder[ a.title ] - typesOrder[ b.title ];
	},
	notesSort: require( 'compare-func' ),
	mainTemplate: fs.readFileSync( path.join( templatePath, 'template.hbs' ), 'utf-8' ),
	headerPartial: fs.readFileSync( path.join( templatePath, 'header.hbs' ), 'utf-8' ),
	commitPartial: fs.readFileSync( path.join( templatePath, 'commit.hbs' ), 'utf-8' ),
	footerPartial: fs.readFileSync( path.join( templatePath, 'footer.hbs' ), 'utf-8' ),
	commitTypes: availableTypes
};

// Parses a single commit:
// - displays a log when the commit has invalid format of the message,
// - filters out the commit if it should not be visible in the changelog,
// - makes links to issues and user's profiles on GitHub.
function transformCommit( commit, displayLog = true ) {
	const log = logger( displayLog ? 'info' : 'error' );

	if ( commit.header.startsWith( 'Merge' ) ) {
		// Header for merge commit can be in "body" or "footer" of the commit message.
		const parsedHeader = parserOptions.headerPattern.exec( commit.body || commit.footer );

		if ( parsedHeader ) {
			parserOptions.headerCorrespondence.forEach( ( key, index ) => {
				commit[ key ] = parsedHeader[ index + 1 ];
			} );
		}
	}

	if ( typeof commit.hash === 'string' ) {
		commit.hash = commit.hash.substring( 0, 7 );
	}

	const hasCorrectType = availableTypes.has( commit.type );
	const isCommitIncluded = availableTypes.get( commit.type );

	let logMessage = `* ${ commit.hash } "${ commit.header }" `;

	if ( hasCorrectType && isCommitIncluded ) {
		logMessage += chalk.green( 'INCLUDED' );
	} else if ( hasCorrectType && !isCommitIncluded ) {
		logMessage += chalk.grey( 'SKIPPED' );
	} else {
		logMessage += chalk.red( 'INVALID' );
	}

	log.info( logMessage );

	if ( !isCommitIncluded ) {
		return;
	}

	const issues = [];

	commit.rawType = commit.type;
	commit.type = getCommitType( commit.type );

	if ( commit.scope === '*' ) {
		commit.scope = '';
	}

	if ( typeof commit.subject === 'string' ) {
		commit.subject = linkGithubIssues( linkGithubUsers( commit.subject ), issues );
	}

	for ( const note of commit.notes ) {
		if ( note.title === 'BREAKING CHANGE' ) {
			note.title = 'BREAKING CHANGES';
		}
		note.text = linkGithubIssues( linkGithubUsers( note.text ) );
	}

	// Removes references that already appear in the subject.
	commit.references = commit.references.filter( ( reference ) => {
		return issues.indexOf( reference.issue ) === -1;
	} );

	return commit;
}

function linkGithubUsers( value ) {
	return value.replace( /@([\w\d_-]+)/g, '[@$1](https://github.com/$1)' );
}

function linkGithubIssues( value, issues = null ) {
	const packageJson = getPackageJson();
	const issuesUrl = ( typeof packageJson.bugs === 'object' ) ? packageJson.bugs.url : packageJson.bugs;

	return value.replace( /#([0-9]+)/g, ( _, issueId ) => {
		if ( issues ) {
			issues.push( issueId );
		}

		return `[#${ issueId }](${ issuesUrl }/${ issueId })`;
	} );
}

function getCommitType( commit ) {
	switch ( commit ) {
		case 'Feature':
			return 'Features';

		case 'Fix':
			return 'Bug fixes';

		case 'Other':
			return 'Other changes';

		default:
			throw new Error( `Given invalid type of commit ("${ commit }").` );
	}
}

function getPackageJson() {
	const cwd = process.cwd();

	if ( !packageJsonMap.has( cwd ) ) {
		const loadPackageJson = require( '../utils/getpackagejson' );

		packageJsonMap.set( cwd, loadPackageJson() );
	}

	return packageJsonMap.get( cwd );
}
