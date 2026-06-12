// Procedural Web Audio Synthesizer and Native Speech Engine
// Zero dependencies, works fully offline inside standard browser sandboxes.

let audioCtx: AudioContext | null = null;
let ambientInterval: any = null;
let ambientNodes: any[] = [];
let isMusicPlaying = false;

// Initialize or resume Web Audio context
function getAudioCtx() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

// 1. Play Soft Bell Chord (Success Sound)
export function playSuccessChime() {
  try {
    const ctx = getAudioCtx();
    const now = ctx.currentTime;
    
    // Notes of major pentatonic C5, E5, G5, C6
    const freqs = [523.25, 659.25, 783.99, 1046.50];
    
    freqs.forEach((freq, index) => {
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + index * 0.08);
      
      gainNode.gain.setValueAtTime(0.12, now + index * 0.08);
      gainNode.gain.exponentialRampToValueAtTime(0.001, now + index * 0.08 + 0.6);
      
      osc.connect(gainNode);
      gainNode.connect(ctx.destination);
      
      osc.start(now + index * 0.08);
      osc.stop(now + index * 0.08 + 0.82);
    });
  } catch (err) {
    console.warn("Audio failure:", err);
  }
}

// 2. Play Soft Encourgament Buzz (Wrong Answer Sound)
export function playEncouragementBuzz() {
  try {
    const ctx = getAudioCtx();
    const now = ctx.currentTime;
    
    const osc = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gainNode = ctx.createGain();
    
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(220, now); // A3
    osc.frequency.linearRampToValueAtTime(165, now + 0.4); // E3 slide
    
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(223, now); // slightly detuned detuner
    osc2.frequency.linearRampToValueAtTime(167, now + 0.4);

    gainNode.gain.setValueAtTime(0.18, now);
    gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
    
    osc.connect(gainNode);
    osc2.connect(gainNode);
    gainNode.connect(ctx.destination);
    
    osc.start(now);
    osc2.start(now);
    osc.stop(now + 0.5);
    osc2.stop(now + 0.5);
  } catch (err) {
    console.warn("Audio failure:", err);
  }
}

// 3. Play Star Drop / Chest Unlock Sound
export function playStarDropSound() {
  try {
    const ctx = getAudioCtx();
    const now = ctx.currentTime;
    
    const count = 12;
    for (let i = 0; i < count; i++) {
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();
      
      osc.type = 'triangle';
      const freq = 400 + (i * 120); // shiny scale upwards
      const time = now + (i * 0.06);
      
      osc.frequency.setValueAtTime(freq, time);
      gainNode.gain.setValueAtTime(0.08, time);
      gainNode.gain.exponentialRampToValueAtTime(0.001, time + 0.25);
      
      osc.connect(gainNode);
      gainNode.connect(ctx.destination);
      
      osc.start(time);
      osc.stop(time + 0.3);
    }
  } catch (err) {
    console.warn("Audio failure:", err);
  }
}

// 4. Infinite Ambient Background Music Synthesizer (Multiple themes supported)
export let currentMusicMood: 'lofi' | 'happy' | 'piano' | 'waves' = 'lofi';

export function toggleAmbientMusic(onOrOff: boolean, mood: 'lofi' | 'happy' | 'piano' | 'waves' = 'lofi', volume = 0.08) {
  // Always clear existing interval and stop current nodes first
  isMusicPlaying = false;
  if (ambientInterval) {
    clearInterval(ambientInterval);
    ambientInterval = null;
  }
  ambientNodes.forEach(node => {
    try { node.stop(); } catch(e) {}
  });
  ambientNodes = [];

  if (!onOrOff) {
    return;
  }

  isMusicPlaying = true;
  currentMusicMood = mood;
  
  try {
    const ctx = getAudioCtx();
    
    // Progressions for various moods
    const progressions = {
      lofi: [
        [261.63, 329.63, 392.00, 493.88], // Cmaj7 (C4, E4, G4, B4)
        [220.00, 261.63, 329.63, 392.00], // Am7 (A3, C4, E4, G4)
        [174.61, 220.00, 261.63, 329.63], // Fmaj7 (F3, A3, C4, E4)
        [196.00, 246.94, 293.66, 392.00], // G6 (G3, B3, D4, G4)
      ],
      happy: [
        [261.63, 329.63, 392.00, 523.25], // C Major
        [349.23, 440.00, 523.25, 698.46], // F Major
        [392.00, 493.88, 587.33, 783.99], // G Major
        [261.63, 329.63, 392.00, 523.25], // C Major
      ],
      piano: [
        [220.00, 293.66, 349.23, 493.88], // Am9
        [174.61, 261.63, 329.63, 440.00], // Fmaj9
        [293.66, 392.00, 440.00, 587.33], // Dm9
        [196.00, 293.66, 349.23, 440.00], // G7sus4
      ],
      waves: [
        [110.00, 165.00, 220.00, 329.63], // Deep ambient ocean pads
        [130.81, 196.00, 261.63, 392.00],
        [87.31, 130.81, 174.61, 261.63],
        [98.00, 146.83, 196.00, 293.66],
      ]
    };

    let progIndex = 0;
    const activeProg = progressions[mood] || progressions['lofi'];
    const intervalMs = mood === 'happy' ? 4500 : mood === 'waves' ? 9000 : 7000;

    const playChord = () => {
      if (!isMusicPlaying) return;
      const now = ctx.currentTime;
      const chord = activeProg[progIndex];
      progIndex = (progIndex + 1) % activeProg.length;

      // Draw cozy background analog synthesizer pads
      chord.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gainNode = ctx.createGain();
        const filter = ctx.createBiquadFilter();

        osc.type = mood === 'happy' ? 'sine' : 'triangle';
        osc.frequency.setValueAtTime(freq, now + idx * 0.12); // staggered sweep
        
        // Cozy Filters
        filter.type = 'lowpass';
        // Ocean waves handles sweeping lowpass filter dynamically to mimic tide sound!
        if (mood === 'waves') {
          filter.frequency.setValueAtTime(120, now);
          filter.frequency.exponentialRampToValueAtTime(700, now + 3.5);
          filter.frequency.exponentialRampToValueAtTime(100, now + 8);
          filter.Q.setValueAtTime(3, now);
        } else {
          filter.frequency.setValueAtTime(mood === 'happy' ? 1200 : mood === 'piano' ? 600 : 800, now);
          filter.Q.setValueAtTime(1, now);
        }

        // Slow attack and deep release envelope
        gainNode.gain.setValueAtTime(0, now);
        const peakGain = mood === 'waves' ? volume * 0.7 : mood === 'happy' ? volume * 0.5 : volume / 5;
        gainNode.gain.linearRampToValueAtTime(peakGain, now + (intervalMs / 3000));
        gainNode.gain.setValueAtTime(peakGain, now + (intervalMs / 1800));
        gainNode.gain.exponentialRampToValueAtTime(0.001, now + (intervalMs / 1000) - 0.2);

        osc.connect(filter);
        filter.connect(gainNode);
        gainNode.connect(ctx.destination);

        osc.start(now);
        osc.stop(now + (intervalMs / 1000));
        ambientNodes.push(osc);
      });

      // Extra piano sprinkles or bird/nature noise
      if (mood !== 'waves' && Math.random() > 0.4) {
        setTimeout(() => {
          if (!isMusicPlaying) return;
          const sprinkleNow = ctx.currentTime;
          const highNotes = mood === 'happy' 
            ? [523.25, 587.33, 659.25, 783.99, 880.00, 1046.50, 1174.66]
            : [440.00, 523.25, 587.33, 659.25, 783.99, 880.00];
          const randomNote = highNotes[Math.floor(Math.random() * highNotes.length)];
          const oscPiano = ctx.createOscillator();
          const gainNode = ctx.createGain();

          oscPiano.type = 'sine';
          oscPiano.frequency.setValueAtTime(randomNote, sprinkleNow);
          gainNode.gain.setValueAtTime(volume * (mood === 'happy' ? 0.45 : 0.25), sprinkleNow);
          gainNode.gain.exponentialRampToValueAtTime(0.001, sprinkleNow + 1.8);

          oscPiano.connect(gainNode);
          gainNode.connect(ctx.destination);
          
          oscPiano.start(sprinkleNow);
          oscPiano.stop(sprinkleNow + 2);
        }, 2200);
      }
    };

    // Play immediately and cycle
    playChord();
    ambientInterval = setInterval(playChord, intervalMs);
  } catch (err) {
    console.warn("Ambient music synthesis failed:", err);
  }
}

export function toggleAmbientLofi(onOrOff: boolean, volume = 0.08) {
  toggleAmbientMusic(onOrOff, 'lofi', volume);
}

// 5. Speech Synthesis voice feedback
const CORRECT_VOICES_EN = [
  "Excellent job! You are amazing!",
  "Perfect! That is entirely correct!",
  "Fabulous! Keep it up!",
  "Wow! You are super smart!",
  "Great job! You got it!"
];

const ENCOURAGING_VOICES_UZ = [
  "Deyarli to'g'ri! Yana bir bor urinib ko'ring!",
  "Harakat qiling, siz buni uddalay olasiz!",
  "Taslim bo'lmang, har safar yaxshiroq bo'lyapti!",
  "Yana bir urunish! Bilimdonim, siz qila olasiz!",
  "Ajoyib harakat! Biroz ko'proq diqqat qiling!"
];

export function speakMessage(
  text: string, 
  lang: 'en' | 'uz' = 'en', 
  onStart?: () => void, 
  onEnd?: () => void
) {
  try {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel(); // Stop ongoing speech
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = lang === 'en' ? 'en-US' : 'uz-UZ';
      utterance.rate = 0.95; // kids friendly pacing
      utterance.pitch = 1.15; // friendly high pitch
      
      // Select appropriate voice based on selected system voices
      const voices = window.speechSynthesis.getVoices();
      if (voices.length > 0) {
        const matchingVoice = voices.find(v => v.lang.startsWith(lang));
        if (matchingVoice) {
          utterance.voice = matchingVoice;
        }
      }

      if (onStart) {
        utterance.onstart = onStart;
      }
      if (onEnd) {
        utterance.onend = onEnd;
        utterance.onerror = onEnd;
      }

      window.speechSynthesis.speak(utterance);
    }
  } catch (err) {
    console.warn("Speech Synthesis failed:", err);
    if (onEnd) onEnd();
  }
}

export function pauseSpeech() {
  try {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.pause();
    }
  } catch (e) {
    console.warn("Pause speech failed:", e);
  }
}

export function resumeSpeech() {
  try {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.resume();
    }
  } catch (e) {
    console.warn("Resume speech failed:", e);
  }
}

export function stopSpeech() {
  try {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  } catch (e) {
    console.warn("Stop speech failed:", e);
  }
}

export function speakRandomCorrect() {
  const chosen = CORRECT_VOICES_EN[Math.floor(Math.random() * CORRECT_VOICES_EN.length)];
  speakMessage(chosen, 'en');
}

export function speakRandomIncorrectUz() {
  const chosen = ENCOURAGING_VOICES_UZ[Math.floor(Math.random() * ENCOURAGING_VOICES_UZ.length)];
  speakMessage(chosen, 'uz');
}
export function speakRandomIncorrectEn() {
  const mockWrongFeedback = ["Almost there! Let's try again!", "Don't give up! Look closely!", "You are improving! Try again!"];
  const chosen = mockWrongFeedback[Math.floor(Math.random() * mockWrongFeedback.length)];
  speakMessage(chosen, 'en');
}
export function getIsMusicPlaying(): boolean {
  return isMusicPlaying;
}
