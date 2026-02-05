// src/app/api/macro/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getCache, setCache } from '@/utils/cache';

const FRED_API_KEY = process.env.FRED_API_KEY;

const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

const indicatorConfig = {
  CPI: {
    seriesId: 'CPIAUCSL',
    name: 'CPI',
    unit: '' // CPI is an index value, no direct unit like %
  },
  GDP: {
    seriesId: 'GDPC1',
    name: 'Real GDP', // Clarify as Real GDP
    unit: 'B' // Billions of Dollars (B for brevity)
  },
  FEDERAL_FUNDS_RATE: {
    seriesId: 'FEDFUNDS',
    name: 'Interest Rate',
    unit: '%'
  },
  UNEMPLOYMENT: {
    seriesId: 'UNRATE',
    name: 'Unemployment',
    unit: '%'
  },
};

async function fetchFredData(seriesId: string) {
  if (!FRED_API_KEY) {
    throw new Error("FRED_API_KEY is not set.");
  }

  // Fetching a reasonable amount of historical data to calculate change
  // For 'annual' or 'quarterly' series, 100 observations should be plenty.
  // For 'monthly' series, 100 observations gives ~8 years of data.
  const url = `https://api.stlouisfed.org/fred/series/observations?series_id=${seriesId}&api_key=${FRED_API_KEY}&file_type=json&sort_order=desc&limit=100`;

  const response = await fetch(url);
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`FRED API error for ${seriesId}: ${response.status} - ${errorText}`);
  }
  const data = await response.json();
  return data;
}

export async function GET(request: NextRequest) {
        const { searchParams } = new URL(request.url);
        const indicator = searchParams.get('indicator') as keyof typeof indicatorConfig;  if (!indicator || !indicatorConfig[indicator]) {
    return NextResponse.json({ error: "Invalid or missing 'indicator' query parameter." }, { status: 400 });
  }

  const cacheKey = `macro_${indicator}`;
  const cached = await getCache(cacheKey);
  if (cached) {
    console.log(`[Macro API] Cache hit for ${indicator}`);
    return NextResponse.json(cached);
  }

  try {
    const config = indicatorConfig[indicator];
    const fredData = await fetchFredData(config.seriesId);

    if (!fredData || !fredData.observations || fredData.observations.length === 0) {
      return NextResponse.json({ error: "No data found for this indicator." }, { status: 404 });
    }

    // FRED observations are usually newest first due to sort_order=desc
    const liveObservation = fredData.observations[0];

    // Format historical data to match what page.tsx expects
    // page.tsx expects an array of objects with at least 'value' property
    const historicalData = fredData.observations
      .map((obs: { date: string, value: string }) => {
        const value = parseFloat(obs.value);
        return {
          date: obs.date,
          value: isNaN(value) ? null : value, // Store null if value is NaN
        };
      })
      .filter(item => item.value !== null); // Filter out entries where value is null (was NaN)

    const response = {
      live: {
        date: liveObservation.date,
        value: parseFloat(liveObservation.value),
        unit: config.unit // Add unit from config
      },
      historical: historicalData,
    };

    console.log(`[Macro API] Historical Data for ${indicator}:`, historicalData); // Added log

    await setCache(cacheKey, response, CACHE_TTL_MS);

    return NextResponse.json(response);

  } catch (error: any) {
    console.error(`Error processing macro data for ${indicator}:`, error);
    return NextResponse.json({ error: error.message || "Internal server error." }, { status: 500 });
  }
}