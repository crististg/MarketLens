// MarketLens/src/app/api/news/route.ts
import { NextRequest, NextResponse } from 'next/server';

const NEWS_API_KEY = process.env.NEWS_API_KEY;

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const theme = searchParams.get('theme'); // New theme parameter
  const category = searchParams.get('category'); // Existing category parameter
  const query = searchParams.get('q'); // Existing query parameter
  const page = searchParams.get('page') || '1';
  const pageSize = searchParams.get('pageSize') || '10';
  const sortBy = searchParams.get('sortBy') || 'popularity'; // Default to popularity as requested

  if (!NEWS_API_KEY) {
    return NextResponse.json({ error: "News API key not configured." }, { status: 500 });
  }

  let newsApiUrl = '';
  let finalQuery = '';
  let finalCategory = '';

  if (theme) {
    switch (theme) {
      case 'business':
      case 'technology':
        finalCategory = theme;
        newsApiUrl = `https://newsapi.org/v2/top-headlines?category=${finalCategory}&language=en&pageSize=${pageSize}&page=${page}&sortBy=${sortBy}&apiKey=${NEWS_API_KEY}`;
        break;
      case 'political':
        finalQuery = 'politics';
        newsApiUrl = `https://newsapi.org/v2/everything?q=${finalQuery}&language=en&pageSize=${pageSize}&page=${page}&sortBy=${sortBy}&apiKey=${NEWS_API_KEY}`;
        break;
      case 'geopolitical':
        finalQuery = 'geopolitics';
        newsApiUrl = `https://newsapi.org/v2/everything?q=${finalQuery}&language=en&pageSize=${pageSize}&page=${page}&sortBy=${sortBy}&apiKey=${NEWS_API_KEY}`;
        break;
      case 'economics':
        finalQuery = 'economics';
        newsApiUrl = `https://newsapi.org/v2/everything?q=${finalQuery}&language=en&pageSize=${pageSize}&page=${page}&sortBy=${sortBy}&apiKey=${NEWS_API_KEY}`;
        break;
      default:
        // Fallback if theme is provided but not recognized
        newsApiUrl = `https://newsapi.org/v2/top-headlines?category=general&language=en&pageSize=${pageSize}&page=${page}&sortBy=${sortBy}&apiKey=${NEWS_API_KEY}`;
    }
  } else if (category && category !== 'general') {
    // Existing category handling if no theme
    newsApiUrl = `https://newsapi.org/v2/top-headlines?category=${category}&language=en&pageSize=${pageSize}&page=${page}&sortBy=${sortBy}&apiKey=${NEWS_API_KEY}`;
  } else if (query) {
    // Existing query handling if no theme or specific category
    newsApiUrl = `https://newsapi.org/v2/everything?q=${query}&language=en&pageSize=${pageSize}&page=${page}&sortBy=${sortBy}&apiKey=${NEWS_API_KEY}`;
  } else {
    // Default to general top headlines if no specific query, category, or theme is provided
    newsApiUrl = `https://newsapi.org/v2/top-headlines?category=general&language=en&pageSize=${pageSize}&page=${page}&sortBy=${sortBy}&apiKey=${NEWS_API_KEY}`;
  }


  try {
    const response = await fetch(newsApiUrl);
    if (!response.ok) {
      const errorData = await response.json();
      console.error(`NewsAPI proxy error: ${response.status} - ${JSON.stringify(errorData)}`);
      return NextResponse.json({ error: errorData.message || 'Failed to fetch news from external API.' }, { status: response.status });
    }
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error in NewsAPI proxy:", error);
    return NextResponse.json({ error: "Internal server error contacting NewsAPI." }, { status: 500 });
  }
}