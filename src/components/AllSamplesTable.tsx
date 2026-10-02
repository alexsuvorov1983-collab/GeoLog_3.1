import { useState, useMemo } from 'react';
import { Borehole, Sample, GeoLogData } from '../core/dataStore';
import { Journal } from '../core/journal';

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
  
  const inputClass = "w-full px-1 py-0.5 text-xs border border-blue-400 bg-white rounded focus:outline-none";
  const cellClass = "px-2 py-1 text-xs border-r border-b border-[#e8e8e8] cursor-pointer hover:bg-[#f0f0ff] min-w-[80px]";
  const fixedCellClass = "px-2 py-1 text-xs border-r border-b border-[#e8e8e8] bg-[#f9f9f9] sticky left-0 z-10";
  
  return (
    <div className="flex flex-col h-full">
      {/* Таблица всех проб */}
      <div className="flex-1 overflow-auto">
        <table className="text-xs border-collapse" style={{ tableLayout: 'auto' }}>
          <thead className="sticky top-0 z-20 bg-[#e8e8e8]">
            <tr>
              {/* Закреплённые служебные колонки */}
              <th className={fixedCellClass} style={{ left: '0px', minWidth: '40px' }}>№ п/п</th>
              <th className={fixedCellClass} style={{ left: '40px', minWidth: '80px' }}>Скважина</th>
              <th className={fixedCellClass} style={{ left: '120px', minWidth: '100px' }}>Полевой №</th>
              <th className={fixedCellClass} style={{ left: '220px', minWidth: '100px' }}>Лаб. №</th>
              <th className={fixedCellClass} style={{ left: '320px', minWidth: '80px' }}>Глубина, м</th>
              <th className={fixedCellClass} style={{ left: '400px', minWidth: '120px' }}>Литология</th>
              <th className={fixedCellClass} style={{ left: '520px', minWidth: '200px' }}>Описание</th>
              
              {/* Прокручиваемые колонки */}
              <th className={cellClass}>ИГЭ</th>
              <th className={cellClass}>Тип</th>
              <th className={cellClass}>W, %</th>
              <th className={cellClass}>WL, %</th>
              <th className={cellClass}>WP, %</th>
              <th className={cellClass}>ρ, г/см³</th>
              <th className={cellClass}>ρd, г/см³</th>
              <th className={cellClass}>ρs, г/см³</th>
              <th className={cellClass}>c, кПа</th>
              <th className={cellClass}>φ, град</th>
              <th className={cellClass}>E, МПа</th>
              <th className={cellClass}>Rc вс, МПа</th>
              <th className={cellClass}>Rq вод, МПа</th>
              <th className={cellClass}>RQD, %</th>
            </tr>
          </thead>
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
                {/* Закреплённые служебные колонки */}
                <td className={fixedCellClass} style={{ left: '0px' }}>{index + 1}</td>
                <td className={fixedCellClass} style={{ left: '40px' }}>{borehole.number}</td>
                <td 
                  className={fixedCellClass} 
                  style={{ left: '120px' }}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleCellClick(sample.id, 'field_number', sample.field_number);
                  }}
                >
                  {editingCell?.sampleId === sample.id && editingCell?.field === 'field_number' ? (
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
                    sample.field_number || ''
                  )}
                </td>
                <td 
                  className={fixedCellClass} 
                  style={{ left: '220px' }}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleCellClick(sample.id, 'lab_number', sample.lab_number);
                  }}
                >
                  {editingCell?.sampleId === sample.id && editingCell?.field === 'lab_number' ? (
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
                    sample.lab_number || ''
                  )}
                </td>
                <td 
                  className={fixedCellClass} 
                  style={{ left: '320px' }}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleCellClick(sample.id, 'depth_m', sample.depth_m);
                  }}
                >
                  {editingCell?.sampleId === sample.id && editingCell?.field === 'depth_m' ? (
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
                    sample.depth_m.toFixed(2)
                  )}
                </td>
                <td 
                  className={fixedCellClass} 
                  style={{ left: '400px' }}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleCellClick(sample.id, 'lithology', sample.lithology);
                  }}
                >
                  {editingCell?.sampleId === sample.id && editingCell?.field === 'lithology' ? (
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
                    sample.lithology || ''
                  )}
                </td>
                <td 
                  className={fixedCellClass} 
                  style={{ left: '520px' }}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleCellClick(sample.id, 'description', sample.description);
                  }}
                >
                  {editingCell?.sampleId === sample.id && editingCell?.field === 'description' ? (
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
                    sample.description || ''
                  )}
                </td>
                
                {/* Прокручиваемые колонки */}
                <td 
                  className={cellClass}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleCellClick(sample.id, 'ige_code', sample.ige_code);
                  }}
                >
                  {editingCell?.sampleId === sample.id && editingCell?.field === 'ige_code' ? (
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
                    sample.ige_code || ''
                  )}
                </td>
                <td className={cellClass}>{sample.composition_type || 'dispersed'}</td>
                <td 
                  className={cellClass}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleCellClick(sample.id, 'W', sample.W);
                  }}
                >
                  {editingCell?.sampleId === sample.id && editingCell?.field === 'W' ? (
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
                    sample.W !== undefined ? sample.W.toFixed(2) : ''
                  )}
                </td>
                <td 
                  className={cellClass}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleCellClick(sample.id, 'WL', sample.WL);
                  }}
                >
                  {editingCell?.sampleId === sample.id && editingCell?.field === 'WL' ? (
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
                    sample.WL !== undefined ? sample.WL.toFixed(2) : ''
                  )}
                </td>
                <td 
                  className={cellClass}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleCellClick(sample.id, 'WP', sample.WP);
                  }}
                >
                  {editingCell?.sampleId === sample.id && editingCell?.field === 'WP' ? (
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
                    sample.WP !== undefined ? sample.WP.toFixed(2) : ''
                  )}
                </td>
                <td 
                  className={cellClass}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleCellClick(sample.id, 'rho', sample.rho);
                  }}
                >
                  {editingCell?.sampleId === sample.id && editingCell?.field === 'rho' ? (
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
                    sample.rho !== undefined ? sample.rho.toFixed(2) : ''
                  )}
                </td>
                <td 
                  className={cellClass}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleCellClick(sample.id, 'rhod', sample.rhod);
                  }}
                >
                  {editingCell?.sampleId === sample.id && editingCell?.field === 'rhod' ? (
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
                    sample.rhod !== undefined ? sample.rhod.toFixed(2) : ''
                  )}
                </td>
                <td 
                  className={cellClass}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleCellClick(sample.id, 'rhos', sample.rhos);
                  }}
                >
                  {editingCell?.sampleId === sample.id && editingCell?.field === 'rhos' ? (
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
                    sample.rhos !== undefined ? sample.rhos.toFixed(2) : ''
                  )}
                </td>
                <td 
                  className={cellClass}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleCellClick(sample.id, 'c', sample.c);
                  }}
                >
                  {editingCell?.sampleId === sample.id && editingCell?.field === 'c' ? (
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
                    sample.c !== undefined ? sample.c.toFixed(2) : ''
                  )}
                </td>
                <td 
                  className={cellClass}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleCellClick(sample.id, 'phi', sample.phi);
                  }}
                >
                  {editingCell?.sampleId === sample.id && editingCell?.field === 'phi' ? (
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
                    sample.phi !== undefined ? sample.phi.toFixed(2) : ''
                  )}
                </td>
                <td 
                  className={cellClass}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleCellClick(sample.id, 'Eoed', sample.Eoed);
                  }}
                >
                  {editingCell?.sampleId === sample.id && editingCell?.field === 'Eoed' ? (
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
                    sample.Eoed !== undefined ? sample.Eoed.toFixed(2) : ''
                  )}
                </td>
                <td 
                  className={cellClass}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleCellClick(sample.id, 'Rc_dry', sample.Rc_dry);
                  }}
                >
                  {editingCell?.sampleId === sample.id && editingCell?.field === 'Rc_dry' ? (
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
                    sample.Rc_dry !== undefined ? sample.Rc_dry.toFixed(2) : ''
                  )}
                </td>
                <td 
                  className={cellClass}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleCellClick(sample.id, 'Rc_sat', sample.Rc_sat);
                  }}
                >
                  {editingCell?.sampleId === sample.id && editingCell?.field === 'Rc_sat' ? (
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
                    sample.Rc_sat !== undefined ? sample.Rc_sat.toFixed(2) : ''
                  )}
                </td>
                <td 
                  className={cellClass}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleCellClick(sample.id, 'RQD', sample.RQD);
                  }}
                >
                  {editingCell?.sampleId === sample.id && editingCell?.field === 'RQD' ? (
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
                    sample.RQD !== undefined ? sample.RQD.toFixed(2) : ''
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
