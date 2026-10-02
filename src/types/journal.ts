export type PaperStyle = 'lined' | 'parchment' | 'ivory' | 'dots' | 'blank';
export type CoverStyle = 'dark' | 'cognac' | 'emerald';
export type FontStyle = 'handwriting' | 'casual' | 'script' | 'typewriter' | 'serif' | 'signature';
export type LightingMode = 'warm' | 'daylight' | 'midnight';
export type AmbientSound = 'none' | 'rain' | 'fireplace';

export interface TextBlock {
  id: string;
  x?: number; // percentage (0 - 100) or pixel left
  y?: number; // percentage (0 - 100) or pixel top
  rowIndex?: number; // Which lined paper row (0-indexed) this block starts on
  text: string;
  fontStyle?: FontStyle;
  inkColor?: string;
  fontSize?: number;
  rotation?: number;
  isFullWidth?: boolean; // If true, spans full width between margins
}

export interface DrawingPoint {
  x: number;
  y: number;
  pressure?: number; // 0.0 - 1.0 for graphics tablet / stylus pressure sensitivity
}

export interface DrawingPath {
  id: string;
  points: DrawingPoint[];
  color: string;
  width: number;
  isEraser?: boolean;
}

export interface PolaroidPhoto {
  id: string;
  x: number; // percentage (0 - 100)
  y: number; // percentage (0 - 100)
  imageUrl: string;
  caption: string;
  rotation: number;
}

export interface StickerItem {
  id: string;
  x: number;
  y: number;
  type: 'wax-seal' | 'postage-stamp' | 'dried-leaf' | 'pressed-flower' | 'coffee-ring' | 'star';
  rotation: number;
}

export interface PageLayoutConfig {
  lineHeight: number; // in pixels, e.g. 32
  lineColor: string; // e.g. '#cfd9e8'
  lineOpacity: number; // 0.0 to 1.0
  showMargin: boolean;
  marginLeft: number; // in pixels, e.g. 48
  baselineOffset: number; // in pixels for fine-tuning text alignment onto lines
}

export interface JournalPage {
  id: string;
  pageNumber: number;
  title: string;
  date: string;
  textBlocks: TextBlock[];
  drawings: DrawingPath[];
  photos: PolaroidPhoto[];
  stickers: StickerItem[];
  paperStyle?: PaperStyle;
  layout?: Partial<PageLayoutConfig>;
  isBookmarked?: boolean;
  updatedAt: number;
}

export interface JournalSettings {
  coverColor: CoverStyle;
  defaultPaper: PaperStyle;
  defaultFont: FontStyle;
  defaultInk: string;
  defaultFontSize: number;
  snapToLines: boolean;
  lighting: LightingMode;
  ambientSound: AmbientSound;
  soundEffects: boolean;
  typingSound: boolean;
  bookmarkedPages: number[];
  layout: PageLayoutConfig;
  penStrokeWidth: number;
  syncPasskey?: string;
}
