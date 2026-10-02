import { useState, useMemo } from 'react';
import { Borehole, Sample, SoilTest, GeoLogData } from '../core/dataStore';
import { Journal } from '../core/journal';
import SampleTableHeader from './SampleTableHeader';
import { serviceColumns, getColumnsByComposition } from './SampleTableColumns';
import { calculateAllValues, validateResults, formatValue, CalculatedValues, ValidationErrors } from './SampleCalculations';
import { classifySoil, ClassificationResult } from './SoilClassifier';
import { CompressionTest, ShearTest, GranulometryTest, MoistureDensityTest } from './LaboratoryTests';

interface Props {
  boreholes: Borehole[];
  selectedSampleId?: string | null;
  onSelectSample?: (id: string | null) => void;
  onSelectBorehole?: (id: string) => void;
}

export default function AllSamplesTable({ boreholes, selectedSampleId, onSelectSample, onSelectBorehole }: Props) {
  const [editingCell, setEditingCell] = useState<{ sampleId: string; field: string } | null>(null);
  const [editValue, setEditValue] = useState<string>('');
  const [openTestModal, setOpenTestModal] = useState<{ sampleId: string; testType: string; testId?: string } | null>(null);
  
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

  // Создание нового лабораторного опыта
  const handleCreateTest = (boreholeId: string, sampleId: string, testType: string) => {
    const borehole = boreholes.find(b => b.id === boreholeId);
    if (!borehole) return;

    const newTest: SoilTest = {
      id: 'test-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 8),
      sample_id: sampleId,
      test_type: testType as any,
      data: {},
      results: {},
      created_at: new Date().toISOString()
    };

    const tests = [...(borehole.soil_tests || []), newTest];
    GeoLogData.update(boreholeId, { soil_tests: tests });
    
    setOpenTestModal({ sampleId, testType, testId: newTest.id });
    Journal.logEvent('command', `Создан опыт ${testType} для пробы ${sampleId}`, 'test.create');
  };

  // Обновление лабораторного опыта
  const handleUpdateTest = (boreholeId: string, updatedTest: SoilTest) => {
    const borehole = boreholes.find(b => b.id === boreholeId);
    if (!borehole) return;

    const tests = (borehole.soil_tests || []).map(t => 
      t.id === updatedTest.id ? updatedTest : t
    );
    
    GeoLogData.update(boreholeId, { soil_tests: tests });
  };

  // Получение опыта для пробы
  const getTestForSample = (boreholeId: string, sampleId: string, testType: string): SoilTest | undefined => {
    const borehole = boreholes.find(b => b.id === boreholeId);
    if (!borehole) return undefined;

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
            {allSamples.map(({ sample, borehole }, index) => {
              // Вычисляем расчётные значения для этой пробы
              const calculated = calculateAllValues(sample);
              const errors = validateResults(sample, calculated);
              const classification = classifySoil(sample, calculated);
              
              return (
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
                        handleCreateTest(borehole.id, sample.id, 'compression');
                      }}
                      className="px-1 py-0.5 text-[9px] bg-blue-500 text-white rounded hover:bg-blue-600"
                      title="Компрессионные испытания"
                    >
                      К
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCreateTest(borehole.id, sample.id, 'shear');
                      }}
                      className="px-1 py-0.5 text-[9px] bg-green-500 text-white rounded hover:bg-green-600"
                      title="Одноплоскостной срез"
                    >
                      С
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCreateTest(borehole.id, sample.id, 'granulometry');
                      }}
                      className="px-1 py-0.5 text-[9px] bg-purple-500 text-white rounded hover:bg-purple-600"
                      title="Гранулометрический состав"
                    >
                      Г
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCreateTest(borehole.id, sample.id, 'moisture');
                      }}
                      className="px-1 py-0.5 text-[9px] bg-orange-500 text-white rounded hover:bg-orange-600"
                      title="Влажность и плотность"
                    >
                      В
                    </button>
                  </div>
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
          <div className="bg-white rounded-lg shadow-2xl w-[90%] h-[90%] max-w-6xl" onClick={(e) => e.stopPropagation()}>
            {(() => {
              const testBorehole = boreholes.find(b => b.id === allSamples.find(s => s.sample.id === openTestModal.sampleId)?.borehole.id);
              if (!testBorehole) return null;
              
              const test = getTestForSample(testBorehole.id, openTestModal.sampleId, openTestModal.testType);
              if (!test) return null;

              const handleClose = () => setOpenTestModal(null);
              const handleUpdate = (updatedTest: SoilTest) => handleUpdateTest(testBorehole.id, updatedTest);

              switch (openTestModal.testType) {
                case 'compression':
                  return <CompressionTest test={test} onUpdate={handleUpdate} onClose={handleClose} />;
                case 'shear':
                  return <ShearTest test={test} onUpdate={handleUpdate} onClose={handleClose} />;
                case 'granulometry':
                  return <GranulometryTest test={test} onUpdate={handleUpdate} onClose={handleClose} />;
                case 'moisture':
                  return <MoistureDensityTest test={test} onUpdate={handleUpdate} onClose={handleClose} />;
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
