/**
 * @license Copyright (c) 2003-2023, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const inquirer = require( 'inquirer' );

/**
 * Takes username and password from prompt and returns promise that resolves with object that contains them.
 *
 * @returns {Promise.<String>}
 */
module.exports = async function getToken() {
	const { token } = await inquirer.prompt( [ {
		type: 'password',
		message: 'Provide the Transifex token (generate it here: https://www.transifex.com/user/settings/api/):',
		name: 'token'
	} ] );

	return token;
};
