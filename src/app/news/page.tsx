// src/app/news/page.tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import { fetchNews } from '@/utils/newsApi';
import { NewsItem } from '@/components/NewsItem';

interface Article {
  source: {
    id: string | null;
    name: string;
  };
  author: string | null;
  title: string;
  description: string | null;
  url: string;
  urlToImage: string | null;
  publishedAt: string;
  content: string | null;
}

const NEWS_PAGE_SIZE = 10; // Number of articles to fetch per page

// Define the new themes
const themes = ['general', 'political', 'geopolitical', 'business', 'technology', 'economics'];

export default function NewsPage() {
  const [selectedTheme, setSelectedTheme] = useState(themes[0]); // Changed to selectedTheme
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalResults, setTotalResults] = useState(0);

  const loadNews = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Pass selectedTheme to fetchNews
      const { articles: fetchedArticles, totalResults: fetchedTotalResults } = await fetchNews(
        selectedTheme,
        currentPage,
        NEWS_PAGE_SIZE
      );
      setArticles(fetchedArticles);
      setTotalResults(fetchedTotalResults);
    } catch (err) {
      setError(err as any);
      setArticles([]);
      setTotalResults(0);
    } finally {
      setLoading(false);
    }
  }, [selectedTheme, currentPage]); // Dependency on selectedTheme

  useEffect(() => {
    loadNews();
  }, [loadNews]);

  const totalPages = Math.ceil(totalResults / NEWS_PAGE_SIZE);

  return (
    <div className="container mx-auto px-4">
        <h1 className="text-3xl font-bold mb-6 text-market-primary">Market News</h1>

        {/* Theme Navigation */}
        <div className="flex flex-wrap gap-3 mb-8">
          {themes.map((theme) => ( // Iterate over themes
            <button
              key={theme}
              onClick={() => {
                setSelectedTheme(theme); // Set selectedTheme
                setCurrentPage(1); // Reset to first page on theme change
              }}
              className={`px-4 py-2 rounded-lg transition-colors
                ${selectedTheme === theme
                  ? "bg-market-primary text-white"
                  : "bg-neutral-800 text-neutral-300 hover:bg-neutral-700"
                }`}
            >
              {theme.charAt(0).toUpperCase() + theme.slice(1)} {/* Capitalize theme for display */}
            </button>
          ))}
        </div>

        {/* News List */}
        {loading && <p className="text-neutral-400">Loading news...</p>}
        {error && <p className="text-red-500">Error: {error.message}</p>}
        {!loading && articles.length === 0 && !error && (
          <p className="text-neutral-400">No news found for this theme.</p>
        )}
        {!loading && articles.length > 0 && (
          <div className="bg-neutral-900 p-6 rounded-lg border border-neutral-800">
            {articles.map((article, index) => (
              <NewsItem
                key={article.url || index}
                source={article.source.name}
                title={article.title}
                time={article.publishedAt}
                url={article.url}
              />
            ))}
          </div>
        )}

        {/* Pagination */}
        {!loading && totalPages > 1 && (
          <div className="flex justify-center items-center gap-4 mt-8">
            <button
              onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="px-4 py-2 rounded-lg bg-neutral-800 text-neutral-300 hover:bg-neutral-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <span className="text-neutral-300">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className="px-4 py-2 rounded-lg bg-neutral-800 text-neutral-300 hover:bg-neutral-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        )}
      </div>
  );
}
