"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation'; // For programmatic navigation
import { Search } from 'lucide-react';
import { searchStocks } from '@/utils/finnhub'; // Correct path from components

export const StockSearch = () => { // Exported for use in other files
  const [searchInput, setSearchInput] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState(null);
  const router = useRouter();

  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (searchInput.length > 1) {
        setSearchLoading(true);
        setSearchError(null);
        try {
          const results = await searchStocks(searchInput);
          setSearchResults(results);
        } catch (err: any) { // Explicitly type err as any
          setSearchError(err);
        } finally {
          setSearchLoading(false);
        }
      } else {
        setSearchResults([]);
      }
    }, 500); // Debounce search input

    return () => clearTimeout(delayDebounceFn);
  }, [searchInput]);

  const handleSelectStock = (symbol: string) => {
    router.push(`/stocks/${symbol}`);
    setSearchInput(''); // Clear search input after selection
    setSearchResults([]);
  };

  return (
    <div className="mb-6">
      <h3 className="text-lg font-sterion font-semibold mb-3 text-market-primary">Stock Search</h3>
      <div className="relative">
        <input
          type="text"
          placeholder="Search stocks (e.g., AAPL)"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          className="w-full p-2 pl-10 rounded-lg bg-neutral-800 text-white border border-neutral-700 focus:outline-none focus:ring-2 focus:ring-market-primary"
        />
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" size={18} />
      </div>
      {searchLoading && <p className="text-neutral-400 mt-2">Searching...</p>}
      {searchError && <p className="text-red-500 mt-2">Error: {searchError.message}</p>}
      {!searchLoading && searchResults.length > 0 && (
        <div className="absolute z-10 w-full bg-neutral-800 border border-neutral-700 rounded-lg mt-1 max-h-60 overflow-y-auto">
          {searchResults.map((result) => (
            <div
              key={result.symbol}
              onClick={() => handleSelectStock(result.symbol)}
              className="p-3 hover:bg-neutral-700 cursor-pointer border-b border-neutral-700 last:border-b-0"
            >
              <p className="font-semibold text-white">{result.symbol} - {result.name}</p>
              <p className="text-sm text-neutral-400">{result.type}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};