// Build a realistic seeded resume analysis (deterministic local audit)
// for screenshot renders. Writes scratch/seed-resume.json.
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const ROOT = path.dirname(fileURLToPath(import.meta.url)) + '/..';
const output = mkdtempSync(path.join(tmpdir(), 'hiremind-seed-'));
execFileSync(process.execPath, [path.join(ROOT, 'node_modules/typescript/bin/tsc'),
  'src/services/ats.ts',
  '--module', 'commonjs', '--target', 'es2022',
  '--skipLibCheck', '--outDir', output], { cwd: ROOT });
const { analyzeResumeLocally } = await import(path.join(output, 'services/ats.js'));

const RESUME = `
Sivasai Boggu
sivasaiboggu@gmail.com | +91 9573719115 | linkedin.com/in/sivasai-b | github.com/sivasaiboggu

Summary
Software developer focused on AI agents and full-stack products. Built
production chat agents, resume tooling and cloud security prototypes.

Work Experience
Software Developer Intern — Whispry, May 2026–Present
- Built a MERN support agent that cut first-response time by 40% for 2,000 monthly users
- Shipped 12 features with React and Node.js, improving onboarding completion by 18%
- Automated report generation, saving the team 6 hours every week

Software Developer Intern — NULLCLASS, Jul–Oct 2025
- Developed a Next.js learning platform used by 500 students
- Improved page load time by 35% through code splitting and caching

Education
BTech Computer Science — IIIT Kottayam, 2023–2027

Skills
Python, TypeScript, JavaScript, React, Next.js, Node.js, FastAPI,
PostgreSQL, MongoDB, PyTorch, LangChain, LangGraph, RAG, AWS, Docker

Projects
HireMind AI — React, TypeScript, Gemini. Resume analysis with ATS scoring.
AI SDR Agent — LangGraph agent that researches companies and drafts cold mail.
SecureFlow — Python, FastAPI, PyTorch. Cloud security anomaly detection.

Certifications
AWS Certified Cloud Practitioner
`;

const JD = `
We are hiring a software engineer. React, TypeScript, Node.js, PostgreSQL,
Docker, AWS, REST APIs, testing, CI/CD. Build full-stack products and ship
features with a small team. Experience with LangChain and RAG is a plus.
`;

const analysis = analyzeResumeLocally(RESUME, JD);
const saved = {
  ...analysis,
  id: 'seed-resume-1',
  timestamp: Date.now() - 2 * 60 * 60 * 1000,
  jobRole: 'Software Engineer',
  experienceLevel: 'Entry level',
  isLocalAudit: true,
};
writeFileSync(path.join(ROOT, 'scratch/seed-resume.json'), JSON.stringify([saved], null, 2));
rmSync(output, { recursive: true, force: true });
console.log('seed written:', saved.atsScore, 'ATS /', saved.overallScore, 'overall');
