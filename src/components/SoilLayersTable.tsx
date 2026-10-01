// GeoLog 7.4 main.tsx rev.2 (01.10.2026) | schema v1.4
import { useState, useMemo } from 'react';
import { Borehole, SoilLayer, Sample, GeoLogData } from '../core/dataStore';
import { Journal } from '../core/journal';
import { useColumnResize, ColumnResizer } from './ResizableTable';

interface Props {
  borehole: Borehole;
  boreholeId: string;
  onUpdate: (data: Partial<Borehole>) => void;
  onSelectBorehole?: (id: string) => void;
}

export default function SoilLayersTable({ borehole, boreholeId, onUpdate, onSelectBorehole }: Props) {
  const [editingLayerId, setEditingLayerId] = useState<string | null>(null);
  const allBoreholes = GeoLogData.getAll();
  const dicts = GeoLogData.getDicts();
  const igeCatalog = (dicts as any).ige_catalog || [];

  // Колонки таблицы
  const columns = [
    { key: 'depth_from', label: 'Кровля, м' },
    { key: 'depth_to', label: 'Подошва, м' },
    { key: 'power', label: 'Мощность, м' },
    { key: 'ige_code', label: 'ИГЭ' },
    { key: 'classification', label: 'Классификация' },
    { key: 'description', label: 'Описание' },
    { key: 'undisturbed', label: 'Монолиты' },
    { key: 'disturbed', label: 'Нарушенные' },
    { key: 'water', label: 'Пробы воды' },
    { key: 'upv', label: 'УПВ, м' },
    { key: 'uuv', label: 'УППВ, м' },
    { key: 'actions', label: '' },
  ];

  const defaultWidths: Record<string, number> = {
    depth_from: 80,
    depth_to: 80,
    power: 80,
    ige_code: 100,
    classification: 150,
    description: 250,
    undisturbed: 120,
    disturbed: 120,
    water: 120,
    upv: 80,
    uuv: 80,
    actions: 50,
  };

  const { widths, handleMouseDown } = useColumnResize(columns.map(c => c.key), defaultWidths);

  // Сортировка слоёв по кровле
  const sortedLayers = useMemo(() => {
    return [...(borehole.soil_layers || [])].sort((a, b) => a.depth_from_m - b.depth_from_m);
  }, [borehole.soil_layers]);

  // Получение проб для слоя
  const getSamplesForLayer = (layer: SoilLayer, type: string): number[] => {
    const samples = borehole.samples || [];
    const depths: number[] = [];
    
    samples.forEach(sample => {
      if (sample.sample_type !== type) return;
      
      // Правило попадания: кровля < d ≤ подошва; для первого слоя также d ≥ кровля
      const isFirstLayer = sortedLayers.length > 0 && sortedLayers[0].id === layer.id;
      const inLayer = isFirstLayer 
        ? sample.depth_m >= layer.depth_from_m && sample.depth_m <= layer.depth_to_m
        : sample.depth_m > layer.depth_from_m && sample.depth_m <= layer.depth_to_m;
      
      if (inLayer) {
        depths.push(sample.depth_m);
      }
    });
    
    return depths.sort((a, b) => a - b);
  };

  // Получение уровней воды для слоя
  const getWaterLevelsForLayer = (layer: SoilLayer, waterType: string): number[] => {
    const waterLayers = borehole.water_layers || [];
    const depths: number[] = [];
    
    waterLayers.forEach(wl => {
      if (wl.water_type !== waterType) return;
      
      const isFirstLayer = sortedLayers.length > 0 && sortedLayers[0].id === layer.id;
      const inLayer = isFirstLayer 
        ? wl.depth_m >= layer.depth_from_m && wl.depth_m <= layer.depth_to_m
        : wl.depth_m > layer.depth_from_m && wl.depth_m <= layer.depth_to_m;
      
      if (inLayer) {
        // УПВ/УППВ = elev_m - absoluteMark (глубина воды)
        const absoluteMark = borehole.elev_m - wl.depth_m;
        depths.push(absoluteMark);
      }
    });
    
    return depths.sort((a, b) => a - b);
  };

  // Расчёт мощности
  const calculatePower = (layer: SoilLayer): string => {
    const power = layer.depth_to_m - layer.depth_from_m;
    return power >= 0 ? power.toFixed(2) : '0.00';
  };

  // Валидация слоя
  const isLayerValid = (layer: SoilLayer): boolean => {
    return layer.depth_to_m > layer.depth_from_m;
  };

  // Обработчик изменения поля слоя
  const handleLayerChange = (layerId: string, field: keyof SoilLayer, value: any) => {
    const updatedLayers = (borehole.soil_layers || []).map(layer => {
      if (layer.id !== layerId) return layer;
      
      const updated = { ...layer, [field]: value };
      
      // При смене ИГЭ - автозаполнение классификации
      if (field === 'ige_code') {
        const igeItem = igeCatalog.find((item: any) => item.code === value);
        if (igeItem) {
          updated.classification = igeItem.name;
        }
      }
      
      return updated;
    });
    
    onUpdate({ soil_layers: updatedLayers });
    Journal.logEvent('command', `Обновлён слой ${layerId}`, 'layer.update');
  };

  // Добавление нового слоя (после последнего)
  const handleAddLayer = () => {
    const layers = borehole.soil_layers || [];
    const lastLayer = layers.length > 0 
      ? [...layers].sort((a, b) => b.depth_to_m - a.depth_to_m)[0]
      : null;
    
    const newDepthFrom = lastLayer ? lastLayer.depth_to_m : 0;
    
    const newLayer: SoilLayer = {
      id: 'sl-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 8),
      borehole_id: boreholeId,
      depth_from_m: newDepthFrom,
      depth_to_m: 0,
      ground_type: '',
      ige_code: '',
      classification: '',
      description: '',
    };
    
    onUpdate({ soil_layers: [...layers, newLayer] });
    Journal.logEvent('command', `Создан новый слой`, 'layer.create');
  };

  // Добавление слоя ниже (после последнего)
  const handleAddLayerBelow = () => {
    const layers = borehole.soil_layers || [];
    const lastLayer = layers.length > 0 
      ? [...layers].sort((a, b) => b.depth_to_m - a.depth_to_m)[0]
      : null;
    
    const newDepthFrom = lastLayer ? lastLayer.depth_to_m : 0;
    
    const newLayer: SoilLayer = {
      id: 'sl-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 8),
      borehole_id: boreholeId,
      depth_from_m: newDepthFrom,
      depth_to_m: 0,
      ground_type: '',
      ige_code: '',
      classification: '',
      description: '',
    };
    
    onUpdate({ soil_layers: [...layers, newLayer] });
    Journal.logEvent('command', `Добавлен слой ниже`, 'layer.create_below');
  };

  // Добавление слоя выше (перед первым)
  const handleAddLayerAbove = () => {
    const layers = borehole.soil_layers || [];
    const firstLayer = layers.length > 0 
      ? [...layers].sort((a, b) => a.depth_from_m - b.depth_from_m)[0]
      : null;
    
    const newDepthFrom = 0;
    
    const newLayer: SoilLayer = {
      id: 'sl-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 8),
      borehole_id: boreholeId,
      depth_from_m: newDepthFrom,
      depth_to_m: 0,
      ground_type: '',
      ige_code: '',
      classification: '',
      description: '',
    };
    
    onUpdate({ soil_layers: [...layers, newLayer] });
    Journal.logEvent('command', `Добавлен слой выше`, 'layer.create_above');
  };

  // Удаление слоя
  const handleDeleteLayer = (layerId: string) => {
    const updatedLayers = (borehole.soil_layers || []).filter(l => l.id !== layerId);
    onUpdate({ soil_layers: updatedLayers });
    Journal.logEvent('command', `Удалён слой ${layerId}`, 'layer.delete');
  };

  // Форматирование списка глубин
  const formatDepths = (depths: number[]): string => {
    return depths.map(d => d.toFixed(2)).join('; ');
  };

  const inputClass = "w-full px-1 py-1 text-sm border border-[#c0c0c0] bg-white rounded focus:border-blue-400 focus:outline-none";
  const invalidClass = "w-full px-1 py-1 text-sm border-2 border-red-500 bg-red-50 rounded focus:border-red-600 focus:outline-none";

  return (
    <div className="flex flex-col h-full">
      {/* Панель инструментов */}
      <div className="flex items-center gap-2 px-2 py-1 bg-[#f5f5f5] border-b border-[#c0c0c0]">
        {/* Кнопка добавить слой выше */}
        <button
          onClick={handleAddLayerAbove}
          className="flex items-center gap-1 px-3 py-1 text-sm bg-white border border-[#c0c0c0] rounded hover:bg-[#e8e8ff]"
          title="Добавить слой выше"
        >
          <span>⬆️</span>
          <span>Добавить слой выше</span>
        </button>

        {/* Кнопка добавить слой ниже */}
        <button
          onClick={handleAddLayerBelow}
          className="flex items-center gap-1 px-3 py-1 text-sm bg-white border border-[#c0c0c0] rounded hover:bg-[#e8e8ff]"
          title="Добавить слой ниже"
        >
          <span>⬇️</span>
          <span>Добавить слой ниже</span>
        </button>

        <div className="w-px h-6 bg-[#c0c0c0] mx-1" />

        {/* Селектор скважины */}
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
            {sortedLayers.map(layer => {
              const isValid = isLayerValid(layer);
              const undisturbedDepths = getSamplesForLayer(layer, 'Монолит');
              const disturbedDepths = getSamplesForLayer(layer, 'Нарушенный');
              const waterDepths = getSamplesForLayer(layer, 'water');
              const upvDepths = getWaterLevelsForLayer(layer, 'UPV');
              const uuvDepths = getWaterLevelsForLayer(layer, 'UUV');

              return (
                <tr key={layer.id} className="border-b border-[#e8e8e8] hover:bg-[#f0f0ff]">
                  {/* Кровля */}
                  <td className="px-1 py-0.5 border-r border-[#e8e8e8]">
                    <input
                      type="text"
                      className={isValid ? inputClass : invalidClass}
                      value={layer.depth_from_m.toFixed(2)}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value.replace(',', '.'));
                        if (!isNaN(val)) {
                          handleLayerChange(layer.id, 'depth_from_m', val);
                        }
                      }}
                    />
                  </td>
                  
                  {/* Подошва */}
                  <td className="px-1 py-0.5 border-r border-[#e8e8e8]">
                    <input
                      type="text"
                      className={isValid ? inputClass : invalidClass}
                      value={layer.depth_to_m === 0 ? '' : layer.depth_to_m.toFixed(2)}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value.replace(',', '.'));
                        if (!isNaN(val)) {
                          handleLayerChange(layer.id, 'depth_to_m', val);
                        }
                      }}
                    />
                  </td>
                  
                  {/* Мощность (только чтение) */}
                  <td className="px-1 py-0.5 border-r border-[#e8e8e8] text-center">
                    {calculatePower(layer)}
                  </td>
                  
                  {/* ИГЭ (select) */}
                  <td className="px-1 py-0.5 border-r border-[#e8e8e8]">
                    <select
                      className={inputClass}
                      value={layer.ige_code || ''}
                      onChange={(e) => handleLayerChange(layer.id, 'ige_code', e.target.value)}
                    >
                      <option value="">—</option>
                      {igeCatalog.map((item: any) => (
                        <option key={item.code} value={item.code}>{item.code}</option>
                      ))}
                    </select>
                  </td>
                  
                  {/* Классификация */}
                  <td className="px-1 py-0.5 border-r border-[#e8e8e8]">
                    <input
                      type="text"
                      className={inputClass}
                      value={layer.classification || ''}
                      onChange={(e) => handleLayerChange(layer.id, 'classification', e.target.value)}
                    />
                  </td>
                  
                  {/* Описание */}
                  <td className="px-1 py-0.5 border-r border-[#e8e8e8]">
                    <textarea
                      className={inputClass}
                      style={{ minHeight: '40px', resize: 'vertical' }}
                      value={layer.description || ''}
                      onChange={(e) => handleLayerChange(layer.id, 'description', e.target.value)}
                    />
                  </td>
                  
                  {/* Монолиты (только чтение) */}
                  <td className="px-1 py-1 border-r border-[#e8e8e8] text-sm">
                    {formatDepths(undisturbedDepths)}
                  </td>
                  
                  {/* Нарушенные (только чтение) */}
                  <td className="px-1 py-1 border-r border-[#e8e8e8] text-sm">
                    {formatDepths(disturbedDepths)}
                  </td>
                  
                  {/* Пробы воды (только чтение) */}
                  <td className="px-1 py-1 border-r border-[#e8e8e8] text-sm">
                    {formatDepths(waterDepths)}
                  </td>
                  
                  {/* УПВ (только чтение) */}
                  <td className="px-1 py-1 border-r border-[#e8e8e8] text-sm">
                    {formatDepths(upvDepths)}
                  </td>
                  
                  {/* УППВ (только чтение) */}
                  <td className="px-1 py-1 border-r border-[#e8e8e8] text-sm">
                    {formatDepths(uuvDepths)}
                  </td>
                  
                  {/* Удаление */}
                  <td className="px-1 py-0.5 text-center">
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
          </tbody>
        </table>
      </div>

      {/* Кнопка добавления слоя */}
      <div className="px-2 py-1 bg-[#f5f5f5] border-t border-[#c0c0c0]">
        <button
          onClick={handleAddLayer}
          className="text-sm text-blue-600 hover:text-blue-800 underline"
        >
          Добавить новый слой...
        </button>
      </div>
    </div>
  );
}

// Конец файла
