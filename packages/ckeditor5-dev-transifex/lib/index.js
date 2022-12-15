/**
 * @license Copyright (c) 2003-2022, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const createPotFiles = require( './createpotfiles' );
const uploadPotFiles = require( './upload' );
const downloadTranslations = require( './download' );
const getToken = require( './gettoken' );

module.exports = {
	createPotFiles,
	uploadPotFiles,
	downloadTranslations,
	getToken
};
