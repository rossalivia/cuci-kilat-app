'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Navbar() {
  const pathname = usePathname();

  const navLinks = [
    { href: '/layanan', label: 'Layanan', icon: '🏷️' },
    { href: '/pelanggan', label: 'Pelanggan', icon: '👥' },
    { href: '/order', label: 'Order', icon: '🧺' },
    { href: '/laporan', label: 'Laporan', icon: '📊' },
  ];

  const isActive = (href) => {
    if (!pathname) return false;
    return pathname.startsWith(href);
  };

  return (
    <nav className="nav-bottom">
      {navLinks.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={`nav-item ${isActive(item.href) ? 'active' : ''}`}
        >
          <span className="nav-icon">{item.icon}</span>
          <span>{item.label}</span>
        </Link>
      ))}
    </nav>
  );
}
