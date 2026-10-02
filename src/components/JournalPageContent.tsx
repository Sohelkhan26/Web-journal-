import React, { useState, useRef, useEffect } from 'react';
import type {
  JournalPage,
  TextBlock,
  DrawingPoint,
  DrawingPath,
  PolaroidPhoto,
  StickerItem,
  FontStyle,
  PageLayoutConfig,
} from '../types/journal';
import { sounds } from '../utils/audio';
import { Trash2, Sparkles, Bookmark } from 'lucide-react';

interface JournalPageContentProps {
  page: JournalPage;
  pageNumber: number;
  totalPages: number;
  isLeftPage: boolean;
  activeTool: 'write' | 'draw' | 'photo' | 'sticker';
  currentFont: FontStyle;
  currentInk: string;
  currentFontSize: number;
  layout: PageLayoutConfig;
  penStrokeWidth: number;
  isBookmarked: boolean;
  onToggleBookmark: () => void;
  onUpdatePage: (updated: JournalPage) => void;
  onDeletePage?: () => void;
}

export const JournalPageContent: React.FC<JournalPageContentProps> = ({
  page,
  isLeftPage,
  activeTool,
  currentFont,
  currentInk,
  currentFontSize,
  layout,
  penStrokeWidth,
  isBookmarked,
  onToggleBookmark,
  onUpdatePage,
}) => {
  const pageRef = useRef<HTMLDivElement>(null);
  const drawingLayerRef = useRef<HTMLDivElement>(null);
  const [activeBlockId, setActiveBlockId] = useState<string | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentPath, setCurrentPath] = useState<DrawingPoint[]>([]);

  const lineHeight = layout.lineHeight || 32;
  const showLines = page.paperStyle === 'lined' || (!page.paperStyle && lineHeight > 0);
  const headerOffset = 52; // Header space in px for Title and Date before lines start

  // Dynamic ruled line style
  const paperClass =
    page.paperStyle === 'parchment'
      ? 'paper-parchment'
      : page.paperStyle === 'dots'
      ? 'paper-dots'
      : page.paperStyle === 'blank'
      ? 'paper-ivory'
      : page.paperStyle === 'ivory'
      ? 'paper-ivory'
      : '';

  const dynamicLinedStyle: React.CSSProperties = showLines
    ? {
        backgroundColor: '#faf7ee',
        backgroundImage: `repeating-linear-gradient(
          transparent,
          transparent ${lineHeight - 1}px,
          ${layout.lineColor || '#cfd9e8'} ${lineHeight - 1}px,
          ${layout.lineColor || '#cfd9e8'} ${lineHeight}px
        )`,
        backgroundAttachment: 'local',
        backgroundPosition: `0 ${headerOffset}px`,
      }
    : {};

  // Handle click on page to create or focus text block
  const handlePageClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (activeTool !== 'write') return;
    if (!pageRef.current) return;

    // Check if clicked directly on an interactive item or existing input
    const target = e.target as HTMLElement;
    if (
      target.closest('.interactive-element') ||
      target.tagName === 'TEXTAREA' ||
      target.tagName === 'INPUT' ||
      target.tagName === 'BUTTON'
    ) {
      return;
    }

    const rect = pageRef.current.getBoundingClientRect();
    const clickY = e.clientY - rect.top;

    // Calculate exact row on lined paper
    let rowIndex = 0;
    if (showLines && lineHeight > 0) {
      rowIndex = Math.max(0, Math.floor((clickY - headerOffset) / lineHeight));
    } else {
      // Blank or unlined: calculate approximate row
      rowIndex = Math.max(0, Math.floor((clickY - headerOffset) / 32));
    }

    // Check if an existing block already exists at or encompasses this row
    const existingBlock = page.textBlocks?.find(
      (b) => b.isFullWidth && b.rowIndex !== undefined && Math.abs(b.rowIndex - rowIndex) < 2
    );

    if (existingBlock) {
      setActiveBlockId(existingBlock.id);
      return;
    }

    // Create a new full-width page entry spanning the entire line across the page!
    const newBlock: TextBlock = {
      id: 'tb-' + Date.now(),
      rowIndex,
      text: '',
      fontStyle: currentFont,
      inkColor: currentInk,
      fontSize: currentFontSize,
      isFullWidth: true,
    };

    sounds.playKeySound(currentFont === 'typewriter' ? 'typewriter' : 'fountain');

    const updatedBlocks = [...(page.textBlocks || []), newBlock];
    onUpdatePage({
      ...page,
      textBlocks: updatedBlocks,
      updatedAt: Date.now(),
    });

    setActiveBlockId(newBlock.id);
  };

  // Text block change
  const handleTextChange = (id: string, newText: string) => {
    sounds.playKeySound(currentFont === 'typewriter' ? 'typewriter' : 'fountain');

    const updated = page.textBlocks.map((b) => (b.id === id ? { ...b, text: newText } : b));
    onUpdatePage({
      ...page,
      textBlocks: updated,
      updatedAt: Date.now(),
    });
  };

  // Remove empty block on blur
  const handleBlockBlur = (id: string, text: string) => {
    if (!text.trim()) {
      const filtered = page.textBlocks.filter((b) => b.id !== id);
      onUpdatePage({
        ...page,
        textBlocks: filtered,
        updatedAt: Date.now(),
      });
    }
    setActiveBlockId(null);
  };

  // Delete block
  const handleDeleteBlock = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const filtered = page.textBlocks.filter((b) => b.id !== id);
    onUpdatePage({
      ...page,
      textBlocks: filtered,
      updatedAt: Date.now(),
    });
  };

  // -------------------------------------------------------------
  // Pointer Events for Graphics Pad, Stylus & Mouse Drawing
  // -------------------------------------------------------------
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (activeTool !== 'draw' || !pageRef.current) return;
    e.currentTarget.setPointerCapture(e.pointerId);

    const rect = pageRef.current.getBoundingClientRect();
    const pressure = e.pressure && e.pressure > 0 ? e.pressure : 0.5;
    const pt: DrawingPoint = {
      x: ((e.clientX - rect.left) / rect.width) * 100,
      y: ((e.clientY - rect.top) / rect.height) * 100,
      pressure,
    };

    setIsDrawing(true);
    setCurrentPath([pt]);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDrawing || activeTool !== 'draw' || !pageRef.current) return;
    const rect = pageRef.current.getBoundingClientRect();
    const pressure = e.pressure && e.pressure > 0 ? e.pressure : 0.5;
    const pt: DrawingPoint = {
      x: ((e.clientX - rect.left) / rect.width) * 100,
      y: ((e.clientY - rect.top) / rect.height) * 100,
      pressure,
    };
    setCurrentPath((prev) => [...prev, pt]);
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDrawing || activeTool !== 'draw') return;
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      // ignore
    }
    setIsDrawing(false);

    if (currentPath.length > 1) {
      const avgPressure =
        currentPath.reduce((acc, p) => acc + (p.pressure || 0.5), 0) / currentPath.length;
      const strokeWidth = penStrokeWidth * (0.6 + avgPressure * 0.8);

      const newDrawing: DrawingPath = {
        id: 'dr-' + Date.now(),
        points: currentPath,
        color: currentInk,
        width: Math.max(1, Math.min(8, Math.round(strokeWidth * 10) / 10)),
      };

      onUpdatePage({
        ...page,
        drawings: [...(page.drawings || []), newDrawing],
        updatedAt: Date.now(),
      });
    }
    setCurrentPath([]);
  };

  // Font family class helper
  const getFontClass = (fontStyle?: FontStyle) => {
    switch (fontStyle) {
      case 'casual': return 'font-casual';
      case 'script': return 'font-script';
      case 'typewriter': return 'font-typewriter';
      case 'serif': return 'font-serif-title';
      case 'signature': return 'font-signature';
      default: return 'font-handwriting';
    }
  };

  return (
    <div
      ref={pageRef}
      onClick={handlePageClick}
      className={`relative w-full h-full select-none overflow-hidden transition-colors duration-300 ${paperClass} ${
        isLeftPage ? 'page-left-shadow' : 'page-right-shadow'
      }`}
      style={{
        ...dynamicLinedStyle,
        cursor: activeTool === 'draw' ? 'crosshair' : activeTool === 'write' ? 'text' : 'default',
      }}
    >
      {/* Red vertical margin line on lined paper */}
      {showLines && layout.showMargin && (
        <div
          className="absolute top-0 bottom-0 w-[1.5px] bg-red-400/40 pointer-events-none z-10"
          style={{ left: `${layout.marginLeft || 48}px` }}
        />
      )}

      {/* Spine Crease Shadow Overlay */}
      <div
        className={`absolute top-0 bottom-0 pointer-events-none z-15 w-12 ${
          isLeftPage
            ? 'right-0 bg-gradient-to-l from-black/20 via-black/5 to-transparent'
            : 'left-0 bg-gradient-to-r from-black/20 via-black/5 to-transparent'
        }`}
      />

      {/* Page Header (Date & Title) */}
      <div className="absolute top-3 left-12 right-12 h-8 flex items-center justify-between pointer-events-none text-stone-500 font-book text-xs tracking-wider uppercase border-b border-stone-300/40 z-20">
        <span className="truncate max-w-[200px] font-medium text-stone-600">
          {page.title || `Entry #${page.pageNumber}`}
        </span>
        <span className="font-mono text-[11px] text-stone-400">{page.date}</span>
      </div>

      {/* Bookmark Ribbon Toggle on Top Corner */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onToggleBookmark();
        }}
        title={isBookmarked ? 'Bookmarked' : 'Bookmark this page'}
        className={`interactive-element absolute top-1 z-30 p-1.5 rounded transition-transform hover:scale-110 ${
          isLeftPage ? 'left-3' : 'right-3'
        }`}
      >
        <Bookmark
          size={16}
          className={
            isBookmarked
              ? 'fill-red-600 text-red-600 drop-shadow-md'
              : 'text-stone-400 hover:text-red-500'
          }
        />
      </button>

      {/* Drawing Layer with Graphics Pad / Stylus Pointer Events */}
      <div
        ref={drawingLayerRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        style={{ touchAction: 'none' }}
        className={`absolute inset-0 w-full h-full z-20 ${
          activeTool === 'draw' ? 'cursor-crosshair pointer-events-auto' : 'pointer-events-none'
        }`}
      >
        <svg className="w-full h-full">
          {page.drawings?.map((d) => (
            <path
              key={d.id}
              d={d.points.reduce((acc, pt, i) => `${acc} ${i === 0 ? 'M' : 'L'} ${pt.x}% ${pt.y}%`, '')}
              stroke={d.color}
              strokeWidth={d.width}
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity="0.9"
            />
          ))}
          {isDrawing && currentPath.length > 1 && (
            <path
              d={currentPath.reduce((acc, pt, i) => `${acc} ${i === 0 ? 'M' : 'L'} ${pt.x}% ${pt.y}%`, '')}
              stroke={currentInk}
              strokeWidth={penStrokeWidth}
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity="0.9"
            />
          )}
        </svg>
      </div>

      {/* Text Blocks Layer: Full-Width Page Entries and Notes */}
      <div className="absolute inset-0 w-full h-full z-25 pointer-events-none">
        {page.textBlocks?.map((block) => (
          <FullPageTextBlock
            key={block.id}
            block={block}
            isActive={activeBlockId === block.id}
            fontClass={getFontClass(block.fontStyle)}
            lineHeight={lineHeight}
            headerOffset={headerOffset}
            marginLeft={layout.marginLeft || 48}
            baselineOffset={layout.baselineOffset || 0}
            onFocus={() => setActiveBlockId(block.id)}
            onChange={(text) => handleTextChange(block.id, text)}
            onBlur={(text) => handleBlockBlur(block.id, text)}
            onDelete={(e) => handleDeleteBlock(block.id, e)}
          />
        ))}
      </div>

      {/* Polaroid Photos */}
      {page.photos?.map((photo) => (
        <PolaroidItem
          key={photo.id}
          photo={photo}
          onDelete={() => {
            const filtered = page.photos.filter((p) => p.id !== photo.id);
            onUpdatePage({ ...page, photos: filtered, updatedAt: Date.now() });
          }}
        />
      ))}

      {/* Stickers & Vintage Stamps */}
      {page.stickers?.map((sticker) => (
        <StickerDisplay
          key={sticker.id}
          sticker={sticker}
          onDelete={() => {
            const filtered = page.stickers.filter((s) => s.id !== sticker.id);
            onUpdatePage({ ...page, stickers: filtered, updatedAt: Date.now() });
          }}
        />
      ))}

      {/* Page Number at bottom corner */}
      <div
        className={`absolute bottom-3 text-stone-400 font-book text-xs pointer-events-none select-none tracking-widest z-20 ${
          isLeftPage ? 'left-6' : 'right-6'
        }`}
      >
        {page.pageNumber}
      </div>
    </div>
  );
};

// -------------------------------------------------------------
// Full-Page Text Block Component
// Perfectly locks text onto horizontal row lines and spans full page
// -------------------------------------------------------------
interface FullPageTextBlockProps {
  block: TextBlock;
  isActive: boolean;
  fontClass: string;
  lineHeight: number;
  headerOffset: number;
  marginLeft: number;
  baselineOffset: number;
  onFocus: () => void;
  onChange: (val: string) => void;
  onBlur: (val: string) => void;
  onDelete: (e: React.MouseEvent) => void;
}

const FullPageTextBlock: React.FC<FullPageTextBlockProps> = ({
  block,
  isActive,
  fontClass,
  lineHeight,
  headerOffset,
  marginLeft,
  baselineOffset,
  onFocus,
  onChange,
  onBlur,
  onDelete,
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea height as user writes multiple rows
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.max(lineHeight, textareaRef.current.scrollHeight)}px`;
    }
  }, [block.text, lineHeight]);

  // Focus when newly created
  useEffect(() => {
    if (isActive && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [isActive]);

  // Exact vertical row alignment
  // Row 0 starts at headerOffset.
  // baselineOffset allows user fine-tuning (+/- px) to sit flush on top of ruled lines.
  const rowIndex = block.rowIndex !== undefined ? block.rowIndex : 0;
  const topPx = headerOffset + rowIndex * lineHeight + baselineOffset;

  const leftStyle = block.isFullWidth ? `${marginLeft + 12}px` : `${block.x || 15}%`;
  const rightStyle = block.isFullWidth ? '24px' : undefined;
  const widthStyle = block.isFullWidth ? `calc(100% - ${marginLeft + 36}px)` : 'auto';

  return (
    <div
      className="interactive-element group absolute pointer-events-auto z-25 transition-all"
      style={{
        left: leftStyle,
        right: rightStyle,
        width: widthStyle,
        top: `${topPx}px`,
        transform: block.rotation ? `rotate(${block.rotation}deg)` : undefined,
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="relative w-full">
        <textarea
          ref={textareaRef}
          value={block.text}
          onChange={(e) => onChange(e.target.value)}
          onFocus={onFocus}
          onBlur={(e) => onBlur(e.target.value)}
          placeholder="Start writing here..."
          rows={1}
          style={{
            color: block.inkColor || '#1e293b',
            fontSize: `${block.fontSize || 22}px`,
            lineHeight: `${lineHeight}px`,
            padding: 0,
            margin: 0,
          }}
          className={`bg-transparent resize-none border-none outline-none overflow-hidden block w-full whitespace-pre-wrap ${fontClass} ${
            isActive ? 'ring-1 ring-amber-400/40 rounded bg-amber-50/15' : ''
          }`}
        />

        {/* Delete note button */}
        {block.text && (
          <button
            onClick={onDelete}
            title="Delete entry"
            className="opacity-0 group-hover:opacity-100 transition-opacity absolute -top-3 -right-3 p-1 rounded-full bg-stone-100/95 text-stone-500 hover:text-red-600 shadow border border-stone-200"
          >
            <Trash2 size={12} />
          </button>
        )}
      </div>
    </div>
  );
};

// -------------------------------------------------------------
// Polaroid Photo Card
// -------------------------------------------------------------
interface PolaroidItemProps {
  photo: PolaroidPhoto;
  onDelete: () => void;
}

const PolaroidItem: React.FC<PolaroidItemProps> = ({ photo, onDelete }) => {
  return (
    <div
      className="interactive-element group absolute z-20 polaroid cursor-grab active:cursor-grabbing select-none"
      style={{
        left: `${photo.x}%`,
        top: `${photo.y}%`,
        transform: `rotate(${photo.rotation || 0}deg)`,
        maxWidth: '190px',
      }}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Washi Tape strip at top */}
      <div className="washi-tape absolute -top-3 left-1/2 -translate-x-1/2 w-16 h-5 z-30" />

      <div className="w-full aspect-[4/3] overflow-hidden bg-stone-200 rounded-sm mb-2 shadow-inner">
        <img
          src={photo.imageUrl}
          alt={photo.caption}
          className="w-full h-full object-cover pointer-events-none"
          crossOrigin="anonymous"
        />
      </div>
      {photo.caption && (
        <p className="font-handwriting text-stone-700 text-sm text-center leading-tight">
          {photo.caption}
        </p>
      )}

      {/* Delete button on hover */}
      <button
        onClick={onDelete}
        title="Remove photo"
        className="opacity-0 group-hover:opacity-100 transition-opacity absolute -top-2 -right-2 p-1 rounded-full bg-stone-800 text-stone-200 hover:bg-red-600 shadow-md"
      >
        <Trash2 size={12} />
      </button>
    </div>
  );
};

// -------------------------------------------------------------
// Sticker Display Component
// -------------------------------------------------------------
interface StickerDisplayProps {
  sticker: StickerItem;
  onDelete: () => void;
}

const StickerDisplay: React.FC<StickerDisplayProps> = ({ sticker, onDelete }) => {
  const renderStickerGraphic = () => {
    switch (sticker.type) {
      case 'wax-seal':
        return (
          <div className="w-14 h-14 rounded-full bg-gradient-to-br from-red-800 via-rose-900 to-amber-950 shadow-md border-2 border-amber-700/60 flex items-center justify-center text-amber-200 font-serif-title font-bold text-lg drop-shadow">
            §
          </div>
        );
      case 'postage-stamp':
        return (
          <div className="w-16 h-20 bg-amber-50 border-2 border-dashed border-stone-400 shadow-sm p-1 flex flex-col justify-between items-center text-stone-600">
            <span className="text-[9px] font-mono font-bold tracking-widest text-stone-400">AIR MAIL</span>
            <Sparkles size={18} className="text-amber-700" />
            <span className="text-[10px] font-bold text-amber-800 font-serif-title">1926</span>
          </div>
        );
      case 'dried-leaf':
        return (
          <div className="text-3xl filter drop-shadow-md select-none transform hover:scale-105 transition-transform">
            🍁
          </div>
        );
      case 'coffee-ring':
        return (
          <div className="w-16 h-16 rounded-full border-4 border-amber-900/25 opacity-70 filter blur-[0.4px] shadow-inner" />
        );
      case 'pressed-flower':
        return (
          <div className="text-3xl filter drop-shadow-md select-none transform hover:scale-105 transition-transform">
            🌸
          </div>
        );
      default:
        return <div className="text-2xl">⭐</div>;
    }
  };

  return (
    <div
      className="interactive-element group absolute z-20 cursor-pointer"
      style={{
        left: `${sticker.x}%`,
        top: `${sticker.y}%`,
        transform: `rotate(${sticker.rotation}deg)`,
      }}
      onClick={(e) => e.stopPropagation()}
    >
      {renderStickerGraphic()}
      <button
        onClick={onDelete}
        title="Remove sticker"
        className="opacity-0 group-hover:opacity-100 transition-opacity absolute -top-2 -right-2 p-1 rounded-full bg-stone-800 text-stone-200 hover:bg-red-600 shadow"
      >
        <Trash2 size={11} />
      </button>
    </div>
  );
};
