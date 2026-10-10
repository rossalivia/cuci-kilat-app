'use client';

import { useState, useEffect } from 'react';
import StateHandler from '../../components/StateHandler';
import ConfirmDialog from '../../components/ConfirmDialog';
import Toast from '../../components/Toast';
import { initialPelanggan } from '../../lib/mockData';
import { validatePelanggan } from '../../lib/businessRules';
import { db, isFirebaseConfigured } from '../../lib/firebase';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  limit,
  serverTimestamp
} from 'firebase/firestore';

export default function PelangganPage() {
  const [pelangganList, setPelangganList] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Form state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    nama: '',
    no_whatsapp: '',
    alamat: ''
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
        const q = query(collection(db, 'pelanggan'), orderBy('nama'), limit(20));
        const querySnapshot = await getDocs(q);
        const docs = querySnapshot.docs.map((docSnap) => ({
          id: docSnap.id,
          ...docSnap.data()
        }));
        setPelangganList(docs);
      } else {
        const saved = localStorage.getItem('cuci_kilat_pelanggan');
        if (saved) {
          setPelangganList(JSON.parse(saved));
        } else {
          setPelangganList(initialPelanggan);
          localStorage.setItem('cuci_kilat_pelanggan', JSON.stringify(initialPelanggan));
        }
      }
    } catch (err) {
      console.error('Error fetching pelanggan:', err);
      setError('Gagal memuat data pelanggan dari server.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenAdd = () => {
    setEditingId(null);
    setFormData({ nama: '', no_whatsapp: '', alamat: '' });
    setFormError(null);
    setIsFormOpen(true);
  };

  const handleOpenEdit = (item) => {
    setEditingId(item.id);
    setFormData({
      nama: item.nama,
      no_whatsapp: item.no_whatsapp,
      alamat: item.alamat
    });
    setFormError(null);
    setIsFormOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError(null);

    const validation = validatePelanggan(formData);
    if (!validation.isValid) {
      setFormError(validation.error);
      return;
    }

    const cleanWa = formData.no_whatsapp.trim();

    try {
      if (isFirebaseConfigured() && db) {
        const docRef = doc(db, 'pelanggan', cleanWa);

        if (!editingId) {
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            setFormError('Nomor WhatsApp sudah terdaftar.');
            return;
          }
          await setDoc(docRef, {
            nama: formData.nama.trim(),
            no_whatsapp: cleanWa,
            alamat: formData.alamat.trim(),
            dibuat_pada: serverTimestamp()
          });
          setToast({ type: 'success', message: 'Pelanggan baru berhasil didaftarkan!' });
        } else {
          await updateDoc(docRef, {
            nama: formData.nama.trim(),
            alamat: formData.alamat.trim()
          });
          setToast({ type: 'success', message: 'Data pelanggan berhasil diperbarui!' });
        }
        await loadData();
      } else {
        if (!editingId) {
          const isDuplicate = pelangganList.some((p) => p.no_whatsapp === cleanWa);
          if (isDuplicate) {
            setFormError('Nomor WhatsApp sudah terdaftar.');
            return;
          }
          const newPelanggan = {
            id: cleanWa,
            no_whatsapp: cleanWa,
            nama: formData.nama.trim(),
            alamat: formData.alamat.trim(),
            dibuat_pada: new Date().toISOString()
          };
          const updated = [...pelangganList, newPelanggan];
          setPelangganList(updated);
          localStorage.setItem('cuci_kilat_pelanggan', JSON.stringify(updated));
          setToast({ type: 'success', message: 'Pelanggan baru berhasil ditambahkan!' });
        } else {
          const updated = pelangganList.map((item) =>
            item.id === editingId
              ? { ...item, nama: formData.nama.trim(), alamat: formData.alamat.trim() }
              : item
          );
          setPelangganList(updated);
          localStorage.setItem('cuci_kilat_pelanggan', JSON.stringify(updated));
          setToast({ type: 'success', message: 'Data pelanggan berhasil diperbarui!' });
        }
      }
      setIsFormOpen(false);
    } catch (err) {
      console.error('Error saving pelanggan:', err);
      setFormError('Gagal menyimpan pelanggan: ' + err.message);
    }
  };

  const confirmDelete = async () => {
    if (!deleteDialog.item) return;
    try {
      if (isFirebaseConfigured() && db) {
        await deleteDoc(doc(db, 'pelanggan', deleteDialog.item.no_whatsapp));
        setToast({ type: 'success', message: `Pelanggan "${deleteDialog.item.nama}" berhasil dihapus.` });
        await loadData();
      } else {
        const filtered = pelangganList.filter((item) => item.id !== deleteDialog.item.id);
        setPelangganList(filtered);
        localStorage.setItem('cuci_kilat_pelanggan', JSON.stringify(filtered));
        setToast({ type: 'success', message: `Pelanggan "${deleteDialog.item.nama}" berhasil dihapus.` });
      }
    } catch (err) {
      console.error('Error deleting pelanggan:', err);
      setToast({ type: 'error', message: 'Gagal menghapus pelanggan: ' + err.message });
    } finally {
      setDeleteDialog({ isOpen: false, item: null });
    }
  };

  const filteredPelanggan = pelangganList.filter((p) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      (p.nama && p.nama.toLowerCase().includes(q)) ||
      (p.no_whatsapp && p.no_whatsapp.includes(q))
    );
  });

  return (
    <div>
      <Toast toast={toast} onClose={() => setToast(null)} />

      <div className="page-header-row">
        <div>
          <h1 className="page-title">Direktori Pelanggan</h1>
          <p className="page-desc">Database kontak member laundry dan riwayat nomor WhatsApp</p>
        </div>
        {!isFormOpen && (
          <button
            type="button"
            className="btn btn-primary"
            onClick={handleOpenAdd}
            data-testid="add-pelanggan-button"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
            Tambah Pelanggan
          </button>
        )}
      </div>

      {/* Kolom Pencarian Cepat */}
      {!isFormOpen && (
        <div style={{ marginBottom: '1rem' }}>
          <input
            type="text"
            className="form-input"
            placeholder="Ketik nama atau nomor WhatsApp untuk mencari..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      )}

      {/* Form Tambah/Ubah */}
      {isFormOpen && (
        <div className="card-clean" style={{ border: '2px solid var(--primary-border)', marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 style={{ fontSize: '1.05rem', fontWeight: '800' }}>
              {editingId ? 'Perbarui Data Pelanggan' : 'Registrasi Pelanggan Baru'}
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
              <label className="form-label">Nama Lengkap Pelanggan (1–60 Karakter)</label>
              <input
                type="text"
                className="form-input"
                placeholder="Contoh: Rizky Pratama"
                value={formData.nama}
                onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Nomor WhatsApp (Diawali 08, 10–13 Angka)</label>
              <input
                type="tel"
                className="form-input num-tabular"
                placeholder="Contoh: 081298765432"
                value={formData.no_whatsapp}
                onChange={(e) => setFormData({ ...formData, no_whatsapp: e.target.value })}
                disabled={!!editingId}
                required
              />
              {editingId ? (
                <div className="form-hint">Nomor WhatsApp merupakan ID unik dokumen dan tidak dapat diubah.</div>
              ) : (
                <div className="form-hint">Format nomor WhatsApp Indonesia diawali 08 (misal: 0812xxxxxxxx).</div>
              )}
            </div>

            <div className="form-group">
              <label className="form-label">Alamat / Patokan Kos (1–200 Karakter)</label>
              <textarea
                className="form-textarea"
                placeholder="Contoh: Kos Melati kamar 5, Jl. Kampus No. 8"
                value={formData.alamat}
                onChange={(e) => setFormData({ ...formData, alamat: e.target.value })}
                required
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
                data-testid="submit-pelanggan"
              >
                Simpan Pelanggan
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 3-State Handler & List */}
      <StateHandler
        loading={loading}
        error={error}
        empty={pelangganList.length === 0}
        emptyTitle="Belum Ada Pelanggan Terdaftar"
        emptyMessage="Database pelanggan masih kosong. Daftarkan pelanggan pertama untuk membuat order."
        addLabel="Tambah Pelanggan"
        onAdd={handleOpenAdd}
        onRetry={loadData}
      >
        {filteredPelanggan.length === 0 ? (
          <div className="state-box">
            <h3 className="state-title">Pelanggan Tidak Ditemukan</h3>
            <p className="state-desc" style={{ marginBottom: 0 }}>
              Tidak ditemukan data yang sesuai dengan kata kunci pencarian &quot;{searchQuery}&quot;.
            </p>
          </div>
        ) : (
          <div className="list-container">
            {filteredPelanggan.map((item) => {
              const cleanPhone = item.no_whatsapp?.startsWith('0')
                ? '62' + item.no_whatsapp.slice(1)
                : item.no_whatsapp;

              return (
                <div key={item.id} className="card-clean">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.75rem' }}>
                    <div>
                      <h3 style={{ fontSize: '1.05rem', fontWeight: '800', color: 'var(--text-primary)' }}>
                        {item.nama}
                      </h3>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.2rem' }}>
                        <span className="num-tabular" style={{ fontSize: '0.875rem', fontWeight: '700', color: 'var(--primary)' }}>
                          {item.no_whatsapp}
                        </span>
                        <a
                          href={`https://wa.me/${cleanPhone}`}
                          target="_blank"
                          rel="noreferrer"
                          style={{ fontSize: '0.725rem', color: '#16a34a', textDecoration: 'none', fontWeight: '700', background: '#dcfce7', padding: '0.15rem 0.45rem', borderRadius: '4px' }}
                        >
                          Chat WA ↗
                        </a>
                      </div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.35rem', lineHeight: '1.4' }}>
                        Alamat: {item.alamat}
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
                </div>
              );
            })}
          </div>
        )}
      </StateHandler>

      {/* Dialog Konfirmasi Hapus */}
      <ConfirmDialog
        isOpen={deleteDialog.isOpen}
        title="Hapus Pelanggan"
        message={`Apakah Anda yakin ingin menghapus pelanggan "${deleteDialog.item?.nama}" (${deleteDialog.item?.no_whatsapp})? Data yang sudah dihapus tidak dapat dipulihkan.`}
        confirmLabel="Hapus Pelanggan"
        cancelLabel="Batal"
        danger={true}
        onCancel={() => setDeleteDialog({ isOpen: false, item: null })}
        onConfirm={confirmDelete}
      />
    </div>
  );
}
