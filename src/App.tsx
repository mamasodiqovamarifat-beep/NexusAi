import React, { useState, useEffect, useRef } from 'react';
import { 
  Sparkles, Volume2, VolumeX, MessageSquare, Mic, MicOff, Send, HelpCircle, 
  Loader2, Play, Pause, RefreshCw, Layout, ChevronLeft, ChevronRight, Download, 
  Eye, Video, FileText, CheckCircle2, User, Coins, Zap, Shield, Wand2, Maximize2, Headphones,
  X, Image, Camera
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { speakMessage, toggleAmbientMusic, playSuccessChime, pauseSpeech, resumeSpeech, stopSpeech } from './utils/audio';
import { Profile, AgeGroup, SubjectStats } from './types';
import ProfileSetup from './components/ProfileSetup';

interface Message {
  role: 'user' | 'coach';
  text: string;
  engine?: string;
  image?: {
    type: 'base64' | 'svg';
    data: string;
  };
  attachedImage?: string;
}

interface SlideItem {
  title: string;
  content: string[];
  imagePrompt?: string;
}

interface Presentation {
  theme: string;
  title: string;
  slides: SlideItem[];
}

interface VideoScene {
  id: number;
  description: string;
  subtitle: string;
  duration: number; // in seconds
}

interface VideoDeck {
  title: string;
  audioTrack: string;
  scenes: VideoScene[];
}

const LOCAL_STORAGE_KEY = 'randa_ai_profile_console';

export default function App() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [activeEngine, setActiveEngine] = useState<'chatgpt' | 'claude' | 'gemini' | 'kimi' | 'gamma'>('chatgpt');
  const [sandboxTab, setSandboxTab] = useState<'slides' | 'video' | 'gallery'>('slides');
  
  // Audio state
  const [isMusicOn, setIsMusicOn] = useState(false);
  const [autoSpeechEnabled, setAutoSpeechEnabled] = useState(false);
  
  // Notification banner state
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'info' | 'error' } | null>(null);
  
  // Slide Player state
  const [loadedPresentation, setLoadedPresentation] = useState<Presentation>({
    theme: 'Vibrant Cosmic',
    title: "Sinergetik Tizimlar: Sun'iy Intellekt Paradigmasi",
    slides: [
      {
        title: "1. Konseptualizatsiya: NexusAi Allianse",
        imagePrompt: "Concept representation of integrated artificial general intelligence central node with connecting violet strands",
        content: [
          "NexusAi - ko'p qirrali mantiqiy model klasterlari va zamonaviy hisoblash paradigmsining sinergetik integratsiyasidir.",
          "Ushbu kognitiv tizilma o'zaro hamkorlikda ishlovchi ChatGPT, Claude, Gemini, Kimi va Gamma tizimlari muvozanatini tanaffussiz ta'minlaydi.",
          "Tizimning asosiy metodologik maqsadi - foydalanuvchilarning intellektual salohiyatini jadal vizual va empirik rivojlantirishdan iboratdir."
        ]
      },
      {
        title: "2. Neyromorf Tizimlar va Model Interoperabelligi",
        imagePrompt: "Detailed schematic diagram of neural synapses pulsing with violet energy",
        content: [
          "Dasturiy interoperabellik - turli xil ilg'or neyron tarmoq super-parametrlari o'rtasida uzluksiz ma'lumotlar oqimini tartibga soladi.",
          "ChatGPT ijodiy tasavvur ekspressiyasini shakllantirsa, Claude chuqur deduktiv va mantiqiy algoritmlarni mukammallashtirishga xizmat qiladi.",
          "Ushbu integratsiya natijasida yuqori aniqlikdagi tahliliy yechimlar va ko'p o'lchamli multimedia elementlari sintezlanadi."
        ]
      },
      {
        title: "3. Haqiqiy Vaqtda Ma'lumotlarning Matematik Modellari",
        imagePrompt: "Glowing neon grid representing vector space coordinates in bright violet and cyan colors",
        content: [
          "Dinamik taqdimotlar va animatsiyalar - vektor fazolarining murakkab transformatsiyasi hamda real vaqtli matematik hisoblashlar mahsulidir.",
          "Har bir slayd o'zining mavzu sirlariga mos keladigan o'ziga xos vizual elementlar va ilmiy-metodologik atamalar bilan boyitiladi.",
          "Bu jarayon o'quvchi xotirasida axborotlarning chuqur semantik assotsiatsiyalar shaklida barqaror saqlanishini ta'minlaydi."
        ]
      }
    ]
  });
  const [activeSlideIndex, setActiveSlideIndex] = useState(0);
  const [slideThemeOverride, setSlideThemeOverride] = useState<string>('Vibrant Cosmic');
  const [slideImages, setSlideImages] = useState<Record<number, { type: 'base64' | 'svg', data: string }>>({});
  const [loadingSlideImg, setLoadingSlideImg] = useState(false);
  const [attachedImage, setAttachedImage] = useState<string | null>(null);

  // Video Player states
  const [loadedVideo, setLoadedVideo] = useState<VideoDeck>({
    title: "NexusAi Kosmik Parvozi",
    audioTrack: "waves",
    scenes: [
      {
        id: 1,
        description: "Binafsha rangli porlayotgan tumanlik va spiral shakdilagi galaktika markazi havoda asta aylanmoqda.",
        subtitle: "Chuqur va sirli kosmos tubiga sayohatimizni boshlaymiz!",
        duration: 5
      },
      {
        id: 2,
        description: "Kosmik fazo kemasining yashil yorug'lik dumi qoldirib, yulduzlararo yorug'lik tezligida oldinga uchishi.",
        subtitle: "NexusAi bilan misli ko'rilmagan yuksak sur'atlarda bilimlarni egallang.",
        duration: 5
      },
      {
        id: 3,
        description: "Ekran markazida neon nurli NexusAi logotipi porlaydi va uning atrofidan oltin yulduzlar uchquni portlaydi.",
        subtitle: "Oramizdagi barcha savollarga oson, aniq va tezkor javoblar toping. NexusAi hamisha tayyor!",
        duration: 6
      }
    ]
  });
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const [videoProgress, setVideoProgress] = useState(0); // 0 to 100
  const [currentSceneIndex, setCurrentSceneIndex] = useState(0);
  const [videoPlaybackSpeed, setVideoPlaybackSpeed] = useState<number>(1); // 1x, 1.5x, 2x

  // Custom slide inputs for fast testing
  const [creatorSlideTitle, setCreatorSlideTitle] = useState('');
  const [creatorSlideItems, setCreatorSlideItems] = useState('');

  // Manual Video inputs
  const [creatorSceneEmoji, setCreatorSceneEmoji] = useState('🪐');
  const [creatorSceneDuration, setCreatorSceneDuration] = useState(5);
  const [creatorSceneDesc, setCreatorSceneDesc] = useState('');
  const [creatorSceneSubtitle, setCreatorSceneSubtitle] = useState('');

  // Speech controls
  const [speechState, setSpeechState] = useState<'idle' | 'playing' | 'paused'>('idle');
  const [speakingMessageText, setSpeakingMessageText] = useState<string | null>(null);

  // Gallery of generated images/artworks
  const [artGallery, setArtGallery] = useState<{ id: number; prompt: string; type: string; data: string }[]>([
    {
      id: 1,
      prompt: "Xush kelibsiz - Oltin NexusAi Boyqush maskoti",
      type: "svg",
      data: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 320" width="100%" height="100%">
        <defs>
          <linearGradient id="backGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:#0F172A;" />
            <stop offset="100%" style="stop-color:#311042;" />
          </linearGradient>
          <filter id="neon" x="-10%" y="-10%" width="120%" height="120%">
            <feGaussianBlur stdDeviation="6" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>
        <rect width="320" height="320" rx="24" fill="url(#backGrad)" stroke="#4F46E5" stroke-width="2"/>
        <text x="160" y="140" font-size="90" text-anchor="middle" dominant-baseline="middle" filter="url(#neon)">🦉</text>
        <rect x="25" y="225" width="270" height="70" rx="14" fill="#1E293B" fill-opacity="0.9" stroke="#6366F1" stroke-width="1"/>
        <text x="160" y="255" font-family="sans-serif" font-size="13" font-weight="bold" fill="white" text-anchor="middle">Boyqush Illustrator Mascoti</text>
        <text x="160" y="280" font-family="monospace" font-size="10" fill="#A5B4FC" text-anchor="middle">NEXUSAI COGNITIVE STUDIO</text>
      </svg>`
    }
  ]);
  const [selectedGalleryItemIndex, setSelectedGalleryItemIndex] = useState(0);

  // Chat states
  const [chatMessages, setChatMessages] = useState<Message[]>([
    {
      role: 'coach',
      text: "Salom! Men NexusAi - sizning universal aqlli yordamchingizman. 🔮\nMenda eng mukammal va aqlli modellar imkoniyatlari jamlangan. 🚀",
      engine: 'chatgpt'
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [recognition, setRecognition] = useState<any>(null);
  
  // Refs
  const chatEndRef = useRef<HTMLDivElement>(null);
  const animationFrameRef = useRef<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setAttachedImage(reader.result);
        showNotification(profile?.language === 'en' ? "Image attached successfully! Type a message to analyze it." : "Rasm tahlilga tayyorlandi! Uni tahlil qilish uchun savol yo'llang.", "success");
      }
    };
    reader.onerror = (err) => {
      console.error("FileReader error:", err);
    };
    reader.readAsDataURL(file);
    
    // Reset file input target value so the same image can be re-selected if deleted
    if (e.target) e.target.value = '';
  };

  const triggerFileSelect = () => {
    fileInputRef.current?.click();
  };

  const getEngineLabel = (engineID: string) => {
    const map: Record<string, string> = {
      chatgpt: 'Model Alpha',
      claude: 'Model Beta',
      gemini: 'Model Quantum',
      kimi: 'Model Prime',
      gamma: 'Model Nova'
    };
    return map[engineID] || engineID;
  };

  // Parse Profile from LocalStorage on mount
  useEffect(() => {
    try {
      const cached = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (cached) {
        setProfile(JSON.parse(cached));
      }
    } catch (e) {
      console.error("Error parsing local cached profile console:", e);
    }
  }, []);

  // Flush previous slide illustration cache when a new presentation is loaded
  useEffect(() => {
    setSlideImages({});
  }, [loadedPresentation?.title]);

  // Fetch slide-level vector illustration on active index change
  useEffect(() => {
    const currentSlide = loadedPresentation?.slides?.[activeSlideIndex];
    if (!currentSlide) return;

    const prompt = currentSlide.imagePrompt || currentSlide.title;

    if (slideImages[activeSlideIndex]) return;

    setLoadingSlideImg(true);
    fetch('/api/coach/slide-image', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt: `${prompt}, colorful smart flat vector science illustration` })
    })
      .then(res => res.json())
      .then(data => {
        if (data?.success && data?.image) {
          setSlideImages(prev => ({
            ...prev,
            [activeSlideIndex]: data.image
          }));
        }
      })
      .catch(err => console.error("Error loading slide illustration:", err))
      .finally(() => setLoadingSlideImg(false));
  }, [activeSlideIndex, loadedPresentation, slideImages]);

  // Web Speech API initialization
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const rec = new SpeechRecognition();
      rec.continuous = false;
      rec.interimResults = false;
      rec.lang = profile?.language === 'en' ? 'en-US' : 'uz-UZ';

      rec.onstart = () => {
        setIsRecording(true);
      };

      rec.onresult = (event: any) => {
        const resultText = event.results[0][0].transcript;
        if (resultText) {
          setInputText(resultText);
          showNotification(profile?.language === 'en' ? "Voice detected!" : "Ovoz eshitildi!", "success");
        }
      };

      rec.onerror = (e: any) => {
        console.error("Speech Error:", e);
        setIsRecording(false);
      };

      rec.onend = () => {
        setIsRecording(false);
      };

      setRecognition(rec);
    }
  }, [profile?.language]);

  // Handle Video timeline ticker interval
  useEffect(() => {
    let interval: any = null;
    if (isVideoPlaying) {
      const totalDuration = loadedVideo.scenes.reduce((acc, scene) => acc + scene.duration, 0) || 15;
      const stepTimeMs = 100 * (1 / videoPlaybackSpeed); // speed scale

      interval = setInterval(() => {
        setVideoProgress(prev => {
          const nextVal = prev + (100 / (totalDuration * 10));
          if (nextVal >= 100) {
            setIsVideoPlaying(false);
            return 100;
          }
          
          // Determine current active scene based on cumulative time percent
          let cumulativeTime = 0;
          let activeIndex = 0;
          const currentPercentPoint = (nextVal / 100) * totalDuration;

          for (let i = 0; i < loadedVideo.scenes.length; i++) {
            cumulativeTime += loadedVideo.scenes[i].duration;
            if (currentPercentPoint <= cumulativeTime) {
              activeIndex = i;
              break;
            } else {
              activeIndex = loadedVideo.scenes.length - 1;
            }
          }
          setCurrentSceneIndex(activeIndex);
          return nextVal;
        });
      }, stepTimeMs);
    } else {
      if (interval) clearInterval(interval);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isVideoPlaying, loadedVideo, videoPlaybackSpeed]);

  // Scroll chat list downstream
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const showNotification = (text: string, type: 'success' | 'info' | 'error' = 'info') => {
    setToastMessage({ text, type });
    setTimeout(() => {
      setToastMessage(null);
    }, 4500);
  };

  const handleCompleteSetup = (newProfile: Profile) => {
    setProfile(newProfile);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(newProfile));
    showNotification(newProfile.language === 'en' ? "NexusAi Profile Setup Completed!" : "Profil muvaffaqiyatli o'rnatildi!", "success");
  };

  const handleUpdateProfile = (updated: Profile) => {
    setProfile(updated);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
  };

  const handleToggleMusic = (forceOn = false, styleType?: 'lofi' | 'happy' | 'piano' | 'waves') => {
    if (!profile) return;
    const nextStyle = styleType || profile.musicStyle || 'lofi';
    const nextOn = forceOn ? true : !isMusicOn;
    
    setIsMusicOn(nextOn);
    toggleAmbientMusic(nextOn, nextStyle);
    
    const upProfile = { ...profile, musicStyle: nextStyle };
    handleUpdateProfile(upProfile);

    showNotification(
      nextOn ? `Synth Music active: ${nextStyle} 🎧` : "Synth Music paused 🔇",
      'info'
    );
  };

  const handleResetApp = () => {
    if (window.confirm(profile?.language === 'en' ? "Are you sure you want to reset your NexusAi workspace profile?" : "NexusAi profilini o'chirib, sozlamalarni qayta yuklashni xohlaysizmi?")) {
      localStorage.removeItem(LOCAL_STORAGE_KEY);
      setProfile(null);
      setChatMessages([
        {
          role: 'coach',
          text: "Muloqot qayta tozalandi. Savol yoki slaydlarni yozishingiz mumkin! 🚀",
          engine: 'chatgpt'
        }
      ]);
      setLoadedPresentation({
        theme: 'Neon Dark',
        title: "Sun'iy Intellekt va Kelajak Dunyo",
        slides: [
          {
            title: "Kirish - NexusAi Allianse",
            content: ["NexusAi yordamida oson taqdimotlar va video g'oyalar yaratish sozlandi."]
          }
        ]
      });
      setIsMusicOn(false);
      toggleAmbientMusic(false);
      showNotification("Sessiya muvaffaqiyatli tozalandi!", "success");
    }
  };

  const toggleMicRecording = () => {
    if (!recognition) {
      showNotification(
        profile?.language === 'en' 
          ? "Microphone not supported fully on this browser container. Please type!" 
          : "Ushbu brauzerda mikrofonni qo'llab-quvvatlash to'liq emas. Klaviaturadan foydalaning!", 
        "error"
      );
      return;
    }
    if (isRecording) {
      recognition.stop();
    } else {
      try {
        recognition.start();
      } catch (err) {
        console.error("Mic start err:", err);
      }
    }
  };

  // Helper parser for tag contents e.g. [SLIDES_START] ... [SLIDES_END]
  const parseResponseAssets = (text: string) => {
    let foundSlides = false;
    let foundVideo = false;

    // Detect Slides
    if (text.includes('[SLIDES_START]') && text.includes('[SLIDES_END]')) {
      try {
        const rawBlock = text.split('[SLIDES_START]')[1].split('[SLIDES_END]')[0].trim();
        const lines = rawBlock.split('\n');
        
        let theme = 'Neon Dark';
        let mainTitle = 'Yangi Taqdimot';
        const slideItems: SlideItem[] = [];
        
        // Split block by --- to divide slides
        const slideBlocks = rawBlock.split('---');
        
        // Parse slide blocks
        slideBlocks.forEach(block => {
          const blockLines = block.trim().split('\n');
          let currentTitle = '';
          let currentImagePrompt = '';
          const currentBullets: string[] = [];

          blockLines.forEach(line => {
            const trimmedLine = line.trim();
            if (trimmedLine.startsWith('Theme:')) {
              theme = trimmedLine.replace('Theme:', '').trim();
            } else if (trimmedLine.startsWith('Title:')) {
              mainTitle = trimmedLine.replace('Title:', '').trim();
            } else if (trimmedLine.startsWith('Slide:')) {
              currentTitle = trimmedLine.replace('Slide:', '').trim();
            } else if (trimmedLine.startsWith('ImagePrompt:')) {
              currentImagePrompt = trimmedLine.replace('ImagePrompt:', '').trim();
            } else if (trimmedLine.startsWith('Content:') || trimmedLine.startsWith('-') || trimmedLine.startsWith('*')) {
              const cleanBul = trimmedLine.replace(/^(Content:|-|\*)/, '').trim();
              if (cleanBul) currentBullets.push(cleanBul);
            } else if (trimmedLine && !trimmedLine.includes(':')) {
              currentBullets.push(trimmedLine);
            }
          });

          if (currentTitle || currentBullets.length > 0) {
            slideItems.push({
              title: currentTitle || 'Slide ' + (slideItems.length + 1),
              content: currentBullets.length > 0 ? currentBullets : ["Kelajak texnologiyasi haqida ma'lumotlar."],
              imagePrompt: currentImagePrompt || undefined
            });
          }
        });

        if (slideItems.length > 0) {
          setLoadedPresentation({
            theme,
            title: mainTitle,
            slides: slideItems
          });
          setActiveSlideIndex(0);
          foundSlides = true;
        }
      } catch (err) {
        console.error("Failed to parse slides block:", err);
      }
    }

    // Detect Video Storyboards
    if (text.includes('[VIDEO_START]') && text.includes('[VIDEO_END]')) {
      try {
        const rawVidBlock = text.split('[VIDEO_START]')[1].split('[VIDEO_END]')[0].trim();
        const blocks = rawVidBlock.split('---');
        
        let videoTitle = 'NexusAi Cinema';
        let audioTrack = 'waves';
        const scenes: VideoScene[] = [];
        let sceneCounter = 1;

        blocks.forEach(block => {
          const lines = block.trim().split('\n');
          let sceneDesc = '';
          let subtitle = '';
          let duration = 5;

          lines.forEach(line => {
            const tl = line.trim();
            if (tl.startsWith('VideoTitle:')) {
              videoTitle = tl.replace('VideoTitle:', '').trim();
            } else if (tl.startsWith('AudioTrack:')) {
              audioTrack = tl.replace('AudioTrack:', '').trim();
            } else if (tl.startsWith('Scene:')) {
              sceneDesc = tl.replace('Scene:', '').trim();
            } else if (tl.startsWith('Subtitle:')) {
              subtitle = tl.replace('Subtitle:', '').trim();
            } else if (tl.startsWith('Duration:')) {
              const parsedDur = parseInt(tl.replace('Duration:', '').trim(), 10);
              if (!isNaN(parsedDur)) duration = parsedDur;
            }
          });

          if (sceneDesc || subtitle) {
            scenes.push({
              id: sceneCounter++,
              description: sceneDesc || 'Visual motion dynamic vector display representation',
              subtitle: subtitle || 'NexusAi system voice rendering...',
              duration: duration
            });
          }
        });

        if (scenes.length > 0) {
          setLoadedVideo({
            title: videoTitle,
            audioTrack,
            scenes
          });
          setVideoProgress(0);
          setCurrentSceneIndex(0);
          setIsVideoPlaying(false);
          foundVideo = true;
        }
      } catch (err) {
        console.error("Failed to parse video storyboard:", err);
      }
    }

    return { foundSlides, foundVideo };
  };

  const submitChatMessage = async (typedText: string) => {
    if (!typedText.trim() || !profile) return;

    // Cache the loaded image and clear it
    const imageToAttach = attachedImage;
    setAttachedImage(null);

    // Append user message along with thumbnail attachment if uploaded
    const userMsg: Message = {
      role: 'user',
      text: typedText,
      attachedImage: imageToAttach || undefined
    };
    setChatMessages(prev => [...prev, userMsg]);
    setIsLoading(true);

    try {
      const response = await fetch('/api/coach/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: typedText,
          history: chatMessages.slice(-8).map(m => ({ role: m.role, text: m.text })),
          profile,
          modelMode: activeEngine,
          attachedImage: imageToAttach
        })
      });

      const data = await response.json();
      if (data.success) {
        let cleanReply = data.reply || '';

        // Extract background music tags (e.g. [TRIGGER_MUSIC:piano])
        const musicRegex = /\[TRIGGER_MUSIC:(lofi|happy|piano|waves|stop)\]/i;
        const match = cleanReply.match(musicRegex);
        if (match) {
          const styleName = match[1].toLowerCase();
          if (styleName === 'stop') {
            setIsMusicOn(false);
            toggleAmbientMusic(false);
          } else {
            setIsMusicOn(true);
            toggleAmbientMusic(true, styleName as any);
          }
          cleanReply = cleanReply.replace(musicRegex, '').trim();
        }

        // Add assistant reply to stream
        setChatMessages(prev => [...prev, {
          role: 'coach',
          text: cleanReply,
          engine: activeEngine,
          image: data.image || undefined
        }]);

        // Process slides & videos integrations
        const parsedReport = parseResponseAssets(cleanReply);
        if (parsedReport.foundSlides) {
          setSandboxTab('slides');
          playSuccessChime();
          showNotification(profile.language === 'en' ? "Presentation generated successfully!" : "Slayd taqdimoti qabul qilindi!", "success");
        } else if (parsedReport.foundVideo) {
          setSandboxTab('video');
          playSuccessChime();
          showNotification(profile.language === 'en' ? "Animated video clip loaded!" : "Animatsion video klip yuklandi!", "success");
        } else if (data.image) {
          setSandboxTab('gallery');
          playSuccessChime();
          showNotification(profile.language === 'en' ? "Multi-modal graphic received!" : "Tasviriy grafik yuklandi!", "success");
        }

        // Text-to-speech if auto-feed is activated
        if (autoSpeechEnabled) {
          // Speak out the main description without raw tag structures
          const textToSpeak = cleanReply
            .replace(/\[SLIDES_START\]([\s\S]*?)\[SLIDES_END\]/gi, '')
            .replace(/\[VIDEO_START\]([\s\S]*?)\[VIDEO_END\]/gi, '')
            .trim();
          setSpeakingMessageText(cleanReply);
          setSpeechState('playing');
          speakMessage(
            textToSpeak, 
            profile.language === 'en' ? 'en' : 'uz',
            () => { setSpeechState('playing'); },
            () => { setSpeechState('idle'); setSpeakingMessageText(null); }
          );
        }

      } else {
        throw new Error("API call error status");
      }
    } catch (err) {
      console.error(err);
      // Clean and highly typo-tolerant offline fallback helper
      const queryLower = typedText.toLowerCase().trim();
      
      const isWantSlide = /slayd|slayid|slaed|slide|prezent|prezentatsiya|taqdimot|taqdimos|shlayd|shlayid/i.test(queryLower);
      const isWantVid = /video|vidio|vedio|vido|vidyo|rolik|ralik|roilk|roliklar|klip|clip/i.test(queryLower);
      
      let simulatedText = isEn 
        ? `Here is the structured content and interactive media tailored for your request:` 
        : `Siz so'ragan mavzu bo'yicha maxsus tayyorlangan materiallar va multimedia elementlari:`;

      if (isWantSlide) {
        simulatedText += `\n\n[SLIDES_START]\nTheme: Sunset Warm\nTitle: Kirish: Sun'iy Intellekt\n---\nSlide: 1. AI Asosi\nContent: Sun'iy intellect - kompyuter mashinalariga aqlli xususiyatlar berish san'atidir.\n---\nSlide: 2. Slayd yaratilishi\nContent: Gamma va NexusAi tizimi yordamida prezentatsiyalar sekundlarda pishib yetiladi.\n---\nSlide: 3. Yakuniy Qism\nContent: Amaliy topshiriqlarni davom etamiz!\n[SLIDES_END]`;
      } else if (isWantVid) {
        simulatedText += `\n\n[VIDEO_START]\nVideoTitle: Kelajak NexusAi Olamida\nAudioTrack: piano\n---\nScene: Sokin porlayotgan tilla va yashil yaltiragan yulduzcha klasterlar\nSubtitle: Kelajakda dars va ish tizimi butunlay avtomatlashadi.\nDuration: 5\n---\nScene: To'lqin shaklidagi binafsha sinus to'lqini ovoz tebranishi bilan harakatlanishi\nSubtitle: Biz siz istagan har qanday hikoyani rolikka aylantiramiz!\nDuration: 6\n[VIDEO_END]`;
      } else {
        simulatedText += `\n\nSiz tanlagan "${getEngineLabel(activeEngine)}" modeli muvaffaqiyatli javob berdi. NexusAi tizimi orqali slaydlar (${profile.language === 'en' ? 'presentations' : 'taqdimotlar'}) va videorolik olish uchun ko'rsatmalarni yozishda davom eting!`;
      }

      setChatMessages(prev => [...prev, {
        role: 'coach',
        text: simulatedText,
        engine: activeEngine
      }]);
      
      parseResponseAssets(simulatedText);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    const query = inputText.trim();
    if (!query) return;
    setInputText('');
    submitChatMessage(query);
  };

  // Custom client-side slide manual editor submission
  const handleAddNewManualSlide = (e: React.FormEvent) => {
    e.preventDefault();
    if (!creatorSlideTitle.trim()) return;
    const bullets = creatorSlideItems
      .split('\n')
      .map(item => item.trim())
      .filter(item => item.length > 0);
    
    const newSlide: SlideItem = {
      title: creatorSlideTitle.trim(),
      content: bullets.length > 0 ? bullets : ["Taqdimot punkti kiritilmagan."]
    };

    setLoadedPresentation(prev => ({
      ...prev,
      slides: [...prev.slides, newSlide]
    }));

    setCreatorSlideTitle('');
    setCreatorSlideItems('');
    setActiveSlideIndex(loadedPresentation.slides.length); // switch to the newly created slide
    showNotification(profile?.language === 'en' ? "New slide added!" : "Muvaffaqiyatli slayd qo'shildi!", "success");
  };

  // Pre-configured speech text trigger & state managers
  const handleSpeechPlay = (text: string) => {
    // Clean tags
    const cleanText = text
      .replace(/\[SLIDES_START\]([\s\S]*?)\[SLIDES_END\]/gi, '')
      .replace(/\[VIDEO_START\]([\s\S]*?)\[VIDEO_END\]/gi, '')
      .trim();

    if (speakingMessageText === cleanText) {
      if (speechState === 'playing') {
        pauseSpeech();
        setSpeechState('paused');
        showNotification(profile?.language === 'en' ? "Voice paused" : "Ovoz vaqtincha to'xtatildi ⏸", "info");
        return;
      } else if (speechState === 'paused') {
        resumeSpeech();
        setSpeechState('playing');
        showNotification(profile?.language === 'en' ? "Voice resumed" : "Ovoz davom ettirilmoqda ▶", "success");
        return;
      }
    }

    // Stop former voice
    stopSpeech();
    setSpeakingMessageText(cleanText);
    setSpeechState('playing');

    speakMessage(
      cleanText,
      profile?.language === 'en' ? 'en' : 'uz',
      () => {
        setSpeechState('playing');
      },
      () => {
        setSpeechState('idle');
        setSpeakingMessageText(null);
      }
    );
    showNotification(profile?.language === 'en' ? "Vocal synthesis started..." : "Ovozli tushuntirish boshlandi...", "success");
  };

  const handleSpeechStop = () => {
    stopSpeech();
    setSpeechState('idle');
    setSpeakingMessageText(null);
    showNotification(profile?.language === 'en' ? "Voice playback stopped" : "Ovoz batamom to'xtatildi ⏹", "info");
  };

  const handleSpeechPause = () => {
    pauseSpeech();
    setSpeechState('paused');
    showNotification(profile?.language === 'en' ? "Voice paused" : "Ovoz vaqtincha to'xtatildi ⏸", "info");
  };

  const handleSpeechResume = () => {
    resumeSpeech();
    setSpeechState('playing');
    showNotification(profile?.language === 'en' ? "Voice resumed" : "Ovoz davom ettirilmoqda ▶", "success");
  };

  const playReadAloud = (text: string) => {
    handleSpeechPlay(text);
  };

  if (!profile) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <ProfileSetup onCompleteSetup={handleCompleteSetup} />
      </div>
    );
  }

  const isEn = profile.language === 'en';

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans transition-colors duration-300">
      
      {/* GLOBAL NOTIFICATION TOAST */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div 
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className={`fixed bottom-6 right-6 z-50 px-5 py-4 rounded-2xl shadow-[0_10px_30px_rgba(0,0,0,0.5)] border flex items-center gap-3 backdrop-blur-md ${
              toastMessage.type === 'success' 
                ? 'bg-slate-900/90 text-emerald-400 border-emerald-500/30' 
                : toastMessage.type === 'error'
                ? 'bg-slate-900/90 text-red-400 border-red-500/30'
                : 'bg-slate-900/90 text-indigo-400 border-indigo-500/30'
            }`}
          >
            <div className="text-xl">
              {toastMessage.type === 'success' ? '⚡' : toastMessage.type === 'error' ? '💥' : '✨'}
            </div>
            <div className="text-xs font-semibold tracking-wide">{toastMessage.text}</div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* NEW MODERN HEADER NAVIGATION BAR */}
      <nav className="bg-slate-900/80 border-b border-slate-800/80 py-4 px-4 md:px-8 sticky top-0 z-40 backdrop-blur-md flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3 cursor-pointer select-none" onClick={() => showNotification("NexusAi Console Active", "info")}>
          <div className="bg-gradient-to-tr from-slate-950 to-indigo-950 border border-indigo-500/30 p-1.5 rounded-2xl shadow-lg flex items-center justify-center shrink-0 w-11 h-11 relative overflow-hidden group">
            {/* Ambient background glow inside the logo */}
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <svg viewBox="0 0 100 100" className="w-full h-full text-indigo-400" fill="none" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <linearGradient id="logoGlow" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#818cf8" />
                  <stop offset="50%" stopColor="#a78bfa" />
                  <stop offset="100%" stopColor="#38bdf8" />
                </linearGradient>
              </defs>
              {/* Outer orbit rings */}
              <ellipse cx="50" cy="50" rx="40" ry="14" transform="rotate(-30 50 50)" stroke="url(#logoGlow)" strokeWidth="3" opacity="0.6" strokeDasharray="5 5" />
              <ellipse cx="50" cy="50" rx="40" ry="14" transform="rotate(30 50 50)" stroke="url(#logoGlow)" strokeWidth="3" opacity="0.6" strokeDasharray="5 5" />
              <ellipse cx="50" cy="50" rx="40" ry="14" transform="rotate(90 50 50)" stroke="url(#logoGlow)" strokeWidth="3" opacity="0.8" />
              {/* Central glowing atom particles */}
              <circle cx="50" cy="50" r="10" fill="url(#logoGlow)" className="animate-pulse" />
              {/* Sleek Futuristic letter 'N' trace */}
              <path d="M 40,38 L 40,62 M 40,38 L 60,62 M 60,38 L 60,62" stroke="#ffffff" strokeWidth="5.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-sans font-black text-xl tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-indigo-300 to-indigo-100">NexusAi</h1>
              <span className="bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-black text-[9px] px-1.5 py-0.5 rounded-md uppercase tracking-wider">Unified</span>
            </div>
            <p className="text-[10px] text-slate-500 font-mono tracking-wider">Multi-Model AI Workspace Engine</p>
          </div>
        </div>
        {/* Global balance points and audio synthesis triggers */}
        <div className="flex items-center flex-wrap gap-2.5 md:gap-3.5 text-xs">
          {/* Synchronized Language Select Switch */}
          <button
            onClick={() => {
              const nextLang = profile.language === 'en' ? 'uz' : 'en';
              const updated = { ...profile, language: nextLang };
              handleUpdateProfile(updated);
              showNotification(nextLang === 'en' 
                ? "English workspace! 🇬🇧 System prompted in English." 
                : "Ishchi muhit o'zbek tilida! 🇺🇿 Tizim tili o'zgartirildi.", 'info');
              speakMessage(nextLang === 'en' ? "Language changed" : "Tizim tili o'zbekchaga o'zgartirildi", nextLang);
            }}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition border border-slate-800 bg-slate-950 text-slate-300 hover:bg-slate-900 cursor-pointer shadow-md"
            title="Switch Language"
          >
            <span>{profile.language === 'en' ? '🇺🇿 O\'zbekcha' : '🇬🇧 English'}</span>
          </button>

          {/* Procedural Instrument Audio Synth */}
          <div className="flex items-center gap-1.5 bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5">
            <button
              onClick={() => handleToggleMusic()}
              className={`p-1 rounded-lg transition-all cursor-pointer ${
                isMusicOn ? 'bg-indigo-600 text-white animate-pulse' : 'text-slate-500 hover:bg-slate-950'
              }`}
              title="Toggle ambient background waves synth"
            >
              {isMusicOn ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>
            
            {isMusicOn ? (
              <select
                value={profile.musicStyle || 'lofi'}
                onChange={(e) => {
                  const style = e.target.value as 'lofi' | 'happy' | 'piano' | 'waves';
                  handleToggleMusic(true, style);
                }}
                className="bg-transparent text-[10px] font-bold text-slate-300 outline-none pr-1.5 cursor-pointer border-0 focus:ring-0"
              >
                <option value="lofi" className="bg-slate-950 text-slate-200">Lofi☕</option>
                <option value="happy" className="bg-slate-950 text-slate-200">Beats⚡</option>
                <option value="piano" className="bg-slate-950 text-slate-200">Piano🎹</option>
                <option value="waves" className="bg-slate-950 text-slate-200">Waves🌊</option>
              </select>
            ) : (
              <span className="text-[9px] text-slate-500 font-bold select-none">Ambient Off</span>
            )}
          </div>

          {/* AI Energy Meter (Formerly XP) */}
          <div className="flex items-center gap-1.5 bg-slate-950 text-indigo-300 font-extrabold px-3 py-1.5 rounded-xl border border-slate-800 font-mono" title="AI Energy points earned">
            <Zap className="w-3.5 h-3.5 text-yellow-500 fill-yellow-500" />
            <span>{profile.xp} EN</span>
          </div>

          {/* NexusAi Credits tokens (Formerly coins) */}
          <div className="flex items-center gap-1.5 bg-slate-950 text-yellow-400 font-extrabold px-3 py-1.5 rounded-xl border border-slate-800 font-mono" title="NexusAi computational Credits">
            <span>🪙</span>
            <span>{profile.coins} CR</span>
          </div>

          {/* Profile user info trigger */}
          <div className="relative w-8.5 h-8.5 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-lg select-none shrink-0" title={profile.name}>
            <span>{profile.avatar}</span>
          </div>
        </div>
      </nav>

      {/* CORE WORKSPACE CONTENT GRID */}
      <div className="flex-1 max-w-[1600px] w-full mx-auto p-3 md:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        
        {/* LEFT COLUMN: OPTIONS & SYSTEM PREFERENCES (3 COLS) */}
        <aside className="lg:col-span-3 space-y-5">
          
          {/* USER SYSTEM CONSOLE */}
          <div className="bg-slate-900 border border-slate-800/80 rounded-2xl p-5 space-y-4">
            <div className="flex items-center gap-3 border-b border-slate-800/80 pb-3">
              <div className="relative w-12 h-12 bg-slate-950 rounded-xl flex items-center justify-center text-3xl shadow-inner border border-slate-800 shrink-0">
                {profile.avatar}
              </div>
              <div className="min-w-0">
                <h3 className="font-extrabold text-sm text-slate-100 truncate">
                  {profile.name}
                </h3>
              </div>
            </div>
          </div>

          {/* Quick System Reset Helper */}
          <div className="flex justify-center pt-2">
            <button
              type="button"
              onClick={handleResetApp}
              className="text-[10px] text-slate-500 hover:text-red-400 font-bold hover:underline transition flex items-center gap-1 cursor-pointer bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-xl hover:bg-slate-850"
            >
              <RefreshCw className="w-3" /> {isEn ? "Reset Console State" : "Konsolni qayta yuklash"}
            </button>
          </div>
        </aside>

        {/* CENTER COLUMN: FULL SCREEN COOPERATIVE CHAT TERMINAL (9 COLS) */}
        <main className="lg:col-span-9 flex flex-col bg-slate-900 border border-slate-800/80 rounded-2xl overflow-hidden shadow-2xl h-[700px] lg:h-auto">
          
          {/* TOP BAR ENGINE TAB SWITCHER */}
          <div className="bg-slate-950 border-b border-slate-800 p-2 flex items-center justify-between shrink-0">
            <span className="text-[10.5px] text-slate-400 uppercase font-black tracking-widest pl-2">Engine:</span>
            
            <div className="flex items-center gap-1 overflow-x-auto scrollbar-none max-w-full">
              {(['chatgpt', 'claude', 'gemini', 'kimi', 'gamma'] as const).map(eng => {
                const colorsMap = {
                  chatgpt: 'hover:text-emerald-400 active:bg-emerald-950/40',
                  claude: 'hover:text-amber-400 active:bg-amber-950/40',
                  gemini: 'hover:text-indigo-400 active:bg-indigo-950/40',
                  kimi: 'hover:text-cyan-400 active:bg-cyan-950/40',
                  gamma: 'hover:text-purple-400 active:bg-purple-950/40'
                };
                
                const activeClassesMap = {
                  chatgpt: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
                  claude: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
                  gemini: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30',
                  kimi: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30',
                  gamma: 'bg-purple-500/10 text-purple-400 border-purple-500/30'
                };

                const engineLabelsMap = {
                  chatgpt: 'Model Alpha',
                  claude: 'Model Beta',
                  gemini: 'Model Quantum',
                  kimi: 'Model Prime',
                  gamma: 'Model Nova'
                };

                return (
                  <button
                    key={eng}
                    onClick={() => {
                      setActiveEngine(eng);
                      showNotification(`Switched to active engine: ${engineLabelsMap[eng]}`, "success");
                    }}
                    className={`px-2.5 py-1.5 text-[10.5px] rounded-lg font-black tracking-wide border cursor-pointer uppercase transition-all whitespace-nowrap ${
                      activeEngine === eng 
                        ? activeClassesMap[eng] 
                        : 'border-transparent text-slate-500 hover:bg-slate-900 hover:border-slate-800'
                    }`}
                  >
                    {engineLabelsMap[eng]}
                  </button>
                );
              })}
            </div>
          </div>

          {/* CHAT MESSAGES PANEL */}
          <div className="flex-1 p-4 overflow-y-auto bg-slate-950/40 space-y-4 scroll-smooth">
            {chatMessages.map((msg, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} items-start gap-2.5`}
              >
                {msg.role === 'coach' && (
                  <div className="w-7 h-7 rounded-lg bg-indigo-950 border border-indigo-500/30 flex items-center justify-center font-bold text-sm shrink-0">
                    {msg.engine === 'chatgpt' ? '💬' : msg.engine === 'claude' ? '🧠' : '🦉'}
                  </div>
                )}
                
                <div className="max-w-[85%] flex flex-col gap-1.5">
                  <div
                    className={`rounded-2xl px-4 py-2.5 text-xs md:text-sm shadow-md leading-relaxed whitespace-pre-line ${
                      msg.role === 'user'
                        ? 'bg-indigo-600 font-medium text-white rounded-tr-none'
                        : 'bg-slate-900 text-slate-200 border border-slate-800 rounded-tl-none font-sans'
                    }`}
                  >
                    <div>{msg.text}</div>
                    {msg.attachedImage && (
                      <div className="mt-2 text-left relative max-w-[240px] border border-white/10 rounded-lg overflow-hidden shadow-inner bg-slate-950/80">
                        <img 
                          src={msg.attachedImage} 
                          alt="Attached file layout" 
                          referrerPolicy="no-referrer"
                          className="w-full max-h-[160px] object-contain block mx-auto py-1" 
                        />
                        <div className="absolute top-1 left-1 bg-slate-950/90 backdrop-blur-md rounded px-1 py-0.5 text-[7px] font-mono text-yellow-400 font-bold uppercase tracking-widest">
                          FILING / TASVIR
                        </div>
                      </div>
                    )}

                    {/* Speeches on demand button */}
                    {msg.role === 'coach' && (
                      <div className="mt-3 pt-2.5 border-t border-slate-805/70 flex items-center justify-between flex-wrap gap-2">
                        <span className="text-[9px] font-mono uppercase bg-slate-950/80 px-2 py-0.5 rounded text-slate-500">
                          {msg.engine ? `Engine: ${getEngineLabel(msg.engine)}` : 'System'}
                        </span>
                        
                        {(() => {
                          const cleanMsgText = msg.text
                            .replace(/\[SLIDES_START\]([\s\S]*?)\[SLIDES_END\]/gi, '')
                            .replace(/\[VIDEO_START\]([\s\S]*?)\[VIDEO_END\]/gi, '')
                            .trim();
                          const isCurrentActive = speakingMessageText === cleanMsgText;

                          return (
                            <div className="flex items-center gap-1.5 animate-scaleUp">
                              {isCurrentActive && speechState !== 'idle' ? (
                                <>
                                  <button
                                    type="button"
                                    onClick={() => handleSpeechPlay(msg.text)}
                                    className={`flex items-center gap-1 text-[9.5px] font-extrabold px-2.5 py-1 rounded-md border cursor-pointer active:scale-95 transition-all ${
                                      speechState === 'playing'
                                        ? 'bg-amber-600/20 hover:bg-amber-600/30 text-amber-300 border-amber-500/30'
                                        : 'bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border-emerald-500/30'
                                    }`}
                                    title={speechState === 'playing' ? (isEn ? "Pause Voice" : "Ovozni to'xtatib turish") : (isEn ? "Resume Voice" : "Ovozni davom ettirish")}
                                  >
                                    {speechState === 'playing' ? <Pause className="w-3 h-3 animate-pulse" /> : <Play className="w-3 h-3" />}
                                    <span>
                                      {speechState === 'playing' 
                                        ? (isEn ? "Pause" : "Kutish ⏸") 
                                        : (isEn ? "Resume" : "Tinglash ▶")
                                      }
                                    </span>
                                  </button>

                                  <button
                                    type="button"
                                    onClick={handleSpeechStop}
                                    className="flex items-center gap-1 bg-red-600/20 hover:bg-red-600/30 text-red-300 text-[9.5px] font-extrabold px-2.5 py-1 rounded-md border border-red-500/30 cursor-pointer active:scale-95 transition-all"
                                    title={isEn ? "Stop Voice completely" : "Ovozni butunlay to'xtatish"}
                                  >
                                    <VolumeX className="w-3 h-3" />
                                    <span>{isEn ? "Stop" : "O'chirish ⏹"}</span>
                                  </button>
                                </>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => handleSpeechPlay(msg.text)}
                                  className="flex items-center gap-1 bg-slate-950/80 hover:bg-slate-900 hover:text-white text-indigo-300 hover:border-indigo-500/50 text-[9.5px] font-extrabold px-3 py-1 rounded-md border border-indigo-500/20 active:scale-95 transition-all cursor-pointer"
                                >
                                  <Volume2 className="w-3 h-3 text-indigo-400" />
                                  <span>{isEn ? "Speak Aloud" : "Ovozli Tinglash 🔊"}</span>
                                </button>
                              )}
                            </div>
                          );
                        })()}
                      </div>
                    )}
                  </div>

                  {/* SVG Multi-modal graphics internally rendered in bubble */}
                  {msg.role === 'coach' && msg.image && (
                    <div className="bg-slate-950 rounded-2xl border border-slate-800 overflow-hidden shadow-lg max-w-sm">
                      <div className="p-2 bg-slate-900 border-b border-slate-800 flex items-center justify-between text-[10px] text-slate-400">
                        <span>Artwork Illustration Canvas</span>
                        <span className="bg-indigo-505/20 text-indigo-300 px-1.5 rounded uppercase tracking-wider text-[9px] font-bold">
                          {msg.image.type}
                        </span>
                      </div>
                      
                      {msg.image.type === 'svg' ? (
                        <div 
                          className="w-full h-auto p-4 flex items-center justify-center bg-slate-950" 
                          dangerouslySetInnerHTML={{ __html: msg.image.data }}
                        />
                      ) : (
                        <img 
                          src={msg.image.data} 
                          alt="AI generated visual graphics" 
                          className="w-full h-auto object-contain block bg-slate-950" 
                          referrerPolicy="no-referrer"
                        />
                      )}
                    </div>
                  )}
                </div>
              </motion.div>
            ))}

            {isLoading && (
              <div className="flex justify-start items-center gap-2 text-slate-500 text-xs py-1.5">
                <Loader2 className="w-4 h-4 animate-spin text-indigo-500" />
                <span className="font-mono">{isEn ? "NexusAi is computing assets..." : "NexusAi ma'lumotlar klasterini yig'moqda..."}</span>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* FLOATING GENERAL VOCALIZER CENTER CONTROLS */}
          <AnimatePresence>
            {speechState !== 'idle' && (
              <motion.div
                initial={{ opacity: 0, y: 15, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 15, scale: 0.95 }}
                className="mx-3 my-2 p-3 bg-indigo-950/90 hover:bg-indigo-950 border border-indigo-500/30 rounded-2xl shadow-[0_4px_24px_rgba(79,70,229,0.25)] flex items-center justify-between gap-3 backdrop-blur-md z-10 shrink-0"
              >
                <div className="flex items-center gap-3 min-w-0">
                  {/* Dynamic frequency equalizer visual animation bars */}
                  <div className="w-6 h-6 rounded-lg bg-indigo-500/20 border border-indigo-400/20 flex items-center justify-center gap-[2.5px] p-1 shrink-0 overflow-hidden">
                    <span className={`w-[2.5px] h-full bg-indigo-400 rounded-full ${speechState === 'playing' ? 'animate-wave-bar-1 origin-bottom' : 'scale-y-[0.3]'}`} />
                    <span className={`w-[2.5px] h-full bg-purple-400 rounded-full ${speechState === 'playing' ? 'animate-wave-bar-2 origin-bottom' : 'scale-y-[0.3]'}`} />
                    <span className={`w-[2.5px] h-full bg-cyan-400 rounded-full ${speechState === 'playing' ? 'animate-wave-bar-3 origin-bottom' : 'scale-y-[0.3]'}`} />
                    <span className={`w-[2.5px] h-full bg-indigo-400 rounded-full ${speechState === 'playing' ? 'animate-wave-bar-4 origin-bottom' : 'scale-y-[0.3]'}`} />
                    <span className={`w-[2.5px] h-full bg-fuchsia-400 rounded-full ${speechState === 'playing' ? 'animate-wave-bar-5 origin-bottom' : 'scale-y-[0.3]'}`} />
                  </div>

                  <div className="min-w-0 flex flex-col">
                    <span className="text-[10px] font-black uppercase tracking-wider text-indigo-300 flex items-center gap-1">
                      <Headphones className="w-2.5 h-2.5" />
                      {speechState === 'playing' ? (isEn ? "Speaking Aloud" : "Ovozli O'qilmoqda") : (isEn ? "Voice Paused" : "Ovoz To'xtatilgan")}
                    </span>
                    <p className="text-[11px] text-slate-300 font-medium truncate max-w-[200px] md:max-w-[260px]">
                      {speakingMessageText || "..."}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  {speechState === 'playing' ? (
                    <button
                      type="button"
                      onClick={handleSpeechPause}
                      className="p-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 rounded-lg cursor-pointer transition active:scale-95"
                      title={isEn ? "Pause" : "Vaqtincha to'xtatish"}
                    >
                      <Pause className="w-3.5 h-3.5" />
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={handleSpeechResume}
                      className="p-1.5 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 rounded-lg cursor-pointer transition active:scale-95"
                      title={isEn ? "Resume" : "Davom etish"}
                    >
                      <Play className="w-3.5 h-3.5 animate-pulse" />
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={handleSpeechStop}
                    className="p-1.5 bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/30 rounded-lg cursor-pointer transition active:scale-95"
                    title={isEn ? "Stop Audio" : "Butunlay to'xtatish"}
                  >
                    <VolumeX className="w-3.5 h-3.5" />
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* QUICK TOPICS / SMART COGNITIVE SHORTCUT RECIPIENT BUTTONS (Uzbek or English depending on config) */}
          <div className="px-3 py-2 bg-slate-950 border-t border-slate-850 flex gap-2 overflow-x-auto scrollbar-none shrink-0">
            {isEn ? (
              <>
                <button
                  onClick={() => {
                    setInputText("Create beautiful presentation slides about Space Exploration and colony on Mars");
                    showNotification("Template prompted!");
                  }}
                  className="text-[10px] bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1 cursor-pointer hover:border-indigo-400 text-slate-300 whitespace-nowrap transition"
                >
                  📊 Slides: Space Colonies
                </button>
                <button
                  onClick={() => {
                    setInputText("Create an animated video storyboard clip about Quantum Supercomputing and stars");
                    showNotification("Template prompted!");
                  }}
                  className="text-[10px] bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1 cursor-pointer hover:border-indigo-400 text-slate-300 whitespace-nowrap transition"
                >
                  🎬 Video: Quantum Computing
                </button>
                <button
                  onClick={() => {
                    setInputText("Illustration of a golden shining smart owl robot flying in cyberspace");
                    showNotification("Template prompted!");
                  }}
                  className="text-[10px] bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1 cursor-pointer hover:border-indigo-400 text-slate-300 whitespace-nowrap transition"
                >
                  🎨 Drawing: Cyber Owl
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => {
                    setInputText("Sun'iy intellekt va robotlar kelajagi haqida chiroyli taqdimot slayd tayyorlab ber");
                    showNotification("Shablon tanlandi!");
                  }}
                  className="text-[10px] bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1 cursor-pointer hover:border-indigo-400 text-slate-300 whitespace-nowrap transition"
                >
                  📊 Slayd: Sun'iy Intellekt
                </button>
                <button
                  onClick={() => {
                    setInputText("Chuqur galaktika sirlari va yulduzlar portlashi haqida animatsion video rolik ssenariysini yaratib ber");
                    showNotification("Shablon tanlandi!");
                  }}
                  className="text-[10px] bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1 cursor-pointer hover:border-indigo-400 text-slate-300 whitespace-nowrap transition"
                >
                  🎬 Video: Koinot Sirlari
                </button>
                <button
                  onClick={() => {
                    setInputText("Sehrli o'rmon va undagi yorqin neon ajdaho rasmini chizib ber");
                    showNotification("Shablon tanlandi!");
                  }}
                  className="text-[10px] bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1 cursor-pointer hover:border-indigo-400 text-slate-300 whitespace-nowrap transition"
                >
                  🎨 Tasvir:Sehrli Neon Ajdaho
                </button>
              </>
            )}
          </div>

          {/* IMAGE PREVIEW DRAWER */}
          {attachedImage && (
            <div className="px-3 py-2 bg-slate-950 border-t border-slate-800 flex items-center justify-between gap-3 animate-scaleUp">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded border border-purple-500/30 overflow-hidden bg-slate-900 flex items-center justify-center relative shadow">
                  <img 
                    src={attachedImage || ''} 
                    alt="Upload thumbnail" 
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover" 
                  />
                </div>
                <div className="flex flex-col text-left">
                  <span className="text-[10px] font-bold text-slate-300 font-sans">
                    {isEn ? "Image Attached for Analysis" : "Rasm tahlil qilish uchun yuklandi"}
                  </span>
                  <span className="text-[8px] text-purple-400 font-mono tracking-wider animate-pulse">Ready to analyze with Gemini 🌟</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setAttachedImage(null)}
                className="p-1 rounded-full bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-red-400 cursor-pointer transition border border-slate-800"
                title={isEn ? "Discard image" : "Rasmni o'chirish"}
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* HIDDEN FILE INPUT SELECTION FOR MULTI-MODAL UPLOADS */}
          <input 
            type="file" 
            ref={fileInputRef} 
            accept="image/*" 
            onChange={handleImageFileChange} 
            className="hidden" 
          />

          {/* INPUT FORM */}
          <form onSubmit={handleSendMessage} className="p-3 bg-slate-900 border-t border-slate-800/80 flex items-center gap-2 shrink-0">
            {/* Dedicated Voice mic */}
            <button
              type="button"
              onClick={toggleMicRecording}
              className={`p-2.5 rounded-xl cursor-pointer transition text-slate-400 shrink-0 ${
                isRecording 
                  ? 'bg-red-600/80 text-white animate-pulse' 
                  : 'bg-slate-950 border border-slate-800 hover:bg-slate-900 hover:text-slate-200'
              }`}
              title="Speak to type"
            >
              {isRecording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            </button>

            {/* Custom Image/File upload trigger */}
            <button
              type="button"
              onClick={triggerFileSelect}
              className={`p-2.5 rounded-xl cursor-pointer transition shrink-0 ${
                attachedImage 
                  ? 'bg-purple-600/30 text-purple-300 border border-purple-500/40' 
                  : 'bg-slate-950 border border-slate-800 text-slate-400 hover:bg-slate-900 hover:text-slate-200'
              }`}
              title={isEn ? "Attach image file for analysis" : "Tahlil qilish uchun rasm yuklash"}
            >
              <Camera className="w-4 h-4" />
            </button>

            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={isRecording ? (isEn ? "Listening to speak text..." : "Eshityapman, gapiring...") : (isEn ? "Prompt NexusAi anything or select an image..." : "Rasm tahlil qilish, slayd so'rash yoki savol yozish...")}
              className="flex-grow bg-slate-950 border border-slate-800/80 focus:border-indigo-500 rounded-xl px-3.5 py-2.5 text-xs md:text-sm text-slate-200 focus:outline-none placeholder-slate-650"
              disabled={isLoading}
            />

            <button
              type="submit"
              className="bg-indigo-600 hover:bg-indigo-500 text-white p-2.5 rounded-xl font-bold transition shrink-0 cursor-pointer shadow-md shadow-indigo-500/10 active:scale-95 disabled:opacity-50 disabled:pointer-events-none"
              disabled={(!inputText.trim() && !attachedImage) || isLoading}
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </main>

      </div>

    </div>
  );
}
