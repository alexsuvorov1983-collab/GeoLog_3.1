import { useState, useMemo } from 'react';
import { Borehole, Sample, GeoLogData } from '../core/dataStore';
import { Journal } from '../core/journal';
import SampleTableHeader from './SampleTableHeader';
import { serviceColumns, getColumnsByComposition } from './SampleTableColumns';

interface Props {
  borehole: Borehole;
  boreholeId: string;
  selectedSampleId?: string | null;
  onUpdate: (data: Partial<Borehole>) => void;
  onSelectBorehole?: (id: string) => void;
}

type CompositionType = 'dispersed' | 'rock' | 'frozen_dispersed' | 'frozen_rock';

export default function SoilSamplesTable({ borehole, boreholeId, selectedSampleId, onUpdate, onSelectBorehole }: Props) {
  const [compositionFilter, setCompositionFilter] = useState<CompositionType | 'all'>('all');
  const [editingCell, setEditingCell] = useState<{ sampleId: string; field: string } | null>(null);
  const [editValue, setEditValue] = useState<string>('');
  
  const allBoreholes = GeoLogData.getAll();
  
  // Фильтрация проб - показываем только выбранную пробу
  const filteredSamples = useMemo(() => {
    const samples = borehole?.samples || [];
    if (selectedSampleId) {
      return samples.filter(s => s.id === selectedSampleId);
    }
    // Если проба не выбрана, показываем все пробы текущей скважины
    if (compositionFilter === 'all') {
      return samples.filter(s => s.sample_type !== 'water');
    }
    return samples.filter(s => s.composition_type === compositionFilter);
  }, [borehole?.samples, compositionFilter, selectedSampleId]);
  
  // Проверка на наличие borehole
  if (!borehole) {
    return (
      <div className="flex items-center justify-center h-full text-gray-500">
        Выберите скважину для просмотра проб
      </div>
    );
  }
  
  // Определение типа композиции для отображения
  const compositionType = filteredSamples.length > 0 
    ? (filteredSamples[0].composition_type || 'dispersed')
    : 'dispersed';
  
  const compositionColumns = getColumnsByComposition(compositionType);
  
  // Обработчик изменения поля пробы
  const handleSampleChange = (sampleId: string, field: keyof Sample, value: any) => {
    const allSamples = [...(borehole.samples || [])];
    const updatedSamples = allSamples.map(sample => {
      if (sample.id !== sampleId) return sample;
      return { ...sample, [field]: value };
    });
    onUpdate({ samples: updatedSamples });
    Journal.logEvent('command', `Обновлена проба ${sampleId}`, 'sample.update');
  };
  
  // Добавление новой пробы
  const handleAddSample = () => {
    const samples = borehole.samples || [];
    const newSample: Sample = {
      id: 'sp-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 8),
      borehole_id: boreholeId,
      depth_m: 0,
      sample_type: 'Монолит',
      lab_number: '',
      field_number: '',
      composition_type: 'dispersed',
    };
    onUpdate({ samples: [...samples, newSample] });
    Journal.logEvent('command', `Добавлена проба`, 'sample.add');
  };
  
  // Удаление пробы
  const handleDeleteSample = (sampleId: string) => {
    const updatedSamples = (borehole.samples || []).filter(s => s.id !== sampleId);
    onUpdate({ samples: updatedSamples });
    Journal.logEvent('command', `Удалена проба ${sampleId}`, 'sample.delete');
  };
  
  // Начало редактирования ячейки
  const handleCellClick = (sampleId: string, field: string, currentValue: any) => {
    setEditingCell({ sampleId, field });
    setEditValue(currentValue !== undefined && currentValue !== null ? String(currentValue) : '');
  };
  
  // Сохранение изменений ячейки
  const handleCellBlur = () => {
    if (editingCell) {
      const { sampleId, field } = editingCell;
      const sample = borehole.samples?.find(s => s.id === sampleId);
      if (sample) {
        let value: any = editValue;
        
        // Числовые поля
        if (['depth_m', 'W', 'WL', 'WP', 'rho', 'rhod', 'rhos', 'c', 'phi', 'Eoed', 'Rc_dry', 'Rc_sat', 'RQD'].includes(field)) {
          const num = parseFloat(editValue.replace(',', '.'));
          value = isNaN(num) ? undefined : num;
        }
        
        handleSampleChange(sampleId, field as keyof Sample, value);
      }
      setEditingCell(null);
      setEditValue('');
    }
  };
  
  // Обработка Enter в ячейке
  const handleCellKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleCellBlur();
    } else if (e.key === 'Escape') {
      setEditingCell(null);
      setEditValue('');
    }
  };
  
  const inputClass = "w-full px-1 py-0.5 text-xs border border-blue-400 bg-white rounded focus:outline-none";
  const cellClass = "px-2 py-1 text-xs border-r border-b border-[#e8e8e8] cursor-pointer hover:bg-[#f0f0ff] min-w-[80px]";
  const fixedCellClass = "px-2 py-1 text-xs border-r border-b border-[#e8e8e8] bg-[#f9f9f9] sticky left-0 z-10";
  
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
        
        <div className="w-px h-6 bg-[#c0c0c0] mx-2" />
        
        {/* Переключатель композиций */}
        <label className="text-sm font-semibold">Композиция:</label>
        <button
          onClick={() => setCompositionFilter('all')}
          className={`px-2 py-1 text-xs border rounded ${compositionFilter === 'all' ? 'bg-blue-500 text-white' : 'bg-white'}`}
        >
          Все
        </button>
        <button
          onClick={() => setCompositionFilter('dispersed')}
          className={`px-2 py-1 text-xs border rounded ${compositionFilter === 'dispersed' ? 'bg-blue-500 text-white' : 'bg-white'}`}
        >
          Дисперсный
        </button>
        <button
          onClick={() => setCompositionFilter('rock')}
          className={`px-2 py-1 text-xs border rounded ${compositionFilter === 'rock' ? 'bg-blue-500 text-white' : 'bg-white'}`}
        >
          Скальный
        </button>
        <button
          onClick={() => setCompositionFilter('frozen_dispersed')}
          className={`px-2 py-1 text-xs border rounded ${compositionFilter === 'frozen_dispersed' ? 'bg-blue-500 text-white' : 'bg-white'}`}
        >
          Мёрзлый дисперсный
        </button>
        <button
          onClick={() => setCompositionFilter('frozen_rock')}
          className={`px-2 py-1 text-xs border rounded ${compositionFilter === 'frozen_rock' ? 'bg-blue-500 text-white' : 'bg-white'}`}
        >
          Мёрзлый скальный
        </button>
        
        <div className="ml-auto">
          <button
            onClick={handleAddSample}
            className="px-3 py-1 text-xs bg-[#4472c4] text-white rounded hover:bg-[#3060b0]"
          >
            + Добавить пробу
          </button>
        </div>
      </div>
      
      {/* Таблица проб */}
      <div className="flex-1 overflow-auto">
        <table className="text-xs border-collapse" style={{ tableLayout: 'auto' }}>
          <SampleTableHeader compositionType={compositionType} />
          <tbody>
            {filteredSamples.map((sample, index) => (
              <tr key={sample.id} className="hover:bg-[#f0f0ff]">
                {/* Служебные колонки */}
                {serviceColumns.map(col => {
                  let value: any = '';
                  if (col.key === 'index') value = index + 1;
                  else if (col.key === 'borehole_number') value = borehole.number;
                  else value = (sample as any)[col.key];
                  
                  const displayValue = col.key === 'depth_m' 
                    ? (value !== undefined ? Number(value).toFixed(col.precision || 2) : '')
                    : (value !== undefined && value !== null ? String(value) : '');
                  
                  return (
                    <td
                      key={col.key}
                      className={fixedCellClass}
                      style={{ 
                        left: col.fixed ? `${serviceColumns.slice(0, serviceColumns.indexOf(col)).reduce((sum, c) => sum + (c.width || 80), 0)}px` : undefined,
                        width: `${col.width || 80}px`,
                        minWidth: `${col.width || 80}px`
                      }}
                      onClick={(e) => {
                        if (col.editable) {
                          e.stopPropagation();
                          handleCellClick(sample.id, col.key, value);
                        }
                      }}
                    >
                      {editingCell?.sampleId === sample.id && editingCell?.field === col.key ? (
                        <input
                          type="text"
                          className={inputClass}
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          onBlur={handleCellBlur}
                          onKeyDown={handleCellKeyDown}
                          autoFocus
                        />
                      ) : (
                        displayValue
                      )}
                    </td>
                  );
                })}
                
                {/* Колонки композиции */}
                {compositionColumns.map(col => {
                  const value = (sample as any)[col.key];
                  const displayValue = value !== undefined && value !== null 
                    ? Number(value).toFixed(col.precision || 2) 
                    : '';
                  
                  return (
                    <td
                      key={col.key}
                      className={cellClass}
                      style={{ width: `${col.width || 80}px`, minWidth: `${col.width || 80}px` }}
                      onClick={(e) => {
                        if (col.editable) {
                          e.stopPropagation();
                          handleCellClick(sample.id, col.key, value);
                        }
                      }}
                    >
                      {editingCell?.sampleId === sample.id && editingCell?.field === col.key ? (
                        <input
                          type="text"
                          className={inputClass}
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          onBlur={handleCellBlur}
                          onKeyDown={handleCellKeyDown}
                          autoFocus
                        />
                      ) : (
                        displayValue
                      )}
                    </td>
                  );
                })}
                
                {/* Кнопка удаления */}
                <td className={cellClass} style={{ minWidth: '50px' }}>
                  <button
                    onClick={() => handleDeleteSample(sample.id)}
                    className="text-red-600 hover:text-red-800"
                  >
                    🗑️
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
