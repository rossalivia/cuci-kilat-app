# 🧺 Cuci Kilat (Laundry Kiloan) - Aplikasi CRUD

Aplikasi web manajemen operasional laundry kiloan milik Sari, dibangun untuk **Tugas Mandiri Sesi 3 (Bootcamp Web Programming with AI by Plan Indonesia)**.

---

## 🌟 Fitur Utama (4 Modul)

1. **Modul Layanan (`/layanan`)**:
   - CRUD jenis layanan, harga per kg (bulat $\ge 0$), dan estimasi hari (1–7 hari).
   - Dialog konfirmasi sebelum hapus layanan.
   - Penanganan 3 state (*loading*, *empty*, *error* dengan tombol Coba Lagi).

2. **Modul Pelanggan (`/pelanggan`)**:
   - Pencarian instan berdasarkan nama atau nomor WhatsApp.
   - Pendaftaran member baru dengan validasi nomor WhatsApp (format `08...`, 10–13 angka).
   - Pemeriksaan duplikasi nomor WhatsApp sebelum penyimpanan.
   - Dialog konfirmasi sebelum hapus.

3. **Modul Order (`/order`)**:
   - Pencatatan cucian kiloan dengan dropdown pelanggan dan layanan.
   - Pembulatan timbangan ke atas otomatis (misal: 3,2 kg menjadi 4 kg) dengan batas 1–50 kg.
   - Kalkulasi otomatis total biaya (`harga_per_kg × berat_kg`).
   - Penyalinan nilai snapshot harga dan nama layanan agar tidak terpengaruh perubahan master di masa depan.
   - Transisi status satu arah: `diterima` $\rightarrow$ `dicuci`/`dibatalkan` $\rightarrow$ `selesai` $\rightarrow$ `diambil`.
   - Proteksi hapus: order berstatus `dicuci`, `selesai`, atau `diambil` dilarang dihapus.

4. **Modul Laporan (`/laporan`)**:
   - Pemilih tanggal transaksi harian.
   - Kartu metrik: Jumlah order aktif, Total berat (kg), dan Total pendapatan (Rp).
   - Pendapatan kasir **hanya dihitung dari order yang sudah berstatus `diambil`** (lunas).
   - Tabel rincian kontribusi kilogram dan omzet per jenis layanan.

---

## 🛠️ Teknologi yang Digunakan

- **Frontend**: Next.js 14 (App Router, Client Components)
- **Styling**: Vanilla CSS (CSS Variables) - Responsif & Mobile-First
- **Database**: Cloud Firestore (Firebase Modular JavaScript SDK v10+)
- **Security Rules**: `firestore.rules`
- **Hosting / Deployment**: Netlify (`netlify.toml`, Static Export `out/`)

---

## 🚀 Panduan Menjalankan Secara Lokal

### 1. Instalasi Dependensi
```bash
npm install
```

### 2. Jalankan Mode Pengembangan
```bash
npm run dev
```
Buka browser di `http://localhost:3000`.

### 3. Menjalankan Unit Test
```bash
npm test
```

### 4. Build Produksi (Static Export)
```bash
npm run build
```
Hasil build siap tayang di folder `out/`.

---

## ☁️ Menghubungkan ke Cloud Firestore (Bagian B)

1. Buat proyek baru di [Firebase Console](https://console.firebase.google.com/).
2. Aktifkan **Cloud Firestore**.
3. Buka **Project Settings** $\rightarrow$ **General** $\rightarrow$ **Your apps** $\rightarrow$ Tambah Web App (`</>`).
4. Salin kunci konfigurasi ke file `.env.local`:
```env
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSy...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=cuci-kilat-app.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=cuci-kilat-app
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=cuci-kilat-app.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789012
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789012:web:abcdef123456
```
5. Salin isi berkas `firestore.rules` ke tab **Firestore Database** $\rightarrow$ **Rules** di Firebase Console, lalu tekan **Publish**.

---

## 🌐 Panduan Publikasi ke Netlify

1. Push repository ini ke GitHub.
2. Di dashboard [Netlify](https://app.netlify.com/), pilih **Add new site** $\rightarrow$ **Import an existing project** $\rightarrow$ Hubungkan ke repositori GitHub.
3. Konfigurasi build otomatis terdeteksi via `netlify.toml`:
   - **Build command**: `npm run build`
   - **Publish directory**: `out`
4. Di bagian **Site configuration** $\rightarrow$ **Environment variables**, tambahkan variabel `NEXT_PUBLIC_FIREBASE_*` dari file `.env.local`.
5. Tekan **Deploy Site**.

---

## 📝 Lembar Uji Mandiri: 6 Masukan Tidak Sah

| No | Pengujian | Input yang Diuji | Hasil yang Diharapkan |
| :--- | :--- | :--- | :--- |
| 1 | **Field Kosong** | Nama layanan kosong | Ditolak form & rules dengan pesan *"Nama layanan wajib diisi"* |
| 2 | **Tipe Salah** | No WhatsApp berisi huruf (misal `0812abcd34`) | Ditolak dengan pesan *"Nomor WhatsApp hanya boleh berisi angka"* |
| 3 | **Teks Terlalu Panjang** | Nama layanan > 40 karakter | Ditolak oleh formulir dan rules |
| 4 | **Nilai Negatif** | Harga layanan `-5000` atau Berat `0` | Ditolak oleh validasi dan security rules |
| 5 | **Nilai di Luar Batas** | Berat cucian `55 kg` (maksimal 50 kg) | Ditolak dengan pesan *"Berat cucian maksimal 50 kg"* |
| 6 | **Perubahan Status Ilegal** | Order `diterima` langsung diubah ke `diambil` | Ditolak oleh alur transisi dan security rules |
