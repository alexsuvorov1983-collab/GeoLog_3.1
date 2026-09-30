import { useState, useCallback, useEffect, useRef } from 'react';

// Хук для управления шириной столбцов
export function useColumnResize(columnKeys: string[], defaultWidths: Record<string, number>) {
  const [widths, setWidths] = useState<Record<string, number>>(defaultWidths);
  const [resizingColumn, setResizingColumn] = useState<string | null>(null);
  const startXRef = useRef(0);
  const startWidthRef = useRef(0);

  const handleMouseDown = useCallback((e: React.MouseEvent, columnKey: string) => {
    e.preventDefault();
    e.stopPropagation();
    setResizingColumn(columnKey);
    startXRef.current = e.clientX;
    startWidthRef.current = widths[columnKey] || 100;
  }, [widths]);

  useEffect(() => {
    if (!resizingColumn) return;

    const handleMouseMove = (e: MouseEvent) => {
      e.preventDefault();
      const delta = e.clientX - startXRef.current;
      const newWidth = Math.max(50, startWidthRef.current + delta);
      setWidths(prev => ({ ...prev, [resizingColumn]: newWidth }));
    };

    const handleMouseUp = () => {
      setResizingColumn(null);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [resizingColumn]);

  return { widths, handleMouseDown, isResizing: resizingColumn !== null };
}

// Компонент разделителя столбцов
interface ColumnResizerProps {
  onMouseDown: (e: React.MouseEvent) => void;
}

export function ColumnResizer({ onMouseDown }: ColumnResizerProps) {
  return (
    <div
      className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-blue-400 active:bg-blue-500 transition-colors duration-150"
      onMouseDown={onMouseDown}
      style={{ zIndex: 10 }}
    />
  );
}
