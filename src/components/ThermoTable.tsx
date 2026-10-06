// Вкладка "Термометрия" - компонент таблицы с двумя ориентациями
// Этап 7: Термометрия с импортом/экспортом

import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { Borehole, ThermoSession, GeoLogData } from '../core/dataStore';
import { Journal } from '../core/journal';
import { exportToExcel } from '../utils/thermoExport';
import ThermoExportDialog from './ThermoExportDialog';
import ThermoImportDialog from './ThermoImportDialog';

interface Props {
  borehole?: Borehole | null;
  boreholes: Borehole[];
  boreholeId?: string | null;
  selectedBoreholeId?: string | null;
  onSelectBorehole?: (id: string) => void;
  onUpdate?: (data?: any, boreholeId?: string) => void;
}

type Orientation = 'horizontal' | 'vertical';

export default function ThermoTable({ borehole, boreholes, boreholeId, selectedBoreholeId, onSelectBorehole, onUpdate }: Props) {
  const [orientation, setOrientation] = useState<Orientation>('horizontal');
  const [editingCell, setEditingCell] = useState<{ sessionId: string; depth: number } | null>(null);
  const [editValue, setEditValue] = useState<string>('');
  const [newDepthValue, setNewDepthValue] = useState<string>('');
  const [localSelectedBoreholeId, setLocalSelectedBoreholeId] = useState<string>('all');
  const [refreshKey, setRefreshKey] = useState(0);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Получение всех сессий термометрии
  const allSessions = useMemo(() => {
    return GeoLogData.getAllThermoSessions();
  }, [boreholes, refreshKey]);

  // Сброс pendingDeleteId при изменении данных
  useEffect(() => {
    setPendingDeleteId(null);
  }, [allSessions]);

  // Фильтрация сессий: показываем все сессии для выбранной скважины
  const filteredSessions = useMemo(() => {
    let sessions = allSessions;
    
    // Фильтруем по выбранной скважине, если выбрана конкретная
    if (localSelectedBoreholeId && localSelectedBoreholeId !== 'all') {
      sessions = sessions.filter(s => s.boreholeId === localSelectedBoreholeId);
    }
    
    // Показываем все сессии, сортируя по дате (новые сверху)
    return sessions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [allSessions, localSelectedBoreholeId]);

  // Получение всех уникальных глубин
  const allDepths = useMemo(() => {
    return GeoLogData.getAllThermoDepths();
  }, [boreholes, refreshKey]);

  // Получение температуры для сессии и глубины
  const getTemperature = useCallback((sessionId: string, depth: number): number | undefined => {
    const session = allSessions.find(s => s.id === sessionId);
    if (!session) return undefined;
    const measurement = session.measurements.find(m => m.depth === depth);
    return measurement?.temperature;
  }, [allSessions]);

  // Обновление температуры (точно как в WaterLayersTable)
  const handleTemperatureChange = useCallback((sessionId: string, depth: number, value: string) => {
    const session = allSessions.find(s => s.id === sessionId);
    if (!session) return;

    // Используем текущую скважину или находим скважину
    const targetBorehole = borehole || boreholes.find(b => b.id === session.boreholeId);
    if (!targetBorehole) return;

    const numValue = parseFloat(value.replace(',', '.'));
    
    // Обновляем или добавляем измерение
    const updatedMeasurements = session.measurements.filter(m => m.depth !== depth);
    if (value.trim() !== '' && !isNaN(numValue)) {
      updatedMeasurements.push({ depth, temperature: numValue });
      updatedMeasurements.sort((a, b) => a.depth - b.depth);
    }

    // Создаем обновленный массив сессий
    const updatedSessions = (targetBorehole.thermoSessions || []).map(s => 
      s.id === sessionId ? { ...s, measurements: updatedMeasurements } : s
    );

    // Обновляем данные через onUpdate (как в WaterLayersTable)
    if (onUpdate) {
      onUpdate({ thermoSessions: updatedSessions }, targetBorehole.id);
    }
    
    Journal.logEvent('command', `Обновлена температура на глубине ${depth}м для сессии ${sessionId}`, 'thermo.update');
    
    // Принудительно обновляем данные
    setRefreshKey(prev => prev + 1);
  }, [allSessions, borehole, boreholes, onUpdate]);

  // Добавление новой глубины
  const handleAddDepth = useCallback(() => {
    const depth = parseFloat(newDepthValue.replace(',', '.'));
    if (isNaN(depth) || depth < 0) return;

    // Проверяем, существует ли уже такая глубина
    if (allDepths.includes(depth)) {
      alert(`Глубина ${depth}м уже существует`);
      return;
    }

    setNewDepthValue('');
    Journal.logEvent('command', `Добавлена новая глубина ${depth}м`, 'thermo.add_depth');
  }, [newDepthValue, allDepths]);

  // Добавление новой сессии (точно как в WaterLayersTable)
  const handleAddSession = useCallback(() => {
    const targetBoreholeId = localSelectedBoreholeId && localSelectedBoreholeId !== 'all' 
      ? localSelectedBoreholeId 
      : boreholeId || boreholes[0]?.id;
    
    if (!targetBoreholeId) {
      alert('Нет доступных скважин');
      return;
    }

    try {
      // Используем текущую скважину или находим скважину
      const targetBorehole = borehole || boreholes.find(b => b.id === targetBoreholeId);
      if (!targetBorehole) {
        alert('Скважина не найдена');
        return;
      }

      // Создаем новую сессию
      const newSession: ThermoSession = {
        id: 'ts-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 8),
        boreholeId: targetBoreholeId,
        date: new Date().toISOString().split('T')[0],
        campaign: '',
        measurements: [],
        provenance: { type: 'manual' },
      };

      // Добавляем сессию в массив
      const updatedSessions = [...(targetBorehole.thermoSessions || []), newSession];
      
      // Обновляем данные через onUpdate (как в WaterLayersTable)
      if (onUpdate) {
        onUpdate({ thermoSessions: updatedSessions }, targetBoreholeId);
      }
      
      Journal.logEvent('command', `Добавлена новая термометрическая сессия`, 'thermo.add_session');
      
      // Принудительно обновляем данные
      setRefreshKey(prev => prev + 1);
    } catch (error) {
      alert('Ошибка при добавлении замера: ' + (error as Error).message);
    }
  }, [localSelectedBoreholeId, borehole, boreholeId, boreholes, onUpdate]);

  // Удаление сессии - прямой вызов GeoLogData без onUpdate
  const handleDeleteSession = useCallback((sessionId: string) => {
    // Находим скважину, которой принадлежит сессия
    const foundBorehole = boreholes.find(bh => 
      bh.thermoSessions?.some(s => s.id === sessionId)
    );

    if (!foundBorehole) {
      return;
    }

    // Прямое удаление из верхней коллекции через GeoLogData
    const result = GeoLogData.deleteThermoSession(foundBorehole.id, sessionId);
    
    if (result) {
      Journal.logEvent('command', `Удалена термометрическая сессия ${sessionId}`, 'thermo.delete_session');
      
      // Принудительно обновляем данные
      setRefreshKey(prev => prev + 1);
    }
  }, [boreholes]);

  // Обработчик начала редактирования ячейки
  const handleCellClick = useCallback((sessionId: string, depth: number) => {
    setEditingCell({ sessionId, depth });
    const temp = getTemperature(sessionId, depth);
    setEditValue(temp !== undefined ? temp.toString() : '');
  }, [getTemperature]);

  // Обработчик завершения редактирования
  const handleCellBlur = useCallback(() => {
    if (editingCell) {
      handleTemperatureChange(editingCell.sessionId, editingCell.depth, editValue);
      setEditingCell(null);
      setEditValue('');
    }
  }, [editingCell, editValue, handleTemperatureChange]);

  // Обработчик клавиш
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleCellBlur();
    } else if (e.key === 'Escape') {
      setEditingCell(null);
      setEditValue('');
    } else if (e.key === 'Tab') {
      e.preventDefault();
      handleCellBlur();
      // Переход к следующей ячейке будет реализован позже
    }
  }, [handleCellBlur]);

  // Фокус на input при начале редактирования
  useEffect(() => {
    if (editingCell && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editingCell]);

  // Экспорт в Excel (XLSX)
  const handleExportExcel = useCallback(async () => {
    const selectedBoreholeIds = localSelectedBoreholeId && localSelectedBoreholeId !== 'all'
      ? [localSelectedBoreholeId]
      : undefined;
    
    await exportToExcel(boreholes, allSessions, selectedBoreholeIds);
    
    Journal.logEvent('command', 'Экспорт термометрии в Excel', 'thermo.export_excel');
  }, [boreholes, allSessions, localSelectedBoreholeId]);

  const inputClass = "w-full px-1 py-0.5 text-xs border border-blue-400 bg-white rounded focus:outline-none";
  const cellClass = "px-1 py-0.5 text-xs border-r border-b border-[#e8e8e8] cursor-pointer hover:bg-[#f0f0ff] min-w-[60px] text-center";
  const headerClass = "px-1 py-0.5 text-xs border-r border-b border-[#c0c0c0] bg-[#e8e8e8] font-semibold text-center sticky top-0 z-10";
  const fixedHeaderClass = "px-1 py-0.5 text-xs border-r border-b border-[#c0c0c0] bg-[#e8e8e8] font-semibold text-center sticky left-0 z-20";

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Панель инструментов */}
      <div className="flex items-center gap-2 px-2 py-1 bg-[#f5f5f5] border-b border-[#c0c0c0]">
        {/* Переключатель ориентации */}
        <div className="flex gap-1">
          <button
            onClick={() => setOrientation('horizontal')}
            className={`px-2 py-1 text-xs border rounded ${orientation === 'horizontal' ? 'bg-blue-500 text-white' : 'bg-white'}`}
          >
            По горизонтали
          </button>
          <button
            onClick={() => setOrientation('vertical')}
            className={`px-2 py-1 text-xs border rounded ${orientation === 'vertical' ? 'bg-blue-500 text-white' : 'bg-white'}`}
          >
            По вертикали
          </button>
        </div>

        <div className="w-px h-6 bg-[#c0c0c0] mx-2" />

        {/* Селектор скважины */}
        <label className="text-xs font-semibold">Скважина:</label>
        <select
          value={localSelectedBoreholeId}
          onChange={(e) => setLocalSelectedBoreholeId(e.target.value)}
          className="px-2 py-1 text-xs border border-[#c0c0c0] rounded bg-white"
        >
          <option value="all">Все скважины</option>
          {boreholes.map(bh => (
            <option key={bh.id} value={bh.id}>{bh.number}</option>
          ))}
        </select>

        <div className="w-px h-6 bg-[#c0c0c0] mx-2" />

        {/* Добавление глубины */}
        <label className="text-xs font-semibold">Глубина, м:</label>
        <input
          type="text"
          value={newDepthValue}
          onChange={(e) => setNewDepthValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              handleAddDepth();
            }
          }}
          className="px-2 py-1 text-xs border border-[#c0c0c0] rounded bg-white w-20"
          placeholder="0.5"
        />
        <button
          onClick={handleAddDepth}
          className="px-2 py-1 text-xs bg-[#4472c4] text-white rounded hover:bg-[#3060b0]"
        >
          + глубина
        </button>

        <div className="ml-auto flex gap-2">
          <button
            onClick={() => setShowExportDialog(true)}
            className="px-2 py-1 text-xs bg-[#28a745] text-white rounded hover:bg-[#218838]"
            title="Экспорт в AutoCAD (DXF)"
          >
            📐 Экспорт в DXF (AutoCAD)
          </button>
          <button
            onClick={handleExportExcel}
            className="px-2 py-1 text-xs bg-[#17a2b8] text-white rounded hover:bg-[#138496]"
            title="Экспорт в Excel (XLSX)"
          >
            📊 Экспорт в Эксель
          </button>
          <button
            onClick={() => setShowImportDialog(true)}
            className="px-2 py-1 text-xs bg-[#6f42c1] text-white rounded hover:bg-[#5a32a3]"
            title="Импорт из Excel (XLSX)"
          >
            📥 Импорт из Excel
          </button>
          <button
            onClick={handleAddSession}
            className="px-2 py-1 text-xs bg-[#4472c4] text-white rounded hover:bg-[#3060b0]"
          >
            {localSelectedBoreholeId && localSelectedBoreholeId !== 'all' 
              ? `+ Добавить замер для ${boreholes.find(b => b.id === localSelectedBoreholeId)?.number || 'скважины'}`
              : '+ Добавить замер'
            }
          </button>
        </div>
      </div>

      {/* Таблица */}
      <div className="flex-1 overflow-auto">
        {filteredSessions.length === 0 ? (
          <div className="flex items-center justify-center h-full text-[#808080]">
            Нет данных для отображения. Добавьте термометрические сессии.
          </div>
        ) : orientation === 'horizontal' ? (
          // Горизонтальная ориентация
          <table className="text-xs border-collapse" style={{ tableLayout: 'auto' }}>
            <thead>
              <tr>
                <th className={fixedHeaderClass} style={{ left: '0px', minWidth: '100px' }}>Дата</th>
                <th className={fixedHeaderClass} style={{ left: '100px', minWidth: '80px' }}>№ скважины</th>
                {allDepths.map(depth => (
                  <th key={depth} className={headerClass} style={{ minWidth: '60px' }}>
                    {depth}м
                  </th>
                ))}
                <th className={headerClass} style={{ minWidth: '50px' }}>Действия</th>
              </tr>
            </thead>
            <tbody>
              {filteredSessions.map(session => (
                <tr key={session.id}>
                  <td className={fixedHeaderClass} style={{ left: '0px' }}>
                    {session.date}
                  </td>
                  <td className={fixedHeaderClass} style={{ left: '100px' }}>
                    {session.boreholeNumber}
                  </td>
                  {allDepths.map(depth => {
                    const temp = getTemperature(session.id, depth);
                    const isEditing = editingCell?.sessionId === session.id && editingCell?.depth === depth;
                    
                    return (
                      <td
                        key={depth}
                        className={cellClass}
                        onClick={() => handleCellClick(session.id, depth)}
                      >
                        {isEditing ? (
                          <input
                            ref={inputRef}
                            type="text"
                            className={inputClass}
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            onBlur={handleCellBlur}
                            onKeyDown={handleKeyDown}
                          />
                        ) : (
                          temp !== undefined ? temp.toFixed(1) : ''
                        )}
                      </td>
                    );
                  })}
                  <td className={cellClass}>
                    {pendingDeleteId === session.id ? (
                      <button
                        onClick={() => {
                          handleDeleteSession(session.id);
                          setPendingDeleteId(null);
                        }}
                        className="text-red-600 hover:text-red-800 font-bold"
                        title="Подтвердить удаление"
                      >
                        Точно?
                      </button>
                    ) : (
                      <button
                        onClick={() => setPendingDeleteId(session.id)}
                        className="text-red-600 hover:text-red-800"
                        title="Удалить этот замер"
                      >
                        🗑️
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          // Вертикальная ориентация
          <table className="text-xs border-collapse" style={{ tableLayout: 'auto' }}>
            <thead>
              <tr>
                <th className={fixedHeaderClass} style={{ left: '0px', minWidth: '80px' }}>Глубина, м</th>
                {filteredSessions.map(session => (
                  <th key={session.id} className={headerClass} style={{ minWidth: '100px' }}>
                    <div>{session.boreholeNumber}</div>
                    <div className="text-[10px] font-normal">{session.date}</div>
                  </th>
                ))}
              </tr>
              {/* Строка с кнопками удаления столбцов */}
              <tr>
                <th className={fixedHeaderClass} style={{ left: '0px', minWidth: '80px' }}></th>
                {filteredSessions.map(session => (
                  <th key={`delete-${session.id}`} className={headerClass} style={{ minWidth: '100px' }}>
                    {pendingDeleteId === session.id ? (
                      <button
                        onClick={() => {
                          handleDeleteSession(session.id);
                          setPendingDeleteId(null);
                        }}
                        className="text-red-600 hover:text-red-800 text-xs px-2 py-1 font-bold"
                        title="Подтвердить удаление"
                      >
                        Точно удалить?
                      </button>
                    ) : (
                      <button
                        onClick={() => setPendingDeleteId(session.id)}
                        className="text-red-600 hover:text-red-800 text-xs px-2 py-1"
                        title="Удалить этот замер"
                      >
                        🗑️ Удалить
                      </button>
                    )}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {allDepths.map(depth => (
                <tr key={depth}>
                  <td className={fixedHeaderClass} style={{ left: '0px' }}>
                    {depth}м
                  </td>
                  {filteredSessions.map(session => {
                    const temp = getTemperature(session.id, depth);
                    const isEditing = editingCell?.sessionId === session.id && editingCell?.depth === depth;
                    
                    return (
                      <td
                        key={session.id}
                        className={cellClass}
                        onClick={() => handleCellClick(session.id, depth)}
                      >
                        {isEditing ? (
                          <input
                            ref={inputRef}
                            type="text"
                            className={inputClass}
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            onBlur={handleCellBlur}
                            onKeyDown={handleKeyDown}
                          />
                        ) : (
                          temp !== undefined ? temp.toFixed(1) : ''
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Диалог экспорта в DXF */}
      {showExportDialog && (
        <ThermoExportDialog
          boreholes={boreholes}
          sessions={allSessions}
          onClose={() => setShowExportDialog(false)}
        />
      )}

      {/* Диалог импорта из Excel */}
      {showImportDialog && (
        <ThermoImportDialog
          boreholes={boreholes}
          onClose={() => setShowImportDialog(false)}
          onImportComplete={() => {
            setRefreshKey(prev => prev + 1);
            if (onUpdate) {
              onUpdate({});
            }
          }}
        />
      )}
    </div>
  );
}
