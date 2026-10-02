// Вкладка "Термометрия" - компонент таблицы с двумя ориентациями
// Этап 7: Термометрия с импортом/экспортом

import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { Borehole, ThermoSession, GeoLogData } from '../core/dataStore';
import { Journal } from '../core/journal';

interface Props {
  boreholes: Borehole[];
  selectedBoreholeId?: string | null;
  onSelectBorehole?: (id: string) => void;
}

type Orientation = 'horizontal' | 'vertical';

export default function ThermoTable({ boreholes, selectedBoreholeId, onSelectBorehole }: Props) {
  const [orientation, setOrientation] = useState<Orientation>('horizontal');
  const [editingCell, setEditingCell] = useState<{ sessionId: string; depth: number } | null>(null);
  const [editValue, setEditValue] = useState<string>('');
  const [newDepthValue, setNewDepthValue] = useState<string>('');
  const [localSelectedBoreholeId, setLocalSelectedBoreholeId] = useState<string>('all');
  const [refreshKey, setRefreshKey] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // Получение всех сессий термометрии
  const allSessions = useMemo(() => {
    const sessions = GeoLogData.getAllThermoSessions();
    console.log('ThermoTable: получены сессии', { 
      sessionsCount: sessions.length, 
      boreholesCount: boreholes.length,
      localSelectedBoreholeId 
    });
    return sessions;
  }, [boreholes, refreshKey, localSelectedBoreholeId]);

  // Фильтрация сессий: показываем только последнюю сессию для каждой скважины
  const filteredSessions = useMemo(() => {
    let sessions = allSessions;
    
    // Фильтруем по выбранной скважине, если выбрана конкретная
    if (localSelectedBoreholeId && localSelectedBoreholeId !== 'all') {
      sessions = sessions.filter(s => s.boreholeId === localSelectedBoreholeId);
    }
    
    // Группируем по скважине и берем только последнюю сессию для каждой
    const latestByBorehole = new Map<string, typeof allSessions[0]>();
    sessions.forEach(session => {
      const existing = latestByBorehole.get(session.boreholeId);
      if (!existing || new Date(session.date) > new Date(existing.date)) {
        latestByBorehole.set(session.boreholeId, session);
      }
    });
    
    return Array.from(latestByBorehole.values());
  }, [allSessions, localSelectedBoreholeId]);

  // Получение всех уникальных глубин
  const allDepths = useMemo(() => {
    return GeoLogData.getAllThermoDepths();
  }, [boreholes]);

  // Получение температуры для сессии и глубины
  const getTemperature = useCallback((sessionId: string, depth: number): number | undefined => {
    const session = allSessions.find(s => s.id === sessionId);
    if (!session) return undefined;
    const measurement = session.measurements.find(m => m.depth === depth);
    return measurement?.temperature;
  }, [allSessions]);

  // Обновление температуры
  const handleTemperatureChange = useCallback((sessionId: string, depth: number, value: string) => {
    const session = allSessions.find(s => s.id === sessionId);
    if (!session) return;

    const borehole = boreholes.find(b => b.id === session.boreholeId);
    if (!borehole) return;

    const numValue = parseFloat(value.replace(',', '.'));
    
    // Обновляем или добавляем измерение
    const updatedMeasurements = session.measurements.filter(m => m.depth !== depth);
    if (value.trim() !== '' && !isNaN(numValue)) {
      updatedMeasurements.push({ depth, temperature: numValue });
      updatedMeasurements.sort((a, b) => a.depth - b.depth);
    }

    GeoLogData.updateThermoSession(borehole.id, sessionId, { measurements: updatedMeasurements });
    Journal.logEvent('command', `Обновлена температура на глубине ${depth}м для сессии ${sessionId}`, 'thermo.update');
    
    // Принудительно обновляем данные
    setRefreshKey(prev => prev + 1);
  }, [allSessions, boreholes]);

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

  // Добавление новой сессии
  const handleAddSession = useCallback(() => {
    console.log('handleAddSession вызвана', { localSelectedBoreholeId, boreholesCount: boreholes.length });
    
    const boreholeId = localSelectedBoreholeId && localSelectedBoreholeId !== 'all' 
      ? localSelectedBoreholeId 
      : boreholes[0]?.id;
    
    console.log('Выбран boreholeId:', boreholeId);
    
    if (!boreholeId) {
      console.error('Нет доступных скважин!');
      alert('Нет доступных скважин');
      return;
    }

    try {
      const newSession = GeoLogData.addThermoSession(boreholeId, {
        date: new Date().toISOString().split('T')[0],
        campaign: '',
        measurements: [],
        provenance: { type: 'manual' },
      });
      console.log('Сессия добавлена:', newSession);
      Journal.logEvent('command', `Добавлена новая термометрическая сессия`, 'thermo.add_session');
      
      // Принудительно обновляем данные
      setRefreshKey(prev => prev + 1);
    } catch (error) {
      console.error('Ошибка при добавлении сессии:', error);
      alert('Ошибка при добавлении замера: ' + (error as Error).message);
    }
  }, [localSelectedBoreholeId, boreholes]);

  // Удаление сессии
  const handleDeleteSession = useCallback((sessionId: string) => {
    const session = allSessions.find(s => s.id === sessionId);
    if (!session) return;

    if (!confirm('Удалить эту термометрическую сессию?')) return;

    GeoLogData.deleteThermoSession(session.boreholeId, sessionId);
    Journal.logEvent('command', `Удалена термометрическая сессия ${sessionId}`, 'thermo.delete_session');
    
    // Принудительно обновляем данные
    setRefreshKey(prev => prev + 1);
  }, [allSessions]);

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
            onClick={() => {
              console.log('Кнопка нажата!', { localSelectedBoreholeId, boreholes });
              handleAddSession();
            }}
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
                    <button
                      onClick={() => handleDeleteSession(session.id)}
                      className="text-red-600 hover:text-red-800"
                    >
                      🗑️
                    </button>
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
    </div>
  );
}
