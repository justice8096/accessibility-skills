import {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	NodeConnectionType,
} from "n8n-workflow";

const DYSLEXIA_COMMANDS = [
	{ name: "text-simplification", displayName: "Text Simplification", description: "Simplify text for readability" },
	{ name: "reading-guide-generation", displayName: "Reading Guide", description: "Generate chunked reading guides" },
	{ name: "font-recommendation", displayName: "Font Recommendation", description: "Recommend dyslexia-friendly fonts" },
	{ name: "syllable-highlighter", displayName: "Syllable Highlighter", description: "Color-code syllables for decoding" },
	{ name: "confusion-checker", displayName: "Confusion Checker", description: "Detect mirror letters and homophones" },
	{ name: "vocabulary-builder", displayName: "Vocabulary Builder", description: "Morpheme breakdown and word maps" },
	{ name: "writing-scaffold", displayName: "Writing Scaffold", description: "Sentence starters and templates" },
	{ name: "passage-decoder", displayName: "Passage Decoder", description: "Chunked reading with decoding hints" },
	{ name: "context-enrichment", displayName: "Context Enrichment", description: "Expand terse text with supportive context" },
];

const DYSCALCULIA_COMMANDS = [
	{ name: "number-visualization", displayName: "Number Visualization", description: "Visual number representations" },
	{ name: "step-by-step-math", displayName: "Step-by-Step Math", description: "Scaffolded math problem solving" },
	{ name: "estimation-practice", displayName: "Estimation Practice", description: "Build number sense with exercises" },
	{ name: "range-comparison", displayName: "Range Comparison", description: "Visual range bars for data comparison" },
	{ name: "proportion-waffle", displayName: "Proportion Waffle", description: "10x10 waffle grids for proportions" },
	{ name: "trend-direction", displayName: "Trend Direction", description: "Simplified rise/fall indicators" },
	{ name: "difference-gap", displayName: "Difference Gap", description: "Visual gap bars for differences" },
	{ name: "elapsed-time", displayName: "Elapsed Time", description: "Timeline bars for time calculations" },
];

const ALL_COMMANDS = [
	...DYSLEXIA_COMMANDS.map((c) => ({ ...c, skill: "dyslexia" })),
	...DYSCALCULIA_COMMANDS.map((c) => ({ ...c, skill: "dyscalculia" })),
];

function buildSystemPrompt(skill: string, command: string): string {
	const skillDesc =
		skill === "dyslexia"
			? "Dyslexia Support Skill. Accessibility tools for reading support, text adaptation, and context enrichment tailored to dyslexic users."
			: "Dyscalculia Support Skill. Accessibility tools for number visualization, math scaffolding, and spatial reasoning tailored to dyscalculic users.";

	const cmd = ALL_COMMANDS.find((c) => c.name === command);
	const taskDesc = cmd ? cmd.description : command;

	return `You are an expert assistant for ${skillDesc}\n\nTask: ${taskDesc}\n\nProvide your response in well-structured markdown.`;
}

export class AccessibilitySkill implements INodeType {
	description: INodeTypeDescription = {
		displayName: "Accessibility Skill",
		name: "accessibilitySkill",
		group: ["transform"],
		version: 1,
		subtitle: '={{$parameter["skill"] + ": " + $parameter["command"]}}',
		description: "Run dyslexia and dyscalculia accessibility commands via an LLM",
		defaults: {
			name: "Accessibility Skill",
		},
		inputs: [NodeConnectionType.Main],
		outputs: [NodeConnectionType.Main],
		credentials: [
			{
				name: "ollamaApi",
				required: true,
			},
		],
		properties: [
			{
				displayName: "Skill",
				name: "skill",
				type: "options",
				options: [
					{ name: "Dyslexia Support", value: "dyslexia" },
					{ name: "Dyscalculia Support", value: "dyscalculia" },
				],
				default: "dyslexia",
				description: "Which accessibility skill to use",
			},
			{
				displayName: "Command",
				name: "command",
				type: "options",
				options: ALL_COMMANDS.map((c) => ({
					name: `${c.displayName} (${c.skill})`,
					value: c.name,
					description: c.description,
				})),
				default: "text-simplification",
				description: "The specific command to run",
			},
			{
				displayName: "Input Text",
				name: "inputText",
				type: "string",
				typeOptions: {
					rows: 6,
				},
				default: "",
				required: true,
				description: "The text or expression to process",
			},
			{
				displayName: "Locale",
				name: "locale",
				type: "options",
				options: [
					{ name: "English", value: "en" },
					{ name: "Spanish", value: "es" },
					{ name: "French", value: "fr" },
					{ name: "German", value: "de" },
					{ name: "Japanese", value: "ja" },
					{ name: "Chinese", value: "zh" },
					{ name: "Arabic", value: "ar" },
					{ name: "Portuguese", value: "pt" },
					{ name: "Korean", value: "ko" },
					{ name: "Hindi", value: "hi" },
				],
				default: "en",
				description: "Language/locale for the response",
			},
			{
				displayName: "Additional Options",
				name: "options",
				type: "string",
				default: "",
				description: "Optional key:value pairs for command parameters (e.g., reading_level: elementary, preserve_meaning: true)",
			},
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];

		const credentials = await this.getCredentials("ollamaApi");
		const baseUrl = (credentials.baseUrl as string) || "http://localhost:11434";
		const model = (credentials.model as string) || "llama3";

		for (let i = 0; i < items.length; i++) {
			const skill = this.getNodeParameter("skill", i) as string;
			const command = this.getNodeParameter("command", i) as string;
			const inputText = this.getNodeParameter("inputText", i) as string;
			const locale = this.getNodeParameter("locale", i) as string;
			const options = this.getNodeParameter("options", i) as unknown as string;

			const systemPrompt = buildSystemPrompt(skill, command);

			let userMessage = `Please run the '${command}' command.\n\nInput: ${inputText}`;
			if (locale !== "en") {
				userMessage += `\n\nRespond in locale: ${locale}`;
			}
			if (options) {
				userMessage += `\n\nAdditional options: ${options}`;
			}

			const response = await this.helpers.httpRequest({
				method: "POST",
				url: `${baseUrl}/api/chat`,
				body: {
					model,
					messages: [
						{ role: "system", content: systemPrompt },
						{ role: "user", content: userMessage },
					],
					stream: false,
				},
				headers: {
					"Content-Type": "application/json",
				},
			});

			const content =
				response?.message?.content ?? response?.choices?.[0]?.message?.content ?? JSON.stringify(response);

			returnData.push({
				json: {
					skill,
					command,
					locale,
					input: inputText,
					output: content,
					model,
				},
			});
		}

		return [returnData];
	}
}
