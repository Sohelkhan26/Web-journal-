import React, { useState } from 'react';
import type { JournalPage } from '../types/journal';
import { X, BookOpen, Calendar, Edit3, ArrowRight } from 'lucide-react';

interface TableOfContentsModalProps {
  isOpen: boolean;
  onClose: () => void;
  pages: JournalPage[];
  onSelectPage: (pageNum: number) => void;
  onUpdateTitle: (pageId: string, newTitle: string) => void;
}

export const TableOfContentsModal: React.FC<TableOfContentsModalProps> = ({
  isOpen,
  onClose,
  pages,
  onSelectPage,
  onUpdateTitle,
}) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-2xl bg-stone-900 border border-stone-700/70 rounded-2xl shadow-2xl p-6 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-stone-800">
          <div className="flex items-center gap-2">
            <BookOpen className="text-amber-500" size={20} />
            <h2 className="text-stone-100 font-serif-title font-semibold text-xl">Table of Contents</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-stone-400 hover:text-stone-100 hover:bg-stone-800 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Page List */}
        <div className="mt-4 max-h-[60vh] overflow-y-auto space-y-2 pr-1">
          {pages.map((p) => {
            const previewSnippet = p.textBlocks
              ?.map((b) => b.text)
              .join(' ')
              .slice(0, 100);

            const isEditing = editingId === p.id;

            return (
              <div
                key={p.id}
                className="group flex items-center justify-between p-3.5 rounded-xl bg-stone-950/60 hover:bg-stone-800/80 border border-stone-800/80 hover:border-amber-600/40 transition-all cursor-pointer"
                onClick={() => {
                  if (!isEditing) {
                    onSelectPage(p.pageNumber);
                    onClose();
                  }
                }}
              >
                <div className="flex items-start gap-3 flex-1 min-w-0 pr-3">
                  <span className="font-mono text-xs font-bold text-amber-500/80 px-2 py-1 rounded bg-stone-900 border border-stone-800">
                    Pg {p.pageNumber}
                  </span>

                  <div className="flex-1 min-w-0">
                    {isEditing ? (
                      <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="text"
                          value={editTitle}
                          onChange={(e) => setEditTitle(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              onUpdateTitle(p.id, editTitle);
                              setEditingId(null);
                            }
                          }}
                          className="bg-stone-800 text-stone-100 px-2 py-1 rounded border border-amber-500 text-sm outline-none w-full"
                          autoFocus
                        />
                        <button
                          onClick={() => {
                            onUpdateTitle(p.id, editTitle);
                            setEditingId(null);
                          }}
                          className="px-2 py-1 rounded bg-amber-600 text-white text-xs font-medium"
                        >
                          Save
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <h3 className="text-stone-200 font-serif-title font-medium text-base truncate group-hover:text-amber-200">
                          {p.title || `Entry #${p.pageNumber}`}
                        </h3>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingId(p.id);
                            setEditTitle(p.title || `Entry #${p.pageNumber}`);
                          }}
                          className="opacity-0 group-hover:opacity-100 p-1 text-stone-400 hover:text-amber-300"
                          title="Rename entry"
                        >
                          <Edit3 size={13} />
                        </button>
                      </div>
                    )}

                    <div className="flex items-center gap-3 mt-1 text-xs text-stone-400">
                      <span className="flex items-center gap-1">
                        <Calendar size={11} /> {p.date}
                      </span>
                      {previewSnippet && (
                        <span className="italic truncate text-stone-400 max-w-[280px]">
                          "{previewSnippet}..."
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-stone-500 group-hover:text-amber-400 transition-colors">
                  <span className="text-xs hidden sm:inline">Flip to page</span>
                  <ArrowRight size={15} />
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="mt-4 pt-3 border-t border-stone-800 text-right text-xs text-stone-400 font-book">
          Total: {pages.length} Pages Recorded
        </div>
      </div>
    </div>
  );
};
