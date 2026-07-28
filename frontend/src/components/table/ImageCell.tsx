import { useRef, useState } from 'react';
import { Image as ImageIcon, Upload, Eye, Trash2 } from 'lucide-react';
import { Popover } from '../table/Popover';
import { ImageLightbox } from '../common/ImageLightbox';

interface ImageCellProps {
  imageData: string | null;
  onSave: (dataUrl: string) => void;
  onRemove: () => void;
  readOnly?: boolean;
}

// Resized so a typical phone photo compresses down to well under the
// backend's 4mb request limit — usually a few hundred KB after this.
const MAX_DIMENSION = 1000;
const JPEG_QUALITY = 0.75;

function compressImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Could not read file'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('Could not load image'));
      img.onload = () => {
        let { width, height } = img;
        if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
          if (width > height) {
            height = Math.round((height / width) * MAX_DIMENSION);
            width = MAX_DIMENSION;
          } else {
            width = Math.round((width / height) * MAX_DIMENSION);
            height = MAX_DIMENSION;
          }
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) return reject(new Error('Canvas not supported'));
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', JPEG_QUALITY));
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}

export function ImageCell({ imageData, onSave, onRemove, readOnly }: ImageCellProps) {
  const [mode, setMode] = useState<'closed' | 'menu'>('closed');
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setError(null);
    setIsUploading(true);
    try {
      const dataUrl = await compressImage(file);
      onSave(dataUrl);
    } catch {
      setError('Could not process that image.');
    } finally {
      setIsUploading(false);
      setMode('closed');
    }
  }

  if (readOnly) {
    if (!imageData) return <span className="inline-block px-2 py-1 text-ink-faint">—</span>;
    return (
      <>
        <button onClick={() => setLightboxOpen(true)} className="block h-9 w-9 overflow-hidden rounded-lg border border-border">
          <img src={imageData} alt="Task" className="h-full w-full object-cover" />
        </button>
        {lightboxOpen && <ImageLightbox src={imageData} onClose={() => setLightboxOpen(false)} />}
      </>
    );
  }

  return (
    <div className="inline-block" onClick={(e) => e.stopPropagation()}>
      <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />

      {imageData ? (
        <button
          ref={setAnchorEl}
          onClick={() => setMode(mode === 'menu' ? 'closed' : 'menu')}
          className="block h-9 w-9 overflow-hidden rounded-lg border border-border hover:border-border-strong"
        >
          <img src={imageData} alt="Task" className="h-full w-full object-cover" />
        </button>
      ) : (
        <button
          ref={setAnchorEl}
          onClick={() => (isUploading ? undefined : fileInputRef.current?.click())}
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-dashed border-border-strong text-ink-faint hover:bg-surface-alt hover:text-ink-muted"
          aria-label="Upload image"
        >
          {isUploading ? (
            <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-ink-faint border-t-transparent" />
          ) : (
            <ImageIcon size={15} />
          )}
        </button>
      )}

      {mode === 'menu' && imageData && (
        <Popover anchorEl={anchorEl} onClose={() => setMode('closed')}>
          <div className="w-36 overflow-hidden rounded-xl border border-border bg-surface py-1 shadow-popover">
            <button
              onClick={() => {
                setLightboxOpen(true);
                setMode('closed');
              }}
              className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-sm text-ink hover:bg-surface-alt"
            >
              <Eye size={14} /> View
            </button>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-sm text-ink hover:bg-surface-alt"
            >
              <Upload size={14} /> Replace
            </button>
            <button
              onClick={() => {
                onRemove();
                setMode('closed');
              }}
              className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-sm text-danger hover:bg-danger-soft"
            >
              <Trash2 size={14} /> Remove
            </button>
          </div>
        </Popover>
      )}

      {lightboxOpen && imageData && <ImageLightbox src={imageData} onClose={() => setLightboxOpen(false)} />}
      {error && <p className="mt-1 text-[10px] text-danger">{error}</p>}
    </div>
  );
}
