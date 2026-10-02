import React from 'react';
import type { PageLayoutConfig, PaperStyle } from '../types/journal';
import { X, Sliders, Check } from 'lucide-react';

interface PageSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  layout: PageLayoutConfig;
  onUpdateLayout: (updated: PageLayoutConfig) => void;
  paperStyle: PaperStyle;
  onPaperStyleChange: (style: PaperStyle) => void;
}

const LINE_HEIGHT_PRESETS = [
  { label: 'Compact', height: 26, approxRows: '28 rows', desc: 'Tight college ruling' },
  { label: 'Standard', height: 32, approxRows: '23 rows', desc: 'Classic medium ruling' },
  { label: 'Wide', height: 38, approxRows: '19 rows', desc: 'Comfortable wide lines' },
  { label: 'Spacious', height: 44, approxRows: '16 rows', desc: 'Large expressive handwriting' },
  { label: 'Blank', height: 0, approxRows: '0 rows', desc: 'Unlined artist paper' },
];

const LINE_COLORS = [
  { label: 'Classic Blue', color: '#cfd9e8' },
  { label: 'Sepia Walnut', color: '#d5c5b2' },
  { label: 'Pencil Grey', color: '#cbd5e1' },
  { label: 'Soft Sage', color: '#d1dcd4' },
  { label: 'Faint Rose', color: '#f5d8d8' },
];

export const PageSettingsModal: React.FC<PageSettingsModalProps> = ({
  isOpen,
  onClose,
  layout,
  onUpdateLayout,
  paperStyle,
  onPaperStyleChange,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-xl bg-stone-900 border border-stone-700/80 rounded-2xl shadow-2xl p-6 overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-3 border-b border-stone-800">
          <div className="flex items-center gap-2">
            <Sliders size={18} className="text-amber-500" />
            <h2 className="text-stone-100 font-serif-title font-semibold text-lg">
              Page, Lines & Row Customization
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-stone-400 hover:text-stone-100 hover:bg-stone-800 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <div className="mt-4 max-h-[70vh] overflow-y-auto space-y-5 pr-1 text-xs text-stone-300">
          {/* Row Height & Line Spacing Presets */}
          <div>
            <label className="block text-xs font-semibold text-stone-200 uppercase tracking-wider mb-2">
              Row Spacing & Row Count
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {LINE_HEIGHT_PRESETS.map((preset) => {
                const isSelected = layout.lineHeight === preset.height;
                return (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() => {
                      onUpdateLayout({ ...layout, lineHeight: preset.height });
                      if (preset.height === 0) {
                        onPaperStyleChange('blank');
                      } else if (paperStyle === 'blank') {
                        onPaperStyleChange('lined');
                      }
                    }}
                    className={`p-2.5 rounded-xl border text-left transition-all relative ${
                      isSelected
                        ? 'bg-amber-950/40 border-amber-500 text-stone-100 ring-1 ring-amber-500/30'
                        : 'bg-stone-950/60 border-stone-800 text-stone-300 hover:bg-stone-800'
                    }`}
                  >
                    <div className="font-semibold text-sm flex items-center justify-between">
                      <span>{preset.label}</span>
                      {isSelected && <Check size={14} className="text-amber-400" />}
                    </div>
                    <div className="text-[11px] text-amber-400/80 font-mono mt-0.5">
                      {preset.height > 0 ? `${preset.height}px (${preset.approxRows})` : 'No lines'}
                    </div>
                    <div className="text-[10px] text-stone-500 mt-1">{preset.desc}</div>
                  </button>
                );
              })}
            </div>

            {/* Custom slider if not blank */}
            {layout.lineHeight > 0 && (
              <div className="mt-3 bg-stone-950/60 p-3 rounded-xl border border-stone-800 flex items-center gap-3">
                <span className="text-stone-400 whitespace-nowrap">Fine Slider:</span>
                <input
                  type="range"
                  min="20"
                  max="52"
                  value={layout.lineHeight}
                  onChange={(e) =>
                    onUpdateLayout({ ...layout, lineHeight: parseInt(e.target.value, 10) })
                  }
                  className="flex-1 accent-amber-500 cursor-pointer"
                />
                <span className="font-mono text-amber-400 font-bold min-w-[40px] text-right">
                  {layout.lineHeight}px
                </span>
              </div>
            )}
          </div>

          {/* Text Baseline Alignment (Fix for text slightly under or above line) */}
          <div className="bg-stone-950/80 p-3.5 rounded-xl border border-stone-800">
            <div className="flex items-center justify-between mb-1.5">
              <label className="font-semibold text-stone-200">
                Text Baseline Alignment (Sit on Line)
              </label>
              <span className="font-mono text-amber-400 text-xs">
                {layout.baselineOffset > 0 ? `+${layout.baselineOffset}px` : `${layout.baselineOffset}px`}
              </span>
            </div>
            <p className="text-[11px] text-stone-400 mb-2.5">
              Adjust so your handwriting sits perfectly flush on top of the horizontal row lines.
            </p>
            <div className="flex items-center gap-3">
              <span className="text-[10px] text-stone-500">Lower text</span>
              <input
                type="range"
                min="-10"
                max="10"
                value={layout.baselineOffset}
                onChange={(e) =>
                  onUpdateLayout({ ...layout, baselineOffset: parseInt(e.target.value, 10) })
                }
                className="flex-1 accent-amber-500 cursor-pointer"
              />
              <span className="text-[10px] text-stone-500">Raise text</span>
            </div>
          </div>

          {/* Line Color & Opacity */}
          {layout.lineHeight > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-stone-200 mb-2">Rule Line Color</label>
                <div className="flex items-center gap-2">
                  {LINE_COLORS.map((lc) => (
                    <button
                      key={lc.color}
                      type="button"
                      onClick={() => onUpdateLayout({ ...layout, lineColor: lc.color })}
                      className={`w-7 h-7 rounded-full border transition-all ${
                        layout.lineColor === lc.color
                          ? 'ring-2 ring-amber-400 scale-110 border-white'
                          : 'border-stone-700 hover:scale-105 opacity-80'
                      }`}
                      style={{ backgroundColor: lc.color }}
                      title={lc.label}
                    />
                  ))}
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="font-semibold text-stone-200">Line Opacity</label>
                  <span className="font-mono text-amber-400">
                    {Math.round((layout.lineOpacity || 0.75) * 100)}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0.1"
                  max="1.0"
                  step="0.05"
                  value={layout.lineOpacity || 0.75}
                  onChange={(e) =>
                    onUpdateLayout({ ...layout, lineOpacity: parseFloat(e.target.value) })
                  }
                  className="w-full accent-amber-500 cursor-pointer"
                />
              </div>
            </div>
          )}

          {/* Margin Settings */}
          <div className="bg-stone-950/60 p-3.5 rounded-xl border border-stone-800 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-semibold text-stone-200">Red Margin Guideline</div>
                <div className="text-[11px] text-stone-500">
                  Classic vertical margin line on the left side of each page
                </div>
              </div>
              <input
                type="checkbox"
                checked={layout.showMargin}
                onChange={(e) => onUpdateLayout({ ...layout, showMargin: e.target.checked })}
                className="w-4 h-4 accent-amber-500 cursor-pointer rounded"
              />
            </div>

            {layout.showMargin && (
              <div className="flex items-center gap-3 pt-2 border-t border-stone-800/80">
                <span className="text-stone-400 text-xs">Margin Position:</span>
                <input
                  type="range"
                  min="24"
                  max="80"
                  value={layout.marginLeft}
                  onChange={(e) =>
                    onUpdateLayout({ ...layout, marginLeft: parseInt(e.target.value, 10) })
                  }
                  className="flex-1 accent-amber-500 cursor-pointer"
                />
                <span className="font-mono text-amber-400 min-w-[36px] text-right">
                  {layout.marginLeft}px
                </span>
              </div>
            )}
          </div>

          {/* Paper Texture Selection */}
          <div>
            <label className="block font-semibold text-stone-200 uppercase tracking-wider mb-2">
              Paper Texture & Tone
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { id: 'lined', label: 'Lined Ivory' },
                { id: 'parchment', label: 'Aged Parchment' },
                { id: 'dots', label: 'Bullet Dot-Grid' },
                { id: 'blank', label: 'Smooth Blank' },
              ].map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => onPaperStyleChange(p.id as PaperStyle)}
                  className={`p-2.5 rounded-xl border text-center font-medium transition-all ${
                    paperStyle === p.id
                      ? 'bg-amber-950/40 border-amber-500 text-amber-200'
                      : 'bg-stone-950/60 border-stone-800 text-stone-400 hover:text-stone-200'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Done Button */}
        <div className="mt-5 pt-3 border-t border-stone-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-medium text-xs shadow-md transition-colors"
          >
            Apply & Close
          </button>
        </div>
      </div>
    </div>
  );
};
