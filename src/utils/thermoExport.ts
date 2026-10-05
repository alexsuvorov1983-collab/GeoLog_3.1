import { Borehole, ThermoSession } from '../core/dataStore';

// Экспорт в DXF формат (AutoCAD R12 ASCII)
export function exportToDXF(boreholes: Borehole[], sessions: ThermoSession[], selectedBoreholeIds?: string[]): string {
  const lines: string[] = [];
  
  // Заголовок DXF
  lines.push('0');
  lines.push('SECTION');
  lines.push('2');
  lines.push('HEADER');
  lines.push('9');
  lines.push('$ACADVER');
  lines.push('1');
  lines.push('AC1009'); // AutoCAD R12
  lines.push('0');
  lines.push('ENDSEC');
  
  // Таблица слоев
  lines.push('0');
  lines.push('SECTION');
  lines.push('2');
  lines.push('TABLES');
  lines.push('0');
  lines.push('TABLE');
  lines.push('2');
  lines.push('LAYER');
  lines.push('70');
  lines.push('1');
  lines.push('0');
  lines.push('LAYER');
  lines.push('2');
  lines.push('Thermometry');
  lines.push('70');
  lines.push('0');
  lines.push('62');
  lines.push('7'); // Цвет слоя (белый)
  lines.push('6');
  lines.push('CONTINUOUS');
  lines.push('0');
  lines.push('ENDTAB');
  lines.push('0');
  lines.push('ENDSEC');
  
  // Таблица блоков
  lines.push('0');
  lines.push('SECTION');
  lines.push('2');
  lines.push('BLOCKS');
  lines.push('0');
  lines.push('ENDSEC');
  
  // Объекты
  lines.push('0');
  lines.push('SECTION');
  lines.push('2');
  lines.push('ENTITIES');
  
  // Фильтруем сессии по выбранным скважинам
  const filteredSessions = selectedBoreholeIds && selectedBoreholeIds.length > 0
    ? sessions.filter(s => selectedBoreholeIds.includes(s.boreholeId))
    : sessions;
  
  // Группируем сессии по скважинам
  const sessionsByBorehole = new Map<string, ThermoSession[]>();
  filteredSessions.forEach(session => {
    if (!sessionsByBorehole.has(session.boreholeId)) {
      sessionsByBorehole.set(session.boreholeId, []);
    }
    sessionsByBorehole.get(session.boreholeId)!.push(session);
  });
  
  let xOffset = 0;
  const graphWidth = 100; // Ширина графика
  const graphHeight = 200; // Высота графика (масштаб глубины)
  const spacing = 150; // Расстояние между графиками
  
  sessionsByBorehole.forEach((boreholeSessions, boreholeId) => {
    const borehole = boreholes.find(b => b.id === boreholeId);
    if (!borehole) return;
    
    const xBase = xOffset;
    const yBase = 0;
    
    // Заголовок - номер скважины
    lines.push('0');
    lines.push('TEXT');
    lines.push('8');
    lines.push('Thermometry');
    lines.push('10');
    lines.push(String(xBase + graphWidth / 2));
    lines.push('20');
    lines.push(String(yBase + graphHeight + 20));
    lines.push('30');
    lines.push('0');
    lines.push('40');
    lines.push('5'); // Высота текста
    lines.push('1');
    lines.push(`Скважина ${borehole.number}`);
    
    // Вертикальная ось глубин
    lines.push('0');
    lines.push('LINE');
    lines.push('8');
    lines.push('Thermometry');
    lines.push('10');
    lines.push(String(xBase));
    lines.push('20');
    lines.push(String(yBase));
    lines.push('30');
    lines.push('0');
    lines.push('11');
    lines.push(String(xBase));
    lines.push('21');
    lines.push(String(yBase + graphHeight));
    lines.push('31');
    lines.push('0');
    
    // Горизонтальная ось температур
    lines.push('0');
    lines.push('LINE');
    lines.push('8');
    lines.push('Thermometry');
    lines.push('10');
    lines.push(String(xBase));
    lines.push('20');
    lines.push(String(yBase));
    lines.push('30');
    lines.push('0');
    lines.push('11');
    lines.push(String(xBase + graphWidth));
    lines.push('21');
    lines.push(String(yBase));
    lines.push('31');
    lines.push('0');
    
    // Рисуем графики для каждой сессии
    boreholeSessions.forEach((session, sessionIndex) => {
      if (session.measurements.length === 0) return;
      
      // Сортируем замеры по глубине
      const sortedMeasurements = [...session.measurements].sort((a, b) => a.depth - b.depth);
      
      // Находим диапазон температур
      const temps = sortedMeasurements.map(m => m.temperature);
      const minTemp = Math.min(...temps);
      const maxTemp = Math.max(...temps);
      const tempRange = maxTemp - minTemp || 1;
      
      // Находим максимальную глубину
      const maxDepth = Math.max(...sortedMeasurements.map(m => m.depth));
      const depthScale = graphHeight / maxDepth;
      const tempScale = graphWidth / tempRange;
      
      // Рисуем ломаную линию
      for (let i = 0; i < sortedMeasurements.length - 1; i++) {
        const m1 = sortedMeasurements[i];
        const m2 = sortedMeasurements[i + 1];
        
        const x1 = xBase + (m1.temperature - minTemp) * tempScale;
        const y1 = yBase + graphHeight - m1.depth * depthScale;
        const x2 = xBase + (m2.temperature - minTemp) * tempScale;
        const y2 = yBase + graphHeight - m2.depth * depthScale;
        
        lines.push('0');
        lines.push('LINE');
        lines.push('8');
        lines.push('Thermometry');
        lines.push('10');
        lines.push(String(x1));
        lines.push('20');
        lines.push(String(y1));
        lines.push('30');
        lines.push('0');
        lines.push('11');
        lines.push(String(x2));
        lines.push('21');
        lines.push(String(y2));
        lines.push('31');
        lines.push('0');
      }
      
      // Подпись даты сессии
      lines.push('0');
      lines.push('TEXT');
      lines.push('8');
      lines.push('Thermometry');
      lines.push('10');
      lines.push(String(xBase + graphWidth + 10));
      lines.push('20');
      lines.push(String(yBase + graphHeight - sessionIndex * 10));
      lines.push('30');
      lines.push('0');
      lines.push('40');
      lines.push('3');
      lines.push('1');
      lines.push(session.date);
    });
    
    xOffset += spacing;
  });
  
  lines.push('0');
  lines.push('ENDSEC');
  
  // Конец файла
  lines.push('0');
  lines.push('EOF');
  
  return lines.join('\n');
}

// Экспорт в Excel формат
export async function exportToExcel(boreholes: Borehole[], sessions: ThermoSession[], selectedBoreholeIds?: string[]): Promise<void> {
  const XLSX = await import('xlsx');
  
  // Фильтруем сессии по выбранным скважинам
  const filteredSessions = selectedBoreholeIds && selectedBoreholeIds.length > 0
    ? sessions.filter(s => selectedBoreholeIds.includes(s.boreholeId))
    : sessions;
  
  // Собираем все уникальные глубины
  const allDepths = new Set<number>();
  filteredSessions.forEach(session => {
    session.measurements.forEach(m => allDepths.add(m.depth));
  });
  const sortedDepths = Array.from(allDepths).sort((a, b) => a - b);
  
  // Создаем данные для Excel
  const data: any[][] = [];
  
  // Заголовок
  const header = ['Скважина', 'Дата'];
  sortedDepths.forEach(depth => {
    header.push(`${depth} м`);
  });
  data.push(header);
  
  // Данные по сессиям
  filteredSessions.forEach(session => {
    const borehole = boreholes.find(b => b.id === session.boreholeId);
    if (!borehole) return;
    
    const row: (string | number)[] = [borehole.number, session.date];
    sortedDepths.forEach(depth => {
      const measurement = session.measurements.find(m => m.depth === depth);
      row.push(measurement ? measurement.temperature : '');
    });
    data.push(row);
  });
  
  // Создаем workbook
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet(data);
  
  // Устанавливаем ширину колонок
  ws['!cols'] = [
    { wch: 15 }, // Скважина
    { wch: 12 }, // Дата
    ...sortedDepths.map(() => ({ wch: 10 })) // Глубины
  ];
  
  XLSX.utils.book_append_sheet(wb, ws, 'Термометрия');
  
  // Генерируем имя файла с текущей датой
  const date = new Date().toISOString().split('T')[0];
  const fileName = `Thermometry_${date}.xlsx`;
  
  // Скачиваем файл
  XLSX.writeFile(wb, fileName);
}
