import { Modal } from '../components/ui/Modal';
import { PageHeading, WorkSheet } from '../components/ui/PageHeading';
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
  RefreshCw,
  Send
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import '../styles/globals.css';
import '../styles/animations.css';

type SessionState = 'setup' | 'loading_questions' | 'lobby' | 'answering' | 'viewing_feedback' | 'summary';

export const InterviewPractice: React.FC = () => {
  const navigate = useNavigate();
  const { addInterviewSession, activeInterview, setActiveInterview, addToast, activeResume, profile } = useAppStore();
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
  const spokenFirstQuestionRef = useRef(false);
  
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
  const [isAiResponding, setIsAiResponding] = useState(false);
  const [aiSpeechText, setAiSpeechText] = useState('');

  // STT Speech Recognition State
  const [isRecording, setIsRecording] = useState(false);
  const recognitionRef = useRef<any>(null);
  const [typedAnswer, setTypedAnswer] = useState('');
  const typedAnswerRef = useRef(''); // Ref-tracked value for STT closures to avoid stale state
  const [interimSpeech, setInterimSpeech] = useState('');

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

  // Pre-load voices on mount to avoid async empty list issues
  useEffect(() => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.getVoices();
    }
  }, []);

  // Workaround for Chrome SpeechSynthesis pausing after 15s
  useEffect(() => {
    const interval = setInterval(() => {
      if (isSpeaking && 'speechSynthesis' in window) {
        window.speechSynthesis.resume();
      }
    }, 5000);
    return () => clearInterval(interval);
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
    if ((sessionState === 'answering' || sessionState === 'lobby') && activeConfig?.videoMode) {
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

  // Synchronize stream and tracks state (include sessionState to re-bind when switching from lobby to answering page)
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.srcObject = stream;
      if (stream && cameraEnabled) {
        videoRef.current.play().catch(err => {
          console.warn("Failed to play video stream:", err);
        });
      }
    }
    if (stream) {
      stream.getVideoTracks().forEach(track => {
        track.enabled = cameraEnabled;
      });
    }
  }, [stream, cameraEnabled, sessionState]);

  // TTS speech execution on new question
  useEffect(() => {
    if (sessionState === 'answering' && activeConfig?.videoMode && questions.length > 0 && !isMuted) {
      if (currentIdx === 0) {
        if (!spokenFirstQuestionRef.current) {
          speakQuestion(questions[currentIdx].text);
          spokenFirstQuestionRef.current = true;
        }
      } else {
        speakQuestion(questions[currentIdx].text);
      }
    }
  }, [sessionState, currentIdx, questions, activeConfig?.videoMode, isMuted]);

  // Clean up speech synthesis when component is completely unmounted
  useEffect(() => {
    return () => {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  // Synchronize dictation engine reactively with mic state & meeting speech overlays (remove isRecording dependency to prevent multiple overlapping recognition instances)
  useEffect(() => {
    if (sessionState === 'answering') {
      if (!micMuted && !isSpeaking && !isAiResponding) {
        if (!isRecording) {
          startDictation();
        }
      } else {
        if (isRecording) {
          stopDictation();
        }
      }
    } else {
      if (isRecording) {
        stopDictation();
      }
    }
  }, [micMuted, sessionState, isSpeaking, isAiResponding]);

  // Coding round timer effect
  useEffect(() => {
    const question = questions[currentIdx];
    const isCodingRound = question && (question.category === 'dsa' || /write a|implement|write code|coding challenge/i.test(question.text));
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
    
    // Clear previous responses and set isSpeaking synchronously to prevent voice synthesis overlap capture
    typedAnswerRef.current = ''; setTypedAnswer('');
    setInterimSpeech('');
    setIsSpeaking(true);
    setAiSpeechText(text);

    window.speechSynthesis.resume();
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.onstart = () => {
      setIsSpeaking(true);
      setMouthShapeIdx(1);
    };
    utterance.onend = () => {
      setIsSpeaking(false);
      setMouthShapeIdx(0);
      // Auto-start dictation in video call or hands-free voice mode for non-coding questions
      if ((activeConfig?.videoMode || activeConfig?.voiceMode) && !isCodingQuestion) {
        setTimeout(() => {
          startDictation();
        }, 300);
      }
    };
    utterance.onerror = () => {
      setIsSpeaking(false);
      setMouthShapeIdx(0);
    };

    const getBestVoice = () => {
      const voices = window.speechSynthesis.getVoices();
      let voice = voices.find(v => v.lang.startsWith('en-') && v.name.toLowerCase().includes('google'));
      if (!voice) voice = voices.find(v => v.lang.startsWith('en-') && v.name.toLowerCase().includes('natural'));
      if (!voice) voice = voices.find(v => v.lang.startsWith('en-'));
      if (!voice && voices.length > 0) voice = voices[0];
      return voice;
    };

    const voice = getBestVoice();
    if (voice) {
      utterance.voice = voice;
    } else {
      window.speechSynthesis.onvoiceschanged = () => {
        const fallbackVoice = getBestVoice();
        if (fallbackVoice) {
          utterance.voice = fallbackVoice;
        }
      };
    }
    
    // Natural, human-like voice settings
    utterance.rate = 0.92;  // Slightly slower = more thoughtful interviewer pace
    utterance.pitch = 1.05; // Slightly warm, natural pitch
    utterance.volume = 1.0;
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

  const isCandidateAskingQuestion = (text: string): boolean => {
    const query = text.toLowerCase().trim();
    const questionKeywords = [
      'sophia', 
      'can you', 
      'could you', 
      'what is', 
      'what are',
      'how do', 
      'how does', 
      'why did', 
      'why is',
      'explain', 
      'clarify', 
      'help me', 
      'what do you mean',
      'tell me more'
    ];
    return questionKeywords.some(keyword => query.includes(keyword)) || query.endsWith('?');
  };

  const handleCandidateQuery = async (queryText: string) => {
    if (!queryText.trim() || isAiResponding) return;
    
    stopDictation();
    setIsAiResponding(true);
    try {
      const interviewer = getInterviewer(questions[currentIdx]?.category || 'technical');
      const aiResponse = await gemini.converseWithCandidate(
        queryText,
        questions[currentIdx]?.text || '',
        activeConfig?.jobRole || 'Software Engineer',
        interviewer.name
      );
      // Clear candidate transcript now that AI has processed it and is speaking
      typedAnswerRef.current = ''; setTypedAnswer('');
      setInterimSpeech('');
      setIsSpeaking(true);
      setAiSpeechText(aiResponse);
      const utterance = new SpeechSynthesisUtterance(aiResponse);
      utterance.onstart = () => {
        setIsSpeaking(true);
        setMouthShapeIdx(1);
      };
      utterance.onend = () => {
        setIsSpeaking(false);
        setIsAiResponding(false);
        setMouthShapeIdx(0);
        setTimeout(() => {
          startDictation();
        }, 300);
      };
      utterance.onerror = () => {
        setIsSpeaking(false);
        setIsAiResponding(false);
        setMouthShapeIdx(0);
        setTimeout(() => {
          startDictation();
        }, 300);
      };
      
      const getBestVoice = () => {
        const voices = window.speechSynthesis.getVoices();
        let voice = voices.find(v => v.lang.startsWith('en-') && v.name.toLowerCase().includes('google'));
        if (!voice) voice = voices.find(v => v.lang.startsWith('en-') && v.name.toLowerCase().includes('natural'));
        if (!voice) voice = voices.find(v => v.lang.startsWith('en-'));
        if (!voice && voices.length > 0) voice = voices[0];
        return voice;
      };

      const voice = getBestVoice();
      if (voice) {
        utterance.voice = voice;
      } else {
        window.speechSynthesis.onvoiceschanged = () => {
          const fallbackVoice = getBestVoice();
          if (fallbackVoice) {
            utterance.voice = fallbackVoice;
          }
        };
      }
      
      // Natural conversational response voice settings
      utterance.rate = 0.95;  // Slightly slower for a more natural conversational tone
      utterance.pitch = 1.08; // Slightly higher pitch for warmth in conversational replies
      utterance.volume = 1.0;
      
      window.speechSynthesis.resume();
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(utterance);
      
    } catch (err) {
      // Keep the candidate's words intact when the provider is unavailable.
      const message = err instanceof Error ? err.message : 'The AI follow-up is unavailable. Please try again.';
      useAppStore.getState().addToast('error', message);
      setIsSpeaking(false);
      setIsAiResponding(false);
      startDictation();
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
      let finalResult = '';
      let interimResult = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalResult += transcript;
        } else {
          interimResult += transcript;
        }
      }

      // Show interim speech immediately in captions (no wait for final)
      if (interimResult) {
        setInterimSpeech(interimResult);
        setIsRecording(true); // Ensure caption shows when mic is active
      }

      if (finalResult) {
        setInterimSpeech('');
        const spokenLower = finalResult.toLowerCase().trim();
        if (spokenLower === 'repeat' || spokenLower.includes('repeat the question') || spokenLower.includes('please repeat')) {
          stopDictation();
          typedAnswerRef.current = ''; setTypedAnswer('');
          if (questions.length > 0) {
            speakQuestion(questions[currentIdx].text);
          }
          return;
        }
        
        // Check if candidate is asking the AI interviewer a question
        if (isCandidateAskingQuestion(finalResult)) {
          handleCandidateQuery(finalResult);
          return;
        }
        
        // Append to both state and ref so captions and submissions always have the latest text
        const separator = typedAnswerRef.current.endsWith(' ') || typedAnswerRef.current === '' ? '' : ' ';
        typedAnswerRef.current = typedAnswerRef.current + separator + finalResult;
        setTypedAnswer(typedAnswerRef.current);
      }
    };

    rec.onend = () => {
      setIsRecording(false);
      // Restart speech recognition automatically to maintain continuous listening
      if (sessionState === 'answering' && !micMuted && !isSpeaking && !isAiResponding && !isMuted) {
        try {
          rec.start();
          setIsRecording(true);
        } catch (err) {
          setTimeout(() => {
            if (sessionState === 'answering') startDictation();
          }, 300);
        }
      }
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
      try {
        recognitionRef.current.onend = null; // Clear onend to prevent auto-restart feedback loops on stop
        recognitionRef.current.stop();
      } catch (err) {
        console.warn("Error stopping SpeechRecognition:", err);
      }
      recognitionRef.current = null;
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
      typedAnswerRef.current = ''; setTypedAnswer('');
      setConsoleOutput(null);
      spokenFirstQuestionRef.current = false;
      setSessionState('lobby');
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
    if (currentIdx >= questions.length || !activeConfig || evaluatingAnswer || sessionState !== 'answering') return;
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
      // A failed assessment is not evidence of any score or strength.
      // Keep the typed answer available so the candidate can retry.
      setCurrentFeedback(null);
      setSessionState('answering');
    }
  };

  const handleVoiceSubmit = () => {
    stopDictation();
    handleSubmitAnswer(typedAnswerRef.current);
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
    typedAnswerRef.current = ''; setTypedAnswer('');
    setConsoleOutput(null);
    setSessionState('answering');
  };

  const handleNext = () => {
    if (!activeConfig) return;
    
    const nextIndex = currentIdx + 1;
    if (nextIndex < questions.length) {
      setCurrentIdx(nextIndex);
      setCurrentFeedback(null);
      typedAnswerRef.current = ''; setTypedAnswer('');
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
    typedAnswerRef.current = ''; setTypedAnswer('');
    setConsoleOutput(null);
    setSessionState('setup');
  };

  const handleDashboard = () => {
    navigate('/dashboard');
  };

  const currentProgress = questions.length > 0 ? ((currentIdx) / questions.length) * 100 : 0;
  const currentQuestion = questions[currentIdx];
  const isCodingQuestion = currentQuestion && (
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
        color: 'var(--accent-primary)',
        avatarType: 'sophia',
        accentVar: '--accent-primary',
        desc: 'Expert in frontend, databases, and core data structures.'
      };
    } else if (cat.includes('system') || cat.includes('architecture') || cat.includes('design')) {
      return {
        name: 'Marcus',
        title: 'VP of Software Engineering',
        color: 'var(--accent-primary)',
        avatarType: 'marcus',
        accentVar: '--accent-secondary',
        desc: 'Architecture expert focusing on system design, scalability, and algorithms.'
      };
    } else {
      return {
        name: 'Emily',
        title: 'Director of HR & Culture',
        color: 'var(--accent-primary)',
        avatarType: 'emily',
        accentVar: '--accent-purple',
        desc: 'HR Director testing communication, cultural alignment, and STAR method behavioral stories.'
      };
    }
  };

  const renderAvatarSVG = (type: string, isSpk: boolean, isThk: boolean) => {
    
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
      <div className="interviewer-portrait" data-speaking={isSpk} data-reviewing={isThk}>
        <svg viewBox="0 0 100 100" aria-hidden="true">
          {/* Shoulders and Clothes Group (Breaths naturally) */}
          <g className="body-breath">
            {type === 'sophia' && (
              <g>
                <path d="M 12,95 C 12,74 32,68 50,68 C 68,68 88,74 88,95 Z" fill="var(--neutral-04)" />
                <path d="M 43,68 L 50,84 L 57,68 Z" fill="var(--neutral-11)" />
                <path d="M 46,68 L 50,78 L 54,68 Z" fill="var(--neutral-07)" />
                <rect x="45.5" y="56" width="9" height="14" fill="var(--neutral-09)" />
                <path d="M 45.5,64 C 48,66 52,66 54.5,64 Z" fill="var(--neutral-10)" opacity="0.6" />
              </g>
            )}

            {type === 'marcus' && (
              <g>
                <path d="M 12,95 C 12,74 32,68 50,68 C 68,68 88,74 88,95 Z" fill="var(--neutral-06)" />
                <path d="M 41,68 L 50,86 L 59,68 Z" fill="var(--neutral-12)" />
                <path d="M 46,68 L 50,76 L 54,68 Z" fill="var(--neutral-03)" />
                <rect x="45.5" y="55" width="9" height="15" fill="var(--neutral-09)" />
                <path d="M 45.5,63 C 48,65 52,65 54.5,63 Z" fill="var(--neutral-10)" opacity="0.6" />
              </g>
            )}

            {type === 'emily' && (
              <g>
                <path d="M 12,95 C 12,74 32,68 50,68 C 68,68 88,74 88,95 Z" fill="var(--neutral-05)" />
                <path d="M 42,68 Q 50,82 58,68 Z" fill="var(--neutral-11)" />
                <rect x="45.5" y="56" width="9" height="14" fill="var(--neutral-09)" />
                <path d="M 45.5,64 C 48,66 52,66 54.5,64 Z" fill="var(--neutral-10)" opacity="0.6" />
              </g>
            )}
          </g>

          {/* Head Group (Tilted or Nodding dynamically) */}
          <g className={headClass}>
            {type === 'sophia' && (
              <g>
                <circle cx="50" cy="27" r="8" fill="var(--neutral-01)" />
                <path d="M 35,42 C 35,32 65,32 65,42 C 65,52 61,59 50,59 C 39,59 35,52 35,42 Z" fill="var(--neutral-09)" />
                <path d="M 34,40 C 34,26 66,26 66,40 C 66,35 62,31 50,32 C 38,31 34,35 34,40 Z" fill="var(--neutral-01)" />
                <circle cx="34" cy="44" r="2.5" fill="var(--neutral-09)" />
                <circle cx="66" cy="44" r="2.5" fill="var(--neutral-09)" />
                <path d="M 49,45 L 50,49 L 51,45" fill="none" stroke="var(--neutral-06)" strokeWidth="0.8" strokeLinecap="round" />
                <circle cx="43.5" cy={eyeY} r="2.0" fill="var(--neutral-01)" className="blink-eye" />
                <circle cx="56.5" cy={eyeY} r="2.0" fill="var(--neutral-01)" className="blink-eye" />
                <path d="M 40,39.5 Q 43.5,38.5 46,40" fill="none" stroke="var(--neutral-02)" strokeWidth="1" strokeLinecap="round" />
                <path d="M 54,40 Q 56.5,38.5 60,39.5" fill="none" stroke="var(--neutral-02)" strokeWidth="1" strokeLinecap="round" />
                <circle cx="43.5" cy={eyeY} r="5.2" fill="none" stroke="var(--neutral-06)" strokeWidth="1" />
                <circle cx="56.5" cy={eyeY} r="5.2" fill="none" stroke="var(--neutral-06)" strokeWidth="1" />
                <line x1="48.7" y1={eyeY} x2="51.3" y2={eyeY} stroke="var(--neutral-06)" strokeWidth="1" />
                {isSpk ? (
                  <>
                    {mouthShapeIdx === 0 && <path d="M 46,53 Q 50,55 54,53" fill="none" stroke="var(--neutral-05)" strokeWidth="1" strokeLinecap="round" />}
                    {mouthShapeIdx === 1 && <path d="M 44,52 Q 50,58 56,52" fill="var(--neutral-04)" stroke="var(--neutral-05)" strokeWidth="1" strokeLinecap="round" />}
                    {mouthShapeIdx === 2 && <path d="M 45,52.5 Q 50,55 55,52.5" fill="var(--neutral-04)" stroke="var(--neutral-05)" strokeWidth="1" strokeLinecap="round" />}
                    {mouthShapeIdx === 3 && <path d="M 46,53 Q 50,54 54,53" fill="none" stroke="var(--neutral-05)" strokeWidth="1.2" strokeLinecap="round" />}
                  </>
                ) : (
                  <path d="M 46,53 Q 50,55 54,53" fill="none" stroke="var(--neutral-05)" strokeWidth="1" strokeLinecap="round" />
                )}
              </g>
            )}

            {type === 'marcus' && (
              <g>
                <path d="M 35,41 C 35,31 65,31 65,41 C 65,51 61,58 50,58 C 39,58 35,51 35,41 Z" fill="var(--neutral-09)" />
                <path d="M 35,43 C 37,56 63,56 65,43 C 65,50 61,59 50,59 C 39,59 35,50 35,43 Z" fill="var(--neutral-02)" />
                <path d="M 43,51 Q 50,47 57,51 Q 50,52 43,51 Z" fill="var(--neutral-03)" />
                <path d="M 33,35 Q 50,26 67,35 Q 67,29 50,26 Q 33,29 33,35 Z" fill="var(--neutral-02)" />
                <path d="M 33,35 Q 31,43 33,43 L 36.5,37 Q 63.5,37 63.5,43 L 67,35 Z" fill="var(--neutral-02)" />
                <circle cx="34" cy="43" r="2.5" fill="var(--neutral-09)" />
                <circle cx="66" cy="43" r="2.5" fill="var(--neutral-09)" />
                <path d="M 49,43.5 L 50,47.5 L 51,43.5" fill="none" stroke="var(--neutral-06)" strokeWidth="0.8" strokeLinecap="round" />
                <circle cx="43.5" cy={marcusEyeY} r="2.1" fill="var(--neutral-01)" className="blink-eye" />
                <circle cx="56.5" cy={marcusEyeY} r="2.1" fill="var(--neutral-01)" className="blink-eye" />
                <path d="M 39,38.5 Q 43,37.5 46.5,39" fill="none" stroke="var(--neutral-03)" strokeWidth="1.2" strokeLinecap="round" />
                <path d="M 53.5,39 Q 57,37.5 61,38.5" fill="none" stroke="var(--neutral-03)" strokeWidth="1.2" strokeLinecap="round" />
                {isSpk ? (
                  <>
                    {mouthShapeIdx === 0 && <path d="M 47,53 Q 50,54 53,53" fill="none" stroke="var(--neutral-03)" strokeWidth="1" strokeLinecap="round" />}
                    {mouthShapeIdx === 1 && <path d="M 46,52 Q 50,56 54,52" fill="var(--neutral-03)" stroke="var(--neutral-08)" strokeWidth="1" strokeLinecap="round" />}
                    {mouthShapeIdx === 2 && <path d="M 46.5,52.5 Q 50,54.5 53.5,52.5" fill="var(--neutral-03)" stroke="var(--neutral-08)" strokeWidth="1" strokeLinecap="round" />}
                    {mouthShapeIdx === 3 && <path d="M 47,53 Q 50,53.5 53,53" fill="none" stroke="var(--neutral-03)" strokeWidth="1.2" strokeLinecap="round" />}
                  </>
                ) : (
                  <path d="M 47,53 Q 50,54 53,53" fill="none" stroke="var(--neutral-03)" strokeWidth="1.2" strokeLinecap="round" />
                )}
              </g>
            )}

            {type === 'emily' && (
              <g>
                <path d="M 33,40 C 28,58 29,76 31,85 L 35.5,81.5 C 34,70 34.5,50 35.5,41 Z M 67,41 C 66,50 66,70 64.5,81.5 L 69,85 C 71,76 72,58 67,41 Z" fill="var(--neutral-02)" />
                <path d="M 35,42 C 35,32 65,32 65,42 C 65,52 61,59 50,59 C 39,59 35,52 35,42 Z" fill="var(--neutral-09)" />
                <path d="M 32,38 C 32,25 68,25 68,38 C 68,32 63,28 50,29 C 37,29 32,32 32,38 Z" fill="var(--neutral-02)" />
                <circle cx="34" cy="44" r="2.2" fill="var(--neutral-09)" />
                <circle cx="66" cy="44" r="2.2" fill="var(--neutral-09)" />
                <path d="M 49,45 L 50,48.5 L 51,45" fill="none" stroke="var(--neutral-06)" strokeWidth="0.8" strokeLinecap="round" />
                <circle cx="43.5" cy={eyeY} r="2.1" fill="var(--neutral-01)" className="blink-eye" />
                <circle cx="56.5" cy={eyeY} r="2.1" fill="var(--neutral-01)" className="blink-eye" />
                <path d="M 39.5,40 Q 43,39 46,40.5" fill="none" stroke="var(--neutral-03)" strokeWidth="1" strokeLinecap="round" />
                <path d="M 54,40.5 Q 57,39 60.5,40" fill="none" stroke="var(--neutral-03)" strokeWidth="1" strokeLinecap="round" />
                {isSpk ? (
                  <>
                    {mouthShapeIdx === 0 && <path d="M 46,53 Q 50,56 54,53" fill="none" stroke="var(--neutral-05)" strokeWidth="1" strokeLinecap="round" />}
                    {mouthShapeIdx === 1 && <path d="M 44,52 Q 50,58 56,52" fill="var(--neutral-04)" stroke="var(--neutral-05)" strokeWidth="1" strokeLinecap="round" />}
                    {mouthShapeIdx === 2 && <path d="M 45,52.5 Q 50,55.5 55,52.5" fill="var(--neutral-04)" stroke="var(--neutral-05)" strokeWidth="1" strokeLinecap="round" />}
                    {mouthShapeIdx === 3 && <path d="M 46,53 Q 50,54.5 54,53" fill="none" stroke="var(--neutral-05)" strokeWidth="1.2" strokeLinecap="round" />}
                  </>
                ) : (
                  <path d="M 46,53 Q 50,56 54,53" fill="none" stroke="var(--neutral-05)" strokeWidth="1" strokeLinecap="round" />
                )}
              </g>
            )}
          </g>

          {/* Evaluating Thinking Overlay */}
          {isThk && <rect x="0" y="0" width="100" height="100" fill="var(--accent-wash)" />}
        </svg>
      </div>
    );
  };

  const currentInterviewer = currentQuestion ? getInterviewer(currentQuestion.category) : {
    name: 'Sophia',
    title: 'Principal Technical Recruiter',
    color: 'var(--accent-primary)',
    avatarType: 'sophia',
    accentVar: '--accent-primary',
    desc: 'Expert in frontend, databases, and algorithms.'
  };

  const candidateName = profile?.full_name ? profile.full_name.split(' ')[0] : 'You';

  let showCaptions = false;
  let captionSender = '';
  let captionText = '';

  if (isSpeaking) {
    showCaptions = true;
    captionSender = currentInterviewer.name;
    captionText = aiSpeechText || (currentQuestion ? currentQuestion.text : '');
  } else if (isRecording && (typedAnswer || interimSpeech)) {
    showCaptions = true;
    captionSender = candidateName;
    captionText = typedAnswer + (interimSpeech ? (typedAnswer ? ' ' : '') + interimSpeech : '');
  }

  if (sessionState === 'answering' || sessionState === 'viewing_feedback' || sessionState === 'loading_questions' || sessionState === 'lobby' || evaluatingAnswer) {
    return createPortal(
      <div 
        className="secure-call-room"
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 99999,
          color: 'var(--text-primary)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}
      >

        <Modal isOpen={showLeaveConfirm} onClose={() => setShowLeaveConfirm(false)} title="Leave this interview?">
          <div className="form-stack">
            <p className="muted">If you leave now, this session will end before you get a review.</p>
            <div className="review-actions">
              <Button variant="ghost" onClick={() => setShowLeaveConfirm(false)}>Keep practising</Button>
              <Button variant="danger" onClick={() => {
                setShowLeaveConfirm(false);
                handleRetry();
              }}>Leave interview</Button>
            </div>
          </div>
        </Modal>

        {/* SECURE CALL ROOM HEADER */}
        <div 
          style={{
            minHeight: '64px',
            borderBottom: '1px solid var(--border-subtle)',
            padding: '8px 16px',
            display: 'flex',
            flexWrap: 'wrap',
            gap: '8px',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: 'var(--bg-surface)',
            zIndex: 10
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div 
              style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                backgroundColor: sessionState === 'loading_questions' ? 'var(--accent-warning)' : 'var(--accent-danger)',
              }}
            />
            <span style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.05em', color: 'var(--text-primary)', textTransform: 'uppercase' }}>
              {sessionState === 'loading_questions' ? 'Preparing questions…' : 'Mock interview'}
            </span>
            <span style={{ color: 'var(--border-subtle)' }}>|</span>
            <span style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 500 }}>
              {activeConfig?.jobRole}
            </span>
          </div>

          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', backgroundColor: 'var(--bg-elevated)', padding: '6px 16px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
            <span style={{ fontSize: '10px', fontWeight: 600, color: 'var(--accent-primary)', textTransform: 'uppercase' }}>
              {currentQuestion ? `ROUND: ${currentQuestion.category.replace('-', ' ')}` : 'Getting ready…'}
            </span>
            <span style={{ color: 'var(--text-muted)' }}>•</span>
            <span style={{ fontSize: '10px', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>
              {currentQuestion ? `Difficulty: ${currentQuestion.difficulty}` : ''}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <span style={{ fontSize: '10px', color: 'var(--text-secondary)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Lock style={{ width: '10px', height: '10px' }} />
              Proctored Environment
            </span>
            <span style={{ color: 'var(--border-subtle)' }}>|</span>
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
                "Setting up the call...",
                "Picking questions for the role...",
                "Matching questions to the resume...",
                "Preparing the coding challenge...",
                "Opening the meeting room..."
              ]}
              subtitle={`Setting up the call for the ${activeConfig?.jobRole} profile. Please allow camera and microphone access if asked.`}
              iconColor="var(--accent-primary)"
            />
            <div style={{ width: '100%', maxWidth: '400px', height: '4px', backgroundColor: 'var(--bg-elevated)', borderRadius: '2px', overflow: 'hidden', marginTop: '-20px', zIndex: 10 }}>
              <div style={{ height: '100%', backgroundColor: 'var(--accent-primary)', width: '60%', animation: 'voicePulse 400ms var(--spring) infinite alternate' }} />
            </div>
          </div>
        ) : sessionState === 'lobby' ? (
          /* Render Google Meet Green Room Lobby */
          <div 
            style={{ 
              flexGrow: 1, 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              padding: '40px', 
              gap: '48px', 
              width: '100%', 
              maxWidth: '1200px', 
              margin: '0 auto', 
              height: 'calc(100vh - 144px)',
              overflowY: 'auto'
            }}
          >
            {/* Left: Video Preview */}
            <div 
              className="call-panel"
              style={{
                flex: '1 1 55%',
                height: '420px',
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '16px',
                border: '1px solid var(--border-subtle)',
                overflow: 'hidden'
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
              {(!cameraEnabled || !stream) && (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                  <div style={{
                    width: '72px',
                    height: '72px',
                    borderRadius: '50%',
                    backgroundColor: 'var(--bg-elevated)',
                    color: 'var(--text-secondary)',
                    border: '1px solid var(--border-subtle)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 700,
                    fontSize: '24px'
                  }}>
                    YOU
                  </div>
                  <span style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 600 }}>
                    {!cameraEnabled ? 'Camera is muted' : 'Camera is starting...'}
                  </span>
                </div>
              )}

              {/* Lobby Camera and Mic Floating toggles */}
              <div style={{ position: 'absolute', bottom: '24px', left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: '16px', zIndex: 10 }}>
                <button
                  onClick={() => setMicMuted(!micMuted)}
                  style={{
                    width: '44px',
                    height: '44px',
                    borderRadius: '50%',
                    backgroundColor: micMuted ? 'var(--danger-wash)' : 'var(--bg-elevated)',
                    color: micMuted ? 'var(--text-primary)' : 'var(--text-primary)',
                    border: '1px solid var(--border-subtle)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    transition: 'transform 180ms var(--spring)'
                  }}
                  className="btn-press"
                >
                  {micMuted ? <MicOff style={{ width: '20px', height: '20px' }} /> : <Mic style={{ width: '20px', height: '20px' }} />}
                </button>
                <button
                  onClick={() => setCameraEnabled(!cameraEnabled)}
                  style={{
                    width: '44px',
                    height: '44px',
                    borderRadius: '50%',
                    backgroundColor: !cameraEnabled ? 'var(--danger-wash)' : 'var(--bg-elevated)',
                    color: !cameraEnabled ? 'var(--text-primary)' : 'var(--text-primary)',
                    border: '1px solid var(--border-subtle)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    transition: 'transform 180ms var(--spring)'
                  }}
                  className="btn-press"
                >
                  {cameraEnabled ? <Video style={{ width: '20px', height: '20px' }} /> : <VideoOff style={{ width: '20px', height: '20px' }} />}
                </button>
              </div>
            </div>

            {/* Right: Joining Panel */}
            <div 
              style={{
                flex: '1 1 40%',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                gap: '24px',
                textAlign: 'left'
              }}
            >
              <div>
                <h1 style={{ fontSize: '32px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '8px', fontFamily: 'var(--font-display)', letterSpacing: '-0.02em' }}>
                  Ready to join?
                </h1>
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                  Check your microphone and camera settings before you join.
                </p>
              </div>

              <div 
                style={{ 
                  padding: '16px 20px', 
                  backgroundColor: 'var(--bg-surface)', 
                  border: '1px solid var(--border-subtle)', 
                  borderRadius: 'var(--radius-md)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '4px'
                }}
              >
                <span style={{ fontSize: '10px', color: 'var(--accent-primary)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Target role
                </span>
                <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>
                  {activeConfig?.jobRole}
                </span>
              </div>

              <button
                onClick={() => {
                  if (questions.length > 0) {
                    speakQuestion(questions[currentIdx].text);
                    spokenFirstQuestionRef.current = true;
                  }
                  setSessionState('answering');
                }}
                style={{
                  alignSelf: 'flex-start',
                  padding: '14px 32px',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'var(--accent-primary)',
                  color: 'var(--on-accent)',
                  border: 'none',
                  fontSize: '13px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  transition: 'transform 180ms var(--spring)'
                }}
                className="btn-press"
              >
                <Play style={{ width: '16px', height: '16px' }} />
                Join interview
              </button>
            </div>
          </div>
        ) : (
          <div 
            style={{
              flexGrow: 1,
              display: 'grid',
              gridTemplateColumns: (sessionState === 'answering' && isCodingQuestion && idePanelOpen) 
                ? '1fr 500px' 
                : '1fr',
              gap: '24px',
              padding: '24px',
              overflow: 'hidden',
              position: 'relative'
            }}
            className="call-layout-grid"
          >
            {/* Left Workspace Panel: Google Meet Video Room */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', height: '100%', overflowY: 'auto', position: 'relative' }}>
              
              {/* Scorecard Screen Share View */}
              {sessionState === 'viewing_feedback' && currentFeedback && !evaluatingAnswer ? (
                <div style={{ flexGrow: 1, display: 'flex', flexDirection: 'column', gap: '16px', backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)', padding: '24px', position: 'relative' }}>
                  
                  {/* Presentation Top bar with Mini feeds */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '12px', marginBottom: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--accent-primary)' }} />
                      <span style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-primary)' }}>
                        {currentInterviewer.name} is reviewing your answer
                      </span>
                    </div>

                    {/* Conference Mini Feeds row */}
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '3px 8px', backgroundColor: 'var(--bg-elevated)', borderRadius: '4px', border: '1px solid var(--border-subtle)' }}>
                        <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: 'var(--accent-primary)' }} />
                        <span style={{ fontSize: '9px', fontWeight: 600, color: 'var(--text-primary)' }}>{currentInterviewer.name}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '3px 8px', backgroundColor: 'var(--bg-elevated)', borderRadius: '4px', border: '1px solid var(--border-subtle)' }}>
                        <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: cameraEnabled ? 'var(--accent-primary)' : 'var(--text-muted)' }} />
                        <span style={{ fontSize: '9px', fontWeight: 600, color: 'var(--text-primary)' }}>You</span>
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
                <div style={{ flexGrow: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '24px', backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)', padding: '24px' }}>
                  <Terminal style={{ width: '48px', height: '48px', color: 'var(--accent-purple)' }} />
                  <div style={{ fontSize: 'var(--text-md)', fontWeight: 600, color: 'var(--accent-purple)', letterSpacing: '0.05em' }}>
                    Reviewing your answer…
                  </div>
                  <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', maxWidth: '400px', textAlign: 'center', lineHeight: 1.5 }}>
                    Checking the answer for accuracy, clarity, and examples.
                  </p>
                  <div style={{ width: '100%', maxWidth: '400px', height: '4px', backgroundColor: 'var(--bg-elevated)', borderRadius: '2px', overflow: 'hidden' }}>
                    <div style={{ height: '100%', backgroundColor: 'var(--accent-purple)', width: '40%', animation: 'voicePulse 400ms var(--spring) infinite alternate' }} />
                  </div>
                </div>
              ) : (
                /* Normal Google Meet Grid (Feeds Side-by-Side) */
                <div 
                  style={{
                    flexGrow: 1,
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                    gap: '20px',
                    alignItems: 'stretch',
                    minHeight: '340px',
                    position: 'relative'
                  }}
                  className="video-feeds-grid"
                >
                  {/* Left Tile: AI Recruiter Sophia */}
                  <div 
                    className="call-panel"
                    style={{
                      overflow: 'hidden',
                      position: 'relative',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      minHeight: '320px',
                      borderRadius: '16px',
                      border: '1px solid var(--border-subtle)'
                    }}
                  >
                    <div style={{ position: 'absolute', top: '16px', left: '16px', display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: 'var(--bg-elevated)', padding: '6px 12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)', zIndex: 5 }}>
                      <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-primary)' }}>
                        {currentInterviewer.name} (AI Interviewer)
                      </span>
                    </div>

                    <div style={{ position: 'absolute', top: '16px', right: '16px', zIndex: 5 }}>
                      <span style={{
                        fontSize: '9px', 
                        fontWeight: 700, 
                        color: isSpeaking ? 'var(--accent-primary)' : 'var(--text-secondary)',
                        padding: '4px 10px',
                        borderRadius: '16px',
                        backgroundColor: isSpeaking ? 'var(--danger-wash)' : 'var(--bg-elevated)',
                        border: isSpeaking ? '1px solid var(--danger-wash)' : '1px solid var(--border-subtle)',
                        letterSpacing: '0.05em'
                      }}>
                        {isAiResponding ? '• THINKING' : (isSpeaking ? '• SPEAKING' : '• LISTENING')}
                      </span>
                    </div>

                    {renderAvatarSVG(currentInterviewer.avatarType, isSpeaking, evaluatingAnswer)}

                    <div style={{ position: 'absolute', bottom: '16px', left: '16px', display: 'flex', flexDirection: 'column', zIndex: 5 }}>
                      <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)' }}>
                        {currentInterviewer.name}
                      </span>
                      <span style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>
                        {currentInterviewer.title}
                      </span>
                    </div>

                    {isSpeaking && (
                      <div style={{ position: 'absolute', bottom: '16px', right: '16px', display: 'flex', gap: '3px', alignItems: 'flex-end', height: '16px', zIndex: 5 }}>
                        {[...Array(6)].map((_, i) => (
                          <div 
                            key={i}
                            className="pulse-speaking"
                            style={{
                              width: '2px',
                              height: '10px',
                              backgroundColor: 'var(--accent-primary)',
                              borderRadius: '1px',
                              animationDelay: `${i * 100}ms`
                            }}
                          />
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Right Tile: Candidate (You) */}
                  <div 
                    className="call-panel"
                    style={{
                      overflow: 'hidden',
                      position: 'relative',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      minHeight: '320px',
                      borderRadius: '16px',
                      border: '1px solid var(--border-subtle)'
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
                          background: 'var(--bg-elevated)',
                          color: 'var(--text-secondary)',
                          border: '1px solid var(--border-subtle)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 700,
                          fontSize: '20px'
                        }}>
                          YOU
                        </div>
                        <span style={{ fontSize: '10px', color: 'var(--text-secondary)', fontWeight: 600 }}>
                          {!cameraEnabled ? 'CAMERA MUTED' : 'WEBCAM INACTIVE'}
                        </span>
                      </div>
                    )}

                    <div style={{ position: 'absolute', bottom: '16px', left: '16px', display: 'flex', alignItems: 'center', gap: '8px', zIndex: 5 }}>
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)' }}>
                          You (Candidate)
                        </span>
                        <span style={{ fontSize: '10px', color: micMuted ? 'var(--accent-danger)' : 'var(--accent-primary)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                          {micMuted ? <MicOff style={{ width: '10px', height: '10px' }} /> : <Mic style={{ width: '10px', height: '10px' }} />}
                          {micMuted ? 'MIC MUTED' : 'MIC ACTIVE'}
                        </span>
                      </div>
                    </div>

                    <div style={{ position: 'absolute', top: '16px', right: '16px', display: 'flex', alignItems: 'center', gap: '6px', backgroundColor: 'var(--bg-elevated)', padding: '4px 10px', borderRadius: '16px', border: '1px solid var(--border-subtle)', zIndex: 5 }}>
                      <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: (isRecording && !micMuted) ? 'var(--accent-danger)' : 'var(--text-muted)', display: 'inline-block' }} />
                      <span style={{ fontSize: '9px', fontWeight: 700, color: 'var(--text-secondary)' }}>
                        {(isRecording && !micMuted) ? 'SPEAKING' : 'IDLE'}
                      </span>
                    </div>
                  </div>

                  {/* Google Meet Captions Overlay inside the Video Grid */}
                  {showCaptions && (
                    <div style={{
                      position: 'absolute',
                      bottom: '24px',
                      left: '50%',
                      transform: 'translateX(-50%)',
                      backgroundColor: 'var(--bg-elevated)',
                      color: 'var(--text-primary)',
                      padding: '10px 24px',
                      borderRadius: '24px',
                      border: '1px solid var(--border-subtle)',
                      maxWidth: '85%',
                      textAlign: 'center',
                      fontSize: '13px',
                      fontWeight: 500,
                      zIndex: 100,
                      boxShadow: 'var(--shadow-depth-2)'
                    }}>
                      <span style={{ color: 'var(--accent-primary)', fontWeight: 700, marginRight: '8px' }}>{captionSender}:</span>
                      {captionText}
                    </div>
                  )}

                  {/* Interactive response overlay */}
                  {isAiResponding && (
                    <div style={{
                      position: 'absolute',
                      bottom: '24px',
                      left: '50%',
                      transform: 'translateX(-50%)',
                      backgroundColor: 'var(--accent-secondary)',
                      color: 'var(--on-accent)',
                      padding: '10px 24px',
                      borderRadius: '24px',
                      maxWidth: '85%',
                      textAlign: 'center',
                      fontSize: '13px',
                      fontWeight: 600,
                      zIndex: 100,
                      boxShadow: 'var(--shadow-depth-2)'
                    }}>
                      {currentInterviewer.name} is responding to your query...
                    </div>
                  )}
                </div>
              )}

              {/* Bottom Row: Current Question Prompt details */}
              <div 
                className="call-panel"
                style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '10px', fontWeight: 700, color: 'var(--accent-primary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Question {currentIdx + 1} of {questions.length}
                  </span>
                  <span style={{ fontSize: '10px', color: 'var(--text-secondary)', fontWeight: 600 }}>
                    Section: {currentQuestion?.category}
                  </span>
                </div>
                <p style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-primary)', lineHeight: 1.5 }}>
                  {currentQuestion?.text}
                </p>
                {currentQuestion?.expectedTopics && currentQuestion.expectedTopics.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', alignItems: 'center', marginTop: '4px' }}>
                    <span style={{ fontSize: '9px', color: 'var(--text-secondary)', fontWeight: 700 }}>Topics to cover:</span>
                    {currentQuestion.expectedTopics.map(topic => (
                      <span key={topic} style={{ fontSize: '9px', padding: '2px 6px', borderRadius: '4px', backgroundColor: 'var(--bg-elevated)', color: 'var(--text-secondary)', border: '1px solid var(--border-subtle)' }}>
                        {topic}
                      </span>
                    ))}
                  </div>
                )}
                {sessionState === 'answering' && !isCodingQuestion && (
                  <label className="form-field">Your answer
                    <textarea
                      rows={4}
                      value={typedAnswer}
                      placeholder="Write your answer or dictate with the microphone."
                      onChange={(event) => {
                        const answer = event.target.value;
                        typedAnswerRef.current = answer;
                        setTypedAnswer(answer);
                        triggerTypingIndicator();
                      }}
                    />
                  </label>
                )}
              </div>
            </div>

            {/* Right Workspace Panel: Code Editor (Only display for Coding/DSA Questions) */}
            {sessionState === 'answering' && isCodingQuestion && idePanelOpen && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', height: '100%', overflowY: 'auto' }}>
                <div style={{ display: 'flex', flexDirection: 'column', height: '100%', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)', overflow: 'hidden', backgroundColor: 'var(--bg-surface)', minHeight: '380px' }}>
                  <div style={{ padding: '12px 20px', backgroundColor: 'var(--bg-elevated)', borderBottom: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <Code style={{ width: '16px', height: '16px', color: 'var(--accent-primary)' }} />
                      <span style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.05em', color: 'var(--text-primary)' }}>Code editor</span>
                      <select
                        aria-label="Interview code language"
                        value={ideLanguage} 
                        onChange={(e) => setIdeLanguage(e.target.value)}
                        style={{
                          padding: '2px 6px',
                          fontSize: '9px',
                          borderRadius: '4px',
                          backgroundColor: 'var(--bg-surface)',
                          border: '1px solid var(--border-subtle)',
                          color: 'var(--text-primary)',
                          width: 'auto'
                        }}
                      >
                        <option value="javascript">JavaScript</option>
                        <option value="typescript">TypeScript</option>
                        <option value="python">Python</option>
                        <option value="sql">SQL</option>
                      </select>
                    </div>
                    <span style={{ fontSize: '9px', color: codingSeconds < 120 ? 'var(--accent-danger)' : 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>
                      Time left: {formatTime(codingSeconds)}
                    </span>
                  </div>
                  
                  <div style={{ display: 'flex', flexGrow: 1, backgroundColor: 'var(--bg-surface)', position: 'relative', minHeight: '220px' }}>
                    <div 
                      id="ide-gutter"
                      style={{
                        width: '36px',
                        borderRight: '1px solid var(--border-subtle)',
                        color: 'var(--text-muted)',
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
                      aria-label="Interview code editor"
                      value={ideCode}
                      onChange={(e) => {
                        setIdeCode(e.target.value);
                        triggerTypingIndicator();
                      }}
                      onScroll={handleEditorScroll}
                      style={{
                        flexGrow: 1,
                        backgroundColor: 'transparent',
                        color: 'var(--text-primary)',
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
                    <div style={{ padding: '12px 20px', backgroundColor: 'var(--bg-elevated)', borderTop: '1px solid var(--border-subtle)', color: 'var(--accent-primary)', fontSize: '9px', fontFamily: 'var(--font-mono)', lineHeight: 1.4, whiteSpace: 'pre-wrap' }}>
                      {consoleOutput}
                    </div>
                  )}

                  <div style={{ padding: '12px 20px', backgroundColor: 'var(--bg-elevated)', borderTop: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <button 
                      onClick={runMockTests}
                      disabled={runningTests}
                      style={{ fontSize: '10px', padding: '6px 12px', backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)', borderRadius: '4px', cursor: 'pointer' }}
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
              </div>
            )}
          </div>
        )}

        <footer className="call-toolbar">
          <div className="call-toolbar-time">
            <span style={{ fontSize: '12px', color: 'var(--text-primary)', fontWeight: 600 }}>
              Interview with {currentInterviewer.name}
            </span>
            <span style={{ color: 'var(--border-subtle)' }}>|</span>
            <span style={{ fontSize: '11px', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>
              {formatTime(seconds)}
            </span>
          </div>

          <div className="call-toolbar-controls">
            <button
              onClick={() => {
                setMicMuted(!micMuted);
              }}
              title={micMuted ? "Unmute Microphone" : "Mute Microphone"}
              style={{
                width: '44px',
                height: '44px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: micMuted ? 'var(--danger-wash)' : 'var(--bg-elevated)',
                color: micMuted ? 'var(--text-primary)' : 'var(--text-primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'transform 200ms var(--spring)',
                border: 'none'
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
                borderRadius: 'var(--radius-md)',
                backgroundColor: !cameraEnabled ? 'var(--danger-wash)' : 'var(--bg-elevated)',
                color: !cameraEnabled ? 'var(--text-primary)' : 'var(--text-primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'transform 200ms var(--spring)',
                border: 'none'
              }}
              className="btn-press"
            >
              {cameraEnabled ? <Video style={{ width: '18px', height: '18px' }} /> : <VideoOff style={{ width: '18px', height: '18px' }} />}
            </button>

            {currentQuestion && (
              <button
                onClick={() => speakQuestion(currentQuestion.text)}
                title="Repeat Question"
                style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'var(--bg-elevated)',
                  color: 'var(--text-primary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  transition: 'transform 200ms var(--spring)',
                  border: 'none'
                }}
                className="btn-press"
              >
                <RefreshCw style={{ width: '18px', height: '18px' }} />
              </button>
            )}

            <button
              onClick={handleSpeechToggle}
              title={isMuted ? "Unmute AI Voice" : "Mute AI Voice"}
              style={{
                width: '44px',
                height: '44px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: isMuted ? 'var(--bg-elevated)' : 'var(--danger-wash)',
                border: isMuted ? 'none' : '1px solid var(--danger-wash)',
                color: isMuted ? 'var(--text-muted)' : 'var(--accent-primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'transform 200ms var(--spring)'
              }}
              className="btn-press"
            >
              {isMuted ? <VolumeX style={{ width: '18px', height: '18px' }} /> : <Volume2 style={{ width: '18px', height: '18px' }} />}
            </button>

            {/* Submit Response Button */}
            <button
              onClick={handleVoiceSubmit}
              disabled={!typedAnswer.trim()}
              title="Submit Answer Response"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '0 20px',
                height: '44px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: typedAnswer.trim() ? 'var(--accent-primary)' : 'var(--bg-elevated)',
                border: 'none',
                color: typedAnswer.trim() ? 'var(--on-accent)' : 'var(--text-muted)',
                fontSize: '11px',
                fontWeight: 700,
                letterSpacing: '0.05em',
                textTransform: 'uppercase',
                cursor: typedAnswer.trim() ? 'pointer' : 'not-allowed',
                transition: 'transform 200ms var(--spring)'
              }}
              className="btn-press"
            >
              <Send style={{ width: '12px', height: '12px' }} />
              Submit Answer
            </button>

            <button
              onClick={() => setShowLeaveConfirm(true)}
              aria-label="Leave call"
              title="Leave call"
              style={{
                width: '56px',
                height: '44px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--danger-wash)',
                color: 'var(--text-primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'transform 200ms var(--spring)',
                border: 'none'
              }}
              className="btn-press end-call-btn"
            >
              <PhoneOff style={{ width: '18px', height: '18px' }} />
            </button>
          </div>

          <div className="call-toolbar-panels">
            {isCodingQuestion && sessionState === 'answering' && (
              <button
                onClick={() => setIdePanelOpen(!idePanelOpen)}
                title={idePanelOpen ? "Close IDE Editor" : "Open IDE Editor"}
                style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: idePanelOpen ? 'var(--accent-wash)' : 'var(--bg-elevated)',
                  border: idePanelOpen ? '1px solid var(--accent-wash)' : 'none',
                  color: idePanelOpen ? 'var(--accent-purple)' : 'var(--text-primary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  transition: 'transform 200ms var(--spring)'
                }}
                className="btn-press"
              >
                <Code style={{ width: '18px', height: '18px' }} />
              </button>
            )}

            {sessionState === 'answering' && (
              <button
                onClick={() => setNotesPanelOpen(!notesPanelOpen)}
                title={notesPanelOpen ? "Close Notes Panel" : "Open Notes Panel"}
                style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: notesPanelOpen ? 'var(--danger-wash)' : 'var(--bg-elevated)',
                  border: notesPanelOpen ? '1px solid var(--danger-wash)' : 'none',
                  color: notesPanelOpen ? 'var(--accent-primary)' : 'var(--text-primary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  transition: 'transform 200ms var(--spring)'
                }}
                className="btn-press"
              >
                <Clipboard style={{ width: '18px', height: '18px' }} />
              </button>
            )}
          </div>
        </footer>
      </div>,
      document.body
    );
  }

  // STANDARD PLATFORM VIEW (Setup & Summary - Out of call)
  return (
    <div className="container tool-page page-enter">
      <PageHeading title={sessionState === 'summary' ? 'Interview review' : 'Mock interview'}>
        {sessionState === 'setup' && 'Rehearse an interview for the role you want. Get feedback after each answer.'}
      </PageHeading>
      {sessionState === 'setup' && (
        <WorkSheet note={
          <>
            <h2>Before you start</h2>
            <p>The full interview covers several topics. Choose a single round to focus on one skill.</p>
            <p>Type your answers or use your microphone. Camera and voice settings are available before you enter.</p>
          </>
        }>
          <SetupForm onGenerate={handleGenerate} loading={loadingQuestions} />
        </WorkSheet>
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
            <h4 style={{ fontSize: 'var(--text-md)', fontWeight: 600 }}>Couldn’t finish this interview</h4>
          </div>
          <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', lineHeight: 1.5, whiteSpace: 'pre-line' }}>
            {questionsError?.message || evalError?.message || 'Check your connection or Google AI key and try again.'}
          </p>
          <Button variant="danger" onClick={handleRetry} style={{ width: 'fit-content' }}>
            Back to setup
          </Button>
        </Card>
      )}

    </div>
  );
};
export default InterviewPractice;
