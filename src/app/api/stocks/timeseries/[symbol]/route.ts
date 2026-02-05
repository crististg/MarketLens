import { NextRequest, NextResponse } from 'next/server';
import { getCache, setCache } from '@/utils/cache';

const ALPHA_VANTAGE_API_KEY = process.env.ALPHA_VANTAGE_API_KEY;

if (!ALPHA_VANTAGE_API_KEY) {
  console.error("ALPHA_VANTAGE_API_KEY is not set.");
}

const TIME_SERIES_CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours for historical data

interface AlphaVantageTimeSeriesData {
  'Meta Data': {
    '1. Information': string;
    '2. Symbol': string;
    '3. Last Refreshed': string;
    '4. Output Size': string;
    '5. Time Zone': string;
  };
  'Time Series (Daily)'?: {
    [date: string]: {
      '1. open': string;
      '2. high': string;
      '3. low': string;
      '4. close': string;
      '5. volume': string;
    };
  };
  'Error Message'?: string;
  'Note'?: string;
  'Information'?: string;
}

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

const normalizeTimeSeriesData = (avData: AlphaVantageTimeSeriesData): NormalizedTimeSeriesData | null => {
  if (!avData['Time Series (Daily)']) {
    return null;
  }

  const symbol = avData['Meta Data']['2. Symbol'];
  const timeSeries = avData['Time Series (Daily)'];

  const data: TimeSeriesEntry[] = Object.entries(timeSeries).map(([date, values]) => ({
    date,
    open: parseFloat(values['1. open']),
    high: parseFloat(values['2. high']),
    low: parseFloat(values['3. low']),
    close: parseFloat(values['4. close']),
    volume: parseInt(values['5. volume']),
  })).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()); // Sort by date ascending

  return { symbol, data };
};

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ symbol: string }> }
) {
  const { symbol: rawSymbol } = await params;
  const symbol = rawSymbol.toUpperCase();
  const cacheKey = `timeseries_${symbol}`;

  // 1. Check cache
  const cached = await getCache(cacheKey);
  if (cached) {
    console.log(`[AlphaVantage TimeSeries Proxy] Cache hit for ${symbol}`);
    return NextResponse.json(cached);
  }

  // 2. Fetch from Alpha Vantage
  try {
    if (!ALPHA_VANTAGE_API_KEY) {
      return NextResponse.json({ error: "Alpha Vantage API key not configured." }, { status: 500 });
    }

    const avUrl = `https://www.alphavantage.co/query?function=TIME_SERIES_DAILY&symbol=${symbol}&outputsize=compact&apikey=${ALPHA_VANTAGE_API_KEY}`;
    const response = await fetch(avUrl);

    if (!response.ok) {
      console.error(`Alpha Vantage API error for ${symbol}: ${response.statusText}`);
      return NextResponse.json({ error: `Failed to fetch time series from Alpha Vantage: ${response.statusText}` }, { status: response.status });
    }

    const data: AlphaVantageTimeSeriesData = await response.json();

    if (data['Error Message']) {
        console.warn(`Alpha Vantage API Error for ${symbol}: ${data['Error Message']}`);
        return NextResponse.json({ error: data['Error Message'] }, { status: 400 });
    }
    if (data['Note'] || data['Information']) {
        const message = data['Note'] || data['Information'];
        console.warn(`Alpha Vantage API Note for ${symbol}: ${message}`);
        return NextResponse.json({ error: message }, { status: 429 });
    }
    if (!data['Time Series (Daily)'] || Object.keys(data['Time Series (Daily)']).length === 0) {
      return NextResponse.json({ error: `No time series data found for ${symbol}.` }, { status: 404 });
    }

    // 3. Normalize and cache
    const normalizedData = normalizeTimeSeriesData(data);
    if (normalizedData) {
      await setCache(cacheKey, normalizedData, TIME_SERIES_CACHE_TTL_MS);
      console.log(`[AlphaVantage TimeSeries Proxy] Fetched and cached time series for ${symbol}`);
      console.log(`[AlphaVantage TimeSeries Proxy] Historical Data for ${symbol}:`, normalizedData.data); // Added log
      await setCache(cacheKey, normalizedData, TIME_SERIES_CACHE_TTL_MS);
      console.log(`[AlphaVantage TimeSeries Proxy] Fetched and cached time series for ${symbol}`);
      return NextResponse.json(normalizedData);
    } else {
        return NextResponse.json({ error: "Failed to normalize time series data." }, { status: 500 });
    }
  } catch (error) {
    console.error(`Error processing time series data for ${symbol}:`, error);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}