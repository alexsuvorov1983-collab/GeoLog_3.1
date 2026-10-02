import React from 'react';
import { SoilTest, FrozenTestData, FrozenTestResults } from '../../core/dataStore';

interface FrozenTestProps {
  test: SoilTest;
  onUpdate: (updatedTest: SoilTest) => void;
  onClose: () => void;
}

export const FrozenTest: React.FC<FrozenTestProps> = ({ test, onUpdate, onClose }) => {
  const testData = (test.data as FrozenTestData) || {
    Tbf: 0,
    itot: 0,
    ii: 0,
    ice_cement: 0,
    unfrozen_water: 0,
    thermal_measurements: {
      thermal_conductivity_frozen: 0,
      thermal_conductivity_thawed: 0,
      thermal_diffusivity_frozen: 0,
      thermal_diffusivity_thawed: 0,
      heat_capacity_frozen: 0,
      heat_capacity_thawed: 0
    },
    shear_strength_concrete: 0,
    shear_strength_steel: 0
  };

  const handleUpdateField = (field: keyof FrozenTestData, value: string) => {
    const numValue = parseFloat(value) || 0;
    const updatedData = { ...testData, [field]: numValue };
    const results = calculateResults(updatedData);
    onUpdate({ ...test, data: updatedData, results });
  };

  const handleUpdateThermalField = (field: string, value: string) => {
    const numValue = parseFloat(value) || 0;
    const thermalMeasurements = { ...testData.thermal_measurements, [field]: numValue };
    const updatedData = { ...testData, thermal_measurements: thermalMeasurements };
    const results = calculateResults(updatedData);
    onUpdate({ ...test, data: updatedData, results });
  };

  const calculateResults = (data: FrozenTestData): FrozenTestResults => {
    // Степень заполнения пор льдом и незамёрзшей водой
    const totalIce = (data.itot || 0) + (data.ii || 0) + (data.ice_cement || 0);
    const Sr_prime = totalIce > 0 ? totalIce / (totalIce + (data.unfrozen_water || 0)) : 0;

    // Относительная осадка мёрзлого грунта (упрощённо)
    const relative_settlement = data.itot ? data.itot * 0.05 : 0;

    // Сжимаемость при оттаивании (упрощённо)
    const compressibility_thaw = data.itot ? data.itot * 0.1 : 0;

    // Коэффициент оттаивания (упрощённо)
    const thaw_coefficient = data.thermal_measurements?.thermal_conductivity_frozen 
      ? data.thermal_measurements.thermal_conductivity_frozen / 100 
      : 0;

    // Модуль деформации при 0.2 МПа (упрощённо)
    const Ef_02 = data.thermal_measurements?.thermal_conductivity_frozen 
      ? data.thermal_measurements.thermal_conductivity_frozen * 10 
      : 0;

    return {
      Sr_prime: Sr_prime > 0 ? Sr_prime : undefined,
      relative_settlement: relative_settlement > 0 ? relative_settlement : undefined,
      compressibility_thaw: compressibility_thaw > 0 ? compressibility_thaw : undefined,
      thaw_coefficient: thaw_coefficient > 0 ? thaw_coefficient : undefined,
      Ef_02: Ef_02 > 0 ? Ef_02 : undefined
    };
  };

  const results = (test.results as FrozenTestResults) || calculateResults(testData);

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">Мёрзлые показатели</h3>
        <button onClick={onClose} className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300">Закрыть</button>
      </div>
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <label className="block text-sm font-medium mb-2">Температура начала замерзания, °C:</label>
          <input type="number" step="0.1" value={testData.Tbf || 0} onChange={(e) => handleUpdateField('Tbf', e.target.value)} className="px-3 py-2 border rounded w-full" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">Общая льдистость:</label>
          <input type="number" step="0.01" value={testData.itot || 0} onChange={(e) => handleUpdateField('itot', e.target.value)} className="px-3 py-2 border rounded w-full" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">Льдистость включений:</label>
          <input type="number" step="0.01" value={testData.ii || 0} onChange={(e) => handleUpdateField('ii', e.target.value)} className="px-3 py-2 border rounded w-full" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">Льдистость льда-цемента:</label>
          <input type="number" step="0.01" value={testData.ice_cement || 0} onChange={(e) => handleUpdateField('ice_cement', e.target.value)} className="px-3 py-2 border rounded w-full" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">Незамерзшая вода, %:</label>
          <input type="number" step="0.1" value={testData.unfrozen_water || 0} onChange={(e) => handleUpdateField('unfrozen_water', e.target.value)} className="px-3 py-2 border rounded w-full" />
        </div>
      </div>
      <div className="mb-4">
        <h4 className="font-medium mb-2">Теплофизические характеристики:</h4>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Теплопроводность мёрзлого, Вт/(м·°C):</label>
            <input type="number" step="0.01" value={testData.thermal_measurements?.thermal_conductivity_frozen || 0} onChange={(e) => handleUpdateThermalField('thermal_conductivity_frozen', e.target.value)} className="px-3 py-2 border rounded w-full" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Теплопроводность талого, Вт/(м·°C):</label>
            <input type="number" step="0.01" value={testData.thermal_measurements?.thermal_conductivity_thawed || 0} onChange={(e) => handleUpdateThermalField('thermal_conductivity_thawed', e.target.value)} className="px-3 py-2 border rounded w-full" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Температуропроводность мёрзлого, м²/сут:</label>
            <input type="number" step="0.01" value={testData.thermal_measurements?.thermal_diffusivity_frozen || 0} onChange={(e) => handleUpdateThermalField('thermal_diffusivity_frozen', e.target.value)} className="px-3 py-2 border rounded w-full" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Температуропроводность талого, м²/сут:</label>
            <input type="number" step="0.01" value={testData.thermal_measurements?.thermal_diffusivity_thawed || 0} onChange={(e) => handleUpdateThermalField('thermal_diffusivity_thawed', e.target.value)} className="px-3 py-2 border rounded w-full" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Теплоемкость мёрзлого, кДж/(м³·°C):</label>
            <input type="number" step="0.1" value={testData.thermal_measurements?.heat_capacity_frozen || 0} onChange={(e) => handleUpdateThermalField('heat_capacity_frozen', e.target.value)} className="px-3 py-2 border rounded w-full" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Теплоемкость талого, кДж/(м³·°C):</label>
            <input type="number" step="0.1" value={testData.thermal_measurements?.heat_capacity_thawed || 0} onChange={(e) => handleUpdateThermalField('heat_capacity_thawed', e.target.value)} className="px-3 py-2 border rounded w-full" />
          </div>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <label className="block text-sm font-medium mb-2">Сопротивление срезу по бетону, кПа:</label>
          <input type="number" step="0.1" value={testData.shear_strength_concrete || 0} onChange={(e) => handleUpdateField('shear_strength_concrete', e.target.value)} className="px-3 py-2 border rounded w-full" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">Сопротивление срезу по стали, кПа:</label>
          <input type="number" step="0.1" value={testData.shear_strength_steel || 0} onChange={(e) => handleUpdateField('shear_strength_steel', e.target.value)} className="px-3 py-2 border rounded w-full" />
        </div>
      </div>
      <div className="bg-gray-50 p-4 rounded">
        <h4 className="font-medium mb-2">Результаты:</h4>
        <div className="grid grid-cols-2 gap-4">
          <div><span className="text-sm text-gray-600">Степень заполнения пор Sr':</span><div className="font-semibold">{results.Sr_prime?.toFixed(3) || '—'}</div></div>
          <div><span className="text-sm text-gray-600">Относительная осадка:</span><div className="font-semibold">{results.relative_settlement?.toFixed(3) || '—'}</div></div>
          <div><span className="text-sm text-gray-600">Сжимаемость при оттаивании:</span><div className="font-semibold">{results.compressibility_thaw?.toFixed(3) || '—'}</div></div>
          <div><span className="text-sm text-gray-600">Коэффициент оттаивания:</span><div className="font-semibold">{results.thaw_coefficient?.toFixed(3) || '—'}</div></div>
          <div><span className="text-sm text-gray-600">Модуль деформации Ef при 0.2 МПа:</span><div className="font-semibold">{results.Ef_02?.toFixed(2) || '—'} МПа</div></div>
        </div>
      </div>
    </div>
  );
};
