import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { SetupForm } from '../components/interview/SetupForm';
import { FeedbackPanel } from '../components/interview/FeedbackPanel';
import { SessionSummary } from '../components/interview/SessionSummary';
import { Card } from '../components/ui/Card';
import { Skeleton } from '../components/ui/Skeleton';
import { Button } from '../components/ui/Button';
import { ProgressiveLoader } from '../components/ui/ProgressiveLoader';
import { useGemini } from '../hooks/useGemini';
import { gemini } from '../services/gemini';
import { useAppStore, generateId } from '../store/appStore';
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
  VideoOff,
  Lock,
  RefreshCw
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import '../styles/globals.css';
import '../styles/animations.css';

type SessionState = 'setup' | 'loading_questions' | 'answering' | 'viewing_feedback' | 'summary';

export const InterviewPractice: React.FC = () => {
  const navigate = useNavigate();
  const { addInterviewSession, activeInterview, setActiveInterview, addToast, activeResume } = useAppStore();
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
  const streamRef = useRef<MediaStream | null>(null);

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

  // Typing state for Recruiter gaze shifting
  const [isTyping, setIsTyping] = useState(false);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const triggerTypingIndicator = () => {
    setIsTyping(true);
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
    }, 1500);
  };

  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    };
  }, []);

  // Recruiter speech animation mouth shape index cycle
  const [mouthShapeIdx, setMouthShapeIdx] = useState(0);

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isSpeaking) {
      interval = setInterval(() => {
        setMouthShapeIdx(prev => (prev + 1) % 4);
      }, 120);
    } else {
      setMouthShapeIdx(0);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isSpeaking]);


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
          streamRef.current = s;
          if (videoRef.current) {
            videoRef.current.srcObject = s;
          }
        })
        .catch(err => {
          console.warn("Camera access blocked or unavailable:", err);
          addToast('error', 'Camera access blocked or unavailable. Please check your browser webcam permissions.');
        });
    } else {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
      }
      setStream(null);
      streamRef.current = null;
    }
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
      }
    };
  }, [sessionState, activeConfig?.videoMode]);

  // Synchronize stream and tracks state
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.srcObject = stream;
    }
    if (stream) {
      stream.getVideoTracks().forEach(track => {
        track.enabled = cameraEnabled;
      });
    }
  }, [stream, cameraEnabled]);

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
    window.speechSynthesis.resume();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => {
      setIsSpeaking(false);
      // Auto-start dictation in video call or hands-free voice mode for non-coding questions
      if ((activeConfig?.videoMode || activeConfig?.voiceMode) && !isCodingQuestion) {
        setTimeout(() => {
          startDictation();
        }, 300);
      }
    };
    utterance.onerror = () => setIsSpeaking(false);

    const voices = window.speechSynthesis.getVoices();
    let voice = voices.find(v => v.lang.startsWith('en-') && v.name.toLowerCase().includes('google'));
    if (!voice) voice = voices.find(v => v.lang.startsWith('en-') && v.name.toLowerCase().includes('natural'));
    if (!voice) voice = voices.find(v => v.lang.startsWith('en-'));
    if (!voice && voices.length > 0) voice = voices[0];
    
    if (voice) {
      utterance.voice = voice;
    }
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
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
        const spokenLower = currentResult.toLowerCase().trim();
        if (spokenLower === 'repeat' || spokenLower.includes('repeat the question') || spokenLower.includes('please repeat')) {
          stopDictation();
          setTypedAnswer('');
          if (questions.length > 0) {
            speakQuestion(questions[currentIdx].text);
          }
          return;
        }
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

  const handleEditorScroll = (e: React.UIEvent<HTMLTextAreaElement>) => {
    const gutter = document.getElementById('ide-gutter');
    if (gutter) {
      gutter.scrollTop = e.currentTarget.scrollTop;
    }
  };

  const formatTime = (secs: number) => {
    const mm = String(Math.floor(secs / 60)).padStart(2, '0');
    const ss = String(secs % 60).padStart(2, '0');
    return `${mm}:${ss}`;
  };

  const handleGenerate = async (config: InterviewConfig) => {
    let candidateBackground = '';
    if (activeResume) {
      candidateBackground = `Candidate's Resume/Background Details:\n`;
      candidateBackground += `- Job Role: ${activeResume.jobRole}\n`;
      candidateBackground += `- Experience Level: ${activeResume.experienceLevel}\n`;
      candidateBackground += `- Overall ATS compatibility Score: ${activeResume.overallScore}/100\n`;
      if (activeResume.matchedKeywords && activeResume.matchedKeywords.length > 0) {
        candidateBackground += `- Target Profile Keywords Matched: ${activeResume.matchedKeywords.slice(0, 10).join(', ')}\n`;
      }
      if (activeResume.missingKeywords && activeResume.missingKeywords.length > 0) {
        candidateBackground += `- Core skills missing/weak spots to probe: ${activeResume.missingKeywords.slice(0, 10).join(', ')}\n`;
      }
    }

    const finalConfig = { ...config, candidateBackground };
    setActiveConfig(finalConfig);
    setSessionState('loading_questions');
    
    const questionsRes = await getQuestions(finalConfig);
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
    setConsoleOutput('Compiling code and executing test environments...\n');
    
    setTimeout(() => {
      setRunningTests(false);
      const logs: string[] = [];
      const customConsole = {
        log: (...args: any[]) => {
          logs.push(args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' '));
        },
        error: (...args: any[]) => {
          logs.push('[Error] ' + args.join(' '));
        },
        warn: (...args: any[]) => {
          logs.push('[Warning] ' + args.join(' '));
        }
      };

      try {
        // Strip TS interfaces and types
        let cleanCode = ideCode
          .replace(/interface\s+\w+\s*\{[\s\S]*?\}/g, '')
          .replace(/type\s+\w+\s*=\s*[\s\S]*?;/g, '')
          // Strip generic type parameters on function signatures
          .replace(/function\s+(\w+)<[^>]+>/g, 'function $1')
          .replace(/<[^>]+>\(/g, '(')
          // Strip return type annotations e.g. ): number[] or ): void or ): Promise<any>
          .replace(/\):\s*(?:[a-zA-Z_][a-zA-Z0-9_<>[\]]*)/g, ')')
          // Strip variable type declarations: const x: number = 5;
          .replace(/(const|let|var)\s+(\w+)\s*:\s*(?:[a-zA-Z_][a-zA-Z0-9_<>[\]]*)/g, '$1 $2')
          // Strip function parameters type annotations: (nums: number[], target: number)
          .replace(/(\w+)\s*:\s*(?:[a-zA-Z_][a-zA-Z0-9_<>[\]]*)/g, '$1')
          // Strip type casting "as Type"
          .replace(/\s+as\s+(?:[a-zA-Z_][a-zA-Z0-9_<>[\]]*)/g, '')
          // Strip generic type parameters inside expressions: e.g. Array<number>
          .replace(/Array<[^>]+>/g, 'Array')
          .replace(/Record<[^>]+>/g, 'Object')
          .replace(/Map<[^>]+>/g, 'Map')
          .replace(/Set<[^>]+>/g, 'Set');

        const runFn = new Function('console', `
          try {
            ${cleanCode}
            
            // Auto-detect and run functions defined by the user
            if (typeof solve === 'function') {
              console.log('\\n[Automatic Check: solve()]');
              const res = solve();
              if (res !== undefined) console.log('Result:', res);
            } else if (typeof twoSum === 'function') {
              console.log('\\n[Automatic Check: twoSum([2, 7, 11, 15], 9)]');
              console.log('Result:', twoSum([2, 7, 11, 15], 9));
            } else if (typeof reverseString === 'function') {
              console.log('\\n[Automatic Check: reverseString("hello")]');
              console.log('Result:', reverseString("hello"));
            } else if (typeof isPalindrome === 'function') {
              console.log('\\n[Automatic Check: isPalindrome("racecar")]');
              console.log('Result:', isPalindrome("racecar"));
            }
          } catch (e) {
            console.error(e.message);
          }
        `);

        const t0 = performance.now();
        runFn(customConsole);
        const t1 = performance.now();
        const execTime = (t1 - t0).toFixed(2);
        
        const finalLogs = logs.join('\n') || 'Execution complete: Code ran successfully but yielded no stdout logs.\nUse console.log() to output results.';
        setConsoleOutput(`${finalLogs}\n\n[System Info: Completed execution in ${execTime}ms]`);
      } catch (err: any) {
        setConsoleOutput(`Syntax/Compile Error: ${err.message}`);
      }
    }, 1000);
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

  const handleVoiceSubmit = () => {
    stopDictation();
    handleSubmitAnswer(typedAnswer);
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
        id: generateId(),
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
  const isCodingQuestion = currentQuestion && (
    currentQuestion.category === 'coding' || 
    currentQuestion.category === 'dsa' || 
    currentQuestion.text.toLowerCase().includes('write a') || 
    currentQuestion.text.toLowerCase().includes('implement') || 
    currentQuestion.text.toLowerCase().includes('write code') ||
    currentQuestion.text.toLowerCase().includes('coding challenge')
  );
    const textWordCount = typedAnswer ? typedAnswer.trim().split(/\s+/).length : 0;
  const matchedTopics = currentQuestion ? currentQuestion.expectedTopics.filter(topic => 
    typedAnswer.toLowerCase().includes(topic.toLowerCase())
  ) : [];

  const getInterviewer = (category: string) => {
    const cat = category.toLowerCase();
    if (cat.includes('technical') || cat.includes('coding') || cat.includes('dsa')) {
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
        desc: 'HR Director testing communication, cultural alignment, and STAR method behavioral stories.'
      };
    }
  };

  const renderAvatarSVG = (type: string, isSpk: boolean, isThk: boolean) => {
    const accent = type === 'sophia' ? '#00d4aa' : type === 'marcus' ? '#f59e0b' : '#a855f7';
    
    // Dynamic head tilt class based on typing or active listening
    const headClass = isTyping 
      ? 'head-g head-typing' 
      : (isRecording && !micMuted)
        ? 'head-g head-listening-nod'
        : 'head-g';
        
    // Dynamic eye Y coordinate (shift down slightly when typing to simulate reading the screen)
    const eyeY = isTyping ? 45.2 : 44.0;
    const marcusEyeY = isTyping ? 44.2 : 43.0;

    return (
      <div style={{ position: 'relative', width: '220px', height: '220px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto' }}>
        {/* Glow border ring */}
        <div 
          className="avatar-breath"
          style={{
            position: 'absolute',
            inset: '-10px',
            borderRadius: '50%',
            border: `2px solid ${accent}`,
            opacity: isSpk ? 0.9 : 0.15,
            boxShadow: isSpk ? `0 0 25px ${accent}` : 'none',
            transition: 'all 300ms ease'
          }}
        />

        <svg width="100%" height="100%" viewBox="0 0 100 100" style={{ borderRadius: '50%', border: '2px solid rgba(255,255,255,0.08)', overflow: 'hidden', backgroundColor: '#0f172a', boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }}>
          <defs>
            {/* Background Gradients */}
            <linearGradient id="office-bg-sophia" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#0a192f" />
              <stop offset="100%" stopColor="#020c1b" />
            </linearGradient>
            <linearGradient id="office-bg-marcus" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#2d1b06" />
              <stop offset="100%" stopColor="#0d0801" />
            </linearGradient>
            <linearGradient id="office-bg-emily" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#210a30" />
              <stop offset="100%" stopColor="#0a0210" />
            </linearGradient>
            
            {/* Clothing Gradients */}
            <linearGradient id="blazer-sophia" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#115e59" />
              <stop offset="100%" stopColor="#042f2e" />
            </linearGradient>
            <linearGradient id="blazer-marcus" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#b45309" />
              <stop offset="100%" stopColor="#78350f" />
            </linearGradient>
            <linearGradient id="blazer-emily" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#7e22ce" />
              <stop offset="100%" stopColor="#4c1d95" />
            </linearGradient>
            
            {/* Skin Gradients with natural shading */}
            <linearGradient id="skin-main" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#ffeedd" />
              <stop offset="100%" stopColor="#fdcba1" />
            </linearGradient>
            
            {/* Hair Gradients */}
            <linearGradient id="hair-dark" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#1f2937" />
              <stop offset="100%" stopColor="#111827" />
            </linearGradient>
            <linearGradient id="hair-brown" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#7c2d12" />
              <stop offset="100%" stopColor="#431407" />
            </linearGradient>
          </defs>

          {/* Background Scene */}
          {type === 'sophia' && (
            <>
              <rect x="0" y="0" width="100" height="100" fill="url(#office-bg-sophia)" />
              <rect x="15" y="10" width="30" height="40" fill="rgba(255,255,255,0.015)" rx="2" />
              <rect x="50" y="10" width="35" height="40" fill="rgba(255,255,255,0.015)" rx="2" />
              <line x1="15" y1="30" x2="45" y2="30" stroke="rgba(255,255,255,0.02)" strokeWidth="0.5" />
              <line x1="50" y1="30" x2="85" y2="30" stroke="rgba(255,255,255,0.02)" strokeWidth="0.5" />
              <rect x="8" y="50" width="8" height="30" fill="rgba(255,255,255,0.01)" />
              <circle cx="12" cy="55" r="0.8" fill="#00d4aa" opacity="0.8" />
              <circle cx="12" cy="62" r="0.8" fill="#00d4aa" opacity="0.2" />
              <circle cx="12" cy="69" r="0.8" fill="#3b82f6" opacity="0.7" />
              <circle cx="12" cy="76" r="0.8" fill="#ef4444" opacity="0.6" />
            </>
          )}

          {type === 'marcus' && (
            <>
              <rect x="0" y="0" width="100" height="100" fill="url(#office-bg-marcus)" />
              <circle cx="15" cy="30" r="16" fill="rgba(245,158,11,0.04)" filter="blur(4px)" />
              <circle cx="15" cy="30" r="4" fill="rgba(255,255,255,0.1)" />
              <line x1="55" y1="15" x2="95" y2="15" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
              <line x1="55" y1="40" x2="95" y2="40" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
              <rect x="62" y="5" width="4" height="10" fill="#78350f" opacity="0.4" />
              <rect x="67" y="3" width="5" height="12" fill="#1e3a8a" opacity="0.3" />
              <rect x="80" y="25" width="4" height="15" fill="#065f46" opacity="0.3" />
              <rect x="85" y="28" width="5" height="12" fill="#78350f" opacity="0.4" />
            </>
          )}

          {type === 'emily' && (
            <>
              <rect x="0" y="0" width="100" height="100" fill="url(#office-bg-emily)" />
              <path d="M 5,95 Q 15,80 12,65 Q 20,82 5,95 Z" fill="#064e3b" opacity="0.2" />
              <path d="M 85,95 Q 75,75 80,60 Q 90,78 85,95 Z" fill="#064e3b" opacity="0.15" />
              <path d="M 92,95 Q 86,82 95,70 Q 98,85 92,95 Z" fill="#065f46" opacity="0.1" />
            </>
          )}

          {/* Shoulders and Clothes Group (Breaths naturally) */}
          <g className="body-breath">
            {type === 'sophia' && (
              <g>
                <path d="M 12,95 C 12,74 32,68 50,68 C 68,68 88,74 88,95 Z" fill="url(#blazer-sophia)" />
                <path d="M 43,68 L 50,84 L 57,68 Z" fill="#0f766e" />
                <path d="M 46,68 L 50,78 L 54,68 Z" fill="#2dd4bf" />
                <rect x="45.5" y="56" width="9" height="14" fill="url(#skin-main)" />
                <path d="M 45.5,64 C 48,66 52,66 54.5,64 Z" fill="#fdcba1" opacity="0.6" />
              </g>
            )}

            {type === 'marcus' && (
              <g>
                <path d="M 12,95 C 12,74 32,68 50,68 C 68,68 88,74 88,95 Z" fill="url(#blazer-marcus)" />
                <path d="M 41,68 L 50,86 L 59,68 Z" fill="#ffffff" />
                <path d="M 46,68 L 50,76 L 54,68 Z" fill="#1e2937" />
                <rect x="45.5" y="55" width="9" height="15" fill="url(#skin-main)" />
                <path d="M 45.5,63 C 48,65 52,65 54.5,63 Z" fill="#fdcba1" opacity="0.6" />
              </g>
            )}

            {type === 'emily' && (
              <g>
                <path d="M 12,95 C 12,74 32,68 50,68 C 68,68 88,74 88,95 Z" fill="url(#blazer-emily)" />
                <path d="M 42,68 Q 50,82 58,68 Z" fill="#f9fafb" />
                <rect x="45.5" y="56" width="9" height="14" fill="url(#skin-main)" />
                <path d="M 45.5,64 C 48,66 52,66 54.5,64 Z" fill="#fdcba1" opacity="0.6" />
              </g>
            )}
          </g>

          {/* Head Group (Tilted or Nodding dynamically) */}
          <g className={headClass}>
            {type === 'sophia' && (
              <g>
                <circle cx="50" cy="27" r="8" fill="url(#hair-dark)" />
                <path d="M 35,42 C 35,32 65,32 65,42 C 65,52 61,59 50,59 C 39,59 35,52 35,42 Z" fill="url(#skin-main)" />
                <path d="M 34,40 C 34,26 66,26 66,40 C 66,35 62,31 50,32 C 38,31 34,35 34,40 Z" fill="url(#hair-dark)" />
                <circle cx="34" cy="44" r="2.5" fill="url(#skin-main)" />
                <circle cx="66" cy="44" r="2.5" fill="url(#skin-main)" />
                <path d="M 49,45 L 50,49 L 51,45" fill="none" stroke="#e0a97c" strokeWidth="0.8" strokeLinecap="round" />
                <circle cx="43.5" cy={eyeY} r="2.0" fill="#1e293b" className="blink-eye" />
                <circle cx="56.5" cy={eyeY} r="2.0" fill="#1e293b" className="blink-eye" />
                <path d="M 40,39.5 Q 43.5,38.5 46,40" fill="none" stroke="#1f2937" strokeWidth="1" strokeLinecap="round" />
                <path d="M 54,40 Q 56.5,38.5 60,39.5" fill="none" stroke="#1f2937" strokeWidth="1" strokeLinecap="round" />
                <circle cx="43.5" cy={eyeY} r="5.2" fill="none" stroke="#475569" strokeWidth="1" />
                <circle cx="56.5" cy={eyeY} r="5.2" fill="none" stroke="#475569" strokeWidth="1" />
                <line x1="48.7" y1={eyeY} x2="51.3" y2={eyeY} stroke="#475569" strokeWidth="1" />
                {isSpk ? (
                  <>
                    {mouthShapeIdx === 0 && <path d="M 46,53 Q 50,55 54,53" fill="none" stroke="#e11d48" strokeWidth="1" strokeLinecap="round" />}
                    {mouthShapeIdx === 1 && <path d="M 44,52 Q 50,58 56,52" fill="#881337" stroke="#e11d48" strokeWidth="1" strokeLinecap="round" />}
                    {mouthShapeIdx === 2 && <path d="M 45,52.5 Q 50,55 55,52.5" fill="#881337" stroke="#e11d48" strokeWidth="1" strokeLinecap="round" />}
                    {mouthShapeIdx === 3 && <path d="M 46,53 Q 50,54 54,53" fill="none" stroke="#e11d48" strokeWidth="1.2" strokeLinecap="round" />}
                  </>
                ) : (
                  <path d="M 46,53 Q 50,55 54,53" fill="none" stroke="#e11d48" strokeWidth="1" strokeLinecap="round" />
                )}
              </g>
            )}

            {type === 'marcus' && (
              <g>
                <path d="M 35,41 C 35,31 65,31 65,41 C 65,51 61,58 50,58 C 39,58 35,51 35,41 Z" fill="url(#skin-main)" />
                <path d="M 35,43 C 37,56 63,56 65,43 C 65,50 61,59 50,59 C 39,59 35,50 35,43 Z" fill="url(#hair-brown)" />
                <path d="M 43,51 Q 50,47 57,51 Q 50,52 43,51 Z" fill="#431407" />
                <path d="M 33,35 Q 50,26 67,35 Q 67,29 50,26 Q 33,29 33,35 Z" fill="url(#hair-brown)" />
                <path d="M 33,35 Q 31,43 33,43 L 36.5,37 Q 63.5,37 63.5,43 L 67,35 Z" fill="url(#hair-brown)" />
                <circle cx="34" cy="43" r="2.5" fill="url(#skin-main)" />
                <circle cx="66" cy="43" r="2.5" fill="url(#skin-main)" />
                <path d="M 49,43.5 L 50,47.5 L 51,43.5" fill="none" stroke="#e0a97c" strokeWidth="0.8" strokeLinecap="round" />
                <circle cx="43.5" cy={marcusEyeY} r="2.1" fill="#1e293b" className="blink-eye" />
                <circle cx="56.5" cy={marcusEyeY} r="2.1" fill="#1e293b" className="blink-eye" />
                <path d="M 39,38.5 Q 43,37.5 46.5,39" fill="none" stroke="#431407" strokeWidth="1.2" strokeLinecap="round" />
                <path d="M 53.5,39 Q 57,37.5 61,38.5" fill="none" stroke="#431407" strokeWidth="1.2" strokeLinecap="round" />
                {isSpk ? (
                  <>
                    {mouthShapeIdx === 0 && <path d="M 47,53 Q 50,54 53,53" fill="none" stroke="#431407" strokeWidth="1" strokeLinecap="round" />}
                    {mouthShapeIdx === 1 && <path d="M 46,52 Q 50,56 54,52" fill="#431407" stroke="#fdba74" strokeWidth="1" strokeLinecap="round" />}
                    {mouthShapeIdx === 2 && <path d="M 46.5,52.5 Q 50,54.5 53.5,52.5" fill="#431407" stroke="#fdba74" strokeWidth="1" strokeLinecap="round" />}
                    {mouthShapeIdx === 3 && <path d="M 47,53 Q 50,53.5 53,53" fill="none" stroke="#431407" strokeWidth="1.2" strokeLinecap="round" />}
                  </>
                ) : (
                  <path d="M 47,53 Q 50,54 53,53" fill="none" stroke="#431407" strokeWidth="1.2" strokeLinecap="round" />
                )}
              </g>
            )}

            {type === 'emily' && (
              <g>
                <path d="M 33,40 C 28,58 29,76 31,85 L 35.5,81.5 C 34,70 34.5,50 35.5,41 Z M 67,41 C 66,50 66,70 64.5,81.5 L 69,85 C 71,76 72,58 67,41 Z" fill="url(#hair-brown)" />
                <path d="M 35,42 C 35,32 65,32 65,42 C 65,52 61,59 50,59 C 39,59 35,52 35,42 Z" fill="url(#skin-main)" />
                <path d="M 32,38 C 32,25 68,25 68,38 C 68,32 63,28 50,29 C 37,29 32,32 32,38 Z" fill="url(#hair-brown)" />
                <circle cx="34" cy="44" r="2.2" fill="url(#skin-main)" />
                <circle cx="66" cy="44" r="2.2" fill="url(#skin-main)" />
                <path d="M 49,45 L 50,48.5 L 51,45" fill="none" stroke="#e0a97c" strokeWidth="0.8" strokeLinecap="round" />
                <circle cx="43.5" cy={eyeY} r="2.1" fill="#1e293b" className="blink-eye" />
                <circle cx="56.5" cy={eyeY} r="2.1" fill="#1e293b" className="blink-eye" />
                <path d="M 39.5,40 Q 43,39 46,40.5" fill="none" stroke="#431407" strokeWidth="1" strokeLinecap="round" />
                <path d="M 54,40.5 Q 57,39 60.5,40" fill="none" stroke="#431407" strokeWidth="1" strokeLinecap="round" />
                {isSpk ? (
                  <>
                    {mouthShapeIdx === 0 && <path d="M 46,53 Q 50,56 54,53" fill="none" stroke="#db2777" strokeWidth="1" strokeLinecap="round" />}
                    {mouthShapeIdx === 1 && <path d="M 44,52 Q 50,58 56,52" fill="#9d174d" stroke="#db2777" strokeWidth="1" strokeLinecap="round" />}
                    {mouthShapeIdx === 2 && <path d="M 45,52.5 Q 50,55.5 55,52.5" fill="#9d174d" stroke="#db2777" strokeWidth="1" strokeLinecap="round" />}
                    {mouthShapeIdx === 3 && <path d="M 46,53 Q 50,54.5 54,53" fill="none" stroke="#db2777" strokeWidth="1.2" strokeLinecap="round" />}
                  </>
                ) : (
                  <path d="M 46,53 Q 50,56 54,53" fill="none" stroke="#db2777" strokeWidth="1" strokeLinecap="round" />
                )}
              </g>
            )}
          </g>

          {/* Evaluating Thinking Overlay */}
          {isThk && <rect x="0" y="0" width="100" height="100" fill="rgba(168, 85, 247, 0.08)" />}
        </svg>
      </div>
    );
  };

  const cssStyle = `
    .secure-call-room {
      position: fixed;
      inset: 0;
      z-index: 99999;
      background-color: #030712;
      background-image: 
        linear-gradient(rgba(255, 255, 255, 0.015) 1px, transparent 1px),
        linear-gradient(90deg, rgba(255, 255, 255, 0.015) 1px, transparent 1px);
      background-size: 32px 32px;
      color: #f3f4f6;
      display: flex;
      flex-direction: column;
      font-family: var(--font-body);
      overflow: hidden;
      animation: fadeIn 200ms ease;
    }
    .neuform-card {
      background: rgba(10, 15, 25, 0.7) !important;
      backdrop-filter: blur(12px) !important;
      border: 1px solid rgba(255, 255, 255, 0.05) !important;
      border-radius: var(--radius-lg) !important;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
      position: relative !important;
      overflow: hidden !important;
    }
    .neuform-card::after {
      content: '';
      position: absolute;
      inset: 0;
      pointer-events: none;
      border: 1px solid transparent;
      border-radius: inherit;
      background: linear-gradient(135deg, rgba(0, 212, 170, 0.2), transparent, rgba(139, 92, 246, 0.2)) border-box;
      mask: linear-gradient(#fff 0 0) padding-box, linear-gradient(#fff 0 0);
      mask-composite: exclude;
      opacity: 0.4;
      transition: opacity 0.3s ease;
    }
    .neuform-card:hover::after {
      opacity: 1;
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
      from { transform: scale(0.97); opacity: 0.85; }
      to { transform: scale(1.03); opacity: 1; }
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
    .head-g {
      transition: transform 0.4s ease-in-out;
      transform-origin: 50px 60px;
    }
    .head-typing {
      transform: translateY(2.0px) rotate(0.8deg);
    }
    .head-listening-nod {
      animation: headNod 2.4s ease-in-out infinite;
      transform-origin: 50px 60px;
    }
    @keyframes headNod {
      0% { transform: translateY(0) rotate(0deg); }
      35% { transform: translateY(1.5px) rotate(0.4deg); }
      70% { transform: translateY(0) rotate(-0.4deg); }
      100% { transform: translateY(0) rotate(0deg); }
    }
    .body-breath {
      animation: breathingBody 3s ease-in-out infinite alternate;
      transform-origin: 50px 90px;
    }
    @keyframes breathingBody {
      0% { transform: translateY(0) scale(1); }
      100% { transform: translateY(-0.6px) scale(1.003); }
    }
    .blink-eye {
      animation: blinkEyes 3.5s ease-in-out infinite;
      transform-origin: center;
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

  if (sessionState === 'answering' || sessionState === 'viewing_feedback' || sessionState === 'loading_questions' || evaluatingAnswer) {
    return createPortal(
      <div 
        className="secure-call-room"
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 99999,
          color: '#f3f4f6',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}
      >
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
            <span style={{ fontSize: '10px', color: 'rgba(255, 255, 255, 0.4)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Lock style={{ width: '10px', height: '10px' }} />
              Proctored Environment
            </span>
            <span style={{ color: 'rgba(255, 255, 255, 0.2)' }}>|</span>
            <span style={{ fontSize: '11px', color: 'var(--accent-primary)', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>
              CALL TIME: {formatTime(seconds)}
            </span>
          </div>
        </div>

        {/* SECURE CALL ROOM SUB-COMPONENTS */}
        {sessionState === 'loading_questions' ? (
          <div style={{ flexGrow: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '24px', padding: '40px', textAlign: 'center', width: '100%' }}>
            <ProgressiveLoader
              messages={[
                "ESTABLISHING SECURE HANDSHAKE SIGNAL...",
                "CALIBRATING AI INTERVIEWER MODEL CRITERIA...",
                "BENCHMARKING QUESTIONS TO CANDIDATE RESUME PROFILE...",
                "GENERATING ALGORITHMIC CODING CHALLENGES...",
                "INITIALIZING SECURE MEETING ROOM GRAPHICS PANEL..."
              ]}
              subtitle={`Connecting secure call feed for the ${activeConfig?.jobRole} profile. Please ensure camera/microphone permissions are allowed.`}
              iconColor="var(--accent-primary)"
            />
            <div style={{ width: '100%', maxWidth: '400px', height: '4px', backgroundColor: 'rgba(255, 255, 255, 0.05)', borderRadius: '2px', overflow: 'hidden', marginTop: '-20px', zIndex: 10 }}>
              <div style={{ height: '100%', backgroundColor: 'var(--accent-primary)', width: '60%', animation: 'voicePulse 1.5s infinite ease-in-out' }} />
            </div>
          </div>
        ) : (
          <div 
            style={{
              flexGrow: 1,
              display: 'grid',
              gridTemplateColumns: (isCodingQuestion && idePanelOpen && sessionState === 'answering') 
                ? '1.1fr 0.9fr' 
                : (activeConfig?.videoMode && sessionState === 'answering') 
                  ? '1fr' 
                  : '1.2fr 0.8fr',
              gap: '24px',
              padding: '24px',
              overflow: 'hidden'
            }}
            className="call-layout-grid"
          >
            {/* Left Workspace Panel: Video Grids and Feedback Screen Shares */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', height: '100%', overflowY: 'auto' }}>
              
              {/* Scorecard Screen Share View */}
              {sessionState === 'viewing_feedback' && currentFeedback && !evaluatingAnswer ? (
                <div style={{ flexGrow: 1, display: 'flex', flexDirection: 'column', gap: '16px', backgroundColor: 'rgba(10, 17, 26, 0.5)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: 'var(--radius-lg)', padding: '24px', position: 'relative' }}>
                  
                  {/* Presentation Top bar with Mini feeds */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', paddingBottom: '12px', marginBottom: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--accent-primary)' }} />
                      <span style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        {currentInterviewer.name} is sharing: Performance Scorecard
                      </span>
                    </div>

                    {/* Conference Mini Feeds row */}
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '3px 8px', backgroundColor: 'rgba(0,0,0,0.4)', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.06)' }}>
                        <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: 'var(--accent-primary)' }} />
                        <span style={{ fontSize: '9px', fontWeight: 600 }}>{currentInterviewer.name}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '3px 8px', backgroundColor: 'rgba(0,0,0,0.4)', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.06)' }}>
                        <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: cameraEnabled ? 'var(--accent-primary)' : 'rgba(255,255,255,0.2)' }} />
                        <span style={{ fontSize: '9px', fontWeight: 600 }}>You</span>
                      </div>
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
                /* Analyzing/Thinking Screen inside the meeting */
                <div style={{ flexGrow: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '24px', backgroundColor: 'rgba(10, 17, 26, 0.5)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: 'var(--radius-lg)', padding: '24px' }}>
                  <Terminal className="rotating-brain" style={{ width: '48px', height: '48px', color: 'var(--accent-purple)' }} />
                  <div className="typing-cursor" style={{ fontSize: 'var(--text-md)', fontWeight: 600, color: 'var(--accent-purple)', letterSpacing: '0.05em' }}>
                    {currentInterviewer.name} IS GRADUATING YOUR CODE...
                  </div>
                  <p style={{ fontSize: 'var(--text-xs)', color: 'rgba(255, 255, 255, 0.6)', maxWidth: '400px', textAlign: 'center', lineHeight: 1.5 }}>
                    Auditing core tech accuracy, clarity scores, keyword loops, and structure patterns.
                  </p>
                  <div style={{ width: '100%', maxWidth: '400px', height: '4px', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: '2px', overflow: 'hidden' }}>
                    <div style={{ height: '100%', backgroundColor: 'var(--accent-purple)', width: '40%', animation: 'voicePulse 1.2s infinite ease-in-out' }} />
                  </div>
                </div>
              ) : (
                /* Normal Interview Grid (Feeds Side-by-Side) */
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
                    className="neuform-card"
                    style={{
                      overflow: 'hidden',
                      position: 'relative',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      minHeight: '320px'
                    }}
                  >
                    <div style={{ position: 'absolute', top: '16px', left: '16px', display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: 'rgba(0,0,0,0.4)', padding: '4px 10px', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.05)', zIndex: 5 }}>
                      <span style={{ fontSize: '9px', fontWeight: 700, color: 'var(--accent-primary)', textTransform: 'uppercase' }}>
                        {currentInterviewer.name} (AI Interviewer)
                      </span>
                    </div>

                    <div style={{ position: 'absolute', top: '16px', right: '16px', zIndex: 5 }}>
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

                    <div style={{ position: 'absolute', bottom: '16px', left: '16px', right: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 5 }}>
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
                    className="neuform-card"
                    style={{
                      overflow: 'hidden',
                      position: 'relative',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      minHeight: '320px'
                    }}
                  >
                    {activeConfig?.videoMode && (
                      <video 
                        ref={videoRef} 
                        autoPlay 
                        playsInline 
                        muted 
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
                          transform: 'scaleX(-1)',
                          display: (cameraEnabled && stream) ? 'block' : 'none'
                        }}
                      />
                    )}
                    {activeConfig?.videoMode && !(cameraEnabled && stream) && (
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
                        <span style={{ fontSize: '9px', color: micMuted ? 'var(--accent-danger)' : 'var(--accent-primary)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                          {micMuted ? <MicOff style={{ width: '10px', height: '10px' }} /> : <Mic style={{ width: '10px', height: '10px' }} />}
                          {micMuted ? 'MIC MUTED' : 'MIC ACTIVE'}
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

              {/* Real-time Voice Transcript / Captions Box (Only shown in video/voice mode for standard questions) */}
              {(activeConfig?.videoMode || activeConfig?.voiceMode) && !isCodingQuestion && sessionState === 'answering' && (
                <div 
                  className="neuform-card"
                  style={{ 
                    padding: '24px', 
                    display: 'flex', 
                    flexDirection: 'column', 
                    gap: '16px',
                    borderLeft: '4px solid var(--accent-primary)'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span className="live-pulse" style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: isRecording ? '#ef4444' : '#6b7280', display: 'inline-block', animation: isRecording ? 'breath 1s infinite alternate' : 'none' }} />
                      <span style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        {isRecording ? 'LIVE AUDIO CAPTIONS (SPEAK NOW)' : 'DICTATION INACTIVE'}
                      </span>
                    </div>
                    {isRecording ? (
                      <span style={{ fontSize: '10px', color: 'var(--accent-primary)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                        Sophia is listening...
                      </span>
                    ) : (
                      <button
                        onClick={startDictation}
                        style={{
                          fontSize: '9px',
                          color: 'var(--accent-primary)',
                          backgroundColor: 'rgba(0, 212, 170, 0.1)',
                          border: '1px solid var(--accent-primary)',
                          padding: '4px 10px',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontWeight: 600
                        }}
                        className="btn-press"
                      >
                        RESTART MICROPHONE
                      </button>
                    )}
                  </div>
                  
                  <div 
                    style={{ 
                      minHeight: '70px', 
                      maxHeight: '140px',
                      overflowY: 'auto',
                      fontSize: 'var(--text-sm)', 
                      color: typedAnswer ? '#fff' : 'var(--text-muted)', 
                      lineHeight: 1.6,
                      fontStyle: typedAnswer ? 'normal' : 'italic'
                    }}
                  >
                    {typedAnswer || "Begin speaking now to dictate your interview answer orally..."}
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '4px' }}>
                    <Button 
                      variant="primary" 
                      onClick={() => handleVoiceSubmit()}
                      disabled={!typedAnswer.trim()}
                      style={{ padding: '8px 24px', fontSize: '11px', borderRadius: 'var(--radius-md)' }}
                    >
                      STOP SPEAKING & SUBMIT RESPONSE
                    </Button>
                  </div>
                </div>
              )}

              {/* Bottom Row: Current Question Prompt details */}
              <div 
                className="neuform-card"
                style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}
              >
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
            {sessionState === 'answering' && (isCodingQuestion || (!activeConfig?.videoMode && !activeConfig?.voiceMode)) && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', height: '100%', overflowY: 'auto' }}>
                {isCodingQuestion && idePanelOpen ? (
                  <div style={{ display: 'flex', flexDirection: 'column', height: '100%', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 'var(--radius-lg)', overflow: 'hidden', backgroundColor: '#050a0f', minHeight: '380px' }}>
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
                    
                    <div style={{ display: 'flex', flexGrow: 1, backgroundColor: '#03060a', position: 'relative', minHeight: '220px' }}>
                      <div 
                        id="ide-gutter"
                        style={{
                          width: '36px',
                          borderRight: '1px solid rgba(255,255,255,0.04)',
                          color: 'rgba(255,255,255,0.15)',
                          textAlign: 'right',
                          paddingRight: '8px',
                          fontFamily: 'var(--font-mono)',
                          fontSize: '11px',
                          lineHeight: '18px',
                          userSelect: 'none',
                          paddingTop: '12px',
                          paddingBottom: '12px',
                          overflow: 'hidden',
                          height: '100%'
                        }}
                      >
                        {ideCode.split('\n').map((_, i) => <div key={i}>{i + 1}</div>)}
                      </div>
                      <textarea
                        value={ideCode}
                        onChange={(e) => {
                          setIdeCode(e.target.value);
                          triggerTypingIndicator();
                        }}
                        onScroll={handleEditorScroll}
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
                          minHeight: '200px'
                        }}
                      />
                    </div>

                    {consoleOutput && (
                      <div style={{ padding: '12px 20px', backgroundColor: '#020406', borderTop: '1px solid rgba(255,255,255,0.05)', color: '#00d4aa', fontSize: '9px', fontFamily: 'var(--font-mono)', lineHeight: 1.4, whiteSpace: 'pre-wrap' }}>
                        {consoleOutput}
                      </div>
                    )}

                    <div style={{ padding: '12px 20px', backgroundColor: '#091017', borderTop: '1px solid rgba(255, 255, 255, 0.08)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <button 
                        onClick={runMockTests}
                        disabled={runningTests}
                        style={{ fontSize: '10px', padding: '6px 12px', backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', borderRadius: '4px', cursor: 'pointer' }}
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
                        onChange={(e) => {
                          setTypedAnswer(e.target.value);
                          triggerTypingIndicator();
                        }}
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

            {/* Repeat Question Button */}
            {currentQuestion && (
              <button
                onClick={() => speakQuestion(currentQuestion.text)}
                title="Repeat Recruiter Question"
                style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '50%',
                  backgroundColor: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  color: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  transition: 'all 200ms ease'
                }}
                className="btn-press"
              >
                <RefreshCw style={{ width: '18px', height: '18px' }} />
              </button>
            )}

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
      </div>,
      document.body
    );
  }

  // STANDARD PLATFORM VIEW (Setup & Summary - Out of call)
  return (
    <div className="container" style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      
      {/* Title Description */}
      {sessionState === 'setup' && (
        <div>
          <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>
            Simulate realistic mock interviews with live video, voice synthesis, real-time feedback, and coding IDE integration.
          </p>
        </div>
      )}

      {/* Wizard Setup Form */}
      {sessionState === 'setup' && (
        <Card hoverable={false} style={{ maxWidth: '960px', margin: '0 auto', width: '100%', padding: '32px' }}>
          <SetupForm onGenerate={handleGenerate} loading={loadingQuestions} />
        </Card>
      )}

      {/* Summary Scorecard State */}
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

      {/* General process errors */}
      {(questionsError || evalError) && !evaluatingAnswer && !loadingQuestions && (
        <Card hoverable={false} style={{ borderColor: 'var(--accent-danger)', display: 'flex', flexDirection: 'column', gap: '16px', padding: '24px', marginTop: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: 'var(--accent-danger)' }}>
            <ShieldAlert style={{ width: '24px', height: '24px' }} />
            <h4 style={{ fontSize: 'var(--text-md)', fontWeight: 600 }}>Simulation Process Halted</h4>
          </div>
          <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', lineHeight: 1.5, whiteSpace: 'pre-line' }}>
            {questionsError?.message || evalError?.message || 'Failed to reach generative endpoints. Check internet parameters and API configurations.'}
          </p>
          <Button variant="danger" onClick={handleRetry} style={{ width: 'fit-content' }}>
            Return to Setup
          </Button>
        </Card>
      )}

    </div>
  );
};
export default InterviewPractice;
