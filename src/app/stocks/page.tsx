// src/app/stocks/page.tsx
"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowDown, ArrowUp } from 'lucide-react';
import { fetchStockData, searchStocks } from '@/utils/finnhub';
import { StockSearch } from '@/components/StockSearch'; // Assuming StockSearch is moved to components
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
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

// Define a list of "big stocks" as per the plan
const BIG_STOCK_SYMBOLS = ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'TSLA', 'NVDA'];
const DEFAULT_INDEX_SYMBOLS = ['SPY', 'QQQ', 'DIA']; // For charts

interface NormalizedStockData {
  symbol: string;
  asset_type: 'stock';
  timestamp: string;
  value: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  change: number;
  change_percent: number;
  currency: 'USD';
  source: 'Finnhub';
}

interface TimeSeriesEntry {
  date: string;
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
    return null;
  }
};


export default function StocksOverviewPage() {
  const [bigStocks, setBigStocks] = useState<NormalizedStockData[]>([]);
  const [bigStocksLoading, setBigStocksLoading] = useState(true);
  const [bigStocksError, setBigStocksError] = useState<string | null>(null);

  const [indexTimeSeries, setIndexTimeSeries] = useState<Record<string, NormalizedTimeSeriesData | null>>({});
  const [indexTimeSeriesLoading, setIndexTimeSeriesLoading] = useState(true);
  const [indexTimeSeriesError, setIndexTimeSeriesError] = useState<string | null>(null);


  useEffect(() => {
    const loadBigStocks = async () => {
      setBigStocksLoading(true);
      setBigStocksError(null);
      try {
        const stockPromises = BIG_STOCK_SYMBOLS.map(symbol => fetchStockData(symbol));
        const results = await Promise.all(stockPromises);
        setBigStocks(results.filter((data): data is NormalizedStockData => data !== null));
      } catch (err: any) {
        setBigStocksError(err.message || "Failed to load popular stocks.");
      } finally {
        setBigStocksLoading(false);
      }
    };

    const loadIndexTimeSeries = async () => {
        setIndexTimeSeriesLoading(true);
        setIndexTimeSeriesError(null);
        try {
            const timeSeriesPromises = DEFAULT_INDEX_SYMBOLS.map(symbol => fetchTimeSeriesData(symbol));
            const results = await Promise.all(timeSeriesPromises);
            const newTimeSeries = results.reduce((acc, data, index) => {
                if (data) acc[DEFAULT_INDEX_SYMBOLS[index]] = data;
                return acc;
            }, {});
            setIndexTimeSeries(newTimeSeries);
        } catch (err: any) {
            setIndexTimeSeriesError(err.message || "Failed to load index charts.");
        } finally {
            setIndexTimeSeriesLoading(false);
        }
    };


    loadBigStocks();
    loadIndexTimeSeries();
  }, []);

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'Daily Close Prices',
        color: '#e0e0e0', // Light gray for title
      },
      tooltip: { // Add tooltip configuration
        callbacks: {
          label: function(context) {
            let label = context.dataset.label || '';
            if (label) {
              label += ': ';
            }
            if (context.parsed.y !== null) {
              label += new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(context.parsed.y);
            }
            return label;
          },
          afterBody: function(context) {
            if (context[0] && indexTimeSeries) {
                const symbol = context.chart.data.datasets[0].label; // Get chart symbol
                const seriesData = indexTimeSeries[symbol]; // Look up in indexTimeSeries
                if (seriesData && seriesData.data) {
                    const index = context[0].dataIndex;
                    const dataPoint = seriesData.data[index];
                    const formatCurrency = (value: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);

                    return [
                        `Open: ${formatCurrency(dataPoint.open)}`,
                        `High: ${formatCurrency(dataPoint.high)}`,
                        `Low: ${formatCurrency(dataPoint.low)}`,
                        `Close: ${formatCurrency(dataPoint.close)}`
                    ];
                }
            }
            return [];
          }
        }
      },
      crosshair: { // Crosshair plugin configuration
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

  const createChartData = (timeSeriesData: NormalizedTimeSeriesData) => {
    const labels = timeSeriesData.data.map(entry => entry.date);
    const prices = timeSeriesData.data.map(entry => entry.close);

    return {
      labels,
      datasets: [
        {
          label: timeSeriesData.symbol,
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
        <h1 className="text-3xl font-bold mb-6 text-market-primary">Stock Market Overview</h1>

        {/* Stock Search */}
        <StockSearch />

        {/* Popular Stocks Section */}
        <div className="mb-6 bg-neutral-900 p-6 rounded-lg border border-neutral-800">
          <h3 className="text-lg font-bold mb-3 text-market-primary">Popular Stocks</h3>
          {bigStocksLoading && <p className="text-neutral-400">Loading popular stocks...</p>}
          {bigStocksError && <p className="text-red-500">Error loading stocks: {bigStocksError}</p>}
          {!bigStocksLoading && bigStocks.length === 0 && !bigStocksError && (
            <p className="text-neutral-400">No popular stocks available.</p>
          )}
          {!bigStocksLoading && bigStocks.length > 0 && (
            <div className="flex flex-col gap-3">
              {bigStocks.map((stock) => (
                <Link key={stock.symbol} href={`/stocks/${stock.symbol}`} className="block hover:bg-neutral-800 p-2 rounded-md transition-colors">
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
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Index Charts Section */}
        <div className="mb-6 bg-neutral-900 p-6 rounded-lg border border-neutral-800">
          <h3 className="text-lg font-bold mb-3 text-market-primary">Key Index Performance</h3>
          {indexTimeSeriesLoading && <p className="text-neutral-400">Loading index charts...</p>}
          {indexTimeSeriesError && <p className="text-red-500">Error loading index charts: {indexTimeSeriesError}</p>}
          {!indexTimeSeriesLoading && Object.keys(indexTimeSeries).length === 0 && !indexTimeSeriesError && (
            <p className="text-neutral-400">No index chart data available.</p>
          )}
          {!indexTimeSeriesLoading && Object.keys(indexTimeSeries).length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {Object.entries(indexTimeSeries).map(([symbol, data]) => (
                    data && (
                        <div key={symbol} className="bg-neutral-800 p-4 rounded-lg">
                            <h4 className="text-md font-semibold text-white mb-2">{symbol} Daily Close</h4>
                            <Line options={chartOptions} data={createChartData(data)} />
                        </div>
                    )
                ))}
            </div>
          )}
        </div>
      </div>
  );
}
