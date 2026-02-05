// utils/newsApi.ts

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

interface NewsApiResponse {
  status: string;
  totalResults: number;
  articles: Article[];
}

export const fetchNews = async (
  theme: string, // Now accepts a theme directly
  page: number = 1,
  pageSize: number = 10,
  sortBy: string = 'popularity'
): Promise<{ articles: Article[]; totalResults: number }> => {
  let apiUrl = `/api/news?theme=${encodeURIComponent(theme)}&page=${page}&pageSize=${pageSize}&sortBy=${sortBy}`;

  try {
    const response = await fetch(apiUrl); // Call our local proxy API route
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `Failed to fetch news from proxy: ${response.statusText}`);
    }
    const data: NewsApiResponse = await response.json();
    return { articles: data.articles, totalResults: data.totalResults };
  } catch (error: any) {
    console.error("Failed to fetch news:", error);
    return { articles: [], totalResults: 0 };
  }
};
