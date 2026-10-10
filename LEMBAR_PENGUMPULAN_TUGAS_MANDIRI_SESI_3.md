# LEMBAR PENGUMPULAN TUGAS MANDIRI SESI 3
**Bootcamp Web Programming with AI by Plan Indonesia**

---

### Informasi Pengumpulan
* **Nama Peserta**: Rossa Livia
* **Email**: rossalivia111@gmail.com
* **Tanggal**: 8 Oktober 2026
* **Pilihan Aplikasi**: Cuci Kilat (Laundry Kiloan)
* **URL Publik Netlify**: [https://cuci-kilat-app.netlify.app](https://cuci-kilat-app.netlify.app)
* **URL Repositori GitHub**: [https://github.com/rossalivia/cuci-kilat-app](https://github.com/rossalivia/cuci-kilat-app)

---

## 1. Ringkasan Eksekutif & Deskripsi Aplikasi
Aplikasi **Cuci Kilat** dibangun untuk usaha laundry kiloan milik Sari guna mendigitalkan pencatatan operasional, mencegah nota kertas hilang, mengotomatisasi perhitungan tagihan kasir (tarif $\times$ berat dibulatkan ke atas), mengawal alur status pengerjaan cucian, serta menyediakan rekapitulasi laporan harian.

Aplikasi dibangun menggunakan **Next.js 14**, **React**, **Cloud Firestore (Modular SDK v10+)**, **Firestore Security Rules**, dan diterbitkan di **Netlify**.

---

## 2. Struktur Data Firestore (3 Koleksi)

1. **Koleksi `layanan`** (Auto ID):
   - `nama`: String (1–40 karakter)
   - `harga_per_kg`: Number integer ($\ge 0$)
   - `estimasi_hari`: Number integer (1–7 hari)
   - `dibuat_pada`: Timestamp (`serverTimestamp()`)

2. **Koleksi `pelanggan`** (ID: Nomor WhatsApp):
   - `no_whatsapp`: String diawali `08`, 10–13 digit
   - `nama`: String (1–60 karakter)
   - `alamat`: String (1–200 karakter)
   - `dibuat_pada`: Timestamp (`serverTimestamp()`)

3. **Koleksi `order`** (Auto ID):
   - `pelanggan_id`: String (No. WA)
   - `nama_pelanggan`: String snapshot
   - `layanan_id`: String
   - `nama_layanan`: String snapshot
   - `harga_per_kg`: Number snapshot
   - `berat_kg`: Number integer (1–50 kg, pembulatan ke atas)
   - `total`: Number integer (`harga_per_kg × berat_kg`)
   - `status`: String (`diterima` | `dicuci` | `selesai` | `diambil` | `dibatalkan`)
   - `catatan`: String opsional (maks 100 karakter)
   - `tanggal_masuk`: String (`YYYY-MM-DD`, default `2026-10-08`)
   - `dibuat_pada`: Timestamp (`serverTimestamp()`)

---

## 3. Bukti Pemenuhan Tiga State (Loading, Empty, Error)
Setiap halaman daftar (`/layanan`, `/pelanggan`, `/order`, `/laporan`) memiliki komponen penangan 3 state terpadu (`StateHandler`):
- **Loading State**: Animasi *skeleton shimmer* saat data sedang diambil dari Firestore.
- **Empty State**: Tampilan informatif saat koleksi kosong, dilengkapi tombol ajakan bertindak (CTA) untuk menambah data pertama.
- **Error State**: Tampilan ramah pengguna saat koneksi terputus, dilengkapi tombol **"🔄 Coba Lagi"** untuk memicu *refetch*.

---

## 4. Lembar Uji Mandiri: 6 Masukan Tidak Sah

| No | Pengujian | Masukan yang Diuji | Hasil Pengujian di Browser & Firestore Rules | Status |
| :---: | :--- | :--- | :--- | :---: |
| 1 | **Field Kosong** | Nama layanan dikosongkan saat submit | Ditolak oleh formulir & security rules dengan pesan *"Nama layanan wajib diisi"*. Data tidak tersimpan. | **LULUS** |
| 2 | **Tipe Salah** | No WhatsApp diisi huruf: `0812abcd34` | Ditolak dengan pesan *"Nomor WhatsApp hanya boleh berisi angka"*. Dokumen ditolak rules. | **LULUS** |
| 3 | **Teks Terlalu Panjang** | Nama layanan lebih dari 40 karakter | Ditolak oleh validasi formulir dan batasan rules `val.size() <= 40`. | **LULUS** |
| 4 | **Nilai Negatif** | Harga layanan diisi `-5000` atau berat `0` | Ditolak dengan pesan *"Harga per kg harus angka bulat minimal 0"*. | **LULUS** |
| 5 | **Nilai di Luar Batas** | Berat cucian diisi `55 kg` | Ditolak oleh validasi dan rules dengan pesan *"Berat cucian maksimal 50 kg"*. | **LULUS** |
| 6 | **Perubahan Status Ilegal** | Mengubah status dari `diterima` langsung ke `diambil` | Ditolak oleh alur transisi dan security rules `firestore.rules`. Tombol tidak tersedia dan update ditolak. | **LULUS** |

---

## 5. Salinan Berkas `firestore.rules`

```rules
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {

    function isNonEmptyString(val, maxLen) {
      return val is string && val.size() > 0 && val.size() <= maxLen;
    }

    function isInteger(val) {
      return val is int;
    }

    // 1. Koleksi Layanan
    match /layanan/{layananId} {
      allow read: if true;
      allow create, update: if
        isNonEmptyString(request.resource.data.nama, 40) &&
        isInteger(request.resource.data.harga_per_kg) &&
        request.resource.data.harga_per_kg >= 0 &&
        isInteger(request.resource.data.estimasi_hari) &&
        request.resource.data.estimasi_hari >= 1 &&
        request.resource.data.estimasi_hari <= 7;
      allow delete: if true;
    }

    // 2. Koleksi Pelanggan
    match /pelanggan/{noWhatsapp} {
      allow read: if true;
      allow create, update: if
        request.resource.data.no_whatsapp == noWhatsapp &&
        request.resource.data.no_whatsapp is string &&
        request.resource.data.no_whatsapp.matches('^08[0-9]{8,11}$') &&
        isNonEmptyString(request.resource.data.nama, 60) &&
        isNonEmptyString(request.resource.data.alamat, 200);
      allow delete: if true;
    }

    // 3. Koleksi Order
    match /order/{orderId} {
      allow read: if true;
      allow create: if
        isInteger(request.resource.data.berat_kg) &&
        request.resource.data.berat_kg >= 1 &&
        request.resource.data.berat_kg <= 50 &&
        isInteger(request.resource.data.harga_per_kg) &&
        request.resource.data.harga_per_kg >= 0 &&
        request.resource.data.total == request.resource.data.harga_per_kg * request.resource.data.berat_kg &&
        request.resource.data.status == 'diterima' &&
        isNonEmptyString(request.resource.data.pelanggan_id, 30) &&
        isNonEmptyString(request.resource.data.layanan_id, 40) &&
        request.resource.data.tanggal_masuk is string;

      allow update: if
        request.resource.data.total == resource.data.total &&
        request.resource.data.berat_kg == resource.data.berat_kg &&
        request.resource.data.harga_per_kg == resource.data.harga_per_kg &&
        (
          (resource.data.status == 'diterima' && (request.resource.data.status == 'dicuci' || request.resource.data.status == 'dibatalkan')) ||
          (resource.data.status == 'dicuci' && request.resource.data.status == 'selesai') ||
          (resource.data.status == 'selesai' && request.resource.data.status == 'diambil')
        );

      allow delete: if resource.data.status == 'diterima' || resource.data.status == 'dibatalkan';
    }
  }
}
```

---

## 6. Kriteria Selesai (Rubrik Penilaian)
- [x] CRUD berjalan pada ketiga koleksi (`layanan`, `pelanggan`, `order`)
- [x] Nama koleksi dan field persis sesuai skema
- [x] Total transaksi dihitung otomatis (`harga × berat`)
- [x] Alur status berjalan sesuai tabel PRD
- [x] Tiga state (loading, empty, error) terpasang di semua daftar
- [x] Hapus selalu dikonfirmasi
- [x] Security rules aktif dan menolak data tidak sah
- [x] Aplikasi tayang di Netlify: [https://cuci-kilat-app.netlify.app](https://cuci-kilat-app.netlify.app)
- [x] Repositori publik di GitHub: [https://github.com/rossalivia/cuci-kilat-app](https://github.com/rossalivia/cuci-kilat-app)
