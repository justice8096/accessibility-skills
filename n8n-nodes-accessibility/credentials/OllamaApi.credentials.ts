import { ICredentialType, INodeProperties } from "n8n-workflow";

export class OllamaApi implements ICredentialType {
	name = "ollamaApi";
	displayName = "Ollama API";
	documentationUrl = "https://ollama.com/blog/openai-compatibility";

	properties: INodeProperties[] = [
		{
			displayName: "Base URL",
			name: "baseUrl",
			type: "string",
			default: "http://localhost:11434",
			placeholder: "http://localhost:11434",
			description: "The base URL of your Ollama instance",
		},
		{
			displayName: "Model",
			name: "model",
			type: "string",
			default: "llama3",
			description: "The Ollama model to use for inference",
		},
	];
}
