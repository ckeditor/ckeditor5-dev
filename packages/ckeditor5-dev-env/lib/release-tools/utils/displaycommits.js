const chalk = require( 'chalk' );
const { logger } = require( '@ckeditor/ckeditor5-dev-utils' );
const utils = require( './transform-commit/transform-commit-utils' );

// A size of indent for a log. The number is equal to length of the log string:
// '* 1234567 ', where '1234567' is a short commit id.
const INDENT_SIZE = 10;

module.exports = function displayCommits( commits ) {
	const log = logger();

	if ( !commits.length ) {
		log.info( chalk.italic( 'No commits to display.' ) );
	}

	for ( const singleCommit of commits ) {
		const hasCorrectType = utils.availableCommitTypes.has( singleCommit.rawType );
		const isCommitIncluded = utils.availableCommitTypes.get( singleCommit.rawType );

		let logMessage = `* ${ chalk.yellow( singleCommit.hash ) } "${ utils.truncate( singleCommit.header, 100 ) }" `;

		if ( hasCorrectType && isCommitIncluded ) {
			logMessage += chalk.green( 'INCLUDED' );
		} else if ( hasCorrectType && !isCommitIncluded ) {
			logMessage += chalk.grey( 'SKIPPED' );
		} else {
			logMessage += chalk.red( 'INVALID' );
		}

		// Avoid displaying singleCommit merge twice.
		if ( singleCommit.merge && singleCommit.merge !== singleCommit.header ) {
			logMessage += `\n${ ' '.repeat( INDENT_SIZE ) }${ chalk.italic( singleCommit.merge ) }`;
		}

		log.info( logMessage );
	}
};
