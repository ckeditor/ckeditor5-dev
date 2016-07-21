/* jshint node: true, esnext: true */

'use strict';

const gulp = require( 'gulp' );
const istanbul = require( 'gulp-istanbul' );
const mocha = require( 'gulp-mocha' );
const chai = require( 'chai' );
const sinon = require( 'sinon' );
const buildUtils = require( 'ckeditor5-dev-utils' ).build;

/**
 * Defines Node.js testing task and development tools testing tasks.
 *
 * To run tests:
 *
 * 		gulp test
 *
 * To run tests with coverage:
 *
 * 		gulp test:coverage
 */
module.exports = () => {
	// Inject globals before running tests.
	global.should = chai.should;
	global.expect = chai.expect;
	global.assert = chai.assert;
	global.sinon = sinon;

	const tasks = {
		/**
		 * Is set to `true` when code coverage report will be displayed.
		 *
		 * @type {Boolean}
		 */
		coverage: false,

		/**
		 * Runs dev unit tests.
		 *
		 * @returns {Stream}
		 */
		test() {
			return gulp.src( 'tests/**/*.js' )
				.pipe( mocha() )
				.pipe( tasks.coverage ? istanbul.writeReports() : buildUtils.noop() );
		},

		/**
		 * Prepares files for coverage report.
		 *
		 * @returns {Stream}
		 */
		prepareCoverage() {
			tasks.coverage = true;

			return gulp.src( 'tasks/**/*.js' )
				.pipe( istanbul() )
				.pipe( istanbul.hookRequire() );
		}
	};

	return tasks;
};
