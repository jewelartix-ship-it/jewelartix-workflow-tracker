import { useEffect } from 'react';
import { X } from 'lucide-react';

interface ImageLightboxProps {
  src: string;
  onClose: () => void;
}

export function ImageLightbox({ src, onClose }: ImageLightboxProps) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-ink/70" aria-hidden="true" />
      <button
        onClick={onClose}
        className="absolute right-4 top-4 z-10 rounded-full bg-surface/90 p-2 text-ink hover:bg-surface"
        aria-label="Close"
      >
        <X size={20} />
      </button>
      <img
        src={src}
        alt="Task"
        onClick={(e) => e.stopPropagation()}
        className="relative max-h-[85vh] max-w-full rounded-xl object-contain shadow-popover"
      />
    </div>
  );
}
