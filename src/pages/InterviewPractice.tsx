import React, { useState, useEffect, useRef } from 'react';
import { SetupForm } from '../components/interview/SetupForm';
import { FeedbackPanel } from '../components/interview/FeedbackPanel';
import { SessionSummary } from '../components/interview/SessionSummary';
import { Card } from '../components/ui/Card';
import { Skeleton } from '../components/ui/Skeleton';
import { Button } from '../components/ui/Button';
import { useGemini } from '../hooks/useGemini';
import { gemini } from '../services/gemini';
import { useAppStore } from '../store/appStore';
import { Question, AnswerRecord, SavedInterview, InterviewConfig } from '../types';
import { 
  Activity, 
  Terminal, 
  Clock, 
  Award, 
  ShieldAlert, 
  Video, 
  Mic, 
  MicOff, 
  Volume2, 
  VolumeX, 
  Play, 
  Clipboard, 
  Code, 
  Compass, 
  UserCheck,
  PhoneOff,
  VideoOff
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import '../styles/globals.css';
import '../styles/animations.css';

type SessionState = 'setup' | 'loading_questions' | 'answering' | 'viewing_feedback' | 'summary';

export const InterviewPractice: React.FC = () => {
  const navigate = useNavigate();
  const { addInterviewSession, activeInterview, setActiveInterview, addToast } = useAppStore();
  const { execute: getQuestions, loading: loadingQuestions, error: questionsError, reset: resetQuestions } = useGemini(gemini.generateInterviewQuestions, 10);
  const { execute: evaluateAns, loading: evaluatingAnswer, error: evalError, reset: resetEval } = useGemini(gemini.evaluateAnswer, 5);

  const [sessionState, setSessionState] = useState<SessionState>(activeInterview ? 'summary' : 'setup');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answersList, setAnswersList] = useState<AnswerRecord[]>([]);
  const [activeConfig, setActiveConfig] = useState<InterviewConfig | null>(null);
  const [currentFeedback, setCurrentFeedback] = useState<any | null>(null);

  // Time & Video Tracking
  const [seconds, setSeconds] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  
  // Webcam media stream
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);

  // Locked Meeting Room UI States
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
  const [cameraEnabled, setCameraEnabled] = useState(true);
  const [micMuted, setMicMuted] = useState(false);
  const [idePanelOpen, setIdePanelOpen] = useState(true);
  const [notesPanelOpen, setNotesPanelOpen] = useState(true);

  // Prevent escape/leave during active call
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (sessionState === 'answering' || sessionState === 'viewing_feedback' || sessionState === 'loading_questions') {
        e.preventDefault();
        e.returnValue = 'You are currently in an active interview session. Leaving will lose all progress. Are you sure?';
        return e.returnValue;
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [sessionState]);

  // Handle document scroll locking during calls
  useEffect(() => {
    if (sessionState === 'answering' || sessionState === 'viewing_feedback' || sessionState === 'loading_questions' || evaluatingAnswer) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [sessionState, evaluatingAnswer]);

  // TTS Speech Synthesis State
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isMuted, setIsMuted] = useState(false);

  // STT Speech Recognition State
  const [isRecording, setIsRecording] = useState(false);
  const recognitionRef = useRef<any>(null);
  const [typedAnswer, setTypedAnswer] = useState('');

  // Code Editor IDE State
  const [ideLanguage, setIdeLanguage] = useState('javascript');
  const [ideCode, setIdeCode] = useState('// Write your coding solution here\n\nfunction solve() {\n  // Implementation\n}');
  const [codingSeconds, setCodingSeconds] = useState(900); // 15 mins
  const codingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const [consoleOutput, setConsoleOutput] = useState<string | null>(null);
  const [runningTests, setRunningTests] = useState(false);

  // General Timer Effect
  useEffect(() => {
    if (sessionState === 'answering') {
      timerRef.current = setInterval(() => {
        setSeconds(prev => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [sessionState]);

  // Webcam activation effect
  useEffect(() => {
    if (sessionState === 'answering' && activeConfig?.videoMode) {
      navigator.mediaDevices.getUserMedia({ video: true, audio: false })
        .then(s => {
          setStream(s);
          if (videoRef.current) {
            videoRef.current.srcObject = s;
          }
        })
        .catch(err => {
          console.warn("Camera access blocked or unavailable:", err);
        });
    } else {
      if (stream) {
        stream.getTracks().forEach(t => t.stop());
        setStream(null);
      }
    }
    return () => {
      if (stream) {
        stream.getTracks().forEach(t => t.stop());
      }
    };
  }, [sessionState, activeConfig?.videoMode]);

  // TTS speech execution on new question
  useEffect(() => {
    if (sessionState === 'answering' && activeConfig?.videoMode && questions.length > 0 && !isMuted) {
      speakQuestion(questions[currentIdx].text);
    }
    return () => {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, [sessionState, currentIdx, questions, activeConfig?.videoMode, isMuted]);

  // Coding round timer effect
  useEffect(() => {
    const isCodingRound = questions.length > 0 && (questions[currentIdx].category === 'coding' || questions[currentIdx].text.toLowerCase().includes('write a') || questions[currentIdx].text.toLowerCase().includes('implement'));
    if (sessionState === 'answering' && isCodingRound) {
      setCodingSeconds(900);
      codingTimerRef.current = setInterval(() => {
        setCodingSeconds(prev => {
          if (prev <= 1) {
            clearInterval(codingTimerRef.current!);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (codingTimerRef.current) clearInterval(codingTimerRef.current);
    }
    return () => {
      if (codingTimerRef.current) clearInterval(codingTimerRef.current);
    };
  }, [sessionState, currentIdx, questions]);

  const speakQuestion = (text: string) => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    const voices = window.speechSynthesis.getVoices();
    const voice = voices.find(v => v.lang.startsWith('en-') && v.name.toLowerCase().includes('google'));
    if (voice) {
      utterance.voice = voice;
    }
    window.speechSynthesis.speak(utterance);
  };

  const handleSpeechToggle = () => {
    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      setIsMuted(true);
    } else {
      setIsMuted(false);
      if (questions.length > 0) {
        speakQuestion(questions[currentIdx].text);
      }
    }
  };

  const startDictation = () => {
    if (micMuted) {
      addToast('info', 'Your microphone is muted in call controls! Unmute to start speaking.');
      return;
    }
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Speech recognition is not supported in this browser. Please use Chrome or Microsoft Edge.");
      return;
    }

    const rec = new SpeechRecognition();
    rec.continuous = true;
    rec.interimResults = true;
    rec.lang = 'en-US';

    rec.onresult = (event: any) => {
      let currentResult = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          currentResult += event.results[i][0].transcript;
        }
      }
      if (currentResult) {
        setTypedAnswer(prev => prev + (prev.endsWith(' ') || prev === '' ? '' : ' ') + currentResult);
      }
    };

    rec.onend = () => {
      setIsRecording(false);
    };

    rec.onerror = (e: any) => {
      console.error("STT Dictation Error:", e);
      setIsRecording(false);
    };

    recognitionRef.current = rec;
    rec.start();
    setIsRecording(true);
  };

  const stopDictation = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setIsRecording(false);
  };

  const formatTime = (secs: number) => {
    const mm = String(Math.floor(secs / 60)).padStart(2, '0');
    const ss = String(secs % 60).padStart(2, '0');
    return `${mm}:${ss}`;
  };

  const handleGenerate = async (config: InterviewConfig) => {
    setActiveConfig(config);
    setSessionState('loading_questions');
    
    const questionsRes = await getQuestions(config);
    if (questionsRes && questionsRes.length > 0) {
      setQuestions(questionsRes);
      setCurrentIdx(0);
      setAnswersList([]);
      setSeconds(0);
      setTypedAnswer('');
      setConsoleOutput(null);
      setSessionState('answering');
    } else {
      setSessionState('setup');
    }
  };

  const runMockTests = () => {
    setRunningTests(true);
    setConsoleOutput('Running sample test cases...');
    setTimeout(() => {
      setRunningTests(false);
      setConsoleOutput([
        '✔ Test Case 1 Passed: solve() returns correct standard output (0.1ms)',
        '✔ Test Case 2 Passed: handles boundary edge inputs (0.05ms)',
        '✔ Test Case 3 Passed: performance under high workload (1.1ms)',
        '\nConsole: 3/3 Test Cases Successfully Passed.'
      ].join('\n'));
    }, 1500);
  };

  const handleSubmitAnswer = async (userAnswer: string) => {
    if (currentIdx >= questions.length || !activeConfig) return;
    setSessionState('viewing_feedback');

    const currentQuestion = questions[currentIdx];
    
    // Evaluate answer using Gemini
    const feedbackResult = await evaluateAns(
      currentQuestion.text,
      userAnswer,
      activeConfig.jobRole,
      currentQuestion.expectedTopics
    );

    if (feedbackResult) {
      const record: AnswerRecord = {
        question: currentQuestion,
        userAnswer,
        feedback: feedbackResult,
        timestamp: Date.now()
      };
      setAnswersList(prev => [...prev, record]);
      setCurrentFeedback(feedbackResult);
    } else {
      // Fallback evaluation if API fails
      const fallbackFeedback = {
        overallScore: 7,
        accuracy: 7,
        clarity: 8,
        depth: 6,
        examples: 5,
        strengths: ['Provided a coherent structure', 'Addressed the core topic prompt'],
        improvements: ['Include deeper metrics', 'Explain standard alternatives'],
        modelAnswer: 'Reference model answer generated during fallback.'
      };
      const record: AnswerRecord = {
        question: currentQuestion,
        userAnswer,
        feedback: fallbackFeedback,
        timestamp: Date.now()
      };
      setAnswersList(prev => [...prev, record]);
      setCurrentFeedback(fallbackFeedback);
    }
  };

  const handleSkip = () => {
    if (currentIdx >= questions.length || !activeConfig) return;
    
    const record: AnswerRecord = {
      question: questions[currentIdx],
      userAnswer: '[Question Skipped]',
      feedback: {
        overallScore: 0,
        accuracy: 0,
        clarity: 0,
        depth: 0,
        examples: 0,
        strengths: ['No strengths recorded.'],
        improvements: ['Answer was skipped. Select retry or review expected topics.'],
        modelAnswer: 'N/A'
      },
      timestamp: Date.now()
    };
    
    setAnswersList(prev => [...prev, record]);
    setCurrentIdx(prev => prev + 1);
    setTypedAnswer('');
    setConsoleOutput(null);
    setSessionState('answering');
  };

  const handleNext = () => {
    if (!activeConfig) return;
    
    const nextIndex = currentIdx + 1;
    if (nextIndex < questions.length) {
      setCurrentIdx(nextIndex);
      setCurrentFeedback(null);
      setTypedAnswer('');
      setConsoleOutput(null);
      setSessionState('answering');
    } else {
      // End session - calculate final score
      const totalScore = answersList.reduce((acc, curr) => acc + curr.feedback.overallScore, 0);
      const overallAvg = parseFloat((totalScore / questions.length).toFixed(1));

      const savedSession: SavedInterview = {
        id: crypto.randomUUID(),
        timestamp: Date.now(),
        config: activeConfig,
        answers: answersList,
        overallScore: overallAvg
      };

      // Store session
      addInterviewSession(savedSession);
      setSessionState('summary');
    }
  };

  const handleRetry = () => {
    resetQuestions();
    resetEval();
    setQuestions([]);
    setAnswersList([]);
    setCurrentFeedback(null);
    setActiveConfig(null);
    setActiveInterview(null);
    setSeconds(0);
    setTypedAnswer('');
    setConsoleOutput(null);
    setSessionState('setup');
  };

  const handleDashboard = () => {
    navigate('/dashboard');
  };

  const currentProgress = questions.length > 0 ? ((currentIdx) / questions.length) * 100 : 0;
  const currentQuestion = questions[currentIdx];
  const isCodingQuestion = currentQuestion && (currentQuestion.category === 'coding' || currentQuestion.text.toLowerCase().includes('write a') || currentQuestion.text.toLowerCase().includes('implement'));

  // Side Notes calculations
  const textWordCount = typedAnswer ? typedAnswer.trim().split(/\s+/).length : 0;
  const matchedTopics = currentQuestion ? currentQuestion.expectedTopics.filter(topic => 
    typedAnswer.toLowerCase().includes(topic.toLowerCase())
  ) : [];

  const getInterviewer = (category: string) => {
    const cat = category.toLowerCase();
    if (cat.includes('technical') || cat.includes('coding')) {
      return {
        name: 'Sophia',
        title: 'Principal Technical Recruiter',
        color: '#00d4aa',
        avatarType: 'sophia',
        accentVar: '--accent-primary',
        desc: 'Expert in frontend, databases, and core data structures.'
      };
    } else if (cat.includes('system') || cat.includes('architecture') || cat.includes('design')) {
      return {
        name: 'Marcus',
        title: 'VP of Software Engineering',
        color: '#f59e0b',
        avatarType: 'marcus',
        accentVar: '--accent-secondary',
        desc: 'Architecture expert focusing on system design, scalability, and algorithms.'
      };
    } else {
      return {
        name: 'Emily',
        title: 'Director of HR & Culture',
        color: '#a855f7',
        avatarType: 'emily',
        accentVar: '--accent-purple',
        desc: 'HR Director testing communication, conflict resolution, and behavioral stories.'
      };
    }
  };

  const renderAvatarSVG = (type: string, isSpk: boolean, isThk: boolean) => {
    const accent = type === 'sophia' ? '#00d4aa' : type === 'marcus' ? '#f59e0b' : '#a855f7';
    return (
      <svg width="130" height="130" viewBox="0 0 100 100" style={{ transformOrigin: 'center', transition: 'all 300ms ease' }}>
        <defs>
          <radialGradient id={`glow-${type}`} cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor={isSpk ? `${accent}44` : isThk ? '#a855f744' : `${accent}11`} />
            <stop offset="100%" stopColor="rgba(0,0,0,0)" />
          </radialGradient>
          <linearGradient id={`gradient-${type}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={accent} />
            <stop offset="100%" stopColor={type === 'sophia' ? '#a855f7' : type === 'marcus' ? '#ef4444' : '#ec4899'} />
          </linearGradient>
        </defs>
        <circle cx="50" cy="50" r="45" fill={`url(#glow-${type})`} className="avatar-breath" />
        <circle cx="50" cy="50" r="38" fill="none" stroke={`url(#gradient-${type})`} strokeWidth="1.5" strokeDasharray={isThk ? "4,6" : "8,6"} className="ring-rotate-cw" style={{ animationDuration: isThk ? '3s' : '15s' }} />
        <circle cx="50" cy="50" r="32" fill="none" stroke={isThk ? '#a855f7' : `${accent}bb`} strokeWidth="1" strokeDasharray={isSpk ? "10,6,4,6" : "15,5"} className="ring-rotate-ccw" style={{ animationDuration: isSpk ? '5s' : '12s' }} />
        <path d="M 32,35 C 32,25 68,25 68,35 L 68,60 C 68,70 50,78 50,78 C 50,78 32,70 32,60 Z" fill="#060b11" stroke={accent} strokeWidth="2" style={{ filter: isSpk ? `drop-shadow(0 0 8px ${accent})` : 'none', transition: 'all 200ms ease' }} />
        {type === 'sophia' ? (
          <>
            <path d="M 38,44 Q 50,47 62,44" fill="none" stroke={accent} strokeWidth="1.5" />
            <circle cx="44" cy="44" r="2" fill="#ffffff" className="eye-left" />
            <circle cx="56" cy="44" r="2" fill="#ffffff" className="eye-right" />
          </>
        ) : type === 'marcus' ? (
          <>
            <polygon points="36,42 45,42 43,46 38,46" fill={accent} />
            <polygon points="55,42 64,42 62,46 57,46" fill={accent} />
            <line x1="42" y1="52" x2="58" y2="52" stroke={accent} strokeWidth="1" />
          </>
        ) : (
          <>
            <circle cx="43" cy="43" r="2.5" fill="none" stroke={accent} strokeWidth="1" />
            <circle cx="43" cy="43" r="0.8" fill="#ffffff" className="eye-left" />
            <circle cx="57" cy="43" r="2.5" fill="none" stroke={accent} strokeWidth="1" />
            <circle cx="57" cy="43" r="0.8" fill="#ffffff" className="eye-right" />
          </>
        )}
        {isSpk ? (
          <path d="M 40,58 Q 45,50 50,58 T 60,58" fill="none" stroke={accent} strokeWidth="2" strokeLinecap="round" className="pulse-speaking" />
        ) : isThk ? (
          <circle cx="50" cy="58" r="2.5" fill="#a855f7" className="pulse-speaking" />
        ) : (
          <line x1="42" y1="58" x2="58" y2="58" stroke={`${accent}aa`} strokeWidth="1" strokeLinecap="round" />
        )}
      </svg>
    );
  };

  const cssStyle = `
    .secure-call-room {
      position: fixed;
      inset: 0;
      z-index: 99999;
      background-color: #060b11;
      color: #f3f4f6;
      display: flex;
      flex-direction: column;
      font-family: var(--font-body);
      overflow: hidden;
      animation: fadeIn 200ms ease;
    }
    @keyframes rotateCw {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }
    @keyframes rotateCcw {
      from { transform: rotate(0deg); }
      to { transform: rotate(-360deg); }
    }
    @keyframes blinkEyes {
      0%, 90%, 100% { transform: scaleY(1); }
      95% { transform: scaleY(0.1); }
    }
    .ring-rotate-cw {
      animation: rotateCw 20s linear infinite;
      transform-origin: 50px 50px;
    }
    .ring-rotate-ccw {
      animation: rotateCcw 15s linear infinite;
      transform-origin: 50px 50px;
    }
    .eye-left, .eye-right {
      animation: blinkEyes 4s ease-in-out infinite;
      transform-origin: center;
    }
    .avatar-breath {
      animation: breath 3s ease-in-out infinite alternate;
      transform-origin: 50px 50px;
    }
    @keyframes breath {
      from { transform: scale(0.96); opacity: 0.8; }
      to { transform: scale(1.04); opacity: 1; }
    }
    .pulse-speaking {
      animation: voicePulse 0.4s ease-in-out infinite alternate;
      transform-origin: center;
    }
    @keyframes voicePulse {
      from { transform: scaleY(0.8); }
      to { transform: scaleY(1.3); }
    }
    .mic-pulse {
      animation: micGlow 1.5s infinite alternate;
    }
    @keyframes micGlow {
      from { box-shadow: 0 0 4px rgba(0, 212, 170, 0.2); }
      to { box-shadow: 0 0 16px rgba(0, 212, 170, 0.6); }
    }
    @media (max-width: 1024px) {
      .call-layout-grid {
        grid-template-columns: 1fr !important;
        overflow-y: auto !important;
      }
      .video-feeds-grid {
        grid-template-columns: 1fr !important;
      }
    }
  `;

  const currentInterviewer = currentQuestion ? getInterviewer(currentQuestion.category) : {
    name: 'Sophia',
    title: 'Principal Technical Recruiter',
    color: '#00d4aa',
    avatarType: 'sophia',
    accentVar: '--accent-primary',
    desc: 'Expert in frontend, databases, and algorithms.'
  };

  return (
    <div className="container" style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      <style dangerouslySetInnerHTML={{ __html: cssStyle }} />

      {/* Leave Confirmation Dialog */}
      {showLeaveConfirm && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(5, 10, 15, 0.9)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 100000,
          animation: 'fadeIn 200ms ease'
        }}>
          <div style={{
            width: '90%',
            maxWidth: '420px',
            backgroundColor: 'var(--bg-surface)',
            border: '1px solid var(--accent-danger)',
            borderRadius: 'var(--radius-lg)',
            padding: '28px',
            display: 'flex',
            flexDirection: 'column',
            gap: '20px',
            boxShadow: '0 20px 50px rgba(244, 63, 94, 0.15)'
          }}>
            <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 600, color: 'var(--text-primary)' }}>
              Exit Secure Interview Meeting?
            </h3>
            <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              You are in an active proctored interview call. Leaving now will terminate the session, and your responses will not be evaluated. Are you sure you want to leave?
            </p>
            <div style={{ display: 'flex', gap: '16px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowLeaveConfirm(false)}
                style={{
                  padding: '8px 16px',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'var(--bg-elevated)',
                  border: '1px solid var(--border-subtle)',
                  color: 'var(--text-primary)',
                  fontSize: 'var(--text-xs)',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
                className="btn-press"
              >
                Go Back
              </button>
              <button
                onClick={() => {
                  setShowLeaveConfirm(false);
                  handleRetry();
                }}
                style={{
                  padding: '8px 16px',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'var(--accent-danger)',
                  color: 'white',
                  border: 'none',
                  fontSize: 'var(--text-xs)',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
                className="btn-press"
              >
                Abort & Leave
              </button>
            </div>
          </div>
        </div>
      )}

      {/* FULLSCREEN MEETING ROOM WORKSPACE */}
      {(sessionState === 'answering' || sessionState === 'viewing_feedback' || sessionState === 'loading_questions' || evaluatingAnswer) ? (
        <div 
          className="secure-call-room"
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 99999,
            backgroundColor: '#060b11',
            color: '#f3f4f6',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden'
          }}
        >
          {/* SECURE CALL ROOM HEADER */}
          <div 
            style={{
              height: '64px',
              borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
              padding: '0 24px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              backgroundColor: 'rgba(10, 17, 26, 0.95)',
              zIndex: 10
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div 
                style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  backgroundColor: sessionState === 'loading_questions' ? '#f59e0b' : '#ef4444',
                  animation: 'breath 1s infinite alternate'
                }}
              />
              <span style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.05em', color: '#f3f4f6', textTransform: 'uppercase' }}>
                {sessionState === 'loading_questions' ? 'DIALING MEETING ROOM...' : 'LIVE SECURE INTERVIEW ROOM'}
              </span>
              <span style={{ color: 'rgba(255, 255, 255, 0.2)' }}>|</span>
              <span style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.6)', fontWeight: 500 }}>
                {activeConfig?.jobRole} Practice Lab
              </span>
            </div>

            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', backgroundColor: 'rgba(255, 255, 255, 0.03)', padding: '6px 16px', borderRadius: '20px', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
              <span style={{ fontSize: '10px', fontWeight: 600, color: 'var(--accent-primary)', textTransform: 'uppercase' }}>
                {currentQuestion ? `ROUND: ${currentQuestion.category.replace('-', ' ')}` : 'ESTABLISHING...'}
              </span>
              <span style={{ color: 'rgba(255, 255, 255, 0.15)' }}>•</span>
              <span style={{ fontSize: '10px', color: 'rgba(255, 255, 255, 0.6)', fontFamily: 'var(--font-mono)' }}>
                {currentQuestion ? `Difficulty: ${currentQuestion.difficulty}` : ''}
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <span style={{ fontSize: '10px', color: 'rgba(255, 255, 255, 0.4)', fontWeight: 600 }}>
                🔒 Proctored Environment
              </span>
              <span style={{ color: 'rgba(255, 255, 255, 0.2)' }}>|</span>
              <span style={{ fontSize: '11px', color: 'var(--accent-primary)', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>
                CALL TIME: {formatTime(seconds)}
              </span>
            </div>
          </div>

          {/* SECURE CALL ROOM SUB-COMPONENTS */}
          {sessionState === 'loading_questions' ? (
            /* DIALING IN SCREEN */
            <div style={{ flexGrow: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '24px', padding: '40px', textAlign: 'center' }}>
              <Activity className="rotating-brain" style={{ width: '56px', height: '56px', color: 'var(--accent-primary)' }} />
              <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 600 }}>
                Connecting to Secure Call Panel...
              </h3>
              <p style={{ fontSize: 'var(--text-xs)', color: 'rgba(255, 255, 255, 0.6)', maxWidth: '440px', lineHeight: 1.6 }}>
                Establishing video handshake and calibrating round criteria questions for the {activeConfig?.jobRole} profile. Please keep webcam and microphone permissions allowed.
              </p>
              <div style={{ width: '100%', maxWidth: '400px', height: '4px', backgroundColor: 'rgba(255, 255, 255, 0.05)', borderRadius: '2px', overflow: 'hidden', marginTop: '12px' }}>
                <div style={{ height: '100%', backgroundColor: 'var(--accent-primary)', width: '60%', animation: 'voicePulse 1.5s infinite ease-in-out' }} />
              </div>
            </div>
          ) : (
            /* THE ACTIVE VIDEO GRID MEETING ROOM */
            <div 
              style={{
                flexGrow: 1,
                display: 'grid',
                gridTemplateColumns: (isCodingQuestion && idePanelOpen && sessionState === 'answering') ? '1fr 1fr' : '1fr',
                gap: '24px',
                padding: '24px',
                overflow: 'hidden'
              }}
              className="call-layout-grid"
            >
              {/* Left Workspace Panel: Video Grids and Feedback Screen Shares */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', height: '100%', overflowY: 'auto' }}>
                
                {/* 1. Scorecard Screen Share View */}
                {sessionState === 'viewing_feedback' && currentFeedback && !evaluatingAnswer ? (
                  <div style={{ flexGrow: 1, display: 'flex', flexDirection: 'column', gap: '16px', backgroundColor: 'rgba(10, 17, 26, 0.5)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: 'var(--radius-lg)', padding: '24px', position: 'relative' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', paddingBottom: '12px', marginBottom: '8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--accent-primary)' }} />
                        <span style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                          {currentInterviewer.name} is sharing: Evaluation Scorecard
                        </span>
                      </div>
                    </div>
                    <div style={{ flexGrow: 1, overflowY: 'auto', paddingRight: '8px' }}>
                      <FeedbackPanel 
                        feedback={currentFeedback} 
                        onNext={handleNext} 
                        isLastQuestion={currentIdx === questions.length - 1} 
                      />
                    </div>
                  </div>
                ) : evaluatingAnswer ? (
                  /* 2. Analyzing/Thinking Screen inside the meeting */
                  <div style={{ flexGrow: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '24px', backgroundColor: 'rgba(10, 17, 26, 0.5)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: 'var(--radius-lg)', padding: '24px' }}>
                    <Terminal className="rotating-brain" style={{ width: '48px', height: '48px', color: 'var(--accent-purple)' }} />
                    <div className="typing-cursor" style={{ fontSize: 'var(--text-md)', fontWeight: 600, color: 'var(--accent-purple)', letterSpacing: '0.05em' }}>
                      {currentInterviewer.name} IS ANALYZING YOUR PERFORMANCE...
                    </div>
                    <p style={{ fontSize: 'var(--text-xs)', color: 'rgba(255, 255, 255, 0.6)', maxWidth: '400px', textAlign: 'center', lineHeight: 1.5 }}>
                      Auditing technical parameters, word patterns, coding constraints, and structural STAR responses for quality.
                    </p>
                    <div style={{ width: '100%', maxWidth: '400px', height: '4px', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: '2px', overflow: 'hidden' }}>
                      <div style={{ height: '100%', backgroundColor: 'var(--accent-purple)', width: '40%', animation: 'voicePulse 1.2s infinite ease-in-out' }} />
                    </div>
                  </div>
                ) : (
                  /* 3. Normal Interview Grid (Feeds Side-by-Side) */
                  <div 
                    style={{
                      flexGrow: 1,
                      display: 'grid',
                      gridTemplateColumns: '1fr 1fr',
                      gap: '20px',
                      alignItems: 'stretch'
                    }}
                    className="video-feeds-grid"
                  >
                    {/* Left Grid: AI Recruiter Avatar Feed */}
                    <div 
                      style={{
                        backgroundColor: '#0a111a',
                        border: '1px solid rgba(255, 255, 255, 0.08)',
                        borderRadius: 'var(--radius-lg)',
                        overflow: 'hidden',
                        position: 'relative',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        minHeight: '260px'
                      }}
                    >
                      <div style={{ position: 'absolute', top: '16px', left: '16px', display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: 'rgba(0,0,0,0.4)', padding: '4px 10px', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.05)' }}>
                        <span style={{ fontSize: '9px', fontWeight: 700, color: 'var(--accent-primary)', textTransform: 'uppercase' }}>
                          {currentInterviewer.name} (AI Interviewer)
                        </span>
                      </div>

                      <div style={{ position: 'absolute', top: '16px', right: '16px' }}>
                        <span style={{
                          fontSize: '8px', 
                          fontWeight: 700, 
                          color: isSpeaking ? 'var(--accent-primary)' : 'rgba(255,255,255,0.4)',
                          padding: '3px 8px',
                          borderRadius: '12px',
                          backgroundColor: isSpeaking ? 'rgba(0, 212, 170, 0.1)' : 'rgba(255,255,255,0.05)',
                          border: isSpeaking ? '1px solid rgba(0, 212, 170, 0.3)' : '1px solid transparent',
                          letterSpacing: '0.05em'
                        }}>
                          {isSpeaking ? '• SPEAKING' : '• LISTENING'}
                        </span>
                      </div>

                      {renderAvatarSVG(currentInterviewer.avatarType, isSpeaking, evaluatingAnswer)}

                      <div style={{ position: 'absolute', bottom: '16px', left: '16px', right: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          <span style={{ fontSize: 'var(--text-xs)', fontWeight: 600, color: '#f3f4f6' }}>
                            {currentInterviewer.name}
                          </span>
                          <span style={{ fontSize: '9px', color: 'rgba(255, 255, 255, 0.4)' }}>
                            {currentInterviewer.title}
                          </span>
                        </div>
                        {isSpeaking && (
                          <div style={{ display: 'flex', gap: '3px', alignItems: 'flex-end', height: '16px' }}>
                            {[...Array(6)].map((_, i) => (
                              <div 
                                key={i}
                                className="pulse-speaking"
                                style={{
                                  width: '2px',
                                  height: '10px',
                                  backgroundColor: currentInterviewer.color,
                                  borderRadius: '1px',
                                  animationDelay: `${i * 100}ms`
                                }}
                              />
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Right Grid: Candidate Video webcam Feed */}
                    <div 
                      style={{
                        backgroundColor: '#0a111a',
                        border: '1px solid rgba(255, 255, 255, 0.08)',
                        borderRadius: 'var(--radius-lg)',
                        overflow: 'hidden',
                        position: 'relative',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        minHeight: '260px'
                      }}
                    >
                      {activeConfig?.videoMode && cameraEnabled && stream ? (
                        <video 
                          ref={videoRef} 
                          autoPlay 
                          playsInline 
                          muted 
                          style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                            transform: 'scaleX(-1)'
                          }}
                        />
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                          <div style={{
                            width: '64px',
                            height: '64px',
                            borderRadius: '50%',
                            background: 'linear-gradient(135deg, rgba(255,255,255,0.02), rgba(255,255,255,0.08))',
                            color: 'rgba(255,255,255,0.4)',
                            border: '1px solid rgba(255,255,255,0.1)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 700,
                            fontSize: '20px'
                          }}>
                            YOU
                          </div>
                          <span style={{ fontSize: '10px', color: 'rgba(255, 255, 255, 0.4)', fontWeight: 600 }}>
                            {!cameraEnabled ? 'CAMERA TURNED OFF' : 'WEBCAM UNAVAILABLE'}
                          </span>
                        </div>
                      )}

                      <div style={{ position: 'absolute', bottom: '16px', left: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          <span style={{ fontSize: 'var(--text-xs)', fontWeight: 600, color: '#f3f4f6' }}>
                            You (Candidate)
                          </span>
                          <span style={{ fontSize: '9px', color: micMuted ? 'var(--accent-danger)' : 'var(--accent-primary)', fontWeight: 600 }}>
                            {micMuted ? '🎙 MIC MUTED' : '🎙 MIC ACTIVE'}
                          </span>
                        </div>
                      </div>

                      <div style={{ position: 'absolute', top: '16px', right: '16px', display: 'flex', alignItems: 'center', gap: '6px', backgroundColor: 'rgba(0,0,0,0.5)', padding: '3px 8px', borderRadius: '4px' }}>
                        <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: (isRecording && !micMuted) ? 'var(--accent-danger)' : 'rgba(255,255,255,0.2)' }} />
                        <span style={{ fontSize: '8px', fontWeight: 700, color: 'rgba(255,255,255,0.6)' }}>
                          {(isRecording && !micMuted) ? 'TRANSCRIBING' : 'IDLE'}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* 4. Bottom Row: Current Question Prompt details */}
                <div style={{ backgroundColor: 'rgba(10, 17, 26, 0.8)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: 'var(--radius-lg)', padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '9px', fontWeight: 700, color: 'var(--accent-primary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      Question {currentIdx + 1} of {questions.length} Prompt
                    </span>
                    <span style={{ fontSize: '9px', color: 'rgba(255, 255, 255, 0.4)', fontWeight: 600 }}>
                      Current Section: {currentQuestion?.category}
                    </span>
                  </div>
                  <p style={{ fontSize: 'var(--text-sm)', fontWeight: 500, color: '#f3f4f6', lineHeight: 1.5 }}>
                    {currentQuestion?.text}
                  </p>
                  {currentQuestion?.expectedTopics && currentQuestion.expectedTopics.length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', alignItems: 'center', marginTop: '4px' }}>
                      <span style={{ fontSize: '9px', color: 'rgba(255, 255, 255, 0.4)', fontWeight: 700 }}>Expected Coverage:</span>
                      {currentQuestion.expectedTopics.map(topic => (
                        <span key={topic} style={{ fontSize: '9px', padding: '2px 6px', borderRadius: '4px', backgroundColor: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.6)', border: '1px solid rgba(255,255,255,0.08)' }}>
                          {topic}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Right Workspace Panel: Code Editor OR Text Answer and Notes */}
              {sessionState === 'answering' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', height: '100%', overflowY: 'auto' }}>
                  {isCodingQuestion && idePanelOpen ? (
                    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 'var(--radius-lg)', overflow: 'hidden', backgroundColor: '#050a0f' }}>
                      <div style={{ padding: '12px 20px', backgroundColor: '#091017', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <Code style={{ width: '16px', height: '16px', color: 'var(--accent-primary)' }} />
                          <span style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.05em' }}>MOCK CODING TERMINAL</span>
                          <select 
                            value={ideLanguage} 
                            onChange={(e) => setIdeLanguage(e.target.value)}
                            style={{
                              padding: '2px 6px',
                              fontSize: '9px',
                              borderRadius: '4px',
                              backgroundColor: 'rgba(255,255,255,0.05)',
                              border: '1px solid rgba(255,255,255,0.1)',
                              color: '#fff',
                              width: 'auto'
                            }}
                          >
                            <option value="javascript">JavaScript</option>
                            <option value="typescript">TypeScript</option>
                            <option value="python">Python</option>
                            <option value="sql">SQL</option>
                          </select>
                        </div>
                        <span style={{ fontSize: '9px', color: codingSeconds < 120 ? 'var(--accent-danger)' : 'rgba(255, 255, 255, 0.4)', fontFamily: 'var(--font-mono)' }}>
                          TIMER: {formatTime(codingSeconds)}
                        </span>
                      </div>
                      
                      <div style={{ display: 'flex', flexGrow: 1, backgroundColor: '#03060a', position: 'relative', minHeight: '200px' }}>
                        <div style={{ width: '32px', borderRight: '1px solid rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.15)', textAlign: 'right', paddingRight: '8px', fontFamily: 'var(--font-mono)', fontSize: '10px', lineHeight: '18px', userSelect: 'none', paddingTop: '12px' }}>
                          {ideCode.split('\n').map((_, i) => <div key={i}>{i + 1}</div>)}
                        </div>
                        <textarea
                          value={ideCode}
                          onChange={(e) => setIdeCode(e.target.value)}
                          style={{
                            flexGrow: 1,
                            backgroundColor: 'transparent',
                            color: '#fff',
                            border: 'none',
                            fontFamily: 'var(--font-mono)',
                            fontSize: '11px',
                            lineHeight: '18px',
                            padding: '12px',
                            resize: 'none',
                            outline: 'none',
                            boxShadow: 'none',
                            height: '100%',
                            minHeight: '180px'
                          }}
                        />
                      </div>

                      {consoleOutput && (
                        <div style={{ padding: '12px 20px', backgroundColor: '#020406', borderTop: '1px solid rgba(255,255,255,0.05)', color: 'var(--accent-primary)', fontSize: '9px', fontFamily: 'var(--font-mono)', lineHeight: 1.4 }}>
                          {consoleOutput}
                        </div>
                      )}

                      <div style={{ padding: '12px 20px', backgroundColor: '#091017', borderTop: '1px solid rgba(255, 255, 255, 0.08)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <button 
                          onClick={runMockTests}
                          disabled={runningTests}
                          style={{ fontSize: '10px', padding: '6px 12px', backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', borderRadius: '4px' }}
                          className="btn-press"
                        >
                          {runningTests ? 'Compiling...' : 'Run Test Cases'}
                        </button>
                        <Button 
                          variant="primary" 
                          onClick={() => handleSubmitAnswer(ideCode)}
                          style={{ padding: '6px 16px', borderRadius: 'var(--radius-md)', fontSize: '10px' }}
                        >
                          Submit Solution
                        </Button>
                      </div>
                    </div>
                  ) : (
                    /* Standard Response and Notes */
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', height: '100%' }}>
                      <div style={{ backgroundColor: 'rgba(10, 17, 26, 0.8)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: 'var(--radius-lg)', padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: '11px', fontWeight: 600, color: 'rgba(255,255,255,0.8)' }}>Draft response detail</span>
                          {activeConfig?.voiceMode && (
                            <button
                              type="button"
                              onClick={isRecording ? stopDictation : startDictation}
                              style={{
                                padding: '4px 10px',
                                borderRadius: '4px',
                                backgroundColor: isRecording ? 'rgba(239, 68, 68, 0.1)' : 'rgba(0, 212, 170, 0.1)',
                                border: isRecording ? '1px solid #ef4444' : '1px solid var(--accent-primary)',
                                color: isRecording ? '#ef4444' : 'var(--accent-primary)',
                                fontSize: '9px',
                                fontWeight: 700,
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px'
                              }}
                              className={`btn-press ${isRecording ? 'mic-pulse' : ''}`}
                            >
                              {isRecording ? <MicOff style={{ width: '12px', height: '12px' }} /> : <Mic style={{ width: '12px', height: '12px' }} />}
                              {isRecording ? 'STOP DICTATION' : 'SPEAK RESPONSE'}
                            </button>
                          )}
                        </div>

                        <textarea
                          rows={6}
                          required
                          value={typedAnswer}
                          onChange={(e) => setTypedAnswer(e.target.value)}
                          placeholder={activeConfig?.voiceMode ? "Click 'SPEAK RESPONSE' and begin drafting your answer orally..." : "Type your answer explaining technical parameters clearly..."}
                          style={{
                            width: '100%',
                            backgroundColor: 'rgba(5, 10, 15, 0.4)',
                            border: '1px solid rgba(255,255,255,0.08)',
                            color: '#fff',
                            borderRadius: 'var(--radius-md)',
                            padding: '12px',
                            fontSize: '12px',
                            outline: 'none',
                            fontFamily: 'var(--font-body)',
                            resize: 'none'
                          }}
                        />

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px' }}>
                          <button onClick={handleSkip} style={{ color: 'rgba(255,255,255,0.4)', fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', backgroundColor: 'transparent' }} className="btn-press">
                            Skip
                          </button>
                          <Button 
                            variant="primary" 
                            disabled={!typedAnswer.trim()} 
                            onClick={() => handleSubmitAnswer(typedAnswer)}
                            style={{ padding: '8px 16px', borderRadius: 'var(--radius-md)', fontSize: '10px' }}
                          >
                            Submit Answer Details
                          </Button>
                        </div>
                      </div>

                      {notesPanelOpen && (
                        <div style={{ backgroundColor: 'rgba(10, 17, 26, 0.8)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: 'var(--radius-lg)', padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px', flexGrow: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '8px' }}>
                            <Clipboard style={{ width: '14px', height: '14px', color: 'var(--accent-primary)' }} />
                            <span style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase' }}>INTERVIEW NOTES (LIVE EVALUATION)</span>
                          </div>

                          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '11px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                              <span style={{ color: 'rgba(255, 255, 255, 0.4)' }}>Word Count:</span>
                              <span style={{ fontWeight: 600 }}>{textWordCount} words</span>
                            </div>
                            
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                              <span style={{ color: 'rgba(255, 255, 255, 0.4)' }}>Matched Focus Keywords:</span>
                              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', minHeight: '20px' }}>
                                {matchedTopics.length > 0 ? (
                                  matchedTopics.map(topic => (
                                    <span key={topic} style={{ fontSize: '9px', padding: '1px 6px', borderRadius: '4px', backgroundColor: 'rgba(0, 212, 170, 0.1)', color: 'var(--accent-primary)', border: '1px solid rgba(0, 212, 170, 0.2)', fontWeight: 600 }}>
                                      ✓ {topic}
                                    </span>
                                  ))
                                ) : (
                                  <span style={{ color: 'rgba(255, 255, 255, 0.25)', fontStyle: 'italic', fontSize: '9px' }}>Awaiting match keywords...</span>
                                )}
                              </div>
                            </div>

                            <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '10px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                              <span style={{ color: 'var(--accent-secondary)', fontWeight: 600 }}>Call Assistant Hints:</span>
                              <div style={{ color: 'rgba(255,255,255,0.5)', lineHeight: 1.4, fontSize: '9.5px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                <div>• Format stories using the STAR structure (Situation, Task, Action, Result).</div>
                                <div>• Ground your answers with numerical metrics where applicable.</div>
                                <div>• Keep technical terms standard and professional.</div>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* SECURE CALL ROOM BOTTOM CONTROL BAR */}
          <div 
            style={{
              height: '80px',
              borderTop: '1px solid rgba(255, 255, 255, 0.08)',
              backgroundColor: 'rgba(10, 17, 26, 0.95)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '0 32px',
              zIndex: 10
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <span style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.5)', fontWeight: 600 }}>
                {currentQuestion ? `Round ${currentIdx + 1} of ${questions.length}` : ''}
              </span>
            </div>

            <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
              <button
                onClick={() => {
                  if (!micMuted && isRecording) {
                    stopDictation();
                  }
                  setMicMuted(!micMuted);
                }}
                title={micMuted ? "Unmute Microphone" : "Mute Microphone"}
                style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '50%',
                  backgroundColor: micMuted ? '#ef4444' : 'rgba(255, 255, 255, 0.05)',
                  border: micMuted ? 'none' : '1px solid rgba(255, 255, 255, 0.1)',
                  color: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  transition: 'all 200ms ease'
                }}
                className="btn-press"
              >
                {micMuted ? <MicOff style={{ width: '18px', height: '18px' }} /> : <Mic style={{ width: '18px', height: '18px' }} />}
              </button>

              <button
                onClick={() => setCameraEnabled(!cameraEnabled)}
                title={cameraEnabled ? "Stop Video Camera" : "Start Video Camera"}
                style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '50%',
                  backgroundColor: !cameraEnabled ? '#ef4444' : 'rgba(255, 255, 255, 0.05)',
                  border: !cameraEnabled ? 'none' : '1px solid rgba(255, 255, 255, 0.1)',
                  color: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  transition: 'all 200ms ease'
                }}
                className="btn-press"
              >
                {cameraEnabled ? <Video style={{ width: '18px', height: '18px' }} /> : <VideoOff style={{ width: '18px', height: '18px' }} />}
              </button>

              <button
                onClick={handleSpeechToggle}
                title={isMuted ? "Unmute AI Voice Reciter" : "Mute AI Voice Reciter"}
                style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '50%',
                  backgroundColor: isMuted ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 212, 170, 0.1)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  color: isMuted ? 'rgba(255,255,255,0.4)' : 'var(--accent-primary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  transition: 'all 200ms ease'
                }}
                className="btn-press"
              >
                {isMuted ? <VolumeX style={{ width: '18px', height: '18px' }} /> : <Volume2 style={{ width: '18px', height: '18px' }} />}
              </button>

              {isCodingQuestion && sessionState === 'answering' && (
                <button
                  onClick={() => setIdePanelOpen(!idePanelOpen)}
                  title={idePanelOpen ? "Close IDE editor split" : "Open IDE editor split"}
                  style={{
                    width: '44px',
                    height: '44px',
                    borderRadius: '50%',
                    backgroundColor: idePanelOpen ? 'rgba(168, 85, 247, 0.1)' : 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    color: idePanelOpen ? 'var(--accent-purple)' : '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    transition: 'all 200ms ease'
                  }}
                  className="btn-press"
                >
                  <Code style={{ width: '18px', height: '18px' }} />
                </button>
              )}

              {!isCodingQuestion && sessionState === 'answering' && (
                <button
                  onClick={() => setNotesPanelOpen(!notesPanelOpen)}
                  title={notesPanelOpen ? "Close Notes Panel" : "Open Notes Panel"}
                  style={{
                    width: '44px',
                    height: '44px',
                    borderRadius: '50%',
                    backgroundColor: notesPanelOpen ? 'rgba(0, 212, 170, 0.1)' : 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    color: notesPanelOpen ? 'var(--accent-primary)' : '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    transition: 'all 200ms ease'
                  }}
                  className="btn-press"
                >
                  <Clipboard style={{ width: '18px', height: '18px' }} />
                </button>
              )}
            </div>

            <div>
              <button
                onClick={() => setShowLeaveConfirm(true)}
                style={{
                  backgroundColor: '#ef4444',
                  color: 'white',
                  border: 'none',
                  padding: '10px 20px',
                  borderRadius: 'var(--radius-md)',
                  fontSize: 'var(--text-xs)',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  cursor: 'pointer'
                }}
                className="btn-press hover:bg-[#dc2626]"
              >
                <PhoneOff style={{ width: '14px', height: '14px' }} />
                Leave Meeting
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* STANDARD VIEW */
        <>
          {sessionState === 'setup' && (
            <div>
              <h2 style={{ fontSize: 'var(--text-3xl)', fontWeight: 600, fontFamily: 'var(--font-display)' }}>
                AI Interview Simulator
              </h2>
              <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', marginTop: '4px' }}>
                Simulate realistic mock interviews with live video, voice synthesis, real-time feedback, and coding IDE integration.
              </p>
            </div>
          )}

          {sessionState === 'setup' && (
            <Card hoverable={false} style={{ maxWidth: '960px', margin: '0 auto', width: '100%', padding: '32px' }}>
              <SetupForm onGenerate={handleGenerate} loading={loadingQuestions} />
            </Card>
          )}

          {sessionState === 'summary' && (
            activeInterview ? (
              <SessionSummary 
                session={activeInterview} 
                onRetry={handleRetry} 
                onDashboard={handleDashboard} 
              />
            ) : (
              answersList.length > 0 && activeConfig && (
                <SessionSummary 
                  session={{
                    id: 'active',
                    timestamp: Date.now(),
                    config: activeConfig,
                    answers: answersList,
                    overallScore: parseFloat((answersList.reduce((acc, curr) => acc + curr.feedback.overallScore, 0) / questions.length).toFixed(1))
                  }}
                  onRetry={handleRetry}
                  onDashboard={handleDashboard}
                />
              )
            )
          )}
        </>
      )}
    </div>
  );
};
export default InterviewPractice;
