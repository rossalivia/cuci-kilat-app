'use client';

export default function ConfirmDialog({
  isOpen,
  title = 'Konfirmasi Tindakan',
  message = 'Apakah Anda yakin ingin melanjutkan tindakan ini?',
  confirmLabel = 'Hapus',
  cancelLabel = 'Batal',
  danger = true,
  onConfirm,
  onCancel,
}) {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true" data-testid="confirm-dialog">
      <div className="modal-box">
        <h3 className="modal-title">{title}</h3>
        <p className="state-desc" style={{ textAlign: 'left', marginBottom: '1rem' }}>
          {message}
        </p>
        <div className="modal-actions">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={onCancel}
            data-testid="cancel-action-button"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            className={`btn ${danger ? 'btn-danger' : 'btn-primary'}`}
            onClick={onConfirm}
            data-testid="confirm-action-button"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
