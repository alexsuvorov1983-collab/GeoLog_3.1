import { useState, useCallback, useEffect } from 'react';

interface SplitterProps {
  direction: 'vertical' | 'horizontal';
  onResize: (delta: number) => void;
  onResizeEnd?: () => void;
}

export default function Splitter({ direction, onResize, onResizeEnd }: SplitterProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [startPos, setStartPos] = useState(0);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    setStartPos(direction === 'vertical' ? e.clientX : e.clientY);
  }, [direction]);

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      e.preventDefault();
      const currentPos = direction === 'vertical' ? e.clientX : e.clientY;
      const delta = currentPos - startPos;
      if (delta !== 0) {
        onResize(delta);
        setStartPos(currentPos);
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      if (onResizeEnd) onResizeEnd();
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    document.body.style.cursor = direction === 'vertical' ? 'col-resize' : 'row-resize';
    document.body.style.userSelect = 'none';

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isDragging, startPos, direction, onResize, onResizeEnd]);

  const isVertical = direction === 'vertical';

  return (
    <div
      className={`${isVertical ? 'w-1 cursor-col-resize' : 'h-1 cursor-row-resize'} 
        ${isVertical ? 'hover:bg-blue-400' : 'hover:bg-blue-400'} 
        ${isDragging ? 'bg-blue-500' : 'bg-[#c0c0c0]'}
        transition-colors duration-150`}
      onMouseDown={handleMouseDown}
      style={{
        flexShrink: 0,
        position: 'relative',
      }}
    >
      {/* Визуальная индикация для удобства */}
      {isVertical && (
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-0.5 h-8 bg-current opacity-30" />
      )}
      {!isVertical && (
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 h-0.5 w-8 bg-current opacity-30" />
      )}
    </div>
  );
}
