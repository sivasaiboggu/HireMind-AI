import React, { useState, useEffect, useRef } from 'react';
import { SetupForm } from '../components/interview/SetupForm';
import { QuestionCard } from '../components/interview/QuestionCard';
import { FeedbackPanel } from '../components/interview/FeedbackPanel';
import { SessionSummary } from '../components/interview/SessionSummary';
import { Card } from '../components/ui/Card';
import { Skeleton } from '../components/ui/Skeleton';
import { Button } from '../components/ui/Button';
import { useGemini } from '../hooks/useGemini';
import { gemini } from '../services/gemini';
import { useAppStore } from '../store/appStore';
import { Question, AnswerRecord, SavedInterview, InterviewConfig } from '../types';
import { Activity, Terminal, Clock, Award, ShieldAlert } from 'lucide-react';
import '../styles/globals.css';
import '../styles/animations.css';

type SessionState = 'setup' | 'loading_questions' | 'answering' | 'viewing_feedback' | 'summary';

export const InterviewPractice: React.FC = () => {
  const { addInterviewSession, activeInterview, setActiveInterview, setView } = useAppStore();
  const { execute: getQuestions, loading: loadingQuestions, error: questionsError, reset: resetQuestions } = useGemini(gemini.generateInterviewQuestions, 10);
  const { execute: evaluateAns, loading: evaluatingAnswer, error: evalError, reset: resetEval } = useGemini(gemini.evaluateAnswer, 5);

  const [sessionState, setSessionState] = useState<SessionState>(activeInterview ? 'summary' : 'setup');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answersList, setAnswersList] = useState<AnswerRecord[]>([]);
  const [activeConfig, setActiveConfig] = useState<InterviewConfig | null>(null);
  const [currentFeedback, setCurrentFeedback] = useState<any | null>(null);

  // Time tracking
  const [seconds, setSeconds] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

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
      setSessionState('answering');
    } else {
      setSessionState('setup');
    }
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
        overallScore: 6,
        accuracy: 6,
        clarity: 7,
        depth: 5,
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
    setSessionState('answering');
  };

  const handleNext = () => {
    if (!activeConfig) return;
    
    const nextIndex = currentIdx + 1;
    if (nextIndex < questions.length) {
      setCurrentIdx(nextIndex);
      setCurrentFeedback(null);
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
    setSessionState('setup');
  };

  const handleDashboard = () => {
    setView('dashboard');
  };

  const currentProgress = questions.length > 0 ? ((currentIdx) / questions.length) * 100 : 0;

  return (
    <div className="container" style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      
      {/* Title */}
      {sessionState === 'setup' && (
        <div>
          <h2 style={{ fontSize: 'var(--text-3xl)', fontWeight: 600, fontFamily: 'var(--font-display)' }}>
            AI Interview Simulator
          </h2>
          <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', marginTop: '4px' }}>
            Simulate realistic role-specific mock interviews and receive metrics on communication clarity and tech accuracy.
          </p>
        </div>
      )}

      {/* Loading Skeletons */}
      {sessionState === 'loading_questions' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px', alignItems: 'center', justifyContent: 'center', padding: '60px 0', textAlign: 'center' }}>
          <Activity className="rotating-brain" style={{ width: '48px', height: '48px' }} />
          <div className="typing-cursor" style={{ fontSize: 'var(--text-md)', fontWeight: 600, color: 'var(--accent-primary)', letterSpacing: '0.05em' }}>
            GENERATING CHALLENGING MOCK INTERVIEW QUESTIONS...
          </div>
          <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>
            Configuring behavioral anchors and stack-specific engineering criteria.
          </p>
          <div style={{ width: '100%', maxWidth: '600px', display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '20px' }}>
            <Skeleton height={20} />
            <Skeleton height={200} />
          </div>
        </div>
      )}

      {/* Evaluating Answer Loading */}
      {evaluatingAnswer && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px', alignItems: 'center', justifyContent: 'center', padding: '60px 0', textAlign: 'center' }}>
          <Terminal className="rotating-brain" style={{ width: '48px', height: '48px', color: 'var(--accent-purple)' }} />
          <div className="typing-cursor" style={{ fontSize: 'var(--text-md)', fontWeight: 600, color: 'var(--accent-purple)', letterSpacing: '0.05em' }}>
            GRADING RESPONSE QUALITY & COMPREHENSIVENESS...
          </div>
          <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>
            Checking key verbs, architecture definitions, and STAR methods.
          </p>
          <div style={{ width: '100%', maxWidth: '600px', display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '20px' }}>
            <Skeleton height={20} />
            <Skeleton height={150} />
          </div>
        </div>
      )}

      {/* Answering State */}
      {sessionState === 'answering' && questions.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', width: '100%' }}>
          
          {/* Progress Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: 'var(--text-secondary)', fontSize: 'var(--text-xs)', fontWeight: 600 }}>
              <Clock style={{ width: '16px', height: '16px' }} />
              <span>TIME ELAPSED: {formatTime(seconds)}</span>
            </div>
            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--accent-primary)', fontWeight: 700 }}>
              Session Active
            </span>
          </div>

          {/* Progress line */}
          <div style={{ height: '4px', backgroundColor: 'var(--bg-elevated)', borderRadius: '2px', overflow: 'hidden' }}>
            <div style={{ height: '100%', backgroundColor: 'var(--accent-primary)', width: `${currentProgress}%`, transition: 'width 300ms ease' }} />
          </div>

          <QuestionCard
            question={questions[currentIdx]}
            currentIndex={currentIdx + 1}
            totalQuestions={questions.length}
            onSubmitAnswer={handleSubmitAnswer}
            onSkip={handleSkip}
            loading={evaluatingAnswer}
          />
        </div>
      )}

      {/* Viewing Feedback State */}
      {sessionState === 'viewing_feedback' && currentFeedback && !evaluatingAnswer && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', width: '100%' }}>
          <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 600, fontFamily: 'var(--font-display)' }}>
            Response Scorecard
          </h3>
          <FeedbackPanel 
            feedback={currentFeedback} 
            onNext={handleNext} 
            isLastQuestion={currentIdx === questions.length - 1} 
          />
        </div>
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

      {/* Wizard Form */}
      {sessionState === 'setup' && (
        <Card hoverable={false} style={{ maxWidth: '960px', margin: '0 auto', width: '100%', padding: '32px' }}>
          <SetupForm onGenerate={handleGenerate} loading={loadingQuestions} />
        </Card>
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
