import React, { useEffect, useId, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  maxWidth?: string;
  dismissible?: boolean;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen, onClose, title, children, maxWidth = '540px', dismissible = true,
}) => {
  const dialog = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  useEffect(() => {
    const element = dialog.current;
    if (!isOpen || !element) return;
    const previousFocus = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    element.showModal();
    document.body.style.overflow = 'hidden';
    return () => {
      element.close();
      document.body.style.overflow = previousOverflow;
      if (previousFocus instanceof HTMLElement && previousFocus.isConnected) previousFocus.focus();
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return createPortal(
    <dialog
      ref={dialog}
      className="workspace-dialog"
      style={{ maxWidth }}
      aria-labelledby={title ? titleId : undefined}
      aria-label={title ? undefined : 'Dialog'}
      onCancel={(event) => {
        event.preventDefault();
        if (dismissible) onClose();
      }}
      onClick={(event) => {
        if (dismissible && event.target === event.currentTarget) onClose();
      }}
    >
      <header className="dialog-title">
        {title && <h2 id={titleId}>{title}</h2>}
        {dismissible && (
          <button type="button" className="icon-control" aria-label="Close dialog" onClick={onClose}>
            <X size={18} aria-hidden="true" />
          </button>
        )}
      </header>
      <div className="dialog-content">{children}</div>
    </dialog>,
    document.body,
  );
};
