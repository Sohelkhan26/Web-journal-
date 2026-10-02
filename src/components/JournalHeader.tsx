import React from 'react';
import type { LightingMode, AmbientSound } from '../types/journal';
import { sounds } from '../utils/audio';
import {
  Volume2,
  VolumeX,
  CloudRain,
  Flame,
  Sun,
  Moon,
  Lamp,
  BookOpen,
  Cloud,
  Search,
  Bookmark,
  Sliders,
  ShieldCheck,
} from 'lucide-react';

interface JournalHeaderProps {
  lighting: LightingMode;
  onLightingChange: (mode: LightingMode) => void;
  ambientSound: AmbientSound;
  onAmbientSoundChange: (sound: AmbientSound) => void;
  soundEffects: boolean;
  onToggleSoundEffects: () => void;
  bookmarkedCount: number;
  onOpenBookmarks: () => void;
  onOpenPageSettings: () => void;
  onOpenIndex: () => void;
  onOpenSearch: () => void;
  onOpenCloudSync: () => void;
  onOpenPrivacy: () => void;
}

export const JournalHeader: React.FC<JournalHeaderProps> = ({
  lighting,
  onLightingChange,
  ambientSound,
  onAmbientSoundChange,
  soundEffects,
  onToggleSoundEffects,
  bookmarkedCount,
  onOpenBookmarks,
  onOpenPageSettings,
  onOpenIndex,
  onOpenSearch,
  onOpenCloudSync,
  onOpenPrivacy,
}) => {
  const handleToggleAmbient = (type: 'rain' | 'fireplace') => {
    const next = ambientSound === type ? 'none' : type;
    sounds.setAmbient(next);
    onAmbientSoundChange(next);
  };

  return (
    <header className="w-full z-40 px-3 sm:px-6 py-2.5 flex items-center justify-between border-b border-stone-800/50 bg-stone-950/70 backdrop-blur-md">
      {/* Title & Brand */}
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-700 to-amber-950 border border-amber-600/50 flex items-center justify-center shadow">
          <span className="font-serif-title text-amber-200 font-bold text-lg">C</span>
        </div>
        <div>
          <h1 className="text-stone-100 font-serif-title font-semibold text-base sm:text-lg tracking-wide leading-tight flex items-center gap-2">
            <span>Chronicle</span>
            <span className="hidden sm:inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-mono bg-emerald-950/80 text-emerald-400 border border-emerald-800/60">
              ● Saved Locally
            </span>
          </h1>
          <p className="text-stone-400 font-book text-[11px] tracking-wider hidden sm:block">
            Tactile Digital Journal
          </p>
        </div>
      </div>

      {/* Navigation & Controls */}
      <div className="flex items-center gap-1.5 sm:gap-2">
        {/* Bookmarks List Button */}
        <button
          onClick={onOpenBookmarks}
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-stone-900/90 hover:bg-stone-800 text-stone-300 hover:text-amber-200 border border-stone-700/60 text-xs font-medium transition-all shadow-sm"
          title="Open Bookmarks List"
        >
          <Bookmark size={13} className="fill-red-500 text-red-500" />
          <span className="hidden sm:inline">Bookmarks</span>
          <span className="font-mono text-[10px] bg-stone-800 px-1 rounded text-amber-300">
            {bookmarkedCount}
          </span>
        </button>

        {/* Page & Line Customization Button */}
        <button
          onClick={onOpenPageSettings}
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-stone-900/90 hover:bg-stone-800 text-stone-300 hover:text-amber-200 border border-stone-700/60 text-xs font-medium transition-all shadow-sm"
          title="Customize Row Height, Lines & Paper"
        >
          <Sliders size={13} className="text-amber-400" />
          <span className="hidden md:inline">Page Lines</span>
        </button>

        {/* Table of Contents Button */}
        <button
          onClick={onOpenIndex}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-stone-900/90 hover:bg-stone-800 text-stone-300 hover:text-amber-200 border border-stone-700/60 text-xs font-medium transition-all shadow-sm"
          title="Open Table of Contents"
        >
          <BookOpen size={13} className="text-amber-400" />
          <span className="hidden sm:inline">Index</span>
        </button>

        {/* Search in Journal */}
        <button
          onClick={onOpenSearch}
          className="p-1.5 rounded-lg bg-stone-900/90 hover:bg-stone-800 text-stone-300 hover:text-amber-200 border border-stone-700/60 text-xs transition-all shadow-sm"
          title="Search Journal Pages"
        >
          <Search size={14} />
        </button>

        {/* Ambient Sounds: Rain */}
        <button
          onClick={() => handleToggleAmbient('rain')}
          className={`p-1.5 rounded-lg border text-xs transition-all shadow-sm ${
            ambientSound === 'rain'
              ? 'bg-blue-950/80 text-blue-300 border-blue-500/60 ring-1 ring-blue-400/30'
              : 'bg-stone-900/80 hover:bg-stone-800 text-stone-400 border-stone-700/60'
          }`}
          title="Toggle Ambient Rain"
        >
          <CloudRain size={14} />
        </button>

        {/* Ambient Sounds: Fireplace */}
        <button
          onClick={() => handleToggleAmbient('fireplace')}
          className={`p-1.5 rounded-lg border text-xs transition-all shadow-sm ${
            ambientSound === 'fireplace'
              ? 'bg-amber-950/80 text-amber-300 border-amber-500/60 ring-1 ring-amber-400/30'
              : 'bg-stone-900/80 hover:bg-stone-800 text-stone-400 border-stone-700/60'
          }`}
          title="Toggle Ambient Fireplace"
        >
          <Flame size={14} />
        </button>

        {/* Mute All Sounds */}
        <button
          onClick={onToggleSoundEffects}
          className={`p-1.5 rounded-lg border text-xs transition-all shadow-sm ${
            !soundEffects
              ? 'bg-red-950/50 text-red-400 border-red-800/60'
              : 'bg-stone-900/80 hover:bg-stone-800 text-stone-400 border-stone-700/60'
          }`}
          title={soundEffects ? 'Sound Effects Active' : 'Sound Effects Muted'}
        >
          {soundEffects ? <Volume2 size={14} /> : <VolumeX size={14} />}
        </button>

        {/* Desk Lighting Mood */}
        <div className="flex items-center bg-stone-900/90 rounded-lg p-0.5 border border-stone-700/60">
          <button
            onClick={() => onLightingChange('warm')}
            className={`p-1 rounded text-xs transition-colors ${
              lighting === 'warm' ? 'bg-amber-700/40 text-amber-300' : 'text-stone-400 hover:text-stone-200'
            }`}
            title="Warm Desk Lamp"
          >
            <Lamp size={13} />
          </button>
          <button
            onClick={() => onLightingChange('daylight')}
            className={`p-1 rounded text-xs transition-colors ${
              lighting === 'daylight' ? 'bg-amber-200/20 text-stone-100' : 'text-stone-400 hover:text-stone-200'
            }`}
            title="Morning Daylight"
          >
            <Sun size={13} />
          </button>
          <button
            onClick={() => onLightingChange('midnight')}
            className={`p-1 rounded text-xs transition-colors ${
              lighting === 'midnight' ? 'bg-indigo-900/60 text-indigo-300' : 'text-stone-400 hover:text-stone-200'
            }`}
            title="Midnight Candle"
          >
            <Moon size={13} />
          </button>
        </div>

        {/* Cloudflare Sync & Backup */}
        <button
          onClick={onOpenCloudSync}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-amber-600/25 hover:bg-amber-600/35 text-amber-300 border border-amber-600/40 text-xs font-medium transition-all shadow-sm"
          title="Backup & Cloud Storage Options"
        >
          <Cloud size={14} className="text-amber-400" />
          <span className="hidden sm:inline">Storage / Sync</span>
        </button>

        {/* Privacy & Security Modal Button */}
        <button
          onClick={onOpenPrivacy}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-emerald-950/60 hover:bg-emerald-900/60 text-emerald-300 border border-emerald-700/50 text-xs font-medium transition-all shadow-sm"
          title="Privacy Guarantees, Storage Audit & Erase"
        >
          <ShieldCheck size={14} className="text-emerald-400" />
          <span className="hidden lg:inline">Privacy</span>
        </button>
      </div>
    </header>
  );
};
