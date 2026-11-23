const { test } = require('node:test');
const assert = require('node:assert/strict');
const { mkdtempSync, rmSync } = require('node:fs');
const { tmpdir } = require('node:os');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const output = mkdtempSync(path.join(tmpdir(), 'hiremind-jobs-index-tests-'));
process.on('exit', () => rmSync(output, { recursive: true, force: true }));
execFileSync(process.execPath, [require.resolve('typescript/bin/tsc'),
  'src/services/jobs-index.ts', '--module', 'commonjs', '--target', 'es2022',
  '--skipLibCheck', '--rootDir', 'src', '--outDir', output]);
const { cosineSimilarity, buildJobsIndex, searchJobsIndex, SAMPLE_JOBS } = require(path.join(output, 'services/jobs-index.js'));

/**
 * Deterministic stand-in for a real embedding model: a binary bag-of-words
 * vector over the vocabulary of the sample postings. Shared words raise the
 * cosine similarity; unrelated words lower it. No model, no key, no network.
 */
function fakeEmbedderFactory() {
  const vocab = [...new Set(SAMPLE_JOBS.flatMap((job) =>
    `${job.title} ${job.description}`.toLowerCase().match(/[a-z]{3,}/g) || []))].sort();
  const embed = async (text) => {
    const words = new Set(text.toLowerCase().match(/[a-z]{3,}/g) || []);
    const vector = vocab.map((word) => (words.has(word) ? 1 : 0));
    const norm = Math.sqrt(vector.reduce((sum, v) => sum + v * v, 0));
    return norm === 0 ? vector : vector.map((v) => v / norm);
  };
  return embed;
}

test('cosineSimilarity: identical is 1, orthogonal is 0, opposite is -1', () => {
  assert.equal(cosineSimilarity([1, 0], [1, 0]), 1);
  assert.equal(cosineSimilarity([1, 0], [0, 1]), 0);
  assert.equal(cosineSimilarity([1, 0], [-1, 0]), -1);
});

test('cosineSimilarity claims nothing from unusable vectors', () => {
  assert.equal(cosineSimilarity([], []), 0);
  assert.equal(cosineSimilarity([0, 0], [1, 0]), 0);
  assert.equal(cosineSimilarity([1, 0], [1, 0, 0]), 0);
  assert.equal(cosineSimilarity([NaN, 0], [1, 0]), 0);
});

test('buildJobsIndex embeds every sample posting', async () => {
  const index = await buildJobsIndex(SAMPLE_JOBS, fakeEmbedderFactory());
  assert.equal(index.jobs.length, SAMPLE_JOBS.length);
  assert.deepEqual(index.skipped, []);
  assert.ok(index.jobs.every((job) => job.embedding.length > 0));
});

test('a Python + RAG + LangChain query ranks the AI/ML intern posting first', async () => {
  const index = await buildJobsIndex(SAMPLE_JOBS, fakeEmbedderFactory());
  const hits = await searchJobsIndex(index, 'Python developer with RAG pipelines and LangChain agents', fakeEmbedderFactory());
  assert.ok(hits.length > 0);
  assert.equal(hits[0].job.id, 'sample-ai-ml-intern');
  assert.ok(hits[0].similarity > hits[1].similarity);
  assert.ok(hits.every((hit) => hit.similarity >= 0 && hit.similarity <= 1));
});

test('a React + TypeScript query ranks the frontend posting first', async () => {
  const index = await buildJobsIndex(SAMPLE_JOBS, fakeEmbedderFactory());
  const hits = await searchJobsIndex(index, 'React TypeScript frontend engineer', fakeEmbedderFactory());
  assert.equal(hits[0].job.id, 'sample-frontend-engineer');
});

test('topK limits the hits, in similarity order', async () => {
  const index = await buildJobsIndex(SAMPLE_JOBS, fakeEmbedderFactory());
  const hits = await searchJobsIndex(index, 'Python backend engineer', fakeEmbedderFactory(), 2);
  assert.equal(hits.length, 2);
  assert.ok(hits[0].similarity >= hits[1].similarity);
});

test('unavailable embeddings are reported, never faked', async () => {
  const nullEmbedder = async () => null;
  const index = await buildJobsIndex(SAMPLE_JOBS, nullEmbedder);
  assert.deepEqual(index.jobs, []);
  assert.deepEqual(index.skipped, SAMPLE_JOBS.map((job) => job.id));
  const hits = await searchJobsIndex(index, 'Python', nullEmbedder);
  assert.deepEqual(hits, []);
});

test('empty query and empty index return no hits', async () => {
  const index = await buildJobsIndex(SAMPLE_JOBS, fakeEmbedderFactory());
  assert.deepEqual(await searchJobsIndex(index, '   ', fakeEmbedderFactory()), []);
  assert.deepEqual(await searchJobsIndex({ jobs: [], skipped: [] }, 'Python', fakeEmbedderFactory()), []);
});

test('sample postings are labelled as samples, not live roles', () => {
  assert.ok(SAMPLE_JOBS.length >= 5);
  assert.ok(SAMPLE_JOBS.every((job) => job.source === 'Sample'));
  assert.ok(SAMPLE_JOBS.every((job) => job.id && job.title && job.description.trim()));
});
