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
  const [selectedSampleId, setSelectedSampleId] = useState<string | null>(null);
  const [compositionFilter, setCompositionFilter] = useState<CompositionType | 'all'>('all');
  
  const allBoreholes = GeoLogData.getAll();
  
  // Фильтрация проб по типу композиции
  const filteredSamples = useMemo(() => {
    const samples = borehole.samples || [];
    if (compositionFilter === 'all') {
      return samples.filter(s => s.sample_type !== 'water'); // Исключаем пробы воды
    }
    return samples.filter(s => s.composition_type === compositionFilter);
  }, [borehole.samples, compositionFilter]);
  
  // Получение пробы по ID
  const selectedSample = useMemo(() => {
    if (!selectedSampleId) return null;
    return (borehole.samples || []).find(s => s.id === selectedSampleId) || null;
  }, [borehole.samples, selectedSampleId]);
  
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
    setSelectedSampleId(newSample.id);
    Journal.logEvent('command', `Добавлена проба`, 'sample.add');
  };
  
  // Удаление пробы
  const handleDeleteSample = (sampleId: string) => {
    const updatedSamples = (borehole.samples || []).filter(s => s.id !== sampleId);
    onUpdate({ samples: updatedSamples });
    if (selectedSampleId === sampleId) {
      setSelectedSampleId(null);
    }
    Journal.logEvent('command', `Удалена проба ${sampleId}`, 'sample.delete');
  };
  
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
      </div>
      
      {/* Основная область: список проб слева + таблица справа */}
      <div className="flex flex-1 overflow-hidden">
        {/* Список проб слева */}
        <div className="w-48 bg-[#f9f9f9] border-r border-[#c0c0c0] overflow-y-auto">
          <div className="p-2 border-b border-[#c0c0c0] bg-[#e8e8e8]">
            <div className="text-xs font-semibold">Пробы ({filteredSamples.length})</div>
          </div>
          {filteredSamples.map(sample => (
            <div
              key={sample.id}
              className={`px-2 py-1 border-b border-[#e8e8e8] cursor-pointer hover:bg-[#e0e8ff] ${selectedSampleId === sample.id ? 'bg-[#c8d8ff]' : ''}`}
              onClick={() => setSelectedSampleId(sample.id)}
            >
              <div className="text-xs font-semibold">{sample.lab_number || 'Без номера'}</div>
              <div className="text-xs text-gray-600">Глубина: {sample.depth_m.toFixed(2)} м</div>
              <div className="text-xs text-gray-500">{sample.description || 'Нет описания'}</div>
            </div>
          ))}
          <button
            onClick={handleAddSample}
            className="w-full px-2 py-1 text-xs text-blue-600 hover:bg-[#e0e8ff] border-b border-[#e8e8e8]"
          >
            + Добавить пробу
          </button>
        </div>
        
        {/* Таблица справа */}
        <div className="flex-1 overflow-auto">
          {selectedSample ? (
            <div className="p-3">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-sm font-bold">Проба: {selectedSample.lab_number || 'Без номера'}</h3>
                <button
                  onClick={() => handleDeleteSample(selectedSample.id)}
                  className="px-2 py-1 text-xs bg-red-500 text-white rounded hover:bg-red-600"
                >
                  Удалить пробу
                </button>
              </div>
              
              {/* Служебные колонки (Уровень 1) */}
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div>
                  <label className="text-xs font-semibold block mb-1">Полевой номер:</label>
                  <input
                    type="text"
                    className={inputClass}
                    value={selectedSample.field_number || ''}
                    onChange={(e) => handleSampleChange(selectedSample.id, 'field_number', e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold block mb-1">Лабораторный номер:</label>
                  <input
                    type="text"
                    className={inputClass}
                    value={selectedSample.lab_number || ''}
                    onChange={(e) => handleSampleChange(selectedSample.id, 'lab_number', e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold block mb-1">№ выработки:</label>
                  <input
                    type="text"
                    className={inputClass}
                    value={borehole.number}
                    readOnly
                    disabled
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold block mb-1">Глубина отбора, м:</label>
                  <input
                    type="text"
                    className={inputClass}
                    value={selectedSample.depth_m.toFixed(2)}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value.replace(',', '.'));
                      if (!isNaN(val)) {
                        handleSampleChange(selectedSample.id, 'depth_m', val);
                      }
                    }}
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold block mb-1">ИГЭ:</label>
                  <input
                    type="text"
                    className={inputClass}
                    value={selectedSample.ige_code || ''}
                    onChange={(e) => handleSampleChange(selectedSample.id, 'ige_code', e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold block mb-1">Тип композиции:</label>
                  <select
                    className={inputClass}
                    value={selectedSample.composition_type || 'dispersed'}
                    onChange={(e) => handleSampleChange(selectedSample.id, 'composition_type', e.target.value)}
                  >
                    <option value="dispersed">Дисперсный</option>
                    <option value="rock">Скальный</option>
                    <option value="frozen_dispersed">Мёрзлый дисперсный</option>
                    <option value="frozen_rock">Мёрзлый скальный</option>
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="text-xs font-semibold block mb-1">Литология (для скальных):</label>
                  <input
                    type="text"
                    className={inputClass}
                    value={selectedSample.lithology || ''}
                    onChange={(e) => handleSampleChange(selectedSample.id, 'lithology', e.target.value)}
                  />
                </div>
                <div className="col-span-2">
                  <label className="text-xs font-semibold block mb-1">Описание грунта:</label>
                  <textarea
                    className={inputClass}
                    rows={2}
                    value={selectedSample.description || ''}
                    onChange={(e) => handleSampleChange(selectedSample.id, 'description', e.target.value)}
                  />
                </div>
                <div className="col-span-2">
                  <label className="text-xs font-semibold block mb-1">Примечание:</label>
                  <textarea
                    className={inputClass}
                    rows={2}
                    value={selectedSample.note || ''}
                    onChange={(e) => handleSampleChange(selectedSample.id, 'note', e.target.value)}
                  />
                </div>
              </div>
              
              {/* Здесь будут остальные группы параметров на следующих этапах */}
              <div className="mt-4 p-3 bg-[#f0f0f0] border border-[#c0c0c0] rounded">
                <div className="text-xs text-gray-600 italic">
                  На следующих этапах здесь будут добавлены:
                  <ul className="list-disc list-inside mt-2 space-y-1">
                    <li>Гранулометрический состав (14 фракций)</li>
                    <li>Влажности (W, WL, WP, Wtot, Wm, Wi, Ww)</li>
                    <li>Плотности (ρ, ρd, ρs, ρf)</li>
                    <li>Расчётные показатели (e, n, Sr, Ip, IL)</li>
                    <li>Прочностные характеристики (c, φ)</li>
                    <li>Компрессионные и трёхосные характеристики</li>
                    <li>Скальные и мёрзлые показатели</li>
                    <li>Классификатор ГОСТ 25100</li>
                  </ul>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-full text-gray-500">
              Выберите пробу из списка слева
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
