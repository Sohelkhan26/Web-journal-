import React from 'react';
import type { JournalPage } from '../types/journal';
import { Bookmark, X, ArrowRight, Trash2 } from 'lucide-react';

interface BookmarksSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  pages: JournalPage[];
  bookmarkedPageNumbers: number[];
  onSelectPage: (pageNum: number) => void;
  onRemoveBookmark: (pageNum: number) => void;
}

export const BookmarksSidebar: React.FC<BookmarksSidebarProps> = ({
  isOpen,
  onClose,
  pages,
  bookmarkedPageNumbers,
  onSelectPage,
  onRemoveBookmark,
}) => {
  if (!isOpen) return null;

  // Filter bookmarked pages
  const bookmarkedList = pages.filter((p) => bookmarkedPageNumbers.includes(p.pageNumber));

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-80 sm:w-96 bg-stone-900/95 border-l border-stone-700/70 shadow-2xl backdrop-blur-md flex flex-col animate-slide-in">
      {/* Header */}
      <div className="p-4 border-b border-stone-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-red-950/60 border border-red-700/50 flex items-center justify-center text-red-400">
            <Bookmark size={16} className="fill-red-500 text-red-500" />
          </div>
          <div>
            <h2 className="text-stone-100 font-serif-title font-semibold text-base">Bookmarked Pages</h2>
            <p className="text-stone-400 text-xs font-book">
              {bookmarkedList.length} {bookmarkedList.length === 1 ? 'page' : 'pages'} marked
            </p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 rounded-lg text-stone-400 hover:text-stone-200 hover:bg-stone-800 transition-colors"
        >
          <X size={18} />
        </button>
      </div>

      {/* Bookmarked Pages List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
        {bookmarkedList.length === 0 ? (
          <div className="py-12 text-center text-stone-500 px-4">
            <Bookmark size={28} className="mx-auto mb-2 opacity-30 text-stone-400" />
            <p className="font-book text-sm italic">No pages bookmarked yet.</p>
            <p className="text-xs text-stone-600 mt-1">
              Click the red ribbon icon on any page to bookmark it for quick access.
            </p>
          </div>
        ) : (
          bookmarkedList.map((p) => {
            const previewSnippet =
              p.textBlocks?.map((b) => b.text).join(' ').trim().slice(0, 90) || 'Blank page';

            return (
              <div
                key={p.id}
                className="group relative p-3.5 rounded-xl bg-stone-950/70 hover:bg-stone-800/80 border border-stone-800/80 hover:border-amber-600/40 transition-all cursor-pointer shadow-sm"
                onClick={() => {
                  onSelectPage(p.pageNumber);
                  onClose();
                }}
              >
                {/* Red ribbon tag on top right */}
                <div className="absolute top-0 right-4 w-4 h-6 bg-red-800/90 rounded-b-sm shadow-sm flex items-end justify-center pb-0.5">
                  <div className="w-0 h-0 border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent border-b-[3px] border-b-stone-950" />
                </div>

                <div className="flex items-center gap-2 mb-1.5">
                  <span className="font-mono text-xs font-bold text-amber-400/90 px-1.5 py-0.5 rounded bg-stone-900 border border-stone-800">
                    Page {p.pageNumber}
                  </span>
                  <span className="text-stone-300 font-serif-title font-medium text-sm truncate max-w-[160px]">
                    {p.title || `Entry #${p.pageNumber}`}
                  </span>
                </div>

                <p className="text-xs text-stone-400 font-book line-clamp-2 italic mb-2">
                  "{previewSnippet}"
                </p>

                <div className="flex items-center justify-between pt-2 border-t border-stone-800/60 text-xs">
                  <span className="text-stone-500 font-mono text-[11px]">{p.date}</span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onRemoveBookmark(p.pageNumber);
                      }}
                      className="p-1 rounded text-stone-500 hover:text-red-400 hover:bg-stone-800 transition-colors"
                      title="Remove bookmark"
                    >
                      <Trash2 size={13} />
                    </button>
                    <span className="flex items-center gap-1 text-amber-400 group-hover:translate-x-0.5 transition-transform font-medium">
                      Open <ArrowRight size={13} />
                    </span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Footer */}
      <div className="p-3 border-t border-stone-800 bg-stone-950/40 text-center">
        <p className="text-[11px] text-stone-500 font-book">
          Tip: You can bookmark as many pages as you like.
        </p>
      </div>
    </div>
  );
};
