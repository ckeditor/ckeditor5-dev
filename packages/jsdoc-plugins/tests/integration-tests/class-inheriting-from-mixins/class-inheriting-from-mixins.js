/**
 * @license Copyright (c) 2003-2020, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

'use strict';

const extractApiDocs = require( '../_utils/extract-api-docs' );
const { cloneDeep } = require( 'lodash' );
const { expect } = require( 'chai' );

describe.only( 'integration test/class inheriting from mixins', () => {
	/** @type {Array.<Doclet>} */
	let originalApiDocs;

	/** @type {Array.<Doclet>} */
	let apiDocs;

	before( () => {
		originalApiDocs = extractApiDocs( __dirname );
	} );

	beforeEach( () => {
		apiDocs = cloneDeep( originalApiDocs );
	} );

	describe( 'interfaces and mixins', () => {
		it( 'EmitterMixin doclet should contain correct longname', () => {
			const emitterMixinDoclet = apiDocs.find( d => d.name === 'EmitterMixin' );

			expect( emitterMixinDoclet.longname ).to.equal( 'module:utils/emittermixin~EmitterMixin' );
			expect( emitterMixinDoclet.memberof ).to.equal( 'module:utils/emittermixin' );
		} );

		it( 'EmitterMixin doclet should be generated only once', () => {
			const emitterMixinDoclets = apiDocs.filter( d => d.name === 'EmitterMixin' );

			expect( emitterMixinDoclets.length ).to.equal( 1 );
		} );

		it( 'Emitter#on doclet should be generated for the `on` method', () => {
			const emitterOnDoclet = apiDocs.find( d => d.longname == 'module:utils/emittermixin~Emitter#on' );

			expect( emitterOnDoclet ).to.be.an( 'object' );
			expect( emitterOnDoclet.description ).to.equal(
				'Registers a callback function to be executed when an event is fired.'
			);

			expect( emitterOnDoclet.scope ).to.equal( 'instance' );
			expect( emitterOnDoclet.memberof ).to.equal( 'module:utils/emittermixin~Emitter' );
		} );

		it( 'EmitterMixin#on doclet should be generated for the `on` method and should inherit docs ', () => {
			const emitterMixinOnDoclet = apiDocs.find( d => d.longname == 'module:utils/emittermixin~EmitterMixin#on' );

			expect( emitterMixinOnDoclet ).to.be.an( 'object' );

			expect( emitterMixinOnDoclet.description ).to.equal(
				'Registers a callback function to be executed when an event is fired.'
			);

			expect( emitterMixinOnDoclet.scope ).to.equal( 'instance' );
			expect( emitterMixinOnDoclet.memberof ).to.equal( 'module:utils/emittermixin~EmitterMixin' );
		} );
	} );

	describe( 'class extending mixins that implements interfaces', () => {
		it( 'doclet for the Emitter class should be generated', () => {
			const emitterDoclet = apiDocs.find( d => d.longname == 'module:engine/emitter~Emitter' );

			expect( emitterDoclet ).to.be.an( 'object' );

			expect( emitterDoclet.implementsNested ).to.deep.equal( [
				'module:utils/emittermixin~Emitter'
			] );

			expect( emitterDoclet.mixesNested ).to.deep.equal( [
				'module:utils/emittermixin~EmitterMixin'
			] );
		} );

		it( 'doclet for the `on` method should be generated', () => {
			const emitterOnDoclet = apiDocs.find( d => d.longname == 'module:engine/emitter~Emitter#on' );

			expect( emitterOnDoclet ).to.be.an( 'object' );

			expect( emitterOnDoclet.scope ).to.equal( 'instance' );
			expect( emitterOnDoclet.memberof ).to.equal( 'module:engine/emitter~Emitter' );

			expect( emitterOnDoclet.mixed ).to.equal( true );
		} );
	} );
} );

