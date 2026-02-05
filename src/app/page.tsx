"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation'; // For programmatic navigation
import Link from 'next/link'; // For linking cards
import { ArrowDown, ArrowUp, BarChart, Building, Globe, Landmark, TrendingUp, Search } from 'lucide-react';
import { fetchNews } from '@/utils/newsApi';
import { NewsItem } from '@/components/NewsItem';
import { fetchStockData, searchStocks } from '@/utils/finnhub';
import { StockSearch } from '@/components/StockSearch';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface Article {
  source: {
    id: string | null;
    name: string;
  };
  author: string | null;
  title: string;
  description: string | null;
  url: string;
  urlToImage: string | null;
  publishedAt: string;
  content: string | null;
}

// --- Header Component (New) ---
const Header = () => (
  <header className="fixed top-0 left-0 right-0 bg-black bg-opacity-90 z-10 border-b border-neutral-800">
    <div className="container mx-auto px-4 py-3 flex justify-between items-center">
      <div className="flex items-center">
        <h1 className="text-3xl font-sterion font-bold text-white">MLens</h1> {/* Applied Sterion font */}
      </div>
      <nav>
        <ul className="flex space-x-6 text-neutral-300">
          <li><a href="#" className="hover:text-white transition-colors">Dashboard</a></li>
          <li><a href="/news" className="hover:text-white transition-colors">News</a></li>
          <li><a href="/stocks/AAPL" className="hover:text-white transition-colors">Stocks</a></li>
          <li><a href="/indices/SPY" className="hover:text-white transition-colors">Indices</a></li> {/* Added Indices link */}
          <li><a href="#" className="hover:text-white transition-colors">Insights</a></li>
          <li><a href="#" className="hover:text-white transition-colors">Settings</a></li>
          <li><a href="#" className="hover:text-white transition-colors">Help</a></li>
        </ul>
      </nav>
    </div>
  </header>
);

// Card component for displaying data
// Updated to handle both raw change and change_percent for styling
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

// Local News item display (renamed from original NewsItem)
const LocalNewsItemDisplay = ({ source, title, time }: { source: string; title: string; time: string }) => (
  <div className="py-3 border-b border-neutral-700 last:border-b-0">
    <div className="text-xs text-neutral-500 mb-1">{source}</div>
    <div className="text-market-secondary font-medium">{title}</div>
    <div className="text-xs text-neutral-400 mt-1">{time} ago</div>
  </div>
);

// Component for Stock Search
// Moved to components/StockSearch.tsx
// const StockSearch = ...

export default function Home() {
  const [mainPageNews, setMainPageNews] = useState<Article[]>([]);
  const [mainPageNewsLoading, setMainPageNewsLoading] = useState(true);
  const [mainPageNewsError, setMainPageNewsError] = useState(null);

  const [geminiInsight, setGeminiInsight] = useState('');
  const [geminiLoading, setGeminiLoading] = useState(true);
  const [geminiError, setGeminiError] = useState(null);

  const [bigStocks, setBigStocks] = useState([]);
  const [bigStocksLoading, setBigStocksLoading] = useState(true);
  const [bigStocksError, setBigStocksError] = useState(null);

  const [majorIndicesData, setMajorIndicesData] = useState([]);
  const [majorIndicesLoading, setMajorIndicesLoading] = useState(true);
  const [majorIndicesError, setMajorIndicesError] = useState(null);

  const [macroSnapshot, setMacroSnapshot] = useState([]);
  const [macroSnapshotLoading, setMacroSnapshotLoading] = useState(true);
  const [macroSnapshotError, setMacroSnapshotError] = useState(null);


  const BIG_STOCK_SYMBOLS = ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'TSLA', 'NVDA'];
  // Alpha Vantage symbols for major indices
  const MAJOR_INDEX_SYMBOLS = [
    { symbol: 'SPY', name: 'S&P 500' },
    { symbol: 'QQQ', name: 'NASDAQ' },
    { symbol: 'DIA', name: 'DOW JONES' },
    { symbol: 'IWM', name: 'RUSSELL 2000' },
  ];

  const MACRO_INDICATORS = [
    { indicator: 'CPI', name: 'CPI', icon: BarChart },
    { indicator: 'GDP', name: 'GDP Growth', icon: Globe },
    { indicator: 'FEDERAL_FUNDS_RATE', name: 'Interest Rate', icon: Landmark },
    { indicator: 'UNEMPLOYMENT', name: 'Employment', icon: Building },
  ];

  useEffect(() => {
    const loadMainPageNews = async () => {
      setMainPageNewsLoading(true);
      setMainPageNewsError(null);
      try {
        const { articles } = await fetchNews("general", 1, 3);
        setMainPageNews(articles);
      } catch (err: any) {
        setMainPageNewsError(err);
      } finally {
        setMainPageNewsLoading(false);
      }
    };

    const loadBigStocks = async () => {
      setBigStocksLoading(true);
      setBigStocksError(null);
      try {
        const stockPromises = BIG_STOCK_SYMBOLS.map(symbol => fetchStockData(symbol));
        const results = await Promise.all(stockPromises);
        setBigStocks(results.filter(data => data !== null)); // Filter out any failed fetches
      } catch (err: any) {
        setBigStocksError(err);
      } finally {
        setBigStocksLoading(false);
      }
    };

    const loadMajorIndices = async () => {
      setMajorIndicesLoading(true);
      setMajorIndicesError(null);
      try {
        const indexPromises = MAJOR_INDEX_SYMBOLS.map(index => fetchStockData(index.symbol));
        const results = await Promise.all(indexPromises);
        // Map fetched data back to original names for display
        const combinedData = results.map((data, index) => {
          if (data) {
            return {
              title: MAJOR_INDEX_SYMBOLS[index].name,
              value: data.value.toFixed(2),
              change: data.change,
              change_percent: data.change_percent,
              icon: TrendingUp, // Assuming TrendingUp for all indices
              href: `/indices/${encodeURIComponent(data.symbol)}`, // Link to detail page
            };
          }
          return null;
        }).filter(item => item !== null);
        setMajorIndicesData(combinedData);
      } catch (err: any) {
        setMajorIndicesError(err);
      } finally {
        setMajorIndicesLoading(false);
      }
    };

    const loadMacroSnapshot = async () => {
      setMacroSnapshotLoading(true);
      setMacroSnapshotError(null);
      try {
        const macroPromises = MACRO_INDICATORS.map(async (item) => {
          const response = await fetch(`/api/macro?indicator=${item.indicator}`);
          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || `Failed to fetch macro data for ${item.name}`);
          }
          const data = await response.json();
          const liveData = data.live;
          const unit = data.live.unit; // Get unit from the top-level response's live object

          // Filter out observations with '.' as value and parse to float
          const validHistoricalData = data.historical
            .map((obs: { value: string | number; }) => {
              const value = parseFloat(String(obs.value));
              return {
                date: obs.date,
                value: isNaN(value) ? null : value, // Store null if value is NaN
              };
            })
            .filter(item => item.value !== null); // Filter out entries where value is null (was NaN)

          let change: number | undefined;
          let change_percent: number | undefined;

          // Ensure there are at least two valid historical data points for change calculation
          if (validHistoricalData.length >= 2) {
            const latestValue = validHistoricalData[0].value as number;
            const previousValue = validHistoricalData[1].value as number;
            change = latestValue - previousValue;
            change_percent = (change / previousValue) * 100;
          }

          return {
            title: item.name,
            indicator: item.indicator,
            value: `${liveData.value.toFixed(2)}${unit}`,
            change: change?.toFixed(2),
            change_percent: change_percent?.toFixed(2),
            icon: item.icon,
          };
        });
        const results = await Promise.all(macroPromises);
        setMacroSnapshot(results);
      } catch (err: any) {
        setMacroSnapshotError(err);
      } finally {
        setMacroSnapshotLoading(false);
      }
    };

    const loadGeminiInsight = async () => {
      setGeminiLoading(true);
      setGeminiError(null);
      try {
        const response = await fetch('/api/gemini/insights');
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to generate Gemini insight.');
        }
        const data = await response.json();
        setGeminiInsight(data.insight);
      } catch (err: any) {
        setGeminiError(err.message || 'Failed to load AI insights.');
      } finally {
        setGeminiLoading(false);
      }
    };

    loadMainPageNews();
    loadBigStocks();
    loadMajorIndices();
    loadMacroSnapshot();
    loadGeminiInsight(); // Load Gemini insight

  }, []);

// ... other imports ...

  return (
    <div className="bg-market-background-dark text-white min-h-screen font-sans">
      <Header /> {/* New Header Component */}
      <div className="container mx-auto p-4 md:p-8 pt-10">
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2">
            <div className="bg-neutral-900 p-6 rounded-lg mb-6 border border-neutral-800">
              <h2 className="text-xl font-sterion font-bold mb-3 text-market-primary">What’s moving markets today?</h2>
              {geminiLoading && <p className="text-neutral-400">Generating AI insights...</p>}
              {geminiError && <p className="text-red-500">Error: {geminiError}</p>}
              {!geminiLoading && geminiInsight && (
                <div className="text-neutral-300 leading-relaxed">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {geminiInsight}
                  </ReactMarkdown>
                </div>
              )}
              {!geminiLoading && !geminiInsight && !geminiError && (
                <p className="text-neutral-400">No AI insights available.</p>
              )}
            </div>
            
            <div className="bg-neutral-900 p-6 rounded-lg border border-neutral-800">
              <h3 className="text-lg font-sterion font-semibold mb-3 text-market-primary">Top News</h3>
              {mainPageNewsLoading && <p className="text-neutral-400">Loading top news...</p>}
              {mainPageNewsError && <p className="text-red-500">Error loading news: {mainPageNewsError.message}</p>}
              {!mainPageNewsLoading && mainPageNews.length === 0 && !mainPageNewsError && (
                <p className="text-neutral-400">No top news available.</p>
              )}
              {!mainPageNewsLoading && mainPageNews.length > 0 && (
                <div className="flex flex-col gap-2">
                  {mainPageNews.map((article, index) => (
                    <NewsItem
                      key={article.url || index}
                      source={article.source.name}
                      title={article.title}
                      time={article.publishedAt}
                      url={article.url}
                    />
                  ))}
                </div>
              )}
              <div className="text-right mt-4">
                <a href="/news" className="text-market-secondary hover:underline">View All News &rarr;</a>
              </div>
            </div>

          </div>
          
          {/* Sidebar: Indices, Macro, Stock Search, Big Stocks, and Main Page News */}
          <aside>
            {/* Stock Search Component */}
            <StockSearch />

            {/* Big Stocks Section */}
            <div className="mb-6 bg-neutral-900 p-6 rounded-lg border border-neutral-800">
              <h3 className="text-lg font-sterion font-semibold mb-3 text-market-primary">Popular Stocks</h3>
              {bigStocksLoading && <p className="text-neutral-400">Loading popular stocks...</p>}
              {bigStocksError && <p className="text-red-500">Error loading stocks: {bigStocksError.message}</p>}
              {!bigStocksLoading && bigStocks.length === 0 && !bigStocksError && (
                <p className="text-neutral-400">No popular stocks available.</p>
              )}
              {!bigStocksLoading && bigStocks.length > 0 && (
                <div className="flex flex-col gap-3">
                  {bigStocks.map((stock) => (
                    <a key={stock.symbol} href={`/stocks/${stock.symbol}`} className="block hover:bg-neutral-800 p-2 rounded-md transition-colors">
                      <div className="flex justify-between items-center">
                        <span className="font-semibold text-white">{stock.symbol}</span>
                        <span className={`font-semibold ${stock.change >= 0 ? 'text-market-accent-positive' : 'text-market-accent-negative'}`}>
                          {stock.value.toFixed(2)} {stock.currency}
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-neutral-500">{stock.name}</span>
                        <span className={`${stock.change >= 0 ? 'text-market-accent-positive' : 'text-market-accent-negative'} flex items-center`}>
                          {stock.change >= 0 ? <ArrowUp size={12} className="mr-1" /> : <ArrowDown size={12} className="mr-1" />}
                          {stock.change.toFixed(2)} ({stock.change_percent.toFixed(2)}%)
                        </span>
                      </div>
                    </a>
                  ))}
                </div>
              )}
            </div>

            <div className="mb-6">
              <h3 className="text-lg font-sterion font-semibold mb-3 text-market-primary">Major Indices</h3>
              {majorIndicesLoading && <p className="text-neutral-400">Loading major indices...</p>}
              {majorIndicesError && <p className="text-red-500">Error loading indices: {majorIndicesError.message}</p>}
              {!majorIndicesLoading && majorIndicesData.length === 0 && !majorIndicesError && (
                <p className="text-neutral-400">No major indices available.</p>
              )}
              {!majorIndicesLoading && majorIndicesData.length > 0 && (
                <div className="grid grid-cols-2 gap-4">
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
            
            <div className="mb-6">
              <h3 className="text-lg font-sterion font-semibold mb-3 text-market-primary">Macro Snapshot</h3>
              {macroSnapshotLoading && <p className="text-neutral-400">Loading macro data...</p>}
              {macroSnapshotError && <p className="text-red-500">Error loading macro data: {macroSnapshotError.message}</p>}
              {!macroSnapshotLoading && macroSnapshot.length === 0 && !macroSnapshotError && (
                <p className="text-neutral-400">No macro data available.</p>
              )}
              {!macroSnapshotLoading && macroSnapshot.length > 0 && (
                <div className="grid grid-cols-2 gap-4">
                    {macroSnapshot.map(item => (
                    <DataCard
                      key={item.title}
                      title={item.title}
                      value={item.value}
                      change={item.change}
                      change_percent={item.change_percent}
                      icon={item.icon}
                      href={`/macro/${encodeURIComponent(item.indicator)}`} // Link to the new macro detail page using the internal indicator key
                    />
                  ))}
                </div>
              )}
            </div>

          </aside>
        </div>
      </div>
    </div>
  );
}