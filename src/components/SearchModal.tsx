import React, { useState, useMemo } from 'react';
import type { JournalPage } from '../types/journal';
import { X, Search as SearchIcon, ArrowRight } from 'lucide-react';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  pages: JournalPage[];
  onSelectPage: (pageNum: number) => void;
}

export const SearchModal: React.FC<SearchModalProps> = ({
  isOpen,
  onClose,
  pages,
  onSelectPage,
}) => {
  const [query, setQuery] = useState('');

  const searchResults = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase();

    const matches: { page: JournalPage; matchedSnippet: string }[] = [];

    pages.forEach((p) => {
      // Check title
      if (p.title?.toLowerCase().includes(q)) {
        matches.push({ page: p, matchedSnippet: `Title: ${p.title}` });
        return;
      }

      // Check text blocks
      for (const block of p.textBlocks || []) {
        if (block.text.toLowerCase().includes(q)) {
          const idx = block.text.toLowerCase().indexOf(q);
          const start = Math.max(0, idx - 30);
          const end = Math.min(block.text.length, idx + q.length + 30);
          const snippet = (start > 0 ? '...' : '') + block.text.slice(start, end) + (end < block.text.length ? '...' : '');
          matches.push({ page: p, matchedSnippet: snippet });
          break;
        }
      }
    });

    return matches;
  }, [pages, query]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-xl bg-stone-900 border border-stone-700/70 rounded-2xl shadow-2xl p-6 overflow-hidden">
        {/* Search Input Bar */}
        <div className="relative flex items-center border-b border-stone-700 pb-3">
          <SearchIcon size={18} className="text-amber-500 mr-2.5" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search journal entries..."
            className="w-full bg-transparent text-stone-100 placeholder-stone-500 text-base outline-none"
            autoFocus
          />
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-stone-400 hover:text-stone-100 hover:bg-stone-800 transition-colors ml-2"
          >
            <X size={18} />
          </button>
        </div>

        {/* Results */}
        <div className="mt-4 max-h-[50vh] overflow-y-auto space-y-2 pr-1">
          {query.trim() && searchResults.length === 0 ? (
            <div className="py-8 text-center text-stone-500 font-book italic">
              No pages found matching "{query}"
            </div>
          ) : null}

          {searchResults.map(({ page, matchedSnippet }) => (
            <div
              key={page.id}
              onClick={() => {
                onSelectPage(page.pageNumber);
                onClose();
              }}
              className="group flex items-center justify-between p-3 rounded-xl bg-stone-950/60 hover:bg-stone-800/80 border border-stone-800 hover:border-amber-600/40 cursor-pointer transition-all"
            >
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-amber-500/80 px-2 py-0.5 rounded bg-stone-900 border border-stone-800">
                    Pg {page.pageNumber}
                  </span>
                  <span className="text-stone-200 font-serif-title font-medium">
                    {page.title || `Entry #${page.pageNumber}`}
                  </span>
                </div>
                <p className="mt-1 text-xs text-amber-200/70 font-handwriting text-sm italic">
                  "{matchedSnippet}"
                </p>
              </div>

              <ArrowRight size={16} className="text-stone-500 group-hover:text-amber-400 transition-colors" />
            </div>
          ))}

          {!query.trim() && (
            <div className="py-6 text-center text-stone-500 font-book text-sm">
              Type keywords, dates, or memories to search your journal.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
