
import { useEffect } from 'react';

export default function FullscreenModal({ open, onClose, title, children }) {
  if (!open) return null;

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose?.(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className="modal-backdrop" onClick={(e) => { if (e.target === e.currentTarget) onClose?.(); }}>
      <div className="modal-shell">
        <div className="modal-header">
          <span>{title}</span>
          <button className="modal-close" onClick={onClose} aria-label="סגור">✖</button>
        </div>
        <div className="modal-body">
          {children}
        </div>
      </div>
    </div>
  );
}