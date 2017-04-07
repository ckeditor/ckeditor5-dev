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
				token: 'token'
			} ).then( () => {
				sinon.assert.calledWith(
					spy,
					'http://www.transifex.com/api/2/project/ckeditor5/resources/',
					{
						auth: {
							username: 'api',
							password: 'token'
						}
					}
				);
			} );
		} );

		it( 'should throw an error if the statusCode is above 300', () => {
			const spy = sandbox.spy( ( url, data, cb ) => cb( null, { statusCode: 500 }, '{"body": ""}' ) );
			sandbox.stub( request, 'get', spy );

			return transifexService.getResources( {
				token: 'token'
			} )
			.then( () => new Error( 'Promise should not be resolved' ) )
			.catch( ( err ) => expect( err.message ).to.equal( 'Status code: 500' ) );
		} );

		it( 'should throw an error if some other error occurs', () => {
			const error = new Error();
			const spy = sandbox.spy( ( url, data, cb ) => cb( error, { statusCode: 200 }, '{"body": ""}' ) );
			sandbox.stub( request, 'get', spy );

			return transifexService.getResources( {
				token: 'token'
			} )
			.then( () => new Error( 'Promise should not be resolved' ) )
			.catch( ( err ) => expect( err ).to.equal( error ) );
		} );

		it( 'should throw an error if some error occurs during parsing the body', () => {
			const spy = sandbox.spy( ( url, data, cb ) => cb( null, { statusCode: 200 }, 'Invalid JSON' ) );
			sandbox.stub( request, 'get', spy );

			return transifexService.getResources( {
				token: 'token'
			} )
			.then( () => new Error( 'Promise should not be resolved' ) )
			.catch( ( err ) => expect( err.message ).to.equal( `Error handled while parsing body: Invalid JSON` ) );
		} );
	} );

	describe( 'postResource()', () => {
		it( 'should upload resource on the Transifex', () => {
			const spy = sandbox.spy( ( url, data, cb ) => cb( null, { statusCode: 201 }, '{"body": ""}' ) );
			sandbox.stub( request, 'post', spy );

			return transifexService.postResource( {
				token: 'token',
				name: 'name',
				slug: 'slug',
				content: 'content',
			} ).then( () => {
				sinon.assert.calledWith(
					spy,
					'http://www.transifex.com/api/2/project/ckeditor5/resources/',
					{
						auth: {
							username: 'api',
							password: 'token'
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
				token: 'token',
				slug: 'slug',
				content: 'content',
			} ).then( () => {
				sinon.assert.calledWith(
					spy,
					'http://www.transifex.com/api/2/project/ckeditor5/resource/slug/content/',
					{
						auth: {
							username: 'api',
							password: 'token'
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
				token: 'token',
				slug: 'slug',
			} ).then( () => {
				sinon.assert.calledWith(
					spy,
					'http://www.transifex.com/api/2/project/ckeditor5/resource/slug/?details',
					{
						auth: {
							username: 'api',
							password: 'token'
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
				token: 'token',
				slug: 'slug',
				lang: 'lang'
			} ).then( () => {
				sinon.assert.calledWith(
					spy,
					'http://www.transifex.com/api/2/project/ckeditor5/resource/slug/translation/lang/',
					{
						auth: {
							username: 'api',
							password: 'token'
						}
					}
				);
			} );
		} );
	} );
} );
