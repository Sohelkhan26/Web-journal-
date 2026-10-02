import Dexie, { type Table } from 'dexie';
import type { JournalPage, JournalSettings, PageLayoutConfig } from '../types/journal';

export class JournalDatabase extends Dexie {
  pages!: Table<JournalPage, string>;
  settings!: Table<JournalSettings & { id: string }, string>;

  constructor() {
    super('RealJournalDB');
    this.version(2).stores({
      pages: 'id, pageNumber, updatedAt',
      settings: 'id',
    });
  }
}

export const db = new JournalDatabase();

export const DEFAULT_LAYOUT: PageLayoutConfig = {
  lineHeight: 32, // standard ruled row height
  lineColor: '#cfd9e8',
  lineOpacity: 0.75,
  showMargin: true,
  marginLeft: 48,
  baselineOffset: 0, // fine-tuning offset in px
};

export const DEFAULT_SETTINGS: JournalSettings = {
  coverColor: 'cognac',
  defaultPaper: 'lined',
  defaultFont: 'handwriting',
  defaultInk: '#1e293b', // Deep midnight blue ink
  defaultFontSize: 22,
  snapToLines: true,
  lighting: 'warm',
  ambientSound: 'none',
  soundEffects: true,
  typingSound: true,
  bookmarkedPages: [1],
  layout: DEFAULT_LAYOUT,
  penStrokeWidth: 2.5,
};

// Generates a clean, blank journal page
export function createBlankPage(pageNumber: number, dateStr?: string): JournalPage {
  const date =
    dateStr ||
    new Date().toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });

  return {
    id: `page-${pageNumber}-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
    pageNumber,
    title: pageNumber === 1 ? 'Title Page' : `Entry #${pageNumber}`,
    date,
    textBlocks: [],
    drawings: [],
    photos: [],
    stickers: [],
    paperStyle: 'lined',
    isBookmarked: false,
    updatedAt: Date.now(),
  };
}

// Initial pages: Instructions ONLY on the front page (Page 1).
// All other pages are clean, blank, and completely writable.
export const INITIAL_PAGES: JournalPage[] = [
  {
    id: 'page-1',
    pageNumber: 1,
    title: 'Front Page & Instructions',
    date: new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
    paperStyle: 'parchment',
    isBookmarked: true,
    textBlocks: [
      {
        id: 'tb-title',
        x: 18,
        y: 18,
        text: 'Chronicle: A Tactile Journal',
        fontStyle: 'serif',
        fontSize: 32,
        inkColor: '#3a2012',
      },
      {
        id: 'tb-sub',
        x: 18,
        y: 30,
        text: 'Private thoughts, slow moments, and sketches.',
        fontStyle: 'handwriting',
        fontSize: 22,
        inkColor: '#5c3a21',
      },
      {
        id: 'tb-instructions',
        x: 16,
        y: 45,
        text: '— HOW TO USE THIS JOURNAL —\n' +
              '• Click anywhere on any line on either page to begin writing immediately.\n' +
              '• Your writing covers the full page width and aligns directly on each row.\n' +
              '• Turn pages by clicking the corner peels, bottom arrows, or keyboard ← / →.\n' +
              '• Switch to the Sketch tool to draw or write freely with a mouse or graphics pad.\n' +
              '• Customize row count, line spacing, margins, and paper in Page Settings.\n' +
              '• Bookmark any page with the ribbon and view your Bookmarks list on the side.',
        fontStyle: 'handwriting',
        fontSize: 20,
        inkColor: '#1e293b',
      },
      {
        id: 'tb-sign',
        x: 18,
        y: 82,
        text: 'Turn to the next page to begin your first entry...',
        fontStyle: 'signature',
        fontSize: 20,
        inkColor: '#881337',
      },
    ],
    drawings: [],
    photos: [],
    stickers: [
      {
        id: 'st-seal',
        x: 75,
        y: 78,
        type: 'wax-seal',
        rotation: 6,
      },
    ],
    updatedAt: Date.now(),
  },
  // Clean, blank pages ready for user's writing
  createBlankPage(2),
  createBlankPage(3),
  createBlankPage(4),
  createBlankPage(5),
  createBlankPage(6),
  createBlankPage(7),
  createBlankPage(8),
  createBlankPage(9),
  createBlankPage(10),
];

export async function initDatabase() {
  const pageCount = await db.pages.count();
  if (pageCount === 0) {
    await db.pages.bulkAdd(INITIAL_PAGES);
  }

  const settings = await db.settings.get('user_settings');
  if (!settings) {
    await db.settings.put({ ...DEFAULT_SETTINGS, id: 'user_settings' });
  } else {
    // Migration: ensure layout and bookmarkedPages exist
    if (!settings.layout) {
      settings.layout = DEFAULT_LAYOUT;
      await db.settings.put(settings);
    }
    if (!settings.bookmarkedPages) {
      settings.bookmarkedPages = [1];
      await db.settings.put(settings);
    }
  }
}
