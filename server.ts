import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';

const app = express();
app.use(express.json());

const PORT = 3000;
const isProd = process.env.NODE_ENV === 'production';

// Lazy initialization function for Gemini API
let aiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY is not configured in the environment variables. Please provide it in the Settings > Secrets menu.');
    }
    aiClient = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return aiClient;
}

// 1. AI Bible Assistant Chat Endpoint
app.post('/api/study', async (req: express.Request, res: express.Response) => {
  try {
    const { message, chatHistory } = req.body;
    if (!message) {
      return res.status(400).json({ error: 'Message is required.' });
    }

    const ai = getGeminiClient();
    
    // Structure chat history into standard contents format
    const contents = [];
    if (chatHistory && Array.isArray(chatHistory)) {
      for (const msg of chatHistory) {
        contents.push({
          role: msg.role === 'user' ? 'user' : 'model',
          parts: [{ text: msg.text }]
        });
      }
    }
    contents.push({ role: 'user', parts: [{ text: message }] });

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: contents,
      config: {
        systemInstruction: `You are a warm, wise, and highly knowledgeable Biblical scholar and friendly Christian mentor. 
Your goal is to help users understand scripture, explore theology, grow in faith, and find daily encouragement. 
Always remain deeply encouraging, respectful of different Christian traditions, and centered on scripture. 
Structure your responses with readable paragraphs, clear bullet points, and highlight relevant bible references. 
Keep your tone encouraging, reflective, and accessible.`,
      },
    });

    res.json({ text: response.text });
  } catch (err: any) {
    console.error('Error in /api/study:', err);
    res.status(500).json({ error: err.message || 'Failed to generate study assistance.' });
  }
});

// 2. AI Daily Verse Reflection Endpoint
app.post('/api/verse-reflection', async (req: express.Request, res: express.Response) => {
  try {
    const { verse, reference } = req.body;
    if (!verse || !reference) {
      return res.status(400).json({ error: 'Verse and reference are required.' });
    }

    const ai = getGeminiClient();
    const prompt = `Please provide a beautiful daily devotion/reflection for the Bible verse: "${verse}" (${reference}). 
Include:
1. "Reflection" - A deep, encouraging explanation of the verse's meaning and context (2-3 paragraphs).
2. "Application" - Concrete, practical ways to live out this truth in modern daily life (3 bullet points).
3. "Prayer" - A short, heartfelt, poetic prayer responding to this verse (1 paragraph).`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: prompt,
      config: {
        systemInstruction: 'You are an inspiring and eloquent devotional writer, known for writing warm, uplifting, and deep reflections on Scripture.',
      }
    });

    res.json({ text: response.text });
  } catch (err: any) {
    console.error('Error in /api/verse-reflection:', err);
    res.status(500).json({ error: err.message || 'Failed to generate reflection.' });
  }
});

// 3. Smart Bible Dictionary Endpoint
app.post('/api/dictionary', async (req: express.Request, res: express.Response) => {
  try {
    const { word } = req.body;
    if (!word) {
      return res.status(400).json({ error: 'Word to lookup is required.' });
    }

    const ai = getGeminiClient();
    const prompt = `Explain the Biblical definition, historical context, and spiritual significance of the word or concept: "${word}". 
Provide:
- Greek/Hebrew original word or root if applicable.
- Historical or cultural context.
- Where it appears key scriptures (mention at least 2 references).
- How it applies to our modern faith journey.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: prompt,
      config: {
        systemInstruction: 'You are an expert biblical lexicographer and historian, presenting technical information in an easy-to-understand, engaging format.',
      }
    });

    res.json({ text: response.text });
  } catch (err: any) {
    console.error('Error in /api/dictionary:', err);
    res.status(500).json({ error: err.message || 'Failed to lookup word.' });
  }
});

// 4. Smart Bible Quiz Generation Endpoint
app.post('/api/quiz', async (req: express.Request, res: express.Response) => {
  try {
    const { topic, difficulty } = req.body;
    const selectedTopic = topic || 'General Bible Knowledge';
    const selectedDifficulty = difficulty || 'Medium';

    const ai = getGeminiClient();
    const prompt = `Generate a 5-question multiple choice Bible quiz on the topic: "${selectedTopic}" with difficulty level "${selectedDifficulty}". 
The output MUST be in valid JSON format matching this schema:
An array of questions, where each question object has:
- "question": string
- "options": array of 4 strings
- "answerIndex": integer (0 to 3) representing the index of the correct option
- "explanation": string (an encouraging, informative explanation of why this answer is correct and the Biblical reference)

Generate ONLY valid JSON. Do not include markdown code block syntax (like \`\`\`json) or any extra text outside the JSON.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.ARRAY,
          description: 'A list of multiple choice questions',
          items: {
            type: Type.OBJECT,
            properties: {
              question: { type: Type.STRING },
              options: {
                type: Type.ARRAY,
                items: { type: Type.STRING }
              },
              answerIndex: { type: Type.INTEGER },
              explanation: { type: Type.STRING }
            },
            required: ['question', 'options', 'answerIndex', 'explanation']
          }
        }
      }
    });

    if (!response.text) {
      throw new Error('Empty response from Gemini model');
    }
    const quizData = JSON.parse(response.text.trim());
    res.json({ quiz: quizData });
  } catch (err: any) {
    console.error('Error in /api/quiz:', err);
    res.status(500).json({ error: err.message || 'Failed to generate quiz.' });
  }
});

// 5. Config / Status check endpoint
app.get('/api/config', (req: express.Request, res: express.Response) => {
  res.json({ hasApiKey: !!process.env.GEMINI_API_KEY });
});

// Setup development or production environment
if (!isProd) {
  console.log('Running in DEVELOPMENT mode. Initializing Vite middleware...');
  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: 'spa',
  });
  app.use(vite.middlewares);
} else {
  console.log('Running in PRODUCTION mode. Serving dist folder...');
  const distPath = path.resolve('dist');
  app.use(express.static(distPath));
  app.get('*', (req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server is running at http://localhost:${PORT}`);
});
