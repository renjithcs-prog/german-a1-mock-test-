import { GoogleGenAI, Type, Modality } from "@google/genai";
import { Question, QuestionType, ExamCategory } from "../types";

// Initialize Gemini Client
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// Schema for structured JSON output
const questionSchema = {
  type: Type.OBJECT,
  properties: {
    id: { type: Type.STRING },
    category: { type: Type.STRING, enum: ['Grammar (Grammatik)', 'Vocabulary (Wortschatz)', 'Listening (Hören)', 'Reading (Lesen)'] },
    type: { 
      type: Type.STRING, 
      enum: [
        QuestionType.MULTIPLE_CHOICE, 
        QuestionType.FILL_BLANK, 
        QuestionType.LISTENING,
        QuestionType.TRUE_FALSE
      ] 
    },
    questionText: { type: Type.STRING },
    options: { 
      type: Type.ARRAY, 
      items: { type: Type.STRING },
      description: "List of options. MUST provide 3-4 options for Multiple Choice and Listening. MUST provide ['Richtig', 'Falsch'] for True/False."
    },
    correctAnswer: { type: Type.STRING },
    explanation: { type: Type.STRING, description: "Short explanation in English." },
    listeningScript: { type: Type.STRING, description: "German text that will be spoken. Required ONLY for 'Listening (Hören)' questions." },
    contextText: { type: Type.STRING, description: "A short German paragraph, email, or advertisement. Required for 'Reading (Lesen)'." },
    imageDescription: { type: Type.STRING, description: "Visual description for 'Vocabulary (Wortschatz)' images. E.g., 'A red sofa in a living room'." }
  },
  required: ["id", "category", "type", "questionText", "correctAnswer", "explanation"],
};

const quizSchema = {
  type: Type.ARRAY,
  items: questionSchema
};

const getTheme = () => {
  const themes = [
    "Public Transport (Bahnhof, Zug, Ticket)",
    "Shopping (Supermarkt, Kleidung, Preis)",
    "Housing (Wohnung, Möbel, Miete)",
    "Food & Dining (Restaurant, Essen, Trinken)",
    "Work & Professions (Büro, Beruf, Kollegen)",
    "Health (Arzt, Termin, Apotheke)",
    "Daily Routine (Uhrzeit, Aufstehen, Schule)",
    "Travel & Hotel (Urlaub, Rezeption, Flughafen)"
  ];
  return themes[Math.floor(Math.random() * themes.length)];
};

// Helper to generate a specific section
const generateSection = async (
  category: ExamCategory, 
  count: number, 
  instructions: string,
  timestamp: number
): Promise<Question[]> => {
  const theme = getTheme();
  const model = "gemini-2.5-flash";
  
  const prompt = `
    Generate exactly ${count} German A1 Level questions for the category: "${category}".
    Theme focus: "${theme}" (but vary context slightly).
    Timestamp Seed: ${timestamp}-${category}

    ${instructions}

    IMPORTANT: 
    - Strictly CEFR A1 level (Beginner).
    - Ensure 'options' are ALWAYS provided for Multiple Choice, Listening, and True/False.
    - Do not repeat questions.
  `;

  try {
    const response = await ai.models.generateContent({
      model: model,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: quizSchema,
      },
    });

    const text = response.text;
    if (!text) return [];
    return JSON.parse(text) as Question[];
  } catch (e) {
    console.error(`Failed to generate section ${category}`, e);
    return [];
  }
};

export const generateA1Quiz = async (): Promise<Question[]> => {
  try {
    const timestamp = new Date().getTime();
    
    // Run 4 parallel requests to generate 12 questions (3 per section)
    
    const [listening, reading, grammar, vocabulary] = await Promise.all([
      generateSection(
        'Listening (Hören)', 
        3, 
        `
        Type: LISTENING.
        Requirements:
        - Provide 'listeningScript' for every question.
        - 1 question: Short dialogue (2 people).
        - 1 question: Public announcement (Train/Airport).
        - 1 question: Phone message.
        - Question text should ask about specific details (Time, Place, Who, Price).
        `, 
        timestamp
      ),
      generateSection(
        'Reading (Lesen)', 
        3, 
        `
        Type: MULTIPLE_CHOICE or TRUE_FALSE.
        Requirements:
        - Provide 'contextText' (Emails, Notes, Ads, Signs) for every question.
        - 2 questions: True/False (Richtig/Falsch) based on a short email.
        - 1 question: Multiple Choice based on an advertisement or sign.
        `, 
        timestamp
      ),
      generateSection(
        'Grammar (Grammatik)', 
        3, 
        `
        Type: MULTIPLE_CHOICE.
        Requirements:
        - Focus on: Verb conjugation, Articles (der/die/das/den), Prepositions (in, an, auf, bei), Modal verbs (können, müssen).
        - No images or long context needed, just the sentence with a blank.
        `, 
        timestamp
      ),
      generateSection(
        'Vocabulary (Wortschatz)', 
        3, 
        `
        Type: MULTIPLE_CHOICE or FILL_BLANK.
        Requirements:
        - 2 questions: Image-based (Provide 'imageDescription'). Ask "Was ist das?". VARY the objects (Furniture, Food, Clothing, Office). DO NOT USE APPLES.
        - 1 question: Sentence completion (vocabulary in context).
        `, 
        timestamp
      )
    ]);

    // Combine and assign unique IDs to be safe
    const allQuestions = [...listening, ...reading, ...grammar, ...vocabulary].map((q, index) => ({
      ...q,
      id: `q-${timestamp}-${index}`
    }));

    if (allQuestions.length === 0) throw new Error("Failed to generate exam data.");

    return allQuestions;
  } catch (error) {
    console.error("Quiz Generation Error:", error);
    throw error;
  }
};

export const generateSpeech = async (text: string): Promise<Uint8Array> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text: text }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Kore' }, 
          },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!base64Audio) {
      throw new Error("No audio data returned");
    }

    const binaryString = atob(base64Audio);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    return bytes;

  } catch (error) {
    console.error("TTS Generation Error:", error);
    throw error;
  }
};

export const decodePCM = (
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number = 24000
): AudioBuffer => {
  const dataInt16 = new Int16Array(data.buffer);
  const numChannels = 1;
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);
  
  const channelData = buffer.getChannelData(0);
  for (let i = 0; i < frameCount; i++) {
    channelData[i] = dataInt16[i] / 32768.0;
  }
  
  return buffer;
};

export const generateImage = async (prompt: string): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [{ text: prompt }],
      },
      config: {
        imageConfig: {
          aspectRatio: "1:1",
        }
      },
    });

    let imageUrl = '';
    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        imageUrl = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
        break;
      }
    }

    if (!imageUrl) throw new Error("No image generated");
    return imageUrl;
  } catch (error) {
    console.error("Image Generation Error:", error);
    throw error;
  }
};