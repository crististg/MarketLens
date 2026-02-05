// src/app/api/gemini/stock-insights/[symbol]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai'; // Uncommented
import { format, parseISO } from 'date-fns';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY; // Uncommented

// Helper function to fetch data from internal APIs
async function fetchInternalApi(url: string) {
  const response = await fetch(url);
  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Failed to fetch from internal API ${url}: ${response.status} - ${errorBody}`);
  }
  return response.json();
}

export async function GET(request: NextRequest, { params: paramsPromise }: { params: Promise<{ symbol: string }> }) {
  const params = await paramsPromise; // Await the params Promise
  const { symbol } = params;

  // Original Gemini API call logic (uncommented)
  if (!GEMINI_API_KEY) {
    return NextResponse.json({ error: "GEMINI_API_KEY is not set. Please set the environment variable." }, { status: 500 });
  }
  if (!symbol) {
    return NextResponse.json({ error: "Stock symbol is required." }, { status: 400 });
  }

  try {
    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemma-3-27b-it" }); // Using gemma-3-27b-it to match homepage

    // 1. Aggregate data for the specific stock
    const [stockDataResult, timeSeriesDataResult, newsDataResult] = await Promise.allSettled([
      fetchInternalApi(`${request.nextUrl.origin}/api/stocks/${symbol}`),
      fetchInternalApi(`${request.nextUrl.origin}/api/stocks/timeseries/${symbol}`),
      fetchInternalApi(`${request.nextUrl.origin}/api/news?query=${symbol}&page=1&pageSize=5`), // News about the specific stock
    ]);

    let promptContent = `Generate a concise, analytical overview for the stock ${symbol} based on the following data.
The response MUST be in Markdown format, start directly with the main heading, and be for informational purposes only.
The entire response must not exceed 4 sentences.
NEVER provide investment advice, buy/sell recommendations, or price predictions.
Focus on summarising key performance, recent trends, and news impact.

## Stock Analysis for ${symbol}

`;

    // Add current stock data
    if (stockDataResult.status === 'fulfilled' && stockDataResult.value) {
      const stock = stockDataResult.value;
      promptContent += `### Current Performance\n`;
      promptContent += `- Price: ${stock.value.toFixed(2)} ${stock.currency}\n`;
      promptContent += `- Change: ${stock.change.toFixed(2)} (${stock.change_percent.toFixed(2)}%)\n`;
      promptContent += `- Open: ${stock.open.toFixed(2)}, High: ${stock.high.toFixed(2)}, Low: ${stock.low.toFixed(2)}\n`;
      promptContent += `- Volume: ${stock.volume.toLocaleString()}\n`;
      promptContent += `- Last Updated: ${format(parseISO(stock.timestamp), 'MMM dd, yyyy HH:mm')}\n\n`;
    }

    // Add time series data (historical trends)
    if (timeSeriesDataResult.status === 'fulfilled' && timeSeriesDataResult.value && timeSeriesDataResult.value.data.length > 0) {
      const historicalData = timeSeriesDataResult.value.data;
      const latestClose = historicalData[0].close;
      const oneMonthAgoClose = historicalData[Math.min(historicalData.length - 1, 20)]?.close; // Approx 20 trading days
      const sixMonthsAgoClose = historicalData[Math.min(historicalData.length - 1, 120)]?.close; // Approx 120 trading days

      promptContent += `### Historical Trends\n`;
      promptContent += `- Latest Close: ${latestClose.toFixed(2)}\n`;
      if (oneMonthAgoClose) {
        const monthChange = ((latestClose - oneMonthAgoClose) / oneMonthAgoClose * 100).toFixed(2);
        promptContent += `- 1 Month Change: ${monthChange}%\n`;
      }
      if (sixMonthsAgoClose) {
        const sixMonthChange = ((latestClose - sixMonthsAgoClose) / sixMonthsAgoClose * 100).toFixed(2);
        promptContent += `- 6 Month Change: ${sixMonthChange}%\n`;
      }
      // Add more specific trend analysis here if needed, e.g., comparison to 52-week high/low from stockData if available
      promptContent += `\n`;
    }

    // Add news specific to the stock
    if (newsDataResult.status === 'fulfilled' && newsDataResult.value && newsDataResult.value.articles.length > 0) {
      promptContent += `### Recent News Impact\n`;
      newsDataResult.value.articles.slice(0, 3).forEach((article: any) => {
        promptContent += `- **${article.title}** (${article.source.name}) - Published: ${format(parseISO(article.publishedAt), 'MMM dd, yyyy')}\n`;
      });
      promptContent += `\n`;
    }

    promptContent += `Based on this data, provide an objective summary of ${symbol}'s current status, recent performance, and potential influencing factors. Ensure the language is neutral, factual, and strictly avoids any investment recommendations, predictions, or financial advice.`;


    // 2. Call Gemini API
    const result = await model.generateContent(promptContent);
    const response = await result.response;
    const text = response.text();

    return NextResponse.json({ insight: text });

  } catch (error: any) {
    console.error(`Error generating Gemini stock insight for ${symbol}:`, error);
    return NextResponse.json({ error: error.message || "Failed to generate stock insight from Gemini." }, { status: 500 });
  }
}
