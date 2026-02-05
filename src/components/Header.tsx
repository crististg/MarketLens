// src/components/Header.tsx
import Link from 'next/link';

const Header = () => (
  <header className="fixed top-0 left-0 right-0 bg-black bg-opacity-90 z-10 border-b border-neutral-800">
    <div className="container mx-auto px-4 py-3 flex justify-between items-center">
      <div className="flex items-center">
        <Link href="/" passHref>
          <h1 className="text-3xl font-sterion font-bold text-white cursor-pointer">MLens</h1>
        </Link>
      </div>
      <nav>
        <ul className="flex space-x-6 text-neutral-300">
          <li><Link href="/" className="hover:text-white transition-colors">Dashboard</Link></li>
          <li><Link href="/news" className="hover:text-white transition-colors">News</Link></li>
          <li><Link href="/stocks/AAPL" className="hover:text-white transition-colors">Stocks</Link></li>
          <li><Link href="/indices" className="hover:text-white transition-colors">Indices</Link></li>
          <li><Link href="/watchlist" className="hover:text-white transition-colors">Watchlist</Link></li>
          <li><Link href="#" className="hover:text-white transition-colors">Insights</Link></li>
          <li><Link href="#" className="hover:text-white transition-colors">Settings</Link></li>
          <li><Link href="#" className="hover:text-white transition-colors">Help</Link></li>
        </ul>
      </nav>
    </div>
  </header>
);

export default Header;
