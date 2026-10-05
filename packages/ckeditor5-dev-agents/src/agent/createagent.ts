/**
 * @license Copyright (c) 2003-2026, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import { readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import upath from 'upath';
import {
	createAgentSession,
	createExtensionRuntime,
	defineTool,
	loadSkillsFromDir,
	ModelRuntime,
	SessionManager,
	SettingsManager,
	type ResourceLoader,
	type Skill
} from '@earendil-works/pi-coding-agent';
import { InMemoryCredentialStore } from '@earendil-works/pi-ai';
import type { Agent, AgentRunOptions, TaskAgentConfig } from '../types.js';

export type AgentUsage = {
	cost: number;
	tokens: number;
};

export type CreateAgentOptions = {
	taskId: string;
	config: TaskAgentConfig | undefined;

	/**
	 * An absolute path to the task directory. Paths in `config` are relative to it.
	 */
	taskDirectory: string;

	/**
	 * The working directory of the agent: the target root.
	 */
	cwd: string;
	tools: ReadonlyArray<string>;
	usage: AgentUsage;

	/**
	 * Receives the progress of the agent: the tools it calls.
	 */
	log: ( message: string ) => void;

	/**
	 * Receives problems that do not stop the run, for example a skill that cannot be loaded. They are also logged.
	 */
	warn: ( message: string ) => void;
};

// The name of the tool through which an agent returns a structured result.
const RESULT_TOOL_NAME = 'submit_result';

// Pi keeps a global configuration directory. The harness never reads or writes the one of the user (`~/.pi`).
const AGENT_DIRECTORY = upath.join( tmpdir(), 'ckeditor5-dev-agents' );

// How long one `agent.run()` may take, in seconds, when the task does not set `agent.timeout`.
const DEFAULT_TIMEOUT = 30 * 60;

// How many times a failed request to the model is retried.
const MAX_RETRIES = 3;

// The longest summary of tool call arguments in the log, including the ellipsis.
const MAX_ARGUMENTS_LENGTH = 120;

// One runtime per provider and API key, so tasks with different keys for the same provider do not share credentials.
const modelRuntimes = new Map<string, Promise<ModelRuntime>>();

/**
 * Creates the `agent` of one phase of a task. Every `run()` starts a new Pi session that is configured only by
 * the task: its instructions, skills, tools and model. Nothing is discovered from the machine that runs it, and nothing
 * is persisted. The API key comes from the task config (`agent.apiKey`), never from the environment of the process.
 */
export function createAgent( options: CreateAgentOptions ): Agent {
	const { taskId, config, taskDirectory, cwd, tools, usage, log, warn } = options;

	// Loaded once per phase and reused across its sessions.
	let resources: Promise<ResourceLoader> | undefined;

	const loadResources = async ( agentConfig: TaskAgentConfig ) => createResourceLoader( {
		systemPrompt: await getInstructions( agentConfig, taskDirectory ),
		skills: getSkills( agentConfig, taskDirectory, message => {
			log( `[agent] ${ message }` );
			warn( message );
		} )
	} );

	return {
		async run<TOutput = unknown>( { prompt, outputSchema }: AgentRunOptions ): Promise<{ output: TOutput; text: string }> {
			if ( !config ) {
				throw new Error( `The "${ taskId }" task calls \`agent.run()\`, but it does not configure \`agent\`.` );
			}

			if ( !config.apiKey ) {
				throw new Error(
					`The "${ taskId }" task calls \`agent.run()\`, but \`agent.apiKey\` is empty. ` +
					`Provide the API key of the "${ config.model.provider }" provider in the task config.`
				);
			}

			const modelRuntime = await getModelRuntime( config.model.provider, config.apiKey );
			const model = modelRuntime.getModel( config.model.provider, config.model.id );

			if ( !model ) {
				throw new Error( `The "${ config.model.provider }/${ config.model.id }" model is not available.` );
			}

			let result: unknown;

			const resultTool = outputSchema && defineTool( {
				name: RESULT_TOOL_NAME,
				label: 'Submit result',
				description: 'Submits the result of the task. Call it exactly once, when you are done.',
				parameters: outputSchema as never,
				async execute( _toolCallId, params ) {
					result = params;

					return { content: [ { type: 'text', text: 'The result was received. You are done.' } ], details: undefined };
				}
			} );

			const { session } = await createAgentSession( {
				cwd,
				agentDir: AGENT_DIRECTORY,
				model,
				modelRuntime,
				thinkingLevel: config.thinkingLevel,
				tools: resultTool ? [ ...tools, RESULT_TOOL_NAME ] : [ ...tools ],
				customTools: resultTool ? [ resultTool ] : [],
				sessionManager: SessionManager.inMemory( cwd ),
				settingsManager: SettingsManager.inMemory( {
					enableInstallTelemetry: false,
					retry: { enabled: true, maxRetries: MAX_RETRIES }
				} ),
				resourceLoader: await ( resources ??= loadResources( config ) )
			} );

			const unsubscribe = session.subscribe( event => {
				if ( event.type === 'tool_execution_start' && event.toolName !== RESULT_TOOL_NAME ) {
					log( `[agent] ${ event.toolName } ${ summarizeArguments( event.args ) }` );
				}
			} );

			const timeout = config.timeout ?? DEFAULT_TIMEOUT;

			let hasTimedOut = false;

			const timer = setTimeout( () => {
				hasTimedOut = true;
				session.abort().catch( () => {} );
			}, timeout * 1000 );

			const sendPrompt = async ( text: string ) => {
				try {
					await session.prompt( text );
				} catch ( error ) {
					if ( !hasTimedOut ) {
						throw error;
					}
				}

				if ( hasTimedOut ) {
					throw new Error( `The agent did not finish within ${ timeout } seconds.` );
				}
			};

			try {
				await sendPrompt( resultTool ?
					`${ prompt }\n\nWhen you are done, call the \`${ RESULT_TOOL_NAME }\` tool exactly once with the result. ` +
						'Do not write the result as text.' :
					prompt
				);

				if ( resultTool && result === undefined ) {
					await sendPrompt( `You have not called the \`${ RESULT_TOOL_NAME }\` tool. Call it now with the result.` );
				}

				const lastMessage = session.messages.findLast( message => message.role === 'assistant' );

				if ( lastMessage?.stopReason === 'error' ) {
					throw new Error( `The agent failed: ${ lastMessage.errorMessage ?? 'unknown error' }` );
				}

				if ( resultTool && result === undefined ) {
					throw new Error( `The agent did not return a result through the \`${ RESULT_TOOL_NAME }\` tool.` );
				}

				return { output: result as TOutput, text: session.getLastAssistantText() ?? '' };
			} finally {
				const stats = session.getSessionStats();

				usage.cost += stats.cost;
				usage.tokens += stats.tokens.total;

				clearTimeout( timer );
				unsubscribe();
				session.dispose();
			}
		}
	};
}

function getModelRuntime( provider: string, apiKey: string ): Promise<ModelRuntime> {
	const key = `${ provider }\0${ apiKey }`;

	if ( !modelRuntimes.has( key ) ) {
		modelRuntimes.set( key, createModelRuntime( provider, apiKey ) );
	}

	return modelRuntimes.get( key )!;
}

async function createModelRuntime( provider: string, apiKey: string ): Promise<ModelRuntime> {
	const modelRuntime = await ModelRuntime.create( {
		// Keeps credentials in memory, so the runtime never reads `~/.pi/agent/auth.json`.
		credentials: new InMemoryCredentialStore(),
		modelsPath: null,
		allowModelNetwork: false
	} );

	// A key set on the runtime takes precedence over the standard variable of the provider.
	await modelRuntime.setRuntimeApiKey( provider, apiKey );

	return modelRuntime;
}

async function getInstructions( config: TaskAgentConfig, taskDirectory: string ): Promise<string | undefined> {
	if ( config.instructions ) {
		return config.instructions;
	}

	if ( config.instructionsPath ) {
		return readFile( upath.resolve( taskDirectory, config.instructionsPath ), 'utf8' );
	}

	return undefined;
}

function getSkills( config: TaskAgentConfig, taskDirectory: string, warn: ( message: string ) => void ): Array<Skill> {
	return ( config.skills ?? [] ).flatMap( directory => {
		const { skills, diagnostics } = loadSkillsFromDir( { dir: upath.resolve( taskDirectory, directory ), source: 'task' } );

		for ( const diagnostic of diagnostics ) {
			warn( `A skill could not be loaded: ${ diagnostic.message }` );
		}

		return skills;
	} );
}

// Everything the agent knows comes from the task. User and project resources (`AGENTS.md`, `~/.pi`,
// extensions, prompt templates) are not discovered, so a run behaves the same on every machine.
function createResourceLoader( { systemPrompt, skills }: { systemPrompt: string | undefined; skills: Array<Skill> } ): ResourceLoader {
	return {
		getExtensions: () => ( { extensions: [], errors: [], runtime: createExtensionRuntime() } ),
		getSkills: () => ( { skills, diagnostics: [] } ),
		getPrompts: () => ( { prompts: [], diagnostics: [] } ),
		getThemes: () => ( { themes: [], diagnostics: [] } ),
		getAgentsFiles: () => ( { agentsFiles: [] } ),
		getSystemPrompt: () => systemPrompt,
		getSystemPromptSource: () => undefined,
		getAppendSystemPrompt: () => [],
		getAppendSystemPromptSources: () => [],
		extendResources: () => {},
		reload: async () => {}
	};
}

function summarizeArguments( args: unknown ): string {
	const text = String( JSON.stringify( args ) );

	return text.length > MAX_ARGUMENTS_LENGTH ? `${ text.slice( 0, MAX_ARGUMENTS_LENGTH - 3 ) }...` : text;
}
