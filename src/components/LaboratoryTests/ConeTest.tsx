import React from 'react';
import { SoilTest, ConeTestData, ConeTestResults, ConeMeasurement } from '../../core/dataStore';

interface ConeTestProps {
  test: SoilTest;
  onUpdate: (updatedTest: SoilTest) => void;
  onClose: () => void;
}

export const ConeTest: React.FC<ConeTestProps> = ({ test, onUpdate, onClose }) => {
  const testData = (test.data as ConeTestData) || {
    cone_type: 'standard',
    measurements: [],
    transition_table: [
      { depth_mm: 0, consistency_index: 0 },
      { depth_mm: 5, consistency_index: 0.25 },
      { depth_mm: 10, consistency_index: 0.5 },
      { depth_mm: 15, consistency_index: 0.75 },
      { depth_mm: 20, consistency_index: 1.0 }
    ]
  };

  const handleAddMeasurement = () => {
    const newMeasurement: ConeMeasurement = { depth_mm: 0, time_min: 0 };
    const updatedData = { ...testData, measurements: [...testData.measurements, newMeasurement] };
    onUpdate({ ...test, data: updatedData });
  };

  const handleUpdateMeasurement = (index: number, field: keyof ConeMeasurement, value: string) => {
    const numValue = parseFloat(value) || 0;
    const updatedMeasurements = [...testData.measurements];
    updatedMeasurements[index] = { ...updatedMeasurements[index], [field]: numValue };
    const updatedData = { ...testData, measurements: updatedMeasurements };
    const results = calculateResults(updatedData);
    onUpdate({ ...test, data: updatedData, results });
  };

  const handleDeleteMeasurement = (index: number) => {
    const updatedMeasurements = testData.measurements.filter((_m: ConeMeasurement, i: number) => i !== index);
    const updatedData = { ...testData, measurements: updatedMeasurements };
    const results = calculateResults(updatedData);
    onUpdate({ ...test, data: updatedData, results });
  };

  const calculateResults = (data: ConeTestData): ConeTestResults => {
    if (data.measurements.length === 0 || !data.transition_table) return {};
    const avgDepth = data.measurements.reduce((sum: number, m: ConeMeasurement) => sum + m.depth_mm, 0) / data.measurements.length;
    const table = data.transition_table.sort((a, b) => a.depth_mm - b.depth_mm);
    let consistency = 0;
    for (let i = 0; i < table.length - 1; i++) {
      if (avgDepth >= table[i].depth_mm && avgDepth <= table[i + 1].depth_mm) {
        const ratio = (avgDepth - table[i].depth_mm) / (table[i + 1].depth_mm - table[i].depth_mm);
        consistency = table[i].consistency_index + ratio * (table[i + 1].consistency_index - table[i].consistency_index);
        break;
      }
    }
    let description = '';
    if (consistency < 0.25) description = 'Твёрдая';
    else if (consistency < 0.5) description = 'Полутвёрдая';
    else if (consistency < 0.75) description = 'Мягкопластичная';
    else if (consistency < 1.0) description = 'Текучепластичная';
    else description = 'Текучая';
    return { consistency_index: consistency, consistency_description: description };
  };

  const results = (test.results as ConeTestResults) || calculateResults(testData);

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">Конус Бойченко</h3>
        <button onClick={onClose} className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300">Закрыть</button>
      </div>
      <div className="mb-4">
        <label className="block text-sm font-medium mb-2">Тип конуса:</label>
        <select value={testData.cone_type} onChange={(e) => onUpdate({ ...test, data: { ...testData, cone_type: e.target.value as 'standard' | 'modified' } })} className="px-3 py-2 border rounded">
          <option value="standard">Стандартный</option>
          <option value="modified">Модифицированный</option>
        </select>
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
              <th className="border p-2">Глубина, мм</th>
              <th className="border p-2">Время, мин</th>
              <th className="border p-2">Действия</th>
            </tr>
          </thead>
          <tbody>
            {testData.measurements.map((m: ConeMeasurement, index: number) => (
              <tr key={index}>
                <td className="border p-2 text-center">{index + 1}</td>
                <td className="border p-2"><input type="number" step="0.1" value={m.depth_mm} onChange={(e) => handleUpdateMeasurement(index, 'depth_mm', e.target.value)} className="w-full px-2 py-1 border rounded" /></td>
                <td className="border p-2"><input type="number" step="0.1" value={m.time_min || 0} onChange={(e) => handleUpdateMeasurement(index, 'time_min', e.target.value)} className="w-full px-2 py-1 border rounded" /></td>
                <td className="border p-2 text-center"><button onClick={() => handleDeleteMeasurement(index)} className="px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600">Удалить</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="bg-gray-50 p-4 rounded">
        <h4 className="font-medium mb-2">Результаты:</h4>
        <div className="grid grid-cols-2 gap-4">
          <div><span className="text-sm text-gray-600">Показатель консистенции:</span><div className="font-semibold">{results.consistency_index?.toFixed(2) || '—'}</div></div>
          <div><span className="text-sm text-gray-600">Описание:</span><div className="font-semibold">{results.consistency_description || '—'}</div></div>
        </div>
      </div>
    </div>
  );
};
