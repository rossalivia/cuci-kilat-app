'use client';

import { useEffect } from 'react';

export default function HomePage() {
  useEffect(() => {
    window.location.replace('/order/');
  }, []);

  return (
    <div className="state-box">
      <div className="state-icon">⏳</div>
      <h2 className="state-title">Memuat Cuci Kilat...</h2>
      <p className="state-desc">Mengarahkan ke halaman Order...</p>
    </div>
  );
}
