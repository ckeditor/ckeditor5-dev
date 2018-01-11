/**
 * @license Copyright (c) 2003-2018, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

module.exports = {
	runAutomatedTests: require( './tasks/runautomatedtests' ),
	runManualTests: require( './tasks/runmanualtests' ),
	parseArguments: require( './utils/automated-tests/parsearguments' ),
};
