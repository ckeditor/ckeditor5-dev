/**
 * @license Copyright (c) 2003-2019, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

/**
 * Creates content for the `mrgit.json` file based on the `package.json` dependencies.
 *
 * @param {Object} packageJson Parsed package.json.
 * @param {Object} [options]
 * @param {String} options.name The name of package that `options.commit` will be specified as a version to check out.
 * @param {String} options.commit The specified commit.
 */
module.exports = function createMrGitJsonContent( packageJson, options ) {
	const mrgitJson = {
		packages: 'packages/',
		dependencies: {}
	};

	const dependencies = Object.assign( {}, packageJson.dependencies, packageJson.devDependencies );

	for ( const dependencyName in dependencies ) {
		const dependencyVersion = dependencies[ dependencyName ];

		if (
			!dependencyName.startsWith( '@ckeditor/ckeditor5' ) &&
			!dependencyVersion.includes( 'cksource/ckeditor' )
		) {
			continue;
		}

		if ( dependencyName.includes( '/ckeditor5-dev' ) ) {
			continue;
		}

		if ( isHashedDependency( dependencyVersion ) ) {
			mrgitJson.dependencies[ dependencyName ] = dependencyVersion;
		} else {
			// Removes '@' from the scoped npm package name.
			mrgitJson.dependencies[ dependencyName ] = dependencyName.slice( 1 );
		}
	}

	if ( !options ) {
		return mrgitJson;
	}

	// For testing package we need to use a specified commit instead of the latest master.
	if ( mrgitJson.dependencies[ options.packageName ] ) {
		mrgitJson.dependencies[ options.packageName ] = mrgitJson.dependencies[ options.packageName ] + '#' + options.commit;
	}

	return mrgitJson;
};

function isHashedDependency( dependency ) {
	return dependency.match( /#[0-9a-f]+$/ );
}
