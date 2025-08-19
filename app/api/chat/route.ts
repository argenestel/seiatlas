import { NextRequest, NextResponse } from "next/server";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";

export async function POST(req: NextRequest) {
	const { message } = await req.json();
	const apiKey = process.env.NEXT_PUBLIC_GEMINI_KEY;
	console.log(apiKey);

	if (!apiKey) {
		return NextResponse.json(
			{ error: "API key not found in the request" },
			{ status: 400 },
		);
	}

	const llm = new ChatGoogleGenerativeAI({
		model: "gemini-2.5-flash",
		apiKey: apiKey,
	});

	const system = new SystemMessage(
		[
			"You are seiatlas, an expert smart contract engineer and coding copilot.",
			"Always respond with clear markdown.",
			"When you provide code, wrap it in fenced code blocks with a language tag, e.g. ```solidity ... ```.",
			"If you are creating or editing a file, include an explicit file path hint on a separate line like 'path: ./contracts/Contract.sol' before the code block.",
			"Keep non-code explanation concise.",
		].join("\n")
	);

	const result = await llm.invoke([system, new HumanMessage(message)]);

	return NextResponse.json({ response: result.content });
}
