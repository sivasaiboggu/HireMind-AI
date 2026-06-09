import React, { useState, useEffect, useRef } from 'react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Skeleton } from '../components/ui/Skeleton';
import { useGemini } from '../hooks/useGemini';
import { gemini } from '../services/gemini';
import { useAppStore } from '../store/appStore';
import { QuizQuestion } from '../types';
import { 
  Zap, 
  Clock, 
  HelpCircle, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  ArrowRight, 
  RefreshCw,
  Plus,
  X,
  Compass,
  Code
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import '../styles/globals.css';
import '../styles/animations.css';

type QuizState = 'setup' | 'loading' | 'active' | 'results';

const formatTime = (secs: number) => {
  const mm = String(Math.floor(secs / 60)).padStart(2, '0');
  const ss = String(secs % 60).padStart(2, '0');
  return `${mm}:${ss}`;
};

export const QuizPractice: React.FC = () => {
  const navigate = useNavigate();
  const { addToast } = useAppStore();
  const { execute: getQuiz, loading, error, reset } = useGemini(gemini.generateQuizQuestions, 10);

  const [quizState, setQuizState] = useState<QuizState>('setup');
  const [jobRole, setJobRole] = useState('');
  const [techStack, setTechStack] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [userAnswers, setUserAnswers] = useState<Record<string, string>>({});
  const [fillInput, setFillInput] = useState('');

  // Timers
  const [secondsLeft, setSecondsLeft] = useState(60); // 60s per question
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const [totalTime, setTotalTime] = useState(0);
  const totalTimerRef = useRef<NodeJS.Timeout | null>(null);

  const presetTags = ['React', 'TypeScript', 'Node.js', 'Python', 'SQL', 'Git'];

  // Question Timer Effect
  useEffect(() => {
    if (quizState === 'active') {
      setSecondsLeft(60);
      timerRef.current = setInterval(() => {
        setSecondsLeft(prev => {
          if (prev <= 1) {
            handleNextQuestion('[No Answer - Time Expired]');
            return 60;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [quizState, currentIdx]);

  // Total Time Timer Effect
  useEffect(() => {
    if (quizState === 'active') {
      setTotalTime(0);
      totalTimerRef.current = setInterval(() => {
        setTotalTime(prev => prev + 1);
      }, 1000);
    } else {
      if (totalTimerRef.current) clearInterval(totalTimerRef.current);
    }
    return () => {
      if (totalTimerRef.current) clearInterval(totalTimerRef.current);
    };
  }, [quizState]);

  const addTag = (tag: string) => {
    const trimmed = tag.trim();
    if (trimmed && !techStack.includes(trimmed)) {
      setTechStack([...techStack, trimmed]);
    }
    setTagInput('');
  };

  const removeTag = (tag: string) => {
    setTechStack(techStack.filter(t => t !== tag));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addTag(tagInput);
    }
  };

  const getMockFallbackQuiz = (role: string, stack: string[]): QuizQuestion[] => {
    // Generate high quality fallback MCQs based on user stack inputs
    const stackKey = stack.length > 0 ? stack[0].toLowerCase() : 'general';
    
    if (stackKey.includes('react')) {
      return [
        {
          id: 'q-react-1',
          text: 'Which hook would you use to optimize performance by memoizing a computed value so it is only recalculated when dependencies change?',
          type: 'mcq',
          options: ['useCallback', 'useMemo', 'useRef', 'useState'],
          correctAnswer: 'useMemo',
          explanation: 'useMemo returns a memoized value, recomputing it only when one of its dependency parameters updates. useCallback memoizes the callback function definition itself.',
          category: 'technical'
        },
        {
          id: 'q-react-2',
          text: 'What is the correct syntax to define a component with state using TypeScript in functional React components?',
          codeSnippet: 'const [count, setCount] = useState<number>(0);',
          type: 'mcq',
          options: ['const [count, setCount] = useState(number)(0);', 'const [count, setCount] = useState<number>(0);', 'const count: number = useState(0);', 'const count = useState<number>(0);'],
          correctAnswer: 'const [count, setCount] = useState<number>(0);',
          explanation: 'React useState accepts a generic type argument inside angle brackets, e.g. <number>, to enforce type-safety on initial state and updater functions.',
          category: 'coding'
        },
        {
          id: 'q-react-3',
          text: 'Complete the line in the useEffect hook to execute cleanups only when the component unmounts.',
          codeSnippet: 'useEffect(() => {\n  console.log("Mounted");\n  return () => {\n    // [FILL IN THE BLANK]\n  };\n}, []);',
          type: 'coding-fill',
          options: [],
          correctAnswer: 'cleanup',
          explanation: 'An empty dependency array [] ensures the effect runs only once upon mounting, and the returned function acts as the cleanup method upon unmount.',
          category: 'coding'
        },
        {
          id: 'q-react-4',
          text: 'In React 18, what is the purpose of the startTransition API?',
          type: 'mcq',
          options: ['To handle CSS animations', 'To mark state updates as non-urgent transitions', 'To defer script loading in browsers', 'To start concurrent network queries'],
          correctAnswer: 'To mark state updates as non-urgent transitions',
          explanation: 'startTransition allows developers to mark specific state updates (like search filter listings) as non-urgent transitions, keeping UI inputs responsive.',
          category: 'technical'
        },
        {
          id: 'q-react-5',
          text: 'You have a disagreement with a product manager who wants to build a feature that will degrade React page load times. How do you handle it?',
          type: 'mcq',
          options: ['Build it anyway to avoid conflict', 'Refuse to build it and report to the engineering lead', 'Schedule a meeting, present performance audits, and suggest memoization/lazy loading alternatives', 'Tell the product manager the feature is impossible'],
          correctAnswer: 'Schedule a meeting, present performance audits, and suggest memoization/lazy loading alternatives',
          explanation: 'A collaborative, metrics-driven approach using code audits and constructive suggestions represents the optimal behavioral outcome.',
          category: 'behavioral'
        }
      ];
    }

    if (stackKey.includes('sql') || stackKey.includes('db')) {
      return [
        {
          id: 'q-sql-1',
          text: 'Which SQL clause is used to filter records generated by aggregate functions in grouped rows?',
          type: 'mcq',
          options: ['WHERE', 'HAVING', 'GROUP BY', 'ORDER BY'],
          correctAnswer: 'HAVING',
          explanation: 'The WHERE clause cannot be used with aggregate functions; HAVING is specifically evaluated post-grouping to filter aggregated values.',
          category: 'technical'
        },
        {
          id: 'q-sql-2',
          text: 'Identify the correct SQL keyword to join tables returning matching rows from both tables.',
          codeSnippet: 'SELECT orders.id, customers.name\nFROM orders\n[FILL IN THE BLANK] customers\nON orders.customer_id = customers.id;',
          type: 'coding-fill',
          options: [],
          correctAnswer: 'INNER JOIN',
          explanation: 'An INNER JOIN keyword filters and combines rows having matching keys in both left and right tables.',
          category: 'coding'
        },
        {
          id: 'q-sql-3',
          text: 'What is database normalization mainly used to prevent?',
          type: 'mcq',
          options: ['Data redundancy and inconsistencies', 'Database query execution speed', 'User authentication locks', 'Automatic index building'],
          correctAnswer: 'Data redundancy and inconsistencies',
          explanation: 'Normalization divides tables to eliminate redundancy and prevent anomalies during inserts, updates, and deletes.',
          category: 'technical'
        },
        {
          id: 'q-sql-4',
          text: 'Which type of index is used to store table rows physically in sorting order based on key values?',
          type: 'mcq',
          options: ['Non-clustered Index', 'Clustered Index', 'Unique Index', 'Bitmap Index'],
          correctAnswer: 'Clustered Index',
          explanation: 'A clustered index physicalizes the table rows order matching the index keys. Only one clustered index can exist per table.',
          category: 'technical'
        },
        {
          id: 'q-sql-5',
          text: 'How should you communicate a database schema migration failure to your team during a production release?',
          type: 'mcq',
          options: ['Silently rollback and hope nobody notices', 'Immediately alert stakeholders, present the rollback log, and outline the corrective action plan', 'Blame the cloud provider', 'Wait until the morning standup to mention it'],
          correctAnswer: 'Immediately alert stakeholders, present the rollback log, and outline the corrective action plan',
          explanation: 'Clear communication, transparent logging, and immediate rollback/mitigation strategy representing high professionalism.',
          category: 'behavioral'
        }
      ];
    }

    // Default General Tech Quiz
    return [
      {
        id: 'q-gen-1',
        text: 'What is the time complexity of searching for an element in a balanced binary search tree (BST) in the average case?',
        type: 'mcq',
        options: ['O(1)', 'O(N)', 'O(log N)', 'O(N log N)'],
        correctAnswer: 'O(log N)',
        explanation: 'Balanced BST divides search space in half with each node traversal, leading to an average logarithmic time complexity O(log N).',
        category: 'technical'
      },
      {
        id: 'q-gen-2',
        text: 'What is the output of the following JavaScript snippet?',
        codeSnippet: 'console.log(typeof null);',
        type: 'mcq',
        options: ['"null"', '"undefined"', '"object"', '"function"'],
        correctAnswer: '"object"',
        explanation: 'In JavaScript, typeof null returns "object". This is a historic bug in the language implementation that was never fixed to preserve backward compatibility.',
        category: 'coding'
      },
      {
        id: 'q-gen-3',
        text: 'Which Git command would you run to download changes from a remote repository and immediately merge them into your current local branch?',
        type: 'mcq',
        options: ['git fetch', 'git pull', 'git push', 'git clone'],
        correctAnswer: 'git pull',
        explanation: 'git pull runs git fetch under the hood and immediately executes git merge to integrate remote commits into the current active branch.',
        category: 'technical'
      },
      {
        id: 'q-gen-4',
        text: 'Fill in the blank key to complete a standard RESTful HTTP call requesting data creation on web servers.',
        codeSnippet: 'fetch("/api/users", {\n  method: "[FILL IN THE BLANK]",\n  body: JSON.stringify({ name: "Alice" })\n});',
        type: 'coding-fill',
        options: [],
        correctAnswer: 'POST',
        explanation: 'The HTTP POST method requests that the web server accepts the enclosed entity body as a new resource.',
        category: 'coding'
      },
      {
        id: 'q-gen-5',
        text: 'Your code review gets rejected with major layout change requests from a senior peer. How do you respond?',
        type: 'mcq',
        options: ['Ignore the comments and merge it anyway', 'Delete the branch and start over', 'Review comments constructively, ask clarifying questions on confusing points, and submit updates', 'Argue that the peer does not understand the goal'],
        correctAnswer: 'Review comments constructively, ask clarifying questions on confusing points, and submit updates',
        explanation: 'Constructive review loops, peer respect, and active feedback integration represent standard team proficiency.',
        category: 'behavioral'
      }
    ];
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!jobRole.trim()) return;

    setQuizState('loading');
    
    // Request quiz from Gemini
    const result = await getQuiz(jobRole, techStack.length > 0 ? techStack : ['General'], 5);
    
    if (result && result.length > 0) {
      setQuestions(result);
      setCurrentIdx(0);
      setUserAnswers({});
      setFillInput('');
      setQuizState('active');
    } else {
      // Quota exceeded fallback
      addToast('info', 'Gemini API limit reached. Loading local quiz fallback.');
      const fallback = getMockFallbackQuiz(jobRole, techStack);
      setQuestions(fallback);
      setCurrentIdx(0);
      setUserAnswers({});
      setFillInput('');
      setQuizState('active');
    }
  };

  const handleNextQuestion = (answer: string) => {
    const q = questions[currentIdx];
    setUserAnswers(prev => ({ ...prev, [q.id]: answer }));
    setFillInput('');

    const nextIndex = currentIdx + 1;
    if (nextIndex < questions.length) {
      setCurrentIdx(nextIndex);
    } else {
      setQuizState('results');
    }
  };

  const handleTextSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fillInput.trim()) return;
    handleNextQuestion(fillInput.trim());
  };

  const handleReset = () => {
    reset();
    setQuestions([]);
    setCurrentIdx(0);
    setUserAnswers({});
    setJobRole('');
    setTechStack([]);
    setQuizState('setup');
  };

  const getScore = () => {
    let score = 0;
    questions.forEach(q => {
      const uAns = userAnswers[q.id] || '';
      const cAns = q.correctAnswer;
      
      if (q.type === 'mcq') {
        if (uAns === cAns) score += 1;
      } else {
        // loose match for fill in blanks
        if (uAns.toLowerCase().replace(/\s+/g, '') === cAns.toLowerCase().replace(/\s+/g, '')) {
          score += 1;
        }
      }
    });
    return score;
  };

  const currentQuestion = questions[currentIdx];
  const finalScore = getScore();
  const percentage = questions.length > 0 ? Math.round((finalScore / questions.length) * 100) : 0;

  return (
    <div className="container" style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      
      {/* Header */}
      {quizState === 'setup' && (
        <div>
          <h2 style={{ fontSize: 'var(--text-3xl)', fontWeight: 600, fontFamily: 'var(--font-display)' }}>
            AI Quiz Practice
          </h2>
          <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', marginTop: '4px' }}>
            Test your knowledge! Practice with timed multiple-choice questions (MCQs) and coding snippets tailored to your stack.
          </p>
        </div>
      )}

      {/* Loading State */}
      {quizState === 'loading' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px', alignItems: 'center', justifyContent: 'center', padding: '60px 0', textAlign: 'center' }}>
          <RefreshCw className="rotating-brain" style={{ width: '48px', height: '48px', color: 'var(--accent-primary)' }} />
          <div className="typing-cursor" style={{ fontSize: 'var(--text-md)', fontWeight: 600, color: 'var(--accent-primary)', letterSpacing: '0.05em' }}>
            GENERATING TARGET PRACTICE QUIZ QUESTIONS...
          </div>
          <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>
            Assembling MCQs, syntax analysis problems, and code completion challenges.
          </p>
          <div style={{ width: '100%', maxWidth: '600px', display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '20px' }}>
            <Skeleton height={20} />
            <Skeleton height={140} />
          </div>
        </div>
      )}

      {/* Setup Form */}
      {quizState === 'setup' && (
        <Card hoverable={false} style={{ maxWidth: '800px', margin: '0 auto', width: '100%', padding: '32px' }}>
          <form onSubmit={handleGenerate} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            
            {/* Job Target */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label>Target Job Role</label>
              <input
                type="text"
                required
                placeholder="e.g. Frontend Developer"
                value={jobRole}
                onChange={(e) => setJobRole(e.target.value)}
                style={{ backgroundColor: 'var(--bg-elevated)' }}
              />
            </div>

            {/* Tech Stack tags */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label>Target Stack & Skills</label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  type="text"
                  placeholder="Add skill (e.g. React)"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  style={{ backgroundColor: 'var(--bg-elevated)' }}
                />
                <button
                  type="button"
                  onClick={() => addTag(tagInput)}
                  style={{
                    backgroundColor: 'var(--bg-elevated)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-md)',
                    width: '40px',
                    height: '40px',
                    color: 'var(--accent-primary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                  className="btn-press"
                >
                  <Plus style={{ width: '18px', height: '18px' }} />
                </button>
              </div>

              {/* Tag pills */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', minHeight: '32px' }}>
                {techStack.map(tag => (
                  <span
                    key={tag}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '4px 8px',
                      borderRadius: 'var(--radius-sm)',
                      backgroundColor: 'rgba(0, 212, 170, 0.1)',
                      border: '1px solid rgba(0, 212, 170, 0.2)',
                      color: 'var(--accent-primary)',
                      fontSize: '10px',
                      fontWeight: 600
                    }}
                  >
                    {tag}
                    <X onClick={() => removeTag(tag)} style={{ width: '10px', height: '10px', cursor: 'pointer' }} />
                  </span>
                ))}
              </div>

              {/* Presets */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {presetTags.map(tag => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => addTag(tag)}
                    style={{
                      fontSize: '9px',
                      color: 'var(--text-secondary)',
                      padding: '2px 6px',
                      backgroundColor: 'var(--bg-hover)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: '4px'
                    }}
                    className="btn-press"
                  >
                    +{tag}
                  </button>
                ))}
              </div>
            </div>

            <Button
              type="submit"
              variant="primary"
              disabled={loading || !jobRole.trim()}
              icon={<Zap style={{ width: '16px', height: '16px' }} />}
              style={{ padding: '16px 20px', borderRadius: 'var(--radius-md)', width: '100%', marginTop: '12px' }}
            >
              Generate Customized Practice Quiz
            </Button>
          </form>
        </Card>
      )}

      {/* Active Quiz Question Board */}
      {quizState === 'active' && currentQuestion && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '800px', margin: '0 auto', width: '100%' }}>
          
          {/* Header metadata */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>
              <HelpCircle style={{ width: '16px', height: '16px', color: 'var(--accent-primary)' }} />
              <span style={{ textTransform: 'uppercase', fontWeight: 700 }}>
                QUESTION {currentIdx + 1} OF {questions.length} ({currentQuestion.category})
              </span>
            </div>
            
            {/* Timer countdown */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: secondsLeft <= 15 ? 'var(--accent-danger)' : 'var(--accent-primary)' }}>
              <Clock style={{ width: '16px', height: '16px' }} />
              <span style={{ fontSize: 'var(--text-xs)', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>
                {secondsLeft}s
              </span>
            </div>
          </div>

          {/* Progress bar */}
          <div style={{ height: '4px', backgroundColor: 'var(--bg-elevated)', borderRadius: '2px', overflow: 'hidden' }}>
            <div 
              style={{ 
                height: '100%', 
                backgroundColor: 'var(--accent-primary)', 
                width: `${((currentIdx) / questions.length) * 100}%`,
                transition: 'width 250ms ease' 
              }} 
            />
          </div>

          {/* Main Question Card */}
          <Card hoverable={false} style={{ display: 'flex', flexDirection: 'column', gap: '20px', padding: '32px' }}>
            <h3 style={{ fontSize: 'var(--text-md)', fontWeight: 500, color: 'var(--text-primary)', lineHeight: 1.5 }}>
              {currentQuestion.text}
            </h3>

            {/* Render Code Snippet if present */}
            {currentQuestion.codeSnippet && (
              <div 
                style={{
                  backgroundColor: '#050A0F',
                  border: '1px solid rgba(255, 255, 255, 0.05)',
                  borderRadius: 'var(--radius-md)',
                  padding: '16px',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '11px',
                  lineHeight: 1.6,
                  color: '#E2E8F0',
                  whiteSpace: 'pre',
                  overflowX: 'auto',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px'
                }}
              >
                <Code style={{ width: '16px', height: '16px', color: 'var(--accent-purple)', flexShrink: 0, alignSelf: 'flex-start', marginTop: '4px' }} />
                <div>{currentQuestion.codeSnippet}</div>
              </div>
            )}

            {/* MCQ Option Selection Grid */}
            {currentQuestion.type === 'mcq' ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '12px' }}>
                {currentQuestion.options.map((opt, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleNextQuestion(opt)}
                    style={{
                      padding: '16px 20px',
                      borderRadius: 'var(--radius-md)',
                      backgroundColor: 'var(--bg-elevated)',
                      border: '1px solid var(--border-subtle)',
                      color: 'var(--text-primary)',
                      fontSize: 'var(--text-xs)',
                      fontWeight: 600,
                      textAlign: 'left',
                      transition: 'all 200ms ease'
                    }}
                    className="btn-press hover:border-[var(--accent-primary)] hover:bg-[var(--bg-hover)]"
                  >
                    {opt}
                  </button>
                ))}
              </div>
            ) : (
              /* Coding Fill in Blank input */
              <form onSubmit={handleTextSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '12px' }}>
                <input
                  autoFocus
                  required
                  type="text"
                  placeholder="Type the correct code output, function name, or syntax..."
                  value={fillInput}
                  onChange={(e) => setFillInput(e.target.value)}
                  style={{ backgroundColor: 'var(--bg-elevated)' }}
                />
                
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <button 
                    type="button" 
                    onClick={() => handleNextQuestion('[Question Skipped]')}
                    style={{ color: 'var(--text-muted)', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase' }}
                  >
                    Skip Question
                  </button>
                  <Button
                    type="submit"
                    variant="primary"
                    disabled={!fillInput.trim()}
                    style={{ padding: '8px 20px', borderRadius: 'var(--radius-md)' }}
                  >
                    Submit Answer
                  </Button>
                </div>
              </form>
            )}
          </Card>

        </div>
      )}

      {/* Quiz Results Panel & Error Analysis Board */}
      {quizState === 'results' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px', maxWidth: '840px', margin: '0 auto', width: '100%' }} className="page-enter">
          
          {/* Top Scorecard banner */}
          <Card hoverable={false} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '20px', padding: '40px 0', position: 'relative' }}>
            <h3 style={{ fontSize: 'var(--text-xl)', fontWeight: 600 }}>Practice Session Results</h3>
            
            {/* Score Ring */}
            <div style={{ position: 'relative', width: '112px', height: '112px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div 
                style={{
                  position: 'absolute',
                  inset: 0,
                  borderRadius: '50%',
                  border: '8px solid var(--bg-hover)',
                }}
              />
              <div 
                style={{
                  position: 'absolute',
                  inset: 0,
                  borderRadius: '50%',
                  border: `8px solid ${percentage >= 80 ? 'var(--accent-primary)' : percentage >= 50 ? 'var(--accent-secondary)' : 'var(--accent-danger)'}`,
                  clipPath: `polygon(50% 50%, -50% -50%, ${percentage >= 25 ? '150% -50%' : '50% -50%'}, ${percentage >= 50 ? '150% 150%' : '50% -50%'}, ${percentage >= 75 ? '-50% 150%' : '50% -50%'}, -50% -50%)`,
                  transform: 'rotate(45deg)'
                }}
              />
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <span style={{ fontSize: 'var(--text-2xl)', fontWeight: 700, fontFamily: 'var(--font-numeric)' }}>
                  {finalScore}/{questions.length}
                </span>
                <span style={{ fontSize: '9px', color: 'var(--text-secondary)', fontWeight: 700 }}>SCORE</span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '24px', fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>
              <span>Time Taken: <strong className="text-cyan">{formatTime(totalTime)}</strong></span>
              <span>•</span>
              <span>Accuracy Rating: <strong className={percentage >= 80 ? 'text-cyan' : percentage >= 50 ? 'text-amber' : 'text-rose'}>{percentage}%</strong></span>
            </div>
          </Card>

          {/* Error Analysis Board */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <h4 style={{ fontSize: 'var(--text-md)', fontWeight: 600 }}>Error Analysis & Explanation Board</h4>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {questions.map((q, idx) => {
                const uAns = userAnswers[q.id] || '';
                const cAns = q.correctAnswer;
                const isCorrect = q.type === 'mcq' 
                  ? uAns === cAns 
                  : uAns.toLowerCase().replace(/\s+/g, '') === cAns.toLowerCase().replace(/\s+/g, '');

                return (
                  <Card key={q.id} hoverable={false} style={{ display: 'flex', flexDirection: 'column', gap: '16px', borderColor: isCorrect ? 'var(--accent-primary)' : 'var(--accent-danger)' }}>
                    {/* Header */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <span style={{ fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--text-primary)' }}>
                        Question {idx + 1}. {q.category.toUpperCase()}
                      </span>
                      {isCorrect ? (
                        <span style={{ color: 'var(--accent-primary)', fontSize: '10px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <CheckCircle2 style={{ width: '14px', height: '14px' }} /> CORRECT
                        </span>
                      ) : (
                        <span style={{ color: 'var(--accent-danger)', fontSize: '10px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <XCircle style={{ width: '14px', height: '14px' }} /> INCORRECT
                        </span>
                      )}
                    </div>

                    {/* Question text */}
                    <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                      {q.text}
                    </p>

                    {/* Render snippet if existed */}
                    {q.codeSnippet && (
                      <div 
                        style={{
                          backgroundColor: '#050A0F',
                          border: '1px solid rgba(255, 255, 255, 0.05)',
                          borderRadius: 'var(--radius-sm)',
                          padding: '12px',
                          fontFamily: 'var(--font-mono)',
                          fontSize: '10px',
                          whiteSpace: 'pre',
                          color: '#E2E8F0'
                        }}
                      >
                        {q.codeSnippet}
                      </div>
                    )}

                    {/* Answers Comparison */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', padding: '12px', backgroundColor: 'var(--bg-elevated)', borderRadius: 'var(--radius-sm)', fontSize: '10px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: 'var(--text-secondary)' }}>Your Answer:</span>
                        <span style={{ fontWeight: 600, color: isCorrect ? 'var(--accent-primary)' : 'var(--accent-danger)' }}>{uAns}</span>
                      </div>
                      {!isCorrect && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--border-subtle)', paddingTop: '6px' }}>
                          <span style={{ color: 'var(--text-secondary)' }}>Correct Answer:</span>
                          <span style={{ fontWeight: 600, color: 'var(--accent-primary)' }}>{cAns}</span>
                        </div>
                      )}
                    </div>

                    {/* Concept Explanation */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '10px' }}>
                      <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>Concept Explanation:</span>
                      <p style={{ color: 'var(--text-secondary)', lineHeight: 1.4 }}>{q.explanation}</p>
                    </div>

                    {/* Suggested study path */}
                    {!isCorrect && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', borderRadius: '6px', backgroundColor: 'rgba(245, 158, 11, 0.03)', border: '1px solid rgba(245, 158, 11, 0.08)', fontSize: '9px', color: 'var(--text-secondary)' }}>
                        <AlertTriangle style={{ width: '12px', height: '12px', color: 'var(--accent-secondary)', flexShrink: 0 }} />
                        <span>
                          <strong>Recommended Path:</strong> Review standard specifications for <strong>{q.category}</strong> and implement local mock prototypes.
                        </span>
                      </div>
                    )}
                  </Card>
                );
              })}
            </div>
          </div>

          {/* Action CTAs */}
          <div style={{ display: 'flex', gap: '16px', width: '100%', marginTop: '12px' }}>
            <Button
              variant="primary"
              onClick={handleReset}
              icon={<RefreshCw style={{ width: '16px', height: '16px' }} />}
              style={{ flexGrow: 1 }}
            >
              Simulate New Quiz
            </Button>
            <Button
              variant="ghost"
              onClick={() => navigate('/roadmap')}
              icon={<Compass style={{ width: '16px', height: '16px' }} />}
              style={{ flexGrow: 1 }}
            >
              Generate Customized Roadmap
            </Button>
          </div>

        </div>
      )}

    </div>
  );
};
export default QuizPractice;
