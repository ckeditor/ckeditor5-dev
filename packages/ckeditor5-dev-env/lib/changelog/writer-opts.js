/**
 * @license Copyright (c) 2003-2016, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const path = require( 'path' );
const fs = require( 'fs' );
const { logger } = require( '@ckeditor/ckeditor5-dev-utils' );

// Map of available types of the commits.
// Types marked as `false` will be ignored during generate the changelog.
const availableTypes = new Map( [
	[ 'Feature', true ],
	[ 'Fix', true ],
	[ 'Enhancement', true ],
	[ 'Internal Feature', false ],
	[ 'Internal Fix', false ],
	[ 'Internal Enhancement', false ],
	[ 'Docs', false ],
	[ 'Tests', false ],
	[ 'Revert', false ],
	[ 'Release', false ],
] );

const packageJSON = require( path.resolve( process.cwd(), 'package.json' ) );

const templatePath = path.resolve( __dirname, 'templates' );

const log = logger();
const logOptions = { raw: true };

module.exports = {
	transform: transformCommit,
	groupBy: 'type',
	commitGroupsSort: 'title',
	commitsSort: [ 'subject' ],
	noteGroupsSort: 'title',
	notesSort: require( 'compare-func' ),
	mainTemplate: fs.readFileSync( path.join( templatePath, 'template.hbs' ), 'utf-8' ),
	headerPartial: fs.readFileSync( path.join( templatePath, 'header.hbs' ), 'utf-8' ),
	commitPartial: fs.readFileSync( path.join( templatePath, 'commit.hbs' ), 'utf-8' ),
	footerPartial: fs.readFileSync( path.join( templatePath, 'footer.hbs' ), 'utf-8' )
};

function transformCommit( commit ) {
	const issues = [];

	if ( !availableTypes.has( commit.type ) ) {
		log.warning( `Skipped commit "${ commit.hash }" because contains invalid format of the message.`, logOptions );
		log.info( commit.header, logOptions );

		return;
	}

	if ( !availableTypes.get( commit.type ) ) {
		return;
	}

	commit.type = getCommitType( commit.type );

	if ( commit.scope === '*' ) {
		commit.scope = '';
	}

	if ( typeof commit.hash === 'string' ) {
		commit.hash = commit.hash.substring( 0, 7 );
	}

	if ( typeof commit.subject === 'string' ) {
		commit.subject = linkGithubIssues( linkGithubUsers( commit.subject ), issues );
	}

	for ( const note of commit.notes ) {
		note.text = linkGithubIssues( linkGithubUsers( note.text ) );
	}

	// Removes references that already appear in the subject.
	commit.references = commit.references.filter( ( reference ) => {
		return issues.indexOf( reference.issue ) === -1;
	} );

	return commit;
}

function linkGithubUsers( value ) {
	return value.replace( /@([a-zA-Z0-9_]+)/g, '[@$1](https://github.com/$1)' );
}

function linkGithubIssues( value, issues = null ) {
	return value.replace( /#([0-9]+)/g, ( _, issueId ) => {
		if ( issues ) {
			issues.push( issueId );
		}

		return `[#${ issueId }](${ packageJSON.bugs }/${ issueId })`;
	} );
}

function getCommitType( commit ) {
	switch ( commit ) {
		case 'Feature':
			return 'Features';

		case 'Fix':
			return 'Bug Fixes';

		case 'Enhancement':
			return 'Enhancements';

		default:
			throw new Error( `Given invalid type of commit ("${ commit }").` );
	}
}
