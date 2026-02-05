// utils/finnhub.ts

interface NormalizedStockData {
  symbol: string;
  asset_type: 'stock';
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

interface NormalizedSearchResult {
  symbol: string;
  name: string;
  type: string;
  region: string;
  currency: string;
  matchScore: number;
}

export const fetchStockData = async (symbol: string): Promise<NormalizedStockData | null> => {
  try {
    const response = await fetch(`/api/stocks/${symbol}`);
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `Failed to fetch stock data for ${symbol}`);
    }
    const data: NormalizedStockData = await response.json();
    return data;
  } catch (error) {
    console.error(`Error fetching stock data for ${symbol}:`, error);
    throw error;
  }
};

export const searchStocks = async (keywords: string): Promise<NormalizedSearchResult[]> => {
  try {
    if (!keywords) {
      return [];
    }
    const response = await fetch(`/api/stocks/search?keywords=${encodeURIComponent(keywords)}`);
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `Failed to search stocks for '${keywords}'`);
    }
    const data: NormalizedSearchResult[] = await response.json();
    return data;
  } catch (error) {
    console.error(`Error searching stocks for '${keywords}':`, error);
    return [];
  }
};
