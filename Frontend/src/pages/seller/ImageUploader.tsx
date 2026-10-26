import { useRef, useState } from 'react';
import { uploadApi } from '../../services/api/upload.api';
import { Spinner } from '../../components/common';
import { ImagePreviewGrid } from './ImagePreviewGrid';

interface ImageUploaderProps {
  images: string[];
  onChange: (images: string[]) => void;
  error?: string;
}

export const ImageUploader = ({ images, onChange, error }: ImageUploaderProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [directUrl, setDirectUrl] = useState('');
  const [isDragging, setIsDragging] = useState(false);

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploadError('');
    setUploading(true);

    try {
      const fileArray = Array.from(files);
      const uploadedUrls = await uploadApi.uploadImages(fileArray);
      onChange([...images, ...uploadedUrls]);
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } }; message?: string };
      setUploadError(
        axiosErr.response?.data?.message || axiosErr.message || 'Failed to upload image(s). Please try again.'
      );
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemove = (indexToRemove: number) => {
    onChange(images.filter((_, idx) => idx !== indexToRemove));
  };

  const handleAddDirectUrl = () => {
    const trimmed = directUrl.trim();
    if (!trimmed) return;
    onChange([...images, trimmed]);
    setDirectUrl('');
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <label className="text-xs uppercase tracking-widest font-semibold text-text-primary">
          Auction Images ({images.length})
        </label>
        <span className="text-[11px] text-text-muted">Max 5MB per image (JPEG, PNG, WebP)</span>
      </div>

      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragging(false);
          handleFiles(e.dataTransfer.files);
        }}
        onClick={() => !uploading && fileInputRef.current?.click()}
        className={`border-2 border-dashed p-6 rounded text-center cursor-pointer transition-colors ${
          isDragging
            ? 'border-primary bg-primary/5'
            : 'border-border hover:border-text-primary/50 bg-surface-subtle'
        } ${uploading ? 'opacity-60 cursor-not-allowed' : ''}`}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/jpeg,image/png,image/webp,image/gif,image/avif"
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
          disabled={uploading}
        />

        <div className="flex flex-col items-center justify-center gap-2">
          {uploading ? (
            <>
              <Spinner size={24} />
              <p className="text-sm font-serif italic text-text-secondary mt-2">
                Uploading to Cloudinary...
              </p>
            </>
          ) : (
            <>
              <div className="w-10 h-10 rounded-full bg-surface border border-border flex items-center justify-center text-text-secondary mb-1">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.75"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="17 8 12 3 7 8" />
                  <line x1="12" y1="3" x2="12" y2="15" />
                </svg>
              </div>
              <p className="text-sm font-medium text-text-primary">
                Click to upload or drag & drop files
              </p>
              <p className="text-xs text-text-muted">
                Images are automatically hosted and optimized on Cloudinary
              </p>
            </>
          )}
        </div>
      </div>

      {uploadError && (
        <div className="p-3 bg-danger/10 border border-danger/30 text-danger text-xs rounded flex items-center justify-between">
          <span>{uploadError}</span>
          <button
            type="button"
            onClick={() => setUploadError('')}
            className="text-xs font-semibold hover:underline ml-2"
          >
            Dismiss
          </button>
        </div>
      )}

      {error && <div className="text-xs text-danger font-serif italic">{error}</div>}

      <ImagePreviewGrid images={images} onRemove={handleRemove} />

      <div className="pt-2">
        <div className="flex gap-2">
          <input
            type="url"
            value={directUrl}
            onChange={(e) => setDirectUrl(e.target.value)}
            placeholder="Or paste an image URL (https://...)"
            className="form-input flex-1 text-xs"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleAddDirectUrl();
              }
            }}
          />
          <button
            type="button"
            onClick={handleAddDirectUrl}
            disabled={!directUrl.trim()}
            className="btn btn-secondary text-xs h-9 px-3 disabled:opacity-50"
          >
            Add URL
          </button>
        </div>
      </div>
    </div>
  );
};
