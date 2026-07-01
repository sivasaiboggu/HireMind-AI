import React, { useState, useRef } from 'react';
import { UploadCloud, FileText, CheckCircle, AlertCircle, Zap } from 'lucide-react';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import * as pdfjsLib from 'pdfjs-dist';

// Configure the worker CDN source for PDF.js client-side text parsing
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://esm.sh/pdfjs-dist@4.10.38/build/pdf.worker.mjs';

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

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Extract raw text from PDF blocks using pdfjs-dist in the browser
  const extractTextFromPdf = async (file: File): Promise<string> => {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    let fullText = '';
    
    // Iterate through pages to pull token strings sequentially
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      fullText += textContent.items.map((item: any) => item.str).join(' ') + '\n';
    }
    return fullText;
  };

  const handleFile = async (file: File) => {
    if (file.type !== 'application/pdf') {
      setParseError('Only PDF resume documents are currently supported.');
      return;
    }
    setParsing(true);
    setParseError('');
    setFileName(file.name);
    try {
      const text = await extractTextFromPdf(file);
      setResumeText(text);
    } catch (err) {
      console.error(err);
      setParseError('Failed to parse text from the uploaded PDF document. Please try copy-pasting.');
    } finally {
      setParsing(false);
    }
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const onDragLeave = () => {
    setIsDragging(false);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const handleSelectFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  const triggerFileSelect = () => {
    fileInputRef.current?.click();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!jobRole.trim()) {
      setParseError('Target job role is required.');
      return;
    }
    if (!resumeText.trim()) {
      setParseError('Please upload a PDF resume or paste your resume text below.');
      return;
    }
    onAnalyze(resumeText, jobRole, experienceLevel, jobDescription);
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      {/* Target Config */}
      <div 
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr',
          gap: '24px',
        }}
        className="uploader-config-grid"
      >
        <style dangerouslySetInnerHTML={{__html: `
          @media (min-width: 768px) {
            .uploader-config-grid {
              grid-template-columns: 1fr 1fr !important;
            }
          }
        `}} />

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <label>Target Job Title</label>
          <input
            type="text"
            required
            placeholder="e.g. Senior Frontend Engineer"
            value={jobRole}
            onChange={(e) => setJobRole(e.target.value)}
          />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <label>Experience Tier</label>
          <select
            value={experienceLevel}
            onChange={(e) => setExperienceLevel(e.target.value)}
          >
            <option value="0-2 YEARS">Junior Level (0-2y)</option>
            <option value="2-5 YEARS">Experienced (2-5y)</option>
            <option value="5+ YEARS">Senior / Staff (5+y)</option>
            <option value="10+ YEARS">Principal / Executive (10+y)</option>
          </select>
        </div>
      </div>

      {/* Drag & Drop Box */}
      <div
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        onClick={triggerFileSelect}
        style={{
          border: isDragging ? '2px dashed var(--accent-primary)' : '2px dashed var(--border-active)',
          backgroundColor: isDragging ? 'var(--bg-hover)' : 'var(--bg-surface)',
          borderRadius: 'var(--radius-xl)',
          padding: '48px 24px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          transition: 'all 200ms ease',
          textAlign: 'center'
        }}
      >
        <input
          type="file"
          ref={fileInputRef}
          style={{ display: 'none' }}
          accept=".pdf"
          onChange={handleSelectFile}
        />
        
        {parsing ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
            <div 
              style={{
                width: '48px',
                height: '48px',
                border: '4px solid var(--accent-primary)',
                borderTopColor: 'transparent',
                borderRadius: '50%',
                animation: 'spinBrain 1s linear infinite'
              }}
            />
            <span style={{ fontSize: 'var(--text-sm)', color: 'var(--accent-primary)', fontWeight: 600 }}>
              DECONSTRUCTING RESUME DOCUMENT...
            </span>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
            <UploadCloud 
              className="floating-icon"
              style={{ 
                width: '48px', 
                height: '48px', 
                color: fileName ? 'var(--accent-primary)' : 'var(--text-muted)' 
              }} 
            />
            {fileName ? (
              <>
                <span style={{ fontSize: 'var(--text-sm)', color: 'var(--accent-primary)', fontWeight: 600 }}>
                  {fileName} loaded successfully
                </span>
                <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                  Click or drag another file to replace
                </span>
              </>
            ) : (
              <>
                <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text-primary)', fontWeight: 600 }}>
                  Drop your resume here or click to browse
                </span>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                  PDF documents only, up to 5MB
                </span>
              </>
            )}
          </div>
        )}
      </div>

      {parseError && (
        <div 
          style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '12px', 
            padding: '12px 16px', 
            backgroundColor: 'rgba(244, 63, 94, 0.1)', 
            border: '1px solid var(--accent-danger)', 
            borderRadius: 'var(--radius-md)',
            color: 'var(--accent-danger)',
            fontSize: 'var(--text-xs)',
            fontWeight: 600
          }}
        >
          <AlertCircle style={{ width: '16px', height: '16px', flexShrink: 0 }} />
          <span>{parseError}</span>
        </div>
      )}

      {/* Text fallback fields */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <label>Or paste resume text directly</label>
        <textarea
          rows={10}
          placeholder="Paste your professional credentials, work experience, and profile details..."
          value={resumeText}
          onChange={(e) => setResumeText(e.target.value)}
          style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', lineHeight: 1.6 }}
        />
      </div>

      {/* Target Job description field */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <label>Target Job Description (Optional, for precise keyword audit)</label>
        <textarea
          rows={5}
          placeholder="Paste job details or requirement lists here..."
          value={jobDescription}
          onChange={(e) => setJobDescription(e.target.value)}
          style={{ fontSize: 'var(--text-xs)', lineHeight: 1.5 }}
        />
      </div>

      {/* Clean button using Lucide icon prop instead of raw emoji */}
      <Button
        type="submit"
        variant="primary"
        loading={loading}
        disabled={loading || parsing || (!resumeText.trim() && !fileName)}
        icon={<Zap style={{ width: '16px', height: '16px' }} />}
        style={{ width: '100%', padding: '16px 20px', borderRadius: 'var(--radius-md)' }}
      >
        Initiate Career Document Audit
      </Button>
    </form>
  );
};
