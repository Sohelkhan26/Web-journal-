import React from 'react';
import type { FontStyle, CoverStyle } from '../types/journal';
import {
  PenTool,
  Pencil,
  ImagePlus,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Plus,
  Trash2,
  Sliders,
  Eraser,
} from 'lucide-react';

interface JournalToolbarProps {
  activeTool: 'write' | 'draw' | 'photo' | 'sticker';
  onSelectTool: (tool: 'write' | 'draw' | 'photo' | 'sticker') => void;
  currentFont: FontStyle;
  onFontChange: (font: FontStyle) => void;
  currentInk: string;
  onInkChange: (ink: string) => void;
  currentFontSize: number;
  onFontSizeChange: (size: number) => void;
  penStrokeWidth: number;
  onPenStrokeWidthChange: (w: number) => void;
  onClearDrawings: () => void;
  coverStyle: CoverStyle;
  onCoverStyleChange: (cover: CoverStyle) => void;
  currentPageIndex: number;
  totalPages: number;
  onPrevPage: () => void;
  onNextPage: () => void;
  onAddSpread: () => void;
  onDeleteCurrentPage: () => void;
  onOpenPhotoModal: () => void;
  onOpenStickerModal: () => void;
  onOpenPageSettings: () => void;
}

const INK_PALETTE = [
  { label: 'Midnight Blue', color: '#1e293b' },
  { label: 'Sepia Walnut', color: '#451a03' },
  { label: 'Charcoal Black', color: '#18181b' },
  { label: 'Burgundy Crimson', color: '#881337' },
  { label: 'Forest Pine', color: '#14532d' },
];

const FONTS: { id: FontStyle; label: string }[] = [
  { id: 'handwriting', label: 'Caveat (Handwriting)' },
  { id: 'casual', label: 'Kalam (Casual Pen)' },
  { id: 'script', label: 'Shadows (Script)' },
  { id: 'typewriter', label: 'Courier (Typewriter)' },
  { id: 'serif', label: 'Playfair (Title Serif)' },
  { id: 'signature', label: 'Homemade Apple (Signature)' },
];

const FONT_SIZES = [18, 22, 26, 32];
const STROKE_WIDTHS = [
  { label: 'Fine', width: 1.5 },
  { label: 'Medium', width: 2.5 },
  { label: 'Broad', width: 5.0 },
  { label: 'Brush', width: 8.0 },
];

export const JournalToolbar: React.FC<JournalToolbarProps> = ({
  activeTool,
  onSelectTool,
  currentFont,
  onFontChange,
  currentInk,
  onInkChange,
  currentFontSize,
  onFontSizeChange,
  penStrokeWidth,
  onPenStrokeWidthChange,
  onClearDrawings,
  coverStyle,
  onCoverStyleChange,
  currentPageIndex,
  totalPages,
  onPrevPage,
  onNextPage,
  onAddSpread,
  onDeleteCurrentPage,
  onOpenPhotoModal,
  onOpenStickerModal,
  onOpenPageSettings,
}) => {
  return (
    <div className="w-full z-40 px-3 py-2 bg-stone-950/80 border-t border-stone-800/50 backdrop-blur-md flex flex-wrap items-center justify-between gap-3 text-stone-300">
      {/* Left: Page Navigation & Unlimited Pages Control */}
      <div className="flex items-center gap-2">
        <button
          onClick={onPrevPage}
          disabled={currentPageIndex <= 0}
          className="p-1.5 rounded-lg bg-stone-900 hover:bg-stone-800 disabled:opacity-30 text-stone-200 border border-stone-700/60 transition-colors shadow-sm"
          title="Previous Page Spread"
        >
          <ChevronLeft size={16} />
        </button>

        <span className="font-book text-xs text-stone-400 px-1 whitespace-nowrap">
          {currentPageIndex + 1}–{Math.min(currentPageIndex + 2, totalPages)} / {totalPages}
        </span>

        <button
          onClick={onNextPage}
          className="p-1.5 rounded-lg bg-stone-900 hover:bg-stone-800 text-stone-200 border border-stone-700/60 transition-colors shadow-sm"
          title={
            currentPageIndex + 2 < totalPages
              ? 'Next Page Spread'
              : 'Add New Spread & Continue Writing'
          }
        >
          <ChevronRight size={16} />
        </button>

        <div className="h-5 w-[1px] bg-stone-700/60 mx-1" />

        {/* Add New Spread Button */}
        <button
          onClick={onAddSpread}
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-amber-600/25 hover:bg-amber-600/40 text-amber-300 border border-amber-600/40 text-xs font-medium transition-all shadow-sm"
          title="Insert New 2-Page Spread (Unlimited Pages)"
        >
          <Plus size={14} />
          <span className="hidden sm:inline">Add Pages</span>
        </button>

        <button
          onClick={onDeleteCurrentPage}
          disabled={totalPages <= 2}
          className="p-1.5 rounded-lg bg-stone-900 hover:bg-red-950/60 text-stone-400 hover:text-red-400 border border-stone-700/60 disabled:opacity-30 transition-colors shadow-sm"
          title="Tear Out This Page"
        >
          <Trash2 size={14} />
        </button>
      </div>

      {/* Center: Main Tool Selector */}
      <div className="flex items-center bg-stone-900/90 rounded-xl p-0.5 border border-stone-700/60 shadow-inner">
        <button
          onClick={() => onSelectTool('write')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
            activeTool === 'write'
              ? 'bg-amber-600 text-white shadow-sm'
              : 'text-stone-400 hover:text-stone-200'
          }`}
          title="Click anywhere on ruled lines to write"
        >
          <PenTool size={13} />
          <span>Write</span>
        </button>

        <button
          onClick={() => onSelectTool('draw')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
            activeTool === 'draw'
              ? 'bg-amber-600 text-white shadow-sm'
              : 'text-stone-400 hover:text-stone-200'
          }`}
          title="Sketch with stylus, graphics pad, or mouse (pressure-sensitive)"
        >
          <Pencil size={13} />
          <span>Sketch / Pad</span>
        </button>

        <button
          onClick={() => {
            onSelectTool('photo');
            onOpenPhotoModal();
          }}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
            activeTool === 'photo'
              ? 'bg-amber-600 text-white shadow-sm'
              : 'text-stone-400 hover:text-stone-200'
          }`}
          title="Pin Polaroid Photo"
        >
          <ImagePlus size={13} />
          <span>Polaroid</span>
        </button>

        <button
          onClick={() => {
            onSelectTool('sticker');
            onOpenStickerModal();
          }}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
            activeTool === 'sticker'
              ? 'bg-amber-600 text-white shadow-sm'
              : 'text-stone-400 hover:text-stone-200'
          }`}
          title="Add Vintage Wax Seal or Stamp"
        >
          <Sparkles size={13} />
          <span>Stickers</span>
        </button>
      </div>

      {/* Right: Dynamic Tool Controls (Writing vs Sketching) */}
      <div className="flex items-center gap-2">
        {/* If Sketching Tool is Active: Show Nib/Stroke Widths & Clear */}
        {activeTool === 'draw' ? (
          <div className="flex items-center gap-1.5 bg-stone-900/90 rounded-lg p-1 border border-stone-700/60">
            <span className="text-[10px] text-stone-400 uppercase font-mono px-1">Nib:</span>
            {STROKE_WIDTHS.map((sw) => (
              <button
                key={sw.label}
                onClick={() => onPenStrokeWidthChange(sw.width)}
                className={`px-1.5 py-0.5 rounded text-[11px] font-medium transition-all ${
                  penStrokeWidth === sw.width
                    ? 'bg-amber-600 text-white shadow-sm'
                    : 'text-stone-400 hover:text-stone-200'
                }`}
                title={`${sw.label} nib (${sw.width}px)`}
              >
                {sw.label}
              </button>
            ))}
            <button
              onClick={onClearDrawings}
              className="p-1 rounded text-stone-400 hover:text-red-400 hover:bg-stone-800 transition-colors ml-1"
              title="Clear sketches on this page"
            >
              <Eraser size={13} />
            </button>
          </div>
        ) : (
          /* If Writing Tool is Active: Show Font, Size, and Page Lines button */
          <>
            {/* Font Family Selector */}
            <select
              value={currentFont}
              onChange={(e) => onFontChange(e.target.value as FontStyle)}
              className="bg-stone-900 border border-stone-700/60 rounded-lg px-2 py-1 text-xs text-stone-200 outline-none cursor-pointer focus:border-amber-500"
              title="Handwriting Typography"
            >
              {FONTS.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.label}
                </option>
              ))}
            </select>

            {/* Font Size Selector */}
            <div className="flex items-center bg-stone-900 rounded-lg border border-stone-700/60 p-0.5">
              {FONT_SIZES.map((sz) => (
                <button
                  key={sz}
                  onClick={() => onFontSizeChange(sz)}
                  className={`px-1.5 py-0.5 text-[11px] rounded font-mono ${
                    currentFontSize === sz
                      ? 'bg-amber-600 text-white'
                      : 'text-stone-400 hover:text-stone-200'
                  }`}
                  title={`Font size ${sz}px`}
                >
                  {sz}
                </button>
              ))}
            </div>
          </>
        )}

        {/* Ink Color Swatches */}
        <div className="flex items-center gap-1 bg-stone-900/90 rounded-lg p-1 border border-stone-700/60">
          {INK_PALETTE.map((item) => (
            <button
              key={item.color}
              onClick={() => onInkChange(item.color)}
              className={`w-4 h-4 rounded-full transition-transform ${
                currentInk === item.color
                  ? 'scale-125 ring-2 ring-amber-400'
                  : 'hover:scale-110 opacity-80'
              }`}
              style={{ backgroundColor: item.color }}
              title={item.label}
            />
          ))}
        </div>

        {/* Page & Line Customization Shortcut */}
        <button
          onClick={onOpenPageSettings}
          className="flex items-center gap-1 p-1.5 rounded-lg bg-stone-900 hover:bg-stone-800 text-stone-300 hover:text-amber-200 border border-stone-700/60 text-xs transition-colors shadow-sm"
          title="Customize Row Height, Lines & Margin"
        >
          <Sliders size={14} className="text-amber-400" />
        </button>

        {/* Book Cover Leather Style */}
        <select
          value={coverStyle}
          onChange={(e) => onCoverStyleChange(e.target.value as CoverStyle)}
          className="bg-stone-900 border border-stone-700/60 rounded-lg px-2 py-1 text-xs text-stone-300 outline-none cursor-pointer hidden lg:block"
          title="Book Leather Color"
        >
          <option value="cognac">Cognac Leather</option>
          <option value="dark">Dark Espresso</option>
          <option value="emerald">Emerald Forest</option>
        </select>
      </div>
    </div>
  );
};
