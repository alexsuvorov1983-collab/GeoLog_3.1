// Система проверок в реальном времени
// Этап 7: Статистика по ИГЭ и система проверок

import { Sample, Borehole } from '../core/dataStore';
import { calculateAllValues, CalculatedValues } from './SampleCalculations';

export interface ValidationError {
  type: 'error' | 'warning' | 'info';
  sampleId: string;
  field: string;
  message: string;
  value?: any;
}

export interface ValidationSettings {
  particleSumTolerance: number; // Допуск для суммы фракций, %
  fillerThreshold: number; // Нижний порог для выделения заполнителя, %
  excludeCoarseFromDispersed: boolean; // Исключать фракции >2 мм из разновидности дисперсных
  precision: Record<string, number>; // Точность для каждой колонки
}

const defaultSettings: ValidationSettings = {
  particleSumTolerance: 1,
  fillerThreshold: 30,
  excludeCoarseFromDispersed: false,
  precision: {
    default: 2,
    percentage: 1,
    angle: 1,
    pressure: 2
  }
};

// Проверка суммы фракций
function validateParticleSum(sample: Sample, calculated: CalculatedValues, settings: ValidationSettings): ValidationError[] {
  const errors: ValidationError[] = [];
  
  if (calculated.particleSum !== undefined) {
    const diff = Math.abs(calculated.particleSum - 100);
    if (diff > settings.particleSumTolerance) {
      errors.push({
        type: 'error',
        sampleId: sample.id,
        field: 'particle_sum',
        message: `Сумма фракций ${calculated.particleSum.toFixed(1)}% отличается от 100% на ${diff.toFixed(1)}%`,
        value: calculated.particleSum
      });
    }
  }
  
  return errors;
}

// Проверка дублирования номеров
function validateDuplicateNumbers(samples: Sample[]): ValidationError[] {
  const errors: ValidationError[] = [];
  const fieldNumbers = new Map<string, Sample[]>();
  const labNumbers = new Map<string, Sample[]>();
  
  samples.forEach(sample => {
    if (sample.field_number) {
      if (!fieldNumbers.has(sample.field_number)) {
        fieldNumbers.set(sample.field_number, []);
      }
      fieldNumbers.get(sample.field_number)!.push(sample);
    }
    
    if (sample.lab_number) {
      if (!labNumbers.has(sample.lab_number)) {
        labNumbers.set(sample.lab_number, []);
      }
      labNumbers.get(sample.lab_number)!.push(sample);
    }
  });
  
  // Проверка дублирования полевых номеров
  fieldNumbers.forEach((samplesWithNumber, number) => {
    if (samplesWithNumber.length > 1) {
      samplesWithNumber.forEach(sample => {
        errors.push({
          type: 'warning',
          sampleId: sample.id,
          field: 'field_number',
          message: `Дублирование полевого номера "${number}" (${samplesWithNumber.length} проб)`,
          value: number
        });
      });
    }
  });
  
  // Проверка дублирования лабораторных номеров
  labNumbers.forEach((samplesWithNumber, number) => {
    if (samplesWithNumber.length > 1) {
      samplesWithNumber.forEach(sample => {
        errors.push({
          type: 'warning',
          sampleId: sample.id,
          field: 'lab_number',
          message: `Дублирование лабораторного номера "${number}" (${samplesWithNumber.length} проб)`,
          value: number
        });
      });
    }
  });
  
  return errors;
}

// Проверка диапазонов значений
function validateRanges(sample: Sample): ValidationError[] {
  const errors: ValidationError[] = [];
  
  // Проверка влажности
  if (sample.W !== undefined && (sample.W < 0 || sample.W > 100)) {
    errors.push({
      type: 'error',
      sampleId: sample.id,
      field: 'W',
      message: `Влажность W=${sample.W.toFixed(1)}% вне допустимого диапазона (0-100%)`,
      value: sample.W
    });
  }
  
  // Проверка плотностей
  if (sample.rho !== undefined && (sample.rho < 1.0 || sample.rho > 3.0)) {
    errors.push({
      type: 'error',
      sampleId: sample.id,
      field: 'rho',
      message: `Плотность ρ=${sample.rho.toFixed(2)} г/см³ вне допустимого диапазона (1.0-3.0)`,
      value: sample.rho
    });
  }
  
  if (sample.rhos !== undefined && (sample.rhos < 2.0 || sample.rhos > 3.0)) {
    errors.push({
      type: 'error',
      sampleId: sample.id,
      field: 'rhos',
      message: `Плотность частиц ρs=${sample.rhos.toFixed(2)} г/см³ вне допустимого диапазона (2.0-3.0)`,
      value: sample.rhos
    });
  }
  
  // Проверка угла внутреннего трения
  if (sample.phi !== undefined && (sample.phi < 0 || sample.phi > 90)) {
    errors.push({
      type: 'error',
      sampleId: sample.id,
      field: 'phi',
      message: `Угол внутреннего трения φ=${sample.phi.toFixed(1)}° вне допустимого диапазона (0-90°)`,
      value: sample.phi
    });
  }
  
  return errors;
}

// Проверка расчётных показателей
function validateCalculated(sample: Sample, calculated: CalculatedValues): ValidationError[] {
  const errors: ValidationError[] = [];
  
  // Проверка Ip
  if (calculated.Ip !== undefined && calculated.Ip < 0) {
    errors.push({
      type: 'error',
      sampleId: sample.id,
      field: 'Ip',
      message: `Число пластичности Ip=${calculated.Ip.toFixed(1)} отрицательное`,
      value: calculated.Ip
    });
  }
  
  // Проверка IL
  if (calculated.IL !== undefined && (calculated.IL < -0.5 || calculated.IL > 2.0)) {
    errors.push({
      type: 'warning',
      sampleId: sample.id,
      field: 'IL',
      message: `Показатель текучести IL=${calculated.IL.toFixed(2)} вне обычного диапазона`,
      value: calculated.IL
    });
  }
  
  // Проверка Sr
  if (calculated.Sr !== undefined && (calculated.Sr < 0 || calculated.Sr > 1.5)) {
    errors.push({
      type: 'warning',
      sampleId: sample.id,
      field: 'Sr',
      message: `Коэффициент водонасыщения Sr=${calculated.Sr.toFixed(2)} вне допустимого диапазона`,
      value: calculated.Sr
    });
  }
  
  return errors;
}

// Проверка наличия ИГЭ
function validateIgeCode(sample: Sample): ValidationError[] {
  const errors: ValidationError[] = [];
  
  if (!sample.ige_code || sample.ige_code.trim() === '') {
    errors.push({
      type: 'info',
      sampleId: sample.id,
      field: 'ige_code',
      message: 'Проба не привязана к ИГЭ',
      value: sample.ige_code
    });
  }
  
  return errors;
}

// Главная функция валидации
export function validateAllSamples(boreholes: Borehole[], settings: ValidationSettings = defaultSettings): ValidationError[] {
  const allErrors: ValidationError[] = [];
  const allSamples: Sample[] = [];
  
  // Сбор всех проб
  boreholes.forEach(borehole => {
    (borehole.samples || []).forEach(sample => {
      if (sample.sample_type !== 'water') {
        allSamples.push(sample);
      }
    });
  });
  
  // Проверка дублирования номеров
  allErrors.push(...validateDuplicateNumbers(allSamples));
  
  // Проверка каждой пробы
  allSamples.forEach(sample => {
    const calculated = calculateAllValues(sample);
    
    allErrors.push(...validateParticleSum(sample, calculated, settings));
    allErrors.push(...validateRanges(sample));
    allErrors.push(...validateCalculated(sample, calculated));
    allErrors.push(...validateIgeCode(sample));
  });
  
  return allErrors;
}

// Функция получения настроек по умолчанию
export function getDefaultValidationSettings(): ValidationSettings {
  return { ...defaultSettings };
}
