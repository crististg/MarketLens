// src/app/indices/[symbol]/page.tsx
"use client";

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation'; // For dynamic routes
import { ArrowDown, ArrowUp } from 'lucide-react';
import { fetchStockData } from '@/utils/finnhub'; // Reusing fetchStockData for indices
import { fetchNews } from '@/utils/newsApi';
import { NewsItem } from '@/components/NewsItem';
import { addToWatchlist, removeFromWatchlist, isInWatchlist } from '@/utils/watchlist'; // Import watchlist utilities
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  type TooltipItem, // Import TooltipItem type
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import CrosshairPlugin from 'chartjs-plugin-crosshair'; // Import the plugin

// Register Chart.js components and the new plugin
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  CrosshairPlugin // Register the CrosshairPlugin
);

interface NormalizedIndexData { // Changed from NormalizedStockData
  symbol: string;
  asset_type: 'stock'; // Alpha Vantage treats indices like stocks for these functions
  timestamp: string; // ISO 8601 format
  value: number; // Current price
  open: number;
  high: number;
  low: number;
  close: number; // Previous close
  volume: number;
  change: number;
  change_percent: number;
  currency: 'USD';
  source: 'Finnhub';
}

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

// Interfaces for Time Series Data
interface TimeSeriesEntry {
  date: string; // YYYY-MM-DD
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

interface NormalizedTimeSeriesData {
  symbol: string;
  data: TimeSeriesEntry[];
}

// Function to fetch time series data from our proxy API
const fetchTimeSeriesData = async (symbol: string): Promise<NormalizedTimeSeriesData | null> => {
    try {
      const response = await fetch(`/api/stocks/timeseries/${symbol}`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to fetch time series for ${symbol}`);
      }
      const data: NormalizedTimeSeriesData = await response.json();
      return data;
    } catch (error) {
      console.error(`Error fetching time series data for ${symbol}:`, error);
      throw error;
    }
};


export default function IndexDetailPage() { // Renamed from StockDetailPage
  const params = useParams();
  const symbolFromParams = params.symbol as string;
  const symbolMap: { [key: string]: string } = {
    '%5EGSPC': 'SPY',
    '%5EIXIC': 'QQQ',
    '%5EDJI': 'DIA',
    '%5ERUT': 'IWM',
  };

  const symbol = symbolMap[symbolFromParams] || symbolFromParams;

  const [indexData, setIndexData] = useState<NormalizedIndexData | null>(null); // Changed to indexData
  const [loadingIndex, setLoadingIndex] = useState(true);
  const [errorIndex, setErrorIndex] = useState<string | null>(null);

  const [news, setNews] = useState<Article[]>([]);
  const [loadingNews, setLoadingNews] = useState(true);
  const [errorNews, setErrorNews] = useState<string | null>(null);

    const [timeSeriesData, setTimeSeriesData] = useState<NormalizedTimeSeriesData | null>(null);

    const [loadingTimeSeries, setLoadingTimeSeries] = useState(true);

    const [errorTimeSeries, setErrorTimeSeries] = useState<string | null>(null);

  

    const [isAddedToWatchlist, setIsAddedToWatchlist] = useState(false); // New state for watchlist status

  

    useEffect(() => {

      if (!symbol) return;

  

      // Check initial watchlist status

      setIsAddedToWatchlist(isInWatchlist(symbol));

  

      const getIndexData = async () => { // Renamed from getStockData

        setLoadingIndex(true);

        setErrorIndex(null);

        try {

          const data = await fetchStockData(symbol); // Reusing fetchStockData

          if (data) {

            setIndexData(data);

          } else {

            setErrorIndex("Could not fetch index data.");

          }

        } catch (err: any) {

          setErrorIndex(err.message || "Failed to fetch index data.");

        } finally {

          setLoadingIndex(false);

        }

      };

    const getIndexNews = async () => { // Renamed from getStockNews
      setLoadingNews(true);
      setErrorNews(null);
      try {
        // Fetch news specifically for this index symbol
        const { articles } = await fetchNews(symbol, 1, 5); // Using symbol as query for NewsAPI
        setNews(articles);
      } catch (err: any) {
        setErrorNews(err.message || "Failed to fetch news for this index.");
      } finally {
        setLoadingNews(false);
      }
    };

    const getTimeSeriesData = async () => {
        setLoadingTimeSeries(true);
        setErrorTimeSeries(null);
        try {
            const data = await fetchTimeSeriesData(symbol);
            if (data) {
                setTimeSeriesData(data);
            } else {
                setErrorTimeSeries("Could not fetch time series data.");
            }
        } catch (err: any) {
            setErrorTimeSeries(err.message || "Failed to fetch time series data.");
        } finally {
            setLoadingTimeSeries(false);
        }
    };

    getIndexData(); // Called getIndexData
    getIndexNews(); // Called getIndexNews
    getTimeSeriesData();
  }, [symbol]);

  // Function to toggle watchlist status
  const toggleWatchlist = () => {
    if (isAddedToWatchlist) {
      removeFromWatchlist(symbol);
      setIsAddedToWatchlist(false);
    } else {
      addToWatchlist(symbol);
      setIsAddedToWatchlist(true);
    }
  };

    if (loadingIndex) {

      return (

        <div className="flex justify-center items-center">

          <p className="text-neutral-400">Loading index data for {symbol}...</p>

        </div>

      );

    }

  

    if (errorIndex) {

      return (

        <div className="flex justify-center items-center">

          <p className="text-red-500">Error: {errorIndex}</p>

        </div>

      );

    }

  

    if (!indexData) { // Changed to indexData

      return (

        <div className="flex justify-center items-center">

          <p className="text-neutral-400">No data available for {symbol}.</p>

        </div>

      );

    }

  

    const changeType = indexData.change >= 0 ? 'positive' : 'negative'; // Changed to indexData

    const ChangeIcon = indexData.change >= 0 ? ArrowUp : ArrowDown; // Changed to indexData

  

      // Calculate dynamic min/max for Y-axis for time series data

  

      const yAxisMin = timeSeriesData ? Math.min(...timeSeriesData.data.map(d => d.close)) * 0.99 : undefined;

  

      const yAxisMax = timeSeriesData ? Math.max(...timeSeriesData.data.map(d => d.close)) * 1.01 : undefined;

  

    

  

      const chartOptions = {

  

    

  

        responsive: true,

  

    

  

        plugins: {

  

    

  

          legend: {

  

    

  

            position: 'top' as const,

  

    

  

          },

  

    

  

          title: {

  

    

  

            display: true,

  

    

  

            text: `${symbol} Daily Close Prices`,

  

    

  

            color: '#e0e0e0', // Light gray for title

  

    

  

          },

  

    

  

          tooltip: { // Add tooltip configuration

  

    

  

            callbacks: {

  

    

  

                                                     label: function(context: TooltipItem<'line'>) {              let label = context.dataset.label || '';

  

    

  

                  if (label) {

  

    

  

                    label += ': ';

  

    

  

                  }

  

    

  

                  if (context.parsed.y !== null) {

  

    

  

                    label += new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(context.parsed.y);

  

    

  

                  }

  

    

  

                  return label;

  

    

  

                },

  

    

  

                afterBody: function(context: TooltipItem<'line'>[]) {

  

    

  

                  if (context[0] && timeSeriesData && timeSeriesData.data) {

  

    

  

                      const index = context[0].dataIndex;

  

    

  

                      const dataPoint = timeSeriesData.data[index];

  

    

  

                      const formatCurrency = (value: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);

  

    

  

      

  

    

  

                      return [

  

    

  

                          `Open: ${formatCurrency(dataPoint.open)}`,

  

    

  

                          `High: ${formatCurrency(dataPoint.high)}`,

  

    

  

                          `Low: ${formatCurrency(dataPoint.low)}`,

  

    

  

                          `Close: ${formatCurrency(dataPoint.close)}`

  

    

  

                      ];

  

    

  

                  }

  

    

  

                  return [];

  

    

  

                }

  

    

  

              }

  

    

  

            },

  

    

  

            crosshair: {

  

    

  

                line: {

  

    

  

                    color: '#F66B0E', // Example color

  

    

  

                    width: 1

  

    

  

                },

  

    

  

                sync: {

  

    

  

                    enabled: true,

  

    

  

                    group: 1,

  

    

  

                    subsetOfElements: false, // Sync all elements

  

    

  

                },

  

    

  

                zoom: {

  

    

  

                    enabled: false,

  

    

  

                },

  

    

  

                snap: {

  

    

  

                    enabled: true // Snap to data points

  

    

  

                }

  

    

  

            }

  

    

  

          },

  

    

  

                    scales: {

  

    

  

                    x: {

  

    

  

                        ticks: {

  

    

  

                            color: '#9e9e9e', // Axis labels color

  

    

  

                        },

  

    

  

                        grid: {

  

    

  

                            color: '#424242', // Grid lines color

  

    

  

                        }

  

    

  

                    },

  

    

  

                    y: {

  

    

  

                        ticks: {

  

    

  

                            color: '#9e9e9e', // Axis labels color

  

    

  

                        },

  

    

  

                        grid: {

  

    

  

                            color: '#424242', // Grid lines color

  

    

  

                        }

  

    

  

                    }

  

    

  

                }

  

    

  

          

  

    

  

              };

  

    

  

          

  

    

  

            const createChartData = (seriesData: NormalizedTimeSeriesData) => {

  

    

  

              const labels = seriesData.data.map(entry => entry.date);

  

    

  

              const prices = seriesData.data.map(entry => entry.close);

  

    

  

          

  

    

  

              return {

  

    

  

                labels,

  

    

  

                datasets: [

  

    

  

                  {

  

    

  

                    label: seriesData.symbol,

  

    

  

                    data: prices,

  

    

  

                    borderColor: 'rgb(75, 192, 192)',

  

    

  

                    backgroundColor: 'rgba(75, 192, 192, 0.5)',

  

    

  

                    tension: 0.1,

  

    

  

                    pointRadius: 0,

  

    

  

                  },

  

    

  

                ],

  

    

  

              };

  

    

  

            };

  

    return (

      <div className="container mx-auto px-4">

          <h1 className="text-3xl font-bold mb-6 text-market-primary">{indexData.symbol} Overview</h1>

  

          {/* Index Overview */}

          <div className="bg-neutral-900 p-6 rounded-lg mb-6 border border-neutral-800">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-white">{indexData.symbol} Summary</h2>
              <button
                onClick={toggleWatchlist}
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors
                  ${isAddedToWatchlist
                    ? "bg-red-600 hover:bg-red-700 text-white"
                    : "bg-blue-600 hover:bg-blue-700 text-white"
                  }`}
              >
                {isAddedToWatchlist ? "Remove from Watchlist" : "Add to Watchlist"}
              </button>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">

              <div>

                <p className="text-neutral-400 text-sm">Price</p>

                <p className={`text-2xl font-semibold`} style={{ color: indexData.change >= 0 ? '#28a745' : '#dc3545' }}>

                  {indexData.value.toFixed(2)} {indexData.currency}

                </p>

              </div>

              <div>

                <p className="text-neutral-400 text-sm">Change</p>

                <div className={`text-xl font-semibold flex items-center`} style={{ color: indexData.change >= 0 ? '#28a745' : '#dc3545' }}>

                  <ChangeIcon size={18} className="mr-1" />

                  {indexData.change.toFixed(2)} ({indexData.change_percent.toFixed(2)}%)

                </div>

              </div>

              <div>

                <p className="text-neutral-400 text-sm">Volume</p>

                <p className="text-white text-xl">{indexData.volume.toLocaleString()}</p>

              </div>

              <div>

                <p className="text-neutral-400 text-sm">Open</p>

                <p className="text-white text-xl">{indexData.open.toFixed(2)}</p>

              </div>

              <div>

                <p className="text-neutral-400 text-sm">High</p>

                <p className="text-white text-xl">{indexData.high.toFixed(2)}</p>

              </div>

              <div>

                <p className="text-neutral-400 text-sm">Low</p>

                <p className="text-white text-xl">{indexData.low.toFixed(2)}</p>

              </div>

              <div>

                <p className="text-neutral-400 text-sm">Previous Close</p>

                <p className="text-white text-xl">{indexData.close.toFixed(2)}</p>

              </div>

              <div>

                <p className="text-neutral-400 text-sm">Last Updated</p>

                <p className="text-white text-xl">{new Date(indexData.timestamp).toLocaleString()}</p>

              </div>

            </div>

          </div>

  

          {/* Index Chart */}

          <div className="bg-neutral-900 p-6 rounded-lg mb-6 border border-neutral-800">

              {loadingTimeSeries && <p className="text-neutral-400">Loading chart data...</p>}

              {errorTimeSeries && <p className="text-red-500">Error loading chart: {errorTimeSeries}</p>}

              {!loadingTimeSeries && timeSeriesData && timeSeriesData.data.length > 0 && (

                  <Line options={chartOptions} data={createChartData(timeSeriesData)} />

              )}

              {!loadingTimeSeries && !timeSeriesData && !errorTimeSeries && (

                  <p className="text-neutral-400">No chart data available for {symbol}.</p>

              )}

          </div>

  

  

          {/* Index Specific News */}

          <div className="bg-neutral-900 p-6 rounded-lg border border-neutral-800">

            <h2 className="text-xl font-bold mb-4 text-white">News for {indexData.symbol}</h2>

            {loadingNews && <p className="text-neutral-400">Loading news...</p>}

            {errorNews && <p className="text-red-500">Error: {errorNews}</p>}

            {!loadingNews && news.length === 0 && !errorNews && (

              <p className="text-neutral-400">No news found for {indexData.symbol}.</p>

            )}

            {!loadingNews && news.length > 0 && (

              <div>

                {news.map((article, index) => (

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

          </div>

        </div>

    );

  }

  