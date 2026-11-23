/**
 * Jobs-index semantic search: a searchable index of job descriptions that
 * answers "which roles match this resume?" by embedding similarity.
 *
 * HireMind could already audit a resume against a job description the user
 * pasted, but it had no index of roles to search — every match needed the
 * job description typed in by hand. This module is that index: each posting
 * is embedded once, a query (resume or job text) is embedded the same way,
 * and results are ordered by cosine similarity.
 *
 * The embedder is injected (dependency injection, like AuditMind's rag.ts):
 * the app passes the Gemini text-embedding-004 adapter, tests pass a
 * deterministic fake, and nobody ever substitutes a fabricated vector.
 * An embedder that returns null means "unavailable" — the posting is
 * reported in `skipped`, never silently dropped and never given a fake
 * zero vector. An embedder that throws fails loudly; the caller must show
 * the real error (for example, "connect a Gemini key first").
 *
 * Seed data is clearly-marked SAMPLE data: example postings written for
 * this index, not live roles. The index accepts any postings the caller
 * supplies; the samples exist so the feature works out of the box.
 */

export interface JobPosting {
  id: string;
  title: string;
  company: string;
  location: string;
  description: string;
  /** Where the posting came from — 'Sample' means example data, not a live role. */
  source: string;
}

export interface IndexedJob extends JobPosting {
  embedding: number[];
}

export interface JobsIndex {
  jobs: IndexedJob[];
  /** Postings whose embedding was unavailable and so are not searchable. */
  skipped: string[];
}

export interface JobSearchHit {
  job: JobPosting;
  /** Cosine similarity, 0–1, rounded to 3 decimals. */
  similarity: number;
}

/** An embedder returns a vector, or null when embeddings are unavailable. */
export type Embedder = (text: string) => Promise<number[] | null>;

/**
 * Cosine similarity. Returns 0 when either vector is empty, the lengths
 * differ, or a vector has zero length — no similarity is claimed from
 * unusable vectors.
 */
export function cosineSimilarity(a: number[], b: number[]): number {
  if (!Array.isArray(a) || !Array.isArray(b) || a.length === 0 || a.length !== b.length) return 0;
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i++) {
    const x = a[i];
    const y = b[i];
    if (!Number.isFinite(x) || !Number.isFinite(y)) return 0;
    dot += x * y;
    normA += x * x;
    normB += y * y;
  }
  if (normA === 0 || normB === 0) return 0;
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

function searchableText(job: JobPosting): string {
  return `${job.title}\n${job.description}`;
}

/** Embed every posting once. Postings with no embedding are reported, not faked. */
export async function buildJobsIndex(jobs: JobPosting[], embed: Embedder): Promise<JobsIndex> {
  const indexed: IndexedJob[] = [];
  const skipped: string[] = [];
  for (const job of jobs) {
    const embedding = await embed(searchableText(job));
    if (embedding === null) {
      skipped.push(job.id);
      continue;
    }
    indexed.push({ ...job, embedding });
  }
  return { jobs: indexed, skipped };
}

/**
 * Search the index with a query string (a resume, a job description, or
 * plain keywords). Returns at most `topK` hits ordered by similarity,
 * highest first. An empty query or an unavailable query embedding returns
 * no hits rather than a made-up ranking.
 */
export async function searchJobsIndex(
  index: JobsIndex,
  query: string,
  embed: Embedder,
  topK = 5,
): Promise<JobSearchHit[]> {
  if (typeof query !== 'string' || !query.trim()) return [];
  if (index.jobs.length === 0) return [];
  const queryEmbedding = await embed(query);
  if (queryEmbedding === null) return [];
  const hits = index.jobs
    .map((job) => ({
      job: {
        id: job.id,
        title: job.title,
        company: job.company,
        location: job.location,
        description: job.description,
        source: job.source,
      },
      similarity: Math.round(cosineSimilarity(queryEmbedding, job.embedding) * 1000) / 1000,
    }))
    .sort((a, b) => b.similarity - a.similarity);
  return hits.slice(0, Math.max(0, Math.floor(topK)));
}

/**
 * Sample postings so the index works out of the box. These are EXAMPLE
 * postings written for this feature — not live roles, not scraped listings.
 * Every sample carries source 'Sample' so the UI can label it honestly.
 */
export const SAMPLE_JOBS: JobPosting[] = [
  {
    id: 'sample-ai-ml-intern',
    title: 'AI/ML Engineer Intern',
    company: 'Sample employer',
    location: 'Remote, India',
    description:
      'Build LLM-powered features with Python and FastAPI. Work with RAG pipelines, BERT embeddings and LangChain agents. Evaluate LLM output quality and ship backend features to production. Experience with PostgreSQL, Docker and structured outputs from language models.',
    source: 'Sample',
  },
  {
    id: 'sample-llm-agents-engineer',
    title: 'Software Engineer, LLM Agents',
    company: 'Sample employer',
    location: 'Bengaluru, India',
    description:
      'Build LLM-powered agents that use tools and remember context. Match people to jobs through retrieval, ranking and personalisation. Run semantic search over a large, constantly changing jobs index. Strong Python backends, SQL and APIs, embeddings, prompt engineering and structured outputs.',
    source: 'Sample',
  },
  {
    id: 'sample-frontend-engineer',
    title: 'Frontend Engineer',
    company: 'Sample employer',
    location: 'Remote, India',
    description:
      'Build responsive product interfaces with React, TypeScript and Next.js. Own design systems, state management with Zustand, accessibility and performance budgets. Work closely with designers and ship features every week.',
    source: 'Sample',
  },
  {
    id: 'sample-backend-engineer',
    title: 'Backend Engineer',
    company: 'Sample employer',
    location: 'Bengaluru, India',
    description:
      'Build and operate Python backends with FastAPI and PostgreSQL. Design tables and queries for a real system, expose REST APIs, and keep services reliable with Docker, CI/CD and observability. Experience with Redis, queues and cloud deploys on AWS.',
    source: 'Sample',
  },
  {
    id: 'sample-data-analyst',
    title: 'Data Analyst',
    company: 'Sample employer',
    location: 'Mumbai, India',
    description:
      'Turn product data into decisions with SQL, Python and dashboards. Define metrics, run funnel and cohort analysis, and present findings to product and engineering teams. Experience with PostgreSQL, spreadsheets and data visualisation.',
    source: 'Sample',
  },
  {
    id: 'sample-devops-engineer',
    title: 'DevOps Engineer',
    company: 'Sample employer',
    location: 'Remote, India',
    description:
      'Own cloud infrastructure on AWS with Terraform and Kubernetes. Build CI/CD pipelines, Docker images and monitoring. Automate deployments, manage secrets safely and keep production reliable around the clock.',
    source: 'Sample',
  },
];
