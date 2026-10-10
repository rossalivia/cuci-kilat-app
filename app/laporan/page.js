'use client';

import { useState, useEffect } from 'react';
import StateHandler from '../../components/StateHandler';
import { initialOrder, getTodayDateString } from '../../lib/mockData';
import { calculateDailyReport } from '../../lib/businessRules';
import { db, isFirebaseConfigured } from '../../lib/firebase';
import { collection, getDocs, query, where } from 'firebase/firestore';

export default function LaporanPage() {
  const [selectedDate, setSelectedDate] = useState(getTodayDateString());
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadReportData = async () => {
    setLoading(true);
    setError(null);
    try {
      if (isFirebaseConfigured() && db) {
        const q = query(collection(db, 'order'), where('tanggal_masuk', '==', selectedDate));
        const snap = await getDocs(q);
        const orders = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        const res = calculateDailyReport(orders, selectedDate);
        setReport(res);
      } else {
        const savedOrders = localStorage.getItem('cuci_kilat_order');
        const orders = savedOrders ? JSON.parse(savedOrders) : initialOrder;
        const res = calculateDailyReport(orders, selectedDate);
        setReport(res);
      }
    } catch (err) {
      console.error('Error fetching report data:', err);
      setError('Gagal memuat data laporan harian dari server.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReportData();
  }, [selectedDate]);

  const handlePrintReport = () => {
    window.print();
  };

  return (
    <div>
      <div className="page-header-row">
        <div>
          <h1 className="page-title">Laporan Keuangan & Beban Harian</h1>
          <p className="page-desc">Rekapitulasi pendapatan kasir lunas, total timbangan, dan rincian per paket layanan</p>
        </div>
        <button
          type="button"
          className="btn btn-secondary no-print"
          onClick={handlePrintReport}
        >
          🖨️ Cetak Laporan
        </button>
      </div>

      {/* Date Filter */}
      <div className="card-clean no-print" style={{ marginBottom: '1.25rem' }}>
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="form-label">Pilih Tanggal Transaksi</label>
          <input
            type="date"
            className="form-input num-tabular"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
          />
        </div>
      </div>

      {/* 3-State Handler & Metrics */}
      <StateHandler
        loading={loading}
        error={error}
        empty={!report || report.total_order === 0}
        emptyTitle={`Belum Ada Transaksi pada ${selectedDate}`}
        emptyMessage="Tidak ada aktivitas cucian tercatat pada tanggal yang dipilih. Ubah tanggal atau input order baru."
        onRetry={loadReportData}
      >
        {report && (
          <div>
            {/* Metric Cards Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem', marginBottom: '1.25rem' }}>
              <div className="card-clean" style={{ marginBottom: 0 }}>
                <div style={{ fontSize: '0.775rem', color: 'var(--text-secondary)', fontWeight: '700' }}>
                  JUMLAH ORDER AKTIF
                </div>
                <div className="num-tabular" style={{ fontSize: '1.75rem', fontWeight: '800', color: 'var(--primary)', marginTop: '0.2rem' }}>
                  {report.total_order}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginTop: '0.15rem' }}>
                  transaksi non-batal
                </div>
              </div>

              <div className="card-clean" style={{ marginBottom: 0 }}>
                <div style={{ fontSize: '0.775rem', color: 'var(--text-secondary)', fontWeight: '700' }}>
                  TOTAL BEBAN CUCIAN
                </div>
                <div className="num-tabular" style={{ fontSize: '1.75rem', fontWeight: '800', color: '#d97706', marginTop: '0.2rem' }}>
                  {report.total_berat_kg} <span style={{ fontSize: '1rem', fontWeight: '700' }}>kg</span>
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginTop: '0.15rem' }}>
                  volume timbangan masuk
                </div>
              </div>

              <div className="card-clean" style={{ marginBottom: 0 }}>
                <div style={{ fontSize: '0.775rem', color: 'var(--text-secondary)', fontWeight: '700' }}>
                  TOTAL PENDAPATAN LUNAS
                </div>
                <div className="num-tabular" style={{ fontSize: '1.5rem', fontWeight: '800', color: '#16a34a', marginTop: '0.2rem' }}>
                  Rp{report.total_pendapatan?.toLocaleString('id-ID')}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginTop: '0.15rem' }}>
                  khusus order status &quot;diambil&quot;
                </div>
              </div>
            </div>

            {/* Rincian per Jenis Layanan */}
            <div className="card-clean">
              <h3 style={{ fontSize: '1.05rem', fontWeight: '800', marginBottom: '1rem', color: 'var(--text-primary)' }}>
                Distribusi & Rincian per Paket Layanan
              </h3>

              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid var(--brand-border)', textAlign: 'left', color: 'var(--text-secondary)' }}>
                      <th style={{ padding: '0.65rem 0.5rem', fontWeight: '700' }}>Nama Paket Layanan</th>
                      <th style={{ padding: '0.65rem 0.5rem', textAlign: 'center', fontWeight: '700' }}>Banyak Order</th>
                      <th style={{ padding: '0.65rem 0.5rem', textAlign: 'center', fontWeight: '700' }}>Total Timbangan</th>
                      <th style={{ padding: '0.65rem 0.5rem', textAlign: 'right', fontWeight: '700' }}>Omzet Lunas</th>
                    </tr>
                  </thead>
                  <tbody>
                    {report.rincian.map((item) => (
                      <tr key={item.nama_layanan} style={{ borderBottom: '1px solid var(--brand-border)' }}>
                        <td style={{ padding: '0.75rem 0.5rem', fontWeight: '700' }}>
                          {item.nama_layanan}
                        </td>
                        <td style={{ padding: '0.75rem 0.5rem', textAlign: 'center' }} className="num-tabular">
                          {item.total_order}
                        </td>
                        <td style={{ padding: '0.75rem 0.5rem', textAlign: 'center' }} className="num-tabular">
                          <strong>{item.total_kg}</strong> kg
                        </td>
                        <td style={{ padding: '0.75rem 0.5rem', textAlign: 'right', fontWeight: '800', color: '#16a34a' }} className="num-tabular">
                          Rp{item.pendapatan?.toLocaleString('id-ID')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div style={{ marginTop: '1rem', padding: '0.65rem 0.85rem', background: 'var(--brand-card-subtle)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--brand-border)', fontSize: '0.775rem', color: 'var(--text-secondary)' }}>
                <strong>Kebijakan Akuntansi Kasir:</strong> Pendapatan harian dihitung murni dari order yang uangnya telah diselesaikan saat penyerahan cucian (status <strong>diambil</strong>). Order yang berstatus <strong>dibatalkan</strong> dikeluarkan dari kalkulasi total transaksi maupun volume timbangan.
              </div>
            </div>
          </div>
        )}
      </StateHandler>
    </div>
  );
}
