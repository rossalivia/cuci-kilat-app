import '../styles/globals.css';
import Navbar from '../components/Navbar';

export const metadata = {
  title: 'Cuci Kilat - Laundry Kiloan',
  description: 'Aplikasi manajemen laundry kiloan: layanan, pelanggan, order, dan laporan harian',
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
        <div className="navbar-top">
          <div className="navbar-inner">
            <a href="/order" className="brand">
              🧺 Cuci Kilat
              <span className="brand-badge">Sari Laundry</span>
            </a>
          </div>
        </div>

        <main className="app-container">
          {children}
        </main>

        <Navbar />
      </body>
    </html>
  );
}
