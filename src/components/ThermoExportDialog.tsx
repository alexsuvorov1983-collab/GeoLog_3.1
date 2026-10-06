// Диалог экспорта термометрии в DXF (AutoCAD)
// Этап 7: Экспорт в AutoCAD (rev.3)

import { useState, useMemo } from 'react';
import { Borehole, ThermoSession } from '../core/dataStore';
import { Journal } from '../core/journal';
import {
  buildDXF,
  downloadDXF,
  downloadDXFDataUrl,
  fmtDate,
  DxRow,
  ScaleMode,
  DateMode
} from '../utils/dxfGenerator';

interface Props {
  boreholes: Borehole[];
  sessions: ThermoSession[];
  onClose: () => void;
}

export default function ThermoExportDialog({ boreholes, sessions, onClose }: Props) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set(sessions.map(s => s.id)));
  const [scaleMode, setScaleMode] = useState<ScaleMode>('1:100');
  const [dateMode, setDateMode] = useState<DateMode>('dmy4');
  const [showDxfModal, setShowDxfModal] = useState(false);
  const [dxfText, setDxfText] = useState('');

  // Подготовка данных для отображения
  const exportEntries = useMemo(() => {
    return sessions.map(session => {
      const borehole = boreholes.find(b => b.id === session.boreholeId);
      const name = borehole ? borehole.number : 'Неизвестная';
      const date = fmtDate(session.date, dateMode);
      const hasData = session.measurements.length > 0;
      return { session, name, date, hasData };
    });
  }, [boreholes, sessions, dateMode]);

  // Обработка выбора/снятия всех
  const handleSelectAll = () => {
    setSelectedIds(new Set(sessions.map(s => s.id)));
  };

  const handleDeselectAll = () => {
    setSelectedIds(new Set());
  };

  // Обработка выбора одной сессии
  const handleToggleSession = (id: string) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedIds(newSet);
  };

  // Генерация DXF с логами и аварийным выводом
  const handleExport = () => {
    console.log('[DXF] 1 клик, масштаб:', scaleMode, 'формат даты:', dateMode);
    
    const rows: DxRow[] = sessions
      .filter(s => selectedIds.has(s.id) && s.measurements.length > 0)
      .map(s => ({
        name: String(boreholes.find(b => b.id === s.boreholeId)?.number ?? '-'),
        date: s.date,
        points: s.measurements.map(m => ({ depth: m.depth, t: m.temperature })),
      }));
    
    console.log('[DXF] 2 строк с замерами:', rows.length);
    
    if (rows.length === 0) {
      alert('Не отмечено ни одной сессии с замерами');
      return;
    }

    const dxf = buildDXF(rows, scaleMode, dateMode);
    console.log('[DXF] 3 длина строки:', dxf.length, '| начало:', JSON.stringify(dxf.slice(0, 24)));
    
    const fname = 'Thermometry_' + new Date().toISOString().slice(0, 10) + '.dxf';
    
    if (!downloadDXF(dxf, fname)) {
      downloadDXFDataUrl(dxf, fname);
    }
    
    setDxfText(dxf);
    setShowDxfModal(true);

    Journal.logEvent('command', 
      `Экспортировано ${rows.length} сессий в DXF (масштаб ${scaleMode})`, 
      'thermo.export_dxf'
    );
  };

  // Копирование DXF в буфер обмена
  const handleCopyDxf = async () => {
    try {
      await navigator.clipboard.writeText(dxfText);
      alert('DXF скопирован в буфер обмена');
    } catch (err) {
      console.error('Ошибка копирования:', err);
      alert('Не удалось скопировать');
    }
  };

  const selectedCount = selectedIds.size;
  const canGenerate = selectedCount > 0;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-2xl w-[800px] max-h-[90vh] flex flex-col">
        {/* Заголовок */}
        <div className="px-4 py-3 border-b border-[#c0c0c0] bg-[#e8e8e8] flex items-center justify-between">
          <h2 className="text-base font-bold">📐 Экспорт термометрии в AutoCAD (DXF)</h2>
          <button
            onClick={onClose}
            className="px-3 py-1 text-sm bg-white border border-[#c0c0c0] rounded hover:bg-[#e8e8ff]"
          >
            ✕ Закрыть
          </button>
        </div>

        {/* Панель управления */}
        <div className="px-4 py-3 border-b border-[#c0c0c0] bg-[#f5f5f5]">
          <div className="flex items-center gap-4 flex-wrap">
            {/* Кнопки выбора */}
            <button
              onClick={handleSelectAll}
              className="px-3 py-1 text-xs bg-[#4472c4] text-white rounded hover:bg-[#3060b0]"
            >
              ✓ Выбрать все
            </button>
            <button
              onClick={handleDeselectAll}
              className="px-3 py-1 text-xs bg-white border border-[#c0c0c0] rounded hover:bg-[#e8e8ff]"
            >
              ✗ Снять все
            </button>

            <div className="w-px h-6 bg-[#c0c0c0]" />

            {/* Масштаб */}
            <label className="text-xs font-semibold flex items-center gap-2">
              Масштаб:
              <select
                value={scaleMode}
                onChange={(e) => setScaleMode(e.target.value as ScaleMode)}
                className="px-2 py-1 text-xs border border-[#c0c0c0] rounded bg-white"
              >
                <option value="1:100">1:100</option>
                <option value="1:200">1:200</option>
                <option value="both">оба (1:100 слева, 1:200 справа)</option>
              </select>
            </label>

            <div className="w-px h-6 bg-[#c0c0c0]" />

            {/* Формат даты */}
            <label className="text-xs font-semibold flex items-center gap-2">
              Дата в таблице:
              <select
                value={dateMode}
                onChange={(e) => setDateMode(e.target.value as DateMode)}
                className="px-2 py-1 text-xs border border-[#c0c0c0] rounded bg-white"
              >
                <option value="dmy4">03.07.2026 (как в Excel RU)</option>
                <option value="dmy2">03.07.26</option>
                <option value="mdy2">7/3/26 (как в файле)</option>
              </select>
            </label>

            <div className="ml-auto">
              <button
                onClick={handleExport}
                disabled={!canGenerate}
                className={`px-4 py-1.5 text-xs rounded ${
                  canGenerate
                    ? 'bg-[#28a745] text-white hover:bg-[#218838]'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                📐 Сгенерировать DXF ({selectedCount})
              </button>
            </div>
          </div>
        </div>

        {/* Список сессий */}
        <div className="flex-1 overflow-auto px-4 py-3">
          {exportEntries.length === 0 ? (
            <div className="text-center text-[#808080] py-8">
              Нет данных для экспорта
            </div>
          ) : (
            <table className="w-full text-xs border-collapse">
              <thead className="sticky top-0 bg-[#e8e8e8]">
                <tr>
                  <th className="px-2 py-1 text-left border-b border-[#c0c0c0] w-10">✓</th>
                  <th className="px-2 py-1 text-left border-b border-[#c0c0c0]">№ скважины</th>
                  <th className="px-2 py-1 text-left border-b border-[#c0c0c0]">Дата</th>
                  <th className="px-2 py-1 text-center border-b border-[#c0c0c0]">Замеров</th>
                </tr>
              </thead>
              <tbody>
                {exportEntries.map(({ session, name, date, hasData }) => (
                  <tr
                    key={session.id}
                    className={`border-b border-[#e8e8e8] ${
                      selectedIds.has(session.id) ? 'bg-[#e0f0ff]' : ''
                    } ${!hasData ? 'opacity-50' : ''}`}
                  >
                    <td className="px-2 py-1">
                      <input
                        type="checkbox"
                        checked={selectedIds.has(session.id)}
                        onChange={() => handleToggleSession(session.id)}
                        className="w-4 h-4"
                      />
                    </td>
                    <td className="px-2 py-1 font-semibold">{name}</td>
                    <td className="px-2 py-1">{date}</td>
                    <td className="px-2 py-1 text-center">
                      {hasData ? session.measurements.length : 'нет данных'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Подвал */}
        <div className="px-4 py-2 border-t border-[#c0c0c0] bg-[#f5f5f5] text-xs text-[#808080]">
          Все объекты будут размещены в слое «ИИ_Термометрия». Откройте DXF в AutoCAD и выполните ZE+Enter.
        </div>
      </div>

      {/* Модалка "Показать DXF" */}
      {showDxfModal && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-[60]">
          <div className="bg-white rounded-lg shadow-2xl w-[90%] max-w-4xl h-[80vh] flex flex-col">
            <div className="px-4 py-3 border-b border-[#c0c0c0] bg-[#e8e8e8] flex items-center justify-between">
              <h3 className="text-base font-bold">📄 Содержимое DXF файла</h3>
              <div className="flex gap-2">
                <button
                  onClick={handleCopyDxf}
                  className="px-3 py-1 text-xs bg-[#4472c4] text-white rounded hover:bg-[#3060b0]"
                >
                  📋 Копировать
                </button>
                <button
                  onClick={() => setShowDxfModal(false)}
                  className="px-3 py-1 text-xs bg-white border border-[#c0c0c0] rounded hover:bg-[#e8e8ff]"
                >
                  ✕ Закрыть
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-auto p-4">
              <textarea
                readOnly
                value={dxfText}
                className="w-full h-full font-mono text-xs border border-[#c0c0c0] rounded p-2 resize-none"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
