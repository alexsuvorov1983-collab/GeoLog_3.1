import { useState, useMemo } from 'react';
import { Borehole, Sample, GeoLogData } from '../core/dataStore';
import { Journal } from '../core/journal';

interface Props {
  borehole: Borehole;
  boreholeId: string;
  onUpdate: (data: Partial<Borehole>) => void;
  onSelectBorehole?: (id: string) => void;
}

type CompositionType = 'dispersed' | 'rock' | 'frozen_dispersed' | 'frozen_rock';

export default function SoilSamplesTable({ borehole, boreholeId, onUpdate, onSelectBorehole }: Props) {
  const [compositionFilter, setCompositionFilter] = useState<CompositionType | 'all'>('all');
  const [editingCell, setEditingCell] = useState<{ sampleId: string; field: string } | null>(null);
  const [editValue, setEditValue] = useState<string>('');
  
  const allBoreholes = GeoLogData.getAll();
  
  // Фильтрация проб по типу композиции
  const filteredSamples = useMemo(() => {
    const samples = borehole?.samples || [];
    if (compositionFilter === 'all') {
      return samples.filter(s => s.sample_type !== 'water');
    }
    return samples.filter(s => s.composition_type === compositionFilter);
  }, [borehole?.samples, compositionFilter]);
  
  // Проверка на наличие borehole
  if (!borehole) {
    return (
      <div className="flex items-center justify-center h-full text-gray-500">
        Выберите скважину для просмотра проб
      </div>
    );
  }
  
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
        // Определяем тип поля и преобразуем значение
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
          <thead className="sticky top-0 z-20 bg-[#e8e8e8]">
            <tr>
              {/* Закреплённые служебные колонки */}
              <th className={fixedCellClass} style={{ left: '0px', minWidth: '40px' }}>№ п/п</th>
              <th className={fixedCellClass} style={{ left: '40px', minWidth: '100px' }}>Полевой №</th>
              <th className={fixedCellClass} style={{ left: '140px', minWidth: '100px' }}>Лаб. №</th>
              <th className={fixedCellClass} style={{ left: '240px', minWidth: '80px' }}>№ выр.</th>
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
              <th className={cellClass} style={{ minWidth: '50px' }}>🗑️</th>
            </tr>
          </thead>
          <tbody>
            {filteredSamples.map((sample, index) => (
              <tr key={sample.id} className="hover:bg-[#f0f0ff]">
                {/* Закреплённые служебные колонки */}
                <td className={fixedCellClass} style={{ left: '0px' }}>{index + 1}</td>
                <td 
                  className={fixedCellClass} 
                  style={{ left: '40px' }}
                  onClick={() => handleCellClick(sample.id, 'field_number', sample.field_number)}
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
                  style={{ left: '140px' }}
                  onClick={() => handleCellClick(sample.id, 'lab_number', sample.lab_number)}
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
                <td className={fixedCellClass} style={{ left: '240px' }}>{borehole.number}</td>
                <td 
                  className={fixedCellClass} 
                  style={{ left: '320px' }}
                  onClick={() => handleCellClick(sample.id, 'depth_m', sample.depth_m)}
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
                  onClick={() => handleCellClick(sample.id, 'lithology', sample.lithology)}
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
                  onClick={() => handleCellClick(sample.id, 'description', sample.description)}
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
                  onClick={() => handleCellClick(sample.id, 'ige_code', sample.ige_code)}
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
                  onClick={() => handleCellClick(sample.id, 'W', sample.W)}
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
                  onClick={() => handleCellClick(sample.id, 'WL', sample.WL)}
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
                  onClick={() => handleCellClick(sample.id, 'WP', sample.WP)}
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
                  onClick={() => handleCellClick(sample.id, 'rho', sample.rho)}
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
                  onClick={() => handleCellClick(sample.id, 'rhod', sample.rhod)}
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
                  onClick={() => handleCellClick(sample.id, 'rhos', sample.rhos)}
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
                  onClick={() => handleCellClick(sample.id, 'c', sample.c)}
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
                  onClick={() => handleCellClick(sample.id, 'phi', sample.phi)}
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
                  onClick={() => handleCellClick(sample.id, 'Eoed', sample.Eoed)}
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
                  onClick={() => handleCellClick(sample.id, 'Rc_dry', sample.Rc_dry)}
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
                  onClick={() => handleCellClick(sample.id, 'Rc_sat', sample.Rc_sat)}
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
                  onClick={() => handleCellClick(sample.id, 'RQD', sample.RQD)}
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
