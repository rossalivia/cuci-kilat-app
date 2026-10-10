# Implementasi Cuci Kilat (Laundry Kiloan) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Membangun aplikasi web CRUD Cuci Kilat (Laundry Kiloan) lengkap dengan 4 modul (Layanan, Pelanggan, Order, Laporan), penanganan 3 state (loading, empty, error), alur status cucian, validasi data, koneksi Firestore modular SDK, security rules, dan konfigurasi deployment Netlify.

**Architecture:** Aplikasi Next.js App Router (Client Components) dengan Vanilla CSS modern responsive (mobile-first), arsitektur modular yang memisahkan komponen reusable UI, state handlers, operasi Firebase SDK modular, dan skema data. Pengerjaan dilakukan bertahap: Bagian A (UI + Mock Data per modul) dilanjutkan Bagian B (Integrasi Firestore, Security Rules, dan Build Netlify).

**Tech Stack:** Next.js, React 19, Vanilla CSS (CSS Variables), Firebase Modular JS SDK v10+, Firestore Security Rules, Netlify.

**Spec:** [docs/superpowers/specs/2026-10-10-cuci-kilat-app-design.md](file:///c:/Users/ASUS/Documents/Bootcamp%20Web%20Pro%20PLAN/cuci-kilat-app/cuci-kilat-app/docs/superpowers/specs/2026-10-10-cuci-kilat-app-design.md)

## Global Constraints

- Nama koleksi Firestore persis: `layanan`, `pelanggan`, `order`.
- ID koleksi `pelanggan` wajib menggunakan `no_whatsapp` (format diawali `08`, 10–13 angka).
- Format tanggal order `tanggal_masuk` string `"YYYY-MM-DD"`.
- Berat cucian `berat_kg` integer 1–50 (dibulatkan ke atas).
- Kalkulasi total transaksi `total` = `harga_per_kg × berat_kg`.
- Transisi status wajib satu arah: `diterima` -> `dicuci`/`dibatalkan` -> `selesai` -> `diambil`.
- Hapus order hanya diperbolehkan untuk status `diterima` atau `dibatalkan`.
- Tiga state wajib pada setiap halaman daftar: *loading*, *empty* (dengan tombol tambah), dan *error* (dengan tombol coba lagi).
- Dialog konfirmasi wajib sebelum penghapusan data.
- Tidak menyimpan kredensial rahasia Firebase di repository.

## Review Focus

- Input berat desimal/koma (misal: 3.2 kg) harus otomatis dibulatkan ke atas menjadi integer 4 kg.
- Pendaftaran nomor WhatsApp yang sudah ada harus ditolak dengan pesan "Nomor WhatsApp sudah terdaftar" tanpa menimpa data lama.
- Perubahan harga layanan di masa depan tidak boleh mengubah harga snapshot pada order lama yang sudah tercatat.
- Order dengan status `dicuci`, `selesai`, atau `diambil` tidak boleh memiliki tombol hapus aktif atau aksinya ditolak.
- Pendapatan harian di modul laporan hanya boleh menjumlahkan order dengan status `diambil`.

---

### Task 1: Inisialisasi Proyek & Sistem Desain Antarmuka

**Files:**
- Create: `package.json`
- Create: `next.config.mjs`
- Create: `styles/globals.css`
- Create: `app/layout.js`
- Create: `app/page.js`
- Create: `netlify.toml`

**Interfaces:**
- Produces: Fondasi layout responsif, token desain global (warna, tombol, kartu, badge, tipografi), dan konfigurasi static export Next.js.

- [ ] **Step 1: Setup dependencies di `package.json` & `next.config.mjs`**
  - Konfigurasi Next.js, React, React-DOM, Firebase v10+, dan script build (`output: 'export'`).
- [ ] **Step 2: Buat desain sistem terpadu di `styles/globals.css`**
  - Variabel warna: `--primary`, `--primary-light`, `--success`, `--warning`, `--danger`, `--bg`, `--card`, `--text`, `--border`.
  - Utility classes untuk responsive container, card grid, form control, badge status, modal overlay, dan toast.
- [ ] **Step 3: Buat root layout & auto-redirect di `app/layout.js` & `app/page.js`**
  - Setup font, metadata title "Cuci Kilat - Laundry Kiloan", viewport mobile.
  - Halaman index `/` mengarahkan ke `/order`.
- [ ] **Step 4: Buat `netlify.toml` untuk konfigurasi publish directory**
  - Set build command `npm run build` dan publish directory `out`.
- [ ] **Step 5: Verifikasi instalasi dependencies dan build lokal**
  - Jalankan `npm install` dan verifikasi file struktur terbentuk.
- [ ] **Step 6: Commit**
  - `git add package.json next.config.mjs styles/globals.css app/layout.js app/page.js netlify.toml`
  - `git commit -m "chore: setup next.js project, design system, and build configuration"`

---

### Task 2: Komponen Dasar Antarmuka (Navbar, StateHandler, ConfirmDialog, Toast, Mock Data)

**Files:**
- Create: `components/Navbar.js`
- Create: `components/StateHandler.js`
- Create: `components/ConfirmDialog.js`
- Create: `components/Toast.js`
- Create: `lib/mockData.js`

**Interfaces:**
- Consumes: CSS tokens dari `styles/globals.css`.
- Produces: 
  - `Navbar`: Bilah navigasi aktif dengan 4 menu (`/layanan`, `/pelanggan`, `/order`, `/laporan`).
  - `StateHandler({ loading, error, empty, emptyMessage, onRetry, onAdd, addLabel, children })`: Komponen wrapper 3-state.
  - `ConfirmDialog({ isOpen, title, message, onConfirm, onCancel, confirmLabel, danger })`: Modal dialog konfirmasi.
  - `Toast({ message, type, onClose })`: Komponen notifikasi pop-up.
  - `mockData`: Kumpulan data contoh awal untuk `layanan`, `pelanggan`, dan `order`.

- [ ] **Step 1: Buat `lib/mockData.js` sesuai contoh dokumen skema**
  - Sertakan data contoh `layanan` (Cuci Kering, Cuci Setrika), `pelanggan` (Rizky Pratama 081298765432), dan `order` dengan berbagai status.
- [ ] **Step 2: Implementasi `components/Navbar.js`**
  - Tampilkan 4 tautan menu: Layanan, Pelanggan, Order, Laporan dengan styling aktif ramah mobile (bottom bar di layar ponsel, header di layar desktop).
- [ ] **Step 3: Implementasi `components/StateHandler.js`**
  - Menangani tampilan skeleton/spinner saat `loading`, kartu pesan disertai tombol aksi `onAdd` saat `empty`, dan kartu error disertai tombol `onRetry` saat `error`.
- [ ] **Step 4: Implementasi `components/ConfirmDialog.js` dan `components/Toast.js`**
  - Dialog modal yang mencegah aksi tidak sengaja (misal hapus data) dan Toast untuk feedback operasi CRUD.
- [ ] **Step 5: Pasang Navbar & Toast di `app/layout.js`**
- [ ] **Step 6: Commit**
  - `git add components/ lib/mockData.js app/layout.js`
  - `git commit -m "feat: add reusable navbar, state handler, confirm dialog, and toast components"`

---

### Task 3: Modul Layanan (CRUD, 3-State, Validasi)

**Files:**
- Create: `app/layanan/page.js`

**Interfaces:**
- Consumes: `StateHandler`, `ConfirmDialog`, `Toast`, `mockLayanan` dari Task 2.
- Produces: Antarmuka lengkap pengelolaan jenis layanan laundry kiloan.

- [ ] **Step 1: Implementasi formulir Tambah/Edit Layanan**
  - Field: `nama` (teks, 1–40 karakter), `harga_per_kg` (angka bulat rupiah, $\ge 0$), `estimasi_hari` (angka 1–7 hari).
  - Validasi pesan kesalahan saat input tidak sah (nama kosong, harga negatif, estimasi 0).
- [ ] **Step 2: Implementasi daftar Layanan (kartu/tabel)**
  - Tampilkan nama layanan, harga/kg, estimasi hari, tombol Ubah, dan tombol Hapus.
- [ ] **Step 3: Integrasikan ConfirmDialog untuk Hapus Layanan**
  - Tekan tombol Hapus membuka dialog konfirmasi. Jika Batal, data tetap ada. Jika Setuju, data terhapus.
- [ ] **Step 4: Hubungkan 3-State (Loading, Empty, Error)**
  - Tampilkan empty state "Belum ada layanan" dengan tombol "Tambah Layanan".
  - Sediakan simulasi error state dengan tombol "Coba Lagi".
- [ ] **Step 5: Verifikasi acceptance criteria modul Layanan di browser**
  - Uji tambah, ubah harga, batal hapus, setuju hapus, dan empty state.
- [ ] **Step 6: Commit**
  - `git add app/layanan/page.js`
  - `git commit -m "feat: implement layanan crud module with three states and validation"`

---

### Task 4: Modul Pelanggan (CRUD, Pencarian Nama/WhatsApp, 3-State)

**Files:**
- Create: `app/pelanggan/page.js`

**Interfaces:**
- Consumes: `StateHandler`, `ConfirmDialog`, `Toast`, `mockPelanggan`.
- Produces: Antarmuka lengkap data pelanggan dan pencarian cepat.

- [ ] **Step 1: Implementasi kolom pencarian instan**
  - Input cari nama atau nomor WhatsApp yang menyaring daftar pelanggan secara real-time.
- [ ] **Step 2: Implementasi formulir Tambah/Edit Pelanggan**
  - Field: `nama` (1–60 karakter), `no_whatsapp` (format diawali `08`, 10–13 angka), `alamat` (1–200 karakter).
  - Validasi: pesan kesalahan jika nomor tidak diawali `08` atau berisi karakter non-angka.
  - Pemeriksaan duplikasi: tolak penambahan jika nomor WhatsApp sudah terdaftar.
- [ ] **Step 3: Implementasi daftar Pelanggan & aksi CRUD**
  - Tampilkan kartu pelanggan, nomor WA, alamat, tombol Ubah, dan tombol Hapus dengan `ConfirmDialog`.
- [ ] **Step 4: Pasang 3-State (Loading, Empty, Error)**
  - Tampilkan pesan empty state "Belum ada pelanggan" atau pesan pencarian tidak ditemukan.
- [ ] **Step 5: Verifikasi acceptance criteria modul Pelanggan**
  - Uji validasi no WA, uji cegah duplikasi, uji filter pencarian, dan hapus pelanggan.
- [ ] **Step 6: Commit**
  - `git add app/pelanggan/page.js`
  - `git commit -m "feat: implement pelanggan crud module with search and validation"`

---

### Task 5: Modul Order (Penerimaan Cucian, Alur Status, Kalkulasi Otomatis, 3-State)

**Files:**
- Create: `app/order/page.js`

**Interfaces:**
- Consumes: Data pelanggan, data layanan, `StateHandler`, `ConfirmDialog`, `Toast`.
- Produces: Modul operasional order cucian kiloan dengan alur status terstandarisasi.

- [ ] **Step 1: Implementasi formulir Order baru**
  - Pilihan dropdown Pelanggan & Layanan.
  - Input berat (kg): otomatis membulatkan desimal ke atas ke bilangan bulat 1–50 kg.
  - Preview harga per kg dan live calculation `total = harga_per_kg × berat_kg`.
  - Input catatan opsional (maks 100 karakter).
  - Status awal otomatis disetel ke `"diterima"`.
- [ ] **Step 2: Implementasi Tab Filter Status**
  - Tab navigasi status: *Semua*, *Diterima*, *Dicuci*, *Selesai*, *Diambil*, *Dibatalkan*.
- [ ] **Step 3: Implementasi Kartu Order & Tombol Ubah Status**
  - Tampilkan rincian cucian, nomor WhatsApp pelanggan, snapshot harga & layanan.
  - Tombol aksi transisi status sesuai alur:
    - `diterima` -> tombol "Mulai Cuci" (ke `dicuci`) & "Batalkan" (ke `dibatalkan`).
    - `dicuci` -> tombol "Selesai Cuci" (ke `selesai`).
    - `selesai` -> tombol "Serahkan & Bayar" (ke `diambil`).
    - `diambil` & `dibatalkan`: status final.
- [ ] **Step 4: Implementasi proteksi penghapusan Order**
  - Tombol Hapus hanya aktif untuk status `diterima` atau `dibatalkan`.
  - Order berstatus `dicuci`, `selesai`, atau `diambil` tidak menampilkan tombol hapus.
- [ ] **Step 5: Pasang 3-State (Loading, Empty, Error)**
- [ ] **Step 6: Verifikasi alur status dan kalkulasi order**
- [ ] **Step 7: Commit**
  - `git add app/order/page.js`
  - `git commit -m "feat: implement order module with status transitions and auto total"`

---

### Task 6: Modul Laporan Harian (Filter Tanggal, Agregasi, dan Rincian)

**Files:**
- Create: `app/laporan/page.js`

**Interfaces:**
- Consumes: Koleksi order, `StateHandler`.
- Produces: Ringkasan pendapatan dan beban kerja cucian harian.

- [ ] **Step 1: Implementasi pemilih tanggal transaksi**
  - Input date picker (default hari ini dalam format `YYYY-MM-DD`).
- [ ] **Step 2: Implementasi agregasi metrik harian**
  - Hitung total order aktif (selain `dibatalkan`).
  - Hitung total berat (kg) seluruh order aktif.
  - Hitung total pendapatan (Rp) **khusus dari order berstatus `diambil`**.
- [ ] **Step 3: Tampilkan Kartu Metrik & Tabel Rincian per Layanan**
  - 3 kartu metrik ringkasan (Order, Berat, Pendapatan).
  - Tabel rincian total kg dan pendapatan per jenis layanan.
- [ ] **Step 4: Pasang 3-State (Loading, Empty State jika tidak ada order pada tanggal tersebut, Error State)**
- [ ] **Step 5: Verifikasi keakuratan kalkulasi laporan**
- [ ] **Step 6: Commit**
  - `git add app/laporan/page.js`
  - `git commit -m "feat: implement daily report module with metric cards and date filter"`

---

### Task 7: Integrasi Cloud Firestore (Bagian B)

**Files:**
- Create: `lib/firebase.js`
- Create: `.env.example`
- Modify: `app/layanan/page.js`
- Modify: `app/pelanggan/page.js`
- Modify: `app/order/page.js`
- Modify: `app/laporan/page.js`

**Interfaces:**
- Consumes: Firebase Modular SDK v10+.
- Produces: Operasi database real-time/cloud Firestore untuk semua modul.

- [ ] **Step 1: Setup koneksi Firebase di `lib/firebase.js` & `.env.example`**
  - Inisialisasi Firebase App dan `getFirestore(app)`.
  - Konfigurasi environment variables `NEXT_PUBLIC_FIREBASE_*`.
  - Sediakan fallback transisi yang elegan jika config belum terisi (tetap bisa fallback ke mock data lokal atau menampilkan error state terarah).
- [ ] **Step 2: Hubungkan Firestore pada Modul Layanan**
  - Gunakan `getDocs(query(collection(db, "layanan"), orderBy("nama"), limit(20)))`.
  - Gunakan `addDoc`, `updateDoc`, dan `deleteDoc`.
- [ ] **Step 3: Hubungkan Firestore pada Modul Pelanggan**
  - Gunakan `getDoc(doc(db, "pelanggan", noWhatsapp))` untuk cek duplikasi, lalu `setDoc` jika baru.
  - Gunakan `updateDoc` dan `deleteDoc`.
- [ ] **Step 4: Hubungkan Firestore pada Modul Order**
  - Gunakan `addDoc` dengan data snapshot `nama_pelanggan`, `nama_layanan`, `harga_per_kg`, dan `serverTimestamp()`.
  - Gunakan `getDocs(query(collection(db, "order"), orderBy("dibuat_pada", "desc"), limit(20)))`.
  - Gunakan `updateDoc` untuk perubahan status dan `deleteDoc` untuk order `diterima`/`dibatalkan`.
- [ ] **Step 5: Hubungkan Firestore pada Modul Laporan**
  - Gunakan `getDocs(query(collection(db, "order"), where("tanggal_masuk", "==", tanggal)))`.
- [ ] **Step 6: Verifikasi operasi Firestore end-to-end**
- [ ] **Step 7: Commit**
  - `git add lib/firebase.js .env.example app/`
  - `git commit -m "feat: integrate modular firestore sdk across all modules"`

---

### Task 8: Aturan Keamanan Data (firestore.rules) & Final Build Verification

**Files:**
- Create: `firestore.rules`
- Modify: `README.md`

**Interfaces:**
- Produces: Aturan keamanan Firestore siap pakai dan panduan instalasi/pengujian.

- [ ] **Step 1: Tulis `firestore.rules` lengkap sesuai Bagian 7 Dokumen Skema**
  - Rule `layanan`: validasi nama (1–40 karakter), harga bulat $\ge 0$, estimasi hari 1–7.
  - Rule `pelanggan`: ID dokumen = `no_whatsapp`, nomor diawali `08`, nama dan alamat wajib ada.
  - Rule `order`: berat bulat 1–50, total sesuai rumus, status awal `diterima`, alur status tidak melompat, hapus hanya untuk status `diterima`/`dibatalkan`.
- [ ] **Step 2: Buat dokumentasi `README.md`**
  - Panduan setup Firebase, konfigurasi environment variables, cara build & deploy ke Netlify, dan lembar uji 6 masukan tidak sah.
- [ ] **Step 3: Jalankan verifikasi build lokal Next.js**
  - Eksekusi `npm run build` untuk memastikan tidak ada kesalahan kompilasi atau link yang rusak.
- [ ] **Step 4: Commit**
  - `git add firestore.rules README.md`
  - `git commit -m "feat: add firestore security rules, documentation, and verify build"`

---
