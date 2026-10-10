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
        // Query order sesuai tanggal_masuk yang dipilih
        const q = query(collection(db, 'order'), where('tanggal_masuk', '==', selectedDate));
        const snap = await getDocs(q);
        const orders = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        const res = calculateDailyReport(orders, selectedDate);
        setReport(res);
      } else {
        // Mode Fallback
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

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">📊 Laporan Harian</h1>
        <p className="page-subtitle">Ringkasan pendapatan kasir, beban cucian, dan rincian layanan</p>
      </div>

      {/* Date Filter */}
      <div className="card" style={{ marginBottom: '1.25rem' }}>
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="form-label">📅 Pilih Tanggal Laporan</label>
          <input
            type="date"
            className="form-input"
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
        emptyTitle={`Belum Ada Order pada ${selectedDate}`}
        emptyMessage="Tidak ada transaksi cucian yang tercatat pada tanggal yang dipilih. Ubah tanggal atau buat order baru."
        onRetry={loadReportData}
      >
        {report && (
          <div>
            {/* Metric Cards Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.65rem', marginBottom: '1.25rem' }}>
              <div className="card" style={{ textAlign: 'center', padding: '0.85rem 0.5rem', marginBottom: 0 }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: '600' }}>Order Aktif</div>
                <div style={{ fontSize: '1.4rem', fontWeight: '800', color: 'var(--primary)', marginTop: '0.2rem' }}>
                  {report.total_order}
                </div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>transaksi</div>
              </div>

              <div className="card" style={{ textAlign: 'center', padding: '0.85rem 0.5rem', marginBottom: 0 }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: '600' }}>Total Beban</div>
                <div style={{ fontSize: '1.4rem', fontWeight: '800', color: 'var(--warning)', marginTop: '0.2rem' }}>
                  {report.total_berat_kg}
                </div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>kilogram</div>
              </div>

              <div className="card" style={{ textAlign: 'center', padding: '0.85rem 0.5rem', marginBottom: 0 }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: '600' }}>Pendapatan</div>
                <div style={{ fontSize: '1.2rem', fontWeight: '800', color: 'var(--success)', marginTop: '0.2rem' }}>
                  Rp{report.total_pendapatan.toLocaleString('id-ID')}
                </div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>status diambil</div>
              </div>
            </div>

            {/* Rincian per Jenis Layanan */}
            <div className="card">
              <h3 style={{ fontSize: '0.95rem', fontWeight: '700', marginBottom: '0.75rem', color: 'var(--text-main)' }}>
                📋 Rincian Beban per Layanan
              </h3>

              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.825rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border)', textAlign: 'left', color: 'var(--text-muted)' }}>
                      <th style={{ padding: '0.5rem 0.25rem' }}>Layanan</th>
                      <th style={{ padding: '0.5rem 0.25rem', textAlign: 'center' }}>Order</th>
                      <th style={{ padding: '0.5rem 0.25rem', textAlign: 'center' }}>Total Kg</th>
                      <th style={{ padding: '0.5rem 0.25rem', textAlign: 'right' }}>Pendapatan Lunas</th>
                    </tr>
                  </thead>
                  <tbody>
                    {report.rincian.map((item) => (
                      <tr key={item.nama_layanan} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '0.6rem 0.25rem', fontWeight: '600' }}>{item.nama_layanan}</td>
                        <td style={{ padding: '0.6rem 0.25rem', textAlign: 'center' }}>{item.total_order}</td>
                        <td style={{ padding: '0.6rem 0.25rem', textAlign: 'center' }}>{item.total_kg} kg</td>
                        <td style={{ padding: '0.6rem 0.25rem', textAlign: 'right', fontWeight: '700', color: 'var(--success)' }}>
                          Rp{item.pendapatan.toLocaleString('id-ID')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div style={{ marginTop: '0.75rem', padding: '0.5rem', background: '#f8fafc', borderRadius: 'var(--radius-sm)', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                ℹ️ <em>Catatan:</em> Pendapatan hanya dihitung dari order yang telah diambil dan dibayar pelanggan (status <strong>diambil</strong>). Order yang dibatalkan tidak dimasukkan dalam perhitungan.
              </div>
            </div>
          </div>
        )}
      </StateHandler>
    </div>
  );
}
