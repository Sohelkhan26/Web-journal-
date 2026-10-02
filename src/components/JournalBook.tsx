import React, { useState, useEffect, useCallback } from 'react';
import type { JournalPage, CoverStyle, FontStyle, PageLayoutConfig } from '../types/journal';
import { JournalPageContent } from './JournalPageContent';
import { sounds } from '../utils/audio';
import { ChevronLeft, ChevronRight, Bookmark, Plus } from 'lucide-react';

interface JournalBookProps {
  pages: JournalPage[];
  currentPageIndex: number; // 0-indexed (0 = spread with pages[0] & pages[1])
  coverStyle: CoverStyle;
  activeTool: 'write' | 'draw' | 'photo' | 'sticker';
  currentFont: FontStyle;
  currentInk: string;
  currentFontSize: number;
  layout: PageLayoutConfig;
  penStrokeWidth: number;
  bookmarkedPages: number[];
  onTurnPage: (newIndex: number) => void;
  onUpdatePage: (updated: JournalPage) => void;
  onToggleBookmark: (pageNum: number) => void;
  onOpenBookmarksSidebar: () => void;
  onAddSpread: () => void;
}

export const JournalBook: React.FC<JournalBookProps> = ({
  pages,
  currentPageIndex,
  coverStyle,
  activeTool,
  currentFont,
  currentInk,
  currentFontSize,
  layout,
  penStrokeWidth,
  bookmarkedPages,
  onTurnPage,
  onUpdatePage,
  onToggleBookmark,
  onOpenBookmarksSidebar,
  onAddSpread,
}) => {
  const [isFlipping, setIsFlipping] = useState<'next' | 'prev' | null>(null);

  // Left and Right pages for current two-page spread
  const leftPage = pages[currentPageIndex] || null;
  const rightPage = pages[currentPageIndex + 1] || null;

  const leftPageNum = currentPageIndex + 1;
  const rightPageNum = currentPageIndex + 2;

  // Cover styling classes
  const coverBgClass =
    coverStyle === 'dark'
      ? 'leather-dark'
      : coverStyle === 'emerald'
      ? 'leather-emerald'
      : 'leather-cognac';

  // Turn to Next Spread
  const handleNext = useCallback(() => {
    if (isFlipping) return;
    if (currentPageIndex + 2 < pages.length) {
      setIsFlipping('next');
      sounds.playPageTurn();
      setTimeout(() => {
        onTurnPage(currentPageIndex + 2);
        setIsFlipping(null);
      }, 350);
    } else {
      // At the end of journal: automatically add new spread so pages are unlimited!
      onAddSpread();
    }
  }, [currentPageIndex, pages.length, isFlipping, onTurnPage, onAddSpread]);

  // Turn to Previous Spread
  const handlePrev = useCallback(() => {
    if (currentPageIndex > 0 && !isFlipping) {
      setIsFlipping('prev');
      sounds.playPageTurn();
      setTimeout(() => {
        onTurnPage(Math.max(0, currentPageIndex - 2));
        setIsFlipping(null);
      }, 350);
    }
  }, [currentPageIndex, isFlipping, onTurnPage]);

  // Keyboard navigation (Arrow keys) when not actively typing in an input
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeTag = document.activeElement?.tagName;
      if (activeTag === 'TEXTAREA' || activeTag === 'INPUT') return;

      if (e.key === 'ArrowRight' || e.key === 'PageDown') {
        handleNext();
      } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
        handlePrev();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleNext, handlePrev]);

  return (
    <div className="relative flex flex-col items-center justify-center w-full max-w-[1240px] px-2 sm:px-6 my-auto select-none">
      {/* Outer Leather Book Case */}
      <div
        className={`relative w-full rounded-2xl p-4 sm:p-7 transition-all duration-500 book-shadow ${coverBgClass} border border-amber-900/40`}
      >
        {/* Leather Stitching Outline */}
        <div className="absolute inset-2 sm:inset-3 rounded-xl leather-stitching pointer-events-none" />

        {/* Brass Corner Protectors (Vintage detail) */}
        <div className="absolute top-2 left-2 w-8 h-8 border-t-4 border-l-4 border-amber-500/70 rounded-tl-lg pointer-events-none drop-shadow" />
        <div className="absolute top-2 right-2 w-8 h-8 border-t-4 border-r-4 border-amber-500/70 rounded-tr-lg pointer-events-none drop-shadow" />
        <div className="absolute bottom-2 left-2 w-8 h-8 border-b-4 border-l-4 border-amber-500/70 rounded-bl-lg pointer-events-none drop-shadow" />
        <div className="absolute bottom-2 right-2 w-8 h-8 border-b-4 border-r-4 border-amber-500/70 rounded-br-lg pointer-events-none drop-shadow" />

        {/* Satin Red Ribbon Bookmark hanging from top - opens bookmarks sidebar */}
        <div
          onClick={onOpenBookmarksSidebar}
          title="Click to view Bookmarked Pages"
          className="ribbon-bookmark absolute -top-3 left-1/2 -translate-x-1/2 z-40 w-6 h-28 bg-gradient-to-b from-red-800 via-rose-700 to-red-900 cursor-pointer hover:h-32 transition-all duration-300 rounded-b-sm flex items-end justify-center pb-2 shadow-xl group"
        >
          <div className="w-0 h-0 border-l-[12px] border-l-transparent border-r-[12px] border-r-transparent border-b-[8px] border-b-amber-950/60" />
          <span className="absolute -bottom-5 text-[9px] font-mono bg-stone-900 text-amber-300 px-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap shadow">
            {bookmarkedPages.length} Marks
          </span>
        </div>

        {/* Open Book Spread Container */}
        <div className="relative flex flex-col md:flex-row w-full aspect-[4/3] md:aspect-[1.45/1] min-h-[500px] max-h-[820px] rounded-lg overflow-hidden bg-stone-100 shadow-2xl">
          {/* Paper Stack Thickness Effect on Left Edge */}
          <div className="hidden md:block absolute left-0 top-0 bottom-0 w-2.5 bg-gradient-to-r from-stone-400 via-stone-200 to-stone-100 border-r border-stone-300/40 z-30 pointer-events-none shadow-sm" />

          {/* Left Page (Writable) */}
          <div className="relative flex-1 h-full overflow-hidden border-b md:border-b-0 md:border-r border-stone-300/50">
            {leftPage ? (
              <JournalPageContent
                page={leftPage}
                pageNumber={leftPageNum}
                totalPages={pages.length}
                isLeftPage={true}
                activeTool={activeTool}
                currentFont={currentFont}
                currentInk={currentInk}
                currentFontSize={currentFontSize}
                layout={layout}
                penStrokeWidth={penStrokeWidth}
                isBookmarked={bookmarkedPages.includes(leftPageNum)}
                onToggleBookmark={() => onToggleBookmark(leftPageNum)}
                onUpdatePage={onUpdatePage}
              />
            ) : (
              <div className="w-full h-full paper-ivory flex items-center justify-center text-stone-400 font-book italic">
                Blank Endpaper
              </div>
            )}

            {/* Left Corner Page Turn Trigger */}
            {currentPageIndex > 0 && (
              <button
                onClick={handlePrev}
                title="Previous Page (Left Arrow)"
                className="group absolute top-0 left-0 w-16 h-16 z-35 flex items-start justify-start p-2 focus:outline-none"
              >
                <div className="w-8 h-8 rounded-br-2xl bg-gradient-to-br from-amber-100 to-stone-300 opacity-30 group-hover:opacity-100 group-hover:w-11 group-hover:h-11 transition-all duration-200 shadow-md border-b border-r border-stone-400/50 flex items-center justify-center">
                  <ChevronLeft size={16} className="text-stone-700 -ml-1 -mt-1" />
                </div>
              </button>
            )}
          </div>

          {/* Center Spine Crease */}
          <div className="hidden md:block absolute left-1/2 top-0 bottom-0 -translate-x-1/2 w-8 z-30 book-spine-crease pointer-events-none" />

          {/* Right Page (Writable) */}
          <div className="relative flex-1 h-full overflow-hidden">
            {rightPage ? (
              <JournalPageContent
                page={rightPage}
                pageNumber={rightPageNum}
                totalPages={pages.length}
                isLeftPage={false}
                activeTool={activeTool}
                currentFont={currentFont}
                currentInk={currentInk}
                currentFontSize={currentFontSize}
                layout={layout}
                penStrokeWidth={penStrokeWidth}
                isBookmarked={bookmarkedPages.includes(rightPageNum)}
                onToggleBookmark={() => onToggleBookmark(rightPageNum)}
                onUpdatePage={onUpdatePage}
              />
            ) : (
              <div className="w-full h-full paper-ivory flex flex-col items-center justify-center text-stone-400 font-book italic p-4 text-center">
                <span>End of Journal</span>
                <button
                  onClick={onAddSpread}
                  className="mt-3 px-3 py-1.5 rounded-lg bg-amber-700 hover:bg-amber-600 text-white font-sans text-xs flex items-center gap-1 shadow"
                >
                  <Plus size={14} /> Add New Pages
                </button>
              </div>
            )}

            {/* Right Corner Page Turn Trigger */}
            <button
              onClick={handleNext}
              title={
                currentPageIndex + 2 < pages.length
                  ? 'Next Page (Right Arrow)'
                  : 'Add New Spread & Continue Writing'
              }
              className="group absolute top-0 right-0 w-16 h-16 z-35 flex items-start justify-end p-2 focus:outline-none"
            >
              <div className="w-8 h-8 rounded-bl-2xl bg-gradient-to-bl from-amber-100 to-stone-300 opacity-30 group-hover:opacity-100 group-hover:w-11 group-hover:h-11 transition-all duration-200 shadow-md border-b border-l border-stone-400/50 flex items-center justify-center">
                {currentPageIndex + 2 < pages.length ? (
                  <ChevronRight size={16} className="text-stone-700 -mr-1 -mt-1" />
                ) : (
                  <Plus size={16} className="text-amber-700 -mr-1 -mt-1" />
                )}
              </div>
            </button>
          </div>

          {/* Paper Stack Thickness Effect on Right Edge */}
          <div className="hidden md:block absolute right-0 top-0 bottom-0 w-2.5 bg-gradient-to-l from-stone-400 via-stone-200 to-stone-100 border-l border-stone-300/40 z-30 pointer-events-none shadow-sm" />

          {/* Turning Page Animation Overlay */}
          {isFlipping && (
            <div
              className={`absolute top-0 bottom-0 w-1/2 z-40 pointer-events-none bg-stone-100/90 shadow-2xl transition-transform duration-350 ease-in-out ${
                isFlipping === 'next'
                  ? 'right-0 origin-left animate-page-flip-left'
                  : 'left-0 origin-right animate-page-flip-right'
              }`}
            />
          )}
        </div>

        {/* Quick Toolbar on Bottom Leather Border */}
        <div className="mt-3 flex items-center justify-between text-amber-200/80 text-xs px-2">
          <div className="flex items-center gap-3">
            <button
              onClick={onOpenBookmarksSidebar}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-black/30 hover:bg-black/50 text-amber-200 transition-colors"
            >
              <Bookmark size={13} className="fill-red-500 text-red-500" />
              <span>Bookmarks ({bookmarkedPages.length})</span>
            </button>
          </div>

          <div className="font-book tracking-widest text-amber-100/70">
            Pages {currentPageIndex + 1}–{Math.min(currentPageIndex + 2, pages.length)} of {pages.length}
          </div>
        </div>
      </div>
    </div>
  );
};
