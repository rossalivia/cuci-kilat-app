'use client';

import { useState, useEffect } from 'react';
import StateHandler from '../../components/StateHandler';
import ConfirmDialog from '../../components/ConfirmDialog';
import Toast from '../../components/Toast';
import ReceiptModal from '../../components/ReceiptModal';
import { initialOrder, initialLayanan, initialPelanggan, getTodayDateString } from '../../lib/mockData';
import { calculateOrder, canTransitionStatus, canDeleteOrder } from '../../lib/businessRules';
import { db, isFirebaseConfigured } from '../../lib/firebase';
import {
  collection,
  doc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  limit,
  serverTimestamp
} from 'firebase/firestore';

export default function OrderPage() {
  const [orderList, setOrderList] = useState([]);
  const [layananList, setLayananList] = useState([]);
  const [pelangganList, setPelangganList] = useState([]);
  const [activeTab, setActiveTab] = useState('semua');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Form state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedPelangganId, setSelectedPelangganId] = useState('');
  const [selectedLayananId, setSelectedLayananId] = useState('');
  const [inputBerat, setInputBerat] = useState('');
  const [catatan, setCatatan] = useState('');
  const [formError, setFormError] = useState(null);

  // Dialog, Receipt Modal, & Toast state
  const [deleteDialog, setDeleteDialog] = useState({ isOpen: false, item: null });
  const [receiptModal, setReceiptModal] = useState({ isOpen: false, item: null });
  const [toast, setToast] = useState(null);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      if (isFirebaseConfigured() && db) {
        const orderQ = query(collection(db, 'order'), orderBy('dibuat_pada', 'desc'), limit(20));
        const orderSnap = await getDocs(orderQ);
        const orders = orderSnap.docs.map((d) => ({ id: d.id, ...d.data() }));

        const laySnap = await getDocs(query(collection(db, 'layanan'), orderBy('nama'), limit(20)));
        const layList = laySnap.docs.map((d) => ({ id: d.id, ...d.data() }));

        const pelSnap = await getDocs(query(collection(db, 'pelanggan'), orderBy('nama'), limit(20)));
        const pelList = pelSnap.docs.map((d) => ({ id: d.id, ...d.data() }));

        setOrderList(orders);
        setLayananList(layList);
        setPelangganList(pelList);
      } else {
        const savedOrders = localStorage.getItem('cuci_kilat_order');
        const savedLayanan = localStorage.getItem('cuci_kilat_layanan');
        const savedPelanggan = localStorage.getItem('cuci_kilat_pelanggan');

        setOrderList(savedOrders ? JSON.parse(savedOrders) : initialOrder);
        setLayananList(savedLayanan ? JSON.parse(savedLayanan) : initialLayanan);
        setPelangganList(savedPelanggan ? JSON.parse(savedPelanggan) : initialPelanggan);
      }
    } catch (err) {
      console.error('Error fetching order data:', err);
      setError('Gagal memuat data order cucian dari server.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenAdd = () => {
    setSelectedPelangganId(pelangganList[0]?.id || '');
    setSelectedLayananId(layananList[0]?.id || '');
    setInputBerat('');
    setCatatan('');
    setFormError(null);
    setIsFormOpen(true);
  };

  const selectedLayanan = layananList.find((l) => l.id === selectedLayananId);
  const calcResult = selectedLayanan && inputBerat ? calculateOrder(selectedLayanan.harga_per_kg, inputBerat) : null;

  const handleSubmit = async (e) => {
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

    const payload = {
      pelanggan_id: pelanggan.no_whatsapp,
      nama_pelanggan: pelanggan.nama,
      layanan_id: selectedLayanan.id,
      nama_layanan: selectedLayanan.nama,
      harga_per_kg: selectedLayanan.harga_per_kg,
      berat_kg: calc.berat_kg,
      total: calc.total,
      status: 'diterima',
      catatan: catatan.trim(),
      tanggal_masuk: getTodayDateString()
    };

    try {
      if (isFirebaseConfigured() && db) {
        const docRef = await addDoc(collection(db, 'order'), {
          ...payload,
          dibuat_pada: serverTimestamp()
        });
        setToast({ type: 'success', message: `Order #${docRef.id} berhasil dicatat!` });
        await loadData();
      } else {
        const newOrder = {
          id: 'Od' + Math.random().toString(36).substring(2, 8),
          ...payload,
          dibuat_pada: new Date().toISOString()
        };
        const updated = [newOrder, ...orderList];
        setOrderList(updated);
        localStorage.setItem('cuci_kilat_order', JSON.stringify(updated));
        setToast({ type: 'success', message: `Order #${newOrder.id} berhasil dicatat!` });
      }
      setIsFormOpen(false);
    } catch (err) {
      console.error('Error saving order:', err);
      setFormError('Gagal menyimpan order: ' + err.message);
    }
  };

  const triggerStatusChange = async (order, targetStatus) => {
    if (!canTransitionStatus(order.status, targetStatus)) {
      setToast({ type: 'error', message: `Status tidak dapat diubah dari "${order.status}" ke "${targetStatus}".` });
      return;
    }

    try {
      if (isFirebaseConfigured() && db) {
        await updateDoc(doc(db, 'order', order.id), { status: targetStatus });
        setToast({ type: 'success', message: `Order #${order.id} status diperbarui: ${targetStatus}.` });
        await loadData();
      } else {
        const updated = orderList.map((item) =>
          item.id === order.id ? { ...item, status: targetStatus } : item
        );
        setOrderList(updated);
        localStorage.setItem('cuci_kilat_order', JSON.stringify(updated));
        setToast({ type: 'success', message: `Order #${order.id} status diperbarui: ${targetStatus}.` });
      }
    } catch (err) {
      console.error('Error updating order status:', err);
      setToast({ type: 'error', message: 'Gagal memperbarui status order: ' + err.message });
    }
  };

  const confirmDelete = async () => {
    if (!deleteDialog.item) return;
    if (!canDeleteOrder(deleteDialog.item.status)) {
      setToast({ type: 'error', message: `Order berstatus "${deleteDialog.item.status}" dilarang dihapus.` });
      setDeleteDialog({ isOpen: false, item: null });
      return;
    }

    try {
      if (isFirebaseConfigured() && db) {
        await deleteDoc(doc(db, 'order', deleteDialog.item.id));
        setToast({ type: 'success', message: `Order #${deleteDialog.item.id} berhasil dihapus.` });
        await loadData();
      } else {
        const filtered = orderList.filter((item) => item.id !== deleteDialog.item.id);
        setOrderList(filtered);
        localStorage.setItem('cuci_kilat_order', JSON.stringify(filtered));
        setToast({ type: 'success', message: `Order #${deleteDialog.item.id} berhasil dihapus.` });
      }
    } catch (err) {
      console.error('Error deleting order:', err);
      setToast({ type: 'error', message: 'Gagal menghapus order: ' + err.message });
    } finally {
      setDeleteDialog({ isOpen: false, item: null });
    }
  };

  const statusTabs = [
    { key: 'semua', label: 'Semua Order' },
    { key: 'diterima', label: 'Diterima' },
    { key: 'dicuci', label: 'Sedang Dicuci' },
    { key: 'selesai', label: 'Siap Diambil' },
    { key: 'diambil', label: 'Lunas / Selesai' },
    { key: 'dibatalkan', label: 'Dibatalkan' },
  ];

  const filteredOrders = orderList.filter((o) => {
    const matchesTab = activeTab === 'semua' || o.status === activeTab;
    const q = searchQuery.toLowerCase().trim();
    if (!q) return matchesTab;
    const matchesSearch =
      (o.nama_pelanggan && o.nama_pelanggan.toLowerCase().includes(q)) ||
      (o.pelanggan_id && o.pelanggan_id.includes(q)) ||
      (o.id && o.id.toLowerCase().includes(q));
    return matchesTab && matchesSearch;
  });

  // Helper Stepper Lifecycle
  const getStepStatus = (orderStatus, stepName) => {
    const steps = ['diterima', 'dicuci', 'selesai', 'diambil'];
    if (orderStatus === 'dibatalkan') return 'cancelled';
    const currentIndex = steps.indexOf(orderStatus);
    const targetIndex = steps.indexOf(stepName);
    if (targetIndex < currentIndex) return 'completed';
    if (targetIndex === currentIndex) return 'current';
    return 'pending';
  };

  return (
    <div>
      <Toast toast={toast} onClose={() => setToast(null)} />
      <ReceiptModal
        isOpen={receiptModal.isOpen}
        order={receiptModal.item}
        onClose={() => setReceiptModal({ isOpen: false, item: null })}
      />

      <div className="page-header-row">
        <div>
          <h1 className="page-title">Pencatatan Order Cucian</h1>
          <p className="page-desc">Kelola timbangan masuk, alur status pengerjaan, dan nota digital</p>
        </div>
        {!isFormOpen && (
          <button
            type="button"
            className="btn btn-primary"
            onClick={handleOpenAdd}
            data-testid="add-order-button"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
            Catat Order Baru
          </button>
        )}
      </div>

      {/* Form Tambah Order */}
      {isFormOpen && (
        <div className="card-clean" style={{ border: '2px solid var(--primary-border)', marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 style={{ fontSize: '1.05rem', fontWeight: '800' }}>
              Formulir Penerimaan Cucian Baru
            </h3>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => setIsFormOpen(false)}
            >
              ✕ Tutup
            </button>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Pilih Pelanggan / Nomor WhatsApp</label>
              <select
                className="form-select"
                value={selectedPelangganId}
                onChange={(e) => setSelectedPelangganId(e.target.value)}
                required
              >
                {pelangganList.length === 0 && <option value="">(Belum ada data pelanggan)</option>}
                {pelangganList.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.nama} — {p.no_whatsapp} ({p.alamat?.substring(0, 30)}...)
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Pilih Paket Layanan</label>
              <select
                className="form-select"
                value={selectedLayananId}
                onChange={(e) => setSelectedLayananId(e.target.value)}
                required
              >
                {layananList.length === 0 && <option value="">(Belum ada layanan)</option>}
                {layananList.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.nama} — Rp{l.harga_per_kg?.toLocaleString('id-ID')}/kg (Estimasi {l.estimasi_hari} hari)
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Berat Timbangan (Kg, 1–50 kg)</label>
              <input
                type="number"
                step="0.1"
                min="0.1"
                max="50"
                className="form-input num-tabular"
                placeholder="Ketik berat (misal: 3.2)"
                value={inputBerat}
                onChange={(e) => setInputBerat(e.target.value)}
                required
              />

              {/* Quick Preset Buttons */}
              <div className="preset-chips">
                <span style={{ fontSize: '0.725rem', color: 'var(--text-secondary)', alignSelf: 'center', fontWeight: '600' }}>
                  Pilihan Cepat:
                </span>
                {[2, 3, 4, 5, 7, 10].map((kg) => (
                  <button
                    key={kg}
                    type="button"
                    className="chip-btn"
                    onClick={() => setInputBerat(String(kg))}
                  >
                    +{kg} kg
                  </button>
                ))}
              </div>

              {calcResult?.isValid && (
                <div style={{ marginTop: '0.65rem', padding: '0.65rem 0.85rem', background: 'var(--primary-light)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--primary-border)', fontSize: '0.85rem' }}>
                  ⚖️ Pembulatan Sistem: <strong>{calcResult.berat_kg} kg</strong> &nbsp;|&nbsp;
                  Total Tagihan: <strong className="num-tabular" style={{ color: 'var(--primary-text)', fontSize: '1.05rem' }}>Rp{calcResult.total.toLocaleString('id-ID')}</strong>
                </div>
              )}
            </div>

            <div className="form-group">
              <label className="form-label">Catatan Pengerjaan (Maks 100 Karakter)</label>
              <input
                type="text"
                maxLength={100}
                className="form-input"
                placeholder="Misal: Jangan pakai softener / pisahkan kemeja putih"
                value={catatan}
                onChange={(e) => setCatatan(e.target.value)}
              />
            </div>

            {formError && <div className="form-error" style={{ marginBottom: '0.75rem' }}>⚠️ {formError}</div>}

            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', marginTop: '1rem' }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setIsFormOpen(false)}
              >
                Batal
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                data-testid="submit-order"
              >
                Simpan & Terbitkan Nota
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Search Bar & Tabs */}
      {!isFormOpen && (
        <div style={{ marginBottom: '0.75rem' }}>
          <input
            type="text"
            className="form-input"
            placeholder="Cari order berdasarkan nama pelanggan, no WA, atau ID nota..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      )}

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

      {/* List Order */}
      <StateHandler
        loading={loading}
        error={error}
        empty={orderList.length === 0}
        emptyTitle="Belum Ada Transaksi Order"
        emptyMessage="Sistem belum mencatat transaksi cucian. Buat order pertama untuk memulai."
        addLabel="Catat Order Baru"
        onAdd={handleOpenAdd}
        onRetry={loadData}
      >
        {filteredOrders.length === 0 ? (
          <div className="state-box">
            <h3 className="state-title">Order Tidak Ditemukan</h3>
            <p className="state-desc" style={{ marginBottom: 0 }}>
              Tidak ada data order yang cocok dengan filter atau kata kunci pencarian.
            </p>
          </div>
        ) : (
          <div className="list-container">
            {filteredOrders.map((item) => (
              <div key={item.id} className="card-clean">
                {/* Header Kartu */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                      <span style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)', fontWeight: '700', color: 'var(--text-secondary)' }}>
                        #{item.id}
                      </span>
                      <span style={{ fontSize: '0.725rem', color: 'var(--text-tertiary)' }}>•</span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }} className="num-tabular">
                        {item.tanggal_masuk}
                      </span>
                    </div>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: '800', color: 'var(--text-primary)', marginTop: '0.2rem' }}>
                      {item.nama_pelanggan}
                    </h3>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.1rem' }} className="num-tabular">
                      WhatsApp: {item.pelanggan_id}
                    </div>
                  </div>

                  <span className={`badge badge-${item.status}`}>
                    {item.status}
                  </span>
                </div>

                {/* Stepper Timeline Visual */}
                {item.status !== 'dibatalkan' && (
                  <div className="timeline-track">
                    <div className="timeline-line"></div>
                    {['diterima', 'dicuci', 'selesai', 'diambil'].map((step, idx) => {
                      const state = getStepStatus(item.status, step);
                      return (
                        <div key={step} className={`timeline-step ${state}`}>
                          <div className="timeline-dot">
                            {state === 'completed' ? '✓' : idx + 1}
                          </div>
                          <span className="timeline-label">{step}</span>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Rincian Cucian */}
                <div style={{ background: 'var(--brand-card-subtle)', padding: '0.65rem 0.85rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--brand-border)', margin: '0.65rem 0', fontSize: '0.825rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <strong>{item.nama_layanan}</strong>
                      <span style={{ color: 'var(--text-secondary)', marginLeft: '0.4rem' }}>
                        ({item.berat_kg} kg × Rp{item.harga_per_kg?.toLocaleString('id-ID')})
                      </span>
                    </div>
                    <div className="num-tabular" style={{ fontWeight: '800', fontSize: '1rem', color: 'var(--primary)' }}>
                      Rp{item.total?.toLocaleString('id-ID')}
                    </div>
                  </div>
                  {item.catatan && (
                    <div style={{ color: 'var(--text-secondary)', fontStyle: 'italic', marginTop: '0.35rem', fontSize: '0.775rem' }}>
                      Catatan: &quot;{item.catatan}&quot;
                    </div>
                  )}
                </div>

                {/* Action Buttons Row */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.65rem' }}>
                  <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                    {/* Tombol Cetak Struk */}
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={() => setReceiptModal({ isOpen: true, item })}
                    >
                      🧾 Lihat Nota
                    </button>

                    {/* Alur Status */}
                    {item.status === 'diterima' && (
                      <>
                        <button
                          type="button"
                          className="btn btn-primary btn-sm"
                          onClick={() => triggerStatusChange(item, 'dicuci')}
                        >
                          Mulai Cuci
                        </button>
                        <button
                          type="button"
                          className="btn btn-secondary btn-sm"
                          onClick={() => triggerStatusChange(item, 'dibatalkan')}
                        >
                          Batalkan
                        </button>
                      </>
                    )}

                    {item.status === 'dicuci' && (
                      <button
                        type="button"
                        className="btn btn-primary btn-sm"
                        onClick={() => triggerStatusChange(item, 'selesai')}
                      >
                        Selesai Cuci
                      </button>
                    )}

                    {item.status === 'selesai' && (
                      <button
                        type="button"
                        className="btn btn-success btn-sm"
                        onClick={() => triggerStatusChange(item, 'diambil')}
                      >
                        Serahkan & Bayar
                      </button>
                    )}
                  </div>

                  {/* Tombol Hapus (Hanya untuk diterima atau dibatalkan) */}
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
