/**
 * @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import {
	Converter,
	type Application,
	type Context,
	type Comment,
	type DeclarationReflection,
	type ParameterReflection,
	type ProjectReflection,
	type SignatureReflection,
	type TypeParameterReflection
} from 'typedoc';

import { getPluginPriority } from '../utils/getpluginpriority.js';

type ReflectionWithComment =
	ProjectReflection |
	DeclarationReflection |
	SignatureReflection |
	ParameterReflection |
	TypeParameterReflection;

/**
 * The `typedoc-plugin-experimental-tag-fixer` removes cascaded `@experimental` modifier tags
 * from reflections that do not define an explicit experimental notice.
 */
export function typeDocExperimentalTagFixer( app: Application ): void {
	app.converter.on( Converter.EVENT_END, onEventEnd, getPluginPriority( typeDocExperimentalTagFixer.name ) );
}

function onEventEnd( context: Context ) {
	normalizeReflectionExperimentalTags( context.project );
}

function normalizeReflectionExperimentalTags( reflection: ReflectionWithComment ) {
	if ( reflection.comment && shouldRemoveExperimentalModifier( reflection.comment ) ) {
		reflection.comment.removeModifier( '@experimental' );
	}

	for ( const childReflection of getChildReflections( reflection ) ) {
		normalizeReflectionExperimentalTags( childReflection );
	}
}

function shouldRemoveExperimentalModifier( comment: Comment ): boolean {
	if ( !comment.hasModifier( '@experimental' ) ) {
		return false;
	}

	return !hasExplicitExperimentalNotice( comment );
}

function hasExplicitExperimentalNotice( comment: Comment ): boolean {
	for ( const part of comment.summary ) {
		if ( part.kind === 'text' && part.text.includes( 'Experimental:' ) ) {
			return true;
		}
	}

	return false;
}

function getChildReflections( reflection: ReflectionWithComment ): Array<ReflectionWithComment> {
	const childReflections: Array<ReflectionWithComment> = [];

	if ( 'children' in reflection && reflection.children ) {
		childReflections.push( ...( reflection.children as Array<ReflectionWithComment> ) );
	}

	if ( 'signatures' in reflection && reflection.signatures ) {
		childReflections.push( ...( reflection.signatures as Array<ReflectionWithComment> ) );
	}

	if ( 'parameters' in reflection && reflection.parameters ) {
		childReflections.push( ...( reflection.parameters as Array<ReflectionWithComment> ) );
	}

	if ( 'typeParameters' in reflection && reflection.typeParameters ) {
		childReflections.push( ...( reflection.typeParameters as Array<ReflectionWithComment> ) );
	}

	if ( 'ckeditor5Events' in reflection && reflection.ckeditor5Events ) {
		childReflections.push( ...( reflection.ckeditor5Events as Array<ReflectionWithComment> ) );
	}

	if ( 'getSignature' in reflection && reflection.getSignature ) {
		childReflections.push( reflection.getSignature as ReflectionWithComment );
	}

	if ( 'setSignature' in reflection && reflection.setSignature ) {
		childReflections.push( reflection.setSignature as ReflectionWithComment );
	}

	return childReflections;
}
