import React from 'react';
import { SoilTest, SwellShrinkTestData, SwellShrinkTestResults, SwellShrinkMeasurement } from '../../core/dataStore';

interface SwellShrinkTestProps {
  test: SoilTest;
  onUpdate: (updatedTest: SoilTest) => void;
  onClose: () => void;
}

export const SwellShrinkTest: React.FC<SwellShrinkTestProps> = ({ test, onUpdate, onClose }) => {
  const testData = (test.data as SwellShrinkTestData) || {
    initial_moisture: 0,
    final_moisture: 0,
    initial_height_mm: 20,
    swell_measurements: [],
    shrink_measurements: []
  };

  const handleAddSwellMeasurement = () => {
    const newMeasurement: SwellShrinkMeasurement = { pressure_kpa: 0, deformation_mm: 0, time_hours: 0 };
    const updatedData = { ...testData, swell_measurements: [...testData.swell_measurements, newMeasurement] };
    onUpdate({ ...test, data: updatedData });
  };

  const handleAddShrinkMeasurement = () => {
    const newMeasurement: SwellShrinkMeasurement = { pressure_kpa: 0, deformation_mm: 0, time_hours: 0 };
    const updatedData = { ...testData, shrink_measurements: [...testData.shrink_measurements, newMeasurement] };
    onUpdate({ ...test, data: updatedData });
  };

  const handleUpdateSwellMeasurement = (index: number, field: keyof SwellShrinkMeasurement, value: string) => {
    const numValue = parseFloat(value) || 0;
    const updatedMeasurements = [...testData.swell_measurements];
    updatedMeasurements[index] = { ...updatedMeasurements[index], [field]: numValue };
    const updatedData = { ...testData, swell_measurements: updatedMeasurements };
    const results = calculateResults(updatedData);
    onUpdate({ ...test, data: updatedData, results });
  };

  const handleUpdateShrinkMeasurement = (index: number, field: keyof SwellShrinkMeasurement, value: string) => {
    const numValue = parseFloat(value) || 0;
    const updatedMeasurements = [...testData.shrink_measurements];
    updatedMeasurements[index] = { ...updatedMeasurements[index], [field]: numValue };
    const updatedData = { ...testData, shrink_measurements: updatedMeasurements };
    const results = calculateResults(updatedData);
    onUpdate({ ...test, data: updatedData, results });
  };

  const handleDeleteSwellMeasurement = (index: number) => {
    const updatedMeasurements = testData.swell_measurements.filter((_m: SwellShrinkMeasurement, i: number) => i !== index);
    const updatedData = { ...testData, swell_measurements: updatedMeasurements };
    const results = calculateResults(updatedData);
    onUpdate({ ...test, data: updatedData, results });
  };

  const handleDeleteShrinkMeasurement = (index: number) => {
    const updatedMeasurements = testData.shrink_measurements.filter((_m: SwellShrinkMeasurement, i: number) => i !== index);
    const updatedData = { ...testData, shrink_measurements: updatedMeasurements };
    const results = calculateResults(updatedData);
    onUpdate({ ...test, data: updatedData, results });
  };

  const calculateResults = (data: SwellShrinkTestData): SwellShrinkTestResults => {
    if (data.swell_measurements.length === 0 && data.shrink_measurements.length === 0) return {};
    const h0 = data.initial_height_mm || 20;
    
    // Относительное набухание
    const maxSwellDeformation = data.swell_measurements.reduce((max: number, m: SwellShrinkMeasurement) => Math.max(max, m.deformation_mm), 0);
    const Psw = h0 > 0 ? (maxSwellDeformation / h0) * 100 : 0;
    
    // Относительная усадка
    const maxShrinkDeformation = data.shrink_measurements.reduce((max: number, m: SwellShrinkMeasurement) => Math.max(max, Math.abs(m.deformation_mm)), 0);
    const shrinkage = h0 > 0 ? (maxShrinkDeformation / h0) * 100 : 0;
    
    // Давление набухания (упрощённо)
    const swell_pressure = data.swell_measurements.length > 0 ? data.swell_measurements[data.swell_measurements.length - 1].pressure_kpa : 0;
    
    return {
      Psw: Psw > 0 ? Psw : undefined,
      moisture_swell: data.final_moisture,
      shrinkage: shrinkage > 0 ? shrinkage : undefined,
      swell_pressure: swell_pressure > 0 ? swell_pressure : undefined
    };
  };

  const results = (test.results as SwellShrinkTestResults) || calculateResults(testData);

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">Набухание и усадка</h3>
        <button onClick={onClose} className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300">Закрыть</button>
      </div>
      <div className="grid grid-cols-3 gap-4 mb-4">
        <div>
          <label className="block text-sm font-medium mb-2">Начальная влажность, %:</label>
          <input type="number" step="0.1" value={testData.initial_moisture || 0} onChange={(e) => onUpdate({ ...test, data: { ...testData, initial_moisture: parseFloat(e.target.value) || 0 } })} className="px-3 py-2 border rounded w-full" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">Конечная влажность, %:</label>
          <input type="number" step="0.1" value={testData.final_moisture || 0} onChange={(e) => onUpdate({ ...test, data: { ...testData, final_moisture: parseFloat(e.target.value) || 0 } })} className="px-3 py-2 border rounded w-full" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">Начальная высота, мм:</label>
          <input type="number" step="0.1" value={testData.initial_height_mm || 20} onChange={(e) => onUpdate({ ...test, data: { ...testData, initial_height_mm: parseFloat(e.target.value) || 0 } })} className="px-3 py-2 border rounded w-full" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <div className="flex justify-between items-center mb-2">
            <h4 className="font-medium">Набухание:</h4>
            <button onClick={handleAddSwellMeasurement} className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600">+ Добавить</button>
          </div>
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-100">
                <th className="border p-2">P, кПа</th>
                <th className="border p-2">Δh, мм</th>
                <th className="border p-2">Действия</th>
              </tr>
            </thead>
            <tbody>
              {testData.swell_measurements.map((m: SwellShrinkMeasurement, index: number) => (
                <tr key={index}>
                  <td className="border p-2"><input type="number" step="0.1" value={m.pressure_kpa} onChange={(e) => handleUpdateSwellMeasurement(index, 'pressure_kpa', e.target.value)} className="w-full px-2 py-1 border rounded" /></td>
                  <td className="border p-2"><input type="number" step="0.01" value={m.deformation_mm} onChange={(e) => handleUpdateSwellMeasurement(index, 'deformation_mm', e.target.value)} className="w-full px-2 py-1 border rounded" /></td>
                  <td className="border p-2 text-center"><button onClick={() => handleDeleteSwellMeasurement(index)} className="px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600">Удалить</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div>
          <div className="flex justify-between items-center mb-2">
            <h4 className="font-medium">Усадка:</h4>
            <button onClick={handleAddShrinkMeasurement} className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600">+ Добавить</button>
          </div>
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-100">
                <th className="border p-2">P, кПа</th>
                <th className="border p-2">Δh, мм</th>
                <th className="border p-2">Действия</th>
              </tr>
            </thead>
            <tbody>
              {testData.shrink_measurements.map((m: SwellShrinkMeasurement, index: number) => (
                <tr key={index}>
                  <td className="border p-2"><input type="number" step="0.1" value={m.pressure_kpa} onChange={(e) => handleUpdateShrinkMeasurement(index, 'pressure_kpa', e.target.value)} className="w-full px-2 py-1 border rounded" /></td>
                  <td className="border p-2"><input type="number" step="0.01" value={m.deformation_mm} onChange={(e) => handleUpdateShrinkMeasurement(index, 'deformation_mm', e.target.value)} className="w-full px-2 py-1 border rounded" /></td>
                  <td className="border p-2 text-center"><button onClick={() => handleDeleteShrinkMeasurement(index)} className="px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600">Удалить</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <div className="bg-gray-50 p-4 rounded mt-4">
        <h4 className="font-medium mb-2">Результаты:</h4>
        <div className="grid grid-cols-2 gap-4">
          <div><span className="text-sm text-gray-600">Относительное набухание Psw:</span><div className="font-semibold">{results.Psw?.toFixed(2) || '—'} %</div></div>
          <div><span className="text-sm text-gray-600">Влажность набухания:</span><div className="font-semibold">{results.moisture_swell?.toFixed(1) || '—'} %</div></div>
          <div><span className="text-sm text-gray-600">Относительная усадка:</span><div className="font-semibold">{results.shrinkage?.toFixed(2) || '—'} %</div></div>
          <div><span className="text-sm text-gray-600">Давление набухания:</span><div className="font-semibold">{results.swell_pressure?.toFixed(1) || '—'} кПа</div></div>
        </div>
      </div>
    </div>
  );
};
