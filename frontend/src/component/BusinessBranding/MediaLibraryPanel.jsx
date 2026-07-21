import React, { useRef, useState } from 'react';
import { ImagePlus, Loader2, Upload } from 'lucide-react';
import { normalizePostImageUrl } from '../../services/api';
import { clearWjsMediaDragPayload, setWjsMediaDragPayload } from '../../utils/wjsMediaDragStore';

const MIME_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];

export default function MediaLibraryPanel({
  assets = [],
  onUpload,
  uploading = false,
}) {
  const inputRef = useRef(null);
  const [dragOver, setDragOver] = useState(false);

  const handleFiles = async (files) => {
    const list = [...files].filter((f) => MIME_TYPES.includes(f.type));
    if (!list.length) {
      window.alert('Chỉ hỗ trợ ảnh JPG, PNG, GIF, WEBP.');
      return;
    }
    for (const file of list) {
      await onUpload?.(file);
    }
  };

  const onDragStartMedia = (e, asset) => {
    const store = asset.key || asset.url;
    setWjsMediaDragPayload(store);
    e.dataTransfer.setData('text/plain', store);
    e.dataTransfer.setData('application/x-wjs-media-url', store);
    e.dataTransfer.setData('application/x-wjs-media-preview', asset.url || normalizePostImageUrl(store));
    e.dataTransfer.effectAllowed = 'copy';
  };

  const onDragEndMedia = () => {
    clearWjsMediaDragPayload();
  };

  return (
    <div className="border-t border-slate-200 pt-3 mt-3">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] font-bold text-slate-500 uppercase">Thư viện media</span>
        <button
          type="button"
          disabled={uploading}
          onClick={() => inputRef.current?.click()}
          className="flex items-center gap-1 text-[10px] text-blue-600 font-semibold disabled:opacity-50"
        >
          {uploading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Upload className="w-3 h-3" />}
          Tải lên
        </button>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/gif,image/webp"
        multiple
        className="hidden"
        onChange={(e) => {
          handleFiles(e.target.files || []);
          e.target.value = '';
        }}
      />

      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          handleFiles(e.dataTransfer.files || []);
        }}
        onClick={() => inputRef.current?.click()}
        className={`mb-2 border-2 border-dashed rounded-lg p-3 text-center cursor-pointer transition-colors ${
          dragOver ? 'border-blue-400 bg-blue-50' : 'border-slate-200 hover:border-blue-300 hover:bg-slate-50'
        }`}
      >
        <ImagePlus className="w-5 h-5 mx-auto text-slate-400 mb-1" />
        <p className="text-[10px] text-slate-500">Kéo thả ảnh vào đây hoặc click để tải lên</p>
      </div>

      <p className="text-[9px] text-slate-400 mb-2 leading-relaxed">
        Kéo ảnh từ thư viện thả vào vùng ảnh trên preview để thay thế.
      </p>

      {assets.length === 0 ? (
        <p className="text-[10px] text-slate-400 text-center py-2">Chưa có ảnh nào</p>
      ) : (
        <div className="grid grid-cols-3 gap-1.5 max-h-40 overflow-y-auto">
          {assets.map((asset) => {
            const preview = asset.url || normalizePostImageUrl(asset.key);
            return (
              <div
                key={asset.id || asset.key}
                draggable
                onDragStart={(e) => onDragStartMedia(e, asset)}
                onDragEnd={onDragEndMedia}
                className="relative aspect-square rounded border border-slate-200 overflow-hidden cursor-grab active:cursor-grabbing hover:ring-2 hover:ring-blue-400 bg-slate-50"
                title={asset.name || 'Kéo thả vào vùng ảnh'}
              >
                <img src={preview} alt="" className="w-full h-full object-cover pointer-events-none" />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
