/**
 * @license Copyright (c) 2003-2017, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

/* global describe, it, beforeEach, afterEach */

'use strict';

const transifexService = require( '../../lib/translations/transifex-service' );
const chai = require( 'chai' );
const sinon = require( 'sinon' );
const expect = chai.expect;
const request = require( 'request' );

describe( 'transifex-service', () => {
	let sandbox;

	beforeEach( () => {
		sandbox = sinon.sandbox.create();
	} );

	afterEach( () => {
		sandbox.restore();
	} );

	describe( 'getResources()', () => {
		it( 'should return resources', () => {
			const spy = sandbox.spy( ( url, data, cb ) => cb( null, { statusCode: 200 }, '{"body": ""}' ) );
			sandbox.stub( request, 'get', spy );

			return transifexService.getResources( {
				username: 'username',
				password: 'password'
			} ).then( () => {
				sinon.assert.calledWith(
					spy,
					'http://www.transifex.com/api/2/project/ckeditor5/resources/',
					{
						auth: {
							username: 'username',
							password: 'password'
						}
					}
				);
			} );
		} );

		it( 'should throw an error if the statusCode is above 300', () => {
			const spy = sandbox.spy( ( url, data, cb ) => cb( null, { statusCode: 500 }, '{"body": ""}' ) );
			sandbox.stub( request, 'get', spy );

			return transifexService.getResources( {
				username: 'username',
				password: 'password'
			} )
			.then( () => new Error( 'Promise should not be resolved' ) )
			.catch( ( err ) => expect( err.message ).to.equal( 'Status code: 500' ) );
		} );
	} );

	describe( 'postResource()', () => {
		it( 'should upload resource on the Transifex', () => {
			const spy = sandbox.spy( ( url, data, cb ) => cb( null, { statusCode: 201 }, '{"body": ""}' ) );
			sandbox.stub( request, 'post', spy );

			return transifexService.postResource( {
				username: 'username',
				password: 'password',
				name: 'name',
				slug: 'slug',
				content: 'content',
			} ).then( () => {
				sinon.assert.calledWith(
					spy,
					'http://www.transifex.com/api/2/project/ckeditor5/resources/',
					{
						auth: {
							username: 'username',
							password: 'password'
						},
						formData: {
							slug: 'slug',
							name: 'name',
							content: 'content',
							'i18n_type': 'PO'
						}
					}
				);
			} );
		} );
	} );

	describe( 'putResourceContent()', () => {
		it( 'should update resource on the Transifex', () => {
			const spy = sandbox.spy( ( url, data, cb ) => cb( null, { statusCode: 200 }, '{"body": ""}' ) );
			sandbox.stub( request, 'put', spy );

			return transifexService.putResourceContent( {
				username: 'username',
				password: 'password',
				slug: 'slug',
				content: 'content',
			} ).then( () => {
				sinon.assert.calledWith(
					spy,
					'http://www.transifex.com/api/2/project/ckeditor5/resource/slug/content/',
					{
						auth: {
							username: 'username',
							password: 'password'
						},
						formData: {
							content: 'content',
							'i18n_type': 'PO'
						}
					}
				);
			} );
		} );
	} );

	describe( 'getResourceDetails()', () => {
		it( 'should get resource details from the Transifex', () => {
			const spy = sandbox.spy( ( url, data, cb ) => cb( null, { statusCode: 200 }, '{"body": ""}' ) );
			sandbox.stub( request, 'get', spy );

			return transifexService.getResourceDetails( {
				username: 'username',
				password: 'password',
				slug: 'slug',
			} ).then( () => {
				sinon.assert.calledWith(
					spy,
					'http://www.transifex.com/api/2/project/ckeditor5/resource/slug/?details',
					{
						auth: {
							username: 'username',
							password: 'password'
						}
					}
				);
			} );
		} );
	} );

	describe( 'getTranslation()', () => {
		it( 'should get translations for the target language of the resource from the Transifex', () => {
			const spy = sandbox.spy( ( url, data, cb ) => cb( null, { statusCode: 200 }, '{"body": ""}' ) );
			sandbox.stub( request, 'get', spy );

			return transifexService.getTranslation( {
				username: 'username',
				password: 'password',
				slug: 'slug',
				lang: 'lang'
			} ).then( () => {
				sinon.assert.calledWith(
					spy,
					'http://www.transifex.com/api/2/project/ckeditor5/resource/slug/translation/lang/',
					{
						auth: {
							username: 'username',
							password: 'password'
						}
					}
				);
			} );
		} );
	} );
} );
