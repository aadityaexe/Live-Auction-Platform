import { useState } from 'react';

interface AuctionGalleryProps {
  images: string[];
  title: string;
}

export const AuctionGallery = ({ images, title }: AuctionGalleryProps) => {
  const [imgIndex, setImgIndex] = useState(0);

  return (
    <div className="bg-surface-subtle border border-border relative p-1">
      <div className="border border-border relative w-full h-full bg-surface overflow-hidden">
        <div className="absolute inset-0 bg-text-primary/5 mix-blend-multiply pointer-events-none z-10"></div>
        {images.length > 0 ? (
          <>
            <div className="aspect-[16/9] w-full relative flex items-center justify-center">
              <img
                src={images[imgIndex]}
                alt={title}
                className="w-full h-full object-cover grayscale-[10%]"
              />
            </div>
            {images.length > 1 && (
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 p-2 bg-surface/90 backdrop-blur-sm border border-border z-20 shadow-sm">
                {images.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setImgIndex(i)}
                    className={`w-2 h-2 transition-all ${
                      i === imgIndex
                        ? 'bg-text-primary scale-110'
                        : 'bg-text-muted hover:bg-text-secondary'
                    }`}
                    aria-label={`View image ${i + 1}`}
                  />
                ))}
              </div>
            )}
          </>
        ) : (
          <div className="aspect-[16/9] flex items-center justify-center text-text-muted text-sm font-serif italic">
            No Image Available
          </div>
        )}
      </div>
    </div>
  );
};
