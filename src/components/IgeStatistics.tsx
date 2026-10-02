// Статистика по ИГЭ (ГОСТ 20522)
// Этап 7: Статистика по ИГЭ и система проверок

import { useState, useMemo } from 'react';
import { Borehole, Sample, GeoLogData } from '../core/dataStore';
import { calculateAllValues } from './SampleCalculations';
import { validateAllSamples, ValidationError, ValidationSettings, getDefaultValidationSettings } from './ValidationSystem';

interface Props {
  boreholes: Borehole[];
}

interface IgeStatistics {
  igeCode: string;
  sampleCount: number;
  parameters: Record<string, {
    values: number[];
    min: number;
    max: number;
    mean: number;
    stdDev: number;
    variationCoeff: number;
    normative: number;
    designValues: Record<string, number>; // α = 0.85, 0.90, 0.95, 0.98
  }>;
}

export default function IgeStatistics({ boreholes }: Props) {
  const [validationSettings, setValidationSettings] = useState<ValidationSettings>(getDefaultValidationSettings());
  const [showSettings, setShowSettings] = useState(false);
  const [selectedIge, setSelectedIge] = useState<string | null>(null);

  // Сбор всех проб с группировкой по ИГЭ
  const samplesByIge = useMemo(() => {
    const grouped = new Map<string, Sample[]>();
    
    boreholes.forEach(borehole => {
      (borehole.samples || []).forEach(sample => {
        if (sample.sample_type !== 'water' && sample.ige_code) {
          if (!grouped.has(sample.ige_code)) {
            grouped.set(sample.ige_code, []);
          }
          grouped.get(sample.ige_code)!.push(sample);
        }
      });
    });
    
    return grouped;
  }, [boreholes]);

  // Расчёт статистики для каждого ИГЭ
  const statistics = useMemo((): IgeStatistics[] => {
    const result: IgeStatistics[] = [];
    
    samplesByIge.forEach((samples, igeCode) => {
      const parameters: Record<string, any> = {};
      
      // Список параметров для статистики
      const paramKeys = ['W', 'WL', 'WP', 'rho', 'rhod', 'rhos', 'c', 'phi', 'Eoed', 'Rc_dry', 'Rc_sat', 'RQD'];
      
      paramKeys.forEach(key => {
        const values: number[] = [];
        
        samples.forEach(sample => {
          const value = (sample as any)[key];
          if (value !== undefined && value !== null && typeof value === 'number') {
            values.push(value);
          }
        });
        
        if (values.length > 0) {
          const n = values.length;
          const min = Math.min(...values);
          const max = Math.max(...values);
          const mean = values.reduce((s, v) => s + v, 0) / n;
          
          // Стандартное отклонение
          const variance = values.reduce((s, v) => s + Math.pow(v - mean, 2), 0) / (n - 1);
          const stdDev = Math.sqrt(variance);
          
          // Коэффициент вариации
          const variationCoeff = mean > 0 ? stdDev / mean : 0;
          
          // Нормативное значение (среднее)
          const normative = mean;
          
          // Расчётные значения с коэффициентами безопасности
          const designValues: Record<string, number> = {};
          const alphas = [0.85, 0.90, 0.95, 0.98];
          
          alphas.forEach(alpha => {
            // Упрощённый расчёт коэффициента безопасности
            const safetyCoeff = 1 + variationCoeff * (1 - alpha) * 2;
            designValues[alpha.toString()] = normative / safetyCoeff;
          });
          
          parameters[key] = {
            values,
            min,
            max,
            mean,
            stdDev,
            variationCoeff,
            normative,
            designValues
          };
        }
      });
      
      result.push({
        igeCode,
        sampleCount: samples.length,
        parameters
      });
    });
    
    return result.sort((a, b) => a.igeCode.localeCompare(b.igeCode));
  }, [samplesByIge]);

  // Валидация всех проб
  const validationErrors = useMemo(() => {
    return validateAllSamples(boreholes, validationSettings);
  }, [boreholes, validationSettings]);

  // Группировка ошибок по типам
  const errorsByType = useMemo(() => {
    const grouped = {
      errors: validationErrors.filter(e => e.type === 'error'),
      warnings: validationErrors.filter(e => e.type === 'warning'),
      info: validationErrors.filter(e => e.type === 'info')
    };
    return grouped;
  }, [validationErrors]);

  const paramLabels: Record<string, string> = {
    W: 'Влажность, %',
    WL: 'Влажность на границе текучести, %',
    WP: 'Влажность на границе раскатывания, %',
    rho: 'Плотность, г/см³',
    rhod: 'Плотность сухого грунта, г/см³',
    rhos: 'Плотность частиц, г/см³',
    c: 'Сцепление, кПа',
    phi: 'Угол внутреннего трения, °',
    Eoed: 'Модуль деформации, МПа',
    Rc_dry: 'Прочность на сжатие всухую, МПа',
    Rc_sat: 'Прочность на сжатие водонасыщ., МПа',
    RQD: 'Индекс качества керна, %'
  };

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Заголовок */}
      <div className="flex items-center justify-between px-4 py-3 bg-[#e8e8e8] border-b border-[#c0c0c0]">
        <div>
          <h2 className="text-base font-bold">📋 Статистика по ИГЭ (ГОСТ 20522)</h2>
          <p className="text-xs text-[#808080]">Статистическая обработка результатов определений характеристик грунтов</p>
        </div>
        <button
          onClick={() => setShowSettings(!showSettings)}
          className="px-3 py-1 text-xs bg-white border border-[#c0c0c0] rounded hover:bg-[#e8e8ff]"
        >
          ⚙️ Настройки
        </button>
      </div>

      {/* Панель настроек */}
      {showSettings && (
        <div className="px-4 py-3 bg-[#f9f9f9] border-b border-[#c0c0c0]">
          <h3 className="text-sm font-semibold mb-2">Настройки валидации</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-[#555]">Допуск для суммы фракций, %:</label>
              <input
                type="number"
                step="0.1"
                value={validationSettings.particleSumTolerance}
                onChange={(e) => setValidationSettings({ ...validationSettings, particleSumTolerance: parseFloat(e.target.value) || 1 })}
                className="w-full px-2 py-1 text-xs border border-[#c0c0c0] rounded"
              />
            </div>
            <div>
              <label className="text-xs text-[#555]">Нижний порог заполнителя, %:</label>
              <input
                type="number"
                step="1"
                value={validationSettings.fillerThreshold}
                onChange={(e) => setValidationSettings({ ...validationSettings, fillerThreshold: parseFloat(e.target.value) || 30 })}
                className="w-full px-2 py-1 text-xs border border-[#c0c0c0] rounded"
              />
            </div>
          </div>
        </div>
      )}

      {/* Сводка ошибок */}
      <div className="px-4 py-2 bg-[#f5f5f5] border-b border-[#c0c0c0] flex gap-4">
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 bg-red-500 rounded"></span>
          <span className="text-xs">Ошибки: {errorsByType.errors.length}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 bg-yellow-500 rounded"></span>
          <span className="text-xs">Предупреждения: {errorsByType.warnings.length}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 bg-blue-500 rounded"></span>
          <span className="text-xs">Информация: {errorsByType.info.length}</span>
        </div>
        <div className="ml-auto text-xs text-[#808080]">
          Всего ИГЭ: {statistics.length} | Проб: {samplesByIge.size > 0 ? Array.from(samplesByIge.values()).reduce((s, arr) => s + arr.length, 0) : 0}
        </div>
      </div>

      {/* Основное содержимое */}
      <div className="flex-1 overflow-auto">
        {statistics.length === 0 ? (
          <div className="flex items-center justify-center h-full text-[#808080]">
            Нет данных для отображения. Добавьте пробы с указанием ИГЭ.
          </div>
        ) : (
          <div className="p-4">
            {/* Список ИГЭ */}
            <div className="mb-4">
              <h3 className="text-sm font-semibold mb-2">Инженерно-геологические элементы:</h3>
              <div className="flex flex-wrap gap-2">
                {statistics.map(stat => (
                  <button
                    key={stat.igeCode}
                    onClick={() => setSelectedIge(selectedIge === stat.igeCode ? null : stat.igeCode)}
                    className={`px-3 py-1 text-xs border rounded ${
                      selectedIge === stat.igeCode 
                        ? 'bg-blue-500 text-white border-blue-600' 
                        : 'bg-white border-[#c0c0c0] hover:bg-[#e8e8ff]'
                    }`}
                  >
                    {stat.igeCode} ({stat.sampleCount} проб)
                  </button>
                ))}
              </div>
            </div>

            {/* Детальная статистика для выбранного ИГЭ */}
            {selectedIge && (() => {
              const stat = statistics.find(s => s.igeCode === selectedIge);
              if (!stat) return null;

              return (
                <div className="bg-[#f9f9f9] border border-[#c0c0c0] rounded p-4">
                  <h3 className="text-sm font-semibold mb-3">Статистика для {stat.igeCode}:</h3>
                  
                  <table className="w-full text-xs border-collapse">
                    <thead>
                      <tr className="bg-[#e8e8e8] border-b border-[#c0c0c0]">
                        <th className="px-2 py-1 text-left border-r border-[#c0c0c0]">Параметр</th>
                        <th className="px-2 py-1 text-center border-r border-[#c0c0c0]">n</th>
                        <th className="px-2 py-1 text-center border-r border-[#c0c0c0]">min</th>
                        <th className="px-2 py-1 text-center border-r border-[#c0c0c0]">max</th>
                        <th className="px-2 py-1 text-center border-r border-[#c0c0c0]">Среднее</th>
                        <th className="px-2 py-1 text-center border-r border-[#c0c0c0]">σ</th>
                        <th className="px-2 py-1 text-center border-r border-[#c0c0c0]">V</th>
                        <th className="px-2 py-1 text-center border-r border-[#c0c0c0]">Нормативное</th>
                        <th className="px-2 py-1 text-center border-r border-[#c0c0c0]">α=0.85</th>
                        <th className="px-2 py-1 text-center border-r border-[#c0c0c0]">α=0.90</th>
                        <th className="px-2 py-1 text-center border-r border-[#c0c0c0]">α=0.95</th>
                        <th className="px-2 py-1 text-center">α=0.98</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.entries(stat.parameters).map(([key, data]) => (
                        <tr key={key} className="border-b border-[#e8e8e8] hover:bg-[#f0f0ff]">
                          <td className="px-2 py-1 border-r border-[#e8e8e8] font-medium">
                            {paramLabels[key] || key}
                          </td>
                          <td className="px-2 py-1 border-r border-[#e8e8e8] text-center">{data.values.length}</td>
                          <td className="px-2 py-1 border-r border-[#e8e8e8] text-center">{data.min.toFixed(2)}</td>
                          <td className="px-2 py-1 border-r border-[#e8e8e8] text-center">{data.max.toFixed(2)}</td>
                          <td className="px-2 py-1 border-r border-[#e8e8e8] text-center font-semibold">{data.mean.toFixed(2)}</td>
                          <td className="px-2 py-1 border-r border-[#e8e8e8] text-center">{data.stdDev.toFixed(3)}</td>
                          <td className="px-2 py-1 border-r border-[#e8e8e8] text-center">{data.variationCoeff.toFixed(3)}</td>
                          <td className="px-2 py-1 border-r border-[#e8e8e8] text-center font-semibold">{data.normative.toFixed(2)}</td>
                          <td className="px-2 py-1 border-r border-[#e8e8e8] text-center">{data.designValues['0.85']?.toFixed(2) || '—'}</td>
                          <td className="px-2 py-1 border-r border-[#e8e8e8] text-center">{data.designValues['0.90']?.toFixed(2) || '—'}</td>
                          <td className="px-2 py-1 border-r border-[#e8e8e8] text-center">{data.designValues['0.95']?.toFixed(2) || '—'}</td>
                          <td className="px-2 py-1 text-center">{data.designValues['0.98']?.toFixed(2) || '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              );
            })()}

            {/* Список ошибок */}
            {validationErrors.length > 0 && (
              <div className="mt-4 bg-[#f9f9f9] border border-[#c0c0c0] rounded p-4">
                <h3 className="text-sm font-semibold mb-3">Обнаруженные проблемы:</h3>
                <div className="space-y-1 max-h-60 overflow-auto">
                  {validationErrors.slice(0, 50).map((error, index) => (
                    <div
                      key={index}
                      className={`px-2 py-1 text-xs rounded ${
                        error.type === 'error' ? 'bg-red-100 text-red-800' :
                        error.type === 'warning' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-blue-100 text-blue-800'
                      }`}
                    >
                      <span className="font-semibold">
                        {error.type === 'error' ? '❌' : error.type === 'warning' ? '⚠️' : 'ℹ️'}
                      </span>{' '}
                      {error.message}
                    </div>
                  ))}
                  {validationErrors.length > 50 && (
                    <div className="text-xs text-[#808080] italic">
                      ... и ещё {validationErrors.length - 50} проблем
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
