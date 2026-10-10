import '../styles/globals.css';
import Navbar from '../components/Navbar';

export const metadata = {
  title: 'Cuci Kilat - Sistem Manajemen Laundry Kiloan',
  description: 'Aplikasi kasir dan manajemen operasional laundry kiloan: layanan, pelanggan, order, dan laporan keuangan',
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({ children }) {
  return (
    <html lang="id">
      <body>
        <header className="navbar-top no-print">
          <div className="navbar-inner">
            <a href="/order" className="brand-wrapper">
              <div className="brand-icon">
                CK
              </div>
              <div className="brand-info">
                <span className="brand-title">CUCI KILAT</span>
                <span className="brand-subtitle">Laundry Kiloan · Sari</span>
              </div>
            </a>

            <div className="system-status-pill">
              <span className="status-dot"></span>
              <span>Firestore Active</span>
            </div>
          </div>
        </header>

        <main className="app-container">
          {children}
        </main>

        <Navbar />
      </body>
    </html>
  );
}
