import { GoogleGenAI, Type, Schema } from '@google/genai';

export class GeminiService {
  private ai: GoogleGenAI;

  constructor() {
    // Requires GEMINI_API_KEY environment variable to be set
    this.ai = new GoogleGenAI({});
  }

  async parseTaskText(text: string) {
    const responseSchema: Schema = {
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
          description: "An ISO 8601 formatted timestamp (e.g. 2025-06-10T18:00:00) for the scheduled date and time. Resolve all relative expressions (tomorrow, next week, in the evening, etc.) against the CURRENT_DATETIME provided in the system context. If truly no date can be inferred, return null.",
          nullable: true,
        },
      },
      required: ["title", "category"],
    };

    // Inject the server's real current time so Gemini can resolve relative expressions
    const now = new Date();
    const currentDatetime = now.toISOString();
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

    const prompt = `You are an expert task scheduling assistant. Your job is to extract structured task details from natural language.

## CURRENT CONTEXT
- Current date & time (ISO 8601): ${currentDatetime}
- Server timezone: ${timezone}

## TIME-OF-DAY CONVENTIONS (use these when the user gives a vague time)
- "morning" → 09:00
- "mid-morning" → 10:30
- "noon" / "lunchtime" → 12:00
- "afternoon" → 14:00
- "evening" → 18:00
- "night" / "tonight" → 20:00
- "late night" → 22:00
- If no time is mentioned at all → default to 12:00 on that day

## RELATIVE DATE CONVENTIONS
- "tomorrow" → the next calendar day relative to CURRENT_DATETIME
- "next [weekday]" → the soonest upcoming occurrence of that weekday
- "in X hours / days / weeks" → add that duration to CURRENT_DATETIME

## TASK
Parse the user's input and return a JSON object.
User input: "${text}"`;


    try {
      const response = await this.ai.models.generateContent({
        model: 'gemini-2.5-flash',
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
    } catch (error) {
      console.error("Gemini Parsing Error:", error);
      throw new Error("Failed to parse task text");
    }
  }
}
