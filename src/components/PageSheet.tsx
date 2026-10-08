// Компонент листа A4/A3 с ГОСТ-рамкой и штампом
// Этап 7: Пояснительная записка - экранные рамки и штампы

import { useRef, useEffect, useState } from 'react';
import { PageSettings, StampSettings } from '../utils/reportStructure';
import SheetStamp from './SheetStamp';

interface Props {
  pageSettings: PageSettings;
  stampSettings: StampSettings;
  pageNumber: number;
  totalPages: number;
  children: React.ReactNode;
}

// Размеры страниц в мм
const PAGE_SIZES = {
  A4: { width: 210, height: 297 },
  A3: { width: 297, height: 420 }
};

// Отступы рамки в мм
const FRAME_MARGINS = {
  left: 20,
  right: 5,
  top: 5,
  bottom: 5
};

export default function PageSheet({ 
  pageSettings, 
  stampSettings, 
  pageNumber, 
  totalPages, 
  children 
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  // Вычисляем размеры листа
  const pageSize = PAGE_SIZES[pageSettings.format];
  const sheetWidth = pageSettings.orientation === 'portrait' 
    ? pageSize.width 
    : pageSize.height;
  const sheetHeight = pageSettings.orientation === 'portrait' 
    ? pageSize.height 
    : pageSize.width;

  // Масштабирование при изменении размера контейнера
  useEffect(() => {
    const updateScale = () => {
      if (!containerRef.current) return;
      
      const containerWidth = containerRef.current.offsetWidth;
      const newScale = containerWidth / sheetWidth;
      setScale(newScale);
    };

    updateScale();
    
    // Обновляем при изменении размера окна
    window.addEventListener('resize', updateScale);
    
    // Обновляем при изменении формата/ориентации
    const resizeObserver = new ResizeObserver(updateScale);
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }
    
    return () => {
      window.removeEventListener('resize', updateScale);
      resizeObserver.disconnect();
    };
  }, [sheetWidth, pageSettings.format, pageSettings.orientation]);

  // Размеры рамки
  const frameWidth = sheetWidth - FRAME_MARGINS.left - FRAME_MARGINS.right;
  const frameHeight = sheetHeight - FRAME_MARGINS.top - FRAME_MARGINS.bottom;

  return (
    <div 
      ref={containerRef}
      style={{
        width: '100%',
        marginBottom: '20px',
        overflow: 'hidden'
      }}
    >
      <div
        style={{
          width: `${sheetWidth}mm`,
          height: `${sheetHeight}mm`,
          transform: `scale(${scale})`,
          transformOrigin: 'top left',
          position: 'relative',
          backgroundColor: 'white',
          boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
          marginBottom: `${(sheetHeight * scale) - sheetHeight}mm`
        }}
      >
        {/* Рамка */}
        <div
          style={{
            position: 'absolute',
            left: `${FRAME_MARGINS.left}mm`,
            top: `${FRAME_MARGINS.top}mm`,
            width: `${frameWidth}mm`,
            height: `${frameHeight}mm`,
            border: '0.5mm solid #000',
            pointerEvents: 'none'
          }}
        />

        {/* Контент раздела */}
        <div
          style={{
            position: 'absolute',
            left: `${FRAME_MARGINS.left + 5}mm`,
            top: `${FRAME_MARGINS.top + 5}mm`,
            width: `${frameWidth - 10}mm`,
            height: `${frameHeight - 10}mm`,
            padding: '5mm 5mm 5mm 5mm',
            overflow: 'hidden',
            fontFamily: 'Times New Roman, serif',
            fontSize: '12pt',
            lineHeight: '1.5'
          }}
        >
          {children}
        </div>

        {/* Штамп */}
        {pageSettings.stamp !== 'none' && (
          <SheetStamp
            type={pageSettings.stamp}
            stampSettings={stampSettings}
            pageNumber={pageNumber}
            totalPages={totalPages}
          />
        )}
      </div>
    </div>
  );
}
// Конец файла
