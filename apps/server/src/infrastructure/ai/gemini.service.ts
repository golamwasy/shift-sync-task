import { GoogleGenAI, Type, Schema } from '@google/genai';

export class GeminiService {
  private ai: GoogleGenAI;

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error(
        'GEMINI_API_KEY environment variable is not set. ' +
        'Please add it to apps/server/.env'
      );
    }
    this.ai = new GoogleGenAI({ apiKey });
  }

  async parseTaskText(text: string) {
    const responseSchema: Schema = {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          title: {
            type: Type.STRING,
            description: "A concise title representing the core action of the task.",
          },
          category: {
            type: Type.STRING,
            description: "A brief category for the task, e.g., 'Work', 'Personal', 'Meeting'.",
          },
          scheduledAt: {
            type: Type.STRING,
            description: "An ISO 8601 formatted timestamp (e.g. 2025-06-10T18:00:00) for the scheduled date and time. Resolve all relative expressions against the CURRENT_DATETIME provided.",
            nullable: true,
          },
        },
        required: ["title", "category"],
      }
    };

    // Inject the server's real current time so Gemini can resolve relative expressions
    const now = new Date();
    const currentDatetime = now.toISOString();
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

    const prompt = `You are an expert task scheduling assistant. Your job is to extract structured task details from natural language.
The user may provide one OR multiple tasks in a single message. Extract ALL of them.

## CURRENT CONTEXT
- Current date & time (ISO 8601): ${currentDatetime}
- Server timezone: ${timezone}

## TIME-OF-DAY CONVENTIONS
- "morning" → 09:00, "noon" → 12:00, "afternoon" → 14:00, "evening" → 18:00, "night" → 20:00
- If no time is mentioned at all → default to 12:00 on that day

## TASK
Parse the user's input and return a JSON ARRAY of objects. Each object should represent one event/task.
User input: "${text}"`;

    try {
      const response = await this.ai.models.generateContent({
        model: 'gemini-3.1-flash-lite-preview',
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: responseSchema,
        }
      });

      if (!response.text) {
        throw new Error("No response from Gemini");
      }

      return JSON.parse(response.text);
    } catch (error: any) {
      console.error("Gemini Parsing Error:", error);
      if (error.status === 429) {
        throw new Error("AI Rate Limit Exceeded (429). Please wait a moment before trying again.");
      }
      throw new Error("Failed to parse task text. AI service might be busy.");
    }
  }
}
