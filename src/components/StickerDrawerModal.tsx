import React from 'react';
import { X, Sparkles } from 'lucide-react';
import type { StickerItem } from '../types/journal';

interface StickerDrawerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddSticker: (sticker: StickerItem) => void;
}

const STICKERS: { type: StickerItem['type']; label: string; desc: string; icon: string }[] = [
  { type: 'wax-seal', label: 'Burgundy Wax Seal', desc: 'Embossed monogram seal', icon: '§' },
  { type: 'postage-stamp', label: 'Vintage Airmail', desc: '1926 cancellation stamp', icon: '✉️' },
  { type: 'dried-leaf', label: 'Autumn Maple Leaf', desc: 'Pressed fall foliage', icon: '🍁' },
  { type: 'coffee-ring', label: 'Coffee Cup Stain', desc: 'Morning espresso spill', icon: '☕' },
  { type: 'pressed-flower', label: 'Pressed Blossom', desc: 'Spring botanical keepsake', icon: '🌸' },
  { type: 'star', label: 'Gold Star Marker', desc: 'Important highlight', icon: '⭐' },
];

export const StickerDrawerModal: React.FC<StickerDrawerModalProps> = ({
  isOpen,
  onClose,
  onAddSticker,
}) => {
  if (!isOpen) return null;

  const handleSelect = (type: StickerItem['type']) => {
    const newSticker: StickerItem = {
      id: 'st-' + Date.now(),
      x: 30 + Math.random() * 35,
      y: 20 + Math.random() * 45,
      type,
      rotation: Math.round(Math.random() * 24 - 12),
    };
    onAddSticker(newSticker);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-md bg-stone-900 border border-stone-700/70 rounded-2xl shadow-2xl p-6">
        <div className="flex items-center justify-between pb-3 border-b border-stone-800">
          <div className="flex items-center gap-2 text-stone-100 font-serif-title font-semibold text-lg">
            <Sparkles size={18} className="text-amber-500" />
            <span>Vintage Stamps & Keepsakes</span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-stone-400 hover:text-stone-100 hover:bg-stone-800 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <p className="text-xs text-stone-400 mt-2">
          Click any keepsake to place it onto your current journal page.
        </p>

        <div className="mt-4 grid grid-cols-2 gap-3">
          {STICKERS.map((st) => (
            <button
              key={st.type}
              onClick={() => handleSelect(st.type)}
              className="flex items-center gap-3 p-3 rounded-xl bg-stone-950/70 hover:bg-stone-800/80 border border-stone-800 hover:border-amber-600/50 text-left transition-all group"
            >
              <div className="w-10 h-10 rounded-lg bg-stone-900 border border-stone-700/60 flex items-center justify-center text-xl shadow group-hover:scale-110 transition-transform">
                {st.icon}
              </div>
              <div className="min-w-0">
                <div className="text-stone-200 font-medium text-xs truncate group-hover:text-amber-300">
                  {st.label}
                </div>
                <div className="text-stone-500 text-[10px] truncate">{st.desc}</div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
