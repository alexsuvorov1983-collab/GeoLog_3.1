// Одноплоскостной срез
// Этап 5: Лабораторные опыты (часть 1)

import { useState } from 'react';
import { SoilTest, ShearTestData, ShearTestResults, ShearMeasurement } from '../../core/dataStore';
import { Journal } from '../../core/journal';

interface Props {
  test: SoilTest;
  onUpdate: (test: SoilTest) => void;
  onClose: () => void;
}

export default function ShearTest({ test, onUpdate, onClose }: Props) {
  const data = (test.data as ShearTestData) || {
    condition: 'natural',
    measurements: []
  };
  
  const results = (test.results as ShearTestResults) || {};

  // Расчёт результатов (линейная регрессия)
  const calculateResults = (testData: ShearTestData): ShearTestResults => {
    if (testData.measurements.length < 2) return {};

    const measurements = testData.measurements.filter(m => m.normal_stress_kpa > 0 && m.shear_stress_kpa > 0);
    
    if (measurements.length < 2) return {};

    // Линейная регрессия: τ = c + σ·tg(φ)
    const n = measurements.length;
    const sumX = measurements.reduce((s, m) => s + m.normal_stress_kpa, 0);
    const sumY = measurements.reduce((s, m) => s + m.shear_stress_kpa, 0);
    const sumXY = measurements.reduce((s, m) => s + m.normal_stress_kpa * m.shear_stress_kpa, 0);
    const sumX2 = measurements.reduce((s, m) => s + m.normal_stress_kpa * m.normal_stress_kpa, 0);

    const denominator = n * sumX2 - sumX * sumX;
    if (denominator === 0) return {};

    // Сцепление c (интерcept)
    const c = (sumY * sumX2 - sumX * sumXY) / denominator;
    
    // Тангенс угла внутреннего трения (slope)
    const tgPhi = (n * sumXY - sumX * sumY) / denominator;
    
    // Угол внутреннего трения φ
    const phi = Math.atan(tgPhi) * (180 / Math.PI);

    // Коэффициент корреляции
    const meanX = sumX / n;
    const meanY = sumY / n;
    const numerator = measurements.reduce((s, m) => s + (m.normal_stress_kpa - meanX) * (m.shear_stress_kpa - meanY), 0);
    const denomX = Math.sqrt(measurements.reduce((s, m) => s + Math.pow(m.normal_stress_kpa - meanX, 2), 0));
    const denomY = Math.sqrt(measurements.reduce((s, m) => s + Math.pow(m.shear_stress_kpa - meanY, 2), 0));
    const correlation = denomX > 0 && denomY > 0 ? numerator / (denomX * denomY) : 0;

    return {
      c: c > 0 ? c : undefined,
      phi: phi > 0 ? phi : undefined,
      correlation: Math.abs(correlation)
    };
  };

  // Добавление замера
  const handleAddMeasurement = () => {
    const newMeasurement: ShearMeasurement = {
      normal_stress_kpa: 0,
      shear_stress_kpa: 0,
      displacement_mm: 0
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
    
    Journal.logEvent('command', 'Добавлен замер среза', 'shear.add_measurement');
  };

  // Обновление замера
  const handleUpdateMeasurement = (index: number, field: keyof ShearMeasurement, value: string) => {
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
    
    Journal.logEvent('command', 'Удалён замер среза', 'shear.delete_measurement');
  };

  // Обновление состояния
  const handleUpdateCondition = (condition: 'natural' | 'saturated' | 'frozen') => {
    const updatedData = {
      ...data,
      condition
    };
    
    onUpdate({
      ...test,
      data: updatedData
    });
  };

  const inputClass = "w-full px-2 py-1 text-sm border border-[#c0c0c0] bg-white rounded focus:border-blue-400 focus:outline-none";
  const labelClass = "text-sm text-[#555] mb-1";

  const conditionLabels = {
    natural: 'Естественное состояние',
    saturated: 'Водонасыщенное состояние',
    frozen: 'Мёрзлое состояние'
  };

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Заголовок */}
      <div className="flex items-center justify-between px-4 py-2 bg-[#e8e8e8] border-b border-[#c0c0c0]">
        <h3 className="text-sm font-bold">Одноплоскостной срез</h3>
        <button
          onClick={onClose}
          className="px-3 py-1 text-xs bg-white border border-[#c0c0c0] rounded hover:bg-[#e8e8ff]"
        >
          Закрыть
        </button>
      </div>

      {/* Содержимое */}
      <div className="flex-1 overflow-auto p-4">
        {/* Состояние образца */}
        <div className="mb-4">
          <label className={labelClass}>Состояние образца:</label>
          <select
            className={inputClass}
            value={data.condition}
            onChange={(e) => handleUpdateCondition(e.target.value as any)}
          >
            <option value="natural">{conditionLabels.natural}</option>
            <option value="saturated">{conditionLabels.saturated}</option>
            <option value="frozen">{conditionLabels.frozen}</option>
          </select>
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
                <th className="px-2 py-1 text-left border-r border-[#c0c0c0]">Нормальное напряжение, кПа</th>
                <th className="px-2 py-1 text-left border-r border-[#c0c0c0]">Касательное напряжение, кПа</th>
                <th className="px-2 py-1 text-left border-r border-[#c0c0c0]">Смещение, мм</th>
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
                      step="0.1"
                      className={inputClass}
                      value={m.normal_stress_kpa}
                      onChange={(e) => handleUpdateMeasurement(index, 'normal_stress_kpa', e.target.value)}
                    />
                  </td>
                  <td className="px-2 py-1 border-r border-[#e8e8e8]">
                    <input
                      type="number"
                      step="0.1"
                      className={inputClass}
                      value={m.shear_stress_kpa}
                      onChange={(e) => handleUpdateMeasurement(index, 'shear_stress_kpa', e.target.value)}
                    />
                  </td>
                  <td className="px-2 py-1 border-r border-[#e8e8e8]">
                    <input
                      type="number"
                      step="0.01"
                      className={inputClass}
                      value={m.displacement_mm || ''}
                      onChange={(e) => handleUpdateMeasurement(index, 'displacement_mm', e.target.value)}
                      placeholder="—"
                    />
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
              <div className="text-xs text-[#808080]">Сцепление c, кПа:</div>
              <div className="text-sm font-semibold">{results.c?.toFixed(1) || '—'}</div>
            </div>
            <div>
              <div className="text-xs text-[#808080]">Угол внутреннего трения φ, град:</div>
              <div className="text-sm font-semibold">{results.phi?.toFixed(1) || '—'}</div>
            </div>
            <div>
              <div className="text-xs text-[#808080]">Коэффициент корреляции:</div>
              <div className="text-sm font-semibold">{results.correlation?.toFixed(3) || '—'}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
