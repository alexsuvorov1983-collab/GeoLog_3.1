// Гранулометрический состав (расширенный)
// Этап 5: Лабораторные опыты (часть 1)

import { useState } from 'react';
import { SoilTest, GranulometryTestData, GranulometryTestResults, GranulometryMeasurement } from '../../core/dataStore';
import { Journal } from '../../core/journal';

interface Props {
  test: SoilTest;
  onUpdate: (test: SoilTest) => void;
  onClose: () => void;
}

// Стандартные фракции по ГОСТ 12536-2014
const STANDARD_FRACTIONS = [
  { key: 'f200', label: '>200' },
  { key: 'f100', label: '200-100' },
  { key: 'f60', label: '100-60' },
  { key: 'f10', label: '60-10' },
  { key: 'f5', label: '10-5' },
  { key: 'f2', label: '5-2' },
  { key: 'f1', label: '2-1' },
  { key: 'f05', label: '1-0.5' },
  { key: 'f025', label: '0.5-0.25' },
  { key: 'f01', label: '0.25-0.1' },
  { key: 'f005', label: '0.1-0.05' },
  { key: 'f001', label: '0.05-0.01' },
  { key: 'f0005', label: '0.01-0.005' },
  { key: 'f0002', label: '<0.005' },
];

export default function GranulometryTest({ test, onUpdate, onClose }: Props) {
  const data = (test.data as GranulometryTestData) || {
    total_weight_g: 0,
    measurements: [],
    wet_screening: true
  };
  
  const results = (test.results as GranulometryTestResults) || { fractions: {} };

  // Расчёт результатов
  const calculateResults = (testData: GranulometryTestData): GranulometryTestResults => {
    if (testData.measurements.length === 0 || testData.total_weight_g === 0) {
      return { fractions: {} };
    }

    const fractions: Record<string, number> = {};
    let totalWeight = 0;

    testData.measurements.forEach(m => {
      const percentage = (m.weight_g / testData.total_weight_g) * 100;
      fractions[m.fraction_mm] = percentage;
      totalWeight += m.weight_g;
    });

    // Сумма частиц
    const particleSum = Object.values(fractions).reduce((s, p) => s + p, 0);

    // Заполнитель (<2 мм)
    const fillerFractions = ['f1', 'f05', 'f025', 'f01', 'f005', 'f001', 'f0005', 'f0002'];
    const filler = fillerFractions.reduce((s, key) => s + (fractions[key] || 0), 0);

    // Песок в мелкоземе
    const sandFractions = ['f1', 'f05', 'f025', 'f01', 'f005'];
    const sandSum = sandFractions.reduce((s, key) => s + (fractions[key] || 0), 0);
    const sandInFine = filler > 0 ? (sandSum / filler) * 100 : 0;

    return {
      particle_sum: particleSum,
      filler,
      sand_in_fine: sandInFine,
      fractions
    };
  };

  // Добавление замера
  const handleAddMeasurement = (fractionKey: string) => {
    const newMeasurement: GranulometryMeasurement = {
      fraction_mm: fractionKey,
      weight_g: 0,
      percentage: 0
    };
    
    const updatedData = {
      ...data,
      measurements: [...data.measurements, newMeasurement]
    };
    
    const updatedResults = calculateResults(updatedData);
    
    onUpdate({
      ...test,
      data: updatedData,
      results: updatedResults
    });
    
    Journal.logEvent('command', 'Добавлен замер грансостава', 'granulometry.add_measurement');
  };

  // Обновление замера
  const handleUpdateMeasurement = (index: number, field: keyof GranulometryMeasurement, value: string) => {
    const numValue = parseFloat(value.replace(',', '.'));
    if (isNaN(numValue)) return;
    
    const updatedMeasurements = [...data.measurements];
    updatedMeasurements[index] = {
      ...updatedMeasurements[index],
      [field]: numValue
    };
    
    const updatedData = {
      ...data,
      measurements: updatedMeasurements
    };
    
    const updatedResults = calculateResults(updatedData);
    
    onUpdate({
      ...test,
      data: updatedData,
      results: updatedResults
    });
  };

  // Удаление замера
  const handleDeleteMeasurement = (index: number) => {
    const updatedMeasurements = data.measurements.filter((_, i) => i !== index);
    
    const updatedData = {
      ...data,
      measurements: updatedMeasurements
    };
    
    const updatedResults = calculateResults(updatedData);
    
    onUpdate({
      ...test,
      data: updatedData,
      results: updatedResults
    });
    
    Journal.logEvent('command', 'Удалён замер грансостава', 'granulometry.delete_measurement');
  };

  // Обновление общего веса
  const handleUpdateTotalWeight = (value: string) => {
    const numValue = parseFloat(value.replace(',', '.'));
    if (isNaN(numValue)) return;
    
    const updatedData = {
      ...data,
      total_weight_g: numValue
    };
    
    const updatedResults = calculateResults(updatedData);
    
    onUpdate({
      ...test,
      data: updatedData,
      results: updatedResults
    });
  };

  // Добавление всех стандартных фракций
  const handleAddAllFractions = () => {
    const measurements: GranulometryMeasurement[] = STANDARD_FRACTIONS.map(f => ({
      fraction_mm: f.key,
      weight_g: 0,
      percentage: 0
    }));
    
    const updatedData = {
      ...data,
      measurements
    };
    
    const updatedResults = calculateResults(updatedData);
    
    onUpdate({
      ...test,
      data: updatedData,
      results: updatedResults
    });
    
    Journal.logEvent('command', 'Добавлены все стандартные фракции', 'granulometry.add_all');
  };

  const inputClass = "w-full px-2 py-1 text-sm border border-[#c0c0c0] bg-white rounded focus:border-blue-400 focus:outline-none";
  const labelClass = "text-sm text-[#555] mb-1";

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Заголовок */}
      <div className="flex items-center justify-between px-4 py-2 bg-[#e8e8e8] border-b border-[#c0c0c0]">
        <h3 className="text-sm font-bold">Гранулометрический состав</h3>
        <button
          onClick={onClose}
          className="px-3 py-1 text-xs bg-white border border-[#c0c0c0] rounded hover:bg-[#e8e8ff]"
        >
          Закрыть
        </button>
      </div>

      {/* Содержимое */}
      <div className="flex-1 overflow-auto p-4">
        {/* Параметры опыта */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label className={labelClass}>Общий вес пробы, г:</label>
            <input
              type="number"
              step="0.01"
              className={inputClass}
              value={data.total_weight_g}
              onChange={(e) => handleUpdateTotalWeight(e.target.value)}
            />
          </div>
          <div>
            <label className={labelClass}>Мокрый рассев:</label>
            <select
              className={inputClass}
              value={data.wet_screening ? 'yes' : 'no'}
              onChange={(e) => onUpdate({ ...test, data: { ...data, wet_screening: e.target.value === 'yes' } })}
            >
              <option value="yes">Да</option>
              <option value="no">Нет</option>
            </select>
          </div>
        </div>

        {/* Таблица замеров */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-sm font-semibold">Фракции</h4>
            <div className="flex gap-2">
              <button
                onClick={handleAddAllFractions}
                className="px-3 py-1 text-xs bg-[#4472c4] text-white rounded hover:bg-[#3060b0]"
              >
                + Все фракции
              </button>
            </div>
          </div>
          
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-[#e8e8e8] border-b border-[#c0c0c0]">
                <th className="px-2 py-1 text-left border-r border-[#c0c0c0]">Фракция</th>
                <th className="px-2 py-1 text-left border-r border-[#c0c0c0]">Вес, г</th>
                <th className="px-2 py-1 text-left border-r border-[#c0c0c0]">Процент, %</th>
                <th className="px-2 py-1 text-left">Действия</th>
              </tr>
            </thead>
            <tbody>
              {data.measurements.map((m, index) => {
                const fractionLabel = STANDARD_FRACTIONS.find(f => f.key === m.fraction_mm)?.label || m.fraction_mm;
                const percentage = results.fractions?.[m.fraction_mm] || 0;
                
                return (
                  <tr key={index} className="border-b border-[#e8e8e8]">
                    <td className="px-2 py-1 border-r border-[#e8e8e8]">{fractionLabel}</td>
                    <td className="px-2 py-1 border-r border-[#e8e8e8]">
                      <input
                        type="number"
                        step="0.01"
                        className={inputClass}
                        value={m.weight_g}
                        onChange={(e) => handleUpdateMeasurement(index, 'weight_g', e.target.value)}
                      />
                    </td>
                    <td className="px-2 py-1 border-r border-[#e8e8e8]">
                      {percentage.toFixed(1)}
                    </td>
                    <td className="px-2 py-1">
                      <button
                        onClick={() => handleDeleteMeasurement(index)}
                        className="text-red-600 hover:text-red-800 text-xs"
                      >
                        Удалить
                      </button>
                    </td>
                  </tr>
                );
              })}
              {data.measurements.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-2 py-4 text-center text-[#808080] italic">
                    Нет фракций. Нажмите "Все фракции" для добавления стандартных фракций.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Результаты */}
        <div className="bg-[#f9f9f9] border border-[#c0c0c0] rounded p-4">
          <h4 className="text-sm font-semibold mb-2">Результаты расчёта</h4>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <div className="text-xs text-[#808080]">Сумма частиц, %:</div>
              <div className={`text-sm font-semibold ${results.particle_sum && Math.abs(results.particle_sum - 100) > 1 ? 'text-red-600' : ''}`}>
                {results.particle_sum?.toFixed(1) || '—'}
              </div>
            </div>
            <div>
              <div className="text-xs text-[#808080]">{'Заполнитель (<2 мм), %:'}</div>
              <div className="text-sm font-semibold">{results.filler?.toFixed(1) || '—'}</div>
            </div>
            <div>
              <div className="text-xs text-[#808080]">Песок в мелкоземе, %:</div>
              <div className="text-sm font-semibold">{results.sand_in_fine?.toFixed(1) || '—'}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
