/**
 * Aturan Bisnis & Validasi Skema Cuci Kilat
 */

export function validateLayanan({ nama, harga_per_kg, estimasi_hari }) {
  if (!nama || typeof nama !== 'string' || nama.trim().length === 0) {
    return { isValid: false, error: 'Nama layanan wajib diisi.' };
  }
  if (nama.trim().length > 40) {
    return { isValid: false, error: 'Nama layanan maksimal 40 karakter.' };
  }
  const harga = Number(harga_per_kg);
  if (isNaN(harga) || !Number.isInteger(harga) || harga < 0) {
    return { isValid: false, error: 'Harga per kg harus angka bulat minimal 0.' };
  }
  const estimasi = Number(estimasi_hari);
  if (isNaN(estimasi) || !Number.isInteger(estimasi) || estimasi < 1 || estimasi > 7) {
    return { isValid: false, error: 'Estimasi hari harus angka bulat antara 1 sampai 7 hari.' };
  }
  return { isValid: true, error: null };
}

export function validatePelanggan({ nama, no_whatsapp, alamat }) {
  if (!nama || typeof nama !== 'string' || nama.trim().length === 0) {
    return { isValid: false, error: 'Nama pelanggan wajib diisi.' };
  }
  if (nama.trim().length > 60) {
    return { isValid: false, error: 'Nama pelanggan maksimal 60 karakter.' };
  }
  if (!no_whatsapp || typeof no_whatsapp !== 'string') {
    return { isValid: false, error: 'Nomor WhatsApp wajib diisi.' };
  }
  const cleanWa = no_whatsapp.trim();
  if (!cleanWa.startsWith('08')) {
    return { isValid: false, error: 'Nomor WhatsApp harus diawali 08.' };
  }
  if (!/^\d+$/.test(cleanWa)) {
    return { isValid: false, error: 'Nomor WhatsApp hanya boleh berisi angka.' };
  }
  if (cleanWa.length < 10 || cleanWa.length > 13) {
    return { isValid: false, error: 'Nomor WhatsApp harus terdiri dari 10 sampai 13 angka.' };
  }
  if (!alamat || typeof alamat !== 'string' || alamat.trim().length === 0) {
    return { isValid: false, error: 'Alamat pelanggan wajib diisi.' };
  }
  if (alamat.trim().length > 200) {
    return { isValid: false, error: 'Alamat maksimal 200 karakter.' };
  }
  return { isValid: true, error: null };
}

export function calculateOrder(harga_per_kg, input_berat) {
  const rawBerat = Number(input_berat);
  if (isNaN(rawBerat) || rawBerat <= 0) {
    return { isValid: false, error: 'Berat cucian harus lebih dari 0 kg.' };
  }
  // Pembulatan berat ke atas (misal 3.2 kg -> 4 kg)
  const berat_kg = Math.ceil(rawBerat);
  if (berat_kg > 50) {
    return { isValid: false, error: 'Berat cucian maksimal 50 kg.' };
  }
  const harga = Number(harga_per_kg);
  const total = harga * berat_kg;
  return {
    isValid: true,
    error: null,
    berat_kg,
    total
  };
}

export function canTransitionStatus(fromStatus, toStatus) {
  const allowedTransitions = {
    diterima: ['dicuci', 'dibatalkan'],
    dicuci: ['selesai'],
    selesai: ['diambil'],
    diambil: [],
    dibatalkan: []
  };

  const allowed = allowedTransitions[fromStatus] || [];
  return allowed.includes(toStatus);
}

export function canDeleteOrder(status) {
  // Order hanya boleh dihapus jika status diterima atau dibatalkan
  return status === 'diterima' || status === 'dibatalkan';
}

export function calculateDailyReport(orders, targetDate) {
  const filtered = orders.filter((o) => o.tanggal_masuk === targetDate);
  const activeOrders = filtered.filter((o) => o.status !== 'dibatalkan');

  const total_order = activeOrders.length;
  const total_berat_kg = activeOrders.reduce((acc, curr) => acc + (curr.berat_kg || 0), 0);

  // Pendapatan HANYA dihitung dari order berstatus 'diambil'
  const diambilOrders = activeOrders.filter((o) => o.status === 'diambil');
  const total_pendapatan = diambilOrders.reduce((acc, curr) => acc + (curr.total || 0), 0);

  // Breakdown per jenis layanan
  const rincianLayanan = {};
  for (const o of activeOrders) {
    const nama = o.nama_layanan || 'Lainnya';
    if (!rincianLayanan[nama]) {
      rincianLayanan[nama] = {
        nama_layanan: nama,
        total_order: 0,
        total_kg: 0,
        pendapatan: 0
      };
    }
    rincianLayanan[nama].total_order += 1;
    rincianLayanan[nama].total_kg += (o.berat_kg || 0);
    if (o.status === 'diambil') {
      rincianLayanan[nama].pendapatan += (o.total || 0);
    }
  }

  return {
    tanggal: targetDate,
    total_order,
    total_berat_kg,
    total_pendapatan,
    rincian: Object.values(rincianLayanan)
  };
}
