// Data contoh awal sesuai skema dan PRD Cuci Kilat

export const initialLayanan = [
  {
    id: "Lx31aQe",
    nama: "Cuci Setrika",
    harga_per_kg: 10000,
    estimasi_hari: 3,
    dibuat_pada: "2026-10-01T08:00:00Z"
  },
  {
    id: "Lx32bKf",
    nama: "Cuci Kering",
    harga_per_kg: 7000,
    estimasi_hari: 2,
    dibuat_pada: "2026-10-01T08:05:00Z"
  },
  {
    id: "Lx33cExp",
    nama: "Kilat 1 Hari",
    harga_per_kg: 15000,
    estimasi_hari: 1,
    dibuat_pada: "2026-10-01T08:10:00Z"
  }
];

export const initialPelanggan = [
  {
    id: "081298765432",
    no_whatsapp: "081298765432",
    nama: "Rizky Pratama",
    alamat: "Kos Melati kamar 5, Jl. Kampus No. 8",
    dibuat_pada: "2026-10-01T08:10:00Z"
  },
  {
    id: "081345678901",
    no_whatsapp: "081345678901",
    nama: "Siti Rahma",
    alamat: "Asrama Putri Blok B No. 4",
    dibuat_pada: "2026-10-02T09:15:00Z"
  },
  {
    id: "081211223344",
    no_whatsapp: "081211223344",
    nama: "Budi Santoso",
    alamat: "Jl. Mawar No. 15",
    dibuat_pada: "2026-10-03T10:00:00Z"
  }
];

// Helper untuk format YYYY-MM-DD hari ini
export const getTodayDateString = () => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const initialOrder = [
  {
    id: "Od82kPz",
    pelanggan_id: "081298765432",
    nama_pelanggan: "Rizky Pratama",
    layanan_id: "Lx31aQe",
    nama_layanan: "Cuci Setrika",
    harga_per_kg: 10000,
    berat_kg: 4,
    total: 40000,
    status: "diterima",
    catatan: "Jangan pakai pewangi",
    tanggal_masuk: getTodayDateString(),
    dibuat_pada: new Date().toISOString()
  },
  {
    id: "Od83mQx",
    pelanggan_id: "081345678901",
    nama_pelanggan: "Siti Rahma",
    layanan_id: "Lx32bKf",
    nama_layanan: "Cuci Kering",
    harga_per_kg: 7000,
    berat_kg: 3,
    total: 21000,
    status: "dicuci",
    catatan: "Baju putih dipisah",
    tanggal_masuk: getTodayDateString(),
    dibuat_pada: new Date().toISOString()
  },
  {
    id: "Od84nRy",
    pelanggan_id: "081211223344",
    nama_pelanggan: "Budi Santoso",
    layanan_id: "Lx33cExp",
    nama_layanan: "Kilat 1 Hari",
    harga_per_kg: 15000,
    berat_kg: 2,
    total: 30000,
    status: "selesai",
    catatan: "",
    tanggal_masuk: getTodayDateString(),
    dibuat_pada: new Date().toISOString()
  },
  {
    id: "Od85oSz",
    pelanggan_id: "081298765432",
    nama_pelanggan: "Rizky Pratama",
    layanan_id: "Lx32bKf",
    nama_layanan: "Cuci Kering",
    harga_per_kg: 7000,
    berat_kg: 5,
    total: 35000,
    status: "diambil",
    catatan: "Sudah lunas tunai",
    tanggal_masuk: getTodayDateString(),
    dibuat_pada: new Date().toISOString()
  }
];
