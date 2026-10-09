/**
 * @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { afterEach, beforeAll, beforeEach, describe, it, expect, vi } from 'vitest';
import { ModelRuntime, createAgentSession } from '@earendil-works/pi-coding-agent';
import type * as PiCodingAgent from '@earendil-works/pi-coding-agent';
import {
	InMemoryCredentialStore,
	fauxAssistantMessage,
	fauxProvider,
	fauxToolCall,
	type FauxProviderHandle,
	type FauxResponseStep
} from '@earendil-works/pi-ai';
import { createAgent, type CreateAgentOptions } from '../../src/agent/createagent.js';
import { findingSchema } from '../../src/utils/findingschema.js';
import { createTempDirectory, removeTempDirectories, writeFiles } from '../_utils/files.js';
import type { TaskAgentConfig } from '../../src/types.js';

// A pass-through spy, so the tests can see what the agent configures.
vi.mock( '@earendil-works/pi-coding-agent', async importOriginal => {
	const original = await importOriginal<typeof PiCodingAgent>();

	return { ...original, createAgentSession: vi.fn( original.createAgentSession ) };
} );

describe( 'createAgent()', () => {
	let faux: FauxProviderHandle;
	let runtime: ModelRuntime;
	let log: Array<string>;
	let warnings: Array<string>;
	let usage: { cost: number; tokens: number };
	let requests: Array<string>;

	const model = { provider: 'faux', id: 'faux-1' };
	const schema = findingSchema( { ruleIds: [ 'R1' ] } );

	beforeAll( async () => {
		faux = fauxProvider( { provider: 'faux', models: [ { id: 'faux-1' } ] } );
		runtime = await ModelRuntime.create( { credentials: new InMemoryCredentialStore(), modelsPath: null } );
		runtime.registerNativeProvider( faux.provider );
	} );

	beforeEach( () => {
		// The agent creates the model runtime once and keeps it, so every test uses the one with the faux provider.
		vi.spyOn( ModelRuntime, 'create' ).mockResolvedValue( runtime );

		log = [];
		warnings = [];
		usage = { cost: 0, tokens: 0 };
		requests = [];
	} );

	afterEach( removeTempDirectories );

	// Every config gets an API key, unless a test sets `apiKey` itself.
	const create = ( config: TaskAgentConfig | undefined, overrides: Partial<CreateAgentOptions> = {} ) => createAgent( {
		taskId: 't',
		config: config && !( 'apiKey' in config ) ? { apiKey: 'test-key', ...config } : config,
		taskDirectory: process.cwd(),
		cwd: process.cwd(),
		tools: [ 'read', 'grep', 'find', 'ls' ],
		usage,
		log: message => log.push( message ),
		warn: message => warnings.push( message ),
		...overrides
	} );

	// Records what the model receives, then answers with the message.
	const recording = ( message: ReturnType<typeof fauxAssistantMessage> ): FauxResponseStep => context => {
		requests.push( JSON.stringify( context.messages ) );

		return message;
	};

	const submit = ( output: Parameters<typeof fauxToolCall>[ 1 ] ) => fauxAssistantMessage( fauxToolCall( 'submit_result', output ), {
		stopReason: 'toolUse'
	} );

	it( 'throws when the task does not configure an agent', async () => {
		await expect( create( undefined ).run( { prompt: 'x' } ) )
			.rejects.toThrow( 'The "t" task calls `agent.run()`, but it does not configure `agent`.' );
	} );

	it( 'throws when the task does not provide an API key', async () => {
		await expect( create( { model, apiKey: undefined } ).run( { prompt: 'x' } ) ).rejects.toThrow(
			'The "t" task calls `agent.run()`, but `agent.apiKey` is empty. ' +
			'Provide the API key of the "faux" provider in the task config.'
		);

		await expect( create( { model, apiKey: '' } ).run( { prompt: 'x' } ) ).rejects.toThrow( '`agent.apiKey` is empty.' );
	} );

	it( 'sets the API key of the task on the model runtime of its provider', async () => {
		const setRuntimeApiKey = vi.spyOn( runtime, 'setRuntimeApiKey' );

		faux.setResponses( [ fauxAssistantMessage( 'Done.' ) ] );

		await create( { model, apiKey: 'key-of-this-task' } ).run( { prompt: 'x' } );

		expect( setRuntimeApiKey ).toHaveBeenCalledWith( 'faux', 'key-of-this-task' );
	} );

	it( 'creates one model runtime per provider and API key', async () => {
		faux.setResponses( [ fauxAssistantMessage( 'One.' ), fauxAssistantMessage( 'Two.' ), fauxAssistantMessage( 'Three.' ) ] );

		const createdBefore = vi.mocked( ModelRuntime.create ).mock.calls.length;

		await create( { model, apiKey: 'shared-key' } ).run( { prompt: 'x' } );
		await create( { model, apiKey: 'shared-key' } ).run( { prompt: 'x' } );

		expect( vi.mocked( ModelRuntime.create ).mock.calls.length - createdBefore ).toBe( 1 );

		await create( { model, apiKey: 'another-key' } ).run( { prompt: 'x' } );

		expect( vi.mocked( ModelRuntime.create ).mock.calls.length - createdBefore ).toBe( 2 );
	} );

	it( 'throws when the model is not available', async () => {
		await expect( create( { model: { provider: 'faux', id: 'missing' } } ).run( { prompt: 'x' } ) )
			.rejects.toThrow( 'The "faux/missing" model is not available.' );
	} );

	it( 'returns the text of a run without an output schema', async () => {
		faux.setResponses( [ recording( fauxAssistantMessage( 'Plain answer.' ) ) ] );

		const result = await create( { model, instructions: 'You are a test.', thinkingLevel: 'low' } ).run( { prompt: 'Say something.' } );

		expect( result ).toEqual( { output: undefined, text: 'Plain answer.' } );
		expect( requests[ 0 ] ).toContain( 'You are a test.' );
		expect( requests[ 0 ] ).toContain( 'Say something.' );
		expect( requests[ 0 ] ).not.toContain( 'submit_result' );
		expect( usage.tokens ).toBeGreaterThan( 0 );
		expect( usage.cost ).toBe( 0 );
	} );

	it( 'returns the result submitted through the tool and logs the other tool calls', async () => {
		faux.setResponses( [
			recording( fauxAssistantMessage( fauxToolCall( 'read', { path: 'package.json' } ), { stopReason: 'toolUse' } ) ),
			fauxAssistantMessage( fauxToolCall( 'ls', { path: 'x'.repeat( 200 ) } ), { stopReason: 'toolUse' } ),
			submit( { findings: [ { ruleId: 'R1', detail: 'Found.' } ] } ),
			fauxAssistantMessage( 'Done.' )
		] );

		const result = await create( { model, instructions: 'Judge.' } ).run( { prompt: 'Judge it.', outputSchema: schema } );

		expect( result ).toEqual( { output: { findings: [ { ruleId: 'R1', detail: 'Found.' } ] }, text: 'Done.' } );
		expect( requests[ 0 ] ).toContain( 'call the `submit_result` tool exactly once' );
		expect( warnings ).toEqual( [] );

		// Long arguments are cut to 120 characters. The result tool is not logged.
		expect( log ).toEqual( [
			'[agent] read {"path":"package.json"}',
			`[agent] ls ${ JSON.stringify( { path: 'x'.repeat( 200 ) } ).slice( 0, 117 ) }...`
		] );
	} );

	it( 'returns an empty text when the last message has none', async () => {
		faux.setResponses( [ submit( { findings: [] } ), fauxAssistantMessage( [] ) ] );

		const result = await create( { model } ).run( { prompt: 'x', outputSchema: schema } );

		expect( result ).toEqual( { output: { findings: [] }, text: '' } );
	} );

	it( 'offers the model only the allowed tools and the result tool', async () => {
		faux.setResponses( [ recording( submit( { findings: [] } ) ), fauxAssistantMessage( 'Done.' ) ] );

		await create( { model }, { tools: [ 'read', 'ls' ] } ).run( { prompt: 'x', outputSchema: schema } );

		const toolNames = [ ...requests[ 0 ]!.matchAll( /"name":"([a-z_]+)"/g ) ].map( match => match[ 1 ] );

		expect( toolNames ).toEqual( expect.arrayContaining( [ 'read', 'ls', 'submit_result' ] ) );
		expect( toolNames ).not.toContain( 'grep' );
		expect( toolNames ).not.toContain( 'bash' );
		expect( toolNames ).not.toContain( 'edit' );
	} );

	it( 'reminds the model to submit the result', async () => {
		faux.setResponses( [
			fauxAssistantMessage( 'I forgot.' ),
			recording( submit( { findings: [] } ) ),
			fauxAssistantMessage( 'Done.' )
		] );

		const result = await create( { model } ).run( { prompt: 'x', outputSchema: schema } );

		expect( result.output ).toEqual( { findings: [] } );
		expect( requests[ 0 ] ).toContain( 'You have not called the `submit_result` tool. Call it now with the result.' );
	} );

	it( 'throws when the model never submits the result', async () => {
		faux.setResponses( [ fauxAssistantMessage( 'I forgot.' ), fauxAssistantMessage( 'Still no.' ) ] );

		await expect( create( { model } ).run( { prompt: 'x', outputSchema: schema } ) )
			.rejects.toThrow( 'The agent did not return a result through the `submit_result` tool.' );
	} );

	it( 'throws when the model fails', async () => {
		const failure = fauxAssistantMessage( '', { stopReason: 'error', errorMessage: 'Invalid request.' } );

		faux.setResponses( [ failure, failure, failure, failure, failure ] );

		await expect( create( { model } ).run( { prompt: 'x' } ) ).rejects.toThrow( 'The agent failed: Invalid request.' );
	} );

	it( 'aborts the session and throws when the agent takes longer than the timeout', async () => {
		faux.setResponses( [ async () => {
			await new Promise( resolve => setTimeout( resolve, 300 ) );

			return fauxAssistantMessage( 'Too late.' );
		} ] );

		await expect( create( { model, timeout: 0.05 } ).run( { prompt: 'x' } ) )
			.rejects.toThrow( 'The agent did not finish within 0.05 seconds.' );
	} );

	it( 'throws the timeout error when the aborted prompt rejects, even if aborting fails', async () => {
		const createSession = vi.mocked( createAgentSession ).getMockImplementation()!;

		vi.mocked( createAgentSession ).mockImplementationOnce( async options => {
			const created = await createSession( options );

			created.session.prompt = () => new Promise( ( _resolve, reject ) => {
				setTimeout( () => reject( new Error( 'Aborted.' ) ), 100 );
			} );

			// A failing abort must not surface as an unhandled rejection.
			created.session.abort = () => Promise.reject( new Error( 'Cannot abort.' ) );

			return created;
		} );

		await expect( create( { model, timeout: 0.01 } ).run( { prompt: 'x' } ) )
			.rejects.toThrow( 'The agent did not finish within 0.01 seconds.' );
	} );

	it( 'rethrows a failed prompt that did not time out', async () => {
		const createSession = vi.mocked( createAgentSession ).getMockImplementation()!;

		vi.mocked( createAgentSession ).mockImplementationOnce( async options => {
			const created = await createSession( options );

			created.session.prompt = () => Promise.reject( new Error( 'Broken session.' ) );

			return created;
		} );

		await expect( create( { model } ).run( { prompt: 'x' } ) ).rejects.toThrow( 'Broken session.' );
	} );

	it( 'throws with a generic message when the model fails without a message', async () => {
		const failure = fauxAssistantMessage( '', { stopReason: 'error' } );

		faux.setResponses( [ failure, failure, failure, failure, failure ] );

		await expect( create( { model } ).run( { prompt: 'x' } ) ).rejects.toThrow( /^The agent failed: / );
	} );

	it( 'reads the instructions from a file relative to the task directory', async () => {
		const taskDirectory = await createTempDirectory();

		await writeFiles( taskDirectory, { 'INSTRUCTIONS.md': 'Instructions from the file.' } );
		faux.setResponses( [ recording( fauxAssistantMessage( 'Ok.' ) ) ] );

		await create( { model, instructionsPath: 'INSTRUCTIONS.md' }, { taskDirectory } ).run( { prompt: 'x' } );

		expect( requests[ 0 ] ).toContain( 'Instructions from the file.' );
	} );

	it( 'uses the default system prompt without instructions', async () => {
		faux.setResponses( [ recording( fauxAssistantMessage( 'Ok.' ) ) ] );

		expect( ( await create( { model } ).run( { prompt: 'x' } ) ).text ).toBe( 'Ok.' );
	} );

	it( 'configures the session only from the task, in memory', async () => {
		faux.setResponses( [ fauxAssistantMessage( 'Ok.' ) ] );

		await create( { model, instructions: 'Judge.' } ).run( { prompt: 'x' } );

		const [ options ] = vi.mocked( createAgentSession ).mock.calls[ 0 ]!;
		const loader = options!.resourceLoader!;

		expect( options!.agentDir ).toMatch( /ckeditor5-dev-agents$/ );
		expect( options!.settingsManager!.getEnableInstallTelemetry() ).toBe( false );
		expect( loader.getExtensions().extensions ).toEqual( [] );
		expect( loader.getSkills() ).toEqual( { skills: [], diagnostics: [] } );
		expect( loader.getPrompts() ).toEqual( { prompts: [], diagnostics: [] } );
		expect( loader.getThemes() ).toEqual( { themes: [], diagnostics: [] } );
		expect( loader.getAgentsFiles() ).toEqual( { agentsFiles: [] } );
		expect( loader.getSystemPrompt() ).toBe( 'Judge.' );
		expect( loader.getSystemPromptSource() ).toBeUndefined();
		expect( loader.getAppendSystemPrompt() ).toEqual( [] );
		expect( loader.getAppendSystemPromptSources() ).toEqual( [] );
		expect( loader.extendResources( {} ) ).toBeUndefined();
		await expect( loader.reload() ).resolves.toBeUndefined();
	} );

	it( 'reuses instructions and resources across sessions of a phase', async () => {
		const taskDirectory = await createTempDirectory();
		await writeFiles( taskDirectory, { 'INSTRUCTIONS.md': 'Original instructions.' } );
		const agent = create( { model, instructionsPath: 'INSTRUCTIONS.md' }, { taskDirectory } );
		faux.setResponses( [ fauxAssistantMessage( 'One.' ), fauxAssistantMessage( 'Two.' ) ] );

		await agent.run( { prompt: 'x' } );
		await writeFiles( taskDirectory, { 'INSTRUCTIONS.md': 'Changed instructions.' } );
		await agent.run( { prompt: 'y' } );

		const loaders = vi.mocked( createAgentSession ).mock.calls.map( ( [ options ] ) => options!.resourceLoader! );
		expect( loaders ).toHaveLength( 2 );
		expect( loaders[ 0 ] ).toBe( loaders[ 1 ] );
		expect( loaders[ 1 ]!.getSystemPrompt() ).toBe( 'Original instructions.' );
	} );

	it( 'accounts for usage when the session fails after receiving a response', async () => {
		const original = ( await vi.importActual<typeof PiCodingAgent>( '@earendil-works/pi-coding-agent' ) ).createAgentSession;
		vi.mocked( createAgentSession ).mockImplementationOnce( async options => {
			const created = await original( options );
			vi.spyOn( created.session, 'prompt' ).mockImplementationOnce( async () => {
				const message = fauxAssistantMessage( 'Partial answer.' );
				message.usage.input = 40;
				message.usage.output = 2;
				message.usage.cost.total = 0.5;
				// What Pi does when a message ends: it is kept in the session, even when the session fails afterwards.
				created.session.sessionManager.appendMessage( message );

				throw new Error( 'Session failed.' );
			} );

			return created;
		} );

		await expect( create( { model } ).run( { prompt: 'x' } ) ).rejects.toThrow( 'Session failed.' );
		expect( usage ).toEqual( { tokens: 42, cost: 0.5 } );
	} );

	it( 'loads the skills of the task and reports their problems as warnings', async () => {
		const taskDirectory = await createTempDirectory();

		await writeFiles( taskDirectory, {
			'skills/review-guides/SKILL.md': '---\nname: review-guides\ndescription: Reviews guides carefully.\n---\n\nSteps.\n',
			'skills/broken/SKILL.md': '---\nname: broken\n---\n\nNo description.\n'
		} );
		faux.setResponses( [ recording( fauxAssistantMessage( 'Ok.' ) ) ] );

		await create( { model, instructions: 'Judge.', skills: [ 'skills' ] }, { taskDirectory } ).run( { prompt: 'x' } );

		expect( requests[ 0 ] ).toContain( 'review-guides' );
		expect( requests[ 0 ] ).toContain( 'Reviews guides carefully.' );
		expect( warnings.length ).toBeGreaterThan( 0 );
		expect( warnings.every( message => message.startsWith( 'A skill could not be loaded: ' ) ) ).toBe( true );

		// Every problem is also logged, with the prefix of the agent.
		expect( log ).toEqual( warnings.map( message => `[agent] ${ message }` ) );
	} );
} );
