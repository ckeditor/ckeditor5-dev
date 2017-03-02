/**
 * @license Copyright (c) 2003-2017, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const inquirer = require( 'inquirer' );

/**
 * Takes username and password from prompt and returns promise that resolves with object that contains them.
 *
 * @returns {Promise.<Object>}
 */
module.exports = function getCredentials() {
	return inquirer.prompt( [ {
		type: 'input',
		message: 'Provide Transifex username',
		name: 'username'
	}, {
		type: 'password',
		message: 'Provide Transifex password',
		name: 'password'
	} ] );
};
