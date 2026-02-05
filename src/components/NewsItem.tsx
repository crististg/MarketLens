// components/NewsItem.tsx
import { format } from 'date-fns';

interface NewsItemProps {
  source: string;
  title: string;
  time: string;
  url: string;
}

export const NewsItem = ({ source, title, time, url }: NewsItemProps) => (
  <a href={url} target="_blank" rel="noopener noreferrer" className="block py-3 border-b border-neutral-700 last:border-b-0 hover:bg-neutral-800 transition-colors">
    <div className="text-xs text-neutral-500 mb-1">{source}</div>
    <div className="text-white font-medium">{title}</div>
    <div className="text-xs text-neutral-400 mt-1">{format(new Date(time), 'MMM d, yyyy HH:mm')}</div>
  </a>
);