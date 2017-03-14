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
module.exports = function getToken() {
	return inquirer.prompt( [ {
		type: 'password',
		message: 'Provide the Transifex token (generate it here: https://www.transifex.com/user/settings/api/):',
		name: 'token'
	} ] );
};
