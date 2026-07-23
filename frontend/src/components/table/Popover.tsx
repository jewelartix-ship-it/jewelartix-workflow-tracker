import { createPortal } from 'react-dom';
import { useEffect, useState, type ReactNode } from 'react';

interface PopoverProps {
  anchorEl: HTMLElement | null;
  onClose: () => void;
  children: ReactNode;
  align?: 'left' | 'center';
}

/**
 * Renders its children into document.body via a portal, positioned just
 * below the given anchor element. This exists because the data table's
 * horizontally-scrolling wrapper (overflow-x: auto) also clips vertical
 * overflow as a CSS side effect — any absolutely-positioned dropdown nested
 * inside it (Drive link menu, progress ✓/✗ picker) was opening but
 * invisible, clipped by that container. Rendering into body sidesteps it.
 */
export function Popover({ anchorEl, onClose, children, align = 'left' }: PopoverProps) {
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);

  useEffect(() => {
    if (!anchorEl) return;
    function update() {
      const rect = anchorEl!.getBoundingClientRect();
      setPos({
        top: rect.bottom + window.scrollY + 4,
        left: (align === 'center' ? rect.left + rect.width / 2 : rect.left) + window.scrollX,
      });
    }
    update();
    window.addEventListener('scroll', update, true);
    window.addEventListener('resize', update);
    return () => {
      window.removeEventListener('scroll', update, true);
      window.removeEventListener('resize', update);
    };
  }, [anchorEl, align]);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      const target = e.target as HTMLElement;
      if (anchorEl && anchorEl.contains(target)) return;
      if (target.closest('[data-popover-content]')) return;
      onClose();
    }
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, [anchorEl, onClose]);

  if (!pos) return null;

  return createPortal(
    <div
      data-popover-content
      style={{
        position: 'absolute',
        top: pos.top,
        left: pos.left,
        transform: align === 'center' ? 'translateX(-50%)' : undefined,
        zIndex: 9999,
      }}
    >
      {children}
    </div>,
    document.body
  );
}
