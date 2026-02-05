// src/app/watchlist/page.tsx
"use client";

import { useState, useEffect, useCallback } from 'react';
import { getWatchlist, removeFromWatchlist } from '@/utils/watchlist';
import { fetchStockData } from '@/utils/finnhub'; // Reusing for watchlist items
import { ArrowDown, ArrowUp, XCircle } from 'lucide-react';
import Link from 'next/link';

interface WatchlistItemData {
  symbol: string;
  value: number;
  change: number;
  change_percent: number;
  currency: string;
  loading: boolean;
  error: string | null;
}

export default function WatchlistPage() {
  const [watchlistSymbols, setWatchlistSymbols] = useState<string[]>([]);
  const [watchlistData, setWatchlistData] = useState<WatchlistItemData[]>([]);
  const [loadingWatchlist, setLoadingWatchlist] = useState(true);
  const [errorWatchlist, setErrorWatchlist] = useState<string | null>(null);

  // Function to load symbols from local storage
  const loadWatchlistSymbols = useCallback(() => {
    const symbols = getWatchlist();
    setWatchlistSymbols(symbols);
  }, []);

  // Effect to load symbols on component mount
  useEffect(() => {
    loadWatchlistSymbols();
  }, [loadWatchlistSymbols]);

  // Effect to fetch data for each symbol in the watchlist
  useEffect(() => {
    const fetchWatchlistDetails = async () => {
      if (watchlistSymbols.length === 0) {
        setWatchlistData([]);
        setLoadingWatchlist(false);
        return;
      }

      setLoadingWatchlist(true);
      setErrorWatchlist(null);

      const fetchedData: WatchlistItemData[] = await Promise.all(
        watchlistSymbols.map(async (symbol) => {
          try {
            const data = await fetchStockData(symbol);
            if (data) {
              return {
                symbol: data.symbol,
                value: data.value,
                change: data.change,
                change_percent: data.change_percent,
                currency: data.currency,
                loading: false,
                error: null,
              };
            } else {
              return { symbol, value: 0, change: 0, change_percent: 0, currency: 'USD', loading: false, error: 'No data' };
            }
          } catch (err: any) {
            return { symbol, value: 0, change: 0, change_percent: 0, currency: 'USD', loading: false, error: err.message || 'Error fetching' };
          }
        })
      );
      setWatchlistData(fetchedData);
      setLoadingWatchlist(false);
    };

    fetchWatchlistDetails();
  }, [watchlistSymbols]);

  const handleRemoveFromWatchlist = (symbol: string) => {
    const updatedWatchlist = removeFromWatchlist(symbol);
    setWatchlistSymbols(updatedWatchlist);
  };

  if (loadingWatchlist) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6 text-market-primary">My Watchlist</h1>
        <p className="text-neutral-400">Loading watchlist...</p>
      </div>
    );
  }

  if (errorWatchlist) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6 text-market-primary">My Watchlist</h1>
        <p className="text-red-500">Error loading watchlist: {errorWatchlist}</p>
      </div>
    );
  }

  if (watchlistData.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6 text-market-primary">My Watchlist</h1>
        <p className="text-neutral-400">Your watchlist is empty. Add stocks or indices from their detail pages.</p>
        <p className="text-neutral-500 mt-2">Example: Search for AAPL or MSFT, or explore the Indices page.</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6 text-market-primary">My Watchlist</h1>

      <div className="bg-neutral-900 p-6 rounded-lg border border-neutral-800">
        {watchlistData.map((item) => (
          <div key={item.symbol} className="flex items-center justify-between py-4 border-b border-neutral-700 last:border-b-0">
            <Link href={`/stocks/${item.symbol}`} className="flex-grow flex items-center group">
              <span className="text-xl font-semibold text-white group-hover:text-market-primary transition-colors">{item.symbol}</span>
              {item.loading ? (
                <span className="ml-4 text-neutral-500 text-sm">Loading...</span>
              ) : item.error ? (
                <span className="ml-4 text-red-500 text-sm">Error: {item.error}</span>
              ) : (
                <div className="flex items-center ml-4">
                  <span className="text-white text-lg">{item.value.toFixed(2)} {item.currency}</span>
                  <span className={`ml-2 flex items-center text-sm font-semibold
                    ${item.change >= 0 ? 'text-market-accent-positive' : 'text-market-accent-negative'}`}>
                    {item.change >= 0 ? <ArrowUp size={16} /> : <ArrowDown size={16} />}
                    {item.change.toFixed(2)} ({item.change_percent.toFixed(2)}%)
                  </span>
                </div>
              )}
            </Link>
            <button
              onClick={() => handleRemoveFromWatchlist(item.symbol)}
              className="p-2 text-neutral-400 hover:text-red-500 transition-colors"
              title={`Remove ${item.symbol} from watchlist`}
            >
              <XCircle size={20} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
