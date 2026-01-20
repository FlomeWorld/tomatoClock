import { GoogleGenAI } from "@google/genai";
import { BlockedSite, FocusTip } from '../types';

const getAiClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    console.error("API_KEY not found in environment variables");
    return null;
  }
  return new GoogleGenAI({ apiKey });
};

export const getFocusMotivation = async (
  blockedSites: BlockedSite[], 
  currentMode: string
): Promise<FocusTip | null> => {
  const ai = getAiClient();
  if (!ai) return null;

  const sitesList = blockedSites.map(s => s.url).join(', ');
  
  const prompt = `
    I am using a Pomodoro focus timer. 
    Current mode: ${currentMode}.
    I struggle with distracting websites like: ${sitesList || "social media generally"}.
    
    Give me a very short, punchy, 1-2 sentence piece of advice or motivation.
    If the mode is WORK, be strict or encouraging about avoiding these sites.
    If the mode is BREAK, tell me to actually rest away from screens.
    
    Return a JSON object with:
    {
      "text": "The advice string",
      "type": "motivation" (or "strategy" or "scolding")
    }
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        responseMimeType: "application/json"
      }
    });

    const text = response.text;
    if (!text) return null;
    
    return JSON.parse(text) as FocusTip;
  } catch (error) {
    console.error("Error fetching motivation:", error);
    return {
      text: "Keep pushing forward. You got this!",
      type: "motivation"
    };
  }
};