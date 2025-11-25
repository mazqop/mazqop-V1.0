import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { AgentType } from "../types";

// Ideally, this is initialized once, but for the sake of the demo structure:
const getAiClient = () => {
  // STRICTLY using process.env.API_KEY as per instructions
  const apiKey = process.env.API_KEY; 
  if (!apiKey) {
    console.warn("API_KEY is missing from process.env");
    // We will let the call fail gracefully if no key, or handle in UI
  }
  return new GoogleGenAI({ apiKey: apiKey });
};

export const generateAgentResponse = async (
  agentType: AgentType,
  userMessage: string,
  contextFiles: string, // Content of relevant files to give context
  systemInstruction: string // Dynamic system instruction
): Promise<string> => {
  try {
    const ai = getAiClient();
    
    // Construct a rich prompt with context
    const fullPrompt = `
    [参考文件上下文]
    ${contextFiles}
    [结束参考]

    [用户指令]
    ${userMessage}
    `;

    const response: GenerateContentResponse = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: fullPrompt,
      config: {
        systemInstruction: systemInstruction,
        temperature: 0.7, // Creativity balance
        maxOutputTokens: 8192, // Large context for novel writing
      },
    });

    return response.text || "未生成回复。";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return `错误: ${(error as Error).message}. 请检查 API Key。`;
  }
};