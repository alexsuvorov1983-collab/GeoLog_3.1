import React, { useState } from 'react';
import { SoilTest, TriaxialTestData, TriaxialTestResults, TriaxialMeasurement } from '../../core/dataStore';

interface TriaxialTestProps {
  test: SoilTest;
  onUpdate: (updatedTest: SoilTest) => void;
  onClose: () => void;
}

export const TriaxialTest: React.FC<TriaxialTestProps> = ({ test, onUpdate, onClose }) => {
  const testData = (test.data as TriaxialTestData) || {
    test_scheme: 'CU',
    measurements: [],
    initial_void_ratio: 0.7
  };

  const handleAddMeasurement = () => {
    const newMeasurement: TriaxialMeasurement = {
      axial_stress_mpa: 0,
      radial_stress_mpa: 0,
      axial_strain: 0,
      radial_strain: 0
    };

    const updatedData = {
      ...testData,
      measurements: [...testData.measurements, newMeasurement]
    };

    onUpdate({ ...test, data: updatedData });
  };

  const handleUpdateMeasurement = (index: number, field: keyof TriaxialMeasurement, value: string) => {
    const numValue = parseFloat(value) || 0;
    const updatedMeasurements = [...testData.measurements];
    updatedMeasurements[index] = { ...updatedMeasurements[index], [field]: numValue };

    const updatedData = { ...testData, measurements: updatedMeasurements };
    const results = calculateResults(updatedData);

    onUpdate({ ...test, data: updatedData, results });
  };

  const handleDeleteMeasurement = (index: number) => {
    const updatedMeasurements = testData.measurements.filter((_m: TriaxialMeasurement, i: number) => i !== index);
    const updatedData = { ...testData, measurements: updatedMeasurements };
    const results = calculateResults(updatedData);

    onUpdate({ ...test, data: updatedData, results });
  };

  const handleUpdateTestScheme = (scheme: 'CU' | 'CD' | 'UU') => {
    const updatedData = { ...testData, test_scheme: scheme };
    onUpdate({ ...test, data: updatedData });
  };

  const handleUpdateVoidRatio = (value: string) => {
    const numValue = parseFloat(value) || 0;
    const updatedData = { ...testData, initial_void_ratio: numValue };
    onUpdate({ ...test, data: updatedData });
  };

  const calculateResults = (data: TriaxialTestData): TriaxialTestResults => {
    if (data.measurements.length < 2) return {};

    const measurements = data.measurements.filter((m: TriaxialMeasurement) => m.axial_stress_mpa > 0 && m.radial_stress_mpa > 0);
    if (measurements.length < 2) return {};

    // Расчёт модуля деформации E_tri
    const deltaSigma1 = measurements[measurements.length - 1].axial_stress_mpa - measurements[0].axial_stress_mpa;
    const deltaEpsilon1 = measurements[measurements.length - 1].axial_strain || 0.01;
    const E_tri = deltaEpsilon1 > 0 ? deltaSigma1 / deltaEpsilon1 : 0;

    // Расчёт коэффициента Пуассона ν
    const deltaEpsilon3 = measurements[measurements.length - 1].radial_strain || 0;
    const nu = deltaEpsilon1 > 0 ? -deltaEpsilon3 / deltaEpsilon1 : 0;

    // Модуль сдвига G
    const G = E_tri / (2 * (1 + nu));

    // Модуль объёмной деформации K
    const K = E_tri / (3 * (1 - 2 * nu));

    // Прочностные характеристики (упрощённый расчёт по Мору-Кулону)
    const sigma1 = measurements[measurements.length - 1].axial_stress_mpa;
    const sigma3 = measurements[measurements.length - 1].radial_stress_mpa;
    
    // Угол внутреннего трения
    const sinPhi = (sigma1 - sigma3) / (sigma1 + sigma3);
    const phi_tri = Math.asin(sinPhi) * (180 / Math.PI);

    // Сцепление (упрощённо)
    const c_tri = sigma3 * (1 - sinPhi) / (2 * Math.cos(phi_tri * Math.PI / 180));

    // Сопротивление недренированному сдвигу
    const cu = (sigma1 - sigma3) / 2;

    return {
      E_tri: E_tri > 0 ? E_tri : undefined,
      nu: nu > 0 ? nu : undefined,
      G: G > 0 ? G : undefined,
      K: K > 0 ? K : undefined,
      cu: cu > 0 ? cu : undefined,
      phi_tri: phi_tri > 0 ? phi_tri : undefined,
      c_tri: c_tri > 0 ? c_tri : undefined
    };
  };

  const results = (test.results as TriaxialTestResults) || calculateResults(testData);

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">Трёхосное сжатие (ГОСТ 12248)</h3>
        <button onClick={onClose} className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300">
          Закрыть
        </button>
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium mb-2">Схема испытания:</label>
        <select
          value={testData.test_scheme}
          onChange={(e) => handleUpdateTestScheme(e.target.value as 'CU' | 'CD' | 'UU')}
          className="px-3 py-2 border rounded"
        >
          <option value="CU">CU - Консолидированно-недренированное</option>
          <option value="CD">CD - Консолидированно-дренированное</option>
          <option value="UU">UU - Неконсолидированно-недренированное</option>
        </select>
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium mb-2">Начальный коэффициент пористости e₀:</label>
        <input
          type="number"
          step="0.01"
          value={testData.initial_void_ratio || 0}
          onChange={(e) => handleUpdateVoidRatio(e.target.value)}
          className="px-3 py-2 border rounded w-32"
        />
      </div>

      <div className="mb-4">
        <div className="flex justify-between items-center mb-2">
          <h4 className="font-medium">Замеры:</h4>
          <button onClick={handleAddMeasurement} className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600">
            + Добавить замер
          </button>
        </div>

        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-100">
              <th className="border p-2">№</th>
              <th className="border p-2">σ₁, МПа</th>
              <th className="border p-2">σ₃, МПа</th>
              <th className="border p-2">ε₁</th>
              <th className="border p-2">ε₃</th>
              <th className="border p-2">Действия</th>
            </tr>
          </thead>
          <tbody>
            {testData.measurements.map((m: TriaxialMeasurement, index: number) => (
              <tr key={index}>
                <td className="border p-2 text-center">{index + 1}</td>
                <td className="border p-2">
                  <input
                    type="number"
                    step="0.01"
                    value={m.axial_stress_mpa}
                    onChange={(e) => handleUpdateMeasurement(index, 'axial_stress_mpa', e.target.value)}
                    className="w-full px-2 py-1 border rounded"
                  />
                </td>
                <td className="border p-2">
                  <input
                    type="number"
                    step="0.01"
                    value={m.radial_stress_mpa}
                    onChange={(e) => handleUpdateMeasurement(index, 'radial_stress_mpa', e.target.value)}
                    className="w-full px-2 py-1 border rounded"
                  />
                </td>
                <td className="border p-2">
                  <input
                    type="number"
                    step="0.001"
                    value={m.axial_strain || 0}
                    onChange={(e) => handleUpdateMeasurement(index, 'axial_strain', e.target.value)}
                    className="w-full px-2 py-1 border rounded"
                  />
                </td>
                <td className="border p-2">
                  <input
                    type="number"
                    step="0.001"
                    value={m.radial_strain || 0}
                    onChange={(e) => handleUpdateMeasurement(index, 'radial_strain', e.target.value)}
                    className="w-full px-2 py-1 border rounded"
                  />
                </td>
                <td className="border p-2 text-center">
                  <button
                    onClick={() => handleDeleteMeasurement(index)}
                    className="px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600"
                  >
                    Удалить
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="bg-gray-50 p-4 rounded">
        <h4 className="font-medium mb-2">Результаты расчёта:</h4>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <span className="text-sm text-gray-600">Модуль деформации E_tri:</span>
            <div className="font-semibold">{results.E_tri?.toFixed(2) || '—'} МПа</div>
          </div>
          <div>
            <span className="text-sm text-gray-600">Коэффициент Пуассона ν:</span>
            <div className="font-semibold">{results.nu?.toFixed(3) || '—'}</div>
          </div>
          <div>
            <span className="text-sm text-gray-600">Модуль сдвига G:</span>
            <div className="font-semibold">{results.G?.toFixed(2) || '—'} МПа</div>
          </div>
          <div>
            <span className="text-sm text-gray-600">Модуль объёмной деформации K:</span>
            <div className="font-semibold">{results.K?.toFixed(2) || '—'} МПа</div>
          </div>
          <div>
            <span className="text-sm text-gray-600">Сопротивление недренированному сдвигу cu:</span>
            <div className="font-semibold">{results.cu?.toFixed(2) || '—'} кПа</div>
          </div>
          <div>
            <span className="text-sm text-gray-600">Угол внутреннего трения φ:</span>
            <div className="font-semibold">{results.phi_tri?.toFixed(1) || '—'}°</div>
          </div>
          <div>
            <span className="text-sm text-gray-600">Сцепление c:</span>
            <div className="font-semibold">{results.c_tri?.toFixed(2) || '—'} кПа</div>
          </div>
        </div>
      </div>
    </div>
  );
};
