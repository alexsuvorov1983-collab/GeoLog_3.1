import { useState, useMemo, useEffect, useRef } from 'react';
import { Borehole, WaterLayer, GeoLogData } from '../core/dataStore';
import { Journal } from '../core/journal';
import { useColumnResize, ColumnResizer } from './ResizableTable';

interface Props {
  borehole: Borehole;
  boreholeId: string;
  onUpdate: (data: Partial<Borehole>) => void;
  onSelectBorehole?: (id: string) => void;
}

export default function WaterLayersTable({ borehole, boreholeId, onUpdate, onSelectBorehole }: Props) {
  const [selectedLayerId, setSelectedLayerId] = useState<string | null>(null);
  const [inputValues, setInputValues] = useState<Record<string, Record<string, string>>>({});
  const [focusTarget, setFocusTarget] = useState<{ layerId: string; field: string } | null>(null);
  const inputRefs = useRef<Record<string, HTMLInputElement | null>>({});
  const allBoreholes = GeoLogData.getAll();

  // Колонки таблицы
  const columns = [
    { key: 'upv', label: 'УППВ, м' },
    { key: 'uuv', label: 'УУПВ, м' },
    { key: 'bottom', label: 'Подошва, м' },
    { key: 'horizon', label: 'ВГ' },
    { key: 'upvDate', label: 'Дата УППВ' },
    { key: 'uuvDate', label: 'Дата УУПВ' },
    { key: 'pressure', label: 'Напор, м' },
    { key: 'depression', label: 'Понижение, м' },
    { key: 'samples', label: 'Пробы' },
    { key: 'actions', label: '' },
  ];

  const defaultWidths: Record<string, number> = {
    upv: 100,
    uuv: 100,
    bottom: 100,
    horizon: 80,
    upvDate: 110,
    uuvDate: 110,
    pressure: 100,
    depression: 100,
    samples: 120,
    actions: 50,
  };

  const { widths, handleMouseDown } = useColumnResize(columns.map(c => c.key), defaultWidths);

  // Сортировка слоёв по ключу: upv || uuv || bottom || 0
  const sortedLayers = useMemo(() => {
    return [...(borehole.water_layers || [])].sort((a, b) => {
      const keyA = a.upv ?? a.uuv ?? a.bottom ?? 0;
      const keyB = b.upv ?? b.uuv ?? b.bottom ?? 0;
      return keyA - keyB;
    });
  }, [borehole.water_layers]);

  // Получение проб воды для слоя
  const getWaterSamplesForLayer = (layer: WaterLayer, index: number): number[] => {
    const samples = borehole.samples || [];
    const layers = sortedLayers;
    
    // Определяем интервал слоя
    const top = index === 0 ? 0 : (layers[index - 1].bottom ?? 0);
    const bottom = layer.bottom ?? Infinity;
    
    const depths: number[] = [];
    samples.forEach(sample => {
      if (sample.sample_type !== 'water') return;
      
      // Правило: верх < глубина ≤ низ
      if (sample.depth_m > top && sample.depth_m <= bottom) {
        depths.push(sample.depth_m);
      }
    });
    
    return depths.sort((a, b) => a - b);
  };

  // Форматирование списка глубин
  const formatDepths = (depths: number[]): string => {
    return depths.map(d => d.toFixed(2)).join('; ');
  };

  // Округление до двух знаков после запятой
  const roundToTwoDecimals = (value: number): number => {
    return Math.round(value * 100) / 100;
  };

  // Получение значения для отображения
  const getInputValue = (layerId: string, field: string, actualValue: number | string | undefined): string => {
    if (inputValues[layerId] && inputValues[layerId][field] !== undefined) {
      return inputValues[layerId][field];
    }
    if (actualValue === undefined || actualValue === null) {
      return '';
    }
    if (typeof actualValue === 'number') {
      return actualValue.toFixed(2);
    }
    return String(actualValue);
  };

  // Обработчик изменения значения
  const handleInputChange = (layerId: string, field: string, value: string) => {
    setInputValues(prev => ({
      ...prev,
      [layerId]: {
        ...prev[layerId],
        [field]: value
      }
    }));
  };

  // Обработчик потери фокуса
  const handleInputBlur = (layerId: string, field: string) => {
    const inputValue = inputValues[layerId]?.[field];
    if (inputValue === undefined || inputValue === '') {
      setInputValues(prev => {
        const newValues = { ...prev };
        if (newValues[layerId]) {
          delete newValues[layerId][field];
        }
        return newValues;
      });
      return;
    }

    const layer = borehole.water_layers?.find(l => l.id === layerId);
    if (!layer) return;

    const update: Partial<WaterLayer> = {};

    // Числовые поля
    if (['upv', 'uuv', 'bottom', 'pressure', 'depression'].includes(field)) {
      const normalizedValue = inputValue.replace(',', '.');
      const num = parseFloat(normalizedValue);
      if (!isNaN(num)) {
        (update as any)[field] = roundToTwoDecimals(num);
      }
    } else {
      // Текстовые поля (horizon, dates)
      (update as any)[field] = inputValue;
    }

    if (Object.keys(update).length > 0) {
      GeoLogData.updateWaterLayer(boreholeId, layerId, update);
      setInputValues(prev => {
        const newValues = { ...prev };
        if (newValues[layerId]) {
          delete newValues[layerId][field];
        }
        return newValues;
      });
    }
  };

  // Обработчик изменения чекбокса "Нет"
  const handleAbsentChange = (layerId: string, field: 'upvAbsent' | 'uuvAbsent', checked: boolean) => {
    GeoLogData.updateWaterLayer(boreholeId, layerId, { [field]: checked });
  };

  // Добавление нового слоя
  const handleAddLayer = (): string => {
    const newLayer = GeoLogData.addWaterLayer(boreholeId, {});
    return newLayer.id;
  };

  // Удаление слоя
  const handleDeleteLayer = (layerId: string) => {
    GeoLogData.deleteWaterLayer(boreholeId, layerId);
    if (selectedLayerId === layerId) {
      setSelectedLayerId(null);
    }
  };

  // Установка фокуса
  useEffect(() => {
    if (focusTarget) {
      const timer = setTimeout(() => {
        const key = `${focusTarget.layerId}_${focusTarget.field}`;
        if (inputRefs.current[key]) {
          inputRefs.current[key]?.focus();
          setFocusTarget(null);
        }
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [focusTarget]);

  const inputClass = "w-full px-1 py-1 text-sm border border-[#c0c0c0] bg-white rounded focus:border-blue-400 focus:outline-none";

  return (
    <div className="flex flex-col h-full">
      {/* Панель инструментов */}
      <div className="flex items-center gap-2 px-2 py-1 bg-[#f5f5f5] border-b border-[#c0c0c0]">
        <label className="text-sm font-semibold">Скважина:</label>
        <select
          value={boreholeId}
          onChange={(e) => onSelectBorehole?.(e.target.value)}
          className="px-2 py-1 text-sm border border-[#c0c0c0] rounded bg-white"
        >
          {allBoreholes.map(bh => (
            <option key={bh.id} value={bh.id}>{bh.number}</option>
          ))}
        </select>
      </div>

      {/* Таблица */}
      <div className="flex-1 overflow-auto">
        <table className="text-sm border-collapse w-full" style={{ tableLayout: 'fixed' }}>
          <thead className="sticky top-0 z-10">
            <tr className="bg-[#e8e8e8] border-b border-[#c0c0c0]">
              {columns.map(col => (
                <th
                  key={col.key}
                  className="px-1 py-1 text-center border-r border-[#c0c0c0] font-semibold relative"
                  style={{ width: `${widths[col.key] || 100}px` }}
                >
                  {col.label}
                  {col.key !== 'actions' && (
                    <ColumnResizer onMouseDown={(e) => handleMouseDown(e, col.key)} />
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sortedLayers.map((layer, index) => {
              const samples = getWaterSamplesForLayer(layer, index);

              return (
                <tr
                  key={layer.id}
                  className={`border-b border-[#e8e8e8] hover:bg-[#f0f0ff] cursor-pointer ${selectedLayerId === layer.id ? 'bg-[#c8d8ff]' : ''}`}
                  onClick={() => setSelectedLayerId(layer.id)}
                >
                  {/* УППВ */}
                  <td className="px-1 py-0.5 border-r border-[#e8e8e8]" onClick={(e) => e.stopPropagation()}>
                    {layer.upvAbsent ? (
                      <div className="flex items-center gap-1">
                        <span className="text-sm text-gray-500">Нет</span>
                        <input
                          type="checkbox"
                          checked={true}
                          onChange={(e) => handleAbsentChange(layer.id, 'upvAbsent', e.target.checked)}
                        />
                      </div>
                    ) : (
                      <div className="flex items-center gap-1">
                        <input
                          ref={(el) => { inputRefs.current[`${layer.id}_upv`] = el; }}
                          type="text"
                          className={inputClass}
                          value={getInputValue(layer.id, 'upv', layer.upv)}
                          onChange={(e) => handleInputChange(layer.id, 'upv', e.target.value)}
                          onBlur={() => handleInputBlur(layer.id, 'upv')}
                        />
                        <input
                          type="checkbox"
                          checked={false}
                          onChange={(e) => handleAbsentChange(layer.id, 'upvAbsent', e.target.checked)}
                        />
                      </div>
                    )}
                  </td>

                  {/* УУПВ */}
                  <td className="px-1 py-0.5 border-r border-[#e8e8e8]" onClick={(e) => e.stopPropagation()}>
                    {layer.uuvAbsent ? (
                      <div className="flex items-center gap-1">
                        <span className="text-sm text-gray-500">Нет</span>
                        <input
                          type="checkbox"
                          checked={true}
                          onChange={(e) => handleAbsentChange(layer.id, 'uuvAbsent', e.target.checked)}
                        />
                      </div>
                    ) : (
                      <div className="flex items-center gap-1">
                        <input
                          ref={(el) => { inputRefs.current[`${layer.id}_uuv`] = el; }}
                          type="text"
                          className={inputClass}
                          value={getInputValue(layer.id, 'uuv', layer.uuv)}
                          onChange={(e) => handleInputChange(layer.id, 'uuv', e.target.value)}
                          onBlur={() => handleInputBlur(layer.id, 'uuv')}
                        />
                        <input
                          type="checkbox"
                          checked={false}
                          onChange={(e) => handleAbsentChange(layer.id, 'uuvAbsent', e.target.checked)}
                        />
                      </div>
                    )}
                  </td>

                  {/* Подошва */}
                  <td className="px-1 py-0.5 border-r border-[#e8e8e8]" onClick={(e) => e.stopPropagation()}>
                    <input
                      ref={(el) => { inputRefs.current[`${layer.id}_bottom`] = el; }}
                      type="text"
                      className={inputClass}
                      value={getInputValue(layer.id, 'bottom', layer.bottom)}
                      onChange={(e) => handleInputChange(layer.id, 'bottom', e.target.value)}
                      onBlur={() => handleInputBlur(layer.id, 'bottom')}
                    />
                  </td>

                  {/* ВГ */}
                  <td className="px-1 py-0.5 border-r border-[#e8e8e8]" onClick={(e) => e.stopPropagation()}>
                    <input
                      type="text"
                      className={inputClass}
                      value={getInputValue(layer.id, 'horizon', layer.horizon)}
                      onChange={(e) => handleInputChange(layer.id, 'horizon', e.target.value)}
                      onBlur={() => handleInputBlur(layer.id, 'horizon')}
                    />
                  </td>

                  {/* Дата УППВ */}
                  <td className="px-1 py-0.5 border-r border-[#e8e8e8]" onClick={(e) => e.stopPropagation()}>
                    <input
                      type="text"
                      className={inputClass}
                      value={getInputValue(layer.id, 'upvDate', layer.upvDate)}
                      onChange={(e) => handleInputChange(layer.id, 'upvDate', e.target.value)}
                      onBlur={() => handleInputBlur(layer.id, 'upvDate')}
                      placeholder="ДД.ММ.ГГГГ"
                    />
                  </td>

                  {/* Дата УУПВ */}
                  <td className="px-1 py-0.5 border-r border-[#e8e8e8]" onClick={(e) => e.stopPropagation()}>
                    <input
                      type="text"
                      className={inputClass}
                      value={getInputValue(layer.id, 'uuvDate', layer.uuvDate)}
                      onChange={(e) => handleInputChange(layer.id, 'uuvDate', e.target.value)}
                      onBlur={() => handleInputBlur(layer.id, 'uuvDate')}
                      placeholder="ДД.ММ.ГГГГ"
                    />
                  </td>

                  {/* Напор */}
                  <td className="px-1 py-0.5 border-r border-[#e8e8e8]" onClick={(e) => e.stopPropagation()}>
                    <input
                      type="text"
                      className={inputClass}
                      value={getInputValue(layer.id, 'pressure', layer.pressure)}
                      onChange={(e) => handleInputChange(layer.id, 'pressure', e.target.value)}
                      onBlur={() => handleInputBlur(layer.id, 'pressure')}
                    />
                  </td>

                  {/* Понижение */}
                  <td className="px-1 py-0.5 border-r border-[#e8e8e8]" onClick={(e) => e.stopPropagation()}>
                    <input
                      type="text"
                      className={inputClass}
                      value={getInputValue(layer.id, 'depression', layer.depression)}
                      onChange={(e) => handleInputChange(layer.id, 'depression', e.target.value)}
                      onBlur={() => handleInputBlur(layer.id, 'depression')}
                    />
                  </td>

                  {/* Пробы */}
                  <td className="px-1 py-1 border-r border-[#e8e8e8] text-sm">
                    {formatDepths(samples)}
                  </td>

                  {/* Удаление */}
                  <td className="px-1 py-0.5 text-center" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => handleDeleteLayer(layer.id)}
                      className="text-red-600 hover:text-red-800 text-sm"
                      title="Удалить слой"
                    >
                      🗑️
                    </button>
                  </td>
                </tr>
              );
            })}

            {/* Кнопка добавления слоя */}
            <tr>
              <td colSpan={3} className="px-2 py-1 text-left bg-[#f9f9f9]">
                <button
                  onClick={() => {
                    const newLayerId = handleAddLayer();
                    setFocusTarget({ layerId: newLayerId, field: 'upv' });
                  }}
                  className="text-sm text-blue-600 hover:text-blue-800 underline"
                >
                  Добавить новый слой...
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

// Конец файла
