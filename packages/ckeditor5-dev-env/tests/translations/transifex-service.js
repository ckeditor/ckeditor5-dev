/**
 * @license Copyright (c) 2003-2017, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

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
			sandbox.stub( request, 'get' ).callsFake( spy );

			return transifexService.getResources( {
				token: 'token'
			} ).then( () => {
				sinon.assert.calledWith(
					spy,
					'https://www.transifex.com/api/2/project/ckeditor5/resources/',
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
			sandbox.stub( request, 'get' ).callsFake( spy );

			return transifexService.getResources( { token: 'token' } )
				.then(
					() => {
						throw new Error( 'Promise should not be resolved.' );
					},
					err => {
						expect( err.message ).to.equal( 'Status code: 500 for \'getResources\' method.' );
					}
				);
		} );

		it( 'should throw an error if some other error occurs', () => {
			const error = new Error();
			const spy = sandbox.spy( ( url, data, cb ) => cb( error, { statusCode: 200 }, '{"body": ""}' ) );
			sandbox.stub( request, 'get' ).callsFake( spy );

			return transifexService.getResources( { token: 'token' } )
				.then(
					() => {
						throw new Error( 'Promise should not be resolved.' );
					},
					err => {
						expect( err ).to.equal( error );
					}
				);
		} );

		it( 'should throw an error if some error occurs during parsing the body', () => {
			const spy = sandbox.spy( ( url, data, cb ) => cb( null, { statusCode: 200 }, 'Invalid JSON' ) );
			sandbox.stub( request, 'get' ).callsFake( spy );

			return transifexService.getResources( { token: 'token' } )
				.then(
					() => {
						throw new Error( 'Promise should not be resolved.' );
					},
					err => {
						expect( err.message ).to.equal(
							'Error handled while parsing body of the \'getResources\' response: Invalid JSON'
						);
					} );
		} );
	} );

	describe( 'postResource()', () => {
		it( 'should upload resource on the Transifex', () => {
			const spy = sandbox.spy( ( url, data, cb ) => cb( null, { statusCode: 201 }, '{"body": ""}' ) );
			sandbox.stub( request, 'post' ).callsFake( spy );

			return transifexService.postResource( {
				token: 'token',
				name: 'name',
				slug: 'slug',
				content: 'content',
			} ).then( () => {
				sinon.assert.calledWith(
					spy,
					'https://www.transifex.com/api/2/project/ckeditor5/resources/',
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
			sandbox.stub( request, 'put' ).callsFake( spy );

			return transifexService.putResourceContent( {
				token: 'token',
				slug: 'slug',
				content: 'content',
			} ).then( () => {
				sinon.assert.calledWith(
					spy,
					'https://www.transifex.com/api/2/project/ckeditor5/resource/slug/content/',
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
			sandbox.stub( request, 'get' ).callsFake( spy );

			return transifexService.getResourceDetails( {
				token: 'token',
				slug: 'slug',
			} ).then( () => {
				sinon.assert.calledWith(
					spy,
					'https://www.transifex.com/api/2/project/ckeditor5/resource/slug/?details',
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
			sandbox.stub( request, 'get' ).callsFake( spy );

			return transifexService.getTranslation( {
				token: 'token',
				slug: 'slug',
				lang: 'lang'
			} ).then( () => {
				sinon.assert.calledWith(
					spy,
					'https://www.transifex.com/api/2/project/ckeditor5/resource/slug/translation/lang/',
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
