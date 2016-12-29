/**
 * @license Copyright (c) 2003-2016, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

module.exports = {
	runAutomatedTests: require( './tasks/runautomatedtests' ),
	runManualTests: require( './tasks/runmanualtests' ),
	parseArguments: require( './utils/parsearguments' ),
};
