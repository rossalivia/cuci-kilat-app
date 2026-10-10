'use client';

import { useEffect } from 'react';

export default function Toast({ toast, onClose }) {
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => {
      onClose();
    }, 3500);
    return () => clearTimeout(timer);
  }, [toast, onClose]);

  if (!toast) return null;

  const isError = toast.type === 'error';

  return (
    <div className="toast-container" data-testid="toast-notification">
      <div className={`toast ${isError ? 'toast-error' : 'toast-success'}`}>
        <span>{isError ? '❌' : '✅'}</span>
        <span>{toast.message}</span>
      </div>
    </div>
  );
}
