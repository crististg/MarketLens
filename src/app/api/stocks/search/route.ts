import { NextRequest, NextResponse } from 'next/server';
import { getCache, setCache } from '@/utils/cache';

const FINNHUB_API_KEY = process.env.FINNHUB_API_KEY;

const SEARCH_CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

interface FinnhubSearchResult {
  description: string;
  displaySymbol: string;
  symbol: string;
  type: string;
}

interface NormalizedSearchResult {
  symbol: string;
  name: string;
  type: string;
}

const normalizeSearchResults = (fhResults: FinnhubSearchResult[]): NormalizedSearchResult[] => {
  return fhResults.map(item => ({
    symbol: item.symbol,
    name: item.description,
    type: item.type,
  }));
};

export async function GET(
  request: NextRequest,
) {
  const { searchParams } = new URL(request.url);
  const keywords = searchParams.get('keywords');

  if (!keywords) {
    return NextResponse.json({ error: "Missing 'keywords' query parameter." }, { status: 400 });
  }

  const cacheKey = `stock_search_${keywords.toLowerCase()}`;

  // 1. Check cache
  const cached = await getCache(cacheKey);
  if (cached) {
    console.log(`[Finnhub Search Proxy] Cache hit for keywords: ${keywords}`);
    return NextResponse.json(cached);
  }

  // 2. Fetch from Finnhub
  try {
    if (!FINNHUB_API_KEY) {
      return NextResponse.json({ error: "Finnhub API key not configured." }, { status: 500 });
    }

    const fhUrl = `https://finnhub.io/api/v1/search?q=${encodeURIComponent(keywords)}&token=${FINNHUB_API_KEY}`;
    const response = await fetch(fhUrl);

    if (!response.ok) {
      console.error(`Finnhub Search API error for keywords '${keywords}': ${response.statusText}`);
      return NextResponse.json({ error: `Failed to fetch from Finnhub: ${response.statusText}` }, { status: response.status });
    }

    const responseText = await response.text();
    if (!responseText) {
      return NextResponse.json([], { status: 200 }); // No matches found
    }

    const data = JSON.parse(responseText);

    if (!data.result || data.result.length === 0) {
      return NextResponse.json([], { status: 200 }); // No matches found
    }

    // 3. Normalize and cache
    const normalizedData = normalizeSearchResults(data.result);
    await setCache(cacheKey, normalizedData, SEARCH_CACHE_TTL_MS);
    console.log(`[Finnhub Search Proxy] Fetched and cached for keywords: ${keywords}`);

    return NextResponse.json(normalizedData);
  } catch (error) {
    console.error(`Error processing stock search for keywords '${keywords}':`, error);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}