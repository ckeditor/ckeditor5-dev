/**
 * @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import {
	Converter,
	ReflectionKind,
	type Application,
	type Context,
	type Comment,
	type DeclarationReflection,
	type ParameterReflection,
	type SignatureReflection,
	type TypeParameterReflection
} from 'typedoc';

import { isReflectionValid } from '../utils/isreflectionvalid.js';
import { getPluginPriority } from '../utils/getpluginpriority.js';

type ReflectionWithComment =
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
	const reflections = context.project
		.getReflectionsByKind( ReflectionKind.All | ReflectionKind.Document )
		.filter( isReflectionValid ) as Array<ReflectionWithComment>;

	for ( const reflection of reflections ) {
		normalizeReflectionExperimentalTags( reflection );
	}
}

function normalizeReflectionExperimentalTags( reflection: ReflectionWithComment ) {
	if ( reflection.comment && shouldRemoveExperimentalModifier( reflection.comment ) ) {
		reflection.comment.removeModifier( '@experimental' );
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
