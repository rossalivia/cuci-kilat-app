'use client';

export default function StateHandler({
  loading,
  error,
  empty,
  emptyTitle = 'Belum Ada Data',
  emptyMessage = 'Data belum tersedia di sistem.',
  addLabel = 'Tambah Data',
  onAdd,
  onRetry,
  children,
}) {
  if (loading) {
    return (
      <div className="skeleton-container" data-testid="loading-state">
        <div className="skeleton-card">
          <div className="skeleton-line" style={{ width: '60%' }}></div>
          <div className="skeleton-line" style={{ width: '40%' }}></div>
        </div>
        <div className="skeleton-card">
          <div className="skeleton-line" style={{ width: '75%' }}></div>
          <div className="skeleton-line" style={{ width: '50%' }}></div>
        </div>
        <div className="skeleton-card">
          <div className="skeleton-line" style={{ width: '55%' }}></div>
          <div className="skeleton-line" style={{ width: '35%' }}></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="state-box" data-testid="error-state">
        <div className="state-icon">⚠️</div>
        <h3 className="state-title">Terjadi Kesalahan</h3>
        <p className="state-desc">
          {typeof error === 'string'
            ? error
            : 'Gagal memuat data dari server. Periksa koneksi internet Anda.'}
        </p>
        {onRetry && (
          <button
            type="button"
            className="btn btn-primary"
            onClick={onRetry}
            data-testid="retry-button"
          >
            🔄 Coba Lagi
          </button>
        )}
      </div>
    );
  }

  if (empty) {
    return (
      <div className="state-box" data-testid="empty-state">
        <div className="state-icon">📭</div>
        <h3 className="state-title">{emptyTitle}</h3>
        <p className="state-desc">{emptyMessage}</p>
        {onAdd && (
          <button
            type="button"
            className="btn btn-primary"
            onClick={onAdd}
            data-testid="empty-add-button"
          >
            ➕ {addLabel}
          </button>
        )}
      </div>
    );
  }

  return children;
}
