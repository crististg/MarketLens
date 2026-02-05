// src/app/api/gemini/chat/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { BarChart, Building, Globe, Landmark, TrendingUp } from 'lucide-react';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

const MACRO_INDICATORS = [
  { indicator: 'CPI', name: 'CPI', icon: BarChart },
  { indicator: 'GDP', name: 'GDP Growth', icon: Globe },
  { indicator: 'FEDERAL_FUNDS_RATE', name: 'Interest Rate', icon: Landmark },
  { indicator: 'UNEMPLOYMENT', name: 'Employment', icon: Building },
];

const BIG_STOCK_SYMBOLS = ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'TSLA', 'NVDA'];
const MAJOR_INDEX_SYMBOLS = ['SPY', 'QQQ', 'DIA', 'IWM'];

async function fetchInternalApi(url: string) {
  const response = await fetch(url);
  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Failed to fetch from internal API ${url}: ${response.status} - ${errorBody}`);
  }
  return response.json();
}

export async function POST(request: NextRequest) {
  if (!GEMINI_API_KEY) {
    return NextResponse.json({ error: "GEMINI_API_KEY is not set. Please set the environment variable." }, { status: 500 });
  }

  const { message, imageUrl, history } = await request.json();

  if (!message && !imageUrl) {
    return NextResponse.json({ error: "Message or imageUrl is required." }, { status: 400 });
  }

  try {
    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemma-3-27b-it" }); // Reverted to gemma-3-27b-it as requested

    // 1. Aggregate current market data for context
    const [newsData, fetchedStocks, fetchedIndices, macroDataResults] = await Promise.allSettled([
      fetchInternalApi(`${request.nextUrl.origin}/api/news?page=1&pageSize=5&category=general`),
      Promise.all(BIG_STOCK_SYMBOLS.map(symbol => fetchInternalApi(`${request.nextUrl.origin}/api/stocks/${symbol}`))),
      Promise.all(MAJOR_INDEX_SYMBOLS.map(symbol => fetchInternalApi(`${request.nextUrl.origin}/api/stocks/${symbol}`))),
      Promise.all(MACRO_INDICATORS.map(macro => fetchInternalApi(`${request.nextUrl.origin}/api/macro?indicator=${macro.indicator}`))),
    ]);

    let context = "Here is the current market data:\n\n";

    if (newsData.status === 'fulfilled' && newsData.value.articles) {
      context += "--- Latest News ---\n";
      newsData.value.articles.slice(0, 3).forEach((article: any) => {
        context += `- ${article.title} (${article.source.name})\n`;
      });
      context += "\n";
    }

    if (fetchedStocks.status === 'fulfilled' && fetchedStocks.value) {
      context += "--- Key Stocks ---\n";
      fetchedStocks.value.forEach((stockResult: any) => {
        if (stockResult.status === 'fulfilled' && stockResult.value) {
            const stock = stockResult.value;
            context += `- ${stock.symbol}: ${stock.value.toFixed(2)} (${stock.change_percent.toFixed(2)}%)\n`;
        }
      });
      context += "\n";
    }

    if (fetchedIndices.status === 'fulfilled' && fetchedIndices.value) {
        context += "--- Major Indices ---\n";
        fetchedIndices.value.forEach((indexResult: any) => {
            if (indexResult.status === 'fulfilled' && indexResult.value) {
                const index = indexResult.value;
                context += `- ${index.symbol}: ${index.value.toFixed(2)} (${index.change_percent.toFixed(2)}%)\n`;
            }
        });
        context += "\n";
    }

    if (macroDataResults.status === 'fulfilled' && macroDataResults.value) {
        context += "--- Macro Economic Indicators ---\n";
        macroDataResults.value.forEach((macroResult: any, index: number) => {
            if (macroResult.status === 'fulfilled' && macroResult.value) {
                const macro = macroResult.value;
                const config = MACRO_INDICATORS[index];
                let changeInfo = '';
                if (macro.historical && macro.historical.length >= 2) {
                    const latestValue = macro.historical[0].value;
                    const previousValue = macro.historical[1].value;
                    const change = latestValue - previousValue;
                    const change_percent = (change / previousValue) * 100;
                    changeInfo = ` (Change: ${change.toFixed(2)} / ${change_percent.toFixed(2)}%)`;
                }
                context += `- ${config.name}: ${macro.live.value.toFixed(2)}${macro.live.unit}${changeInfo}\n`;
            }
        });
        context += "\n";
    }

    const chatHistory = history || [];
    const contents: any[] = []; // Array to hold parts for the current message

    if (context) {
      contents.push({ text: `Market Data:\n${context}` });
    }
    
    if (imageUrl) {
      contents.push({
        fileData: {
          mimeType: 'image/jpeg', // Assuming JPEG for now, ideally derive from upload
          fileUri: imageUrl,
        },
      });
    }
    
    if (message) {
      contents.push({ text: `User: ${message}` });
    }

    // Prepare the history for the model, ensuring it can handle multimodal parts
    const formattedHistory = chatHistory.map((msg: any) => ({
      role: msg.role,
      parts: msg.parts.map((part: any) => {
        if (part.text) return { text: part.text };
        if (part.imageUrl) return { fileData: { mimeType: 'image/jpeg', fileUri: part.imageUrl } }; // Assuming JPEG and directly passing URL
        return part;
      }),
    }));

    const conversation = model.startChat({ history: formattedHistory });
    const result = await conversation.sendMessage(contents); // Pass contents array
    const response = await result.response;
    const text = response.text();

    return NextResponse.json({ response: text });

  } catch (error: any) {
    console.error("Error generating Gemini chat response:", error);
    return NextResponse.json({ error: error.message || "Failed to generate chat response from Gemma." }, { status: 500 });
  }
}
