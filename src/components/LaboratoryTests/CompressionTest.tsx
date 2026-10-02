// Компрессионные испытания
// Этап 5: Лабораторные опыты (часть 1)

import { useState } from 'react';
import { SoilTest, CompressionTestData, CompressionTestResults, CompressionMeasurement } from '../../core/dataStore';
import { Journal } from '../../core/journal';

interface Props {
  test: SoilTest;
  onUpdate: (test: SoilTest) => void;
  onClose: () => void;
}

export default function CompressionTest({ test, onUpdate, onClose }: Props) {
  const data = (test.data as CompressionTestData) || {
    initial_height_mm: 20,
    ring_area_cm2: 28.27,
    measurements: []
  };
  
  const results = (test.results as CompressionTestResults) || {};

  // Расчёт результатов
  const calculateResults = (testData: CompressionTestData): CompressionTestResults => {
    if (testData.measurements.length < 2) return {};

    const measurements = [...testData.measurements].sort((a, b) => a.pressure_mpa - b.pressure_mpa);
    
    // Начальный коэффициент пористости (упрощённый расчёт)
    const e0 = 0.7; // По умолчанию, если нет данных
    
    // Расчёт коэффициента сжимаемости m0
    const dp = measurements[measurements.length - 1].pressure_mpa - measurements[0].pressure_mpa;
    const dh = measurements[measurements.length - 1].height_mm - measurements[0].height_mm;
    const h0 = testData.initial_height_mm;
    
    const m0 = dp > 0 ? Math.abs(dh / h0) / dp : 0;
    
    // Модуль деформации Eoed
    const Eoed = m0 > 0 ? (1 + e0) / m0 : 0;
    
    return {
      e0,
      m0: m0 > 0 ? m0 : undefined,
      Eoed: Eoed > 0 ? Eoed : undefined,
    };
  };

  // Добавление замера
  const handleAddMeasurement = () => {
    const newMeasurement: CompressionMeasurement = {
      pressure_mpa: 0,
      height_mm: data.initial_height_mm,
      deformation_mm: 0
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
    
    Journal.logEvent('command', 'Добавлен замер компрессии', 'compression.add_measurement');
  };

  // Обновление замера
  const handleUpdateMeasurement = (index: number, field: keyof CompressionMeasurement, value: string) => {
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
    
    Journal.logEvent('command', 'Удалён замер компрессии', 'compression.delete_measurement');
  };

  // Обновление параметров опыта
  const handleUpdateParam = (field: keyof CompressionTestData, value: string) => {
    const numValue = parseFloat(value.replace(',', '.'));
    if (isNaN(numValue)) return;
    
    const updatedData = {
      ...data,
      [field]: numValue
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

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Заголовок */}
      <div className="flex items-center justify-between px-4 py-2 bg-[#e8e8e8] border-b border-[#c0c0c0]">
        <h3 className="text-sm font-bold">Компрессионные испытания</h3>
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
        <div className="grid grid-cols-3 gap-4 mb-4">
          <div>
            <label className={labelClass}>Начальная высота, мм:</label>
            <input
              type="number"
              step="0.1"
              className={inputClass}
              value={data.initial_height_mm}
              onChange={(e) => handleUpdateParam('initial_height_mm', e.target.value)}
            />
          </div>
          <div>
            <label className={labelClass}>Площадь кольца, см²:</label>
            <input
              type="number"
              step="0.01"
              className={inputClass}
              value={data.ring_area_cm2}
              onChange={(e) => handleUpdateParam('ring_area_cm2', e.target.value)}
            />
          </div>
          <div>
            <label className={labelClass}>Высота после опыта, мм:</label>
            <input
              type="number"
              step="0.01"
              className={inputClass}
              value={data.final_height_mm || ''}
              onChange={(e) => handleUpdateParam('final_height_mm', e.target.value)}
              placeholder="Не указано"
            />
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
                <th className="px-2 py-1 text-left border-r border-[#c0c0c0]">Давление, МПа</th>
                <th className="px-2 py-1 text-left border-r border-[#c0c0c0]">Высота, мм</th>
                <th className="px-2 py-1 text-left border-r border-[#c0c0c0]">Деформация, мм</th>
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
                      value={m.pressure_mpa}
                      onChange={(e) => handleUpdateMeasurement(index, 'pressure_mpa', e.target.value)}
                    />
                  </td>
                  <td className="px-2 py-1 border-r border-[#e8e8e8]">
                    <input
                      type="number"
                      step="0.01"
                      className={inputClass}
                      value={m.height_mm}
                      onChange={(e) => handleUpdateMeasurement(index, 'height_mm', e.target.value)}
                    />
                  </td>
                  <td className="px-2 py-1 border-r border-[#e8e8e8]">
                    <input
                      type="number"
                      step="0.01"
                      className={inputClass}
                      value={m.deformation_mm}
                      onChange={(e) => handleUpdateMeasurement(index, 'deformation_mm', e.target.value)}
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
              <div className="text-xs text-[#808080]">Начальный коэффициент пористости e₀:</div>
              <div className="text-sm font-semibold">{results.e0?.toFixed(3) || '—'}</div>
            </div>
            <div>
              <div className="text-xs text-[#808080]">Коэффициент сжимаемости m₀, МПа⁻¹:</div>
              <div className="text-sm font-semibold">{results.m0?.toFixed(4) || '—'}</div>
            </div>
            <div>
              <div className="text-xs text-[#808080]">Модуль деформации Eoed, МПа:</div>
              <div className="text-sm font-semibold">{results.Eoed?.toFixed(2) || '—'}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
