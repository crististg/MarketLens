// src/app/api/gemini/insights/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { BarChart, Building, Globe, Landmark, TrendingUp } from 'lucide-react'; // Import necessary icons for MACRO_INDICATORS

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

// Define MACRO_INDICATORS directly in the API route for consistent data fetching
const MACRO_INDICATORS = [
  { indicator: 'CPI', name: 'CPI', icon: BarChart },
  { indicator: 'GDP', name: 'GDP Growth', icon: Globe },
  { indicator: 'FEDERAL_FUNDS_RATE', name: 'Interest Rate', icon: Landmark },
  { indicator: 'UNEMPLOYMENT', name: 'Employment', icon: Building },
];

const BIG_STOCK_SYMBOLS = ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'TSLA', 'NVDA'];
const MAJOR_INDEX_SYMBOLS = ['SPY', 'QQQ', 'DIA', 'IWM'];

// Helper function to fetch data from internal APIs
async function fetchInternalApi(url: string) {
  const response = await fetch(url);
  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Failed to fetch from internal API ${url}: ${response.status} - ${errorBody}`);
  }
  return response.json();
}

export async function GET(request: NextRequest) {
  if (!GEMINI_API_KEY) {
    return NextResponse.json({ error: "GEMINI_API_KEY is not set. Please set the environment variable." }, { status: 500 });
  }

  try {
    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemma-3-27b-it" }); // Using gemma-3-27b-it as per documentation

    // 1. Aggregate data from internal APIs
    const [newsData, fetchedStocks, fetchedIndices, macroDataResults] = await Promise.allSettled([
      fetchInternalApi(`${request.nextUrl.origin}/api/news?page=1&pageSize=5&category=general`),
      Promise.all(BIG_STOCK_SYMBOLS.map(symbol => fetchInternalApi(`${request.nextUrl.origin}/api/stocks/${symbol}`))),
      Promise.all(MAJOR_INDEX_SYMBOLS.map(symbol => fetchInternalApi(`${request.nextUrl.origin}/api/stocks/${symbol}`))),
      Promise.all(MACRO_INDICATORS.map(macro => fetchInternalApi(`${request.nextUrl.origin}/api/macro?indicator=${macro.indicator}`))),
    ]);

    let promptContent = "Generate a 'What's moving markets today?' summary based on the following data:\n\n";

    // --- News Data ---
    if (newsData.status === 'fulfilled' && newsData.value.articles) {
      promptContent += "--- Latest News ---\n";
      newsData.value.articles.slice(0, 3).forEach((article: any) => {
        promptContent += `- ${article.title} (${article.source.name})\n`;
      });
      promptContent += "\n";
    }

    // --- Key Stocks ---
    if (fetchedStocks.status === 'fulfilled' && fetchedStocks.value) {
      promptContent += "--- Key Stocks ---\n";
      fetchedStocks.value.forEach((stockResult: any) => {
        if (stockResult.status === 'fulfilled' && stockResult.value) {
            const stock = stockResult.value;
            promptContent += `- ${stock.symbol}: ${stock.value.toFixed(2)} (${stock.change_percent.toFixed(2)}%)\n`;
        }
      });
      promptContent += "\n";
    }

    // --- Major Indices ---
    if (fetchedIndices.status === 'fulfilled' && fetchedIndices.value) {
        promptContent += "--- Major Indices ---\n";
        fetchedIndices.value.forEach((indexResult: any) => {
            if (indexResult.status === 'fulfilled' && indexResult.value) {
                const index = indexResult.value;
                promptContent += `- ${index.symbol}: ${index.value.toFixed(2)} (${index.change_percent.toFixed(2)}%)\n`;
            }
        });
        promptContent += "\n";
    }

    // --- Macro Economic Indicators ---
    if (macroDataResults.status === 'fulfilled' && macroDataResults.value) {
        promptContent += "--- Macro Economic Indicators ---\n";
        macroDataResults.value.forEach((macroResult: any, index: number) => {
            if (macroResult.status === 'fulfilled' && macroResult.value) {
                const macro = macroResult.value;
                const config = MACRO_INDICATORS[index];
                let changeInfo = '';
                // Calculate change based on historical data received from the macro API
                if (macro.historical && macro.historical.length >= 2) {
                    const latestValue = macro.historical[0].value;
                    const previousValue = macro.historical[1].value;
                    const change = latestValue - previousValue;
                    const change_percent = (change / previousValue) * 100;
                    changeInfo = ` (Change: ${change.toFixed(2)} / ${change_percent.toFixed(2)}%)`;
                }
                promptContent += `- ${config.name}: ${macro.live.value.toFixed(2)}${macro.live.unit}${changeInfo}\n`;
            }
        });
        promptContent += "\n";
    }

    promptContent += `Please generate a "What's Moving Markets Today?" summary based on the following market data.
The entire response MUST be in Markdown format, starting directly with the main heading.
The entire summary, across all sections, must not exceed 6 sentences.
Focus on interrelationships and potential market impacts, avoiding speculative language.
Structure the summary strictly with the following sections:

## What's Moving Markets Today?

### Overall Market Summary
A brief, concise overview of the market's general sentiment and direction, driven by the most impactful data.

### Key Drivers
Identify the primary factors influencing market movements, focusing on **the most important data points** and their interrelationships, referencing stocks and indices where relevant.

### Notable News
Highlight **the single most important news item of the day** and its immediate or potential market impact.

### Economic Outlook
Summarize the current macroeconomic indicators, focusing on **the most impactful changes or trends**, and their implications for the market.

Ensure clarity, use bold text for emphasis where appropriate, and maintain a calm, analytical tone.
Each section should be as concise as possible while providing valuable insight.
`;

    // 2. Construct prompt and call Gemini API
    const result = await model.generateContent(promptContent);
    const response = await result.response;
    const text = response.text();

    return NextResponse.json({ insight: text });

  } catch (error: any) {
    console.error("Error generating Gemini insight:", error);
    return NextResponse.json({ error: error.message || "Failed to generate insight from Gemini." }, { status: 500 });
  }
}