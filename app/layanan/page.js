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

  // Load data (Firestore atau localStorage fallback)
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
          setToast({ type: 'success', message: 'Layanan berhasil diperbarui di Firestore!' });
        } else {
          await addDoc(collection(db, 'layanan'), {
            ...payload,
            dibuat_pada: serverTimestamp()
          });
          setToast({ type: 'success', message: 'Layanan baru berhasil disimpan ke Firestore!' });
        }
        await loadData();
      } else {
        // Mode Fallback
        if (editingId) {
          const updated = layananList.map((item) =>
            item.id === editingId ? { ...item, ...payload } : item
          );
          setLayananList(updated);
          localStorage.setItem('cuci_kilat_layanan', JSON.stringify(updated));
          setToast({ type: 'success', message: 'Layanan berhasil diperbarui!' });
        } else {
          const newItem = {
            id: 'L' + Math.random().toString(36).substring(2, 8),
            ...payload,
            dibuat_pada: new Date().toISOString()
          };
          const updated = [...layananList, newItem];
          setLayananList(updated);
          localStorage.setItem('cuci_kilat_layanan', JSON.stringify(updated));
          setToast({ type: 'success', message: 'Layanan baru berhasil ditambahkan!' });
        }
      }
      setIsFormOpen(false);
    } catch (err) {
      console.error('Error saving layanan:', err);
      setFormError('Gagal menyimpan data ke Firestore: ' + err.message);
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

      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 className="page-title">🏷️ Jenis Layanan</h1>
          <p className="page-subtitle">Kelola harga per kg dan estimasi waktu pengerjaan</p>
        </div>
        {!isFormOpen && (
          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={handleOpenAdd}
            data-testid="add-layanan-button"
          >
            ➕ Tambah
          </button>
        )}
      </div>

      {/* Form Tambah/Ubah */}
      {isFormOpen && (
        <div className="card" style={{ border: '2px solid var(--primary-light)', marginBottom: '1.25rem' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: '700', marginBottom: '0.75rem' }}>
            {editingId ? '✏️ Ubah Layanan' : '➕ Tambah Layanan Baru'}
          </h3>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Nama Layanan (1-40 Karakter)</label>
              <input
                type="text"
                className="form-input"
                placeholder="Contoh: Cuci Setrika"
                value={formData.nama}
                onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Harga per Kg (Rp, Bulat)</label>
              <input
                type="number"
                min="0"
                step="1"
                className="form-input"
                placeholder="Contoh: 10000"
                value={formData.harga_per_kg}
                onChange={(e) => setFormData({ ...formData, harga_per_kg: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Estimasi Waktu (1–7 Hari)</label>
              <input
                type="number"
                min="1"
                max="7"
                step="1"
                className="form-input"
                placeholder="Contoh: 3"
                value={formData.estimasi_hari}
                onChange={(e) => setFormData({ ...formData, estimasi_hari: e.target.value })}
                required
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
                data-testid="submit-layanan"
              >
                Simpan Layanan
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
        emptyTitle="Belum Ada Layanan"
        emptyMessage="Daftar layanan masih kosong. Tambahkan jenis layanan pertama Anda."
        addLabel="Tambah Layanan"
        onAdd={handleOpenAdd}
        onRetry={loadData}
      >
        <div className="list-container">
          {layananList.map((item) => (
            <div key={item.id} className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ fontSize: '1rem', fontWeight: '700', color: 'var(--text-main)' }}>
                  {item.nama}
                </h3>
                <div style={{ fontSize: '0.825rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                  <strong style={{ color: 'var(--primary-dark)', fontSize: '0.95rem' }}>
                    Rp{item.harga_per_kg?.toLocaleString('id-ID')}
                  </strong>
                  /kg · ⏱️ {item.estimasi_hari} hari
                </div>
              </div>
              <div style={{ display: 'flex', gap: '0.35rem' }}>
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
        message={`Apakah Anda yakin ingin menghapus layanan "${deleteDialog.item?.nama}"? Tindakan ini tidak dapat dibatalkan.`}
        confirmLabel="Hapus Layanan"
        cancelLabel="Batal"
        danger={true}
        onCancel={() => setDeleteDialog({ isOpen: false, item: null })}
        onConfirm={confirmDelete}
      />
    </div>
  );
}
