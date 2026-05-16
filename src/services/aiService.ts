import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export interface MatchInsight {
  reason: string;
  myVibe: string;
  theirVibe: string;
  conclusion: string;
  icebreakers: string[];
}

export async function generateMatchInsight(
  user1: { name: string; zodiac: string; bio: string; chatStyle?: string },
  user2: { name: string; zodiac: string; bio: string; chatStyle?: string }
): Promise<MatchInsight> {
  const prompt = `
    Analyze the profiles of two people who have just matched on a "Soulmate Compass" app.
    
    Person 1 (User):
    - Name: ${user1.name}
    - Zodiac: ${user1.zodiac}
    - Bio/Vibe: ${user1.bio}
    - Recent Chat Behavior: ${user1.chatStyle || "Just joined"}

    Person 2 (Match):
    - Name: ${user2.name}
    - Zodiac: ${user2.zodiac}
    - Bio/Vibe: ${user2.bio}
    - Recent Chat Behavior: ${user2.chatStyle || "Just joined"}

    Create a short, meaningful insight about why they matched. 
    Focus on their personalities, zodiac compatibility (briefly), and their "vibe".
    The goal is to make the connection feel like destiny, not just random.
    
    Return the response as a JSON object with these fields:
    - reason: A catchy headline about why they matched (e.g., "Aligned Stars", "Deep Connection").
    - myVibe: A short observation about why the first user would like this match (e.g., "You like calm, meaningful talks").
    - theirVibe: A short observation about the second user (e.g., "They express emotions openly").
    - conclusion: A final encouraging thought (e.g., "This creates a balanced connection").
    - icebreakers: An array of 3 creative, non-generic conversation starters based on these insights.
    
    Keep descriptions short and poetic. Do not use more than 15 words per field.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      }
    });

    const text = response.text;
    if (!text) throw new Error("Empty AI response");
    
    return JSON.parse(text) as MatchInsight;
  } catch (error) {
    console.error("AI Insight Error:", error);
    return {
      reason: "Cosmic Connection",
      myVibe: "You seek depth in every interaction.",
      theirVibe: "They bring a unique energy here.",
      conclusion: "A beautiful alignment is forming.",
      icebreakers: [
        "What's a dream you've never told anyone?",
        "How do you usually find your inner peace?",
        "If our meeting was destiny, what's our first chapter called?"
      ]
    };
  }
}
