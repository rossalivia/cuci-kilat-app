'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Navbar() {
  const pathname = usePathname();

  const navLinks = [
    {
      href: '/order',
      label: 'Order',
      icon: (
        <svg viewBox="0 0 24 24" fill="none">
          <path d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ),
    },
    {
      href: '/pelanggan',
      label: 'Pelanggan',
      icon: (
        <svg viewBox="0 0 24 24" fill="none">
          <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" strokeLinecap="round" strokeLinejoin="round" />
          <circle cx="9" cy="7" r="4" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ),
    },
    {
      href: '/layanan',
      label: 'Layanan',
      icon: (
        <svg viewBox="0 0 24 24" fill="none">
          <path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z" strokeLinecap="round" strokeLinejoin="round" />
          <line x1="7" y1="7" x2="7.01" y2="7" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ),
    },
    {
      href: '/laporan',
      label: 'Laporan',
      icon: (
        <svg viewBox="0 0 24 24" fill="none">
          <line x1="18" y1="20" x2="18" y2="10" strokeLinecap="round" strokeLinejoin="round" />
          <line x1="12" y1="20" x2="12" y2="4" strokeLinecap="round" strokeLinejoin="round" />
          <line x1="6" y1="20" x2="6" y2="14" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ),
    },
  ];

  const isActive = (href) => {
    if (!pathname) return false;
    return pathname.startsWith(href);
  };

  return (
    <nav className="nav-bottom no-print">
      <div className="nav-bottom-inner">
        {navLinks.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`nav-item ${isActive(item.href) ? 'active' : ''}`}
          >
            {item.icon}
            <span>{item.label}</span>
          </Link>
        ))}
      </div>
    </nav>
  );
}
