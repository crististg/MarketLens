import { NextRequest, NextResponse } from 'next/server';
import { getCache, setCache } from '@/utils/cache';

const FINNHUB_API_KEY = process.env.FINNHUB_API_KEY;

if (!FINNHUB_API_KEY) {
  console.error("FINNHUB_API_KEY is not set.");
}

const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

interface FinnhubQuote {
  c: number; // current price
  h: number; // high price of the day
  l: number; // low price of the day
  o: number; // open price of the day
  pc: number; // previous close price
  t: number; // timestamp
}

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

const normalizeStockData = (symbol: string, fhData: FinnhubQuote): NormalizedStockData => {
  const change = fhData.c - fhData.pc;
  const change_percent = (change / fhData.pc) * 100;
  const timestampDate = new Date(fhData.t * 1000);

  return {
    symbol: symbol,
    asset_type: 'stock',
    timestamp: timestampDate.toISOString(),
    value: fhData.c,
    open: fhData.o,
    high: fhData.h,
    low: fhData.l,
    close: fhData.pc,
    volume: 0, // Not available in quote endpoint
    change: change,
    change_percent: change_percent,
    currency: 'USD',
    source: 'Finnhub',
  };
};

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ symbol: string }> }
) {
  const { symbol: rawSymbol } = await params;
  const symbol = rawSymbol.toUpperCase();
  const cacheKey = `stock_quote_${symbol}`;

  // 1. Check cache
  const cached = await getCache(cacheKey);
  if (cached) {
    console.log(`[Finnhub Proxy] Cache hit for ${symbol}`);
    return NextResponse.json(cached);
  }

  // 2. Fetch from Finnhub
  try {
    if (!FINNHUB_API_KEY) {
      return NextResponse.json({ error: "Finnhub API key not configured." }, { status: 500 });
    }

    const fhUrl = `https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${FINNHUB_API_KEY}`;
    const response = await fetch(fhUrl);

    if (!response.ok) {
      console.error(`Finnhub API error for ${symbol}: ${response.statusText}`);
      return NextResponse.json({ error: `Failed to fetch from Finnhub: ${response.statusText}` }, { status: response.status });
    }

    const responseText = await response.text();
    if (!responseText) {
      return NextResponse.json({ error: `Stock symbol not found or no data for ${symbol}.` }, { status: 404 });
    }

    const data: FinnhubQuote = JSON.parse(responseText);

    if (data.c === 0 && data.pc === 0) {
      return NextResponse.json({ error: `Stock symbol not found or no data for ${symbol}.` }, { status: 404 });
    }

    // 3. Normalize and cache
    const normalizedData = normalizeStockData(symbol, data);
    await setCache(cacheKey, normalizedData, CACHE_TTL_MS);
    console.log(`[Finnhub Proxy] Fetched and cached ${symbol}`);

    return NextResponse.json(normalizedData);
  } catch (error) {
    console.error(`Error processing stock data for ${symbol}:`, error);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}