import React, { useState } from 'react';
import {
  X,
  ShieldCheck,
  Lock,
  Database,
  Trash2,
  Download,
  AlertTriangle,
  FileText,
  CheckCircle2,
  ExternalLink,
} from 'lucide-react';
import type { JournalPage, JournalSettings } from '../types/journal';

interface PrivacyModalProps {
  isOpen: boolean;
  onClose: () => void;
  pages: JournalPage[];
  settings: JournalSettings;
  onWipeAllData: () => Promise<void>;
}

export const PrivacyModal: React.FC<PrivacyModalProps> = ({
  isOpen,
  onClose,
  pages,
  settings,
  onWipeAllData,
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'audit' | 'policy'>('overview');
  const [showWipeConfirm, setShowWipeConfirm] = useState(false);
  const [wipeConfirmText, setWipeConfirmText] = useState('');
  const [isWiping, setIsWiping] = useState(false);

  if (!isOpen) return null;

  // Approximate storage calculation
  const totalJsonBytes = new Blob([JSON.stringify({ pages, settings })]).size;
  const storageFormatted =
    totalJsonBytes > 1024 * 1024
      ? `${(totalJsonBytes / (1024 * 1024)).toFixed(2)} MB`
      : `${(totalJsonBytes / 1024).toFixed(1)} KB`;

  const totalPhotos = pages.reduce((acc, p) => acc + (p.photos?.length || 0), 0);
  const totalDrawings = pages.reduce((acc, p) => acc + (p.drawings?.length || 0), 0);
  const totalWords = pages.reduce(
    (acc, p) =>
      acc +
      (p.textBlocks?.reduce(
        (sum, b) => sum + (b.text ? b.text.trim().split(/\s+/).length : 0),
        0
      ) || 0),
    0
  );

  const handleExportJSON = () => {
    const backupData = {
      version: 2,
      appName: 'Chronicle Journal',
      exportedAt: new Date().toISOString(),
      settings,
      pages,
    };

    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `chronicle-journal-export-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleConfirmWipe = async () => {
    if (wipeConfirmText.trim().toUpperCase() !== 'DELETE') return;
    setIsWiping(true);
    try {
      await onWipeAllData();
      setShowWipeConfirm(false);
      onClose();
    } finally {
      setIsWiping(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-2xl bg-stone-900 border border-stone-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-stone-800 bg-stone-950/60">
          <div className="flex items-center gap-2.5 text-stone-100 font-serif-title font-semibold text-lg">
            <div className="p-1.5 rounded-lg bg-emerald-950 border border-emerald-700/50 text-emerald-400">
              <ShieldCheck size={20} />
            </div>
            <div>
              <span>Privacy & Security Center</span>
              <p className="text-[11px] font-sans font-normal text-stone-400">
                Your private thoughts, completely under your own control
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-stone-400 hover:text-stone-100 hover:bg-stone-800 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-stone-800 bg-stone-950/30 px-5 gap-4">
          <button
            onClick={() => setActiveTab('overview')}
            className={`py-3 text-xs font-medium border-b-2 transition-all ${
              activeTab === 'overview'
                ? 'border-amber-500 text-amber-300'
                : 'border-transparent text-stone-400 hover:text-stone-200'
            }`}
          >
            Privacy Guarantees
          </button>
          <button
            onClick={() => setActiveTab('audit')}
            className={`py-3 text-xs font-medium border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'audit'
                ? 'border-amber-500 text-amber-300'
                : 'border-transparent text-stone-400 hover:text-stone-200'
            }`}
          >
            <Database size={13} />
            <span>Data Storage & Erasure</span>
          </button>
          <button
            onClick={() => setActiveTab('policy')}
            className={`py-3 text-xs font-medium border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'policy'
                ? 'border-amber-500 text-amber-300'
                : 'border-transparent text-stone-400 hover:text-stone-200'
            }`}
          >
            <FileText size={13} />
            <span>Privacy Policy</span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-6 overflow-y-auto space-y-5 text-stone-300 text-xs">
          {activeTab === 'overview' && (
            <div className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-3">
                <div className="p-3.5 rounded-xl bg-stone-950/70 border border-stone-800 space-y-1.5">
                  <div className="flex items-center gap-2 text-emerald-400 font-semibold">
                    <CheckCircle2 size={16} />
                    <span>Local-First Architecture</span>
                  </div>
                  <p className="text-stone-400 leading-relaxed text-[11px]">
                    By default, 100% of your journal entries, handwriting, sketches, and photos are
                    persisted in your browser’s sandboxed IndexedDB database.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-stone-950/70 border border-stone-800 space-y-1.5">
                  <div className="flex items-center gap-2 text-emerald-400 font-semibold">
                    <Lock size={16} />
                    <span>Zero Trackers or Telemetry</span>
                  </div>
                  <p className="text-stone-400 leading-relaxed text-[11px]">
                    Chronicle contains no advertising cookies, third-party analytics trackers, or
                    behavioral profiling scripts. Your activity is never monitored.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-stone-950/70 border border-stone-800 space-y-1.5">
                  <div className="flex items-center gap-2 text-amber-400 font-semibold">
                    <Database size={16} />
                    <span>Client-Side Photo Compression</span>
                  </div>
                  <p className="text-stone-400 leading-relaxed text-[11px]">
                    Photos you attach are resized and compressed locally on your device before saving,
                    ensuring minimal storage footprint and zero uncompressed leakage.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-stone-950/70 border border-stone-800 space-y-1.5">
                  <div className="flex items-center gap-2 text-amber-400 font-semibold">
                    <ShieldCheck size={16} />
                    <span>Edge Security Protected</span>
                  </div>
                  <p className="text-stone-400 leading-relaxed text-[11px]">
                    The website is protected by strict Content-Security-Policy (CSP), HSTS, edge rate
                    limiting, and request size caps to stop abuse and injection attacks.
                  </p>
                </div>
              </div>

              {/* Cloud Sync Disclosure */}
              <div className="p-4 rounded-xl bg-stone-950/90 border border-stone-800 space-y-2">
                <div className="font-semibold text-stone-200 flex items-center gap-2">
                  <ExternalLink size={14} className="text-amber-400" />
                  <span>Cloudflare Sync Data Isolation</span>
                </div>
                <p className="text-stone-400 text-[11px] leading-relaxed">
                  If you opt in to Cloudflare Edge synchronization, you can provide a private Sync
                  Passkey. The edge function derives a cryptographic hash of your passkey to isolate
                  your journal entries from any other user or database viewer. Entries are never
                  accessible without your authorization passkey.
                </p>
              </div>
            </div>
          )}

          {activeTab === 'audit' && (
            <div className="space-y-4">
              {/* Storage breakdown */}
              <div className="p-4 rounded-xl bg-stone-950/80 border border-stone-800 space-y-3">
                <div className="text-stone-200 font-semibold flex items-center justify-between">
                  <span>Current Device Footprint</span>
                  <span className="font-mono text-amber-400 bg-stone-900 px-2 py-0.5 rounded border border-stone-800">
                    ~{storageFormatted}
                  </span>
                </div>
                <div className="grid grid-cols-4 gap-2 text-center pt-2 border-t border-stone-800/80">
                  <div className="p-2 bg-stone-900/70 rounded-lg">
                    <div className="font-bold text-stone-200 text-sm">{pages.length}</div>
                    <div className="text-[10px] text-stone-500 uppercase">Pages</div>
                  </div>
                  <div className="p-2 bg-stone-900/70 rounded-lg">
                    <div className="font-bold text-stone-200 text-sm">{totalWords}</div>
                    <div className="text-[10px] text-stone-500 uppercase">Words</div>
                  </div>
                  <div className="p-2 bg-stone-900/70 rounded-lg">
                    <div className="font-bold text-stone-200 text-sm">{totalPhotos}</div>
                    <div className="text-[10px] text-stone-500 uppercase">Photos</div>
                  </div>
                  <div className="p-2 bg-stone-900/70 rounded-lg">
                    <div className="font-bold text-stone-200 text-sm">{totalDrawings}</div>
                    <div className="text-[10px] text-stone-500 uppercase">Sketches</div>
                  </div>
                </div>
              </div>

              {/* Data Portability (Export) */}
              <div className="p-4 rounded-xl bg-stone-950/80 border border-stone-800 flex items-center justify-between">
                <div>
                  <div className="font-semibold text-stone-200">Export Your Entire Journal</div>
                  <div className="text-[11px] text-stone-400">
                    Download full copy of your entries in standard JSON format (GDPR Portability).
                  </div>
                </div>
                <button
                  onClick={handleExportJSON}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-medium border border-stone-600/70 transition-colors shadow"
                >
                  <Download size={13} className="text-amber-400" />
                  <span>Export JSON</span>
                </button>
              </div>

              {/* GDPR Right to Erasure / Danger Zone */}
              <div className="p-4 rounded-xl bg-red-950/20 border border-red-900/40 space-y-3">
                <div className="flex items-center gap-2 text-red-400 font-semibold">
                  <AlertTriangle size={16} />
                  <span>Right to Erasure (Wipe All Journal Data)</span>
                </div>
                <p className="text-stone-400 text-[11px] leading-relaxed">
                  Permanently deletes all pages, handwriting, sketches, photos, and settings from
                  this browser’s IndexedDB storage. This action cannot be undone unless you have an
                  exported backup file.
                </p>

                {!showWipeConfirm ? (
                  <button
                    onClick={() => setShowWipeConfirm(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-900/40 hover:bg-red-900/70 text-red-200 text-xs font-medium border border-red-800/60 transition-colors"
                  >
                    <Trash2 size={13} />
                    <span>Erase All Data on Device</span>
                  </button>
                ) : (
                  <div className="p-3 rounded-lg bg-red-950/50 border border-red-800/60 space-y-2 animate-fade-in">
                    <p className="text-xs text-red-200 font-medium">
                      To confirm permanent deletion, type <span className="font-mono font-bold text-white">DELETE</span> below:
                    </p>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={wipeConfirmText}
                        onChange={(e) => setWipeConfirmText(e.target.value)}
                        placeholder="Type DELETE"
                        className="bg-stone-950 border border-red-700/80 rounded-lg px-2.5 py-1.5 text-xs text-white uppercase tracking-widest outline-none focus:border-red-500 font-mono"
                      />
                      <button
                        onClick={handleConfirmWipe}
                        disabled={wipeConfirmText.trim().toUpperCase() !== 'DELETE' || isWiping}
                        className="px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 disabled:opacity-40 text-white text-xs font-semibold transition-colors"
                      >
                        {isWiping ? 'Erasing...' : 'Confirm Wipe'}
                      </button>
                      <button
                        onClick={() => {
                          setShowWipeConfirm(false);
                          setWipeConfirmText('');
                        }}
                        className="px-2.5 py-1.5 text-stone-400 hover:text-stone-200 text-xs"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'policy' && (
            <div className="space-y-3.5 pr-1">
              <h3 className="font-serif-title text-base font-semibold text-stone-100">
                Chronicle Privacy Policy
              </h3>
              <p className="text-stone-400 text-[11px] leading-relaxed">
                Last updated: October 2026. Chronicle is designed on the foundational premise that
                private journals belong exclusively to the author.
              </p>

              <div className="space-y-2 border-t border-stone-800 pt-3">
                <h4 className="font-medium text-stone-200">1. Data Storage & Ownership</h4>
                <p className="text-stone-400 text-[11px] leading-relaxed">
                  All journal content, settings, and media are stored locally in your browser using
                  the IndexedDB API. The creators of Chronicle have no access to your journal entries.
                  You own 100% of your data at all times.
                </p>
              </div>

              <div className="space-y-2 border-t border-stone-800 pt-3">
                <h4 className="font-medium text-stone-200">2. Cloud Synchronization</h4>
                <p className="text-stone-400 text-[11px] leading-relaxed">
                  When you initiate synchronization with a Cloudflare D1 database, your entries are
                  transmitted over encrypted HTTPS to Cloudflare edge nodes. The server enforces
                  partitioning via your authorization passkey. Cloudflare does not use your journal
                  data for model training or marketing.
                </p>
              </div>

              <div className="space-y-2 border-t border-stone-800 pt-3">
                <h4 className="font-medium text-stone-200">3. Cookies & Analytics</h4>
                <p className="text-stone-400 text-[11px] leading-relaxed">
                  Chronicle does not set tracking cookies, session cookies, or third-party marketing
                  identifiers. We do not use Google Analytics, Meta Pixel, or any behavioral telemetry.
                </p>
              </div>

              <div className="space-y-2 border-t border-stone-800 pt-3">
                <h4 className="font-medium text-stone-200">4. Compliance & User Rights</h4>
                <p className="text-stone-400 text-[11px] leading-relaxed">
                  Under the European Union General Data Protection Regulation (GDPR) and California
                  Consumer Privacy Act (CCPA), you retain the unrestricted right to access, export
                  (portability), and immediately erase all information directly through the in-app
                  Data Storage & Erasure tab.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-stone-800 bg-stone-950/60 flex items-center justify-between text-[11px] text-stone-400">
          <span className="flex items-center gap-1.5">
            <ShieldCheck size={14} className="text-emerald-400" />
            <span>End-to-End Privacy Guaranteed</span>
          </span>
          <button
            onClick={onClose}
            className="px-3 py-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-200 font-medium transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
