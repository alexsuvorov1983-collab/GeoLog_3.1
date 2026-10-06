// Диалог импорта термометрии из Excel
// Этап 7: Импорт из Excel

import { useState, useRef } from 'react';
import { Borehole, ThermoSession, GeoLogData } from '../core/dataStore';
import { Journal } from '../core/journal';
import * as XLSX from 'xlsx';

interface Props {
  boreholes: Borehole[];
  onClose: () => void;
  onImportComplete: () => void;
}

interface ImportPreview {
  sessions: Array<{
    date: string;
    boreholeNumber: string;
    measurements: Array<{ depth: number; temperature: number }>;
    rowIndex: number;
  }>;
  warnings: string[];
  createdBoreholes: string[];
  totalMeasurements: number;
}

export default function ThermoImportDialog({ boreholes, onClose, onImportComplete }: Props) {
  const [preview, setPreview] = useState<ImportPreview | null>(null);
  const [fileName, setFileName] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Конвертация даты Excel serial number в ISO формат
  const excelDateToISO = (serial: number): string => {
    const utcDays = Math.floor(serial - 25569);
    const date = new Date(utcDays * 86400 * 1000);
    return date.toISOString().split('T')[0];
  };

  // Парсинг строковой даты в ISO формат
  const parseStringDate = (dateStr: string): string | null => {
    if (!dateStr) return null;
    
    // ДД.ММ.ГГГГ
    let match = dateStr.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/);
    if (match) {
      const [, day, month, year] = match;
      return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    }
    
    // ДД.ММ.ГГ
    match = dateStr.match(/^(\d{1,2})\.(\d{1,2})\.(\d{2})$/);
    if (match) {
      const [, day, month, year] = match;
      const fullYear = parseInt(year) > 50 ? `19${year}` : `20${year}`;
      return `${fullYear}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    }
    
    // М/Д/ГГ
    match = dateStr.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/);
    if (match) {
      const [, month, day, year] = match;
      const fullYear = year.length === 2 ? (parseInt(year) > 50 ? `19${year}` : `20${year}`) : year;
      return `${fullYear}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    }
    
    return null;
  };

  // Обработка выбора файла
  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    setError('');
    setFileName(file.name);

    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data, { type: 'array', cellDates: false });

      // Поиск листа "Термометрия" или первого подходящего
      let targetSheet: XLSX.WorkSheet | null = null;
      let targetSheetName = '';

      if (workbook.Sheets['Термометрия']) {
        targetSheet = workbook.Sheets['Термометрия'];
        targetSheetName = 'Термометрия';
      } else {
        // Ищем первый лист с заголовками "Дата" и "№ скважины"
        for (const sheetName of workbook.SheetNames) {
          const sheet = workbook.Sheets[sheetName];
          const range = XLSX.utils.decode_range(sheet['!ref'] || 'A1');
          
          if (range.e.r >= 0) {
            const firstRow = XLSX.utils.sheet_to_json(sheet, {
              header: 1,
              range: { s: { r: 0, c: 0 }, e: { r: 0, c: range.e.c } },
              defval: ''
            })[0] as any[];
            
            const hasDate = firstRow.some(cell => String(cell).includes('Дата'));
            const hasBorehole = firstRow.some(cell => String(cell).includes('скважины') || String(cell).includes('№'));
            
            if (hasDate && hasBorehole) {
              targetSheet = sheet;
              targetSheetName = sheetName;
              break;
            }
          }
        }
      }

      if (!targetSheet) {
        setError('Не найден лист с данными термометрии.\n\nОжидаемая структура:\n• Строка 1: Заголовки (Дата, № скважины, Глубина замера, м)\n• Строка 2: Числовая сетка глубин\n• Строки 3+: Данные (дата, номер скважины, температуры)');
        setIsProcessing(false);
        return;
      }

      // Чтение данных
      const allRows = XLSX.utils.sheet_to_json(targetSheet, {
        header: 1,
        defval: ''
      }) as any[][];

      if (allRows.length < 3) {
        setError('Файл содержит недостаточно данных.\n\nОжидаемая структура:\n• Строка 1: Заголовки\n• Строка 2: Сетка глубин\n• Строки 3+: Данные');
        setIsProcessing(false);
        return;
      }

      // Чтение сетки глубин из строки 2 (индекс 1)
      const depthRow = allRows[1];
      const depths: number[] = [];
      
      for (let col = 2; col < depthRow.length; col++) {
        const val = depthRow[col];
        const num = parseFloat(String(val).replace(',', '.'));
        if (!isNaN(num)) {
          depths.push(num);
        }
      }

      if (depths.length === 0) {
        setError('Не найдена сетка глубин во второй строке файла.');
        setIsProcessing(false);
        return;
      }

      // Разбор строк данных (с 3-й строки, индекс 2)
      const sessions: ImportPreview['sessions'] = [];
      const warnings: string[] = [];
      const createdBoreholes: string[] = [];
      let totalMeasurements = 0;

      for (let rowIndex = 2; rowIndex < allRows.length; rowIndex++) {
        const row = allRows[rowIndex];
        
        // Пропускаем пустые строки
        if (!row || row.length === 0 || row.every(cell => cell === '' || cell === null || cell === undefined)) {
          continue;
        }

        // Парсинг даты (колонка A, индекс 0)
        let dateISO: string | null = null;
        const dateCell = row[0];
        
        if (typeof dateCell === 'number') {
          dateISO = excelDateToISO(dateCell);
        } else if (typeof dateCell === 'string') {
          dateISO = parseStringDate(dateCell);
        }

        if (!dateISO) {
          warnings.push(`Строка ${rowIndex + 1}: некорректная дата "${dateCell}"`);
          continue;
        }

        // Парсинг номера скважины (колонка B, индекс 1)
        const boreholeNumber = String(row[1] || '').trim();
        
        if (!boreholeNumber) {
          warnings.push(`Строка ${rowIndex + 1}: отсутствует номер скважины`);
          continue;
        }

        // Парсинг температур (колонки C+, индексы 2+)
        const measurements: Array<{ depth: number; temperature: number }> = [];
        
        for (let col = 2; col < row.length && col - 2 < depths.length; col++) {
          const tempCell = row[col];
          const temp = parseFloat(String(tempCell).replace(',', '.'));
          
          if (!isNaN(temp) && tempCell !== '' && tempCell !== null && tempCell !== undefined) {
            measurements.push({
              depth: depths[col - 2],
              temperature: temp
            });
          }
        }

        if (measurements.length === 0) {
          warnings.push(`Строка ${rowIndex + 1}: нет данных о температурах`);
          continue;
        }

        totalMeasurements += measurements.length;

        // Проверка существования скважины
        const existingBorehole = boreholes.find(b => b.number === boreholeNumber);
        
        if (!existingBorehole && !createdBoreholes.includes(boreholeNumber)) {
          createdBoreholes.push(boreholeNumber);
          warnings.push(`Скважина "${boreholeNumber}" не найдена — будет создана`);
        }

        sessions.push({
          date: dateISO,
          boreholeNumber,
          measurements,
          rowIndex: rowIndex + 1
        });
      }

      if (sessions.length === 0) {
        setError('Не найдено ни одной валидной строки с данными термометрии.');
        setIsProcessing(false);
        return;
      }

      setPreview({
        sessions,
        warnings,
        createdBoreholes,
        totalMeasurements
      });

    } catch (err) {
      setError(`Ошибка чтения файла: ${err instanceof Error ? err.message : 'Неизвестная ошибка'}`);
    } finally {
      setIsProcessing(false);
    }
  };

  // Выполнение импорта
  const handleImport = () => {
    if (!preview) return;

    let sessionsCreated = 0;
    let sessionsUpdated = 0;
    let boreholesCreated = 0;

    // Создание отсутствующих скважин
    for (const boreholeNumber of preview.createdBoreholes) {
      GeoLogData.create({
        number: boreholeNumber,
        depth_m: 0,
        elev_m: 0,
        x: 0,
        y: 0,
      });
      boreholesCreated++;
    }

    // Получаем обновлённый список скважин
    const updatedBoreholes = GeoLogData.getAll();

    // Создание/обновление сессий
    for (const session of preview.sessions) {
      const borehole = updatedBoreholes.find(b => b.number === session.boreholeNumber);
      if (!borehole) continue;

      // Проверяем существование сессии с той же датой
      const existingSession = borehole.thermoSessions?.find(s => s.date === session.date);

      if (existingSession) {
        // Обновляем существующую сессию
        GeoLogData.updateThermoSession(borehole.id, existingSession.id, {
          measurements: session.measurements,
          provenance: {
            type: 'xlsx_import',
            fileName: fileName,
            sheetName: 'Термометрия',
            rowNumber: session.rowIndex,
            importedAt: new Date().toISOString()
          }
        });
        sessionsUpdated++;
      } else {
        // Создаём новую сессию
        GeoLogData.addThermoSession(borehole.id, {
          date: session.date,
          campaign: `Импорт: ${fileName}`,
          measurements: session.measurements,
          provenance: {
            type: 'xlsx_import',
            fileName: fileName,
            sheetName: 'Термометрия',
            rowNumber: session.rowIndex,
            importedAt: new Date().toISOString()
          }
        });
        sessionsCreated++;
      }
    }

    // Запись в журнал
    Journal.logEvent(
      'info',
      `Импорт из Excel: файл "${fileName}", сессий создано: ${sessionsCreated}, обновлено: ${sessionsUpdated}, скважин создано: ${boreholesCreated}`,
      'thermo.import_xlsx'
    );

    onImportComplete();
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-2xl w-[700px] max-h-[90vh] flex flex-col">
        {/* Заголовок */}
        <div className="px-4 py-3 border-b border-[#c0c0c0] bg-[#e8e8e8] flex items-center justify-between">
          <h2 className="text-base font-bold">📥 Импорт термометрии из Excel</h2>
          <button
            onClick={onClose}
            className="px-3 py-1 text-sm bg-white border border-[#c0c0c0] rounded hover:bg-[#e8e8ff]"
          >
            ✕ Закрыть
          </button>
        </div>

        {/* Содержимое */}
        <div className="flex-1 overflow-auto p-4">
          {!preview ? (
            <>
              {/* Выбор файла */}
              <div className="mb-4">
                <label className="block text-sm font-semibold mb-2">Выберите файл Excel:</label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isProcessing}
                  className="px-4 py-2 text-sm bg-[#4472c4] text-white rounded hover:bg-[#3060b0] disabled:bg-gray-300"
                >
                  {isProcessing ? '⏳ Обработка...' : '📂 Выбрать файл'}
                </button>
                {fileName && (
                  <span className="ml-3 text-sm text-[#808080]">{fileName}</span>
                )}
              </div>

              {/* Ошибка */}
              {error && (
                <div className="p-3 bg-red-50 border border-red-300 rounded text-sm text-red-800 whitespace-pre-wrap">
                  ❌ {error}
                </div>
              )}

              {/* Подсказка */}
              <div className="mt-4 p-3 bg-blue-50 border border-blue-300 rounded text-xs text-blue-800">
                <strong>Ожидаемая структура файла:</strong>
                <ul className="list-disc list-inside mt-2 space-y-1">
                  <li>Строка 1: Заголовки (Дата, № скважины, Глубина замера, м...)</li>
                  <li>Строка 2: Числовая сетка глубин (0.5, 1.0, 1.5, ...)</li>
                  <li>Строки 3+: Данные (дата, номер скважины, температуры по глубинам)</li>
                </ul>
              </div>
            </>
          ) : (
            <>
              {/* Предпросмотр */}
              <div className="mb-4">
                <h3 className="text-sm font-bold mb-2">📊 Предпросмотр импорта</h3>
                
                <div className="grid grid-cols-3 gap-3 mb-4">
                  <div className="p-3 bg-green-50 border border-green-300 rounded">
                    <div className="text-xs text-green-700">Сессий для импорта</div>
                    <div className="text-2xl font-bold text-green-900">{preview.sessions.length}</div>
                  </div>
                  <div className="p-3 bg-blue-50 border border-blue-300 rounded">
                    <div className="text-xs text-blue-700">Всего замеров</div>
                    <div className="text-2xl font-bold text-blue-900">{preview.totalMeasurements}</div>
                  </div>
                  <div className="p-3 bg-yellow-50 border border-yellow-300 rounded">
                    <div className="text-xs text-yellow-700">Скважин будет создано</div>
                    <div className="text-2xl font-bold text-yellow-900">{preview.createdBoreholes.length}</div>
                  </div>
                </div>

                {/* Предупреждения */}
                {preview.warnings.length > 0 && (
                  <div className="mb-4">
                    <h4 className="text-xs font-semibold mb-2 text-orange-700">⚠️ Предупреждения:</h4>
                    <div className="max-h-40 overflow-auto border border-orange-300 rounded p-2 bg-orange-50">
                      {preview.warnings.map((warning, index) => (
                        <div key={index} className="text-xs text-orange-800 mb-1">
                          • {warning}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Информация о файле */}
                <div className="text-xs text-[#808080]">
                  Файл: <strong>{fileName}</strong>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Кнопки действий */}
        {preview && (
          <div className="px-4 py-3 border-t border-[#c0c0c0] bg-[#f5f5f5] flex justify-end gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm bg-white border border-[#c0c0c0] rounded hover:bg-[#e8e8ff]"
            >
              Отмена
            </button>
            <button
              onClick={handleImport}
              className="px-4 py-2 text-sm bg-[#28a745] text-white rounded hover:bg-[#218838]"
            >
              ✓ Импортировать
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
// Конец файла
