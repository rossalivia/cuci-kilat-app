'use client';

import { useState, useEffect } from 'react';
import StateHandler from '../../components/StateHandler';
import ConfirmDialog from '../../components/ConfirmDialog';
import Toast from '../../components/Toast';
import { initialOrder, initialLayanan, initialPelanggan, getTodayDateString } from '../../lib/mockData';
import { calculateOrder, canTransitionStatus, canDeleteOrder } from '../../lib/businessRules';

export default function OrderPage() {
  const [orderList, setOrderList] = useState([]);
  const [layananList, setLayananList] = useState([]);
  const [pelangganList, setPelangganList] = useState([]);
  const [activeTab, setActiveTab] = useState('semua');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Form state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedPelangganId, setSelectedPelangganId] = useState('');
  const [selectedLayananId, setSelectedLayananId] = useState('');
  const [inputBerat, setInputBerat] = useState('');
  const [catatan, setCatatan] = useState('');
  const [formError, setFormError] = useState(null);

  // Dialog & Toast state
  const [deleteDialog, setDeleteDialog] = useState({ isOpen: false, item: null });
  const [statusDialog, setStatusDialog] = useState({ isOpen: false, item: null, targetStatus: '' });
  const [toast, setToast] = useState(null);

  const loadData = () => {
    setLoading(true);
    setError(null);
    try {
      const savedOrders = localStorage.getItem('cuci_kilat_order');
      const savedLayanan = localStorage.getItem('cuci_kilat_layanan');
      const savedPelanggan = localStorage.getItem('cuci_kilat_pelanggan');

      setOrderList(savedOrders ? JSON.parse(savedOrders) : initialOrder);
      setLayananList(savedLayanan ? JSON.parse(savedLayanan) : initialLayanan);
      setPelangganList(savedPelanggan ? JSON.parse(savedPelanggan) : initialPelanggan);

      if (!savedOrders) localStorage.setItem('cuci_kilat_order', JSON.stringify(initialOrder));
      if (!savedLayanan) localStorage.setItem('cuci_kilat_layanan', JSON.stringify(initialLayanan));
      if (!savedPelanggan) localStorage.setItem('cuci_kilat_pelanggan', JSON.stringify(initialPelanggan));
    } catch (err) {
      setError('Gagal memuat data order.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const saveOrdersToStorage = (newList) => {
    setOrderList(newList);
    localStorage.setItem('cuci_kilat_order', JSON.stringify(newList));
  };

  const handleOpenAdd = () => {
    setSelectedPelangganId(pelangganList[0]?.id || '');
    setSelectedLayananId(layananList[0]?.id || '');
    setInputBerat('');
    setCatatan('');
    setFormError(null);
    setIsFormOpen(true);
  };

  // Preview layanan terpilih & kalkulasi live
  const selectedLayanan = layananList.find((l) => l.id === selectedLayananId);
  const calcResult = selectedLayanan && inputBerat ? calculateOrder(selectedLayanan.harga_per_kg, inputBerat) : null;

  const handleSubmit = (e) => {
    e.preventDefault();
    setFormError(null);

    const pelanggan = pelangganList.find((p) => p.id === selectedPelangganId);
    if (!pelanggan) {
      setFormError('Pilih pelanggan terlebih dahulu.');
      return;
    }
    if (!selectedLayanan) {
      setFormError('Pilih jenis layanan terlebih dahulu.');
      return;
    }

    const calc = calculateOrder(selectedLayanan.harga_per_kg, inputBerat);
    if (!calc.isValid) {
      setFormError(calc.error);
      return;
    }

    if (catatan.length > 100) {
      setFormError('Catatan maksimal 100 karakter.');
      return;
    }

    const newOrder = {
      id: 'Od' + Math.random().toString(36).substring(2, 8),
      pelanggan_id: pelanggan.no_whatsapp,
      nama_pelanggan: pelanggan.nama,
      layanan_id: selectedLayanan.id,
      nama_layanan: selectedLayanan.nama,
      harga_per_kg: selectedLayanan.harga_per_kg,
      berat_kg: calc.berat_kg,
      total: calc.total,
      status: 'diterima',
      catatan: catatan.trim(),
      tanggal_masuk: getTodayDateString(),
      dibuat_pada: new Date().toISOString()
    };

    saveOrdersToStorage([newOrder, ...orderList]);
    setToast({ type: 'success', message: `Order #${newOrder.id} berhasil dicatat!` });
    setIsFormOpen(false);
  };

  // Ubah status
  const triggerStatusChange = (order, targetStatus) => {
    if (!canTransitionStatus(order.status, targetStatus)) {
      setToast({ type: 'error', message: `Status tidak dapat diubah dari "${order.status}" ke "${targetStatus}".` });
      return;
    }
    const updated = orderList.map((item) =>
      item.id === order.id ? { ...item, status: targetStatus } : item
    );
    saveOrdersToStorage(updated);
    setToast({ type: 'success', message: `Order #${order.id} kini berstatus "${targetStatus}".` });
  };

  const confirmDelete = () => {
    if (!deleteDialog.item) return;
    if (!canDeleteOrder(deleteDialog.item.status)) {
      setToast({ type: 'error', message: `Order berstatus "${deleteDialog.item.status}" dilarang dihapus.` });
      setDeleteDialog({ isOpen: false, item: null });
      return;
    }
    const filtered = orderList.filter((item) => item.id !== deleteDialog.item.id);
    saveOrdersToStorage(filtered);
    setToast({ type: 'success', message: `Order #${deleteDialog.item.id} berhasil dihapus.` });
    setDeleteDialog({ isOpen: false, item: null });
  };

  // Filter per Tab Status
  const statusTabs = [
    { key: 'semua', label: 'Semua' },
    { key: 'diterima', label: 'Diterima' },
    { key: 'dicuci', label: 'Dicuci' },
    { key: 'selesai', label: 'Selesai' },
    { key: 'diambil', label: 'Diambil' },
    { key: 'dibatalkan', label: 'Dibatalkan' },
  ];

  const filteredOrders = orderList.filter((o) => {
    if (activeTab === 'semua') return true;
    return o.status === activeTab;
  });

  return (
    <div>
      <Toast toast={toast} onClose={() => setToast(null)} />

      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 className="page-title">🧺 Daftar Order Cucian</h1>
          <p className="page-subtitle">Pencatatan cucian masuk, timbangan, dan alur status</p>
        </div>
        {!isFormOpen && (
          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={handleOpenAdd}
            data-testid="add-order-button"
          >
            ➕ Order Baru
          </button>
        )}
      </div>

      {/* Form Tambah Order */}
      {isFormOpen && (
        <div className="card" style={{ border: '2px solid var(--primary-light)', marginBottom: '1.25rem' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: '700', marginBottom: '0.75rem' }}>
            ➕ Catat Order Cucian Baru
          </h3>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Pilih Pelanggan</label>
              <select
                className="form-select"
                value={selectedPelangganId}
                onChange={(e) => setSelectedPelangganId(e.target.value)}
                required
              >
                {pelangganList.length === 0 && <option value="">(Belum ada data pelanggan)</option>}
                {pelangganList.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.nama} ({p.no_whatsapp})
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Pilih Jenis Layanan</label>
              <select
                className="form-select"
                value={selectedLayananId}
                onChange={(e) => setSelectedLayananId(e.target.value)}
                required
              >
                {layananList.length === 0 && <option value="">(Belum ada layanan)</option>}
                {layananList.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.nama} - Rp{l.harga_per_kg.toLocaleString('id-ID')}/kg ({l.estimasi_hari} hari)
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Berat Timbangan (Kg, 1–50)</label>
              <input
                type="number"
                step="0.1"
                min="0.1"
                max="50"
                className="form-input"
                placeholder="Misal: 3.2 (dibulatkan ke 4 kg)"
                value={inputBerat}
                onChange={(e) => setInputBerat(e.target.value)}
                required
              />
              {calcResult?.isValid && (
                <div style={{ marginTop: '0.4rem', padding: '0.5rem', background: 'var(--primary-light)', borderRadius: 'var(--radius-sm)', fontSize: '0.825rem' }}>
                  ⚖️ Berat Dibulatkan: <strong>{calcResult.berat_kg} kg</strong> | Total Biaya: <strong style={{ color: 'var(--primary-dark)', fontSize: '0.95rem' }}>Rp{calcResult.total.toLocaleString('id-ID')}</strong>
                </div>
              )}
            </div>

            <div className="form-group">
              <label className="form-label">Catatan Khusus (Maks 100 Karakter)</label>
              <input
                type="text"
                maxLength={100}
                className="form-input"
                placeholder="Contoh: Jangan pakai pewangi / Baju putih dipisah"
                value={catatan}
                onChange={(e) => setCatatan(e.target.value)}
              />
            </div>

            {formError && <div className="form-error" style={{ marginBottom: '0.75rem' }}>⚠️ {formError}</div>}

            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => setIsFormOpen(false)}
              >
                Batal
              </button>
              <button
                type="submit"
                className="btn btn-primary btn-sm"
                data-testid="submit-order"
              >
                Simpan Order
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Tabs Filter Status */}
      <div className="tabs-scroll">
        {statusTabs.map((tab) => (
          <button
            key={tab.key}
            type="button"
            className={`tab-btn ${activeTab === tab.key ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* 3-State Handler & List Order */}
      <StateHandler
        loading={loading}
        error={error}
        empty={orderList.length === 0}
        emptyTitle="Belum Ada Order Cucian"
        emptyMessage="Belum ada transaksi cucian yang tercatat. Buat order pertama sekarang."
        addLabel="Catat Order Baru"
        onAdd={handleOpenAdd}
        onRetry={loadData}
      >
        {filteredOrders.length === 0 ? (
          <div className="state-box" style={{ padding: '1.5rem' }}>
            <p className="state-desc" style={{ marginBottom: 0 }}>
              Tidak ada order cucian dengan status &quot;{activeTab}&quot;.
            </p>
          </div>
        ) : (
          <div className="list-container">
            {filteredOrders.map((item) => (
              <div key={item.id} className="card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.4rem' }}>
                  <div>
                    <span style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-muted)' }}>
                      #{item.id} · {item.tanggal_masuk}
                    </span>
                    <h3 style={{ fontSize: '1.05rem', fontWeight: '700', color: 'var(--text-main)', marginTop: '0.1rem' }}>
                      {item.nama_pelanggan}
                    </h3>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      📱 {item.pelanggan_id}
                    </div>
                  </div>
                  <span className={`badge badge-${item.status}`}>
                    {item.status}
                  </span>
                </div>

                <div style={{ background: '#f8fafc', padding: '0.5rem 0.65rem', borderRadius: 'var(--radius-sm)', marginBottom: '0.65rem', fontSize: '0.825rem' }}>
                  <div>🧺 <strong>{item.nama_layanan}</strong> ({item.berat_kg} kg × Rp{item.harga_per_kg.toLocaleString('id-ID')})</div>
                  <div style={{ marginTop: '0.15rem' }}>
                    💰 Total Tagihan: <strong style={{ color: 'var(--primary-dark)', fontSize: '0.95rem' }}>Rp{item.total.toLocaleString('id-ID')}</strong>
                  </div>
                  {item.catatan && (
                    <div style={{ color: 'var(--text-muted)', fontStyle: 'italic', marginTop: '0.2rem' }}>
                      📝 &quot;{item.catatan}&quot;
                    </div>
                  )}
                </div>

                {/* Tombol Alur Transisi Status & Hapus */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.4rem' }}>
                  <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
                    {item.status === 'diterima' && (
                      <>
                        <button
                          type="button"
                          className="btn btn-primary btn-sm"
                          onClick={() => triggerStatusChange(item, 'dicuci')}
                        >
                          🧺 Mulai Cuci
                        </button>
                        <button
                          type="button"
                          className="btn btn-secondary btn-sm"
                          onClick={() => triggerStatusChange(item, 'dibatalkan')}
                        >
                          ❌ Batalkan
                        </button>
                      </>
                    )}

                    {item.status === 'dicuci' && (
                      <button
                        type="button"
                        className="btn btn-primary btn-sm"
                        onClick={() => triggerStatusChange(item, 'selesai')}
                      >
                        ✨ Selesai Cuci
                      </button>
                    )}

                    {item.status === 'selesai' && (
                      <button
                        type="button"
                        className="btn btn-primary btn-sm"
                        style={{ backgroundColor: 'var(--success)' }}
                        onClick={() => triggerStatusChange(item, 'diambil')}
                      >
                        💵 Diambil & Bayar
                      </button>
                    )}

                    {(item.status === 'diambil' || item.status === 'dibatalkan') && (
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontStyle: 'italic', padding: '0.25rem 0' }}>
                        {item.status === 'diambil' ? '✓ Transaksi selesai & lunas' : '• Order dibatalkan'}
                      </span>
                    )}
                  </div>

                  {/* Tombol Hapus hanya jika diterima atau dibatalkan */}
                  {canDeleteOrder(item.status) && (
                    <button
                      type="button"
                      className="btn btn-danger btn-sm"
                      onClick={() => setDeleteDialog({ isOpen: true, item })}
                    >
                      Hapus
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </StateHandler>

      {/* Dialog Konfirmasi Hapus */}
      <ConfirmDialog
        isOpen={deleteDialog.isOpen}
        title="Hapus Order Cucian"
        message={`Apakah Anda yakin ingin menghapus order #${deleteDialog.item?.id} milik ${deleteDialog.item?.nama_pelanggan}?`}
        confirmLabel="Hapus Order"
        cancelLabel="Batal"
        danger={true}
        onCancel={() => setDeleteDialog({ isOpen: false, item: null })}
        onConfirm={confirmDelete}
      />
    </div>
  );
}
