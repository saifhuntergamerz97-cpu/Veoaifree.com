
import React, { useRef } from 'react';
// Corrected import: Asset is exported from types, but Icons is not. Icons is not used here.
import { Asset } from '../types';

interface AssetUploaderProps {
  label: string;
  type: 'start' | 'end' | 'reference';
  asset: Asset | null;
  onUpload: (asset: Asset) => void;
  onClear: () => void;
}

const AssetUploader: React.FC<AssetUploaderProps> = ({ label, type, asset, onUpload, onClear }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        onUpload({
          id: Math.random().toString(36).substr(2, 9),
          data: reader.result as string,
          mimeType: file.type,
          type
        });
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <span className="text-xs font-medium text-zinc-400 uppercase tracking-wider">{label}</span>
      <div 
        onClick={() => !asset && fileInputRef.current?.click()}
        className={`relative aspect-video rounded-xl border-2 border-dashed transition-all cursor-pointer overflow-hidden
          ${asset ? 'border-indigo-500 bg-zinc-900/50' : 'border-zinc-800 hover:border-zinc-700 bg-zinc-950'}
        `}
      >
        <input 
          type="file" 
          className="hidden" 
          ref={fileInputRef} 
          accept="image/*" 
          onChange={handleFileChange} 
        />
        
        {asset ? (
          <>
            <img src={asset.data} alt="Upload" className="w-full h-full object-cover" />
            <button 
              onClick={(e) => { e.stopPropagation(); onClear(); }}
              className="absolute top-2 right-2 p-1.5 bg-black/60 hover:bg-red-500/80 rounded-full text-white transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" />
              </svg>
            </button>
          </>
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-zinc-500 gap-2 p-4 text-center">
            <div className="p-2 bg-zinc-900 rounded-lg">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
              </svg>
            </div>
            <span className="text-xs">Click to upload</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default AssetUploader;
