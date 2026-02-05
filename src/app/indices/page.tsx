// src/app/indices/page.tsx
"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { fetchStockData } from '@/utils/finnhub';
import { TrendingUp, ArrowDown, ArrowUp } from 'lucide-react'; // Assuming TrendingUp for all indices

interface MajorIndexData {
  title: string;
  value: string;
  change?: string | number;
  change_percent?: string | number;
  icon: React.ElementType;
  href?: string;
}

const MAJOR_INDEX_SYMBOLS = [
  { symbol: 'SPY', name: 'S&P 500' },
  { symbol: 'QQQ', name: 'NASDAQ' },
  { symbol: 'DIA', name: 'DOW JONES' },
  { symbol: 'IWM', name: 'RUSSELL 2000' },
];

// Card component for displaying data (copied from homepage)
const DataCard = ({ title, value, change, change_percent, icon: Icon, href }: { title: string; value: string; change?: string | number; change_percent?: string | number; icon: React.ElementType; href?: string }) => {
  const isPositive = change !== undefined && parseFloat(String(change)) >= 0;
  const isNeutral = change !== undefined && parseFloat(String(change)) === 0;

  const ChangeColorClass =
    isPositive && !isNeutral ? 'text-market-accent-positive' :
    !isPositive && !isNeutral ? 'text-market-accent-negative' :
    'text-neutral-400'; // Neutral color for 0 change

  const displayChange = change !== undefined ?
    (change_percent !== undefined ? `${parseFloat(String(change)).toFixed(2)} (${parseFloat(String(change_percent)).toFixed(2)}%)` : String(change))
    : null;

  const content = (
    <div className="bg-neutral-900 p-4 rounded-lg flex flex-col justify-between border border-neutral-800 h-full">
      <div className="flex items-center justify-between mb-2">
        <span className="text-neutral-400 text-sm">{title}</span>
        <Icon className="text-neutral-500" size={20} />
      </div>
      <div className="text-2xl font-semibold text-white">{value}</div>
      {displayChange && (
        <div className={`text-sm flex items-center ${ChangeColorClass}`}>
          {isPositive && !isNeutral ? <ArrowUp size={14} className="mr-1" /> : !isPositive && !isNeutral ? <ArrowDown size={14} className="mr-1" /> : null}
          {displayChange}
        </div>
      )}
    </div>
  );

  return href ? (
    <Link href={href} passHref className="block hover:bg-neutral-800 rounded-lg transition-colors">
      {content}
    </Link>
  ) : (
    content
  );
};


export default function IndicesPage() {
  const [majorIndicesData, setMajorIndicesData] = useState<MajorIndexData[]>([]);
  const [majorIndicesLoading, setMajorIndicesLoading] = useState(true);
  const [majorIndicesError, setMajorIndicesError] = useState<string | null>(null);

  useEffect(() => {
    const loadMajorIndices = async () => {
      setMajorIndicesLoading(true);
      setMajorIndicesError(null);
      try {
        const indexPromises = MAJOR_INDEX_SYMBOLS.map(index => fetchStockData(index.symbol));
        const results = await Promise.all(indexPromises);
        const combinedData = results.map((data, index) => {
          if (data) {
            return {
              title: MAJOR_INDEX_SYMBOLS[index].name,
              value: data.value.toFixed(2),
              change: data.change,
              change_percent: data.change_percent,
              icon: TrendingUp,
              href: `/indices/${encodeURIComponent(data.symbol)}`,
            };
          }
          return null;
        }).filter(item => item !== null);
        setMajorIndicesData(combinedData);
      } catch (err: any) {
        setMajorIndicesError(err.message || "Failed to load major indices.");
      } finally {
        setMajorIndicesLoading(false);
      }
    };

    loadMajorIndices();
  }, []);

  return (
    <div className="container mx-auto px-4">
      <h1 className="text-3xl font-bold mb-6 text-market-primary">Major Indices</h1>

      {majorIndicesLoading && <p className="text-neutral-400">Loading major indices...</p>}
      {majorIndicesError && <p className="text-red-500">Error loading indices: {majorIndicesError}</p>}
      {!majorIndicesLoading && majorIndicesData.length === 0 && !majorIndicesError && (
        <p className="text-neutral-400">No major indices available.</p>
      )}
      {!majorIndicesLoading && majorIndicesData.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {majorIndicesData.map(item => (
            <DataCard
              key={item.title}
              title={item.title}
              value={item.value}
              change={item.change}
              change_percent={item.change_percent}
              icon={item.icon}
              href={item.href}
            />
          ))}
        </div>
      )}
    </div>
  );
}
