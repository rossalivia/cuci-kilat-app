'use client';

import { useState, useEffect } from 'react';
import StateHandler from '../../components/StateHandler';
import ConfirmDialog from '../../components/ConfirmDialog';
import Toast from '../../components/Toast';
import { initialLayanan } from '../../lib/mockData';
import { validateLayanan } from '../../lib/businessRules';
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

export default function LayananPage() {
  const [layananList, setLayananList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Form state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    nama: '',
    harga_per_kg: '',
    estimasi_hari: '3'
  });
  const [formError, setFormError] = useState(null);

  // Dialog & Toast state
  const [deleteDialog, setDeleteDialog] = useState({ isOpen: false, item: null });
  const [toast, setToast] = useState(null);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      if (isFirebaseConfigured() && db) {
        const q = query(collection(db, 'layanan'), orderBy('nama'), limit(20));
        const querySnapshot = await getDocs(q);
        const docs = querySnapshot.docs.map((docSnap) => ({
          id: docSnap.id,
          ...docSnap.data()
        }));
        setLayananList(docs);
      } else {
        const saved = localStorage.getItem('cuci_kilat_layanan');
        if (saved) {
          setLayananList(JSON.parse(saved));
        } else {
          setLayananList(initialLayanan);
          localStorage.setItem('cuci_kilat_layanan', JSON.stringify(initialLayanan));
        }
      }
    } catch (err) {
      console.error('Error fetching layanan:', err);
      setError('Gagal memuat data layanan dari server.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenAdd = () => {
    setEditingId(null);
    setFormData({ nama: '', harga_per_kg: '', estimasi_hari: '3' });
    setFormError(null);
    setIsFormOpen(true);
  };

  const handleOpenEdit = (item) => {
    setEditingId(item.id);
    setFormData({
      nama: item.nama,
      harga_per_kg: String(item.harga_per_kg),
      estimasi_hari: String(item.estimasi_hari)
    });
    setFormError(null);
    setIsFormOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError(null);

    const validation = validateLayanan({
      nama: formData.nama,
      harga_per_kg: formData.harga_per_kg,
      estimasi_hari: formData.estimasi_hari
    });

    if (!validation.isValid) {
      setFormError(validation.error);
      return;
    }

    const payload = {
      nama: formData.nama.trim(),
      harga_per_kg: Number(formData.harga_per_kg),
      estimasi_hari: Number(formData.estimasi_hari)
    };

    try {
      if (isFirebaseConfigured() && db) {
        if (editingId) {
          await updateDoc(doc(db, 'layanan', editingId), payload);
          setToast({ type: 'success', message: 'Paket layanan berhasil diperbarui!' });
        } else {
          await addDoc(collection(db, 'layanan'), {
            ...payload,
            dibuat_pada: serverTimestamp()
          });
          setToast({ type: 'success', message: 'Paket layanan baru berhasil ditambahkan!' });
        }
        await loadData();
      } else {
        if (editingId) {
          const updated = layananList.map((item) =>
            item.id === editingId ? { ...item, ...payload } : item
          );
          setLayananList(updated);
          localStorage.setItem('cuci_kilat_layanan', JSON.stringify(updated));
          setToast({ type: 'success', message: 'Paket layanan berhasil diperbarui!' });
        } else {
          const newItem = {
            id: 'L' + Math.random().toString(36).substring(2, 8),
            ...payload,
            dibuat_pada: new Date().toISOString()
          };
          const updated = [...layananList, newItem];
          setLayananList(updated);
          localStorage.setItem('cuci_kilat_layanan', JSON.stringify(updated));
          setToast({ type: 'success', message: 'Paket layanan baru berhasil ditambahkan!' });
        }
      }
      setIsFormOpen(false);
    } catch (err) {
      console.error('Error saving layanan:', err);
      setFormError('Gagal menyimpan layanan: ' + err.message);
    }
  };

  const confirmDelete = async () => {
    if (!deleteDialog.item) return;
    try {
      if (isFirebaseConfigured() && db) {
        await deleteDoc(doc(db, 'layanan', deleteDialog.item.id));
        setToast({ type: 'success', message: `Layanan "${deleteDialog.item.nama}" berhasil dihapus.` });
        await loadData();
      } else {
        const filtered = layananList.filter((item) => item.id !== deleteDialog.item.id);
        setLayananList(filtered);
        localStorage.setItem('cuci_kilat_layanan', JSON.stringify(filtered));
        setToast({ type: 'success', message: `Layanan "${deleteDialog.item.nama}" berhasil dihapus.` });
      }
    } catch (err) {
      console.error('Error deleting layanan:', err);
      setToast({ type: 'error', message: 'Gagal menghapus layanan: ' + err.message });
    } finally {
      setDeleteDialog({ isOpen: false, item: null });
    }
  };

  return (
    <div>
      <Toast toast={toast} onClose={() => setToast(null)} />

      <div className="page-header-row">
        <div>
          <h1 className="page-title">Paket Layanan Laundry</h1>
          <p className="page-desc">Kelola jenis cucian, tarif harga per kilogram, dan komitmen durasi pengerjaan</p>
        </div>
        {!isFormOpen && (
          <button
            type="button"
            className="btn btn-primary"
            onClick={handleOpenAdd}
            data-testid="add-layanan-button"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
            Tambah Paket
          </button>
        )}
      </div>

      {/* Form Tambah/Ubah */}
      {isFormOpen && (
        <div className="card-clean" style={{ border: '2px solid var(--primary-border)', marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 style={{ fontSize: '1.05rem', fontWeight: '800' }}>
              {editingId ? 'Perbarui Paket Layanan' : 'Tambah Paket Layanan Baru'}
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
              <label className="form-label">Nama Paket Layanan (1–40 Karakter)</label>
              <input
                type="text"
                className="form-input"
                placeholder="Contoh: Cuci Setrika / Cuci Kering / Kilat Express"
                value={formData.nama}
                onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Tarif per Kilogram (Rupiah Bulat, Minimal 0)</label>
              <input
                type="number"
                min="0"
                step="1"
                className="form-input num-tabular"
                placeholder="Contoh: 10000"
                value={formData.harga_per_kg}
                onChange={(e) => setFormData({ ...formData, harga_per_kg: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Estimasi Pengerjaan (1–7 Hari)</label>
              <input
                type="number"
                min="1"
                max="7"
                step="1"
                className="form-input num-tabular"
                placeholder="Contoh: 2"
                value={formData.estimasi_hari}
                onChange={(e) => setFormData({ ...formData, estimasi_hari: e.target.value })}
                required
              />
              <div className="form-hint">Standar waktu tunggu pelanggan hingga cucian siap diambil.</div>
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
                data-testid="submit-layanan"
              >
                Simpan Paket
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 3-State Handler & List */}
      <StateHandler
        loading={loading}
        error={error}
        empty={layananList.length === 0}
        emptyTitle="Belum Ada Paket Layanan"
        emptyMessage="Daftar tarif layanan masih kosong. Buat paket pertama untuk mulai menerima order."
        addLabel="Tambah Paket"
        onAdd={handleOpenAdd}
        onRetry={loadData}
      >
        <div className="list-container">
          {layananList.map((item) => (
            <div key={item.id} className="card-clean" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
              <div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: '800', color: 'var(--text-primary)' }}>
                  {item.nama}
                </h3>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '0.25rem' }}>
                  <span className="num-tabular" style={{ fontSize: '1.15rem', fontWeight: '800', color: 'var(--primary)' }}>
                    Rp{item.harga_per_kg?.toLocaleString('id-ID')}
                    <span style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--text-secondary)' }}>/kg</span>
                  </span>
                  <span style={{ fontSize: '0.75rem', fontWeight: '700', background: 'var(--accent-cyan-light)', color: '#0369a1', padding: '0.2rem 0.55rem', borderRadius: '4px' }}>
                    Estimasi {item.estimasi_hari} Hari
                  </span>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.4rem' }}>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => handleOpenEdit(item)}
                >
                  Ubah
                </button>
                <button
                  type="button"
                  className="btn btn-danger btn-sm"
                  onClick={() => setDeleteDialog({ isOpen: true, item })}
                >
                  Hapus
                </button>
              </div>
            </div>
          ))}
        </div>
      </StateHandler>

      {/* Dialog Konfirmasi Hapus */}
      <ConfirmDialog
        isOpen={deleteDialog.isOpen}
        title="Hapus Layanan"
        message={`Apakah Anda yakin ingin menghapus paket layanan "${deleteDialog.item?.nama}"? Transaksi lama tidak akan terpengaruh.`}
        confirmLabel="Hapus Layanan"
        cancelLabel="Batal"
        danger={true}
        onCancel={() => setDeleteDialog({ isOpen: false, item: null })}
        onConfirm={confirmDelete}
      />
    </div>
  );
}
