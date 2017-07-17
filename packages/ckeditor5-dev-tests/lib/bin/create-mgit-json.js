/**
 * @license Copyright (c) 2003-2017, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

module.exports = function createMgitJson( packageJson ) {
	const mgitJson = {
		dependencies: {}
	};

	const dependencies = Object.assign( {}, packageJson.dependencies, packageJson.devDependencies );

	if ( !Object.keys( dependencies ).length ) {
		return null;
	}

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

		if ( isPathToGitRepoHashVersion( dependencyVersion ) ) {
			mgitJson.dependencies[ dependencyName ] = dependencyVersion;
		} else {
			mgitJson.dependencies[ dependencyName ] = dependencyName.slice( 1 );
		}
	}

	return mgitJson;
};

function isPathToGitRepoHashVersion( dependency ) {
	return (
		dependency.match( /^(git@github.com:)[\w-]+(\/[\w-]+)?\.git#[0-9a-f]+$/ ) ||
		dependency.match( /^[\w-]+(\/[\w-]+)?#[0-9a-f]+$/ )
	);
}
