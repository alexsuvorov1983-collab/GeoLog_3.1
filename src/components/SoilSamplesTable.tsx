import { useState, useMemo } from 'react';
import { Borehole, Sample, SoilTest, GeoLogData } from '../core/dataStore';
import { Journal } from '../core/journal';
import SampleTableHeader from './SampleTableHeader';
import { serviceColumns, getColumnsByComposition } from './SampleTableColumns';
import { calculateAllValues, validateResults, formatValue, CalculatedValues, ValidationErrors } from './SampleCalculations';
import { classifySoil, ClassificationResult } from './SoilClassifier';
import { CompressionTest, ShearTest, GranulometryTest, MoistureDensityTest, TriaxialTest, ConeTest, SwellShrinkTest, SubsidenceTest, RockTest, FrozenTest } from './LaboratoryTests';

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
  const [openTestModal, setOpenTestModal] = useState<{ sampleId: string; testType: string; testId?: string } | null>(null);
  
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
  
  // Функция получения значения для отображения (с учётом расчётных полей и классификации)
  const getDisplayValue = (sample: Sample, colKey: string, calculated: CalculatedValues, errors: ValidationErrors, classification: ClassificationResult): { value: string; isError: boolean } => {
    // Расчётные поля
    if (colKey === 'particle_sum') {
      const val = calculated.particleSum;
      return { 
        value: formatValue(val, 1), 
        isError: errors.particleSumError || false 
      };
    }
    if (colKey === 'filler') {
      return { value: formatValue(calculated.filler, 1), isError: false };
    }
    if (colKey === 'sandInFine') {
      return { value: formatValue(calculated.sandInFine, 1), isError: false };
    }
    if (colKey === 'Ip') {
      const val = calculated.Ip;
      return { 
        value: formatValue(val, 1), 
        isError: errors.ipNegative || false 
      };
    }
    if (colKey === 'IL') {
      return { 
        value: formatValue(calculated.IL, 2), 
        isError: errors.divisionByZero || false 
      };
    }
    if (colKey === 'n') {
      return { value: formatValue(calculated.n, 1), isError: false };
    }
    if (colKey === 'e') {
      return { value: formatValue(calculated.e, 2), isError: false };
    }
    if (colKey === 'Sr') {
      return { value: formatValue(calculated.Sr, 2), isError: false };
    }
    if (colKey === 'K1') {
      return { value: formatValue(calculated.K1, 2), isError: false };
    }
    if (colKey === 'K0') {
      return { value: formatValue(calculated.K0, 2), isError: false };
    }
    
    // Поля классификации
    if (colKey === 'soilName') {
      return { value: classification.soilName || '', isError: false };
    }
    if (colKey === 'soilType') {
      return { value: classification.soilType || '', isError: false };
    }
    if (colKey === 'polyusProjectName') {
      return { value: classification.polyusProjectName || '', isError: false };
    }
    if (colKey === 'frostSusceptibility') {
      return { value: classification.frostSusceptibility || '', isError: false };
    }
    if (colKey === 'roundness') {
      return { value: classification.roundness || '', isError: false };
    }
    
    // Обычные поля из sample
    const value = (sample as any)[colKey];
    if (value === undefined || value === null) {
      return { value: '', isError: false };
    }
    
    const col = compositionColumns.find(c => c.key === colKey) || serviceColumns.find(c => c.key === colKey);
    const precision = col?.precision ?? 2;
    
    if (typeof value === 'number') {
      return { value: value.toFixed(precision), isError: false };
    }
    
    return { value: String(value), isError: false };
  };
  
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

  // Создание нового лабораторного опыта
  const handleCreateTest = (sampleId: string, testType: string) => {
    const newTest: SoilTest = {
      id: 'test-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 8),
      sample_id: sampleId,
      test_type: testType as any,
      data: {},
      results: {},
      created_at: new Date().toISOString()
    };

    const tests = [...(borehole.soil_tests || []), newTest];
    onUpdate({ soil_tests: tests });
    
    setOpenTestModal({ sampleId, testType, testId: newTest.id });
    Journal.logEvent('command', `Создан опыт ${testType} для пробы ${sampleId}`, 'test.create');
  };

  // Обновление лабораторного опыта
  const handleUpdateTest = (updatedTest: SoilTest) => {
    const tests = (borehole.soil_tests || []).map(t => 
      t.id === updatedTest.id ? updatedTest : t
    );
    
    onUpdate({ soil_tests: tests });
  };

  // Получение опыта для пробы
  const getTestForSample = (sampleId: string, testType: string): SoilTest | undefined => {
    return (borehole.soil_tests || []).find(t => 
      t.sample_id === sampleId && t.test_type === testType
    );
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
  
  const inputClass = "w-full px-0.5 py-0 text-[10px] border border-blue-400 bg-white rounded focus:outline-none";
  const cellClass = "px-1 py-0 text-[10px] border-r border-b border-[#e8e8e8] cursor-pointer hover:bg-[#f0f0ff] min-w-[45px]";
  const fixedCellClass = "px-1 py-0 text-[10px] border-r border-b border-[#e8e8e8] bg-[#f9f9f9] sticky left-0 z-10";
  
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
            {filteredSamples.map((sample, index) => {
              // Вычисляем расчётные значения для этой пробы
              const calculated = calculateAllValues(sample);
              const errors = validateResults(sample, calculated);
              const classification = classifySoil(sample, calculated);
              
              return (
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
                  const { value: displayValue, isError } = getDisplayValue(sample, col.key, calculated, errors, classification);
                  const value = (sample as any)[col.key];
                  
                  // Определяем класс ячейки в зависимости от типа
                  let cellClassName = cellClass;
                  if (!col.editable) {
                    cellClassName += ' bg-gray-50'; // Серый фон для расчётных полей
                  }
                  if (isError) {
                    cellClassName += ' bg-red-100 text-red-700'; // Подсветка ошибок
                  }
                  
                  return (
                    <td
                      key={col.key}
                      className={cellClassName}
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
                
                {/* Колонка с кнопками опытов */}
                <td className={cellClass} style={{ minWidth: '120px' }} onClick={(e) => e.stopPropagation()}>
                  <div className="flex gap-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCreateTest(sample.id, 'compression');
                      }}
                      className="px-1 py-0.5 text-[9px] bg-blue-500 text-white rounded hover:bg-blue-600"
                      title="Компрессионные испытания"
                    >
                      К
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCreateTest(sample.id, 'shear');
                      }}
                      className="px-1 py-0.5 text-[9px] bg-green-500 text-white rounded hover:bg-green-600"
                      title="Одноплоскостной срез"
                    >
                      С
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCreateTest(sample.id, 'granulometry');
                      }}
                      className="px-1 py-0.5 text-[9px] bg-purple-500 text-white rounded hover:bg-purple-600"
                      title="Гранулометрический состав"
                    >
                      Г
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCreateTest(sample.id, 'moisture');
                      }}
                      className="px-1 py-0.5 text-[9px] bg-orange-500 text-white rounded hover:bg-orange-600"
                      title="Влажность и плотность"
                    >
                      В
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCreateTest(sample.id, 'triaxial');
                      }}
                      className="px-1 py-0.5 text-[9px] bg-indigo-500 text-white rounded hover:bg-indigo-600"
                      title="Трёхосное сжатие"
                    >
                      Т
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCreateTest(sample.id, 'cone');
                      }}
                      className="px-1 py-0.5 text-[9px] bg-pink-500 text-white rounded hover:bg-pink-600"
                      title="Конус Бойченко"
                    >
                      Б
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCreateTest(sample.id, 'swell');
                      }}
                      className="px-1 py-0.5 text-[9px] bg-teal-500 text-white rounded hover:bg-teal-600"
                      title="Набухание и усадка"
                    >
                      Н
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCreateTest(sample.id, 'subsidence');
                      }}
                      className="px-1 py-0.5 text-[9px] bg-cyan-500 text-white rounded hover:bg-cyan-600"
                      title="Просадочность"
                    >
                      П
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCreateTest(sample.id, 'rock');
                      }}
                      className="px-1 py-0.5 text-[9px] bg-amber-500 text-white rounded hover:bg-amber-600"
                      title="Скальные показатели"
                    >
                      Км
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCreateTest(sample.id, 'frozen');
                      }}
                      className="px-1 py-0.5 text-[9px] bg-sky-500 text-white rounded hover:bg-sky-600"
                      title="Мёрзлые показатели"
                    >
                      М
                    </button>
                  </div>
                </td>
                
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
              );
            })}
          </tbody>
        </table>
      </div>
      
      {/* Модальные окна для лабораторных опытов */}
      {openTestModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={() => setOpenTestModal(null)}>
          <div className="bg-white rounded-lg shadow-2xl w-[90%] h-[90%] max-w-6xl overflow-auto" onClick={(e) => e.stopPropagation()}>
            {(() => {
              const test = getTestForSample(openTestModal.sampleId, openTestModal.testType);
              if (!test) return null;

              const handleClose = () => setOpenTestModal(null);
              const handleUpdate = (updatedTest: SoilTest) => handleUpdateTest(updatedTest);

              switch (openTestModal.testType) {
                case 'compression':
                  return <CompressionTest test={test} onUpdate={handleUpdate} onClose={handleClose} />;
                case 'shear':
                  return <ShearTest test={test} onUpdate={handleUpdate} onClose={handleClose} />;
                case 'granulometry':
                  return <GranulometryTest test={test} onUpdate={handleUpdate} onClose={handleClose} />;
                case 'moisture':
                  return <MoistureDensityTest test={test} onUpdate={handleUpdate} onClose={handleClose} />;
                case 'triaxial':
                  return <TriaxialTest test={test} onUpdate={handleUpdate} onClose={handleClose} />;
                case 'cone':
                  return <ConeTest test={test} onUpdate={handleUpdate} onClose={handleClose} />;
                case 'swell':
                  return <SwellShrinkTest test={test} onUpdate={handleUpdate} onClose={handleClose} />;
                case 'subsidence':
                  return <SubsidenceTest test={test} onUpdate={handleUpdate} onClose={handleClose} />;
                case 'rock':
                  return <RockTest test={test} onUpdate={handleUpdate} onClose={handleClose} />;
                case 'frozen':
                  return <FrozenTest test={test} onUpdate={handleUpdate} onClose={handleClose} />;
                default:
                  return null;
              }
            })()}
          </div>
        </div>
      )}
    </div>
  );
}
