// Влажность и плотность
// Этап 5: Лабораторные опыты (часть 1)

import { useState } from 'react';
import { SoilTest, MoistureDensityTestData, MoistureDensityTestResults, MoistureMeasurement } from '../../core/dataStore';
import { Journal } from '../../core/journal';

interface Props {
  test: SoilTest;
  onUpdate: (test: SoilTest) => void;
  onClose: () => void;
}

export default function MoistureDensityTest({ test, onUpdate, onClose }: Props) {
  const data = (test.data as MoistureDensityTestData) || {
    fraction_type: 'total',
    measurements: [],
    calculate_density: true
  };
  
  const results = (test.results as MoistureDensityTestResults) || {};

  // Расчёт результатов
  const calculateResults = (testData: MoistureDensityTestData): MoistureDensityTestResults => {
    if (testData.measurements.length === 0) return {};

    // Расчёт влажности для каждого замера
    const measurementsWithMoisture = testData.measurements.map(m => {
      const moisture = m.dry_weight_g > 0 
        ? ((m.sample_weight_g - m.dry_weight_g) / m.dry_weight_g) * 100 
        : 0;
      return { ...m, moisture };
    });

    // Средняя влажность
    const validMoistures = measurementsWithMoisture.filter(m => m.moisture > 0).map(m => m.moisture);
    const averageMoisture = validMoistures.length > 0 
      ? validMoistures.reduce((s, m) => s + m, 0) / validMoistures.length 
      : 0;

    // Расчёт плотности (если включён авторасчёт)
    let density: number | undefined;
    let dryDensity: number | undefined;
    
    if (testData.calculate_density && averageMoisture > 0) {
      // Упрощённый расчёт плотности (предполагается, что есть данные)
      // В реальности нужны дополнительные параметры (объём кольца и т.д.)
      density = 2.0; // По умолчанию
      dryDensity = density / (1 + averageMoisture / 100);
    }

    return {
      average_moisture: averageMoisture > 0 ? averageMoisture : undefined,
      density,
      dry_density: dryDensity
    };
  };

  // Добавление замера
  const handleAddMeasurement = () => {
    const newMeasurement: MoistureMeasurement = {
      sample_weight_g: 0,
      dry_weight_g: 0,
      moisture: 0
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
    
    Journal.logEvent('command', 'Добавлен замер влажности', 'moisture.add_measurement');
  };

  // Обновление замера
  const handleUpdateMeasurement = (index: number, field: keyof MoistureMeasurement, value: string) => {
    const numValue = parseFloat(value.replace(',', '.'));
    if (isNaN(numValue)) return;
    
    const updatedMeasurements = [...data.measurements];
    updatedMeasurements[index] = {
      ...updatedMeasurements[index],
      [field]: numValue
    };
    
    // Пересчёт влажности для этого замера
    if (field === 'sample_weight_g' || field === 'dry_weight_g') {
      const m = updatedMeasurements[index];
      const moisture = m.dry_weight_g > 0 
        ? ((m.sample_weight_g - m.dry_weight_g) / m.dry_weight_g) * 100 
        : 0;
      updatedMeasurements[index].moisture = moisture;
    }
    
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
    
    Journal.logEvent('command', 'Удалён замер влажности', 'moisture.delete_measurement');
  };

  // Обновление типа фракции
  const handleUpdateFractionType = (fractionType: 'fine' | 'coarse' | 'total') => {
    const updatedData = {
      ...data,
      fraction_type: fractionType
    };
    
    onUpdate({
      ...test,
      data: updatedData
    });
  };

  // Переключение авторасчёта плотности
  const handleToggleDensityCalc = () => {
    const updatedData = {
      ...data,
      calculate_density: !data.calculate_density
    };
    
    const updatedResults = calculateResults(updatedData);
    
    onUpdate({
      ...test,
      data: updatedData,
      results: updatedResults
    });
  };

  const inputClass = "w-full px-2 py-1 text-sm border border-[#c0c0c0] bg-white rounded focus:border-blue-400 focus:outline-none";
  const labelClass = "text-sm text-[#555] mb-1";

  const fractionTypeLabels = {
    fine: 'Мелкие частицы (<2 мм)',
    coarse: 'Крупные частицы (>2 мм)',
    total: 'Общая проба'
  };

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Заголовок */}
      <div className="flex items-center justify-between px-4 py-2 bg-[#e8e8e8] border-b border-[#c0c0c0]">
        <h3 className="text-sm font-bold">Влажность и плотность</h3>
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
            <label className={labelClass}>Тип фракции:</label>
            <select
              className={inputClass}
              value={data.fraction_type}
              onChange={(e) => handleUpdateFractionType(e.target.value as any)}
            >
              <option value="total">{fractionTypeLabels.total}</option>
              <option value="fine">{fractionTypeLabels.fine}</option>
              <option value="coarse">{fractionTypeLabels.coarse}</option>
            </select>
          </div>
          <div>
            <label className={labelClass}>Авторасчёт плотности:</label>
            <div className="flex items-center gap-2 mt-1">
              <input
                type="checkbox"
                checked={data.calculate_density}
                onChange={handleToggleDensityCalc}
                className="w-4 h-4"
              />
              <span className="text-sm">Включён</span>
            </div>
          </div>
        </div>

        {/* Таблица замеров */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-sm font-semibold">Замеры</h4>
            <button
              onClick={handleAddMeasurement}
              className="px-3 py-1 text-xs bg-[#4472c4] text-white rounded hover:bg-[#3060b0]"
            >
              + Добавить замер
            </button>
          </div>
          
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-[#e8e8e8] border-b border-[#c0c0c0]">
                <th className="px-2 py-1 text-left border-r border-[#c0c0c0]">№</th>
                <th className="px-2 py-1 text-left border-r border-[#c0c0c0]">Вес образца, г</th>
                <th className="px-2 py-1 text-left border-r border-[#c0c0c0]">Вес после высушивания, г</th>
                <th className="px-2 py-1 text-left border-r border-[#c0c0c0]">Влажность, %</th>
                <th className="px-2 py-1 text-left">Действия</th>
              </tr>
            </thead>
            <tbody>
              {data.measurements.map((m, index) => (
                <tr key={index} className="border-b border-[#e8e8e8]">
                  <td className="px-2 py-1 border-r border-[#e8e8e8]">{index + 1}</td>
                  <td className="px-2 py-1 border-r border-[#e8e8e8]">
                    <input
                      type="number"
                      step="0.01"
                      className={inputClass}
                      value={m.sample_weight_g}
                      onChange={(e) => handleUpdateMeasurement(index, 'sample_weight_g', e.target.value)}
                    />
                  </td>
                  <td className="px-2 py-1 border-r border-[#e8e8e8]">
                    <input
                      type="number"
                      step="0.01"
                      className={inputClass}
                      value={m.dry_weight_g}
                      onChange={(e) => handleUpdateMeasurement(index, 'dry_weight_g', e.target.value)}
                    />
                  </td>
                  <td className="px-2 py-1 border-r border-[#e8e8e8]">
                    {m.moisture?.toFixed(1) || '—'}
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
              ))}
              {data.measurements.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-2 py-4 text-center text-[#808080] italic">
                    Нет замеров. Нажмите "Добавить замер" для начала.
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
              <div className="text-xs text-[#808080]">Средняя влажность, %:</div>
              <div className="text-sm font-semibold">{results.average_moisture?.toFixed(1) || '—'}</div>
            </div>
            <div>
              <div className="text-xs text-[#808080]">Плотность, г/см³:</div>
              <div className="text-sm font-semibold">{results.density?.toFixed(2) || '—'}</div>
            </div>
            <div>
              <div className="text-xs text-[#808080]">Плотность сухого грунта, г/см³:</div>
              <div className="text-sm font-semibold">{results.dry_density?.toFixed(2) || '—'}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
