/**
 * @license Copyright (c) 2003-2023, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const assign = Object.assign;

/**
 * @param {Array.<Doclet>} doclets
 */
function convertShortRefsToFullRefs( doclets ) {
	addMissingModulePart( doclets );
	convertShortRefsInLongnameAndMemberof( doclets );
	convertShortRefsInFireTag( doclets );
	convertShortRefsInSeeTag( doclets );
	convertShortRefsInLinks( doclets );
}

/** @param {Array.<Doclet>} doclets */
function addMissingModulePart( doclets ) {
	/** @type {Record<String,Doclet>} */
	const fileNameModuleDoclets = {};

	for ( const doclet of doclets ) {
		if ( doclet.kind === 'module' ) {
			fileNameModuleDoclets[ doclet.meta.path + '/' + doclet.meta.filename ] = doclet;
		}
	}

	for ( const doclet of doclets ) {
		if ( [ 'interface', 'class', 'mixin' ].includes( doclet.kind ) ) {
			if (
				!doclet.longname.startsWith( 'module:' ) &&
				fileNameModuleDoclets[ doclet.meta.path + '/' + doclet.meta.filename ]
			) {
				const module = fileNameModuleDoclets[ doclet.meta.path + '/' + doclet.meta.filename ];

				assign( doclet, {
					scope: 'inner',
					memberof: module.longname,
					longname: module.longname + '~' + doclet.longname
				} );
			}
		}
	}
}

/** @param {Array.<Doclet>} doclets */
function convertShortRefsInLongnameAndMemberof( doclets ) {
	const fileDoclets = groupDocletsByFiles( doclets );

	for ( const doclet of doclets ) {
		const parentDoclet = getCorrespondingParent( fileDoclets[ doclet.meta.path + '/' + doclet.meta.filename ], doclet );

		const firstNameChar = doclet.longname[ 0 ];

		if ( firstNameChar === '~' ) {
			assign( doclet, {
				memberof: parentDoclet.memberof + '~' + parentDoclet.name,
				longname: parentDoclet.memberof + doclet.longname
			} );
		} else if ( firstNameChar === '#' ) {
			assign( doclet, {
				memberof: parentDoclet.longname,
				longname: parentDoclet.longname + doclet.longname
			} );
		}

		// Fixes longname in events containing ':' in their names (e.g. change:attribute)
		if ( doclet.kind === 'event' ) {
			if ( doclet.longname.includes( '~' ) && doclet.longname.includes( '#' ) ) {
				continue;
			}

			doclet.memberof = parentDoclet.longname;

			if ( !doclet.name.includes( 'event' ) ) {
				doclet.longname = parentDoclet.longname + '#event:' + doclet.name;
			} else {
				doclet.longname = parentDoclet.longname + '#' + doclet.name;
			}
		}
	}
}

/** @param {Array.<Doclet>} doclets */
function convertShortRefsInFireTag( doclets ) {
	for ( const doclet of doclets ) {
		if ( !doclet.fires ) {
			continue;
		}

		doclet.fires = doclet.fires.map( event => {
			if ( event.includes( 'module:' ) ) {
				return event;
			}

			if ( !event.includes( 'event:' ) ) {
				event = 'event:' + event;
			}

			if ( doclet.memberof.includes( '~' ) ) {
				return doclet.memberof + '#' + event;
			}

			return doclet.longname + '#' + event;
		} );
	}
}

/** @param {Array.<Doclet>} doclets */
function convertShortRefsInSeeTag( doclets ) {
	/** @type {Doclet} */
	let lastInterfaceOrClass;

	for ( const doclet of doclets ) {
		if ( [ 'interface', 'class', 'mixin' ].includes( doclet.kind ) ) {
			lastInterfaceOrClass = doclet;
		}

		if ( !doclet.see ) {
			continue;
		}

		doclet.see = doclet.see.map( see => {
			if ( see[ 0 ] === '#' ) {
				return lastInterfaceOrClass.longname + see;
			}

			if ( see[ 0 ] === '~' ) {
				return lastInterfaceOrClass.memberof + see;
			}

			return see;
		} );
	}
}

function convertShortRefsInLinks( doclets ) {
	const fileDoclets = groupDocletsByFiles( doclets );

	for ( const doclet of doclets ) {
		const parentDoclet = getCorrespondingParent( fileDoclets[ doclet.meta.path + '/' + doclet.meta.filename ], doclet );

		let memberof = doclet.memberof;

		// Errors have their own module 'module/errors'.
		// Shortened links in error descriptions should link to the class items, not the error module.
		if ( doclet.kind === 'error' && parentDoclet ) {
			memberof = parentDoclet.longname;
		}

		const linkRegExp = /{@link *([~#][^}]+)}/g;
		const replacer = ( _fullLink, linkContent ) => {
			const [ ref, ...linkDescription ] = linkContent.split( ' ' );
			const [ className, methodName ] = ref.split( '#' );

			let result = '{@link ' + memberof;

			if ( !memberof.includes( className ) ) {
				return result + linkContent + '}';
			}

			if ( methodName ) {
				result += '#' + methodName;
			}

			result += linkDescription.map( word => ' ' + word ).join( ' ' );

			return result + '}';
		};

		const comment = doclet.comment.replace( linkRegExp, replacer );

		let description = doclet.description;

		if ( description ) {
			description = doclet.description.replace( linkRegExp, replacer );
		}

		Object.assign( doclet, { comment, description } );
	}
}

/**
 * @param {Array.<Doclet>} doclets
 */
function groupDocletsByFiles( doclets ) {
	/** @type {Record.<String,Array.<Doclet>>}*/
	const files = {};

	for ( const doclet of doclets ) {
		if ( !files[ doclet.meta.path + '/' + doclet.meta.filename ] ) {
			files[ doclet.meta.path + '/' + doclet.meta.filename ] = [];
		}

		files[ doclet.meta.path + '/' + doclet.meta.filename ].push( doclet );
	}

	return files;
}

/**
 * Finds within the same file the parent doclet (`class`, `interface` or `mixin`).
 *
 * @param {Array.<Doclet>} fileDoclets
 * @param {Doclet} doclet
*/
function getCorrespondingParent( fileDoclets, doclet ) {
	let closestParent = null;
	let closestLine = -1;

	for ( const fileDoclet of fileDoclets ) {
		if ( [ 'interface', 'class', 'mixin' ].includes( fileDoclet.kind ) ) {
			if ( fileDoclet.meta.lineno > closestLine && fileDoclet.meta.lineno <= doclet.meta.lineno ) {
				closestParent = fileDoclet;
				closestLine = fileDoclet.meta.lineno;
			}
		}
	}

	return closestParent;
}

module.exports = convertShortRefsToFullRefs;
