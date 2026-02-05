// src/utils/watchlist.ts

const WATCHLIST_STORAGE_KEY = 'marketlens_watchlist';

/**
 * Retrieves the current watchlist from localStorage.
 * @returns {string[]} An array of stock/index symbols.
 */
export const getWatchlist = (): string[] => {
  if (typeof window === 'undefined') {
    return []; // Return empty array if not in browser environment
  }
  const watchlistJson = localStorage.getItem(WATCHLIST_STORAGE_KEY);
  return watchlistJson ? JSON.parse(watchlistJson) : [];
};

/**
 * Saves the watchlist to localStorage.
 * @param {string[]} watchlist The watchlist array to save.
 */
const saveWatchlist = (watchlist: string[]): void => {
  if (typeof window !== 'undefined') {
    localStorage.setItem(WATCHLIST_STORAGE_KEY, JSON.stringify(watchlist));
  }
};

/**
 * Adds a symbol to the watchlist.
 * @param {string} symbol The stock/index symbol to add.
 * @returns {string[]} The updated watchlist.
 */
export const addToWatchlist = (symbol: string): string[] => {
  const currentWatchlist = getWatchlist();
  if (!currentWatchlist.includes(symbol)) {
    const updatedWatchlist = [...currentWatchlist, symbol];
    saveWatchlist(updatedWatchlist);
    return updatedWatchlist;
  }
  return currentWatchlist;
};

/**
 * Removes a symbol from the watchlist.
 * @param {string} symbol The stock/index symbol to remove.
 * @returns {string[]} The updated watchlist.
 */
export const removeFromWatchlist = (symbol: string): string[] => {
  const currentWatchlist = getWatchlist();
  const updatedWatchlist = currentWatchlist.filter(item => item !== symbol);
  saveWatchlist(updatedWatchlist);
  return updatedWatchlist;
};

/**
 * Checks if a symbol is in the watchlist.
 * @param {string} symbol The stock/index symbol to check.
 * @returns {boolean} True if the symbol is in the watchlist, false otherwise.
 */
export const isInWatchlist = (symbol: string): boolean => {
  return getWatchlist().includes(symbol);
};