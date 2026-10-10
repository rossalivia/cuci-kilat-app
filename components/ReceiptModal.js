'use client';

export default function ReceiptModal({ isOpen, order, onClose }) {
  if (!isOpen || !order) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true">
      <div className="receipt-paper">
        {/* Header Struk */}
        <div className="receipt-header">
          <div className="receipt-store">CUCI KILAT</div>
          <div className="receipt-tagline">Laundry Kiloan Bersih, Rapi & Wangi</div>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)', marginTop: '0.2rem' }}>
            Dekat Kampus · WhatsApp: 0812-9876-5432
          </div>
        </div>

        {/* Informasi Transaksi */}
        <table className="receipt-table">
          <tbody>
            <tr>
              <td style={{ color: 'var(--text-secondary)' }}>No. Nota</td>
              <td style={{ textAlign: 'right', fontWeight: '700', fontFamily: 'var(--font-mono)' }}>
                #{order.id}
              </td>
            </tr>
            <tr>
              <td style={{ color: 'var(--text-secondary)' }}>Tgl. Terima</td>
              <td style={{ textAlign: 'right', fontWeight: '600' }} className="num-tabular">
                {order.tanggal_masuk}
              </td>
            </tr>
            <tr>
              <td style={{ color: 'var(--text-secondary)' }}>Pelanggan</td>
              <td style={{ textAlign: 'right', fontWeight: '700' }}>
                {order.nama_pelanggan}
              </td>
            </tr>
            <tr>
              <td style={{ color: 'var(--text-secondary)' }}>No. WhatsApp</td>
              <td style={{ textAlign: 'right' }} className="num-tabular">
                {order.pelanggan_id}
              </td>
            </tr>
            <tr>
              <td style={{ color: 'var(--text-secondary)' }}>Status Saat Ini</td>
              <td style={{ textAlign: 'right' }}>
                <span className={`badge badge-${order.status}`} style={{ fontSize: '0.675rem' }}>
                  {order.status}
                </span>
              </td>
            </tr>
          </tbody>
        </table>

        <div className="receipt-divider"></div>

        {/* Rincian Layanan & Tarif */}
        <table className="receipt-table">
          <tbody>
            <tr>
              <td colSpan="2" style={{ fontWeight: '700' }}>
                {order.nama_layanan}
              </td>
            </tr>
            <tr>
              <td style={{ color: 'var(--text-secondary)' }}>
                {order.berat_kg} kg × Rp{order.harga_per_kg?.toLocaleString('id-ID')}
              </td>
              <td style={{ textAlign: 'right', fontWeight: '700' }} className="num-tabular">
                Rp{order.total?.toLocaleString('id-ID')}
              </td>
            </tr>
            {order.catatan && (
              <tr>
                <td colSpan="2" style={{ fontSize: '0.725rem', color: 'var(--text-secondary)', fontStyle: 'italic', paddingTop: '0.35rem' }}>
                  Catatan: &quot;{order.catatan}&quot;
                </td>
              </tr>
            )}
          </tbody>
        </table>

        <div className="receipt-divider"></div>

        {/* Total Pembayaran */}
        <div className="receipt-total-row">
          <span>TOTAL</span>
          <span className="num-tabular" style={{ color: 'var(--primary)' }}>
            Rp{order.total?.toLocaleString('id-ID')}
          </span>
        </div>

        {/* Barcode & Footer Nota */}
        <div className="receipt-barcode">
          * NOTA-{order.id.toUpperCase()} *
          <div style={{ fontSize: '0.675rem', marginTop: '0.3rem', color: 'var(--text-tertiary)', letterSpacing: 'normal', fontFamily: 'var(--font-sans)' }}>
            Simpan nota digital ini sebagai bukti pengambilan cucian.
          </div>
        </div>

        {/* Tombol Aksi (Tidak tercetak saat diprint) */}
        <div className="modal-actions no-print" style={{ marginTop: '1.25rem' }}>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={onClose}
          >
            Tutup
          </button>
          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={handlePrint}
          >
            🖨️ Cetak / Simpan PDF
          </button>
        </div>
      </div>
    </div>
  );
}
