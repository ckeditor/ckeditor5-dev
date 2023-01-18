/**
 * @license Copyright (c) 2003-2023, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

module.exports = {
	runAutomatedTests: require( './tasks/runautomatedtests' ),
	runManualTests: require( './tasks/runmanualtests' ),
	parseArguments: require( './utils/automated-tests/parsearguments' )
};
