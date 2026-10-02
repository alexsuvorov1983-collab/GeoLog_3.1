import { useState, useMemo } from 'react';
import { Borehole, Sample, GeoLogData } from '../core/dataStore';
import { Journal } from '../core/journal';
import SampleTableHeader from './SampleTableHeader';
import { serviceColumns, getColumnsByComposition } from './SampleTableColumns';

interface Props {
  boreholes: Borehole[];
  selectedSampleId?: string | null;
  onSelectSample?: (id: string | null) => void;
  onSelectBorehole?: (id: string) => void;
}

export default function AllSamplesTable({ boreholes, selectedSampleId, onSelectSample, onSelectBorehole }: Props) {
  const [editingCell, setEditingCell] = useState<{ sampleId: string; field: string } | null>(null);
  const [editValue, setEditValue] = useState<string>('');
  
  // Получение всех проб из всех скважин
  const allSamples = useMemo(() => {
    const samples: Array<{ sample: Sample; borehole: Borehole }> = [];
    boreholes.forEach(borehole => {
      (borehole.samples || []).forEach(sample => {
        if (sample.sample_type !== 'water') {
          samples.push({ sample, borehole });
        }
      });
    });
    return samples;
  }, [boreholes]);
  
  // Определение типа композиции для отображения (используем первую пробу или 'dispersed' по умолчанию)
  const compositionType = allSamples.length > 0 
    ? (allSamples[0].sample.composition_type || 'dispersed')
    : 'dispersed';
  
  const compositionColumns = getColumnsByComposition(compositionType);
  
  // Обработчик изменения поля пробы
  const handleSampleChange = (boreholeId: string, sampleId: string, field: keyof Sample, value: any) => {
    const borehole = boreholes.find(b => b.id === boreholeId);
    if (!borehole) return;
    
    const allSamples = [...(borehole.samples || [])];
    const updatedSamples = allSamples.map(sample => {
      if (sample.id !== sampleId) return sample;
      return { ...sample, [field]: value };
    });
    
    GeoLogData.update(boreholeId, { samples: updatedSamples });
    Journal.logEvent('command', `Обновлена проба ${sampleId}`, 'sample.update');
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
      const sampleData = allSamples.find(s => s.sample.id === sampleId);
      if (sampleData) {
        let value: any = editValue;
        
        if (['depth_m', 'W', 'WL', 'WP', 'rho', 'rhod', 'rhos', 'c', 'phi', 'Eoed', 'Rc_dry', 'Rc_sat', 'RQD'].includes(field)) {
          const num = parseFloat(editValue.replace(',', '.'));
          value = isNaN(num) ? undefined : num;
        }
        
        handleSampleChange(sampleData.borehole.id, sampleId, field as keyof Sample, value);
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
  
  const inputClass = "w-full px-0.5 py-0 text-[10px] border border-blue-400 bg-white rounded focus:outline-none";
  const cellClass = "px-1 py-0 text-[10px] border-r border-b border-[#e8e8e8] cursor-pointer hover:bg-[#f0f0ff] min-w-[45px]";
  const fixedCellClass = "px-1 py-0 text-[10px] border-r border-b border-[#e8e8e8] bg-[#f9f9f9] sticky left-0 z-10";
  
  return (
    <div className="flex flex-col h-full">
      {/* Таблица всех проб */}
      <div className="flex-1 overflow-auto">
        <table className="text-xs border-collapse" style={{ tableLayout: 'auto' }}>
          <SampleTableHeader compositionType={compositionType} />
          <tbody>
            {allSamples.map(({ sample, borehole }, index) => (
              <tr 
                key={sample.id} 
                className={`hover:bg-[#f0f0ff] cursor-pointer ${selectedSampleId === sample.id ? 'bg-[#c8d8ff]' : ''}`}
                onClick={() => {
                  onSelectSample?.(sample.id);
                  onSelectBorehole?.(borehole.id);
                }}
              >
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
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
