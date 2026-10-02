import React, { useState } from 'react';
import { X, ImagePlus, Upload, Sparkles, Loader2 } from 'lucide-react';
import type { PolaroidPhoto } from '../types/journal';
import { compressImage } from '../utils/imageCompressor';

interface AddPhotoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddPhoto: (photo: PolaroidPhoto) => void;
}

const PRESET_PHOTOS = [
  {
    name: 'Misty Mountains',
    url: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=600&q=80',
    caption: 'Misty Morning Reflection',
  },
  {
    name: 'Coffee & Books',
    url: 'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?auto=format&fit=crop&w=600&q=80',
    caption: 'Quiet Morning Brew',
  },
  {
    name: 'Forest Cabin',
    url: 'https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=600&q=80',
    caption: 'Among the Pines',
  },
  {
    name: 'Golden Coast',
    url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=600&q=80',
    caption: 'Golden Ocean Hour',
  },
];

export const AddPhotoModal: React.FC<AddPhotoModalProps> = ({ isOpen, onClose, onAddPhoto }) => {
  const [imageUrl, setImageUrl] = useState('');
  const [caption, setCaption] = useState('');
  const [isCompressing, setIsCompressing] = useState(false);

  if (!isOpen) return null;

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        setIsCompressing(true);
        const compressed = await compressImage(file, 1024, 1024, 0.82);
        setImageUrl(compressed);
      } catch (err) {
        console.error('Image compression failed:', err);
      } finally {
        setIsCompressing(false);
      }
    }
  };

  const handleInsert = async (urlToUse?: string, captionToUse?: string) => {
    const finalUrl = (urlToUse || imageUrl).trim();
    if (!finalUrl) return;

    // Strict URL validation: strictly require https:// (or http://) or data:image/
    const isDataImage = /^data:image\/(jpeg|png|webp|gif|avif);base64,/i.test(finalUrl);
    const isHttpUrl = /^https?:\/\//i.test(finalUrl);

    if (!isDataImage && !isHttpUrl) {
      alert('Security Notice: Only secure image URLs (https://) or image files are permitted.');
      return;
    }

    try {
      setIsCompressing(true);
      // Ensure image is compressed even if it's an external URL
      let processedUrl = finalUrl;
      if (finalUrl.startsWith('data:image')) {
        processedUrl = finalUrl;
      } else {
        try {
          processedUrl = await compressImage(finalUrl, 1024, 1024, 0.82);
        } catch {
          processedUrl = finalUrl; // fallback if CORS restricts canvas drawing
        }
      }

      const newPhoto: PolaroidPhoto = {
        id: 'ph-' + Date.now(),
        x: 30 + Math.random() * 25,
        y: 20 + Math.random() * 25,
        imageUrl: processedUrl,
        caption: captionToUse !== undefined ? captionToUse : caption,
        rotation: Math.round(Math.random() * 10 - 5), // slight authentic tilt (-5 to +5 deg)
      };

      onAddPhoto(newPhoto);
      setImageUrl('');
      setCaption('');
      onClose();
    } finally {
      setIsCompressing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-lg bg-stone-900 border border-stone-700/80 rounded-2xl shadow-2xl p-6">
        <div className="flex items-center justify-between pb-3 border-b border-stone-800">
          <div className="flex items-center gap-2 text-stone-100 font-serif-title font-semibold text-lg">
            <ImagePlus size={18} className="text-amber-500" />
            <span>Pin Polaroid Photo to Journal</span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-stone-400 hover:text-stone-100 hover:bg-stone-800 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Curated Presets */}
        <div className="mt-4">
          <label className="text-xs font-semibold text-stone-300 uppercase tracking-wider block mb-2">
            Curated Keepsake Presets
          </label>
          <div className="grid grid-cols-4 gap-2">
            {PRESET_PHOTOS.map((preset) => (
              <button
                key={preset.name}
                type="button"
                onClick={() => handleInsert(preset.url, preset.caption)}
                className="group relative rounded-lg overflow-hidden aspect-[4/3] border border-stone-700 hover:border-amber-500 focus:outline-none transition-all shadow"
              >
                <img
                  src={preset.url}
                  alt={preset.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                />
                <span className="absolute inset-0 bg-black/40 group-hover:bg-black/10 transition-colors flex items-end p-1">
                  <span className="text-[10px] text-white font-medium truncate">{preset.name}</span>
                </span>
              </button>
            ))}
          </div>
        </div>

        <div className="my-4 flex items-center gap-2">
          <div className="flex-1 h-[1px] bg-stone-800" />
          <span className="text-xs text-stone-500 uppercase tracking-widest">or upload your photo</span>
          <div className="flex-1 h-[1px] bg-stone-800" />
        </div>

        {/* Upload File with auto-compression */}
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-stone-300 mb-1">
              Upload from Computer or Phone (Auto-Optimized)
            </label>
            <label className="flex items-center justify-center gap-2 px-3 py-3 rounded-xl border border-dashed border-stone-700 hover:border-amber-500/70 bg-stone-950/60 cursor-pointer text-stone-300 hover:text-amber-200 transition-colors text-xs font-medium">
              {isCompressing ? (
                <>
                  <Loader2 size={16} className="animate-spin text-amber-500" />
                  <span>Optimizing photo size...</span>
                </>
              ) : (
                <>
                  <Upload size={16} className="text-amber-500" />
                  <span>Choose Image File (JPG, PNG, HEIC)</span>
                </>
              )}
              <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
            </label>
          </div>

          {/* Image Preview if chosen */}
          {imageUrl && (
            <div className="flex items-center gap-3 p-2 bg-stone-950 rounded-lg border border-stone-800">
              <img src={imageUrl} alt="Preview" className="w-12 h-12 object-cover rounded" />
              <div className="text-xs text-emerald-400 font-mono">
                ✓ Photo optimized and ready to pin
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-stone-300 mb-1">Or Paste Image URL</label>
            <input
              type="url"
              value={imageUrl.startsWith('data:') ? '' : imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="https://images.unsplash.com/..."
              className="w-full bg-stone-950 border border-stone-700 rounded-lg px-3 py-2 text-stone-200 text-xs outline-none focus:border-amber-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-stone-300 mb-1">
              Handwritten Polaroid Caption (Optional)
            </label>
            <input
              type="text"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="e.g. A quiet afternoon in the mountains"
              className="w-full bg-stone-950 border border-stone-700 rounded-lg px-3 py-2 text-stone-200 text-xs outline-none focus:border-amber-500 font-handwriting text-base"
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-5 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-3 py-1.5 rounded-lg text-stone-400 hover:text-stone-200 text-xs font-medium"
          >
            Cancel
          </button>
          <button
            onClick={() => handleInsert()}
            disabled={!imageUrl.trim() || isCompressing}
            className="px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-500 disabled:opacity-40 text-white text-xs font-medium shadow-md transition-colors flex items-center gap-1.5"
          >
            {isCompressing ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
            <span>Pin Polaroid to Page</span>
          </button>
        </div>
      </div>
    </div>
  );
};
