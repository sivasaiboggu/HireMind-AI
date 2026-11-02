import React, { useState } from 'react';
import { KeyRound } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { readStoredGeminiKey, saveStoredGeminiKey, clearStoredGeminiKey } from '../../services/ai-key';

interface Props {
  variant?: 'icon' | 'row';
  onOpen?: () => void;
}

/** Connect-Google-AI-key control: icon button for the desktop top bar,
 *  menu row for the mobile menu. The modal portals to document.body. */
export const GoogleAIKeyConnect: React.FC<Props> = ({ variant = 'icon', onOpen }) => {
  const [open, setOpen] = useState(false);
  const [keyInput, setKeyInput] = useState('');
  const [connected, setConnected] = useState(() => readStoredGeminiKey() !== '');

  const openModal = () => {
    setKeyInput('');
    setOpen(true);
    onOpen?.();
  };

  return (
    <>
      {variant === 'icon' ? (
        <button
          onClick={openModal}
          className="btn-press"
          style={{
            position: 'relative',
            color: connected ? 'var(--accent-primary)' : 'var(--text-secondary)',
            padding: '6px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: '50%',
            backgroundColor: 'var(--bg-surface)',
            border: '1px solid var(--border-subtle)',
            cursor: 'pointer'
          }}
          title={connected ? 'Google AI key connected' : 'Connect your free Google AI key'}
        >
          <KeyRound style={{ width: '18px', height: '18px' }} />
        </button>
      ) : (
        <button
          onClick={openModal}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            fontSize: '1.125rem',
            color: connected ? 'var(--accent-primary)' : 'var(--text-primary)',
            padding: '12px 16px',
            borderRadius: 'var(--radius-md)',
            backgroundColor: 'transparent',
            textAlign: 'left'
          }}
        >
          <KeyRound style={{ width: '24px', height: '24px' }} />
          {connected ? 'Google AI key connected' : 'Connect Google AI key'}
        </button>
      )}

      <Modal isOpen={open} onClose={() => setOpen(false)} title="Connect Google AI">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
            HireMind's AI features (resume analysis, interview questions, roadmaps) run with your own free Google AI key.
            The key is saved only in this browser and is sent only to Google when you use an AI feature.
          </p>
          <a
            href="https://aistudio.google.com/apikey"
            target="_blank"
            rel="noopener noreferrer"
            style={{ fontSize: 'var(--text-sm)', fontWeight: 600 }}
          >
            Get a free key from Google AI Studio
          </a>
          <div>
            <label htmlFor="gemini-key-input">Your Google AI key</label>
            <input
              id="gemini-key-input"
              type="password"
              value={keyInput}
              onChange={(e) => setKeyInput(e.target.value)}
              placeholder={connected ? 'A key is connected - paste a new one to replace it' : 'Paste your key here'}
              autoComplete="off"
              style={{ marginTop: '6px' }}
            />
          </div>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <Button
              onClick={() => {
                if (!keyInput.trim()) return;
                saveStoredGeminiKey(keyInput);
                setConnected(true);
                setOpen(false);
              }}
              disabled={!keyInput.trim()}
            >
              Save and connect
            </Button>
            {connected && (
              <Button
                variant="danger"
                onClick={() => {
                  clearStoredGeminiKey();
                  setConnected(false);
                  setOpen(false);
                }}
              >
                Remove key
              </Button>
            )}
          </div>
        </div>
      </Modal>
    </>
  );
};
