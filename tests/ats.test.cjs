const { test } = require('node:test');
const assert = require('node:assert/strict');
const { mkdtempSync, rmSync } = require('node:fs');
const { tmpdir } = require('node:os');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const output = mkdtempSync(path.join(tmpdir(), 'hiremind-ats-tests-'));
process.on('exit', () => rmSync(output, { recursive: true, force: true }));
execFileSync(process.execPath, [require.resolve('typescript/bin/tsc'),
  'src/services/ats.ts', '--module', 'commonjs', '--target', 'es2022',
  '--skipLibCheck', '--outDir', output]);
const { analyzeResumeLocally, extractJobKeywords } = require(path.join(output, 'services/ats.js'));

const STRONG_RESUME = `
Sivasai Boggu
siva@example.com | +91 9573719115 | linkedin.com/in/sivasai-b

Summary
Software developer focused on AI agents and full-stack products.

Work Experience
Software Developer Intern — Whispry
- Built a React dashboard that served 1200 users and reduced load time by 40%.
- Automated reporting pipelines, saving 15 hours per week.
- Led migration of 3 services to Docker, improving deploy frequency by 2x.

Education
BTech Computer Science, IIIT Kottayam, 2023-2027

Skills
Python, TypeScript, React, LangGraph, LangChain, FastAPI, PostgreSQL, Docker

Projects
HireMind AI — React/TypeScript resume analysis app using Gemini.
`;

const JD = 'We need a Python and TypeScript developer with React, LangGraph and FastAPI experience, Docker and PostgreSQL.';

test('strong resume scores high and matches JD keywords', () => {
  const result = analyzeResumeLocally(STRONG_RESUME, JD);
  assert.ok(result.atsScore >= 70, `atsScore ${result.atsScore} should be >= 70`);
  assert.ok(result.overallScore >= 60);
  assert.ok(result.matchedKeywords.includes('python'));
  assert.ok(result.matchedKeywords.includes('react'));
  assert.equal(result.missingKeywords.length, 0);
  assert.ok(result.sections.every((s) => s.score === 100 || s.name === 'Certifications'));
});

test('empty resume scores 0 and recommends sections', () => {
  const result = analyzeResumeLocally('', JD);
  assert.equal(result.atsScore, 0);
  assert.equal(result.overallScore, 0);
  assert.ok(result.missingKeywords.length > 0);
  assert.ok(result.recommendations.some((r) => r.id === 'rec-empty'));
  assert.ok(result.recommendations.some((r) => r.id === 'rec-keywords'));
});

test('missing keywords are reported, never invented', () => {
  const result = analyzeResumeLocally('Jane Doe\nsiva@example.com\nWork Experience\nDid things.', 'Kubernetes Terraform AWS');
  assert.deepEqual(result.missingKeywords.sort(), ['aws', 'kubernetes', 'terraform']);
  assert.deepEqual(result.matchedKeywords, []);
  assert.deepEqual(result.rewrites, []);
});

test('deterministic: same input gives identical output', () => {
  const a = analyzeResumeLocally(STRONG_RESUME, JD);
  const b = analyzeResumeLocally(STRONG_RESUME, JD);
  assert.deepEqual(a, b);
});

test('keyword coverage matches whole tokens, never substrings', () => {
  const resume = 'Jordan Lee\njordan@example.com\nWork Experience\nReduced storage costs across distributed systems.';
  const jd = 'Looking for RAG and Red experience.';
  const result = analyzeResumeLocally(resume, jd);
  assert.deepEqual(result.matchedKeywords, []);
  assert.deepEqual(result.missingKeywords.sort(), ['rag', 'red']);
  const honest = analyzeResumeLocally(resume + '\nSkills\nRAG pipelines', jd);
  assert.ok(honest.matchedKeywords.includes('rag'));
  assert.ok(!honest.matchedKeywords.includes('red'));
});

test('dotted keywords like node.js match their head name too', () => {
  const result = analyzeResumeLocally('Skills\nNode.js, TypeScript', 'node.js wanted');
  assert.ok(result.matchedKeywords.includes('node.js'));
  // "Node" names the same skill as "Node.js": a resume listing one satisfies
  // a job description asking for the other, in either direction. Round 6
  // kept these apart as whole tokens, which cost resumes points for a skill
  // they plainly had. "js" alone still does not satisfy "node.js".
  const headOnly = analyzeResumeLocally('Skills\nNode, TypeScript', 'node.js wanted');
  assert.ok(headOnly.matchedKeywords.includes('node.js'));
  const dottedOnly = analyzeResumeLocally('Skills\nNode.js, TypeScript', 'We need Node developers');
  assert.ok(dottedOnly.matchedKeywords.includes('node'));
  const jsOnly = analyzeResumeLocally('Skills\nJS, TypeScript', 'node.js wanted');
  assert.ok(!jsOnly.matchedKeywords.includes('node.js'));
  // Version numbers do not cross-match: 3.11 is not 3.12, and neither is "3".
  const versions = analyzeResumeLocally('Skills\nPython 3.12', 'Python 3.11 experience');
  assert.ok(!versions.matchedKeywords.includes('3.11'));
});

test('keyword matching is whole-token, not substring', () => {
  // "javascript" must not count as "java", and "reaction" must not count as "react".
  const result = analyzeResumeLocally(
    'Jane Doe\nsiva@example.com\nWork Experience\nBuilt a JavaScript app with quick reaction times.',
    'Java React',
  );
  assert.deepEqual(result.matchedKeywords, []);
  assert.deepEqual(result.missingKeywords.sort(), ['java', 'react']);
});

test('keyword extraction drops stopwords and ranks by frequency', () => {
  const keywords = extractJobKeywords('Python Python Python and the team with React');
  assert.equal(keywords[0], 'python');
  assert.ok(!keywords.includes('the'));
  assert.ok(!keywords.includes('and'));
});

test('scores stay within 0-100 for pathological input', () => {
  const result = analyzeResumeLocally('x '.repeat(5000), 'a'.repeat(200));
  for (const key of ['atsScore', 'contentScore', 'formatScore', 'overallScore']) {
    assert.ok(result[key] >= 0 && result[key] <= 100, `${key}=${result[key]}`);
  }
});

test('education year ranges are not mistaken for a phone number', () => {
  // "2023-2027" used to match the phone regex, crediting a phone number
  // the resume never had — both in the format score and the Contact
  // Information section.
  const result = analyzeResumeLocally(
    'Jane Doe\nEducation\nBTech Computer Science, 2023-2027\nWork Experience\nBuilt things.',
    'Python developer',
  );
  assert.equal(result.atsChecklist.find((c) => c.label === 'Phone number present').checked, false);
  assert.equal(result.sections.find((s) => s.name === 'Contact Information').score, 0);
  // A real 10-digit number still counts, with or without a country code.
  const withPhone = analyzeResumeLocally(
    'Jane Doe\njane@example.com | +91 9573719115\nEducation\nBTech, 2023-2027\nWork Experience\nBuilt things.',
    'Python developer',
  );
  assert.equal(withPhone.atsChecklist.find((c) => c.label === 'Phone number present').checked, true);
  assert.equal(withPhone.sections.find((s) => s.name === 'Contact Information').score, 100);
});

test('C++ and C# survive tokenizing and match as whole keywords', () => {
  const result = analyzeResumeLocally(
    'Dev\ndev@example.com\nSkills\nC++, C#, Python\nWork Experience\nBuilt systems.',
    'We need C++ and C# developers.',
  );
  assert.ok(result.matchedKeywords.includes('c++'), `matched: ${result.matchedKeywords}`);
  assert.ok(result.matchedKeywords.includes('c#'), `matched: ${result.matchedKeywords}`);
  assert.ok(!result.missingKeywords.includes('c++'));
  assert.ok(!result.missingKeywords.includes('c#'));
});

test('en-dash, middle-dot and numbered bullets count toward content', () => {
  // PDF extraction preserves the bullet glyphs resumes actually use; only
  // counting • - * scored most pasted resumes as having no bullets at all.
  const verbs = ['Built', 'Reduced', 'Automated', 'Led', 'Shipped', 'Improved', 'Deployed', 'Migrated'];
  const bullets = verbs.map((v, i) => `– ${v} systems and cut costs by ${10 + i}%`).join('\n');
  const withBullets = analyzeResumeLocally(
    `Dev\ndev@example.com\nWork Experience\n${bullets}`,
    'Python developer',
  );
  const plain = analyzeResumeLocally(
    `Dev\ndev@example.com\nWork Experience\n${verbs.map((v, i) => `${v} systems and cut costs by ${10 + i}%`).join('\n')}`,
    'Python developer',
  );
  assert.equal(withBullets.contentScore, 100);
  assert.ok(plain.contentScore < withBullets.contentScore,
    `plain ${plain.contentScore} should score below bulleted ${withBullets.contentScore}`);
  const numbered = analyzeResumeLocally(
    `Dev\ndev@example.com\nWork Experience\n${verbs.map((v, i) => `${i + 1}. ${v} systems and cut costs by ${10 + i}%`).join('\n')}`,
    'Python developer',
  );
  assert.equal(numbered.contentScore, 100);
});

test('checklist checks sections by name, not by position', () => {
  // A resume with Skills but no Work Experience must check exactly those
  // two boxes — the old positional indexes would silently check the wrong
  // section if SECTION_PATTERNS were ever reordered.
  const result = analyzeResumeLocally(
    'Dev\ndev@example.com\nEducation\nBTech\nSkills\nPython, React',
    'Python developer',
  );
  const check = (label) => result.atsChecklist.find((c) => c.label === label).checked;
  assert.equal(check('Skills section'), true);
  assert.equal(check('Work experience section'), false);
  assert.equal(check('Education section'), true);
});
