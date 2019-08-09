/**
 * @license Copyright (c) 2003-2019, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

/**
 * Creates content for the `mrgit.json` file based on the `package.json` dependencies.
 *
 * @param {Object} packageJson Parsed package.json.
 * @param {Object} [options]
 * @param {String} options.name The name of the package that `options.commit` or `options.repository` will be modified.
 * @param {String} options.commit The specified commit.
 * @param {String} options.repository The specified repository.
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

	// Do not modify value of the repository if specified package belongs to our ecosystem.
	if ( options.repository === mrgitJson.dependencies[ options.packageName ] ) {
		delete options.repository;
	}

	// If `options.repository` is defined, use that value as a repository that should be cloned.
	const repository = options.repository ? options.repository : mrgitJson.dependencies[ options.packageName ];

	// If `options.commit` is defined, use that value as a commit which cloned repository should be checked out.
	const commit = options.commit ? '#' + options.commit : '';

	// If the package is defined, let's modify those values.
	if ( mrgitJson.dependencies[ options.packageName ] ) {
		mrgitJson.dependencies[ options.packageName ] = repository + commit;
	}

	return mrgitJson;
};

function isHashedDependency( dependency ) {
	return dependency.match( /#[0-9a-f]+$/ );
}
