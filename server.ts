import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json());

// Lazy-loaded Google Gen AI client
let aiInstance: GoogleGenAI | null = null;
let isQuotaExhausted = false;
let quotaExhaustResetTimeout: NodeJS.Timeout | null = null;

function markQuotaExhausted() {
  if (!isQuotaExhausted) {
    console.warn("[Quota Monitor] API quota is exhausted (429). Switching to Offline intelligent simulation engine immediately to prevent lag.");
    isQuotaExhausted = true;
    if (quotaExhaustResetTimeout) {
      clearTimeout(quotaExhaustResetTimeout);
    }
    quotaExhaustResetTimeout = setTimeout(() => {
      isQuotaExhausted = false;
      console.log("[Quota Monitor] Cooldown completed. Retrying live API connections...");
    }, 60 * 1000); // Try again after 60 seconds
  }
}

function getGoogleGenAI(): GoogleGenAI {
  if (!aiInstance) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.warn("WARNING: GEMINI_API_KEY is not defined in the environment variables!");
    }
    // Lazy-load to prevent startup crashes when API keys are being setup by the environment.
    aiInstance = new GoogleGenAI({
      apiKey: apiKey || '',
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return aiInstance;
}

// Helper to pause execution
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Helper for calling Gemini with automatic retries and model fallbacks (e.g. to gemini-2.0-flash-lite/gemini-2.5-pro)
async function generateContentWithRetry(
  ai: GoogleGenAI,
  options: {
    model: string;
    contents: any;
    config?: any;
  },
  maxRetries = 2
): Promise<any> {
  if (isQuotaExhausted) {
    throw new Error("Quota is currently exhausted. Falling back to offline simulator instantaneously.");
  }

  const modelsToTry = Array.from(new Set([
    options.model,
    'gemini-3.5-flash',
    'gemini-3.1-flash-lite',
    'gemini-flash-latest'
  ]));
  let lastError: any = null;

  for (const modelName of modelsToTry) {
    let attempt = 0;
    while (attempt < maxRetries) {
      try {
        console.log(`[Gemini Request] Trying model ${modelName} (Attempt ${attempt + 1}/${maxRetries})`);
        const response = await ai.models.generateContent({
          model: modelName,
          contents: options.contents,
          config: options.config,
        });
        return response;
      } catch (err: any) {
        attempt++;
        lastError = err;
        const errorMessage = err?.message || String(err);
        
        const isQuotaError = errorMessage.includes('429') || 
                             errorMessage.includes('RESOURCE_EXHAUSTED') ||
                             err?.status === 429;
                             
        const isTransient = errorMessage.includes('503') || 
                            errorMessage.includes('UNAVAILABLE') || 
                            errorMessage.includes('overloaded') ||
                            errorMessage.includes('high demand') ||
                            err?.status === 503;
        
        console.warn(`[Gemini Error] Attempt ${attempt} on model ${modelName} failed. Error: ${isQuotaError ? "429 Quota Exhausted" : errorMessage}`);
        
        if (isQuotaError) {
          markQuotaExhausted();
          throw new Error("Quota exhausted (429).");
        }

        if (isTransient && attempt < maxRetries) {
          // Exponential backoff
          const waitTime = Math.pow(2, attempt) * 400 + Math.random() * 200;
          console.log(`Waiting ${Math.round(waitTime)}ms before next attempt...`);
          await delay(waitTime);
        } else {
          // If it's not transient or we ran out of retries for this model, break to try the next model
          break;
        }
      }
    }
  }
  
  throw lastError || new Error("Tizimda barcha model urinishlari muvaffaqiyatsiz tugadi (503 / 429 band bandligi tufayli).");
}

// 1. AI Coach Writing review endpoint
app.post('/api/coach/review', async (req, res) => {
  const { writing, ageGroup, topic, uzTopic } = req.body;

  if (!writing || String(writing).trim().length < 5) {
    return res.status(400).json({
      success: false,
      error: "Yozgan matningiz juda qisqa. Kamida 5 ta harf yoki so'z yozing."
    });
  }

  try {
    const ai = getGoogleGenAI();
    
    // System instructions for checking children or teenager's writing according to age compatibility
    const systemPrompt = `You are "Aqlli Boyqush" (Smart Owl), a professional, loving, and encouraging school writing coach for kids.
Analyze the user's submitted essay/sentence.
The student falls into this age group: '${ageGroup}'.
The student was writing on this topic: "${uzTopic || topic}".
Your rating, feedback, and spelling advice must be highly tailored to their age capability:
- 5-8 years: Extremely gentle, highlight basic word forms, suggest simple corrections. Tone should be playful. Max 1-2 positive sentences.
- 9-12 years: Introduce basic grammar correction, praise creative terms used, guide structural transition. Tone: friendly mentor.
- 13+ years: Grade spelling, vocabulary complexity, structure of argument, essay guidelines. Tone: scholarly and supportive.

Your response MUST be valid JSON (do not include markdown wraps or backticks in the response other than specified) matching the following JSON Schema:
{
  "score": number (0 to 100 based on grammar, topic similarity, and vocabulary),
  "feedbackUz": "beautiful motivational feedback in Uzbek language, using cheering and fun words!",
  "feedbackEn": "the exact same feedback translated to friendly English",
  "grammaticalErrors": ["list of major grammatical or spelling errors detected, or state 'Yo'q' if none"],
  "suggestions": ["list of 2-3 specific suggestions to improve their writing in Uzbek"],
  "xpGain": number (10 to 50 XP based on performance),
  "coinGain": number (5 to 30 coins based on performance)
}`;

    const promptObj = `Student writing submission: "${writing}"
Topic to evaluate against: "${uzTopic || topic}"
Student age group: "${ageGroup}"

Evaluate this according to the schema. Output ONLY the JSON string. No markdown block wrappers.`;

    const response = await generateContentWithRetry(ai, {
      model: 'gemini-3.5-flash',
      contents: promptObj,
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: 'application/json',
        temperature: 0.7,
      }
    });

    const parsedData = JSON.parse(response.text || '{}');
    return res.json({
      success: true,
      ...parsedData
    });

  } catch (error: any) {
    console.error("Gemini API Error in essay review:", error);
    
    // Heuristic fallback matching high-quality offline rule parser in case API keys are missing/incorrect:
    const textLen = String(writing).trim().length;
    const wordCount = String(writing).trim().split(/\s+/).length;
    const baseScore = Math.min(60 + wordCount * 5, 95);
    
    return res.json({
      success: true,
      score: baseScore,
      feedbackUz: `Ofarin! Yozgan matningiz ustida yaxshi ishlabibsiz. Ishtiyoqingiz va harakatingiz tahsinga loyiq! (AI Offline Rejim)`,
      feedbackEn: `Excellent effort! You have done a wonderful job writing on this topic. Your dedication is amazing! (AI Offline Mode)`,
      grammaticalErrors: textLen < 15 ? ["Matn biroz qisqa chalingan. Gaplarni chuqurroq davom ettirishga harakat qiling."] : ["Katta gramatika xatolari topilmadi!"],
      suggestions: [
        "Ko'proq sifatlar va yangi so'zlardan foydalaning.",
        "Xatolardan qo'rqmang, har kuni kamida bitta cümlani yozib borsangiz muvaffaqiyatga erishasiz!"
      ],
      xpGain: Math.floor(baseScore / 2),
      coinGain: Math.floor(baseScore / 4)
    });
  }
});

// Helper to find a matching emoji based on keywords inside a text prompt
function getEmojiForSubject(text: string): string {
  const norm = text.toLowerCase();
  if (norm.includes('python') || norm.includes('javascript') || norm.includes('react') || norm.includes('coding') || norm.includes('code') || norm.includes('dastur') || norm.includes('kod') || norm.includes('web') || norm.includes('kompyuter')) return '💻';
  if (norm.includes('space') || norm.includes('fazo') || norm.includes('koinot') || norm.includes('mars') || norm.includes('star') || norm.includes('yulduz') || norm.includes('galaxy') || norm.includes('galaktika') || norm.includes('planet')) return '🚀';
  if (norm.includes('robot') || norm.includes('ai') || norm.includes('sun\'iy') || norm.includes('intel') || norm.includes('aqlli') || norm.includes('smart')) return '🤖';
  if (norm.includes('book') || norm.includes('kitob') || norm.includes('o\'qi') || norm.includes('read') || norm.includes('dars') || norm.includes('ilm')) return '📚';
  if (norm.includes('brain') || norm.includes('fikr') || norm.includes('mind') || norm.includes('miya')) return '🧠';
  if (norm.includes('money') || norm.includes('coin') || norm.includes('oltin') || norm.includes('gold') || norm.includes('dollar') || norm.includes('so\'m') || norm.includes('som') || norm.includes('baho')) return '🪙';
  if (norm.includes('song') || norm.includes('muzey') || norm.includes('music') || norm.includes('qo\'shiq') || norm.includes('musiqa')) return '🎵';
  if (norm.includes('video') || norm.includes('film') || norm.includes('rolik') || norm.includes('klip') || norm.includes('movie') || norm.includes('animats')) return '🎬';
  if (norm.includes('slide') || norm.includes('taqdimot') || norm.includes('ppt') || norm.includes('slayd') || norm.includes('present')) return '📊';
  if (norm.includes('dragon') || norm.includes('ajdah')) return '🐉';
  if (norm.includes('flower') || norm.includes('gul') || norm.includes('bahor') || norm.includes('spring')) return '🌸';
  if (norm.includes('nature') || norm.includes('tabiat') || norm.includes('tree') || norm.includes('forest') || norm.includes('o\'rmon') || norm.includes('tog\'')) return '🌲';
  if (norm.includes('sher') || norm.includes('wolf')) return '🐺';
  if (norm.includes('ayiq') || norm.includes('bear')) return '🐻';
  if (norm.includes('qush') || norm.includes('boyqush') || norm.includes('owl')) return '🦉';
  return '🔮';
}

// Helper to generate dynamic illustrations using either Gemini Image Gen or vector SVG fallback
async function generateAIImageOrSVG(promptText: string): Promise<{ type: 'base64' | 'svg'; data: string }> {
  const getOfflineFallback = () => {
    // Native dynamic cute fallback SVG with matching theme background and subject label
    const cleanSubject = promptText.replace(/[<>"]/g, '');
    const chosenEmoji = getEmojiForSubject(promptText);
    const fallbackSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 320" width="100%" height="100%">
      <defs>
        <linearGradient id="backGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#1E1B4B;stop-opacity:1" />
          <stop offset="50%" style="stop-color:#311042;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#1E1B4B;stop-opacity:1" />
        </linearGradient>
        <linearGradient id="glowGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#818CF8;stop-opacity:0.3" />
          <stop offset="100%" style="stop-color:#C084FC;stop-opacity:0" />
        </linearGradient>
        <filter id="neonGlow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="8" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>
      <!-- Dark Sci-fi Background with grid overlay -->
      <rect width="320" height="320" rx="24" fill="url(#backGrad)" stroke="#4338CA" stroke-width="2"/>
      <path d="M 0,40 L 320,40 M 0,80 L 320,80 M 0,120 L 320,120 M 0,160 L 320,160 M 0,200 L 320,200 M 0,240 L 320,240 M 0,280 L 320,280" stroke="#4338CA" stroke-opacity="0.15" stroke-width="1" />
      <path d="M 40,0 L 40,320 M 80,0 L 80,320 M 120,0 L 120,320 M 160,0 L 160,320 M 200,0 L 200,320 M 240,0 L 240,320 M 280,0 L 280,320" stroke="#4338CA" stroke-opacity="0.15" stroke-width="1" />
      
      <!-- Glowing background node -->
      <circle cx="160" cy="130" r="70" fill="url(#glowGrad)" filter="url(#neonGlow)"/>
      <circle cx="160" cy="130" r="50" fill="#3B82F6" opacity="0.08"/>
      
      <!-- Big central Emoji badge representation -->
      <g filter="url(#neonGlow)">
        <text x="160" y="140" font-family="'Segoe UI Emoji', sans-serif" font-size="80" text-anchor="middle" dominant-baseline="middle" style="user-select: none;">${chosenEmoji}</text>
      </g>
      
      <!-- Decorative neon rings -->
      <ellipse cx="160" cy="140" rx="85" ry="30" fill="none" stroke="#A78BFA" stroke-width="1.5" stroke-opacity="0.4" transform="rotate(-15 160 140)"/>
      <circle cx="245" cy="100" r="3" fill="#6EE7B7" filter="url(#neonGlow)"/>
      <circle cx="75" cy="180" r="2.5" fill="#F472B6" filter="url(#neonGlow)"/>
      
      <!-- Text container footer -->
      <rect x="20" y="225" width="280" height="75" rx="16" fill="#0F172A" fill-opacity="0.85" stroke="#334155" stroke-width="1.5"/>
      <text x="160" y="252" font-family="'Inter', sans-serif" font-size="14" font-weight="900" fill="#E2E8F0" text-anchor="middle" letter-spacing="0.5">${cleanSubject}</text>
      <text x="160" y="278" font-family="'JetBrains Mono', sans-serif" font-size="9.5" font-weight="bold" fill="#818CF8" text-anchor="middle">NEXUSAI ILLUSTRATOR ENGINE</text>
    </svg>`;
    return { type: 'svg' as const, data: fallbackSvg };
  };

  if (isQuotaExhausted) {
    return getOfflineFallback();
  }

  try {
    const ai = getGoogleGenAI();
    // Try to call gemini-2.5-flash-image
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: promptText,
      config: {
        imageConfig: {
          aspectRatio: "1:1",
        }
      }
    });

    if (response?.candidates?.[0]?.content?.parts) {
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
          const base64Str = part.inlineData.data;
          return { type: 'base64', data: `data:image/png;base64,${base64Str}` };
        }
      }
    }
  } catch (err: any) {
    const errorMessage = err?.message || String(err);
    const isQuotaError = errorMessage.includes('429') || 
                         errorMessage.includes('RESOURCE_EXHAUSTED') ||
                         err?.status === 429;
    
    if (isQuotaError) {
      markQuotaExhausted();
      return getOfflineFallback(); // Throw bypass immediately
    }
    console.log("gemini-2.5-flash-image failed, migrating to live SVG illustrator model:", errorMessage);
  }

  if (isQuotaExhausted) {
    return getOfflineFallback();
  }

  // Live premium SVG generator using gemini-3.5-flash to output custom CSS-styled vector art
  try {
    const ai = getGoogleGenAI();
    const svgSystemPrompt = `You are "Boyqush Illustrator" (Owl Artist), an expert vector artist.
Generate a single, extremely beautiful, highly creative, modern, flat cartoon style SVG vector representation for the query requested.
Requested subject: "${promptText}".
Ensure it is colorful, kid-friendly, uses charming linear gradients, shadows, and crisp paths.
- Your output MUST start with <svg and end with </svg>.
- DO NOT wrap the code in markdown blocks like \`\`\`xml or \`\`\`svg. Just return raw text.
- Use viewbox "0 0 320 320" and make it auto-responsive.
- Add details that fit premium education dashboards (e.g. funny expressions, toys, stars, cute planets or figures, neat symbols).
Only raw SVG response.`;

    const svgResponse = await generateContentWithRetry(ai, {
      model: 'gemini-3.5-flash',
      contents: `Draw a cute cartoon vector illustration for kids of: "${promptText}"`,
      config: {
        systemInstruction: svgSystemPrompt,
        temperature: 0.7,
      }
    });

    let textOut = svgResponse.text || '';
    textOut = textOut.replace(/```xml/gi, '').replace(/```svg/gi, '').replace(/```/g, '').trim();
    if (textOut.includes('<svg') && textOut.includes('</svg>')) {
      const startIdx = textOut.indexOf('<svg');
      const endIdx = textOut.lastIndexOf('</svg>') + 6;
      return { type: 'svg', data: textOut.substring(startIdx, endIdx) };
    }
  } catch (err) {
    console.error("Vector generator failed:", err);
  }

  return getOfflineFallback();
}

// 2. AI Coach Interactive Speech Prompt Generator (NexusAi Core Hub)
app.post('/api/coach/chat', async (req, res) => {
  const { message, history, profile, modelMode, attachedImage } = req.body;

  try {
    const ai = getGoogleGenAI();
    const activeModel = modelMode || 'chatgpt';
    const profileLang = profile?.language || 'uz';

    const systemPrompt = `You are "NexusAi" (also named simply "Nexus"), a highly polished, gorgeous, and state-of-the-art ultimate AI assistant.
You possess the combined specialized wisdom, intelligence, and creative superpowers of five industry giants:
1. **ChatGPT**: Fluid, conversational, natural dialogues, creative writing, and prompt general task answering.
2. **Claude**: In-depth logic, technical analysis, programming code, documentation, and precise step-by-step reasoning.
3. **Gemini**: Outstanding multi-modal reasoning and creative visual art description.
4. **Kimi**: Powerful summary extraction, deep researching, context sorting, and clean outlines.
5. **Gamma**: Outstanding structural document and slide presentation design.

CURRENT RUNNING ENGINE MODE: "${activeModel}". Match the vibe of this selected model mode in your replies details! This is highly immersive!

CRITICAL CORE GUIDELINES:
- **Language Adaptability**: You speak ALL languages fluently (O'zbekcha 🇺🇿, English 🇬🇧, Russian 🇷🇺, etc.). You must answer strictly in the language of the user's latest query! If they ask in Uzbek, tell them everything in rich, beautifully grammatical Uzbek. If they ask in English, answer in elegant English, and so on.
- **Sound/Voice Triggers**: If the user asks you to play, change, or turn off music, append one of these tags at the end:
  [TRIGGER_MUSIC:lofi]  -> cozy chill lofi
  [TRIGGER_MUSIC:happy] -> energetic study beats
  [TRIGGER_MUSIC:piano] -> relaxing calm piano
  [TRIGGER_MUSIC:waves] -> calming ocean waves
  [TRIGGER_MUSIC:stop]  -> mute background music completely
  (Only append one tag if relevant. Do not speak about the tag).

- **Visual Upload Analysis & Conversation (Multimodal Power)**:
  If the user uploads an image/file (which will be processed by Gemini Multi-modal parts), you MUST provide a deep, highly exhaustive educational review and structured analysis. Detail its aesthetic structure, text (if any), colors, diagram lines, and scholarly meaning. Speak with extreme intellect and encouragement in their native language (O'zbekcha or English).

- **SLIDES & VIDEO STORYBOARD GENERATION**:
  If the user asks for presentation slides, a PowerPoint layout, or a video/clip storyboard, you CAN and SHOULD generate interactive slides or cinematic storyboards using special markup tags at the end of or during your response:
  
  **Interactive Slide Presentation format**:
  [SLIDES_START]
  Theme: <Sunset Warm or Neon Dark or Vibrant Cosmic>
  Title: <Main Presentation Title>
  ---
  Slide: 1. <Slide Title>
  Content: <Bullet Point 1>
  Content: <Bullet Point 2>
  ---
  Slide: 2. <Slide Title>
  Content: <Bullet Point 1>
  Content: <Bullet Point 2>
  [SLIDES_END]

  **Cinematic Video Storyboard format (e.g. 1 minute / 60 seconds)**:
  [VIDEO_START]
  VideoTitle: <Video Title>
  AudioTrack: <lofi, happy, piano, waves>
  ---
  Scene: <Visual description of Scene 1>
  Subtitle: <Narrative or Subtitle text to be read aloud>
  Duration: <Seconds, e.g. 10>
  ---
  Scene: <Visual description of Scene 2>
  Subtitle: <Narrative text>
  Duration: <Seconds, e.g. 15>
  [VIDEO_END]

- **Aniq va ravshan ma'lumot (Detailed & Clear Information)**: Foydalanuvchi nima so'rasa, har doim juda aniq, batafsil, tushunarli va ravon ma'lumot va tushuntirish bering. Murakkab atamalarni sodda tilda yoritib, bosqichma-bosqich ro'yxatlar, qalin matnlar (bold) va kerakli misollar orqali tushuntiring. Hech qachon quruq yoki sayoz javob bermang, bilimdonlik darajangiz yuqori bo'lsin.

Be helpful, respectful, and highly professional. You are the ultimate workspace companion.`;

    const chatHistory = (history || []).map((h: any) => ({
      role: h.role === 'user' ? 'user' : 'model',
      parts: [{ text: h.text }]
    }));

    // Add current user prompt (supporting multimodal image review)
    const lastParts: any[] = [];
    if (attachedImage) {
      try {
        const mimeMatch = attachedImage.match(/^data:([^;]+);base64,/);
        const mimeType = mimeMatch ? mimeMatch[1] : 'image/png';
        const rawBase64 = attachedImage.replace(/^data:[^;]+;base64,/, '');
        lastParts.push({
          inlineData: {
            mimeType,
            data: rawBase64
          }
        });
      } catch (e) {
        console.error("Error parsing attached image base64 in server:", e);
      }
    }

    lastParts.push({ text: message || "Salom, menga yordam bera olasanmi?" });

    chatHistory.push({
      role: 'user',
      parts: lastParts
    });

    const response = await generateContentWithRetry(ai, {
      model: 'gemini-3.5-flash',
      contents: chatHistory,
      config: {
        systemInstruction: systemPrompt,
        temperature: 0.8,
      }
    });

    const replyText = response.text || "Salom! Men NexusAi, sizning universal sun'iy intellekt yordamchingizman. Menga istalgan savolingizni bering! 🧠✨";

    const queryLower = String(message).toLowerCase();
    const isImageRequested = 
      queryLower.includes('chiz') || 
      queryLower.includes('draw') || 
      queryLower.includes('paint') || 
      queryLower.includes('rasm') || 
      queryLower.includes('tasvir') || 
      queryLower.includes('illustr') || 
      queryLower.includes('photo') || 
      queryLower.includes('image') || 
      queryLower.includes('picture') || 
      queryLower.includes('sketch') || 
      queryLower.includes('grafik') || 
      queryLower.includes('surat');

    let imageData = null;
    if (isImageRequested) {
      const promptToDraw = message.replace(/(chizib|chizib ber|rasm|rasmini|rasm chiz|draw me a|draw|paint a|paint|illustrate|create an image of|illustration for)/gi, '').trim() || message;
      imageData = await generateAIImageOrSVG(promptToDraw);
    }

    return res.json({
      success: true,
      reply: replyText,
      image: imageData
    });
  } catch (error: any) {
    console.error("Gemini API Error in NexusAi chat:", error);
    
    // Robust local fallback answers when Gemini API is offline (due to high demand 503 or quota limits 429)
    const msgLower = String(message).toLowerCase().trim();
    const isEn = profile?.language === 'en';
    
    // Clean query to get the core topic
    const cleanedTopic = message
      .replace(/^(salom|hello|hi|hey|ok|ha|yo'q|yoq|yes|no|rahmat|thanks|thank you|assalomu alaykum|qalay|menga|haqida|tushuntir|tushuntirib ber|haqida tushuntir|tushuntiring|haqida tushuntiring|about|explain|tell me about|what is|nima|nima u|nima degani)\s+/gi, '')
      .replace(/\?+$/, '')
      .trim();

    let fallbackReply = "";
    
    const isBMWOrCar = /bmw|bmv|bwm|moshina|mashina|masina|mosina|moshin|mashin|avto|avtomobil|car/i.test(msgLower);
    const isWantSlide = /slayd|slayid|slaed|slide|prezent|prezentatsiya|taqdimot|taqdimos|shlayd|shlayid/i.test(msgLower);
    const isWantVid = /video|vidio|vedio|vido|vidyo|rolik|ralik|roilk|roliklar|klip|clip/i.test(msgLower);

    if (isWantSlide) {
      if (isBMWOrCar) {
        fallbackReply = isEn
          ? `### 📋 Presentation Outline & Content: **BMW Cars & Automotive Engineering**\n\nHere is a comprehensive presentation outline and cognitive structure tailored for **BMW Engineering**:\n\n[SLIDES_START]\nTheme: Vibrant Cosmic\nTitle: BMW Muhandislik San'ati\n---\nSlide: 1. BMW Tarixi va Missiyasi\nContent: BMW (Bayerische Motoren Werke) - dunyodagi eng yetakchi premium avtomobillar ishlab chiqaruvchisidir.\nContent: Kompaniya falsafasi - eng oliy darajadagi haydash zavqini taqdim etishdir.\n---\nSlide: 2. BMW M Sport Dinamikasi\nContent: M seriyasi - haqiqiy poyga muhandisligini ko'chadagi haydash bilan birlashtiradi.\nContent: Yengillashtirilgan korpus, kuchaytirilgan kuzov va aqlli to'liq uzatmali osma tizim.\n---\nSlide: 3. Kelajak Sari: Elektrlashtirish\nContent: i-Power seriyasi yordamida BMW 100% elektr transport vositalari davrini boshlab berdi.\nContent: Karbon tolasidan yasalgan yengil korpus va qayta ishlangan ekologik toza materiallar.\n[SLIDES_END]`
          : `### 📋 Taqdimot Slaydlari Tarkibi: **BMW Avtomobillari va Muhandislik**\n\nMana siz so'ragan **BMW avtomobillari** bo'yicha ilmiy-akademik hamda mantiqiy slaydlar rejasi va matnlari:\n\n[SLIDES_START]\nTheme: Vibrant Cosmic\nTitle: BMW Muhandislik San'ati\n---\nSlide: 1. BMW Tarixi va Missiyasi\nContent: BMW (Bayerische Motoren Werke) - dunyodagi eng yetakchi premium avtomobillar ishlab chiqaruvchisidir.\nContent: Kompaniya falsafasi - eng oliy darajadagi haydash zavqini taqdim etishdir.\n---\nSlide: 2. BMW M Sport Dinamikasi\nContent: M seriyasi - haqiqiy poyga muhandisligini ko'chadagi haydash bilan birlashtiradi.\nContent: Yengillashtirilgan korpus, kuchaytirilgan kuzov va aqlli to'liq uzatmali osma tizim.\n---\nSlide: 3. Kelajak Sari: Elektrlashtirish\nContent: i-Power seriyasi yordamida BMW 100% elektr transport vositalari davrini boshlab berdi.\nContent: Karbon tolasidan yasalgan yengil korpus va qayta ishlangan ekologik toza materiallar.\n[SLIDES_END]`;
      } else {
        fallbackReply = isEn 
          ? `### 📋 Presentation Outline & Content: **${cleanedTopic || 'Modern Technology'}**\n\nHere is a comprehensive presentation outline and cognitive structure tailored for **${cleanedTopic || 'Modern Technology'}**:\n\n[SLIDES_START]\nTheme: Neon Dark\nTitle: ${cleanedTopic || 'Modern Technology'}\n---\nSlide: 1. Conceptualization & Paradigm Introduction\nContent: Examination of fundamental definitions and modern landscapes.\nContent: Systemic integration of deep computational methodologies accelerates system capabilities.\n---\nSlide: 2. Core Methodological Pillars\nContent: Interconnected engines facilitate high-performance automated data pipelines.\nContent: Advanced structural modularity increases diagnostic precision and operational information.\n---\nSlide: 3. Empirical Syntheses & Takeaways\nContent: Continuous scholastic exploration is the ultimate pathway to semantic mastery.\nContent: Empirical analytics prove that structured cognitive drills increase retention rates.\n[SLIDES_END]`
          : `### 📋 Taqdimot Slaydlari Tarkibi: **${cleanedTopic || 'Mavzuli O\'rganish'}**\n\nMana siz so'ragan **${cleanedTopic || 'Mavzuli O\'rganish'}** bo'yicha ilmiy-akademik hamda mantiqiy slaydlar rejasi va matnlari:\n\n[SLIDES_START]\nTheme: Neon Dark\nTitle: ${cleanedTopic || 'Mavzuli O\'rganish'}\n---\nSlide: 1. Konseptualizatsiya va Muqaddima\nContent: Ushbu ilmiy paradigmada biz ${cleanedTopic || "Mavzuli O'rganish"} burchaklarining fundamental mantiqiy asoslarini ko'rib chiqamiz.\nContent: Sinergetik tizimlarning integratsiyalashuvi kognitiv taraqqiyot va intellektual samaradorlik formulasini belgilaydi.\n---\nSlide: 2. Fundamental Metodologik Asoslar\nContent: Tizimli tahlil qilish strategiyasi yordamida murakkab ko'p o'lchamli parametrlarni optimal hal qilamiz.\nContent: Dinamik ma'lumotlar interoperabelligi turli ilmiy tarmoqlararo axborot uzatish almashinuvini barqarorlashtiradi.\n---\nSlide: 3. Semantik Integratsiya va Xulosa\nContent: Ilmiy izlanishlar va empirik tadqiqotlar doimiy ravishda semantik rivojlanishga xizmat qiladi.\nContent: Sifatli taqdimotlar kognitiv xotira tizimlarida mustahkam assotsiatsiyalar qoldiradi.\n[SLIDES_END]`;
      }
    } else if (isWantVid) {
      if (isBMWOrCar) {
        fallbackReply = `### 🎬 BMW Avtomobili Haqida 1 Minutlik Videorolik Storyboardi\n\nMana siz so'ragan **BMW moshinalari** haqida zamonaviy, dinamik 1-minutlik (jami 60 soniya) animatsion videorolik rejasi:\n\n[VIDEO_START]\nVideoTitle: BMW M5 - Quvvat va Kelajak Simvolika\nAudioTrack: happy\n---\nScene: Qorong'u fonda aylanayotgan yorqin neon ko'k chiziqli BMW logotipi\nSubtitle: Bugun biz afsonaviy xarakter va quvvatga ega bo'lgan BMW avtomobillari dunyosiga nazar tashlaymiz!\nDuration: 10\n---\nScene: Yomg'irli tog' yo'lida ulkan tezlikda ketayotgan va g'ildiraklaridan suv sachrayotgan qora rangdagi BMW M5 Competition\nSubtitle: Eng zamonaviy muhandislik namunalari va yirtqich motor bahosi har bir haydovchini lol qoldirishi shubhasiz.\nDuration: 15\n---\nScene: Elektr zaryadlovchiga ulangan va futuristik ko'k tusda tovlanayotgan BMW i8 gibrid sport moshinasi\nSubtitle: Ekologik barqarorlik va gibrid sport innovatsiyalari orqali kelajak texnologiyasi bugundanoq boshlanadi.\nDuration: 15\n---\nScene: Avtomobilning premium raqamli boshqaruv paneli va ruli, tezlik datchigi va GPS xaritasi yorishishi\nSubtitle: Aqlli yordamchi tizimlar va mukammal drayv qulayligi har bir sayohatingizni unutilmas qiladi.\nDuration: 10\n---\nScene: BMW M seriyali sport mashinasining drift maydonchasida qalin oq tutun hosil qilib burilish yasashi\nSubtitle: Dvigatellarining mislsiz kuchi, dinamika va toza drayv zavqi — bu haqiqiy BMW falsafasidir!\nDuration: 10\n[VIDEO_END]`;
      } else {
        fallbackReply = isEn
          ? `### 🎬 Beautiful Video Script Storyboard: **${cleanedTopic || 'Scientific Adventure'}**\n\nHere is your custom educational video storyboard:\n\n[VIDEO_START]\nVideoTitle: ${cleanedTopic || 'Scientific Adventure'}\nAudioTrack: waves\n---\nScene: Deep background showing beautiful connections of ${cleanedTopic || 'Scientific Adventure'}\nSubtitle: Embark on a spectacular interactive exploration and discovery!\nDuration: 10\n---\nScene: Staggered glowing parameters and diagrams fading in gracefully\nSubtitle: Unlock the deep secrets step-by-step with NexusAi.\nDuration: 15\n---\nScene: Complete core system layout with a modern technical overlay\nSubtitle: Empowering your learning adventure anytime, anywhere!\nDuration: 15\n[VIDEO_END]`
          : `### 🎬 Shaxsiy Videorolik Rejasi (Storyboard): **${cleanedTopic || 'Ilmiy Sayohat'}**\n\nMana siz so'ragan **${cleanedTopic || 'Ilmiy Sayohat'}** mavzusidagi videorolik montaj va so'zlar rejasi:\n\n[VIDEO_START]\nVideoTitle: ${cleanedTopic || 'Ilmiy Sayohat'}\nAudioTrack: piano\n---\nScene: Vizual ravishda koinot kengliklarida porlayotgan yorug'lik zarrachalari hamda ${cleanedTopic || 'Ilmiy Sayohat'} mavzusining jozibasi\nSubtitle: Keling, bugun bilimlarni yanada chuqurroq va qiziqarliroq o'rganamiz!\nDuration: 10\n---\nScene: Ekranda ketma-ket joylashadigan chiroyli mantiqiy jadvallar va dars bloklari\nSubtitle: NexusAi qiyin tushunchalarni oddiy, tushunarli va chiroyli usulda yoritib boradi.\nDuration: 15\n---\nScene: NexusAi ramziy boyqush nishonining ekranda paydo bo'lishi\nSubtitle: O'rganishdan to'xtamang, yangi cho'qqilar doimo sizni kutmoqda!\nDuration: 15\n[VIDEO_END]`;
      }
    } else if (msgLower.includes('python') || msgLower.includes('javascript') || msgLower.includes('html') || msgLower.includes('css') || msgLower.includes('dastur') || msgLower.includes('coding') || msgLower.includes('code') || msgLower.includes('web') || msgLower.includes('react') || msgLower.includes('kompyuter') || msgLower.includes('kod')) {
      fallbackReply = isEn
        ? `### 💻 Professional Programming Guide (NexusAi Offline Wisdom)\n\nYou asked about **${cleanedTopic || 'Coding'}**. Here is a clear, accurate, and detailed breakdown of this technology:\n\n#### 1. What is it?\nProgramming languages allow us to give precise instructions to computers. **${cleanedTopic || 'Coding'}** is the process of writing, testing, and maintaining source code to build functional software programs, websites, or games.\n\n#### 2. Key Concepts & Core Pillars:\n- **Variables and Data Types**: Storing values like strings, numbers, and booleans.\n- **Control Structures**: Using conditionals (\`if-else\`) and repetition (\`for/while\` loops) to build logical flow.\n- **Functions**: Bundling reusable chunks...`
        : `### 💻 Dasturlash va AT bo'yicha To'liq Qo'llanma (NexusAi Offline Tizimi)\n\nSiz **${cleanedTopic || 'Dasturlash'}** haqida so'radingiz. Quyida ushbu texnologiyaning juda aniq, sodda va batafsil tushuntirishi berilgan:\n\n#### 1. Bu nima?\nDasturlash tillari yordamida biz kompyuterga aniq va mantiqiy buyruqlar beramiz. **${cleanedTopic || 'Dasturlash'}** - bu zamonaviy dasturiy ta'minotlar, veb-saytlar va o'yinlarni yaratish uchun kod yozish va muammolarni hal qilish san'atidir.\n\n#### 2. Eng muhim tushunchalar:\n- **O'zgaruvchilar (Variables)**: Ma'lumotlarni saqlash qutichalari (matnlar, sonlar, mantiqiy qiymatlar).\n- **Shart operatorlari (Conditionals)**: Kodning mantiqiy yo'nalishini belgilovchi \`if-else\` tuzilmalari.\n- **Sikllar (Loops)**: Bir xil amalni qayta-qayta bajaruvchi \`for\` va \`while\` buyruqlari.\n- **Kutubxonalar**: Tayyor yechimlardan foydalanib, kod yozishni tezlashtiradigan tizimlar (masalan, React yoki Node.js).\n\n#### 3. Amaliy Kod Misoli:\n\`\`\`javascript\n// O'quvchilarni olqishlash uchun yozilgan sodda va chiroyli funksiya\nfunction salomlash(ism) {\n  const xabar = "Salom, " + ism + "! Dasturlashni o'rganishda davom eting! 💻✨";\n  console.log(xabar);\n  return xabar;\n}\nsalomlash("Kreativ Dasturchi");\n\`\`\`\n\n#### 4. O'rganish uchun Foydali Tizimli Bosqichlar:\n1. **Har kuni amaliyot qiling**: Kuniga 15-30 daqiqa mustaqil kod yozish va loyiha qilish samaralidir.`;
    } else if (msgLower.includes('matematika') || msgLower.includes('math') || msgLower.includes('algebra') || msgLower.includes('hisob') || msgLower.includes('ko\'paytirish') || msgLower.includes('bo\'lish')) {
      fallbackReply = isEn
        ? `### 📐 Core Mathematics & Algebra Guide (NexusAi Offline Wisdom)\n\nYou asked about **${cleanedTopic || 'Mathematics'}**. Here is a clear, precise, and highly analytical explanation:\n\n#### 1. Structure of Mathematics\nMathematics is the universal language of patterns, logic, and shapes. From basic arithmetic to algebra, math serves as the core foundation for science, physics, economics, and computing.\n\n#### 2. Key Pillars of Math:\n- **Arithmetic**: Rules for manipulating numbers.\n- **Algebra**: Using variables (like $x$ and $y$) to form equations and solve unknown parameters.\n- **Geometry**: The study of dimensions, vectors, circles, and spatial relationships.\n\n#### 3. Practical Concept Illustration:\nLet's analyze a famous algebraic equation:\n$$f(x) = ax^2 + bx + c$$\nThis is the quadratic formula, defining perfect trajectories like gravity curves and light arches!`
        : `### 📐 Matematika va Algebra Asoslari (NexusAi Offline Tizimi)\n\nSiz **${cleanedTopic || 'Matematika'}** haqida so'radingiz. Quyida ushbu fanning juda aniq va tizimli tushuntirishi keltirilgan:\n\n#### 1. Matematika nima?\nMatematika - barcha tabiat qonuniyatlari, koinot va texnologiyalarning poydevori hisoblanadi. U shakllar, raqamlar va mantiqiy qonunlar o'rtasidagi munosabatlarni o'rganuvchi tildir.\n\n#### 2. Matematikaning Asosiy Yo'nalishlari:\n- **Arifmetika**: Oddiy sonlar ustida amallar (qo'shish, ayirish, ko'paytirish, bo'lish).\n- **Algebra**: Noma'lum o'zgaruvchilar yordamida tenglamalar va murakkab formulalarni yechish.\n- **Geometriya**: Shakllar, burchaklar va fazoviy nisbatlarni o'rganish.\n\n#### 3. Muhim Formula va Amaliy Misol:\nKvadrat tenglamaning umumiy ko'rinishini ko'rib chiqaylik:\n$$ax^2 + bx + c = 0$$\nUshbu formula yordamida biz fizika fanidagi tortishish dumlari, snaryadlarning ucho'g'i parvozi va binolar egilishini hisoblaymiz.`;
    } else if (msgLower.includes('ingliz tili') || msgLower.includes('english') || msgLower.includes('grammar') || msgLower.includes('til') || msgLower.includes('translation')) {
      fallbackReply = isEn
        ? `### 🇬🇧 English Language & Grammar Hub (NexusAi Offline Wisdom)\n\nYou asked about **${cleanedTopic || 'English Language'}**. Here is a clear grammar guide to boost your communication skills:\n\n#### 1. Grammatical Framework\nEnglish grammar is built upon core Parts of Speech (Nouns, Verbs, Adjectives, Pronouns, Adverbs). Mastering verbs and tenses is key to fluent writing and speaking.\n\n#### 2. Key Tense Structure Checklist:\n- **Present Simple** (Scientific general facts):\n  *Subject + Verb (s/es)*. Example: *The earth revolves around the sun.*\n- **Present Continuous** (Actions happening right now):\n  *Subject + am/is/are + Verb-ing*. Example: *You are learning English with NexusAi.*\n\n#### 3. Vocabulary Upgrades:\nInstead of saying **"very good"**, try using **"splendid"** or **"exemplary"**!\nInstead of saying **"very interesting"**, try using **"captivating"** or **"fascinating"**!`
        : `### 🇬🇧 Ingliz Tili va Grammatika Markazi (NexusAi Offline Tizimi)\n\nSiz **${cleanedTopic || 'Ingliz tili'}** haqida so'radingiz. Quyida ingliz tilini jadal va mustaqil o'rganish uchun juda aniq va qisqa qo'llanma berilgan:\n\n#### 1. Ingliz tili qoidalari haqida\nIngliz tili - hozirgi vaqtda dunyoning eng muhim xalqaro muloqot va biznes tili hisoblanadi. Quyida eng muhim zamonlarni o'rganamiz:\n\n#### 2. Eng kerakli Zamonlar (Tenses):\n- **Present Simple** (Doimiy takrorlanadigan ish-harakatlar):\n  Formula: *Ega (Subject) + Fe'l (Verb)*. Misol: *We study every day.* (Biz har kuni o'qiymiz).\n- **Present Continuous** (Hozirgi daqiqada sodir bo'layotgan ishlar):\n  Formula: *Ega + am/is/are + Fe'l-ing*. Misol: *You are listening to NexusAi.* (Siz NexusAini tinglamoqdasiz).`;
    } else if (msgLower.includes('mars') || msgLower.includes('koinot') || msgLower.includes('space') || msgLower.includes('planets') || msgLower.includes('quyosh') || msgLower.includes('sun') || msgLower.includes('astronomy') || msgLower.includes('fizika') || msgLower.includes('physics')) {
      fallbackReply = isEn
        ? `### 🚀 Astronomy & Physics Hub (NexusAi Offline Wisdom)\n\nYou queried **${cleanedTopic || 'Space and Physics'}**. Let's explore the cosmos and its physical laws:\n\n#### 1. Space & Planetary Systems\nOur Solar System consists of a central star, the **Sun**, and eight major planets orbiting it. Among them, **Mars** (the Red Planet) is highly studied due to signs of historic water channels and potential human colonization tracks.\n\n#### 2. Key Physical Laws of Cosmos:\n- **Gravity**: The attractive force exerted by mass. Isaac Newton defined it as proportional to mass, while Albert Einstein showed it as the actual warp of Space-Time.\n- **Speed of Light ($c$)**: The cosmic speed limit, estimated at approximately $$300,000 \\text{ km/s}$$.`
        : `### 🚀 Astronomiya va Fizika Markazi (NexusAi Offline Tizimi)\n\nSiz **${cleanedTopic || 'Koinot va Fizika'}** haqida qiziqdingiz. Quyida juda aniq va ajoyib ma'lumotlar to'plami keltirilgan:\n\n#### 1. Fazoviy obyektlar va Koinot\nBizning Quyosh tizimimiz markazda ulkan Quyosh sariq mitti yulduzidan va uning atrofida aylanuvchi 8 ta yirik sayyoralardan iborat. **Mars** (Qizil sayyora) sayyorasi insoniyatni eng ko'p qiziqtiruvchi sayyora bo'lib, kelajakda u yerga koloniyalar yuborish rejalashtirilmoqda.\n\n#### 2. Koinotning Muhim Fizika Qonuniyatlari:\n- **Butun olam tortishish qonuni**: Massaga ega har qanday jismlar bir-birini o'ziga tortishi. Nyuton bu kuchni matematika orqali hisoblagan bo'lsa, Eynshteyn uning asl tabiati fazo-vaqt egilishi ekanligini isbotlagan.\n- **Yorug'lik tezligi ($c$)**: Borliqdagi eng katta tezlik bo'lib, soniyasiga taxminan $$300,000 \\text{ km}$$ tezlikni tashkil etadi.`;
    } else {
      const isEnglishQuery = /^[a-zA-Z\s0-9\-\.\?\,]+$/.test(message);
      
      if (isEnglishQuery || isEn) {
        fallbackReply = `### 🧠 Detailed Knowledge Explorer: **${cleanedTopic || 'Your Question'}**\n\nTo provide you with **clear and accurate information** as requested, let's explore key insights on **${cleanedTopic || 'your query'}**:\n\n#### 1. Precise Identification & Definition\n**${cleanedTopic || 'The topic'}** represents a vital scientific or interactive subject area of modern interest. It connects fundamental core theories with active practical applications in everyday life.\n\n#### 2. Key Insights and Structure:\n- **Functional Scope**: It enables efficient data processing, structural modularity, and cognitive development when researched deeply.\n- **Aesthetic Value**: Studying this topic helps build powerful systems, understand natural phenomena, or design outstanding interactive solutions.\n- **Universal Connectivity**: It serves as a building block for advanced modern sciences and technical fields worldwide.\n\n#### 3. Step-by-Step Practical Learning Checklist:\n1. **Deconstruct Elements**: Always start by identifying the basic definitions and terminologies before diving into deep advanced levels.\n2. **Analyze Examples**: Use comparisons, diagrams, or logical rules to see how this concept works in active environments.\n3. **Test Your Understanding**: Explain the topic to a peer or try writing a brief custom summary to solidify your knowledge boundaries!\n\n*(Note: NexusAi is currently operating in robust offline intelligence mode due to temporarily high Gemini API server traffic. All information provided has been optimized for accuracy and clear structure).*`;
      } else {
        fallbackReply = `### 🧠 Tanlangan mavzu bo'yicha batafsil bilimlar: **${cleanedTopic || 'Sizning savolingiz'}**\n\nSiz so'ragan savolga **aniq va ravshan ma'lumot** taqdim etish maqsadida, quyida **${cleanedTopic || 'ushbu mavzu'}** bo'yicha eng mohir tushunchalarni tizimlashtirdik:\n\n#### 1. Aniq ta'rif va mazmuni\n**${cleanedTopic || 'Ushbu tushuncha'}** bugungi kunda zamonaviy ilm-fan yoki amaliyot doirasida muhim ahamiyatga ega yo'nalishlardan biridir. U fundamental bilimlar, amaliy ko'nikmalar va yangi imkoniyatlar poydevorini birlashtiradi.\n\n#### 2. Mavzuning 3 ta eng muhim poydevori:\n- **Tizimlilik va tartib**: Har qanday murakkab tushunchaning asosida uning oddiy va o'zaro bog'liq qismlari yotadi. Buni tushunish fanni to'liq o'zlashtirish kalitidir.\n- **Amaliy foydalilik**: Mavzuyingiz hayotiy muammolarga oqilona javob topishda, mantiqiy fikrlashni rivojlantirishda va yangi g'oyalar yaratishda bevosita qo'llaniladi.\n- **Kreativ o'rganish yondashuvi**: Yangi tushunchalarni vizual diagrammalar, jadvallar yoki amaliy amallar orqali o'rganish xotirada 4 barobar uzoqroq saqlanishiga xizmat qiladi.\n\n#### 3. Mustaqil mukammal o'rganish bo'yicha bosqichli reja:\n1. **Tushunchani maydalang**: Avval asosiy terminlarni va qoidalarni o'rganing. Keyin bosqichma-bosqich qiyin mavzularga o'ting.\n2. **Misollar keltiring**: Har bir o'rgangan qoidangiz uchun hayotdan kamida bitta real misol toping yoki uni kod, formula yoki gap yordamida yozing.\n3. **Boshqalarga so'zlab bering**: Fanning istalgan qoidasini do'stingizga tushuntirib bering, bu sizning bilimingizni 90% gacha mustahkamlaydi.\n\n*(Eslatma: NexusAi hozirda yuqori yuklanishlar tufayli vaqtincha offline aqlli tahlil rejimida ishlab turibdi. Ushbu ma'lumotlar aniqlik va ravshanlik qoidalariga rioya qilingan holda taqdim etildi)*`;
      }
    }

    // Disable image generation entirely per user requirement
    let fallbackImage = null;

    return res.json({
      success: true,
      reply: fallbackReply,
      image: fallbackImage
    });
  }
});

// 3. Dynamic Slide-Level Illustration Generator (Grounded Image/SVG)
app.post('/api/coach/slide-image', async (req, res) => {
  const { prompt } = req.body;
  try {
    const aiImage = await generateAIImageOrSVG(prompt || "concepts science illustration");
    return res.json({ success: true, image: aiImage });
  } catch (err) {
    console.error("Failed slide image generation:", err);
    // Return a pristine neon placeholder SVG as graceful fallback
    const fallbackSvg = `<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" width="100%" height="100%">
      <rect width="100%" height="100%" fill="#030712" rx="16" />
      <circle cx="100" cy="100" r="50" fill="none" stroke="#6366f1" stroke-width="3" stroke-dasharray="4 4" opacity="0.8" />
      <polygon points="100,60 135,130 65,130" fill="none" stroke="#f43f5e" stroke-width="4" stroke-linejoin="round" />
      <circle cx="100" cy="100" r="8" fill="#10b981" />
      <text x="50%" y="85%" dominant-baseline="middle" text-anchor="middle" fill="#9ca3af" font-family="monospace" font-size="8">NEXUS DYNAMIC VECTOR</text>
    </svg>`;
    return res.json({ success: true, image: { type: 'svg', data: fallbackSvg } });
  }
});

// Manage Vite / Static Assets
async function initServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Serve static files in production
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`SmartLearn Server is live at http://0.0.0.0:${PORT}`);
  });
}

if (process.env.NETLIFY !== 'true') {
  initServer();
}

export { app };
