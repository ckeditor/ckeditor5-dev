/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { beforeEach, describe, expect, it, vi, type Mock } from 'vitest';
import sh from 'shelljs';
import shExec from '../../src/tools/shexec.js';
import logger from '../../src/logger/index.js';

vi.mock( 'shelljs' );
vi.mock( '../../src/logger/index.js' );

type CallbackType = ( exitCode: number, stdout?: string, stderr?: string ) => void;

describe( 'shExec()', () => {
	let stubs: Record<string, Mock>;

	beforeEach( () => {
		stubs = {
			infoSpy: vi.fn(),
			errorSpy: vi.fn()
		};

		vi.spyOn( process, 'cwd' ).mockReturnValue( '/default' );

		vi.mocked( logger ).mockReturnValue( {
			info: stubs.infoSpy,
			error: stubs.errorSpy
		} as any );
	} );

	describe( 'sync', () => {
		it( 'should execute a specified command using the default cwd', () => {
			vi.mocked( sh ).exec.mockReturnValue( { code: 0 } as any );

			shExec( 'command' );

			expect( vi.mocked( process ).cwd ).toHaveBeenCalledOnce();
			expect( vi.mocked( sh ).exec ).toHaveBeenCalledExactlyOnceWith(
				'command',
				expect.objectContaining( {
					cwd: '/default'
				} )
			);
		} );

		it( 'should execute command with specified cwd', () => {
			const cwd = '/home/user';

			vi.mocked( sh ).exec.mockReturnValue( { code: 0 } as any );

			shExec( 'command', { cwd } );

			expect( vi.mocked( sh ).exec ).toHaveBeenCalledExactlyOnceWith(
				'command',
				expect.objectContaining( {
					cwd: '/home/user'
				} )
			);
		} );

		it( 'should throw error on unsuccessful call', () => {
			vi.mocked( sh ).exec.mockReturnValue( { code: 1 } as any );

			expect( () => {
				shExec( 'command' );
			} ).to.throw();

			expect( vi.mocked( sh ).exec ).toHaveBeenCalledOnce();
		} );

		it( 'should output using log functions when exit code is equal to 0', () => {
			vi.mocked( sh ).exec.mockReturnValue( { code: 0, stdout: 'out', stderr: 'err' } as any );

			shExec( 'command' );

			expect( vi.mocked( sh ).exec ).toHaveBeenCalledOnce();
			expect( vi.mocked( logger ) ).toHaveBeenCalledExactlyOnceWith( 'info' );
			expect( stubs.errorSpy ).not.toHaveBeenCalled();
			expect( stubs.infoSpy ).toHaveBeenCalledTimes( 2 );
			expect( stubs.infoSpy ).toHaveBeenCalledWith( expect.stringContaining( 'out' ) );
			expect( stubs.infoSpy ).toHaveBeenCalledWith( expect.stringContaining( 'err' ) );
		} );

		it( 'should output using log functions when exit code is not equal to 0', () => {
			vi.mocked( sh ).exec.mockReturnValue( { code: 1, stdout: 'out', stderr: 'err' } as any );

			expect( () => {
				shExec( 'command' );
			} ).to.throw();

			expect( vi.mocked( sh ).exec ).toHaveBeenCalledOnce();
			expect( vi.mocked( logger ) ).toHaveBeenCalledExactlyOnceWith( 'info' );
			expect( stubs.infoSpy ).not.toHaveBeenCalled();
			expect( stubs.errorSpy ).toHaveBeenCalledTimes( 2 );
			expect( stubs.errorSpy ).toHaveBeenCalledWith( expect.stringContaining( 'out' ) );
			expect( stubs.errorSpy ).toHaveBeenCalledWith( expect.stringContaining( 'err' ) );
		} );

		it( 'should not log if no output from executed command', () => {
			vi.mocked( sh ).exec.mockReturnValue( { code: 0, stdout: '', stderr: '' } as any );

			shExec( 'command', { verbosity: 'error' } );

			expect( vi.mocked( logger ) ).toHaveBeenCalledExactlyOnceWith( 'error' );
			expect( stubs.infoSpy ).not.toHaveBeenCalled();
			expect( stubs.errorSpy ).not.toHaveBeenCalled();
		} );
	} );

	describe( 'async', () => {
		it( 'should return a promise when executing a command in asynchronous mode', async () => {
			vi.mocked( sh ).exec.mockImplementation( ( ( command: string, options: object, callback: CallbackType ) => {
				callback( 0 );
			} ) as any );

			await shExec( 'command', { async: true } );
			expect( vi.mocked( sh ).exec ).toHaveBeenCalledOnce();
		} );

		it( 'should throw error on unsuccessful call in asynchronous mode', async () => {
			vi.mocked( sh ).exec.mockImplementation( ( ( command: string, options: object, callback: CallbackType ) => {
				callback( 1 );
			} ) as any );

			await expect( shExec( 'command', { async: true } ) ).rejects.toThrow();
			expect( vi.mocked( sh ).exec ).toHaveBeenCalledOnce();
		} );

		it( 'should output using log functions when exit code is equal to 0 in asynchronous mode', async () => {
			vi.mocked( sh ).exec.mockImplementation( ( ( command: string, options: object, callback: CallbackType ) => {
				callback( 0, 'out', 'err' );
			} ) as any );

			await shExec( 'command', { async: true } );

			expect( vi.mocked( sh ).exec ).toHaveBeenCalledOnce();
			expect( vi.mocked( logger ) ).toHaveBeenCalledExactlyOnceWith( 'info' );
			expect( stubs.errorSpy ).not.toHaveBeenCalled();
			expect( stubs.infoSpy ).toHaveBeenCalledTimes( 2 );
			expect( stubs.infoSpy ).toHaveBeenCalledWith( expect.stringContaining( 'out' ) );
			expect( stubs.infoSpy ).toHaveBeenCalledWith( expect.stringContaining( 'err' ) );
		} );

		it( 'should output using log functions when exit code is not equal to 0 in asynchronous mode', async () => {
			vi.mocked( sh ).exec.mockImplementation( ( ( command: string, options: object, callback: CallbackType ) => {
				callback( 1, 'out', 'err' );
			} ) as any );

			await expect( shExec( 'command', { async: true } ) ).rejects.toThrow();

			expect( vi.mocked( sh ).exec ).toHaveBeenCalledOnce();
			expect( vi.mocked( logger ) ).toHaveBeenCalledExactlyOnceWith( 'info' );
			expect( stubs.infoSpy ).not.toHaveBeenCalled();
			expect( stubs.errorSpy ).toHaveBeenCalledTimes( 2 );
			expect( stubs.errorSpy ).toHaveBeenCalledWith( expect.stringContaining( 'out' ) );
			expect( stubs.errorSpy ).toHaveBeenCalledWith( expect.stringContaining( 'err' ) );
		} );

		it( 'should not log if no output from executed command in asynchronous mode', async () => {
			vi.mocked( sh ).exec.mockImplementation( ( ( command: string, options: object, callback: CallbackType ) => {
				callback( 0, '', '' );
			} ) as any );

			await shExec( 'command', { verbosity: 'error', async: true } );

			expect( vi.mocked( logger ) ).toHaveBeenCalledExactlyOnceWith( 'error' );
			expect( stubs.infoSpy ).not.toHaveBeenCalled();
			expect( stubs.errorSpy ).not.toHaveBeenCalled();
		} );
	} );
} );
