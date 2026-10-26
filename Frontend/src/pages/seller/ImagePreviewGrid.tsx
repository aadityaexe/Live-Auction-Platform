interface ImagePreviewGridProps {
  images: string[];
  onRemove: (index: number) => void;
}

export const ImagePreviewGrid = ({ images, onRemove }: ImagePreviewGridProps) => {
  if (images.length === 0) return null;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-3 pt-2">
      {images.map((url, idx) => (
        <div
          key={`${url}-${idx}`}
          className="group relative aspect-square bg-surface border border-border rounded overflow-hidden"
        >
          <img
            src={url}
            alt={`Uploaded image ${idx + 1}`}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onRemove(idx);
              }}
              className="bg-danger text-white rounded-full p-1.5 hover:bg-danger/80 transition-colors shadow-sm"
              title="Remove image"
              aria-label="Remove image"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
          {idx === 0 && (
            <span className="absolute bottom-1 left-1 bg-surface/90 border border-border text-[9px] font-semibold uppercase tracking-widest px-1.5 py-0.5 text-text-primary rounded">
              Cover
            </span>
          )}
        </div>
      ))}
    </div>
  );
};
