/**
 * @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { posix } from 'node:path';
import { readFileSync } from 'node:fs';
import { parse, serialize } from 'parse5';
import {
	appendChild,
	getAttribute,
	getTextContent,
	hasAttribute,
	isElementNode,
	query,
	removeAttribute,
	removeNode,
	setAttribute,
	setTextContent,
	type ChildNode,
	type Element,
	type Node,
	type ParentNode
} from '@parse5/tools';
import { loadRenderedInstructions } from './parse-markdown.js';
import type { ManualData, ManualPageEntry } from './types.js';

export interface CreateManualShellHtmlOptions {
	entry: ManualPageEntry;
	html: string;
	shellScriptPublicPath: string;
	shellTemplateFilePath: string;
	workspaceRoot: string;
}

export function createManualShellHtml( {
	entry,
	html,
	shellScriptPublicPath,
	shellTemplateFilePath,
	workspaceRoot
}: CreateManualShellHtmlOptions ): string {
	// Elements from shell template.
	const shellHtml = readFileSync( shellTemplateFilePath, 'utf8' );
	const shellDocument = parse( shellHtml );
	const shellHead = getRequiredElementByTagName( shellDocument, 'head' );
	const shellBody = getRequiredElementByTagName( shellDocument, 'body' );
	const shellTitle = getRequiredElementByTagName( shellHead, 'title' );
	const shellDataElement = query<Element>( shellBody, candidate => {
		return isElementNode( candidate ) && getAttribute( candidate, 'id' ) == 'manual-shell-data';
	} )!;
	const shellScriptElement = getRequiredElementByAttribute( shellHead, 'data-manual-shell-script' );

	// Elements from manual page.
	const manualDocument = parse( html );
	const manualHead = getRequiredElementByTagName( manualDocument, 'head' );
	const manualBody = getRequiredElementByTagName( manualDocument, 'body' );
	const manualTitle = findChildElement( manualHead, 'title' );

	const testScriptElement = getRequiredElementByAttribute( shellHead, 'data-manual-test-script' );
	const testScriptFileName = posix.basename( entry.scriptFilePath );

	setTextContent( shellTitle, ( manualTitle ? getTextContent( manualTitle ) : '' ).trim() || entry.displayName );
	setAttribute( shellScriptElement, 'src', shellScriptPublicPath );
	removeAttribute( shellScriptElement, 'data-manual-shell-script' );
	setAttribute( testScriptElement, 'src', `./${ testScriptFileName }` );
	removeAttribute( testScriptElement, 'data-manual-test-script' );
	setTextContent( shellDataElement, stringifyHtmlScriptData( createManualData( entry, workspaceRoot ) ) );
	appendChildren( shellHead, manualHead.childNodes.filter( shouldMoveManualHeadNode ) );
	appendChildren( shellBody, [ ...manualBody.childNodes ] );

	return serialize( shellDocument );
}

function createManualData( entry: ManualPageEntry, workspaceRoot: string ): ManualData {
	return {
		displayName: entry.displayName,
		instructionsHtml: loadRenderedInstructions( entry, workspaceRoot ),
		packageName: entry.packageName
	};
}

function stringifyHtmlScriptData( value: ManualData ): string {
	return JSON.stringify( value ).split( '<' ).join( '\\u003c' );
}

function shouldMoveManualHeadNode( node: ChildNode ): boolean {
	if ( !isElementNode( node ) ) {
		return true;
	}

	if ( node.tagName == 'title' ) {
		return false;
	}

	if ( node.tagName != 'meta' ) {
		return true;
	}

	return !getAttribute( node, 'charset' ) && getAttribute( node, 'name' ) != 'viewport';
}

function appendChildren( parent: ParentNode, childNodes: Array<ChildNode> ): void {
	for ( const node of childNodes ) {
		removeNode( node );
		appendChild( parent, node );
	}
}

function getRequiredElementByTagName( root: Node, tagName: string ): Element {
	return query<Element>( root, candidate => isElementNode( candidate ) && candidate.tagName == tagName )!;
}

function getRequiredElementByAttribute( root: ParentNode, attributeName: string ): Element {
	return query<Element>( root, candidate => isElementNode( candidate ) && hasAttribute( candidate, attributeName ) )!;
}

function findChildElement( root: ParentNode, tagName: string ): Element | undefined {
	return root.childNodes.find( ( node ): node is Element => isElementNode( node ) && node.tagName == tagName );
}
