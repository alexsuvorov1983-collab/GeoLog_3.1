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

// Конвертация мм в пиксели (96 DPI)
const PX_PER_MM = 96 / 25.4; // ≈3.7795275591

export default function PageSheet({ 
  pageSettings, 
  stampSettings, 
  pageNumber, 
  totalPages, 
  children 
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.5); // Начальное значение 0.5
  const [isReady, setIsReady] = useState(false); // Флаг готовности

  // Вычисляем размеры листа в мм
  const pageSize = PAGE_SIZES[pageSettings.format];
  const sheetWidthMm = pageSettings.orientation === 'portrait' 
    ? pageSize.width 
    : pageSize.height;
  const sheetHeightMm = pageSettings.orientation === 'portrait' 
    ? pageSize.height 
    : pageSize.width;

  // Переводим размеры в пиксели
  const sheetWpx = sheetWidthMm * PX_PER_MM;
  const sheetHpx = sheetHeightMm * PX_PER_MM;

  // Размеры рамки в мм
  const frameWidthMm = sheetWidthMm - FRAME_MARGINS.left - FRAME_MARGINS.right;
  const frameHeightMm = sheetHeightMm - FRAME_MARGINS.top - FRAME_MARGINS.bottom;

  // Масштабирование при изменении размера контейнера
  useEffect(() => {
    const updateScale = () => {
      if (!containerRef.current) return;
      
      const containerWidthPx = containerRef.current.offsetWidth;
      
      // Если контейнер ещё не имеет ширины, используем начальное значение
      if (containerWidthPx === 0) {
        setScale(0.5);
        setIsReady(false);
        return;
      }
      
      // Вычисляем масштаб
      let k = containerWidthPx / sheetWpx;
      
      // Ограничиваем масштаб максимум 1 (100%)
      k = Math.min(k, 1);
      
      setScale(k);
      setIsReady(true);
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
  }, [sheetWpx, pageSettings.format, pageSettings.orientation]);

  return (
    <div 
      ref={containerRef}
      style={{
        width: '100%',
        marginBottom: '20px',
        overflow: 'hidden',
        height: isReady ? `${sheetHpx * scale}px` : '0px', // Высота обёртки
        visibility: isReady ? 'visible' : 'hidden' // Скрываем до первого замера
      }}
    >
      <div
        style={{
          width: `${sheetWpx}px`,
          height: `${sheetHpx}px`,
          transform: `scale(${scale})`,
          transformOrigin: 'top left',
          position: 'relative',
          backgroundColor: 'white',
          boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
        }}
      >
        {/* Рамка */}
        <div
          style={{
            position: 'absolute',
            left: `${FRAME_MARGINS.left}mm`,
            top: `${FRAME_MARGINS.top}mm`,
            width: `${frameWidthMm}mm`,
            height: `${frameHeightMm}mm`,
            border: '0.4mm solid #000', // Толщина 0.4 мм
            pointerEvents: 'none'
          }}
        />

        {/* Контент раздела */}
        <div
          style={{
            position: 'absolute',
            left: `${FRAME_MARGINS.left + 5}mm`,
            top: `${FRAME_MARGINS.top + 5}mm`,
            width: `${frameWidthMm - 10}mm`,
            height: `${frameHeightMm - 10}mm`,
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
