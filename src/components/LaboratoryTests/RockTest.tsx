import React from 'react';
import { SoilTest, RockTestData, RockTestResults } from '../../core/dataStore';

interface RockTestProps {
  test: SoilTest;
  onUpdate: (updatedTest: SoilTest) => void;
  onClose: () => void;
}

export const RockTest: React.FC<RockTestProps> = ({ test, onUpdate, onClose }) => {
  const testData = (test.data as RockTestData) || {
    Rc_dry_measurements: [],
    Rc_sat_measurements: [],
    RQD_measurements: [],
    tensile_strength: 0,
    natural_slope_angle: 0,
    core_density: 0
  };

  const handleAddRcDryMeasurement = () => {
    const newMeasurement = { sample_id: '', force_kN: 0, area_cm2: 0 };
    const updatedData = { ...testData, Rc_dry_measurements: [...(testData.Rc_dry_measurements || []), newMeasurement] };
    onUpdate({ ...test, data: updatedData });
  };

  const handleAddRcSatMeasurement = () => {
    const newMeasurement = { sample_id: '', force_kN: 0, area_cm2: 0 };
    const updatedData = { ...testData, Rc_sat_measurements: [...(testData.Rc_sat_measurements || []), newMeasurement] };
    onUpdate({ ...test, data: updatedData });
  };

  const handleAddRQDMeasurement = () => {
    const newMeasurement = { core_length_m: 0, intact_length_m: 0 };
    const updatedData = { ...testData, RQD_measurements: [...(testData.RQD_measurements || []), newMeasurement] };
    onUpdate({ ...test, data: updatedData });
  };

  const handleUpdateRcDryMeasurement = (index: number, field: string, value: string) => {
    const updatedMeasurements = [...(testData.Rc_dry_measurements || [])];
    if (field === 'sample_id') {
      updatedMeasurements[index] = { ...updatedMeasurements[index], [field]: value };
    } else {
      const numValue = parseFloat(value) || 0;
      updatedMeasurements[index] = { ...updatedMeasurements[index], [field]: numValue };
    }
    const updatedData = { ...testData, Rc_dry_measurements: updatedMeasurements };
    const results = calculateResults(updatedData);
    onUpdate({ ...test, data: updatedData, results });
  };

  const handleUpdateRcSatMeasurement = (index: number, field: string, value: string) => {
    const updatedMeasurements = [...(testData.Rc_sat_measurements || [])];
    if (field === 'sample_id') {
      updatedMeasurements[index] = { ...updatedMeasurements[index], [field]: value };
    } else {
      const numValue = parseFloat(value) || 0;
      updatedMeasurements[index] = { ...updatedMeasurements[index], [field]: numValue };
    }
    const updatedData = { ...testData, Rc_sat_measurements: updatedMeasurements };
    const results = calculateResults(updatedData);
    onUpdate({ ...test, data: updatedData, results });
  };

  const handleUpdateRQDMeasurement = (index: number, field: string, value: string) => {
    const updatedMeasurements = [...(testData.RQD_measurements || [])];
    const numValue = parseFloat(value) || 0;
    updatedMeasurements[index] = { ...updatedMeasurements[index], [field]: numValue };
    const updatedData = { ...testData, RQD_measurements: updatedMeasurements };
    const results = calculateResults(updatedData);
    onUpdate({ ...test, data: updatedData, results });
  };

  const handleDeleteRcDryMeasurement = (index: number) => {
    const updatedMeasurements = (testData.Rc_dry_measurements || []).filter((_m: any, i: number) => i !== index);
    const updatedData = { ...testData, Rc_dry_measurements: updatedMeasurements };
    const results = calculateResults(updatedData);
    onUpdate({ ...test, data: updatedData, results });
  };

  const handleDeleteRcSatMeasurement = (index: number) => {
    const updatedMeasurements = (testData.Rc_sat_measurements || []).filter((_m: any, i: number) => i !== index);
    const updatedData = { ...testData, Rc_sat_measurements: updatedMeasurements };
    const results = calculateResults(updatedData);
    onUpdate({ ...test, data: updatedData, results });
  };

  const handleDeleteRQDMeasurement = (index: number) => {
    const updatedMeasurements = (testData.RQD_measurements || []).filter((_m: any, i: number) => i !== index);
    const updatedData = { ...testData, RQD_measurements: updatedMeasurements };
    const results = calculateResults(updatedData);
    onUpdate({ ...test, data: updatedData, results });
  };

  const calculateResults = (data: RockTestData): RockTestResults => {
    // Rc вс (среднее)
    let Rc_dry = 0;
    if (data.Rc_dry_measurements && data.Rc_dry_measurements.length > 0) {
      const rcValues = data.Rc_dry_measurements.map((m: any) => m.area_cm2 > 0 ? (m.force_kN * 1000) / m.area_cm2 / 1000 : 0);
      Rc_dry = rcValues.reduce((sum: number, v: number) => sum + v, 0) / rcValues.length;
    }

    // Rc водон (среднее)
    let Rc_sat = 0;
    if (data.Rc_sat_measurements && data.Rc_sat_measurements.length > 0) {
      const rcValues = data.Rc_sat_measurements.map((m: any) => m.area_cm2 > 0 ? (m.force_kN * 1000) / m.area_cm2 / 1000 : 0);
      Rc_sat = rcValues.reduce((sum: number, v: number) => sum + v, 0) / rcValues.length;
    }

    // RQD
    let RQD = 0;
    if (data.RQD_measurements && data.RQD_measurements.length > 0) {
      const totalCoreLength = data.RQD_measurements.reduce((sum: number, m: any) => sum + m.core_length_m, 0);
      const totalIntactLength = data.RQD_measurements.reduce((sum: number, m: any) => sum + m.intact_length_m, 0);
      RQD = totalCoreLength > 0 ? (totalIntactLength / totalCoreLength) * 100 : 0;
    }

    // Коэффициент размягчаемости
    const Ksof = Rc_dry > 0 ? Rc_sat / Rc_dry : 0;

    return {
      Rc_dry: Rc_dry > 0 ? Rc_dry : undefined,
      Rc_sat: Rc_sat > 0 ? Rc_sat : undefined,
      RQD: RQD > 0 ? RQD : undefined,
      Ksof: Ksof > 0 ? Ksof : undefined
    };
  };

  const results = (test.results as RockTestResults) || calculateResults(testData);

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">Скальные показатели</h3>
        <button onClick={onClose} className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300">Закрыть</button>
      </div>
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <div className="flex justify-between items-center mb-2">
            <h4 className="font-medium">Rc вс (сухое):</h4>
            <button onClick={handleAddRcDryMeasurement} className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600">+ Добавить</button>
          </div>
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-100">
                <th className="border p-2">ID</th>
                <th className="border p-2">F, кН</th>
                <th className="border p-2">A, см²</th>
                <th className="border p-2">Действия</th>
              </tr>
            </thead>
            <tbody>
              {(testData.Rc_dry_measurements || []).map((m: any, index: number) => (
                <tr key={index}>
                  <td className="border p-2"><input type="text" value={m.sample_id} onChange={(e) => handleUpdateRcDryMeasurement(index, 'sample_id', e.target.value)} className="w-full px-2 py-1 border rounded" /></td>
                  <td className="border p-2"><input type="number" step="0.01" value={m.force_kN} onChange={(e) => handleUpdateRcDryMeasurement(index, 'force_kN', e.target.value)} className="w-full px-2 py-1 border rounded" /></td>
                  <td className="border p-2"><input type="number" step="0.01" value={m.area_cm2} onChange={(e) => handleUpdateRcDryMeasurement(index, 'area_cm2', e.target.value)} className="w-full px-2 py-1 border rounded" /></td>
                  <td className="border p-2 text-center"><button onClick={() => handleDeleteRcDryMeasurement(index)} className="px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600">Удалить</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div>
          <div className="flex justify-between items-center mb-2">
            <h4 className="font-medium">Rc водон:</h4>
            <button onClick={handleAddRcSatMeasurement} className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600">+ Добавить</button>
          </div>
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-100">
                <th className="border p-2">ID</th>
                <th className="border p-2">F, кН</th>
                <th className="border p-2">A, см²</th>
                <th className="border p-2">Действия</th>
              </tr>
            </thead>
            <tbody>
              {(testData.Rc_sat_measurements || []).map((m: any, index: number) => (
                <tr key={index}>
                  <td className="border p-2"><input type="text" value={m.sample_id} onChange={(e) => handleUpdateRcSatMeasurement(index, 'sample_id', e.target.value)} className="w-full px-2 py-1 border rounded" /></td>
                  <td className="border p-2"><input type="number" step="0.01" value={m.force_kN} onChange={(e) => handleUpdateRcSatMeasurement(index, 'force_kN', e.target.value)} className="w-full px-2 py-1 border rounded" /></td>
                  <td className="border p-2"><input type="number" step="0.01" value={m.area_cm2} onChange={(e) => handleUpdateRcSatMeasurement(index, 'area_cm2', e.target.value)} className="w-full px-2 py-1 border rounded" /></td>
                  <td className="border p-2 text-center"><button onClick={() => handleDeleteRcSatMeasurement(index)} className="px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600">Удалить</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <div className="mb-4">
        <div className="flex justify-between items-center mb-2">
          <h4 className="font-medium">RQD:</h4>
          <button onClick={handleAddRQDMeasurement} className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600">+ Добавить</button>
        </div>
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-100">
              <th className="border p-2">Длина керна, м</th>
              <th className="border p-2">Длина целостных фрагментов, м</th>
              <th className="border p-2">Действия</th>
            </tr>
          </thead>
          <tbody>
            {(testData.RQD_measurements || []).map((m: any, index: number) => (
              <tr key={index}>
                <td className="border p-2"><input type="number" step="0.01" value={m.core_length_m} onChange={(e) => handleUpdateRQDMeasurement(index, 'core_length_m', e.target.value)} className="w-full px-2 py-1 border rounded" /></td>
                <td className="border p-2"><input type="number" step="0.01" value={m.intact_length_m} onChange={(e) => handleUpdateRQDMeasurement(index, 'intact_length_m', e.target.value)} className="w-full px-2 py-1 border rounded" /></td>
                <td className="border p-2 text-center"><button onClick={() => handleDeleteRQDMeasurement(index)} className="px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600">Удалить</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <label className="block text-sm font-medium mb-2">Прочность на растяжение, МПа:</label>
          <input type="number" step="0.01" value={testData.tensile_strength || 0} onChange={(e) => onUpdate({ ...test, data: { ...testData, tensile_strength: parseFloat(e.target.value) || 0 } })} className="px-3 py-2 border rounded w-full" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">Угол естественного откоса, град:</label>
          <input type="number" step="0.1" value={testData.natural_slope_angle || 0} onChange={(e) => onUpdate({ ...test, data: { ...testData, natural_slope_angle: parseFloat(e.target.value) || 0 } })} className="px-3 py-2 border rounded w-full" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">Плотность обломков, г/см³:</label>
          <input type="number" step="0.01" value={testData.core_density || 0} onChange={(e) => onUpdate({ ...test, data: { ...testData, core_density: parseFloat(e.target.value) || 0 } })} className="px-3 py-2 border rounded w-full" />
        </div>
      </div>
      <div className="bg-gray-50 p-4 rounded">
        <h4 className="font-medium mb-2">Результаты:</h4>
        <div className="grid grid-cols-2 gap-4">
          <div><span className="text-sm text-gray-600">Rc вс:</span><div className="font-semibold">{results.Rc_dry?.toFixed(2) || '—'} МПа</div></div>
          <div><span className="text-sm text-gray-600">Rc водон:</span><div className="font-semibold">{results.Rc_sat?.toFixed(2) || '—'} МПа</div></div>
          <div><span className="text-sm text-gray-600">RQD:</span><div className="font-semibold">{results.RQD?.toFixed(1) || '—'} %</div></div>
          <div><span className="text-sm text-gray-600">Ksof:</span><div className="font-semibold">{results.Ksof?.toFixed(3) || '—'}</div></div>
        </div>
      </div>
    </div>
  );
};
