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

	// Template files to copy.
	// Object key represents path to template file, relative to location of this file.
	// Object values are destination paths, relative to new repository root.
	const fileStructure = {
		'../../../.editorconfig': '.editorconfig',
		'../../../.jscsrc': '.jscsrc',
		'../../../.gitattributes': '.gitattributes',
		'templates/.jshintrc': '.jshintrc',
		'templates/.gitignore_template': '.gitignore',
		'templates/CHANGES.md': 'CHANGES.md',
		'templates/CONTRIBUTING.md': 'CONTRIBUTING.md',
		'templates/gulpfile.js': 'gulpfile.js',
		'templates/LICENSE.md': 'LICENSE.md',
		'templates/package.json': 'package.json',
		'templates/README.md': 'README.md',
		'templates/tests/.jshintrc': 'tests/.jshintrc'
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
			const replace = {
				'{{AppName}}': packageFullName,
				'{{GitHubRepositoryPath}}': gitHubPath,
				'{{ProjectDescription}}': packageDescription
			};

			log.out( `Initializing repository ${ repositoryPath }...` );
			git.initializeRepository( repositoryPath );

			log.out( `Adding remote ${ repositoryPath }...` );
			git.addRemote( repositoryPath, gitHubPath );

			log.out( `Copying files into ${ repositoryPath }...` );

			for ( let file in fileStructure ) {
				const source = path.resolve( __dirname, file );
				const destination = path.join( repositoryPath, fileStructure[ file ] );

				tools.copyTemplateFile(
					source,
					destination,
					replace
				);
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
