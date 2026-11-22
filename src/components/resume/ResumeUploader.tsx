import React, { useState, useRef } from 'react';
import { Upload, AlertCircle, ArrowRight } from 'lucide-react';
import { Button } from '../ui/Button';
import { z } from 'zod/mini';

const roleInput = z.string().check(z.trim(), z.minLength(1));

interface ResumeUploaderProps {
  onAnalyze: (resumeText: string, jobRole: string, experienceLevel: string, jobDescription?: string) => Promise<void>;
  loading: boolean;
}

export const ResumeUploader: React.FC<ResumeUploaderProps> = ({
  onAnalyze,
  loading
}) => {
  const [jobRole, setJobRole] = useState('');
  const [experienceLevel, setExperienceLevel] = useState('2-5 YEARS');
  const [resumeText, setResumeText] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [fileName, setFileName] = useState('');
  const [parsing, setParsing] = useState(false);
  const [parseError, setParseError] = useState('');
  // Drag-enter/leave fire per child element, so a bare boolean flickers as
  // the pointer crosses the dropzone's children. Count depth instead: the
  // highlight stays on until the drag truly leaves the whole dropzone.
  const dragDepth = useRef(0);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Extract raw text from PDF blocks using pdfjs-dist in the browser
  const extractTextFromPdf = async (file: File): Promise<string> => {
    const [pdfjs, arrayBuffer] = await Promise.all([import('pdfjs-dist'), file.arrayBuffer()]);
    pdfjs.GlobalWorkerOptions.workerSrc = 'https://esm.sh/pdfjs-dist@4.10.38/build/pdf.worker.mjs';
    const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;
    let fullText = '';
    
    // Resumes are a few pages; cap the work so a pathological multi-hundred
    // page PDF cannot hang the tab parsing page after page.
    const pages = Math.min(pdf.numPages, MAX_PDF_PAGES);
    for (let i = 1; i <= pages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      // TextMarkedContent items carry no .str — guard so "undefined" never
      // leaks into the extracted text.
      fullText += textContent.items.map((item: any) => item.str ?? '').join(' ') + '\n';
    }
    return fullText;
  };

  const MAX_FILE_BYTES = 5 * 1024 * 1024; // 5 MB — large scans waste parse time
  const MAX_PDF_PAGES = 40;
  const MIN_RESUME_WORDS = 20;

  const handleFile = async (file: File) => {
    // Some browsers and OS share dialogs report no MIME type (or a generic
    // octet-stream) for PDFs — accept by extension in that case instead of
    // rejecting a valid resume.
    const looksLikePdf = file.type === 'application/pdf' ||
      file.type === '' ||
      file.type === 'application/octet-stream';
    if (!looksLikePdf || !file.name.toLowerCase().endsWith('.pdf')) {
      setParseError('Only PDF resume documents are currently supported.');
      return;
    }
    if (file.size > MAX_FILE_BYTES) {
      setParseError(`That PDF is ${(file.size / 1024 / 1024).toFixed(1)} MB — please use a file under 5 MB.`);
      return;
    }
    setParsing(true);
    setParseError('');
    try {
      const text = await extractTextFromPdf(file);
      if (text.split(/\s+/).filter(Boolean).length < MIN_RESUME_WORDS) {
        setParseError('No readable text was found in this PDF. It may be a scanned image — please paste your resume text instead.');
        setResumeText('');
        setFileName('');
        return;
      }
      // Only claim success once the text is actually extracted — previously
      // the name was shown as "loaded successfully" even when parsing failed.
      setFileName(file.name);
      setResumeText(text);
    } catch (err) {
      console.error(err);
      setParseError('Failed to parse text from the uploaded PDF document. Please try copy-pasting.');
      setFileName('');
    } finally {
      setParsing(false);
    }
  };

  const onDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    dragDepth.current += 1;
    setIsDragging(true);
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const onDragLeave = () => {
    dragDepth.current = Math.max(0, dragDepth.current - 1);
    if (dragDepth.current === 0) setIsDragging(false);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    dragDepth.current = 0;
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  // Keyboard users cannot click the dropzone: Enter/Space opens the file
  // picker, and the focus ring comes from the global :focus-visible rule.
  const handleSelectFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    // Clear the input so picking the same file again still fires onChange.
    // Without this, re-selecting a file that failed to parse did nothing —
    // the value never changed, so no event fired and the user was stuck.
    e.target.value = '';
    if (file) handleFile(file);
  };

  const triggerFileSelect = () => {
    fileInputRef.current?.click();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const role = roleInput.safeParse(jobRole);
    if (!role.success) {
      setParseError('Enter the target role.');
      return;
    }
    if (!resumeText.trim()) {
      setParseError('Please upload a PDF resume or paste your resume text below.');
      return;
    }
    if (resumeText.split(/\s+/).filter(Boolean).length < MIN_RESUME_WORDS) {
      setParseError('That resume text looks too short to audit — please paste the full resume.');
      return;
    }
    void onAnalyze(resumeText, role.data, experienceLevel, jobDescription);
  };

  return (
    <form onSubmit={handleSubmit} className="form-stack form-work">
      <div className="control-pair">
        <label className="form-field">Target role
          <input required placeholder="Frontend engineer" value={jobRole} onChange={(event) => setJobRole(event.target.value)} />
        </label>
        <label className="form-field">Experience level
          <select value={experienceLevel} onChange={(event) => setExperienceLevel(event.target.value)}>
            <option value="0-2 YEARS">Junior (0–2 years)</option>
            <option value="2-5 YEARS">Experienced (2–5 years)</option>
            <option value="5+ YEARS">Senior or staff (5+ years)</option>
            <option value="10+ YEARS">Principal or executive (10+ years)</option>
          </select>
        </label>
      </div>

      <input type="file" ref={fileInputRef} hidden accept=".pdf" onChange={handleSelectFile} />
      <button
        type="button"
        className="upload-field"
        data-dragging={isDragging}
        onDragEnter={onDragEnter}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        onClick={triggerFileSelect}
        disabled={parsing}
        aria-busy={parsing}
      >
        {parsing ? <span className="busy-mark" aria-hidden="true" /> : <Upload size={20} aria-hidden="true" />}
        <span>
          <strong>{parsing ? 'Reading your PDF…' : fileName || 'Choose a resume PDF'}</strong>
          <small>{fileName ? 'Choose or drop a PDF to replace it' : 'Or drop a PDF here. Up to 5 MB.'}</small>
        </span>
      </button>

      {parseError && <p className="form-error" role="alert"><AlertCircle size={16} aria-hidden="true" />{parseError}</p>}

      <label className="form-field">Resume text
        <textarea rows={7} placeholder="Paste your resume or review the text extracted from your PDF." value={resumeText} onChange={(event) => setResumeText(event.target.value)} />
      </label>
      <label className="form-field">Job description <span className="muted">(optional)</span>
        <textarea rows={4} placeholder="Paste the job description to check its keywords." value={jobDescription} onChange={(event) => setJobDescription(event.target.value)} />
      </label>
      <Button type="submit" loading={loading} disabled={parsing || !resumeText.trim()}>
        Review resume <ArrowRight size={16} aria-hidden="true" />
      </Button>
    </form>
  );
};
