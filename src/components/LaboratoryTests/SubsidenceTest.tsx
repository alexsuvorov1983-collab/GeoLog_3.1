import React from 'react';
import { SoilTest, SubsidenceTestData, SubsidenceTestResults, SubsidenceMeasurement } from '../../core/dataStore';

interface SubsidenceTestProps {
  test: SoilTest;
  onUpdate: (updatedTest: SoilTest) => void;
  onClose: () => void;
}

export const SubsidenceTest: React.FC<SubsidenceTestProps> = ({ test, onUpdate, onClose }) => {
  const testData = (test.data as SubsidenceTestData) || {
    initial_height_mm: 20,
    initial_moisture: 0,
    measurements: []
  };

  const handleAddMeasurement = () => {
    const newMeasurement: SubsidenceMeasurement = { pressure_mpa: 0, deformation_mm: 0, is_saturated: false };
    const updatedData = { ...testData, measurements: [...testData.measurements, newMeasurement] };
    onUpdate({ ...test, data: updatedData });
  };

  const handleUpdateMeasurement = (index: number, field: keyof SubsidenceMeasurement, value: string | boolean) => {
    const updatedMeasurements = [...testData.measurements];
    if (field === 'is_saturated') {
      updatedMeasurements[index] = { ...updatedMeasurements[index], is_saturated: value as boolean };
    } else {
      const numValue = parseFloat(value as string) || 0;
      updatedMeasurements[index] = { ...updatedMeasurements[index], [field]: numValue };
    }
    const updatedData = { ...testData, measurements: updatedMeasurements };
    const results = calculateResults(updatedData);
    onUpdate({ ...test, data: updatedData, results });
  };

  const handleDeleteMeasurement = (index: number) => {
    const updatedMeasurements = testData.measurements.filter((_m: SubsidenceMeasurement, i: number) => i !== index);
    const updatedData = { ...testData, measurements: updatedMeasurements };
    const results = calculateResults(updatedData);
    onUpdate({ ...test, data: updatedData, results });
  };

  const calculateResults = (data: SubsidenceTestData): SubsidenceTestResults => {
    if (data.measurements.length === 0) return {};
    const h0 = data.initial_height_mm || 20;
    
    // Относительная просадочность при каждом давлении
    const relative_subsidence: Record<number, number> = {};
    data.measurements.forEach((m: SubsidenceMeasurement) => {
      if (!m.is_saturated && h0 > 0) {
        relative_subsidence[m.pressure_mpa] = (m.deformation_mm / h0) * 100;
      }
    });
    
    // Начальное просадочное давление (упрощённо)
    const initial_subsidence_pressure = data.measurements.length > 0 ? data.measurements[0].pressure_mpa : 0;
    
    // Бытовое давление (упрощённо)
    const household_pressure = data.measurements.length > 1 ? data.measurements[1].pressure_mpa : 0;
    
    // Модуль деформации при замачивании
    const saturatedMeasurements = data.measurements.filter((m: SubsidenceMeasurement) => m.is_saturated);
    let E_sat = 0;
    if (saturatedMeasurements.length >= 2) {
      const deltaP = saturatedMeasurements[saturatedMeasurements.length - 1].pressure_mpa - saturatedMeasurements[0].pressure_mpa;
      const deltaH = saturatedMeasurements[saturatedMeasurements.length - 1].deformation_mm - saturatedMeasurements[0].deformation_mm;
      E_sat = deltaH > 0 ? (deltaP * h0) / deltaH : 0;
    }
    
    return {
      relative_subsidence,
      initial_subsidence_pressure: initial_subsidence_pressure > 0 ? initial_subsidence_pressure : undefined,
      household_pressure: household_pressure > 0 ? household_pressure : undefined,
      E_sat: E_sat > 0 ? E_sat : undefined
    };
  };

  const results = (test.results as SubsidenceTestResults) || calculateResults(testData);

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">Просадочность</h3>
        <button onClick={onClose} className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300">Закрыть</button>
      </div>
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <label className="block text-sm font-medium mb-2">Начальная высота, мм:</label>
          <input type="number" step="0.1" value={testData.initial_height_mm || 20} onChange={(e) => onUpdate({ ...test, data: { ...testData, initial_height_mm: parseFloat(e.target.value) || 0 } })} className="px-3 py-2 border rounded w-full" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">Начальная влажность, %:</label>
          <input type="number" step="0.1" value={testData.initial_moisture || 0} onChange={(e) => onUpdate({ ...test, data: { ...testData, initial_moisture: parseFloat(e.target.value) || 0 } })} className="px-3 py-2 border rounded w-full" />
        </div>
      </div>
      <div className="mb-4">
        <div className="flex justify-between items-center mb-2">
          <h4 className="font-medium">Замеры:</h4>
          <button onClick={handleAddMeasurement} className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600">+ Добавить замер</button>
        </div>
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-100">
              <th className="border p-2">№</th>
              <th className="border p-2">P, МПа</th>
              <th className="border p-2">Δh, мм</th>
              <th className="border p-2">Замоченное</th>
              <th className="border p-2">Действия</th>
            </tr>
          </thead>
          <tbody>
            {testData.measurements.map((m: SubsidenceMeasurement, index: number) => (
              <tr key={index}>
                <td className="border p-2 text-center">{index + 1}</td>
                <td className="border p-2"><input type="number" step="0.01" value={m.pressure_mpa} onChange={(e) => handleUpdateMeasurement(index, 'pressure_mpa', e.target.value)} className="w-full px-2 py-1 border rounded" /></td>
                <td className="border p-2"><input type="number" step="0.01" value={m.deformation_mm} onChange={(e) => handleUpdateMeasurement(index, 'deformation_mm', e.target.value)} className="w-full px-2 py-1 border rounded" /></td>
                <td className="border p-2 text-center"><input type="checkbox" checked={m.is_saturated} onChange={(e) => handleUpdateMeasurement(index, 'is_saturated', e.target.checked)} className="w-4 h-4" /></td>
                <td className="border p-2 text-center"><button onClick={() => handleDeleteMeasurement(index)} className="px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600">Удалить</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="bg-gray-50 p-4 rounded">
        <h4 className="font-medium mb-2">Результаты:</h4>
        <div className="grid grid-cols-2 gap-4">
          <div><span className="text-sm text-gray-600">Начальное просадочное давление:</span><div className="font-semibold">{results.initial_subsidence_pressure?.toFixed(2) || '—'} МПа</div></div>
          <div><span className="text-sm text-gray-600">Бытовое давление:</span><div className="font-semibold">{results.household_pressure?.toFixed(2) || '—'} МПа</div></div>
          <div><span className="text-sm text-gray-600">Модуль деформации при замачивании:</span><div className="font-semibold">{results.E_sat?.toFixed(2) || '—'} МПа</div></div>
          <div>
            <span className="text-sm text-gray-600">Относительная просадочность:</span>
            <div className="text-sm">
              {results.relative_subsidence ? Object.entries(results.relative_subsidence).map(([p, v]) => (
                <div key={p}>{p} МПа: {v.toFixed(2)}%</div>
              )) : '—'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
