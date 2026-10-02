import React, { useState, useEffect, useCallback } from 'react';
import type {
  JournalPage,
  JournalSettings,
  CoverStyle,
  PaperStyle,
  FontStyle,
  LightingMode,
  AmbientSound,
  PolaroidPhoto,
  StickerItem,
  PageLayoutConfig,
} from './types/journal';
import { db, initDatabase, DEFAULT_SETTINGS, INITIAL_PAGES, createBlankPage } from './utils/db';
import { sounds } from './utils/audio';
import { JournalHeader } from './components/JournalHeader';
import { JournalToolbar } from './components/JournalToolbar';
import { JournalBook } from './components/JournalBook';
import { BookmarksSidebar } from './components/BookmarksSidebar';
import { PageSettingsModal } from './components/PageSettingsModal';
import { TableOfContentsModal } from './components/TableOfContentsModal';
import { SearchModal } from './components/SearchModal';
import { AddPhotoModal } from './components/AddPhotoModal';
import { StickerDrawerModal } from './components/StickerDrawerModal';
import { CloudflareSyncModal } from './components/CloudflareSyncModal';
import { PrivacyModal } from './components/PrivacyModal';

export const App: React.FC = () => {
  const [pages, setPages] = useState<JournalPage[]>(INITIAL_PAGES);
  const [settings, setSettings] = useState<JournalSettings>(DEFAULT_SETTINGS);
  const [currentPageIndex, setCurrentPageIndex] = useState<number>(0);
  const [activeTool, setActiveTool] = useState<'write' | 'draw' | 'photo' | 'sticker'>('write');

  // Active tools, typography & layout
  const [currentFont, setCurrentFont] = useState<FontStyle>(DEFAULT_SETTINGS.defaultFont);
  const [currentInk, setCurrentInk] = useState<string>(DEFAULT_SETTINGS.defaultInk);
  const [currentFontSize, setCurrentFontSize] = useState<number>(DEFAULT_SETTINGS.defaultFontSize);
  const [coverStyle, setCoverStyle] = useState<CoverStyle>(DEFAULT_SETTINGS.coverColor);
  const [paperStyle, setPaperStyle] = useState<PaperStyle>(DEFAULT_SETTINGS.defaultPaper);
  const [layout, setLayout] = useState<PageLayoutConfig>(DEFAULT_SETTINGS.layout);
  const [penStrokeWidth, setPenStrokeWidth] = useState<number>(DEFAULT_SETTINGS.penStrokeWidth);
  const [lighting, setLighting] = useState<LightingMode>(DEFAULT_SETTINGS.lighting);
  const [ambientSound, setAmbientSound] = useState<AmbientSound>(DEFAULT_SETTINGS.ambientSound);
  const [soundEffects, setSoundEffects] = useState<boolean>(DEFAULT_SETTINGS.soundEffects);
  const [bookmarkedPages, setBookmarkedPages] = useState<number[]>(
    DEFAULT_SETTINGS.bookmarkedPages || [1]
  );

  // Modals & Sidebars
  const [isBookmarksOpen, setIsBookmarksOpen] = useState(false);
  const [isPageSettingsOpen, setIsPageSettingsOpen] = useState(false);
  const [isIndexOpen, setIsIndexOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isPhotoModalOpen, setIsPhotoModalOpen] = useState(false);
  const [isStickerModalOpen, setIsStickerModalOpen] = useState(false);
  const [isCloudSyncOpen, setIsCloudSyncOpen] = useState(false);
  const [isPrivacyOpen, setIsPrivacyOpen] = useState(false);

  // Load from Dexie IndexedDB on mount
  useEffect(() => {
    async function loadData() {
      await initDatabase();
      const allPages = await db.pages.orderBy('pageNumber').toArray();
      if (allPages.length > 0) {
        setPages(allPages);
      }
      const savedSettings = await db.settings.get('user_settings');
      if (savedSettings) {
        setSettings(savedSettings);
        setCoverStyle(savedSettings.coverColor);
        setPaperStyle(savedSettings.defaultPaper);
        setCurrentFont(savedSettings.defaultFont);
        setCurrentInk(savedSettings.defaultInk);
        setLighting(savedSettings.lighting);
        if (savedSettings.layout) {
          setLayout(savedSettings.layout);
        }
        if (savedSettings.bookmarkedPages) {
          setBookmarkedPages(savedSettings.bookmarkedPages);
        }
        if (savedSettings.penStrokeWidth) {
          setPenStrokeWidth(savedSettings.penStrokeWidth);
        }
      }
    }
    loadData();
  }, []);

  // Save page changes to Dexie
  const handleUpdatePage = useCallback((updated: JournalPage) => {
    setPages((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
    db.pages.put(updated);
  }, []);

  // Add a new blank 2-page spread (Unlimited pages!)
  const handleAddSpread = async () => {
    sounds.playPageTurn();
    const newPageNum1 = pages.length + 1;
    const newPageNum2 = pages.length + 2;

    const newPage1 = createBlankPage(newPageNum1);
    const newPage2 = createBlankPage(newPageNum2);
    newPage1.paperStyle = paperStyle;
    newPage2.paperStyle = paperStyle;

    const updatedPages = [...pages, newPage1, newPage2];
    setPages(updatedPages);
    await db.pages.bulkAdd([newPage1, newPage2]);

    // Flip to newly created spread
    setCurrentPageIndex(newPageNum1 - 1);
  };

  // Delete current page
  const handleDeleteCurrentPage = async () => {
    if (pages.length <= 2) return;
    if (!window.confirm('Are you sure you want to tear out this page from your journal?')) return;

    sounds.playPageTurn();
    const pageToDelete = pages[currentPageIndex];
    if (!pageToDelete) return;

    await db.pages.delete(pageToDelete.id);
    const remaining = pages.filter((p) => p.id !== pageToDelete.id);

    // Re-index remaining pages
    const reindexed = remaining.map((p, idx) => ({ ...p, pageNumber: idx + 1 }));
    setPages(reindexed);
    await db.pages.clear();
    await db.pages.bulkAdd(reindexed);

    setCurrentPageIndex((prev) => Math.max(0, Math.min(prev, reindexed.length - 2)));
  };

  // Add Polaroid photo to active spread
  const handleAddPhoto = (photo: PolaroidPhoto) => {
    const targetPage = pages[currentPageIndex + 1] || pages[currentPageIndex];
    if (!targetPage) return;

    const updated = {
      ...targetPage,
      photos: [...(targetPage.photos || []), photo],
      updatedAt: Date.now(),
    };
    handleUpdatePage(updated);
  };

  // Add Sticker to active spread
  const handleAddSticker = (sticker: StickerItem) => {
    const targetPage = pages[currentPageIndex + 1] || pages[currentPageIndex];
    if (!targetPage) return;

    const updated = {
      ...targetPage,
      stickers: [...(targetPage.stickers || []), sticker],
      updatedAt: Date.now(),
    };
    handleUpdatePage(updated);
  };

  // Clear drawings on visible spread
  const handleClearDrawings = () => {
    const leftP = pages[currentPageIndex];
    const rightP = pages[currentPageIndex + 1];
    if (leftP) handleUpdatePage({ ...leftP, drawings: [] });
    if (rightP) handleUpdatePage({ ...rightP, drawings: [] });
  };

  // Turn to specific page (e.g. from Index, Bookmarks, or Search)
  const handleTurnToPageNumber = (pageNum: number) => {
    const targetIndex = pageNum % 2 === 0 ? pageNum - 2 : pageNum - 1;
    sounds.playPageTurn();
    setCurrentPageIndex(Math.max(0, Math.min(targetIndex, pages.length - 1)));
  };

  // Bookmark Toggle
  const handleToggleBookmark = (pageNum: number) => {
    setBookmarkedPages((prev) => {
      const next = prev.includes(pageNum) ? prev.filter((p) => p !== pageNum) : [...prev, pageNum];
      const updated = { ...settings, bookmarkedPages: next };
      setSettings(updated);
      db.settings.put({ ...updated, id: 'user_settings' });
      return next;
    });
  };

  // Remove single bookmark
  const handleRemoveBookmark = (pageNum: number) => {
    setBookmarkedPages((prev) => {
      const next = prev.filter((p) => p !== pageNum);
      const updated = { ...settings, bookmarkedPages: next };
      setSettings(updated);
      db.settings.put({ ...updated, id: 'user_settings' });
      return next;
    });
  };

  // Toggle Sound Effects
  const handleToggleSoundEffects = () => {
    const isMuted = sounds.toggleMute();
    setSoundEffects(!isMuted);
  };

  // Update Page Title
  const handleUpdateTitle = (pageId: string, newTitle: string) => {
    const p = pages.find((item) => item.id === pageId);
    if (p) {
      handleUpdatePage({ ...p, title: newTitle });
    }
  };

  // Update Page Layout (Row height, lines, margin, baseline)
  const handleUpdateLayout = (newLayout: PageLayoutConfig) => {
    setLayout(newLayout);
    const updated = { ...settings, layout: newLayout };
    setSettings(updated);
    db.settings.put({ ...updated, id: 'user_settings' });
  };

  // Import Backup
  const handleImportPages = async (imported: JournalPage[]) => {
    await db.pages.clear();
    await db.pages.bulkAdd(imported);
    setPages(imported);
    setCurrentPageIndex(0);
  };

  // GDPR Right to Erasure: Wipe all local data and re-initialize
  const handleWipeAllData = async () => {
    await db.pages.clear();
    await db.settings.clear();
    await initDatabase();
    const freshPages = await db.pages.orderBy('pageNumber').toArray();
    setPages(freshPages.length > 0 ? freshPages : INITIAL_PAGES);
    setSettings(DEFAULT_SETTINGS);
    setCoverStyle(DEFAULT_SETTINGS.coverColor);
    setPaperStyle(DEFAULT_SETTINGS.defaultPaper);
    setCurrentFont(DEFAULT_SETTINGS.defaultFont);
    setCurrentInk(DEFAULT_SETTINGS.defaultInk);
    setLighting(DEFAULT_SETTINGS.lighting);
    setLayout(DEFAULT_SETTINGS.layout);
    setBookmarkedPages([1]);
    setCurrentPageIndex(0);
  };

  // Desk background based on lighting mode
  const deskLightingStyle =
    lighting === 'warm' ? 'wood-desk' : lighting === 'daylight' ? 'bg-[#2d241e]' : 'bg-[#0f0d0c]';

  return (
    <div
      className={`relative min-h-screen flex flex-col justify-between overflow-x-hidden ${deskLightingStyle} transition-colors duration-700`}
    >
      {/* Warm Ambient Spotlight / Desk Lamp Glow */}
      {lighting === 'warm' && (
        <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_50%_45%,rgba(255,200,120,0.12)_0%,rgba(0,0,0,0.6)_80%)]" />
      )}
      {lighting === 'midnight' && (
        <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_50%_45%,rgba(200,180,255,0.05)_0%,rgba(0,0,0,0.85)_80%)]" />
      )}

      {/* Top Header */}
      <JournalHeader
        lighting={lighting}
        onLightingChange={(mode) => {
          setLighting(mode);
          db.settings.put({ ...settings, lighting: mode, id: 'user_settings' });
        }}
        ambientSound={ambientSound}
        onAmbientSoundChange={setAmbientSound}
        soundEffects={soundEffects}
        onToggleSoundEffects={handleToggleSoundEffects}
        bookmarkedCount={bookmarkedPages.length}
        onOpenBookmarks={() => setIsBookmarksOpen(true)}
        onOpenPageSettings={() => setIsPageSettingsOpen(true)}
        onOpenIndex={() => setIsIndexOpen(true)}
        onOpenSearch={() => setIsSearchOpen(true)}
        onOpenCloudSync={() => setIsCloudSyncOpen(true)}
        onOpenPrivacy={() => setIsPrivacyOpen(true)}
      />

      {/* Centerpiece: The Realistic Physical Book */}
      <main className="flex-1 flex items-center justify-center py-3 sm:py-6 relative z-10 w-full">
        <JournalBook
          pages={pages}
          currentPageIndex={currentPageIndex}
          coverStyle={coverStyle}
          activeTool={activeTool}
          currentFont={currentFont}
          currentInk={currentInk}
          currentFontSize={currentFontSize}
          layout={layout}
          penStrokeWidth={penStrokeWidth}
          bookmarkedPages={bookmarkedPages}
          onTurnPage={setCurrentPageIndex}
          onUpdatePage={handleUpdatePage}
          onToggleBookmark={handleToggleBookmark}
          onOpenBookmarksSidebar={() => setIsBookmarksOpen(true)}
          onAddSpread={handleAddSpread}
        />
      </main>

      {/* Bottom Floating / Docked Toolbar */}
      <JournalToolbar
        activeTool={activeTool}
        onSelectTool={setActiveTool}
        currentFont={currentFont}
        onFontChange={setCurrentFont}
        currentInk={currentInk}
        onInkChange={setCurrentInk}
        currentFontSize={currentFontSize}
        onFontSizeChange={setCurrentFontSize}
        penStrokeWidth={penStrokeWidth}
        onPenStrokeWidthChange={(w) => {
          setPenStrokeWidth(w);
          db.settings.put({ ...settings, penStrokeWidth: w, id: 'user_settings' });
        }}
        onClearDrawings={handleClearDrawings}
        coverStyle={coverStyle}
        onCoverStyleChange={(c) => {
          setCoverStyle(c);
          db.settings.put({ ...settings, coverColor: c, id: 'user_settings' });
        }}
        currentPageIndex={currentPageIndex}
        totalPages={pages.length}
        onPrevPage={() => {
          if (currentPageIndex > 0) {
            sounds.playPageTurn();
            setCurrentPageIndex(currentPageIndex - 2);
          }
        }}
        onNextPage={() => {
          if (currentPageIndex + 2 < pages.length) {
            sounds.playPageTurn();
            setCurrentPageIndex(currentPageIndex + 2);
          } else {
            handleAddSpread();
          }
        }}
        onAddSpread={handleAddSpread}
        onDeleteCurrentPage={handleDeleteCurrentPage}
        onOpenPhotoModal={() => setIsPhotoModalOpen(true)}
        onOpenStickerModal={() => setIsStickerModalOpen(true)}
        onOpenPageSettings={() => setIsPageSettingsOpen(true)}
      />

      {/* Bookmarks Side Panel */}
      <BookmarksSidebar
        isOpen={isBookmarksOpen}
        onClose={() => setIsBookmarksOpen(false)}
        pages={pages}
        bookmarkedPageNumbers={bookmarkedPages}
        onSelectPage={handleTurnToPageNumber}
        onRemoveBookmark={handleRemoveBookmark}
      />

      {/* Page & Ruled Lines Customization Modal */}
      <PageSettingsModal
        isOpen={isPageSettingsOpen}
        onClose={() => setIsPageSettingsOpen(false)}
        layout={layout}
        onUpdateLayout={handleUpdateLayout}
        paperStyle={paperStyle}
        onPaperStyleChange={(p) => {
          setPaperStyle(p);
          const leftP = pages[currentPageIndex];
          const rightP = pages[currentPageIndex + 1];
          if (leftP) handleUpdatePage({ ...leftP, paperStyle: p });
          if (rightP) handleUpdatePage({ ...rightP, paperStyle: p });
          db.settings.put({ ...settings, defaultPaper: p, id: 'user_settings' });
        }}
      />

      {/* Table of Contents Modal */}
      <TableOfContentsModal
        isOpen={isIndexOpen}
        onClose={() => setIsIndexOpen(false)}
        pages={pages}
        onSelectPage={handleTurnToPageNumber}
        onUpdateTitle={handleUpdateTitle}
      />

      {/* Search Modal */}
      <SearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        pages={pages}
        onSelectPage={handleTurnToPageNumber}
      />

      {/* Add Polaroid Photo Modal */}
      <AddPhotoModal
        isOpen={isPhotoModalOpen}
        onClose={() => setIsPhotoModalOpen(false)}
        onAddPhoto={handleAddPhoto}
      />

      {/* Sticker Drawer Modal */}
      <StickerDrawerModal
        isOpen={isStickerModalOpen}
        onClose={() => setIsStickerModalOpen(false)}
        onAddSticker={handleAddSticker}
      />

      {/* Local & Cloudflare Storage Modal */}
      <CloudflareSyncModal
        isOpen={isCloudSyncOpen}
        onClose={() => setIsCloudSyncOpen(false)}
        pages={pages}
        settings={settings}
        onImportPages={handleImportPages}
        onUpdateSettings={(updated) => {
          setSettings(updated);
          db.settings.put({ ...updated, id: 'user_settings' });
        }}
      />

      {/* Privacy & Security Modal */}
      <PrivacyModal
        isOpen={isPrivacyOpen}
        onClose={() => setIsPrivacyOpen(false)}
        pages={pages}
        settings={settings}
        onWipeAllData={handleWipeAllData}
      />
    </div>
  );
};

export default App;
