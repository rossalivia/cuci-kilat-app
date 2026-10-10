import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  validateLayanan,
  validatePelanggan,
  calculateOrder,
  canTransitionStatus,
  canDeleteOrder,
  calculateDailyReport
} from './businessRules.js';

describe('1. Validasi Layanan', () => {
  test('Layanan sah diterima', () => {
    const result = validateLayanan({
      nama: 'Cuci Setrika',
      harga_per_kg: 10000,
      estimasi_hari: 3
    });
    assert.equal(result.isValid, true);
    assert.equal(result.error, null);
  });

  test('Nama layanan kosong ditolak', () => {
    const result = validateLayanan({
      nama: '',
      harga_per_kg: 10000,
      estimasi_hari: 3
    });
    assert.equal(result.isValid, false);
    assert.match(result.error, /nama/i);
  });

  test('Nama layanan lebih dari 40 karakter ditolak', () => {
    const result = validateLayanan({
      nama: 'A'.repeat(41),
      harga_per_kg: 10000,
      estimasi_hari: 3
    });
    assert.equal(result.isValid, false);
    assert.match(result.error, /40/i);
  });

  test('Harga per kg negatif ditolak', () => {
    const result = validateLayanan({
      nama: 'Cuci Kering',
      harga_per_kg: -5000,
      estimasi_hari: 2
    });
    assert.equal(result.isValid, false);
    assert.match(result.error, /harga/i);
  });

  test('Estimasi hari di luar 1-7 hari ditolak', () => {
    const res0 = validateLayanan({ nama: 'Layanan', harga_per_kg: 5000, estimasi_hari: 0 });
    const res8 = validateLayanan({ nama: 'Layanan', harga_per_kg: 5000, estimasi_hari: 8 });
    assert.equal(res0.isValid, false);
    assert.equal(res8.isValid, false);
  });
});

describe('2. Validasi Pelanggan', () => {
  test('Pelanggan sah dengan nomor WA 08... diterima', () => {
    const result = validatePelanggan({
      nama: 'Rizky Pratama',
      no_whatsapp: '081298765432',
      alamat: 'Kos Melati kamar 5'
    });
    assert.equal(result.isValid, true);
    assert.equal(result.error, null);
  });

  test('Nomor WA tidak diawali 08 ditolak', () => {
    const result = validatePelanggan({
      nama: 'Budi',
      no_whatsapp: '62812345678',
      alamat: 'Jl. Kampus'
    });
    assert.equal(result.isValid, false);
    assert.match(result.error, /08/i);
  });

  test('Nomor WA kurang dari 10 angka atau lebih dari 13 angka ditolak', () => {
    const resShort = validatePelanggan({ nama: 'A', no_whatsapp: '08123456', alamat: 'Alamat' });
    const resLong = validatePelanggan({ nama: 'A', no_whatsapp: '0812345678901234', alamat: 'Alamat' });
    assert.equal(resShort.isValid, false);
    assert.equal(resLong.isValid, false);
  });

  test('Nomor WA mengandung huruf ditolak', () => {
    const result = validatePelanggan({
      nama: 'Budi',
      no_whatsapp: '081234abcd56',
      alamat: 'Jl. Kampus'
    });
    assert.equal(result.isValid, false);
  });
});

describe('3. Kalkulasi & Pembulatan Order', () => {
  test('Berat desimal dibulatkan ke atas dan total dihitung otomatis', () => {
    // 3.2 kg dibulatkan ke atas jadi 4 kg
    const calc = calculateOrder(10000, 3.2);
    assert.equal(calc.berat_kg, 4);
    assert.equal(calc.total, 40000);
    assert.equal(calc.isValid, true);
  });

  test('Berat 0 atau negatif ditolak', () => {
    const calc = calculateOrder(10000, 0);
    assert.equal(calc.isValid, false);
    assert.match(calc.error, /berat/i);
  });

  test('Berat melebihi 50 kg ditolak', () => {
    const calc = calculateOrder(10000, 52);
    assert.equal(calc.isValid, false);
    assert.match(calc.error, /50/i);
  });
});

describe('4. Transisi Status Order', () => {
  test('diterima boleh ke dicuci atau dibatalkan', () => {
    assert.equal(canTransitionStatus('diterima', 'dicuci'), true);
    assert.equal(canTransitionStatus('diterima', 'dibatalkan'), true);
    assert.equal(canTransitionStatus('diterima', 'selesai'), false);
    assert.equal(canTransitionStatus('diterima', 'diambil'), false);
  });

  test('dicuci hanya boleh ke selesai', () => {
    assert.equal(canTransitionStatus('dicuci', 'selesai'), true);
    assert.equal(canTransitionStatus('dicuci', 'diambil'), false);
    assert.equal(canTransitionStatus('dicuci', 'diterima'), false);
  });

  test('selesai hanya boleh ke diambil', () => {
    assert.equal(canTransitionStatus('selesai', 'diambil'), true);
    assert.equal(canTransitionStatus('selesai', 'dicuci'), false);
  });

  test('diambil dan dibatalkan tidak boleh berubah lagi', () => {
    assert.equal(canTransitionStatus('diambil', 'selesai'), false);
    assert.equal(canTransitionStatus('dibatalkan', 'diterima'), false);
  });
});

describe('5. Proteksi Penghapusan Order', () => {
  test('Hanya order diterima dan dibatalkan yang boleh dihapus', () => {
    assert.equal(canDeleteOrder('diterima'), true);
    assert.equal(canDeleteOrder('dibatalkan'), true);
    assert.equal(canDeleteOrder('dicuci'), false);
    assert.equal(canDeleteOrder('selesai'), false);
    assert.equal(canDeleteOrder('diambil'), false);
  });
});

describe('6. Laporan Harian', () => {
  test('Pendapatan hanya dihitung dari status diambil dan order dibatalkan diabaikan', () => {
    const orders = [
      { id: '1', tanggal_masuk: '2026-10-10', status: 'diterima', berat_kg: 3, total: 30000 },
      { id: '2', tanggal_masuk: '2026-10-10', status: 'dicuci', berat_kg: 4, total: 40000 },
      { id: '3', tanggal_masuk: '2026-10-10', status: 'selesai', berat_kg: 2, total: 20000 },
      { id: '4', tanggal_masuk: '2026-10-10', status: 'diambil', berat_kg: 5, total: 50000 }, // Terhitung pendapatan
      { id: '5', tanggal_masuk: '2026-10-10', status: 'dibatalkan', berat_kg: 10, total: 100000 }, // Diabaikan
      { id: '6', tanggal_masuk: '2026-10-09', status: 'diambil', berat_kg: 6, total: 60000 }, // Beda tanggal
    ];

    const report = calculateDailyReport(orders, '2026-10-10');
    assert.equal(report.total_order, 4); // 4 order aktif (1, 2, 3, 4)
    assert.equal(report.total_berat_kg, 14); // 3 + 4 + 2 + 5 = 14 kg
    assert.equal(report.total_pendapatan, 50000); // Hanya order 4 yang sudah 'diambil'
  });
});
