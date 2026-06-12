import React, { useState, useEffect } from 'react';
import { BookOpen, Sparkles, Volume2, Mic, CheckCircle2, AlertCircle, ArrowRight, CornerDownRight, Zap, RotateCcw, HelpCircle, FileText, ChevronRight, RefreshCw, Send, Headphones } from 'lucide-react';
import { Profile, SubjectType, MathQuestion, EnglishQuestion, WritingTask } from '../types';
import { MATH_QUESTIONS, ENGLISH_QUESTIONS, WRITING_TASKS } from '../data/questions';
import { playSuccessChime, playEncouragementBuzz, speakMessage, speakRandomCorrect, speakRandomIncorrectUz, speakRandomIncorrectEn } from '../utils/audio';

interface SubjectSectionProps {
  profile: Profile;
  activeSubject: SubjectType;
  onUpdateProfile: (updated: Profile) => void;
  onShowMessage: (text: string, type: 'success' | 'info') => void;
}

export default function SubjectSection({ profile, activeSubject, onUpdateProfile, onShowMessage }: SubjectSectionProps) {
  const ageGroup = profile.ageGroup;

  // Question bank indices
  const [currentMathIndex, setCurrentMathIndex] = useState(0);
  const [currentEnglishIndex, setCurrentEnglishIndex] = useState(0);
  const [selectedTopicIndex, setSelectedTopicIndex] = useState(0);

  // Math interactive states
  const [mathAnswer, setMathAnswer] = useState('');
  const [selectedMathOption, setSelectedMathOption] = useState<string | null>(null);
  const [mathIsSubmitted, setMathIsSubmitted] = useState(false);
  const [mathIsCorrect, setMathIsCorrect] = useState(false);

  // English interactive states
  const [selectedEnglishOption, setSelectedEnglishOption] = useState<string | null>(null);
  const [englishIsSubmitted, setEnglishIsSubmitted] = useState(false);
  const [englishIsCorrect, setEnglishIsCorrect] = useState(false);

  // English Sentence Builder states:
  const [sentenceParts, setSentenceParts] = useState<string[]>([]);
  const [selectedChips, setSelectedChips] = useState<string[]>([]);

  // Writing status states
  const [writingText, setWritingText] = useState('');
  const [writingIsSubmitting, setWritingIsSubmitting] = useState(false);
  const [writingReviewResult, setWritingReviewResult] = useState<any | null>(null);

  // Load subject questions
  const mathList = MATH_QUESTIONS[ageGroup] || [];
  const englishList = ENGLISH_QUESTIONS[ageGroup] || [];
  const writingList = WRITING_TASKS[ageGroup] || [];

  const activeMathQuestion: MathQuestion = mathList[currentMathIndex] || mathList[0];
  const activeEnglishQuestion: EnglishQuestion = englishList[currentEnglishIndex] || englishList[0];
  const activeWritingTask: WritingTask = writingList[selectedTopicIndex] || writingList[0];

  // Configure sentence chips if English question is of type "sentence"
  useEffect(() => {
    if (activeEnglishQuestion && activeEnglishQuestion.type === 'sentence') {
      const words = activeEnglishQuestion.answer.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, "").split(/\s+/);
      // shuffle the words for chips
      const shuffled = [...words].sort(() => Math.random() - 0.5);
      setSentenceParts(shuffled);
      setSelectedChips([]);
    }
  }, [activeEnglishQuestion, currentEnglishIndex]);

  // Audio helper: Read question aloud
  const handleReadQuestion = (voiceText?: string, uzExplanation?: string) => {
    if (voiceText) {
      speakMessage(voiceText, 'en');
    } else if (uzExplanation) {
      speakMessage(uzExplanation, 'uz');
    }
  };

  // Math submission checker
  const handleMathCheck = () => {
    if (!activeMathQuestion || mathIsSubmitted) return;

    let userAns = selectedMathOption || mathAnswer.trim();
    if (!userAns) return;

    const correct = userAns.toLowerCase() === activeMathQuestion.answer.toLowerCase();
    setMathIsCorrect(correct);
    setMathIsSubmitted(true);

    const updated = { ...profile };
    if (correct) {
      playSuccessChime();
      speakRandomCorrect();
      
      const xpReward = updated.xpBoostEndTime && updated.xpBoostEndTime > Date.now() ? 30 : 15;
      updated.xp += xpReward;
      updated.coins += 10;
      updated.dailyMathCount += 1;
      
      onUpdateProfile(updated);
      onShowMessage(`To'g'ri! +${xpReward} XP, +10 Tanga to'pladingiz! 🎉`, 'success');
    } else {
      playEncouragementBuzz();
      speakRandomIncorrectUz();
      onShowMessage(`Xato chalyapti. Taslim bo'lmang, boyqush sizga ishonadi! 🦉`, 'info');
    }
  };

  // English submission checker
  const handleEnglishCheck = () => {
    if (!activeEnglishQuestion || englishIsSubmitted) return;

    let userAns = '';
    if (activeEnglishQuestion.type === 'sentence') {
      userAns = selectedChips.join(' ') + '.';
    } else {
      userAns = selectedEnglishOption || '';
    }

    if (!userAns) return;

    const cleanUser = userAns.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, "").toLowerCase().trim();
    const cleanCorrect = activeEnglishQuestion.answer.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, "").toLowerCase().trim();

    const correct = cleanUser === cleanCorrect;
    setEnglishIsCorrect(correct);
    setEnglishIsSubmitted(true);

    const updated = { ...profile };
    if (correct) {
      playSuccessChime();
      speakRandomCorrect();
      
      const xpReward = updated.xpBoostEndTime && updated.xpBoostEndTime > Date.now() ? 30 : 15;
      updated.xp += xpReward;
      updated.coins += 10;
      updated.dailyEnglishCount += 1;
      
      onUpdateProfile(updated);
      onShowMessage(`Barakalla! To'g'ri! +${xpReward} XP, +10 Tanga to'pladingiz! 🇬🇧`, 'success');
    } else {
      playEncouragementBuzz();
      speakRandomIncorrectEn();
      onShowMessage(`Deyarli to'g'ri, yana bir bor sinab ko'ring! 💪`, 'info');
    }
  };

  // Skip / Next ques transition
  const handleNextMath = () => {
    setMathAnswer('');
    setSelectedMathOption(null);
    setMathIsSubmitted(false);
    setMathIsCorrect(false);
    setCurrentMathIndex((currentMathIndex + 1) % mathList.length);
  };

  const handleNextEnglish = () => {
    setSelectedEnglishOption(null);
    setEnglishIsSubmitted(false);
    setEnglishIsCorrect(false);
    setSelectedChips([]);
    setCurrentEnglishIndex((currentEnglishIndex + 1) % englishList.length);
  };

  // English chips click handlers
  const handleChipClick = (word: string, index: number) => {
    // Add to selection
    setSelectedChips(prev => [...prev, word]);
    // Remove from choices
    const temp = [...sentenceParts];
    temp.splice(index, 1);
    setSentenceParts(temp);
  };

  const handleResetChips = () => {
    if (activeEnglishQuestion && activeEnglishQuestion.type === 'sentence') {
      const words = activeEnglishQuestion.answer.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, "").split(/\s+/);
      const shuffled = [...words].sort(() => Math.random() - 0.5);
      setSentenceParts(shuffled);
      setSelectedChips([]);
    }
  };

  // AI Essay Correction Call
  const handleWritingCheck = async () => {
    if (!writingText.trim()) return;
    setWritingIsSubmitting(true);
    speakMessage("Inshongiz boyqush murabbiyiga jo'natildi. Tahlil qilinmoqda!", 'uz');

    try {
      const response = await fetch('/api/coach/review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          writing: writingText,
          ageGroup: profile.ageGroup,
          topic: activeWritingTask.topic,
          uzTopic: activeWritingTask.uzTopic
        })
      });

      const data = await response.json();
      if (data.success) {
        setWritingReviewResult(data);
        playSuccessChime();
        speakMessage(data.feedbackUz || "Ajoyib ish!", 'uz');

        // Apply awards
        const updated = { ...profile };
        const baseXP = data.xpGain || 25;
        const finalXP = updated.xpBoostEndTime && updated.xpBoostEndTime > Date.now() ? baseXP * 2 : baseXP;
        
        updated.xp += finalXP;
        updated.coins += (data.coinGain || 15);
        updated.dailyWritingCount += 1;
        
        onUpdateProfile(updated);
        onShowMessage(`Insho tekshirildi! +${finalXP} XP hamda +${data.coinGain || 15} Tanga sovg'a qilindi! 🏆✍️`, 'success');
      } else {
        throw new Error("Checker offline fallback failed");
      }
    } catch (err) {
      console.error(err);
      onShowMessage("AI ulanishda nosozlik. Biz mahalliy murabbiy tekshiruvini faollashtirdik!", "info");
    } finally {
      setWritingIsSubmitting(false);
    }
  };

  const handleResetWriting = () => {
    setWritingText('');
    setWritingReviewResult(null);
  };

  return (
    <div className="bg-white rounded-3xl p-5 md:p-6 border-3 border-gray-100 shadow-xl space-y-6">
      {/* Subject Header */}
      <div className={`p-5 rounded-2xl text-white border-b-4 flex items-center justify-between shadow-md ${
        activeSubject === 'math'
          ? 'bg-blue-600 border-blue-800'
          : activeSubject === 'english'
          ? 'bg-emerald-600 border-emerald-800'
          : 'bg-purple-600 border-purple-800'
      }`}>
        <div>
          <span className="text-xs bg-white/20 text-white font-bold uppercase tracking-wider px-2.5 py-1 rounded-full">
            {activeSubject === 'math' ? 'MATEMATIKA' : activeSubject === 'english' ? 'INGLIZ TILI' : 'ONA TILI VA YOZISH'}
          </span>
          <h3 className="text-2xl font-black font-sans mt-1.5 flex items-center gap-1.5 leading-tight">
            {activeSubject === 'math' && 'Matematika Sirlari 📐'}
            {activeSubject === 'english' && 'English Academy 🇬🇧'}
            {activeSubject === 'writing' && 'Mitti Yozuvchi va Essayist ✍️'}
          </h3>
          <p className="text-xs text-white/90 mt-1 font-mono">
            Yosh doirangiz: <span className="underline font-bold">{ageGroup} yosh</span>
          </p>
        </div>

        {activeSubject === 'math' && <span className="text-4xl animate-bounce">➕</span>}
        {activeSubject === 'english' && <span className="text-4xl animate-bounce">🇬🇧</span>}
        {activeSubject === 'writing' && <span className="text-4xl animate-bounce">🖋️</span>}
      </div>

      {/* ➕ MATH WORKSPACE */}
      {activeSubject === 'math' && activeMathQuestion && (
        <div className="space-y-6">
          <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200 shadow-inner flex flex-col items-center text-center space-y-4">
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-slate-500 font-mono">Savol {currentMathIndex + 1} / {mathList.length}</span>
              <button
                onClick={() => handleReadQuestion(activeMathQuestion.voicePrompt, activeMathQuestion.promptUz)}
                className="p-1 rounded-full cursor-pointer bg-blue-105 hover:bg-blue-200 text-blue-700 transition"
                title="Ovozda eshitish"
              >
                <Volume2 className="w-4 h-4" />
              </button>
            </div>
            
            <p className="text-xl text-blue-800 font-bold">{activeMathQuestion.promptUz}</p>
            <h4 className="text-3xl font-black font-sans text-slate-800 uppercase tracking-widest">{activeMathQuestion.question}</h4>

            {/* Apple counting representations in 5-8 range */}
            {activeMathQuestion.type === 'count' && activeMathQuestion.itemsCount && (
              <div className="flex justify-center flex-wrap gap-2 py-3 bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
                {Array.from({ length: activeMathQuestion.itemsCount }).map((_, idx) => (
                  <span key={idx} className="text-4xl animate-scaleUp">⭐</span>
                ))}
              </div>
            )}
          </div>

          {/* Options / Input panel */}
          {activeMathQuestion.options ? (
            <div className="grid grid-cols-2 gap-3">
              {activeMathQuestion.options.map((opt) => (
                <button
                  key={opt}
                  onClick={() => !mathIsSubmitted && setSelectedMathOption(opt)}
                  className={`p-4 rounded-xl cursor-pointer text-base font-extrabold border-2 transition ${
                    selectedMathOption === opt
                      ? 'border-blue-600 bg-blue-50 text-blue-900 shadow-md'
                      : 'border-slate-100 bg-white hover:border-slate-305 text-slate-700 font-bold'
                  }`}
                  disabled={mathIsSubmitted}
                >
                  {opt}
                </button>
              ))}
            </div>
          ) : (
            <div className="space-y-2">
              <label className="block text-sm font-bold text-slate-700">Javobingizni kiriting:</label>
              <input
                type="number"
                value={mathAnswer}
                onChange={(e) => setMathAnswer(e.target.value)}
                className="w-full p-4 border-2 border-slate-100 hover:border-blue-300 focus:border-blue-600 rounded-xl focus:outline-none"
                placeholder="Raqam ko'rinishida yozing"
                disabled={mathIsSubmitted}
              />
            </div>
          )}

          {/* Actions feedback drawer */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
            {mathIsSubmitted ? (
              <div className="flex items-center gap-3">
                {mathIsCorrect ? (
                  <span className="flex items-center gap-2 text-green-700 bg-green-50 px-4 py-2 rounded-xl font-bold border border-green-200">
                    <CheckCircle2 className="w-5 h-5" /> Juda ham to&apos;g&apos;ri! Ajablanarli!
                  </span>
                ) : (
                  <span className="flex items-center gap-2 text-amber-700 bg-amber-50 px-4 py-2 rounded-xl font-bold border border-amber-200">
                    <AlertCircle className="w-5 h-5" /> Hammasi joyida! To&apos;g&apos;ri javob: <span className="underline font-black font-mono">{activeMathQuestion.answer}</span>
                  </span>
                )}
              </div>
            ) : (
              <div className="text-xs text-slate-400 font-medium">Topshiriqni yechishga tayyormisiz?</div>
            )}

            {mathIsSubmitted ? (
              <button
                onClick={handleNextMath}
                className="p-3.5 bg-yellow-400 hover:bg-yellow-500 text-slate-900 font-bold rounded-xl cursor-pointer shadow-md transition flex items-center gap-1 text-sm border-b-4 border-yellow-600"
              >
                Keyingi Savol <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={handleMathCheck}
                className="p-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl cursor-pointer shadow-md transition text-sm border-b-4 border-blue-800"
                disabled={!selectedMathOption && !mathAnswer}
              >
                Tekshirish 👍
              </button>
            )}
          </div>
        </div>
      )}

      {/* 🇬🇧 ENGLISH ACADEMY WORKSPACE */}
      {activeSubject === 'english' && activeEnglishQuestion && (
        <div className="space-y-6">
          <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200 shadow-inner flex flex-col items-center text-center space-y-4">
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-slate-500 font-mono">Question {currentEnglishIndex + 1} / {englishList.length}</span>
              <button
                onClick={() => handleReadQuestion(activeEnglishQuestion.voicePrompt, activeEnglishQuestion.promptUz)}
                className="p-1 rounded-full cursor-pointer bg-emerald-100 hover:bg-emerald-200 text-emerald-700 transition animate-pulse"
                title="Suhbatni tinglash"
              >
                <Headphones className="w-4 h-4" />
              </button>
            </div>
            
            <p className="text-base text-slate-500 font-sans font-bold flex items-center gap-1 justify-center bg-slate-100 px-3 py-1 rounded-full">
              <span>🇬🇧 Type:</span> <span className="uppercase text-emerald-700 font-mono text-xs">{activeEnglishQuestion.type}</span>
            </p>
            <p className="text-lg text-emerald-800 font-semibold">{activeEnglishQuestion.promptUz}</p>
            <h4 className="text-2xl font-bold text-slate-800 leading-normal font-sans italic">
              &quot;{activeEnglishQuestion.question}&quot;
            </h4>
          </div>

          {/* Render layout dynamic components: if type = sentence builder, show chips */}
          {activeEnglishQuestion.type === 'sentence' ? (
            <div className="space-y-4">
              {/* Construction tray */}
              <div className="p-4 bg-white border-2 border-dashed border-emerald-300 rounded-2xl min-h-16 flex flex-wrap gap-2 items-center">
                {selectedChips.length === 0 ? (
                  <span className="text-slate-400 text-xs italic font-medium">Gap tuzish uchun quyidagi so&apos;zlarni bosing...</span>
                ) : (
                  selectedChips.map((word, idx) => (
                    <span
                      key={idx}
                      className="bg-emerald-50 text-emerald-800 border-2 border-emerald-300 px-3.5 py-1.5 rounded-xl font-bold text-sm shadow-sm hover:scale-95 cursor-pointer"
                      onClick={() => {
                        // Reset particular chip
                        setSelectedChips(prev => prev.filter((_, i) => i !== idx));
                        setSentenceParts(prev => [...prev, word]);
                      }}
                    >
                      {word}
                    </span>
                  ))
                )}
              </div>

              {/* Choices chips */}
              <div className="flex flex-wrap gap-2 justify-center bg-slate-50 p-3 rounded-xl border border-slate-100">
                {sentenceParts.map((word, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleChipClick(word, idx)}
                    className="bg-white hover:bg-slate-50 border border-slate-200 px-4 py-2 rounded-xl font-semibold text-sm shadow-sm cursor-pointer hover:border-emerald-400 transition"
                    disabled={englishIsSubmitted}
                  >
                    {word}
                  </button>
                ))}
              </div>

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={handleResetChips}
                  className="text-xs text-slate-500 flex items-center gap-1 cursor-pointer bg-slate-105 border border-slate-200 px-3 py-1.5 rounded-lg hover:bg-slate-200"
                  disabled={englishIsSubmitted}
                >
                  <RotateCcw className="w-3.5 h-3.5" /> Qaytadan boshlash
                </button>
              </div>
            </div>
          ) : (
            // standard vocabulary selector options
            <div className="grid grid-cols-2 gap-3">
              {activeEnglishQuestion.options?.map((opt) => (
                <button
                  key={opt}
                  onClick={() => !englishIsSubmitted && setSelectedEnglishOption(opt)}
                  className={`p-4 rounded-xl cursor-pointer text-base font-extrabold border-2 transition ${
                    selectedEnglishOption === opt
                      ? 'border-emerald-600 bg-emerald-50 text-emerald-900 shadow-md'
                      : 'border-slate-100 bg-white hover:border-slate-355 text-slate-750 font-bold'
                  }`}
                  disabled={englishIsSubmitted}
                >
                  {opt}
                </button>
              ))}
            </div>
          )}

          {/* Feedback section */}
          <div className="pt-4 border-t border-slate-101 flex items-center justify-between">
            {englishIsSubmitted ? (
              <div className="flex items-center gap-3">
                {englishIsCorrect ? (
                  <span className="flex items-center gap-2 text-green-700 bg-green-50 px-4 py-2 rounded-xl font-bold border border-green-200">
                    <CheckCircle2 className="w-5 h-5 animate-bounce" /> Amazing! Spot on!
                  </span>
                ) : (
                  <span className="flex items-center gap-2 text-amber-700 bg-amber-50 px-4 py-2 rounded-xl font-bold border border-amber-200">
                    <AlertCircle className="w-5 h-5" /> Greate Effort! Answer: <span className="underline font-black font-sans">{activeEnglishQuestion.answer}</span>
                  </span>
                )}
              </div>
            ) : (
              <div className="text-xs text-slate-400">Can you match the core answer?</div>
            )}

            {englishIsSubmitted ? (
              <button
                onClick={handleNextEnglish}
                className="p-3.5 bg-yellow-405 hover:bg-yellow-500 text-slate-900 font-bold rounded-xl cursor-pointer shadow-md transition flex items-center gap-1 text-sm border-b-4 border-yellow-600"
              >
                Keyingi Savol <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={handleEnglishCheck}
                className="p-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl cursor-pointer shadow-md transition text-sm border-b-4 border-emerald-800"
                disabled={activeEnglishQuestion.type === 'sentence' ? selectedChips.length === 0 : !selectedEnglishOption}
              >
                Javobni Tekshirish 🇬🇧
              </button>
            )}
          </div>
        </div>
      )}

      {/* 🖋️ WRITING / ESSAY WORKSPACE WITH AI REAL-TIME FEEDBACK SCROLL */}
      {activeSubject === 'writing' && activeWritingTask && (
        <div className="space-y-6">
          <div className="bg-purple-50 p-4 rounded-xl border border-purple-200 text-purple-900 flex items-start gap-4">
            <FileText className="w-10 h-10 text-purple-600 shrink-0 bg-white p-2 rounded-lg border border-purple-100" />
            <div className="space-y-1">
              <span className="text-[10px] bg-purple-200 font-black px-2 py-0.5 rounded-full uppercase tracking-wider">
                Mavzu
              </span>
              <h4 className="font-bold text-base leading-snug">{activeWritingTask.uzTopic}</h4>
              <p className="text-xs text-purple-800 italic leading-relaxed">
                {activeWritingTask.uzDescription} ({activeWritingTask.topic})
              </p>
            </div>
          </div>

          {/* Quick topics picker */}
          <div className="flex gap-2.5 overflow-x-auto py-1">
            {writingList.map((topic, index) => (
              <button
                key={topic.id}
                onClick={() => {
                  setSelectedTopicIndex(index);
                  handleResetWriting();
                }}
                className={`text-xs px-3 py-1.5 rounded-full font-bold whitespace-nowrap shrink-0 transition cursor-pointer ${
                  selectedTopicIndex === index
                    ? 'bg-purple-600 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {index + 1}. {topic.uzTopic}
              </button>
            ))}
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-sm font-bold text-slate-700">Yozuv inshosi o&apos;rnini to&apos;ldiring:</label>
              {activeWritingTask.suggestedWords && (
                <div className="text-[11px] text-slate-500 font-medium">
                  Maslahat so&apos;zlar: <span className="font-bold text-purple-700">{activeWritingTask.suggestedWords.join(', ')}</span>
                </div>
              )}
            </div>

            <textarea
              rows={8}
              value={writingText}
              onChange={(e) => setWritingText(e.target.value)}
              className="w-full p-4 border-2 border-slate-100 hover:border-purple-300 focus:border-purple-600 rounded-2xl focus:outline-none text-sm leading-relaxed text-slate-800"
              placeholder={`Mavzu dairesida shirin fikrlaringizni shu yerga yozing...\nMasalan: ${
                activeWritingTask.id === 'w_5_1'
                  ? 'Mening sevimli mushugim bor. Uning ismi Moshka.'
                  : 'Mening sevimli hobbyim kitob o\'qish. Men kitob orqali dunyoni kezaman.'
              }`}
              disabled={writingIsSubmitting || writingReviewResult !== null}
            />
          </div>

          {/* Check submission action buttons */}
          <div className="flex items-center justify-between gap-4">
            {writingReviewResult ? (
              <button
                onClick={handleResetWriting}
                className="p-3 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold rounded-xl cursor-pointer text-xs transition"
              >
                Boshqa insho yozish
              </button>
            ) : (
              <div className="text-xs text-slate-400">Kamida bir necha so&apos;z yozib, AI murabbiyga jo&apos;nating!</div>
            )}

            {!writingReviewResult && (
              <button
                onClick={handleWritingCheck}
                className="p-4 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl cursor-pointer shadow-md transition text-xs flex items-center gap-1.5 border-b-4 border-purple-800"
                disabled={writingIsSubmitting || !writingText.trim()}
              >
                {writingIsSubmitting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" /> Aqlli Boyqush tekshirmoqda...
                  </>
                ) : (
                  <>
                    AI Coach Murabbiy bilan Tekshirish 🧠🦉
                  </>
                )}
              </button>
            )}
          </div>

          {/* 📜 PRISTINE SCROLL PAPER WITH ESSAY GRADES FROM THE BACKEND AI */}
          {writingReviewResult && (
            <div className="relative mt-8 p-6 bg-amber-50 border-4 border-amber-200 rounded-3xl shadow-xl space-y-5 animate-scaleUp overflow-hidden max-w-lg mx-auto">
              <div className="absolute top-0 right-0 w-20 h-20 bg-amber-200/50 rounded-full filter blur-xl opacity-40" />

              {/* Title Scroll style */}
              <div className="text-center pb-3 border-b-2 border-dashed border-amber-300 space-y-1">
                <span className="text-4xl">📜</span>
                <h4 className="text-xl font-sans font-black text-amber-900 tracking-wide uppercase">
                  AI Boyqush Tahlili va Bahosi
                </h4>
                <p className="text-[10px] text-amber-700 font-mono">SmartLearn AI Evaluator System</p>
              </div>

              {/* Score visual layout */}
              <div className="flex items-center justify-around bg-white p-4 rounded-2xl border border-amber-150 shadow-sm">
                <div className="text-center">
                  <div className="text-sm font-bold text-slate-500 uppercase tracking-wider">Insho balli</div>
                  <div className="text-4xl font-black font-sans text-purple-700 mt-1">
                    {writingReviewResult.score} / 100
                  </div>
                </div>

                <div className="h-10 w-px bg-amber-200" />

                <div className="text-center">
                  <div className="text-sm font-bold text-slate-500 uppercase tracking-wider">Yutilgan mukofot</div>
                  <div className="flex items-center gap-2 mt-1 justify-center">
                    <span className="font-bold text-sm bg-yellow-100 text-yellow-800 px-2 py-1 rounded-lg">
                      🪙 {writingReviewResult.coinGain || 15} Tangalar
                    </span>
                    <span className="font-bold text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded-lg">
                      ⭐ {writingReviewResult.xpGain || 25} XP
                    </span>
                  </div>
                </div>
              </div>

              {/* Suggestions */}
              <div className="space-y-3 p-1">
                <div>
                  <h5 className="text-xs font-bold font-sans text-amber-900 uppercase tracking-wider flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-green-600" /> Murabbiy Fikri:
                  </h5>
                  <p className="text-xs text-slate-700 mt-1 leading-relaxed bg-white/60 p-3 rounded-xl border border-amber-100 italic font-medium">
                    &quot;{writingReviewResult.feedbackUz}&quot;
                  </p>
                  {writingReviewResult.feedbackEn && (
                    <p className="text-[11px] text-slate-500 mt-1 italic pl-3">
                      EN: &quot;{writingReviewResult.feedbackEn}&quot;
                    </p>
                  )}
                </div>

                {writingReviewResult.grammaticalErrors && writingReviewResult.grammaticalErrors.length > 0 && (
                  <div>
                    <h5 className="text-xs font-bold font-sans text-amber-900 uppercase tracking-wider flex items-center gap-1.5">
                      🔎 Grammatika va Imlo tuzatish:
                    </h5>
                    <ul className="text-xs text-red-700 mt-1 pl-4 list-disc space-y-1">
                      {writingReviewResult.grammaticalErrors.map((err: string, i: number) => (
                        <li key={i}>{err}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {writingReviewResult.suggestions && writingReviewResult.suggestions.length > 0 && (
                  <div>
                    <h5 className="text-xs font-bold font-sans text-amber-900 uppercase tracking-wider flex items-center gap-1.5">
                      💡 Yaxshilash maslahatlari:
                    </h5>
                    <ol className="text-xs text-indigo-800 mt-1 pl-4 list-decimal space-y-1">
                      {writingReviewResult.suggestions.map((sug: string, i: number) => (
                        <li key={i}>{sug}</li>
                      ))}
                    </ol>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
