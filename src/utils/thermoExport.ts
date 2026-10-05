import { Borehole, ThermoSession } from '../core/dataStore';

// Экспорт в DXF перенесён в dxfGenerator.ts

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
