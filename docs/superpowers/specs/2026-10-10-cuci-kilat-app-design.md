# Desain Arsitektur & Spesifikasi: Cuci Kilat (Laundry Kiloan)

- **Tanggal**: 2026-10-10
- **Status**: Disetujui
- **Dasar Acuan**: PRD Cuci Kilat (Tugas Mandiri Sesi 3) & Skema Firestore Cuci Kilat

---

## 1. Ringkasan Eksekutif & Tujuan

Cuci Kilat adalah aplikasi web manajemen operasional laundry kiloan milik Sari. Aplikasi ini menggantikan pencatatan manual berbasis nota kertas dengan sistem digital terpadu untuk:
- Mengelola data master layanan laundry dan tarifnya.
- Mengelola database pelanggan dan pencarian nomor WhatsApp.
- Mencatat penerimaan order cucian, kalkulasi otomatis, dan pembaruan alur status.
- Menyediakan laporan harian pendapatan dan total kilogram cucian berdasarkan tanggal transaksi.

---

## 2. Arsitektur Teknologi & Infrastruktur

- **Framework**: Next.js (App Router, React 19 / Client Components).
- **Styling**: Vanilla CSS / Modern CSS Variables (Design System Sesi 3), ramah layar ponsel (mobile-first responsif).
- **Database**: Cloud Firestore menggunakan Firebase JavaScript SDK v10+ (versi modular: `collection`, `doc`, `addDoc`, `setDoc`, `getDoc`, `getDocs`, `updateDoc`, `deleteDoc`, `query`, `where`, `orderBy`, `limit`, `serverTimestamp`).
- **Aturan Keamanan Data**: Firestore Security Rules (`firestore.rules`).
- **Deployment**: Netlify (Single Page / Static Web Output dengan `netlify.toml`).

---

## 3. Struktur Direktori Proyek

```text
cuci-kilat-app/
├── app/
│   ├── layout.js              # Root layout dengan Navigasi dan Toast Notification container
│   ├── page.js                # Halaman pembuka (auto redirect ke /order)
│   ├── layanan/
│   │   └── page.js            # Modul CRUD Master Layanan
│   ├── pelanggan/
│   │   └── page.js            # Modul CRUD Pelanggan & Filter Pencarian
│   ├── order/
│   │   └── page.js            # Modul CRUD Order, Tab Filter Status, & Formulir Transaksi
│   └── laporan/
│       └── page.js            # Modul Laporan Harian (Filter Tanggal & Agregasi)
├── components/
│   ├── Navbar.js              # Bilah navigasi 4 menu (Layanan, Pelanggan, Order, Laporan)
│   ├── ConfirmDialog.js       # Dialog konfirmasi aksi berbahaya (Hapus / Batal)
│   ├── Toast.js               # Komponen umpan balik notifikasi
│   └── StateHandler.js        # Penangan 3 state: Loading, Empty State (dengan CTA), Error State (dengan tombol Coba Lagi)
├── lib/
│   ├── firebase.js            # Konfigurasi & inisialisasi Firestore
│   └── mockData.js            # Mock data untuk pengujian Bagian A
├── styles/
│   └── globals.css            # Desain sistem (CSS tokens, warna status, utilitas kartu & form)
├── firestore.rules            # Security rules untuk koleksi Firestore
├── netlify.toml               # Konfigurasi deploy Netlify
└── package.json
```

---

## 4. Spesifikasi Skema Data (Cloud Firestore)

### 4.1 Koleksi `layanan`
- **ID Dokumen**: Dibuat otomatis oleh Firestore.
- **Fields**:
  - `nama`: `string` (Wajib, 1–40 karakter).
  - `harga_per_kg`: `number` (Wajib, bilangan bulat rupiah, $\ge 0$).
  - `estimasi_hari`: `number` (Wajib, bilangan bulat 1–7).
  - `dibuat_pada`: `timestamp` (Wajib, `serverTimestamp()`).

### 4.2 Koleksi `pelanggan`
- **ID Dokumen**: `no_whatsapp` (Nomor WhatsApp unik pelanggan).
- **Fields**:
  - `no_whatsapp`: `string` (Wajib, diawali `08`, 10–13 angka).
  - `nama`: `string` (Wajib, 1–60 karakter).
  - `alamat`: `string` (Wajib, 1–200 karakter).
  - `dibuat_pada`: `timestamp` (Wajib, `serverTimestamp()`).
- **Aturan Integritas**: Sebelum menyimpan pelanggan baru dengan `setDoc`, aplikasi wajib memverifikasi ketiadaan dokumen menggunakan `getDoc`. Jika sudah terdaftar, tolak dengan pesan *"Nomor WhatsApp sudah terdaftar"*.

### 4.3 Koleksi `order`
- **ID Dokumen**: Dibuat otomatis oleh Firestore.
- **Fields**:
  - `pelanggan_id`: `string` (Wajib, nomor WhatsApp pelanggan).
  - `nama_pelanggan`: `string` (Wajib, snapshot nama pelanggan saat order dibuat).
  - `layanan_id`: `string` (Wajib, ID dokumen layanan terkait).
  - `nama_layanan`: `string` (Wajib, snapshot nama layanan saat order dibuat).
  - `harga_per_kg`: `number` (Wajib, snapshot harga layanan saat order dibuat).
  - `berat_kg`: `number` (Wajib, bilangan bulat 1–50 kg, pembulatan ke atas dari timbangan).
  - `total`: `number` (Wajib, kalkulasi otomatis: `harga_per_kg × berat_kg`).
  - `status`: `string` (Wajib, nilai awal selalu `"diterima"`).
  - `catatan`: `string` (Opsional, teks maksimal 100 karakter).
  - `tanggal_masuk`: `string` (Wajib, format tanggal ISO `"YYYY-MM-DD"`).
  - `dibuat_pada`: `timestamp` (Wajib, `serverTimestamp()`).

---

## 5. Alur Status & Aturan Operasi Order

### 5.1 Alur Transisi Status
Order hanya dapat berpindah status mengikuti jalur satu arah:
1. `diterima` $\rightarrow$ `dicuci` ATAU `dibatalkan`
2. `dicuci` $\rightarrow$ `selesai`
3. `selesai` $\rightarrow$ `diambil`
4. Status `diambil` dan `dibatalkan` bersifat final dan tidak dapat diubah lagi.
5. Status dilarang melompat atau mundur (misalnya: `diterima` langsung ke `diambil` ditolak).

### 5.2 Aturan Penghapusan Order
- Order **hanya boleh dihapus** jika berstatus `diterima` atau `dibatalkan`.
- Order berstatus `dicuci`, `selesai`, atau `diambil` **dilarang dihapus**.

---

## 6. Spesifikasi Antarmuka & Kebutuhan Fungsional

### 6.1 Tiga State Wajib
Setiap halaman daftar (`/layanan`, `/pelanggan`, `/order`, `/laporan`) wajib mengimplementasikan:
1. **Loading State**: Animasi indikator pemuatan / skeleton.
2. **Empty State**: Pesan jelas saat data belum ada disertai tombol aksi penambahan data.
3. **Error State**: Pesan kegagalan ramah pengguna dengan tombol *"Coba Lagi"* yang memicu pemuatan ulang.

### 6.2 Modul Layanan (`/layanan`)
- Daftar layanan terurut berdasarkan nama dengan pembatasan `limit(20)`.
- Formulir tambah dan edit layanan dengan validasi inline.
- Tombol Hapus memicu `ConfirmDialog`. Jika pengguna memilih Batal, data tetap aman.

### 6.3 Modul Pelanggan (`/pelanggan`)
- Kolom pencarian teks instan yang menyaring berdasarkan nama atau nomor WhatsApp.
- Formulir tambah dan edit pelanggan dengan validasi format nomor WhatsApp (`08...`, 10–13 angka).
- Peringatan duplikasi nomor WhatsApp sebelum penyimpanan.

### 6.4 Modul Order (`/order`)
- Tab filter status: *Semua*, *Diterima*, *Dicuci*, *Selesai*, *Diambil*, *Dibatalkan*.
- Formulir order:
  - Dropdown pelanggan dan dropdown layanan.
  - Saat layanan dipilih, harga per kg ditampilkan otomatis.
  - Input berat (kg) dengan pembulatan ke atas otomatis dan preview kalkulasi total harga.
  - Input catatan opsional (maks 100 karakter).
- Kartu order dengan badge status, tombol pembaruan status sesuai alur, dan tombol hapus kondisional (hanya jika `diterima` atau `dibatalkan`).

### 6.5 Modul Laporan (`/laporan`)
- Pemilih tanggal transaksi (`tanggal_masuk`).
- Tiga kartu metrik:
  - **Jumlah Order**: Dihitung dari order pada tanggal tersebut yang bukan `dibatalkan`.
  - **Total Berat (kg)**: Akumulasi kilogram order aktif.
  - **Total Pendapatan (Rp)**: Akumulasi total order yang berstatus `diambil`.
- Tabel distribusi kilogram per layanan.

---

## 7. Keamanan Data (Firestore Security Rules)

Berkas `firestore.rules` wajib memvalidasi:
- `layanan`: Validasi tipe field, panjang nama 1–40 karakter, `harga_per_kg >= 0`, `estimasi_hari` 1–7.
- `pelanggan`: ID dokumen harus sama dengan field `no_whatsapp`, diawali `08`, nama dan alamat terisi.
- `order`: `berat_kg` antara 1–50, `total == harga_per_kg * berat_kg`, status awal `diterima`, transisi status sesuai alur yang sah, serta penghapusan hanya untuk `diterima` atau `dibatalkan`.

---

## 8. Verifikasi & Kriteria Keberhasilan

1. CRUD berfungsi pada ketiga koleksi (`layanan`, `pelanggan`, `order`).
2. Tiga state (loading, empty, error) muncul dengan benar pada setiap halaman daftar.
3. Alur status berjalan ketat tanpa loncatan dan penghapusan terjaga.
4. Perhitungan total order dan laporan harian akurat.
5. Konfirmasi hapus selalu ditampilkan sebelum penghapusan data.
6. Security rules menolak masukan tidak sah.
7. Aplikasi berhasil di-build dan siap tayang di Netlify.
