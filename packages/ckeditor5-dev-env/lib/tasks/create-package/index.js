/**
 * @license Copyright (c) 2003-2016, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const inquiries = require( '../../utils/inquiries' );
const path = require( 'path' );
const { git, tools, log } = require( 'ckeditor5-dev-utils' );

/**
 * 1. Ask for new package name.
 * 2. Ask for initial version.
 * 3. Ask for GitHub path.
 * 4. Initialize repository.
 * 5. Add remote.
 * 6. Copy files to new repository.
 * 7. Update package.json file in new package's repository.
 * 8. Update package.json file in CKEditor5 repository.
 * 9. Create initial commit.
 * 10. Link new package.
 * 11. Call `npm install` in package repository.
 *
 * @param {String} ckeditor5Path Path to main CKEditor5 repository.
 * @param {String} workspaceRoot Relative path to workspace root.
 * @returns {Promise} Returns promise fulfilled after task is done.
 */
module.exports = ( ckeditor5Path, workspaceRoot ) => {
	const workspaceAbsolutePath = path.join( ckeditor5Path, workspaceRoot );

	// Template files are represented by paths relative to this file location.
	const fileStructure = {
		'./': [
			'../../../.editorconfig',
			'../../../.jscsrc',
			'../../../.gitattributes',
			'templates/.jshintrc',
			{ filePath: 'templates/.gitignore_template', renameTo: '.gitignore' },
			'templates/CHANGES.md',
			'templates/CONTRIBUTING.md',
			'templates/gulpfile.js',
			'templates/LICENSE.md',
			'templates/package.json',
			'templates/README.md'
		],
		'tests/': [
			'templates/tests/.jshintrc'
		]
	};

	let packageName;
	let packageFullName;
	let repositoryPath;
	let packageVersion;
	let gitHubPath;
	let packageDescription;

	return inquiries.getPackageName()
		.then( result => {
			packageName = result;
			repositoryPath = path.join( workspaceAbsolutePath, packageName );

			return inquiries.getApplicationName();
		} )
		.then( result => {
			packageFullName = result;

			return inquiries.getPackageVersion();
		} )
		.then( result => {
			packageVersion = result;

			return inquiries.getPackageGitHubPath( packageName );
		} )
		.then( result => {
			gitHubPath = result;

			return inquiries.getPackageDescription();
		} )
		.then( result => {
			packageDescription = result;

			log.out( `Initializing repository ${ repositoryPath }...` );
			git.initializeRepository( repositoryPath );

			log.out( `Adding remote ${ repositoryPath }...` );
			git.addRemote( repositoryPath, gitHubPath );

			log.out( `Copying files into ${ repositoryPath }...` );

			for ( let destination in fileStructure ) {
				// Create absolute paths for template files.
				fileStructure[ destination ] = fileStructure[ destination ].map( ( src ) => {
					if ( typeof src == 'object' ) {
						src.filePath = path.resolve( __dirname, src.filePath );

						return src;
					}

					return path.resolve( __dirname, src );
				} );

				tools.copyTemplateFiles(
					fileStructure[ destination ],
					path.join( repositoryPath, destination ), {
					'{{AppName}}': packageFullName,
					'{{GitHubRepositoryPath}}': gitHubPath,
					'{{ProjectDescription}}': packageDescription
				} );
			}

			log.out( `Updating package.json files...` );
			tools.updateJSONFile( path.join( repositoryPath, 'package.json' ), ( json ) => {
				json.name = packageName;
				json.version = packageVersion;
				json.description = packageDescription;

				return json;
			} );

			tools.updateJSONFile( path.join( ckeditor5Path, 'package.json' ), ( json ) => {
				if ( !json.dependencies ) {
					json.dependencies = {};
				}
				json.dependencies[ packageName ] = gitHubPath;
				json.dependencies = tools.sortObject( json.dependencies );

				return json;
			} );

			log.out( `Creating initial commit...` );
			git.initialCommit( packageName, repositoryPath );

			log.out( `Linking ${ packageName } to node_modules...` );
			tools.linkDirectories( repositoryPath, path.join( ckeditor5Path, 'node_modules', packageName ) );

			log.out( `Running npm install in ${ packageName }.` );
			tools.npmInstall( repositoryPath );
		} );
};
