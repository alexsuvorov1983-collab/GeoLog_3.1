import { useEffect, useRef } from 'react';
import { CommandRegistry } from '../core/commandRegistry';

interface Props {
  x: number;
  y: number;
  items: { label: string; commandId: string }[];
  onClose: () => void;
}

export default function ContextMenu({ x, y, items, onClose }: Props) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [onClose]);

  return (
    <div
      ref={ref}
      className="fixed bg-white border border-[#c0c0c0] shadow-lg z-[100] min-w-[160px]"
      style={{ left: x, top: y }}
    >
      {items.map((item, idx) => (
        <button
          key={idx}
          className="w-full text-left px-4 py-1.5 text-sm hover:bg-[#d0d0ff]"
          onClick={() => {
            CommandRegistry.execute(item.commandId);
            onClose();
          }}
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}
